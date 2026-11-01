import type { LocalProgressItem } from "@skilved/types/opportunities"
import type { SavedSummary } from "./saved-summary"

export type SavedFilter = "all" | LocalProgressItem["userStage"]
export type SavedSort = "activity" | "saved"
export function savedWorkspace(items: LocalProgressItem[], filter: SavedFilter, sort: SavedSort) {
  const counts = { all: items.length, interested: 0, preparing: 0, applied_reported: 0, not_pursuing: 0 }
  for (const item of items) counts[item.userStage]++
  const visible = items.filter(item => filter === "all" || item.userStage === filter).sort((a, b) => {
    const field = sort === "saved" ? "savedAt" : "updatedAt"
    return b[field].localeCompare(a[field]) || a.opportunityId.localeCompare(b.opportunityId)
  })
  return { counts, visible }
}
export function savedCardState(item: LocalProgressItem, summary: SavedSummary | null) {
  const base = `/opportunities/${item.opportunityId}`
  if (!summary) return { label: "Checking current notice", tone: "pending", action: "Open saved reference", href: base }
  if (summary.kind === "unavailable") return { label: "Couldn’t load current details", tone: "attention", action: "Open saved reference", href: base }
  if (summary.kind === "missing") return { label: "Public listing not found", tone: "attention", action: "Open saved reference", href: base }
  if (summary.kind === "restricted") return { label: "Unavailable or under review", tone: "attention", action: "Check listing status", href: base }
  if (summary.id !== item.opportunityId) return { label: "Reference needs review", tone: "attention", action: "Review this reference", href: base }
  if (summary.revision !== item.lastViewedRevision) return { label: "Details have changed", tone: "attention", action: "Review changed details", href: base }
  if (summary.state === "closed") return { label: "Intake closed", tone: "quiet", action: "Read closed intake", href: base }
  return { label: "Current notice loaded", tone: "loaded", action: item.userStage === "preparing" ? "Continue preparing" : item.userStage === "applied_reported" ? "Review your record" : item.userStage === "not_pursuing" ? "Revisit this opportunity" : "Take a closer look", href: base + (item.userStage === "preparing" ? "#preparation" : item.userStage === "applied_reported" ? "#your-workspace" : "") }
}
