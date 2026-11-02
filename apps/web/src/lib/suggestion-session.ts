import { createSuggestionAccessStore, type SuggestionLocalResult } from "./suggestion-access"
import { createSuggestionClient } from "./suggestion-client"
import { SuggestionCreateResponseSchema, SuggestionStatusResponseSchema, type SuggestionStatusResponse } from "@skilved/types/opportunities/suggestions"

export type SuggestionSessionState = { view: SuggestionLocalResult | null; busy: boolean; message: string; statuses: Record<string, SuggestionStatusResponse>; publicIds: string[] }
export const INITIAL_SUGGESTION_STATE: SuggestionSessionState = { view: null, busy: false, message: "", statuses: {}, publicIds: [] }
type Action = { type: "submit"; url: string } | { type: "retry" | "status" | "withdraw" | "forget"; id: string } | { type: "clear" }

/** Read invalidations never replay mutations. Messages contain no raw server or storage data. */
export function createSuggestionSession(store = createSuggestionAccessStore(), client = createSuggestionClient(store), notify = () => {}) {
  let state = INITIAL_SUGGESTION_STATE, sequence = 0, active = true, pendingRead = false, controller: AbortController | undefined
  const listeners = new Set<() => void>()
  const update = (next: SuggestionSessionState) => { state = next; listeners.forEach(listener => listener()) }
  const session = {
    getSnapshot: () => state,
    getServerSnapshot: () => INITIAL_SUGGESTION_STATE,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    start: () => { active = true; ++sequence; update({ ...state, busy: false }) },
    stop: () => { active = false; ++sequence; controller?.abort() },
    refresh: async (manual = false): Promise<void> => {
      if (!active) return
      if (state.busy) { pendingRead = true; ++sequence; controller?.abort(); return }
      if (!manual && state.view?.status === "conflict") return
      const current = ++sequence
      let result: SuggestionLocalResult
      try { result = await store.read() } catch { result = { status: "unavailable" } }
      if (active && current === sequence) update({ ...state, view: result, statuses: {}, publicIds: [], message: "" })
    },
    action: async (command: Action, observed: string | null): Promise<boolean> => {
      if (!active || state.busy || !state.view || (command.type !== "clear" && !("snapshot" in state.view))) return false
      if ("snapshot" in state.view && state.view.snapshot.token !== observed) {
        ++sequence; update({ ...state, view: { status: "conflict" }, statuses: {}, publicIds: [], message: "Access changed. Reload receipts before trying again." }); return false
      }
      const current = ++sequence, request = new AbortController(); controller = request
      update({ ...state, busy: true, message: "", publicIds: [] })
      let result: unknown
      try {
        result = command.type === "submit" ? await client.submit(observed, { url: command.url }, request.signal)
          : command.type === "retry" ? await client.retry(observed, command.id, request.signal)
          : command.type === "status" ? await client.status(observed, command.id, request.signal)
          : command.type === "withdraw" ? await client.withdraw(observed, command.id, request.signal)
          : command.type === "forget" ? await client.forget(observed, command.id) : await store.clear()
      } catch { result = { kind: "unavailable" } }
      let fresh: SuggestionLocalResult
      try { fresh = await store.read() } catch { fresh = { status: "unavailable" } }
      if (!active) return false
      if (current !== sequence) {
        update({ ...state, busy: false, statuses: {}, publicIds: [], message: "" })
        if (pendingRead) { pendingRead = false; await session.refresh(true) }
        return false
      }
      const r = (result && typeof result === "object" ? result : {}) as { kind?: string; status?: string; value?: unknown; forgotten?: boolean }
      const localStatus = r.kind === "local" ? r.status : undefined
      const success = r.kind === "saved" || r.status === "saved"
      let message = "We couldn’t confirm this request. Keep local access and retry explicitly when available."
      let statuses = state.statuses, publicIds: string[] = []
      if (success) message = command.type === "forget" ? "Local access forgotten. This did not withdraw the server suggestion."
        : command.type === "clear" ? "Receipt access cleared from this browser. Server suggestions were not withdrawn."
        : "Private receipt saved in this browser. This is not an application."
      else if (r.kind === "withdrawn") message = r.forgotten ? "Withdrawal confirmed and local access removed." : "Withdrawal confirmed. Local removal was not confirmed; reload receipts."
      else if (r.kind === "not_found") message = "This access could not be verified. It may have expired or been withdrawn. No new receipt was created."
      else if (r.kind === "invalid") message = "Use a supported public HTTPS notice link without login, query parameters or personal details."
      else if (r.kind === "limited") message = "Requests are temporarily limited. Keep local access and try later."
      else if (localStatus === "expired") message = "This retry has expired. You can forget local access; a new submission would be separate."
      else if (localStatus === "conflict") { fresh = { status: "conflict" }; statuses = {}; message = "Access changed. Reload receipts before trying again." }
      else if (localStatus === "full") message = "This browser’s receipt list is full. Forget an unneeded local entry before submitting another."
      const approved = SuggestionCreateResponseSchema.safeParse(result)
      if (approved.success && approved.data.kind === "approved") { publicIds = approved.data.publicResultIds; message = "This link already has approved public results. Review their current details." }
      if (approved.success && approved.data.kind === "previous_result_unavailable") message = "The previous public result is no longer available. No new review was created."
      if (command.type === "status" && r.kind === "ok") {
        const status = SuggestionStatusResponseSchema.safeParse(r.value)
        if (status.success) { statuses = { ...statuses, [command.id]: status.data }; message = "Current status checked. This does not confirm an application." }
      }
      update({ view: fresh, busy: false, message, statuses, publicIds })
      if (success || r.kind === "withdrawn") { try { notify() } catch { /* Local commit/ack remains valid. */ } }
      pendingRead = false
      // The form may clear a completed submit or explicit retry, never an uncertain or obsolete attempt.
      return (command.type === "submit" || command.type === "retry") && (success || approved.success && approved.data.kind === "approved")
    },
  }
  return session
}
