"use client"

import { useEffect, useRef, useState } from "react"
import { createPublicExportPreparer } from "@/lib/public-export"
import { copyPublicText, createPublicExportActions, downloadPublicText, type ExportView } from "@/lib/public-export-actions"
import { sharePublicText } from "@/lib/public-export-share"
import { composePublicWhatsApp } from "@/lib/public-export-whatsapp"

export function PublicChecklistExport({ id, origin }: { id: string; origin: string | null }) {
  return <ExportControls key={`${id}:${origin ?? ""}`} id={id} origin={origin} />
}

function ExportControls({ id, origin }: { id: string; origin: string | null }) {
  const [view, setView] = useState<ExportView>({ kind: "idle", message: "" })
  const [mounted, setMounted] = useState(false)
  const [nativeShareSupported, setNativeShareSupported] = useState(false)
  const actions = useRef<ReturnType<typeof createPublicExportActions> | null>(null)
  useEffect(() => {
    const start = () => {
      if (actions.current) return
      actions.current = createPublicExportActions(id, createPublicExportPreparer({ origin }), setView, { copy: copyPublicText, download: downloadPublicText, share: sharePublicText, whatsapp: composePublicWhatsApp })
      setView({ kind: "idle", message: "" })
    }
    const dispose = () => { actions.current?.dispose(); actions.current = null }
    const hide = () => { dispose(); setView({ kind: "idle", message: "" }) }
    start()
    setNativeShareSupported(typeof navigator.share === "function")
    setMounted(true)
    // Full navigation may freeze a page without React unmounting it.
    window.addEventListener("pagehide", hide)
    window.addEventListener("pageshow", start)
    return () => {
      window.removeEventListener("pagehide", hide)
      window.removeEventListener("pageshow", start)
      dispose()
    }
  }, [id, origin])
  const busy = view.kind === "reading" || view.kind === "acting"
  const disabled = !origin || !mounted || busy || view.kind === "disabled"
  const button = "min-h-11 rounded-md border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
  return <section className="mt-8 rounded-xl border border-border bg-card p-6" aria-labelledby="public-export-heading" aria-busy={busy}>
    <h2 id="public-export-heading" className="text-xl font-semibold">Take a public checklist with you</h2>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Preview, copy or download the public instructions and source references. Each action checks the current listing again. Your ticks, saved progress and private suggestion receipts are excluded.</p>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">A dated copy may become out of date. Reopen its public link before applying. This does not submit an application or back up your personal progress. Opening links may use data.</p>
    {!origin && <p className="mt-4 text-sm">Public text export is currently unavailable.</p>}
    <p id="native-share-support" className="mt-3 text-sm leading-relaxed text-muted-foreground">{!mounted ? "Native share support is checked after this page loads." : nativeShareSupported ? "Native sharing depends on your browser and available apps." : "Native sharing is unavailable in this browser. Use copy or download instead."}</p>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Request a WhatsApp draft in this tab with the public text, or only its public link if the text is too long. You choose the recipient and send it yourself.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" className={button} disabled={disabled} onClick={() => void actions.current?.run("preview")}>Preview public text</button>
      <button type="button" className={button} disabled={disabled} onClick={() => void actions.current?.run("copy")}>Copy public text</button>
      <button type="button" className={button} disabled={disabled} onClick={() => void actions.current?.run("download")}>Download text file</button>
      <button type="button" className={button} disabled={disabled || !nativeShareSupported} aria-describedby="native-share-support" onClick={() => void actions.current?.run("share")}>Share public text</button>
      <button type="button" className={button} disabled={disabled} onClick={() => void actions.current?.run("whatsapp")}>Compose in WhatsApp</button>
      {view.payload && <button type="button" className={button} disabled={busy} onClick={() => actions.current?.hide()}>Hide public preview</button>}
    </div>
    <p role="status" className="mt-4 text-sm leading-relaxed">{view.message}</p>
    {view.payload && <div className="mt-4">
      <label htmlFor="public-export-preview" className="block text-sm font-medium">Public text preview (select to copy)</label>
      <textarea id="public-export-preview" readOnly value={view.payload.text} rows={14} spellCheck={false} className="mt-2 w-full rounded-md border border-border bg-background p-3 text-sm leading-relaxed" />
    </div>}
  </section>
}
