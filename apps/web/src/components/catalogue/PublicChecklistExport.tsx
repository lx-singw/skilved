"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowDownToLine, ArrowUpRight, Copy, FileText, Link2, RefreshCw } from "lucide-react"
import { createPublicExportPreparer } from "@/lib/public-export"
import { copyPublicText, createPublicExportActions, downloadPublicText, type ExportView } from "@/lib/public-export-actions"
import { sharePublicText } from "@/lib/public-export-share"
import { composePublicWhatsApp } from "@/lib/public-export-whatsapp"
import { PublicCopyPreview } from "./PublicCopyPreview"

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
  return <section id="public-copy" className="public-copy-workbench" aria-labelledby="public-export-heading" aria-busy={busy}>
    <div className="public-copy-header"><span className="public-copy-emblem" aria-hidden><FileText size={26}/></span><div><p className="mini-label">A copy for the next step</p><h2 id="public-export-heading">Take a public checklist with you</h2><p>Keep the instructions close, or pass a possibility on. Start with a copy you can read.</p></div></div>
    <ul className="public-copy-contents" aria-label="Public copy contents">{view.payload?.kind === "link" ? <li>Public reference only</li> : <><li>Connected instructions</li><li>Source references</li><li>A link back</li></>}</ul>
    {!origin && <p className="public-copy-unavailable">Public text export is currently unavailable.</p>}
    <div className="public-copy-primary"><button type="button" disabled={disabled} onClick={()=>void actions.current?.run("preview")}><FileText size={18} aria-hidden /><span><strong>Preview public text</strong><small>Read what goes with the copy</small></span><ArrowUpRight size={18} aria-hidden /></button></div>
    <div className="public-copy-actions"><button type="button" disabled={disabled} onClick={()=>void actions.current?.run("copy")}><Copy size={16} aria-hidden /><span>Copy public text<small>For your notes or a message</small></span></button><button type="button" disabled={disabled} onClick={()=>void actions.current?.run("download")}><ArrowDownToLine size={16} aria-hidden /><span>Download text file<small>Keep a dated file on your device</small></span></button></div>
    <p role="status" aria-live="polite" className="public-copy-status">{busy && <RefreshCw size={15} aria-hidden />}{view.message}</p>
    {view.payload && <PublicCopyPreview payload={view.payload} busy={busy} onHide={()=>actions.current?.hide()}/>}
    <details className="public-copy-sharing"><summary><Link2 size={16} aria-hidden /><span>Share in another app</span><ArrowUpRight size={16} aria-hidden /></summary><div><p id="native-share-support">{!mounted ? "Native share support is checked after this page loads." : nativeShareSupported ? "Native sharing depends on your browser and available apps." : "Native sharing is unavailable in this browser. Use copy or download instead."}</p><p>Request a WhatsApp draft in this tab with the public text, or only its public link if the text is too long. You choose the recipient and send it yourself.</p><div className="public-copy-share-actions"><button type="button" disabled={disabled || !nativeShareSupported} aria-describedby="native-share-support" onClick={()=>void actions.current?.run("share")}>Share public text</button><button type="button" disabled={disabled} onClick={()=>void actions.current?.run("whatsapp")}>Compose in WhatsApp</button></div></div></details>
    <details className="public-copy-limits"><summary>What this copy includes</summary><div><p>Preview, copy or download the public instructions and source references. Each action checks the current listing again. Your ticks, saved progress and private suggestion receipts are excluded.</p><p>A dated copy may become out of date. Reopen its public link before applying. This does not submit an application or back up your personal progress. Opening links may use data.</p></div></details>
  </section>
}
