import { SuggestionAccessSchema, SuggestionRequestSchema, SuggestionReplayTicketSchema, SuggestionTicketResponseSchema,
  SuggestionCreateResponseSchema, SuggestionStatusResponseSchema, SuggestionWithdrawResponseSchema } from "@skilved/types/opportunities/suggestions"
import { createSuggestionAccessStore, type SuggestionLocalResult, type SuggestionEntry } from "./suggestion-access"

type Failure = { kind: "invalid" | "not_found" | "limited" | "unavailable" }
type Wire<T> = { kind: "ok"; value: T } | Failure
type Schema<T> = { safeParse(input: unknown): { success: true; data: T } | { success: false } }
const root = "/api/v1/opportunity-suggestions", maxBytes = 8192

/** Explicit same-origin calls only; no automatic retries, logging or browser credential transport. */
export function createSuggestionTransport(options: { fetch?: typeof fetch; timeoutMs?: number; now?: () => string } = {}) {
  const fetcher = options.fetch ?? ((...args: Parameters<typeof fetch>) => globalThis.fetch(...args))
  const now = options.now ?? (() => new Date().toISOString())
  const timeoutMs = options.timeoutMs ?? 8000
  async function request<T>(path: string, method: string, headers: Record<string, string>, body: string | undefined, schema: Schema<T>, signal?: AbortSignal): Promise<Wire<T>> {
    if (signal?.aborted || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10000) return { kind: "unavailable" }
    const controller = new AbortController(), abort = () => controller.abort()
    signal?.addEventListener("abort", abort, { once: true })
    const stopped = new Promise<Failure>(resolve => controller.signal.addEventListener("abort", () => resolve({ kind: "unavailable" }), { once: true }))
    const timer = setTimeout(abort, timeoutMs)
    const operation = async (): Promise<Wire<T>> => {
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
      try {
        const response = await fetcher(path, { method, headers, body, signal: controller.signal,
          credentials: "omit", mode: "same-origin", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer" })
        if (controller.signal.aborted || response.redirected || response.type === "opaqueredirect") return { kind: "unavailable" }
        if (!response.ok) return { kind: response.status === 404 ? "not_found" : response.status === 429 ? "limited" : response.status === 400 ? "invalid" : "unavailable" }
        if (!/^application\/json(?:;|$)/i.test(response.headers.get("content-type") ?? "") || !response.body ||
          Number(response.headers.get("content-length") ?? 0) > maxBytes) return { kind: "unavailable" }
        reader = response.body.getReader()
        controller.signal.addEventListener("abort", () => { void reader?.cancel().catch(() => {}) }, { once: true })
        const chunks: Uint8Array[] = []; let bytes = 0
        while (true) {
          const part = await reader.read()
          if (controller.signal.aborted) return { kind: "unavailable" }
          if (part.done) break
          bytes += part.value.byteLength
          if (bytes > maxBytes) return { kind: "unavailable" }
          chunks.push(part.value)
        }
        const data = new Uint8Array(bytes); let offset = 0
        for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength }
        const parsed = schema.safeParse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(data)))
        return parsed.success ? { kind: "ok", value: parsed.data } : { kind: "unavailable" }
      } catch { return { kind: "unavailable" } }
      finally { void reader?.cancel().catch(() => {}); try { reader?.releaseLock() } catch { /* Cancellation may still be settling. */ } }
    }
    try { return await Promise.race([operation(), stopped]) }
    finally { controller.abort(); clearTimeout(timer); signal?.removeEventListener("abort", abort) }
  }
  return {
    ticket: async (input: unknown, signal?: AbortSignal) => {
      const parsed = SuggestionRequestSchema.safeParse(input)
      if (!parsed.success) return { kind: "invalid" } as Failure
      const result = await request(root + "/tickets", "POST", { "Content-Type": "application/json" }, JSON.stringify(parsed.data), SuggestionTicketResponseSchema, signal)
      return result.kind === "ok" && result.value.expiresAt <= now() ? { kind: "unavailable" } as Failure : result
    },
    create: async (input: { url: string; ticket: string }, signal?: AbortSignal) => {
      const parsed = SuggestionRequestSchema.safeParse({ url: input?.url })
      if (!parsed.success || !SuggestionReplayTicketSchema.safeParse(input?.ticket).success) return { kind: "invalid" } as Failure
      return request(root, "POST", { "Content-Type": "application/json", "Idempotency-Key": input.ticket }, JSON.stringify(parsed.data), SuggestionCreateResponseSchema, signal)
    },
    status: async (input: unknown, signal?: AbortSignal) => {
      const access = SuggestionAccessSchema.safeParse(input)
      if (!access.success) return { kind: "invalid" } as Failure
      const result = await request(root + "/" + access.data.receiptId + "/status", "GET", { Authorization: "Bearer " + access.data.capability }, undefined, SuggestionStatusResponseSchema, signal)
      return result.kind === "ok" && (result.value.receiptId !== access.data.receiptId || result.value.expiresAt !== access.data.expiresAt)
        ? { kind: "unavailable" } as Failure : result
    },
    withdraw: async (input: unknown, signal?: AbortSignal) => {
      const access = SuggestionAccessSchema.safeParse(input)
      if (!access.success) return { kind: "invalid" } as Failure
      const result = await request(root + "/" + access.data.receiptId, "DELETE", { Authorization: "Bearer " + access.data.capability }, undefined, SuggestionWithdrawResponseSchema, signal)
      return result.kind === "ok" && result.value.receiptId !== access.data.receiptId ? { kind: "unavailable" } as Failure : result
    },
  }
}

