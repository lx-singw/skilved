import type { LocalProgressCommand } from "@skilved/types/opportunities"
import { createLocalProgressStore, type LocalProgressResult } from "./local-progress"

export type ProgressSessionState = { view: LocalProgressResult | null; busy: boolean; message: string }
export const INITIAL_PROGRESS_STATE: ProgressSessionState = { view: null, busy: false, message: "" }

/** UI reconciliation only. Invalidation reads never replay mutations. */
export function createProgressSession(store = createLocalProgressStore(), notify = () => {}) {
  let state = INITIAL_PROGRESS_STATE, sequence = 0, pendingRead = false
  const listeners = new Set<() => void>()
  const update = (next: ProgressSessionState) => { state = next; listeners.forEach(listener => listener()) }
  const session = {
    getSnapshot: () => state,
    getServerSnapshot: () => INITIAL_PROGRESS_STATE,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    refresh: async (manual = false): Promise<void> => {
      if (state.busy) { pendingRead = true; return }
      if (!manual && state.view?.status === "conflict") return
      const current = ++sequence
      let result: LocalProgressResult
      try { result = await store.read() } catch { result = { status: "unavailable" } }
      if (current !== sequence) return
      const oldToken = state.view && "snapshot" in state.view ? state.view.snapshot.token : null
      const token = "snapshot" in result ? result.snapshot.token : null
      update({ view: result, busy: false, message: oldToken !== token ? "" : state.message })
    },
    change: async (command: LocalProgressCommand | "clear"): Promise<void> => {
      if (state.busy) return
      const view = state.view
      if (!view || (command !== "clear" && !("snapshot" in view))) return
      ++sequence // A read started before this action cannot replace its result.
      update({ ...state, busy: true, message: "" })
      let result: LocalProgressResult
      try { result = command === "clear" ? await store.clear() : await store.change("snapshot" in view ? view.snapshot.token : null, command) }
      catch { result = { status: "unavailable" } }
      const success = result.status === "saved" || result.status === "ready"
      const message = result.status === "saved" ? command === "clear" ? "Saved progress cleared from this browser." : command.type === "remove" ? "Removed from this browser."
        : command.type === "stage" ? "Personal stage updated in this browser."
        : command.type === "acknowledge_revision" ? "Your review of these details was recorded in this browser. Personal progress was retained."
        : command.type === "route_opened" ? "Route-opening action recorded in this browser. This does not confirm that the issuer’s page loaded or that you submitted an application."
        : "Saved in this browser."
        : result.status === "ready" ? "Already saved in this browser."
        : result.status === "not_saved" ? "This opportunity is not saved; no local progress or route action was recorded."
        : result.status === "conflict" ? "Saved progress changed in another tab. Reload it before trying again."
        : result.status === "full" ? "This browser’s saved list is full. Reload it and remove an item before saving another."
        : "We couldn’t confirm that change. Reload saved progress before trying again."
      update({ view: result, busy: false, message })
      if (result.status === "saved") { try { notify() } catch { /* Commit still succeeded without notifications. */ } }
      const refresh = pendingRead && success; pendingRead = false
      if (refresh) await session.refresh()
    },
  }
  return session
}
