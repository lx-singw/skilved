"use client"
import Link from "next/link"
import { useEffect, useRef } from "react"
import { ArrowUpRight, Bookmark, Check, RefreshCw } from "lucide-react"
import type { LocalProgressItem } from "@skilved/types/opportunities"
import { useLocalProgress } from "@/lib/use-local-progress"
import { LocalTime } from "./PersonalProgressHistory"

const stages = {
  interested: { label: "Interested", note: "A possibility you’re exploring.", action: "Take a closer look", fragment: "opportunity-story" },
  preparing: { label: "Preparing", note: "Your personal stage. Requirement ticks remain temporary.", action: "Continue preparing", fragment: "preparation" },
  applied_reported: { label: "Applied — marked by you", note: "Your report only. Submission is not confirmed.", action: "Review your record", fragment: "your-workspace" },
  not_pursuing: { label: "No longer pursuing", note: "Set aside by you. This is separate from the listing’s status.", action: "Revisit this notice", fragment: "opportunity-story" },
} as const

export function FeedSavedRecord({ item, revision, href, closed = false }: { item: LocalProgressItem; revision: number; href: string; closed?: boolean }) {
  const stage = stages[item.userStage], changed = revision !== item.lastViewedRevision
  return <div className="feed-saved-record">
    <div className="feed-record-tab"><Bookmark size={13} aria-hidden /><span>Your place in this notice</span><span>Browser only</span></div>
    <div className="feed-record-reading"><div><p className="feed-record-label">Your stage</p><p className="feed-record-stage">{stage.label}</p><p className="feed-record-note">{stage.note}</p></div>
      <div className="feed-record-return">{changed ? <><p className="feed-record-changed">Details differ from your saved version</p><p className="feed-record-note">Your stage is kept. Read the current wording before taking a next step.</p></> : <p className="feed-record-note">Saved here <LocalTime value={item.savedAt} /><span>Time shown in this browser’s timezone.</span></p>}
        <Link href={`${href}#${changed || closed ? "opportunity-story" : stage.fragment}`}>{changed ? "Review these details" : closed ? "Read the closed intake" : stage.action}<ArrowUpRight size={14} aria-hidden /></Link>
      </div></div>
  </div>
}

function storageGuidance(status: string | undefined, reason?: string) {
  if (status === "unreadable") return reason === "unsupported_version" ? "Saved progress uses a different format. Its data has not been reset. Open Saved for recovery options." : "Saved progress cannot be read. Its data has not been reset. Open Saved for recovery options."
  if (status === "conflict") return "Saved progress changed elsewhere. Reload it, then review this card before saving again."
  if (status === "full") return "This browser’s saved list is full. Open Saved to manage it, then reload saved progress."
  if (status === "unavailable") return "Browser storage is unavailable. Your saved status could not be confirmed."
  return "Your saved status could not be confirmed. Reload saved progress before trying again."
}

export function FeedSave({ id, revision, href, title, closed = false, showRecord = true }: { id: string; revision: number; href: string; title: string; closed?: boolean; showRecord?: boolean }) {
  const progress = useLocalProgress()
  const snapshot = progress.view && "snapshot" in progress.view ? progress.view.snapshot : null
  const saved = snapshot?.items.find(item => item.opportunityId === id)
  const recovery = !!progress.view && !snapshot
  const requested = useRef(false), savedLink = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    if (saved && requested.current) {
      // Replacing the initiating button leaves focus on body. Respect a user who has moved on.
      if (typeof document !== "undefined" && (document.activeElement === document.body || document.activeElement === savedLink.current)) savedLink.current?.focus()
      requested.current = false
    }
    else if (recovery && !progress.busy) requested.current = false
  }, [saved, recovery, progress.busy])
  return <>
    <div className="feed-save">{saved ? <Link ref={savedLink} className="feed-saved-link" href={`${href}#your-workspace`} aria-label={`Manage saved progress for ${title}`}><Check size={17} aria-hidden />Saved here<ArrowUpRight size={13} aria-hidden /></Link>
      : <button type="button" className="save-button" aria-label={`Save ${title} in this browser`} disabled={!snapshot || progress.busy}
        onClick={() => { requested.current = true; void progress.change({ type: "save", id, revision }) }}><Bookmark size={17} aria-hidden />{progress.busy ? "Saving…" : !progress.view ? "Loading saves…" : recovery ? "Save unavailable" : "Save"}</button>}</div>
    {saved && showRecord && <FeedSavedRecord item={saved} revision={revision} href={href} closed={closed} />}
    {recovery ? <div className="feed-save-recovery"><p>{storageGuidance(progress.view?.status, progress.view?.status === "unreadable" ? progress.view.reason : undefined)}</p><div><button type="button" disabled={progress.busy} onClick={() => { void progress.reload() }}><RefreshCw size={13} aria-hidden />Reload saved progress</button><Link href="/saved">Open Saved<ArrowUpRight size={13} aria-hidden /></Link></div></div> : null}
    <p role="status" aria-live="polite" className="save-feedback">{progress.busy ? "Saving in this browser…" : progress.message}</p>
  </>
}
