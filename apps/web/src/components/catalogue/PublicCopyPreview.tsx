"use client"

import { useRef } from "react"
import { ArrowUpRight, FileText, MousePointer2, X } from "lucide-react"
import type { PublicChecklistExport } from "@skilved/types/opportunities"

export function PublicCopyPreview({ payload, busy, onHide }: { payload:PublicChecklistExport;busy:boolean;onHide:()=>void }) {
  const preview=useRef<HTMLTextAreaElement>(null)
  const bytes=new TextEncoder().encode(payload.text).byteLength
  return <div className={`public-copy-document ${payload.kind === "link" ? "public-copy-reference" : ""}`}>
    <div className="public-copy-document-bar"><span><FileText size={14} aria-hidden />{payload.kind === "checklist" ? "Dated public copy" : "Reference only"}</span><button type="button" disabled={busy} onClick={onHide}><X size={13} aria-hidden />Hide public preview</button></div>
    <div className="public-copy-document-heading"><p className="mini-label">Skilved / Take-away file</p><h3>{payload.kind === "checklist" ? "The instructions, kept together." : "Keep a way back."}</h3><p>{payload.kind === "checklist" ? "The complete connected wording, public sources and a link to revisit the notice." : "Current checklist details and the application destination could not be included. Reopen the public link for current availability."}</p></div>
    <div className="public-copy-file"><span>{payload.filename}</span><span>{bytes < 1000 ? `${bytes} B` : `${(bytes/1000).toFixed(1)} kB`} · UTF-8 text</span></div>
    <div className="public-copy-text-tools"><label htmlFor="public-export-preview">Public text preview (select to copy)</label><button type="button" onClick={()=>{preview.current?.focus();preview.current?.select()}}><MousePointer2 size={13} aria-hidden />Select preview text</button></div>
    <textarea ref={preview} id="public-export-preview" readOnly value={payload.text} rows={18} spellCheck={false} aria-describedby="public-copy-return-note" />
    <div className="public-copy-return"><ArrowUpRight size={17} aria-hidden /><p id="public-copy-return-note"><strong>Keep the way back with the copy.</strong><span>{payload.canonicalUrl}</span>Reopen this public link before applying; the file cannot update itself.<a href={payload.canonicalUrl} target="_blank" rel="noopener noreferrer">Reopen current notice<ArrowUpRight size={13} aria-hidden /></a></p></div>
  </div>
}
