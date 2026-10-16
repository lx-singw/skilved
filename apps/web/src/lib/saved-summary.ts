import { DetailResponseSchema, IdSchema } from "@skilved/types/opportunities"

export type SavedSummary = { kind: "current"; id: string; revision: number; title: string; state: "published" | "closed" }
  | { kind: "restricted"; id: string; revision: number }
  | { kind: "missing" | "unavailable" }
export async function readSavedSummary(id: string, signal?: AbortSignal): Promise<SavedSummary> {
  if (!IdSchema.safeParse(id).success) return { kind: "unavailable" }
  try {
    const response = await fetch(`/api/v1/opportunities/${id}`, { cache: "no-store", signal })
    if (response.status === 404) return { kind: "missing" }
    if (!response.ok) return { kind: "unavailable" }
    const result = DetailResponseSchema.parse(await response.json())
    if (result.kind === "status") return { kind: "restricted", id: result.status.id, revision: result.status.revision }
    return { kind: "current", id: result.opportunity.id, revision: result.opportunity.revision, title: result.opportunity.title.value ?? "Saved opportunity", state: result.opportunity.lifecycle }
  } catch { return { kind: "unavailable" } }
}
