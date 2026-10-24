import type { Metadata } from "next"
import { CATEGORY_LABELS, DetailResponseSchema, InstantSchema, PublicChecklistOriginSchema, formatPublicChecklist } from "@skilved/types/opportunities"

const GENERIC_TITLE = "Opportunity details | Skilved"
const REMINDER = "Read the current listing and original source before acting. Shared previews may be out of date."

function wholeLine(value: string | null, maximum: number): string | null {
  if (!value) return null
  const line = value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, " ").replace(/\s+/g, " ").trim()
  return line && [...line].length <= maximum ? line : null
}

/** Only checked public projections enter metadata; no request headers, browser state or parent metadata is merged. */
export function publicOpportunityMetadata(input: unknown, origin: string | null, checkedAt: string): Metadata {
  let title = GENERIC_TITLE, description = REMINDER, canonical: string | undefined
  try {
    const trusted = PublicChecklistOriginSchema.safeParse(origin), time = InstantSchema.safeParse(checkedAt)
    if (trusted.success && time.success) {
      const parsed = DetailResponseSchema.safeParse(input)
      if (parsed.success) {
        const current = parsed.data, id = current.kind === "opportunity" ? current.opportunity.id : current.status.id
        canonical = trusted.data + "/opportunities/" + id
        if (current.kind === "opportunity" && formatPublicChecklist(current, { origin: trusted.data, id, exportedAt: time.data })?.kind === "checklist") {
          const o = current.opportunity, category = CATEGORY_LABELS[o.category]
          const name = o.title.state === "stated" ? wholeLine(o.title.value, 120) : null
          const issuer = o.issuer.state === "stated" ? wholeLine(o.issuer.value, 80) : null
          title = (name ?? category + " opportunity") + " | Skilved"
          const candidate = category + " information" + (issuer ? " from " + issuer : "") + ". " + REMINDER
          description = [...candidate].length <= 240 ? candidate : category + " information. " + REMINDER
        }
      }
    }
  } catch { /* Malformed/failed context must never echo source/private errors or prior facts. */ }
  return {
    title: { absolute: title }, description,
    robots: { index: false, follow: false },
    alternates: canonical ? { canonical } : { canonical: null },
    openGraph: { type: "website", siteName: "Skilved", locale: "en_ZA", title, description, url: canonical, images: [] },
    twitter: { card: "summary", title, description, images: [] },
  }
}
