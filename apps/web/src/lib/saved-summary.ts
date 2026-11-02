import { DetailResponseSchema, IdSchema, type PublicOpportunity } from "@skilved/types/opportunities"
import { opportunityLens, type LensFact } from "./opportunity-lens"
import { opportunityFacts } from "./opportunity-presentation"

export type SavedSummary = { kind: "current"; id: string; revision: number; title: string; state: "published" | "closed"; category: PublicOpportunity["category"]; issuer: string; deadline: string; preview: { caption:string; facts:Pick<LensFact,"key"|"label"|"value"|"detail"|"unresolved">[]; place:string; attendance:string; deadlineState:PublicOpportunity["deadline"]["state"]; deadlineWording?:string } }
  | { kind: "restricted"; id: string; revision: number }
  | { kind: "missing" } | { kind: "unavailable" }
export async function readSavedSummary(id: string, signal?: AbortSignal): Promise<SavedSummary> {
  if (!IdSchema.safeParse(id).success || signal?.aborted) return { kind: "unavailable" }
  const controller = new AbortController(), abort = () => controller.abort()
  signal?.addEventListener("abort", abort, { once: true })
  const timer = setTimeout(abort, 8000)
  try {
    const response = await fetch(`/api/v1/opportunities/${id}`, { cache: "no-store", signal: controller.signal })
    if (controller.signal.aborted) return { kind: "unavailable" }
    if (response.status === 404) return { kind: "missing" }
    if (!response.ok) return { kind: "unavailable" }
    const result = DetailResponseSchema.parse(await response.json())
    if (controller.signal.aborted) return { kind: "unavailable" }
    if (result.kind === "status") return { kind: "restricted", id: result.status.id, revision: result.status.revision }
    const o = result.opportunity
    const lens = opportunityLens(o), facts = opportunityFacts(o)
    return { kind: "current", id: o.id, revision: o.revision, title: o.title.value ?? "Saved opportunity", state: o.lifecycle, category: o.category, issuer: o.issuer.value ?? "Issuer not established", deadline:facts.deadline, preview: { caption:lens.caption, facts:lens.facts.slice(0,2).map(({key,label,value,detail,unresolved})=>({key,label,value,detail,unresolved})), place:facts.place, attendance:facts.attendance, deadlineState:o.deadline.state, deadlineWording:o.deadline.state!=="stated"?o.deadline.originalText??undefined:undefined } }
  } catch { return { kind: "unavailable" } }
  finally { clearTimeout(timer); signal?.removeEventListener("abort", abort) }
}

/** Read-only reconciliation: obsolete or disposed requests cannot publish a result. */
export function createSavedSummaryReader(publish: (summary: SavedSummary | null) => void, read = readSavedSummary) {
  let sequence = 0, controller: AbortController | undefined, disposed = false
  return {
    refresh: async (id: string) => {
      if (disposed) return
      const current = ++sequence
      controller?.abort(); const request = new AbortController(); controller = request
      publish(null)
      let result: SavedSummary
      try { result = await read(id, request.signal) } catch { result = { kind: "unavailable" } }
      if (!disposed && current === sequence && !request.signal.aborted) publish(result)
    },
    dispose: () => { disposed = true; ++sequence; controller?.abort() },
  }
}
