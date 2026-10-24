import { type PublicChecklistExport } from "@skilved/types/opportunities"
import { createPublicExportReader, type createPublicExportPreparer } from "./public-export"
import { type NativeShareOutcome } from "./public-export-share"
import { type WhatsAppOutcome } from "./public-export-whatsapp"

export type ExportIntent = "preview" | "copy" | "download" | "share" | "whatsapp"
export type ExportView = { kind: "idle" | "reading" | "acting" | "ready" | "disabled"; payload?: PublicChecklistExport; message: string }
type Effects = { copy: (text: string) => Promise<void>; download: (payload: PublicChecklistExport) => void | Promise<void>; share?: (text: string) => Promise<NativeShareOutcome>; whatsapp?: (payload: PublicChecklistExport) => WhatsAppOutcome | Promise<WhatsAppOutcome> }
const SHARE_UNAVAILABLE = "Sharing is unavailable here. Select the public preview text to copy it yourself."
const WHATSAPP_UNAVAILABLE = "Couldn’t request WhatsApp compose. You can copy or download the public preview instead. App opening and delivery are not confirmed."

/** Effects receive only a freshly prepared public result. Browser persistence is never read here. */
export function createPublicExportActions(id: string, prepare: ReturnType<typeof createPublicExportPreparer>, publish: (view: ExportView) => void, effects: Effects) {
  const reader = createPublicExportReader(() => {}, prepare)
  let disposed = false, busy = false, sequence = 0
  const emit = (view: ExportView) => { try { publish(view) } catch { /* Teardown cannot authorize an effect. */ } }
  return {
    run: async (intent: ExportIntent) => {
      if (disposed || busy) return
      busy = true
      const current = ++sequence
      const active = () => !disposed && current === sequence
      emit({ kind: "reading", message: "Checking current public details…" })
      try {
        if (!active()) return
        const result = await reader.refresh(id)
        if (!active() || !result) return
        if (!("payload" in result)) {
          if (result.kind === "disabled") emit({ kind: "disabled", message: "Public text export is currently unavailable." })
          return
        }
        const payload = result.payload
        const fallback = payload.kind === "link" ? "Only a public reference is available. Current checklist details and the application destination are omitted. " : ""
        if (intent === "preview") { emit({ kind: "ready", payload, message: fallback + "Preview ready. Any later copy or download checks the details again." }); return }
        emit({ kind: "acting", payload, message: fallback + (intent === "whatsapp" ? "Requesting WhatsApp compose…" : intent === "share" ? "Requesting native sharing…" : intent === "copy" ? "Copying public text…" : "Requesting a text-file download…") })
        if (!active()) return
        try {
          if (intent === "whatsapp") {
            const outcome = await effects.whatsapp?.(payload)
            const message = outcome?.kind !== "requested" ? WHATSAPP_UNAVAILABLE
              : (outcome.content === "link" ? "Only the public link was passed to WhatsApp because the full text could not fit safely. Copy or download the preview for the full text. " : "WhatsApp compose requested with the dated public text. ")
                + "You choose the recipient and send it yourself. App opening and delivery are not confirmed."
            if (active()) emit({ kind: "ready", payload, message: fallback + message })
            return
          }
          if (intent === "share") {
            const outcome = await effects.share?.(payload.text)
            const message = outcome === "handed_off" ? "Share handoff completed. Delivery is not confirmed."
              : outcome === "cancelled_or_unavailable" ? "Sharing was cancelled or no target was available. Delivery is not confirmed. You can select the public preview text to copy it."
              : SHARE_UNAVAILABLE
            if (active()) emit({ kind: "ready", payload, message: fallback + message })
            return
          }
          if (intent === "copy") await effects.copy(payload.text)
          else await effects.download(payload)
          if (active()) emit({ kind: "ready", payload, message: fallback + (intent === "copy" ? "Public text copied." : "Text-file download requested. Check your browser’s downloads.") })
        } catch {
          if (active()) emit({ kind: "ready", payload, message: fallback + (intent === "whatsapp" ? WHATSAPP_UNAVAILABLE : intent === "share" ? SHARE_UNAVAILABLE : intent === "copy" ? "Couldn’t copy automatically. Select the preview text and copy it yourself." : "Couldn’t request the download. You can select and copy the preview text.") })
        }
      } finally { if (active()) busy = false }
    },
    hide: () => { if (!disposed && !busy) { ++sequence; reader.cancel(); emit({ kind: "idle", message: "" }) } },
    dispose: () => { disposed = true; ++sequence; reader.dispose() },
  }
}

export async function copyPublicText(text: string) {
  if (!navigator.clipboard?.writeText) throw new Error("PUBLIC_COPY_UNAVAILABLE")
  await navigator.clipboard.writeText(text)
}

/** A click requests a download; it cannot establish that a file was saved. */
export function downloadPublicText(payload: PublicChecklistExport) {
  const url = URL.createObjectURL(new Blob([payload.text], { type: "text/plain;charset=utf-8" }))
  let link: HTMLAnchorElement | undefined
  try {
    link = document.createElement("a")
    link.href = url
    link.download = payload.filename
    link.hidden = true
    document.body.append(link)
    link.click()
  } catch (error) { URL.revokeObjectURL(url); throw error }
  finally { link?.remove() }
  // Let the browser consume the URL before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