type LocalFailure = { kind: "local"; status: SuggestionLocalResult["status"] }
const local = (result: SuggestionLocalResult): LocalFailure => ({ kind: "local", status: result.status })
export type SuggestionSubmitResult = Failure | LocalFailure | { kind: "saved"; id: string }
  | { kind: "approved"; publicResultIds: string[] } | { kind: "previous_result_unavailable" }

/** Every call is an explicit user action. No access is returned in displayable results. */
export function createSuggestionClient(store = createSuggestionAccessStore(), transport = createSuggestionTransport(), newId = () => globalThis.crypto.randomUUID()) {
  async function observe(expected: string | null, id: string) {
    const result = await store.read()
    if (result.status !== "ready") return { failure: local(result) }
    if (result.snapshot.token !== expected) return { failure: local({ status: "conflict" }) }
    const item = result.snapshot.items.find(v => v.id === id)
    return item ? { item, token: result.snapshot.token } : { failure: local({ status: "missing" }) }
  }
  const client = {
    submit: async (expected: string | null, input: unknown, signal?: AbortSignal): Promise<SuggestionSubmitResult> => {
      const parsed = SuggestionRequestSchema.safeParse(input)
      if (!parsed.success || signal?.aborted) return { kind: "invalid" }
      let id: string
      try { id = newId() } catch { return { kind: "unavailable" } }
      const prepared = await store.change(expected, { type: "prepare", id, url: parsed.data.url })
      return prepared.status === "saved" ? client.retry(prepared.snapshot.token, id, signal) : local(prepared)
    },
    retry: async (expected: string | null, id: string, signal?: AbortSignal): Promise<SuggestionSubmitResult> => {
      if (signal?.aborted) return { kind: "unavailable" }
      const current = await observe(expected, id)
      if (current.failure) return current.failure
      let item: SuggestionEntry = current.item!
      let token: string | null = current.token!
      if (item.kind === "receipt") return local({ status: "invalid" })
      if (item.kind === "draft") {
        const issued = await transport.ticket({ url: item.url }, signal)
        if (issued.kind !== "ok") return issued
        const saved = await store.change(token, { type: "ticket", id, ...issued.value })
        if (saved.status !== "saved") return local(saved)
        token = saved.snapshot.token; item = saved.snapshot.items.find(v => v.id === id)!
      }
      if (item.kind !== "pending" || signal?.aborted) return { kind: "unavailable" }
      const sent = await store.change(token, { type: "sent", id })
      if (sent.status !== "saved") return local(sent)
      const result = await transport.create({ url: item.url, ticket: item.ticket }, signal)
      if (result.kind !== "ok") return result
      if (signal?.aborted) return { kind: "unavailable" }
      const response = result.value
      const committed = await store.change(sent.snapshot.token, response.kind === "received" ? { type: "received", id, access: response.access } : { type: "forget", id })
      if (committed.status !== "saved") return local(committed)
      return response.kind === "received" ? { kind: "saved", id } : response
    },
    status: async (expected: string | null, id: string, signal?: AbortSignal) => {
      const current = await observe(expected, id)
      if (current.failure) return current.failure
      if (current.item!.kind !== "receipt") return local({ status: "invalid" })
      const result = await transport.status(current.item!.access, signal), fresh = await observe(expected, id)
      return fresh.failure ?? result
    },
    withdraw: async (expected: string | null, id: string, signal?: AbortSignal) => {
      const current = await observe(expected, id)
      if (current.failure) return current.failure
      if (current.item!.kind !== "receipt") return local({ status: "invalid" })
      const result = await transport.withdraw(current.item!.access, signal)
      if (result.kind !== "ok") return result
      const forgotten = await store.change(expected, { type: "forget", id })
      return { kind: "withdrawn" as const, forgotten: forgotten.status === "saved" }
    },
    forget: (expected: string | null, id: string) => store.change(expected, { type: "forget", id }),
  }
  return client
}
