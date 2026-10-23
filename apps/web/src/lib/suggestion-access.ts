import { IdSchema, InstantSchema } from "@skilved/types/opportunities"
import { SuggestionAccessSchema, SuggestionUrlSchema, SuggestionTicketResponseSchema, type SuggestionAccess } from "@skilved/types/opportunities/suggestions"

export const SUGGESTION_ACCESS_DATABASE = "skilved-suggestion-access"
export const MAX_LOCAL_SUGGESTIONS = 25
const storeName = "access", key = "current", maxBytes = 100_000
export type SuggestionEntry =
  | { kind: "draft"; id: string; url: string; createdAt: string }
  | { kind: "pending"; id: string; url: string; createdAt: string; ticket: string; expiresAt: string; sentAt: string | null }
  | { kind: "receipt"; id: string; access: SuggestionAccess; savedAt: string }
export type SuggestionSnapshot = { token: string | null; items: SuggestionEntry[] }
export type SuggestionLocalResult = { status: "ready" | "saved"; snapshot: SuggestionSnapshot }
  | { status: "unreadable"; reason: "invalid_data" | "unsupported_version" }
  | { status: "unavailable" | "invalid" | "conflict" | "full" | "missing" | "expired" }
type Change = { result: SuggestionLocalResult; write?: string }
const object = (v: unknown): Record<string, unknown> | null => v !== null && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : null
const keys = (v: Record<string, unknown>, names: string[]) => Object.keys(v).length === names.length && names.every(name => Object.hasOwn(v, name))
const instant = (v: unknown): v is string => InstantSchema.safeParse(v).success

function entry(value: unknown): SuggestionEntry | null {
  const r = object(value)
  if (!r || !IdSchema.safeParse(r.id).success) return null
  if (r.kind === "receipt" && keys(r, ["kind", "id", "access", "savedAt"])) {
    const access = SuggestionAccessSchema.safeParse(r.access)
    return access.success && instant(r.savedAt) && r.savedAt < access.data.expiresAt
      ? { kind: "receipt", id: r.id as string, access: access.data, savedAt: r.savedAt } : null
  }
  const url = SuggestionUrlSchema.safeParse(r.url)
  if (!url.success || url.data !== r.url || !instant(r.createdAt)) return null
  if (r.kind === "draft" && keys(r, ["kind", "id", "url", "createdAt"]))
    return { kind: "draft", id: r.id as string, url: url.data, createdAt: r.createdAt }
  if (r.kind !== "pending" || !keys(r, ["kind", "id", "url", "createdAt", "ticket", "expiresAt", "sentAt"])) return null
  const ticket = SuggestionTicketResponseSchema.safeParse({ ticket: r.ticket, expiresAt: r.expiresAt })
  if (!ticket.success || r.createdAt >= ticket.data.expiresAt ||
    !(r.sentAt === null || (instant(r.sentAt) && r.sentAt >= r.createdAt && r.sentAt < ticket.data.expiresAt))) return null
  return { kind: "pending", id: r.id as string, url: url.data, createdAt: r.createdAt, ...ticket.data, sentAt: r.sentAt as string | null }
}
function decode(raw: unknown): SuggestionLocalResult {
  if (raw === undefined) return { status: "ready", snapshot: { token: null, items: [] } }
  if (typeof raw !== "string" || raw.length > maxBytes || new TextEncoder().encode(raw).length > maxBytes) return { status: "unreadable", reason: "invalid_data" }
  try {
    const doc = object(JSON.parse(raw))
    if (doc && doc.schemaVersion !== 1) return { status: "unreadable", reason: "unsupported_version" }
    if (!doc || !keys(doc, ["schemaVersion", "writeToken", "items"]) || !IdSchema.safeParse(doc.writeToken).success ||
      !Array.isArray(doc.items) || doc.items.length > MAX_LOCAL_SUGGESTIONS) throw Error()
    const items = doc.items.map(entry)
    if (items.some(v => v === null) || new Set(items.map(v => v!.id)).size !== items.length) throw Error()
    const receipts = items.filter(v => v!.kind === "receipt").map(v => (v as Extract<SuggestionEntry, { kind: "receipt" }>).access.receiptId)
    const tickets = items.filter(v => v!.kind === "pending").map(v => (v as Extract<SuggestionEntry, { kind: "pending" }>).ticket)
    if (new Set(receipts).size !== receipts.length || new Set(tickets).size !== tickets.length) throw Error()
    return { status: "ready", snapshot: { token: doc.writeToken as string, items: items as SuggestionEntry[] } }
  } catch { return { status: "unreadable", reason: "invalid_data" } }
}

