import { IdSchema, InstantSchema, LocalProgressCommandSchema, LocalProgressDocumentSchema,
  type LocalProgressDocument, type LocalProgressItem } from "@skilved/types/opportunities"

// Separate from theme, source facts and future private suggestion receipts.
export const LOCAL_PROGRESS_DATABASE = "skilved-local-progress"
const storeName = "progress", key = "current", maxBytes = 100_000
export type LocalProgressSnapshot = { token: string | null; items: LocalProgressItem[] }
export type LocalProgressResult =
  | { status: "ready" | "saved"; snapshot: LocalProgressSnapshot }
  | { status: "unreadable"; reason: "invalid_data" | "unsupported_version" }
  | { status: "unavailable" | "conflict" | "invalid" | "full" | "not_saved" }
type Change = { result: LocalProgressResult; write?: string }

function decode(raw: unknown): LocalProgressResult {
  if (raw === undefined) return { status: "ready", snapshot: { token: null, items: [] } }
  if (typeof raw !== "string" || raw.length > maxBytes || new TextEncoder().encode(raw).length > maxBytes)
    return { status: "unreadable", reason: "invalid_data" }
  try {
    const value = JSON.parse(raw)
    if (value && typeof value === "object" && "schemaVersion" in value && value.schemaVersion !== 1)
      return { status: "unreadable", reason: "unsupported_version" }
    const doc = LocalProgressDocumentSchema.parse(value)
    return { status: "ready", snapshot: { token: doc.writeToken, items: doc.items } }
  } catch { return { status: "unreadable", reason: "invalid_data" } }
}

/** No automatic replay/write-back. Call mutations only for an explicit user action. */
export function createLocalProgressStore(options: { indexedDB?: IDBFactory; now?: () => string; newToken?: () => string } = {}) {
  const now = options.now ?? (() => new Date().toISOString())
  const newToken = options.newToken ?? (() => globalThis.crypto.randomUUID())

  function transact(mode: IDBTransactionMode, change: (raw: unknown) => Change): Promise<LocalProgressResult> {
    return new Promise(resolve => {
      let settled = false, db: IDBDatabase | undefined, tx: IDBTransaction | undefined
      const finish = (result: LocalProgressResult) => {
        if (settled) return
        settled = true; clearTimeout(timer); db?.close(); resolve(result)
      }
      const timer = setTimeout(() => {
        try { tx?.abort() } catch { /* Already completed. */ }
        finish({ status: "unavailable" })
      }, 5000)
      try {
        const factory = options.indexedDB ?? globalThis.indexedDB
        if (!factory) { finish({ status: "unavailable" }); return }
        const request = factory.open(LOCAL_PROGRESS_DATABASE, 1)
        request.onerror = () => finish({ status: "unavailable" })
        request.onblocked = () => finish({ status: "unavailable" })
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName)
        }
        request.onsuccess = () => {
          db = request.result
          if (settled) { db.close(); return }
          db.onversionchange = () => db?.close()
          try {
            tx = db.transaction(storeName, mode)
            let outcome: LocalProgressResult = { status: "unavailable" }
            tx.onabort = () => finish({ status: "unavailable" })
            tx.onerror = () => finish({ status: "unavailable" })
            // A successful put request is insufficient: the whole transaction must commit.
            tx.oncomplete = () => finish(outcome)
            const objectStore = tx.objectStore(storeName), read = objectStore.get(key)
            read.onsuccess = () => {
              try {
                const next = change(read.result)
                outcome = next.result
                if (next.write !== undefined) objectStore.put(next.write, key)
              } catch { try { tx?.abort() } catch { finish({ status: "unavailable" }) } }
            }
          } catch { finish({ status: "unavailable" }) }
        }
      } catch { finish({ status: "unavailable" }) }
    })
  }

  function persist(items: LocalProgressItem[], previousToken: string | null): Change {
    const token = IdSchema.parse(newToken())
    if (token === previousToken) throw Error("TOKEN_COLLISION")
    const doc: LocalProgressDocument = LocalProgressDocumentSchema.parse({ schemaVersion: 1, writeToken: token, items })
    const write = JSON.stringify(doc)
    if (new TextEncoder().encode(write).length > maxBytes) return { result: { status: "full" } }
    return { result: { status: "saved", snapshot: { token, items: doc.items } }, write }
  }

  return {
    read: () => transact("readonly", raw => ({ result: decode(raw) })),
    // Explicit clear also recovers a corrupt/unsupported document. It never clears the origin.
    clear: () => transact("readwrite", raw => {
      const current = decode(raw)
      return persist([], "snapshot" in current ? current.snapshot.token : null)
    }),
    change: (expectedToken: string | null, input: unknown): Promise<LocalProgressResult> => {
      const parsed = LocalProgressCommandSchema.safeParse(input)
      if (!parsed.success || (expectedToken !== null && !IdSchema.safeParse(expectedToken).success))
        return Promise.resolve({ status: "invalid" })
      return transact("readwrite", raw => {
        const current = decode(raw)
        if (current.status !== "ready") return { result: current }
        if (current.snapshot.token !== expectedToken) return { result: { status: "conflict" } }
        const command = parsed.data, items = current.snapshot.items
        const index = items.findIndex(item => item.opportunityId === command.id)
        const existing = items[index]
        if (command.type === "save" && existing) return { result: current }
        if (command.type !== "save" && !existing) return { result: { status: "not_saved" } }
        const original = command.type === "match_stage" ? items.find(item => item.opportunityId === command.fromId) : null
        if (command.type === "match_stage") {
          if (command.id === command.fromId) return { result: { status: "invalid" } }
          if (!original) return { result: { status: "not_saved" } }
          if (original.userStage === existing.userStage) return { result: current }
        }
        if (command.type === "remove") return persist(items.filter(item => item.opportunityId !== command.id), expectedToken)
        const time = now()
        if (!InstantSchema.safeParse(time).success || (existing && time < existing.updatedAt)) return { result: { status: "invalid" } }
        if (command.type === "save") {
          if (items.length >= 100) return { result: { status: "full" } }
          return persist([...items, { opportunityId: command.id, lastViewedRevision: command.revision, savedAt: time, updatedAt: time,
            userStage: "interested", lastRouteOpenedAt: null, reportedAppliedAt: null }], expectedToken)
        }
        const updated = { ...existing, updatedAt: time }
        if (command.type === "stage" || command.type === "match_stage") {
          const stage = command.type === "stage" ? command.stage : original!.userStage
          updated.userStage = stage
          if (stage === "applied_reported" && existing.userStage !== "applied_reported") updated.reportedAppliedAt = time
        } else if (command.type === "route_opened") updated.lastRouteOpenedAt = time
        else if (command.type === "acknowledge_revision") updated.lastViewedRevision = command.revision
        items[index] = updated
        return persist(items, expectedToken)
      })
    },
  }
}
