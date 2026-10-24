import { type PublicChecklistExport } from "@skilved/types/opportunities"
import { createPublicExportReader, type createPublicExportPreparer } from "./public-export"

export type ExportIntent = "preview" | "copy" | "download"
export type ExportView = { kind: "idle" | "reading" | "acting" | "ready" | "disabled"; payload?: PublicChecklistExport; message: string }
type Effects = { copy: (text: string) => Promise<void>; download: (payload: PublicChecklistExport) => void | Promise<void> }

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
        emit({ kind: "acting", payload, message: fallback + (intent === "copy" ? "Copying public text…" : "Requesting a text-file download…") })
        if (!active()) return
        try {
          if (intent === "copy") await effects.copy(payload.text)
          else await effects.download(payload)
          if (active()) emit({ kind: "ready", payload, message: fallback + (intent === "copy" ? "Public text copied." : "Text-file download requested. Check your browser’s downloads.") })
        } catch {
          if (active()) emit({ kind: "ready", payload, message: fallback + (intent === "copy" ? "Couldn’t copy automatically. Select the preview text and copy it yourself." : "Couldn’t request the download. You can select and copy the preview text.") })
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