/** Private browser ledger only. No automatic reads, retries, expiration purge or server withdrawal. */
export function createSuggestionAccessStore(options: { indexedDB?: IDBFactory; now?: () => string; newToken?: () => string } = {}) {
  const now = options.now ?? (() => new Date().toISOString()), newToken = options.newToken ?? (() => globalThis.crypto.randomUUID())
  function transact(mode: IDBTransactionMode, change: (raw: unknown) => Change): Promise<SuggestionLocalResult> {
    return new Promise(resolve => {
      let settled = false, db: IDBDatabase | undefined, tx: IDBTransaction | undefined
      const finish = (result: SuggestionLocalResult) => { if (!settled) { settled = true; clearTimeout(timer); db?.close(); resolve(result) } }
      const timer = setTimeout(() => { try { tx?.abort() } catch { /* Completed. */ } finish({ status: "unavailable" }) }, 5000)
      try {
        const factory = options.indexedDB ?? globalThis.indexedDB
        if (!factory) { finish({ status: "unavailable" }); return }
        const request = factory.open(SUGGESTION_ACCESS_DATABASE, 1)
        request.onerror = request.onblocked = () => finish({ status: "unavailable" })
        request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName) }
        request.onsuccess = () => {
          db = request.result
          if (settled) { db.close(); return }
          db.onversionchange = () => db?.close()
          try {
            tx = db.transaction(storeName, mode)
            let outcome: SuggestionLocalResult = { status: "unavailable" }
            tx.onabort = tx.onerror = () => finish({ status: "unavailable" })
            tx.oncomplete = () => finish(outcome)
            const store = tx.objectStore(storeName), read = store.get(key)
            read.onsuccess = () => {
              try { const next = change(read.result); outcome = next.result; if (next.write !== undefined) store.put(next.write, key) }
              catch { try { tx?.abort() } catch { finish({ status: "unavailable" }) } }
            }
          } catch { finish({ status: "unavailable" }) }
        }
      } catch { finish({ status: "unavailable" }) }
    })
  }
  function persist(items: SuggestionEntry[], previous: string | null): Change {
    const token = IdSchema.parse(newToken())
    if (token === previous) throw Error()
    const write = JSON.stringify({ schemaVersion: 1, writeToken: token, items })
    if (new TextEncoder().encode(write).length > maxBytes) return { result: { status: "full" } }
    const valid = decode(write)
    if (valid.status !== "ready") return { result: { status: "invalid" } }
    return { result: { status: "saved", snapshot: valid.snapshot }, write }
  }
  return {
    read: () => transact("readonly", raw => ({ result: decode(raw) })),
    clear: () => transact("readwrite", raw => { const old = decode(raw); return persist([], "snapshot" in old ? old.snapshot.token : null) }),
    change: (expected: string | null, input: unknown): Promise<SuggestionLocalResult> => {
      const c = object(input)
      if (!c || (expected !== null && !IdSchema.safeParse(expected).success) || !IdSchema.safeParse(c.id).success)
        return Promise.resolve({ status: "invalid" })
      return transact("readwrite", raw => {
        const current = decode(raw)
        if (current.status !== "ready") return { result: current }
        if (current.snapshot.token !== expected) return { result: { status: "conflict" } }
        const items = current.snapshot.items, index = items.findIndex(v => v.id === c.id), old = items[index]
        if (c.type === "forget" && keys(c, ["type", "id"]))
          return old ? persist(items.filter(v => v.id !== c.id), expected) : { result: { status: "missing" } }
        const time = now()
        if (!instant(time) || (old && time < (old.kind === "receipt" ? old.savedAt : old.createdAt))) return { result: { status: "invalid" } }
        if (c.type === "prepare" && keys(c, ["type", "id", "url"])) {
          const url = SuggestionUrlSchema.safeParse(c.url)
          if (!url.success || old) return { result: { status: "invalid" } }
          if (items.length >= MAX_LOCAL_SUGGESTIONS) return { result: { status: "full" } }
          return persist([...items, { kind: "draft", id: c.id as string, url: url.data, createdAt: time }], expected)
        }
        if (!old) return { result: { status: "missing" } }
        if (c.type === "ticket" && keys(c, ["type", "id", "ticket", "expiresAt"]) && old.kind === "draft") {
          const ticket = SuggestionTicketResponseSchema.safeParse({ ticket: c.ticket, expiresAt: c.expiresAt })
          if (!ticket.success) return { result: { status: "invalid" } }
          if (ticket.data.expiresAt <= time) return { result: { status: "expired" } }
          items[index] = { ...old, kind: "pending", ...ticket.data, sentAt: null }
        } else if (c.type === "sent" && keys(c, ["type", "id"]) && old.kind === "pending") {
          if (old.expiresAt <= time) return { result: { status: "expired" } }
          if (old.sentAt !== null && time < old.sentAt) return { result: { status: "invalid" } }
          items[index] = { ...old, sentAt: old.sentAt ?? time }
        } else if (c.type === "received" && keys(c, ["type", "id", "access"]) && old.kind === "pending" && old.sentAt !== null) {
          const access = SuggestionAccessSchema.safeParse(c.access)
          if (!access.success || access.data.expiresAt > old.expiresAt || time < old.sentAt) return { result: { status: "invalid" } }
          if (access.data.expiresAt <= time) return { result: { status: "expired" } }
          items[index] = { kind: "receipt", id: old.id, access: access.data, savedAt: time }
        } else return { result: { status: "invalid" } }
        return persist(items, expected)
      })
    },
  }
}
