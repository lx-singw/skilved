import { IdSchema, PublicChecklistOriginSchema, type PublicChecklistExport } from "@skilved/types/opportunities"

const PREFIX = "https://wa.me/?text="
// Engineering budget for the encoded navigation, not a provider-supported size claim.
export const MAX_WHATSAPP_URL_CHARS = 8000
export type WhatsAppDraft = { url: string; content: "text" | "link" }
export type WhatsAppOutcome = { kind: "requested"; content: "text" | "link" } | { kind: "unavailable" }

/** A whole public copy or its canonical link; never truncate a condition or alternative. */
export function preparePublicWhatsApp(payload: PublicChecklistExport): WhatsAppDraft | null {
  try {
    const canonical = new URL(payload.canonicalUrl)
    const path = "/opportunities/", id = canonical.pathname.slice(path.length)
    if (!PublicChecklistOriginSchema.safeParse(canonical.origin).success || !IdSchema.safeParse(id).success ||
      payload.canonicalUrl !== canonical.origin + path + id) return null
    if (payload.text && payload.text.length <= 65536) {
      try {
        const url = PREFIX + encodeURIComponent(payload.text)
        if (url.length <= MAX_WHATSAPP_URL_CHARS) return { url, content: "text" }
      } catch { /* Unsupported text uses the whole public reference instead. */ }
    }
    const url = PREFIX + encodeURIComponent(payload.canonicalUrl)
    return url.length <= MAX_WHATSAPP_URL_CHARS ? { url, content: "link" } : null
  } catch { return null }
}

/** Current-tab navigation avoids a popup. It cannot confirm app availability or delivery. */
export function requestWhatsAppNavigation(url: string) {
  const link = document.createElement("a")
  try {
    link.href = url
    link.target = "_self"
    link.rel = "noreferrer"
    link.referrerPolicy = "no-referrer"
    link.hidden = true
    document.body.append(link)
    link.click()
  } finally { link.remove() }
}

export function composePublicWhatsApp(payload: PublicChecklistExport, navigate: (url: string) => void = requestWhatsAppNavigation): WhatsAppOutcome {
  const draft = preparePublicWhatsApp(payload)
  if (!draft) return { kind: "unavailable" }
  try { navigate(draft.url); return { kind: "requested", content: draft.content } }
  catch { return { kind: "unavailable" } }
}
