"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useLocalProgress } from "@/lib/use-local-progress"
import { readSavedSummary, type SavedSummary } from "@/lib/saved-summary"

const button = "min-h-11 rounded-md border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
type Progress = ReturnType<typeof useLocalProgress>

function ProgressNotice({ progress }: { progress: Progress }) {
  const status = progress.view?.status
  return <>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Saved progress stays in this browser. Clearing this site’s data or changing devices can lose your saved list. People using this browser may see it. There is no account backup or cross-device sync.</p>
    <p className="mt-2 text-sm text-muted-foreground">Saving is a personal reminder. It does not confirm eligibility or submission. Checklist ticks remain temporary.</p>
    <p role="status" aria-live="polite" className="mt-3 text-sm">{progress.busy ? "Updating saved progress…" : progress.message || (!status ? "Loading saved progress…" : status === "unreadable" ? "Saved progress cannot be read. Its data has not been reset; reload or explicitly clear it below." : status === "unavailable" ? "Browser storage is unavailable. We cannot confirm your saved progress." : "")}</p>
    {status && !["ready", "saved"].includes(status) && <button type="button" className={`${button} mt-3`} onClick={() => { void progress.reload() }} disabled={progress.busy}>Reload saved progress</button>}
  </>
}

export function SaveOpportunity({ id, revision }: { id: string; revision: number }) {
  const progress = useLocalProgress(), [copyMessage, setCopyMessage] = useState("")
  const snapshot = progress.view && "snapshot" in progress.view ? progress.view.snapshot : null
  const saved = snapshot?.items.some(item => item.opportunityId === id)
  async function copy() {
    try { await navigator.clipboard.writeText(new URL(`/opportunities/${id}`, location.origin).href); setCopyMessage("Public link copied. Personal progress is not included.") }
    catch { setCopyMessage("Copy was unavailable. Use the address bar to keep the public link instead.") }
  }
  return <section className="mt-8 rounded-xl border border-border bg-card p-6" aria-labelledby="save-heading">
    <h2 id="save-heading" className="text-xl font-semibold">Keep this opportunity</h2>
    <ProgressNotice progress={progress} />
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" className={button} disabled={!snapshot || progress.busy} onClick={() => { void progress.change(saved ? { type: "remove", id } : { type: "save", id, revision }) }}>{saved ? "Remove from saved" : "Save in this browser"}</button>
      <Link href="/saved" className={`${button} text-primary underline`}>View saved opportunities</Link>
      <button type="button" className={button} onClick={() => { void copy() }}>Copy public link</button>
    </div>
    {copyMessage && <p role="status" className="mt-3 text-sm">{copyMessage}</p>}
  </section>
}

function SavedItem({ id, savedAt, busy, remove }: { id: string; savedAt: string; busy: boolean; remove: () => void }) {
  const [summary, setSummary] = useState<SavedSummary | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void readSavedSummary(id, controller.signal).then(result => { if (!controller.signal.aborted) setSummary(result) })
    return () => controller.abort()
  }, [id])
  const title = summary?.kind === "current" ? summary.title : "Saved opportunity"
  return <li className="rounded-xl border border-border p-5">
    <h2 className="break-words text-lg font-semibold"><Link href={`/opportunities/${id}`} className="text-primary underline">{title}</Link></h2>
    <p className="mt-2 text-xs text-muted-foreground">Saved in this browser <time dateTime={savedAt}>{new Date(savedAt).toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" })}</time></p>
    <p className="mt-2 text-sm text-muted-foreground">{!summary ? "Loading current public details…" : summary.kind === "current" ? summary.state === "closed" ? "This intake is closed. Your saved reference is retained." : "Open details to check current conditions and the issuer’s application route." : summary.kind === "restricted" ? "This listing is unavailable or under review. No application action is offered here." : summary.kind === "missing" ? "No current public listing was found. Your saved reference is retained." : "Current details could not be loaded. Open the reference to try again."}</p>
    <button type="button" className={`${button} mt-3`} aria-label={`Remove ${title}`} disabled={busy} onClick={remove}>Remove</button>
  </li>
}

export function SavedOpportunities() {
  const progress = useLocalProgress(), [confirmClear, setConfirmClear] = useState(false), [limit, setLimit] = useState(20)
  const snapshot = progress.view && "snapshot" in progress.view ? progress.view.snapshot : null
  const canClear = snapshot ? snapshot.items.length > 0 : progress.view?.status === "unreadable"
  return <>
    <ProgressNotice progress={progress} />
    <button type="button" className={`${button} mt-4`} onClick={() => { void progress.reload() }} disabled={progress.busy}>Refresh saved list</button>
    {snapshot && (snapshot.items.length ? <>
      <ul className="mt-6 space-y-4">{snapshot.items.slice(0, limit).map(item => <SavedItem key={item.opportunityId} id={item.opportunityId} savedAt={item.savedAt} busy={progress.busy} remove={() => { void progress.change({ type: "remove", id: item.opportunityId }) }} />)}</ul>
      {snapshot.items.length > limit && <button type="button" className={`${button} mt-4`} onClick={() => setLimit(value => value + 20)}>Show more saved opportunities</button>}
    </> : <p className="mt-6">No saved opportunities in this browser.</p>)}
    {canClear && !confirmClear && <button type="button" className={`${button} mt-6`} disabled={progress.busy} onClick={() => setConfirmClear(true)}>Clear saved progress</button>}
    {confirmClear && <section className="mt-6 rounded-lg border border-border p-4" aria-labelledby="clear-heading">
      <h2 id="clear-heading" className="font-semibold">Clear all saved progress in this browser?</h2>
      <p className="mt-2 text-sm">This removes saved opportunities and personal stages in this browser. It cannot be undone here. Other site data and separate receipt access are not cleared.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" className={button} disabled={progress.busy} onClick={() => { setConfirmClear(false); void progress.change("clear") }}>Confirm clear saved progress</button>
        <button type="button" className={button} disabled={progress.busy} onClick={() => setConfirmClear(false)}>Keep saved progress</button>
      </div>
    </section>}
  </>
}
