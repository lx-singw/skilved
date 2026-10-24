import { DetailResponseSchema, IdSchema, InstantSchema, PublicChecklistOriginSchema, formatPublicChecklist, type PublicChecklistExport } from "@skilved/types/opportunities"

export type PublicExportResult = { kind: "prepared" | "unavailable"; payload: PublicChecklistExport }
  | { kind: "disabled" | "cancelled" }
export type PublicExportState = PublicExportResult | { kind: "idle" | "loading" }
type Options = { origin: string | null; fetch?: typeof fetch; now?: () => string; timeoutMs?: number }
const MAX_BODY_BYTES = 500_000

/** Every call reads the fixed public endpoint. No preview result is reused as authorization for another intent. */
export function createPublicExportPreparer({ origin, fetch: fetcher = fetch, now = () => new Date().toISOString(), timeoutMs = 8000 }: Options) {
  const trustedOrigin = PublicChecklistOriginSchema.safeParse(origin)
  const validDeadline = Number.isSafeInteger(timeoutMs) && timeoutMs >= 1 && timeoutMs <= 8000
  return async (id: string, signal?: AbortSignal): Promise<PublicExportResult> => {
    if (!trustedOrigin.success || !validDeadline || !IdSchema.safeParse(id).success) return { kind: "disabled" }
    if (signal?.aborted) return { kind: "cancelled" }
    const request = new AbortController()
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined, body: ReadableStream<Uint8Array> | null = null
    let callerCancelled = false, rejectStopped: (() => void) | undefined
    const cancelBody = () => {
      try { const pending = reader ? reader.cancel() : body?.cancel(); void pending?.catch(() => {}) } catch { /* Best-effort only; the deadline never waits for cancellation. */ }
    }
    const stop = () => { request.abort(); cancelBody(); rejectStopped?.() }
    const cancelled = () => { callerCancelled = true; stop() }
    const stopped = new Promise<never>((_, reject) => { rejectStopped = () => reject(new Error("PUBLIC_EXPORT_READ_STOPPED")) })
    signal?.addEventListener("abort", cancelled, { once: true })
    const timer = setTimeout(stop, timeoutMs)
    const fallback = (): PublicExportResult => {
      try {
        const time = InstantSchema.safeParse(now())
        const payload = time.success ? formatPublicChecklist(null, { origin: trustedOrigin.data, id, exportedAt: time.data }) : null
        return payload ? { kind: "unavailable", payload } : { kind: "disabled" }
      } catch { return { kind: "disabled" } }
    }
    const read = async () => {
      const response = await fetcher("/api/v1/opportunities/" + id, {
        method: "GET", cache: "no-store", credentials: "omit", redirect: "error", referrerPolicy: "no-referrer",
        headers: { Accept: "application/json" }, signal: request.signal,
      })
      body = response.body
      if (request.signal.aborted) { cancelBody(); throw new Error("PUBLIC_EXPORT_READ_STOPPED") }
      if (response.status !== 200 || response.redirected ||
        !/^application\/json(?:\s*;\s*charset=utf-8)?\s*$/i.test(response.headers.get("content-type") ?? "")) throw new Error("PUBLIC_EXPORT_READ_INVALID")
      const length = response.headers.get("content-length")
      if (length !== null && (!/^\d{1,7}$/.test(length) || Number(length) > MAX_BODY_BYTES)) throw new Error("PUBLIC_EXPORT_READ_INVALID")
      if (!body) throw new Error("PUBLIC_EXPORT_READ_INVALID")
      const activeReader = body.getReader(); reader = activeReader
      let bytes = 0
      const chunks: Uint8Array[] = []
      try {
        while (true) {
          const part = await activeReader.read()
          if (request.signal.aborted) throw new Error("PUBLIC_EXPORT_READ_STOPPED")
          if (part.done) break
          bytes += part.value.byteLength
          if (bytes > MAX_BODY_BYTES) throw new Error("PUBLIC_EXPORT_READ_INVALID")
          chunks.push(part.value)
        }
      } finally {
        try { activeReader.releaseLock() } catch { /* A host may still be unwinding a cancelled read. */ }
        if (reader === activeReader) reader = undefined
      }
      const raw = new Uint8Array(bytes)
      let offset = 0
      for (const part of chunks) { raw.set(part, offset); offset += part.byteLength }
      return DetailResponseSchema.parse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw)))
    }
    try {
      const current = await Promise.race([read(), stopped])
      if (callerCancelled || signal?.aborted) return { kind: "cancelled" }
      if (request.signal.aborted) return fallback()
      const time = InstantSchema.safeParse(now())
      if (!time.success) return { kind: "disabled" }
      // The public API's detail transaction resolves confirmed aliases and reads their current projection together.
      const canonicalId = current.kind === "opportunity" ? current.opportunity.id : current.status.id
      const payload = formatPublicChecklist(current, { origin: trustedOrigin.data, id: canonicalId, exportedAt: time.data })
      return payload ? { kind: "prepared", payload } : { kind: "disabled" }
    } catch {
      return callerCancelled || signal?.aborted ? { kind: "cancelled" } : fallback()
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener("abort", cancelled)
      cancelBody()
    }
  }
}

/** A changed intent clears old output immediately. Cancelled, obsolete and disposed reads cannot publish or return it. */
export function createPublicExportReader(publish: (state: PublicExportState) => void, prepare: ReturnType<typeof createPublicExportPreparer>) {
  let sequence = 0, disposed = false, controller: AbortController | undefined
  const emit = (state: PublicExportState) => { try { publish(state) } catch { /* A consumer cannot turn a read failure into private output. */ } }
  return {
    refresh: async (id: string): Promise<PublicExportResult | null> => {
      if (disposed) return null
      const current = ++sequence
      controller?.abort()
      const request = new AbortController(); controller = request
      emit({ kind: "loading" })
      let result: PublicExportResult
      try { result = await prepare(id, request.signal) } catch { result = { kind: "disabled" } }
      if (disposed || current !== sequence || request.signal.aborted) return null
      emit(result)
      return disposed || current !== sequence || request.signal.aborted ? null : result
    },
    cancel: () => { if (!disposed) { ++sequence; controller?.abort(); emit({ kind: "idle" }) } },
    dispose: () => { disposed = true; ++sequence; controller?.abort() },
  }
}
