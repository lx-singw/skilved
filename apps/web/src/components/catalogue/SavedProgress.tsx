"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useLocalProgress } from "@/lib/use-local-progress"
import { createSavedSummaryReader, type SavedSummary } from "@/lib/saved-summary"
import { checkSavedIdentity } from "@/lib/saved-identity"
import { LocalProgressStageSchema, type LocalProgressItem } from "@skilved/types/opportunities"

const button = "min-h-11 rounded-md border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
type Progress = ReturnType<typeof useLocalProgress>
const stages: Record<LocalProgressItem["userStage"], string> = { interested: "Interested", preparing: "Preparing", applied_reported: "Applied — marked by you", not_pursuing: "No longer pursuing" }

function LocalTime({ value }: { value: string }) {
  return <time dateTime={value}>{new Date(value).toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" })}</time>
}

function PersonalProgress({ item, busy, change }: { item: LocalProgressItem; busy: boolean; change: Progress["change"] }) {
  return <div className="mt-4 space-y-3">
    <label className="block text-sm font-medium" htmlFor={`personal-stage-${item.opportunityId}`}>Personal stage</label>
    <select id={`personal-stage-${item.opportunityId}`} value={item.userStage} disabled={busy} className="min-h-11 max-w-full rounded-md border border-border bg-background px-3 py-2 text-sm" onChange={event => {
      const stage = LocalProgressStageSchema.safeParse(event.target.value)
      if (stage.success) void change({ type: "stage", id: item.opportunityId, stage: stage.data })
    }}>
      {Object.entries(stages).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
    <p className="text-sm text-muted-foreground">These are your personal notes about progress, not an issuer’s records. You can change your stage.</p>
    {item.userStage === "applied_reported" && item.reportedAppliedAt && <p className="text-sm">Applied — marked by you <LocalTime value={item.reportedAppliedAt} />. Skilved has not confirmed submission.</p>}
    <p className="text-sm text-muted-foreground">{item.lastRouteOpenedAt ? <>Last route-opening action recorded <LocalTime value={item.lastRouteOpenedAt} />. This does not confirm that the issuer’s page loaded or that you submitted.</> : "No route-opening action is recorded in this browser."}</p>
  </div>
}

export function SavedRevision({ item, id, revision, busy, change, canAcknowledge = false, alsoSaved = false }: { item: LocalProgressItem; id: string; revision: number; busy: boolean; change: Progress["change"]; canAcknowledge?: boolean; alsoSaved?: boolean }) {
  if (id !== item.opportunityId) return <div className="mt-3 space-y-2 text-sm">
    <p>This saved reference currently resolves to another listing. Your personal progress stays with the original reference; it has not been moved or combined.</p>
    {alsoSaved && <p>You also saved the current listing. Both sets of personal progress are retained separately.</p>}
    <Link href={`/opportunities/${id}`} className="text-primary underline">Review the current listing</Link>
  </div>
  if (revision === item.lastViewedRevision) return null
  return <div className="mt-3 space-y-2 text-sm" role="note">
    <p>The public details differ from the version you last saved or marked reviewed. Your personal stage and history have been retained. Check the current conditions and application instructions.</p>
    {canAcknowledge ? <button type="button" className={button} disabled={busy} onClick={() => { void change({ type: "acknowledge_revision", id, revision }) }}>Mark these details as reviewed</button>
      : <Link href={`/opportunities/${id}`} className="text-primary underline">Review changed details</Link>}
  </div>
}

export function SavedIdentityReview({ item, target, revision, token, busy, change }: { item: LocalProgressItem; target: LocalProgressItem; revision: number; token: string | null; busy: boolean; change: Progress["change"] }) {
  const [open, setOpen] = useState(false), [confirm, setConfirm] = useState(false), [checking, setChecking] = useState(false), [message, setMessage] = useState("")
  async function match() {
    if (checking || busy) return
    setChecking(true); setMessage("")
    const valid = await checkSavedIdentity(item.opportunityId, target.opportunityId, revision)
    setChecking(false); setConfirm(false)
    if (!valid) { setMessage("The current relationship or details could not be confirmed. Check current public details and review both references again. No stage change was requested."); return }
    await change({ type: "match_stage", id: target.opportunityId, fromId: item.opportunityId }, token)
  }
  return <section className="mt-4 rounded-lg border border-border p-4" aria-label="Compare saved progress">
    <button type="button" className={button} disabled={busy || checking} onClick={() => { setOpen(value => !value); setConfirm(false); setMessage("") }}>Compare these saved references</button>
    {open && <div className="mt-3 space-y-3 text-sm">
      <p>These references currently lead to the same public listing. Their personal progress can remain separate. Matching a stage does not combine saved dates or route history.</p>
      <dl className="space-y-2">
        <dt className="font-medium">Original reference</dt><dd>{stages[item.userStage]} · Saved <LocalTime value={item.savedAt} />{item.reportedAppliedAt && <> · Personal Applied report <LocalTime value={item.reportedAppliedAt} /></>}{item.lastRouteOpenedAt && <> · Route action <LocalTime value={item.lastRouteOpenedAt} /></>}</dd>
        <dt className="font-medium">Current listing reference</dt><dd>{stages[target.userStage]} · Saved <LocalTime value={target.savedAt} />{target.reportedAppliedAt && <> · Personal Applied report <LocalTime value={target.reportedAppliedAt} /></>}{target.lastRouteOpenedAt && <> · Route action <LocalTime value={target.lastRouteOpenedAt} /></>}</dd>
      </dl>
      <p>Applied is a personal report, not confirmed submission. Earlier report times may remain in each reference’s history after changing stage.</p>
      <button type="button" className={button} disabled={busy || checking} onClick={() => { setOpen(false); setConfirm(false); setMessage("Keep editing each reference separately. No changes were requested.") }}>Keep progress separate</button>
      {item.userStage === target.userStage ? <p>Both personal stages already match. Their separate histories are retained.</p> : <button type="button" className={button} disabled={busy || checking} onClick={() => setConfirm(true)}>Use original stage for current listing</button>}
      {confirm && <div className="space-y-3 rounded-md border border-border p-3">
        <p>Change only the current listing’s stage from {stages[target.userStage]} to {stages[item.userStage]}? Both references, saved dates and route history stay separate. The original is unchanged.{item.userStage === "applied_reported" && " This records a new personal Applied report now for the current listing; it does not copy the original report time or confirm submission."}</p>
        <button type="button" className={button} disabled={busy || checking} onClick={() => { void match() }}>Confirm stage match</button>
        <button type="button" className={button} disabled={busy || checking} onClick={() => setConfirm(false)}>Cancel stage match</button>
      </div>}
    </div>}
    {(checking || message) && <p role="status" className="mt-3 text-sm">{checking ? "Checking the current public relationship…" : message}</p>}
  </section>
}

export function ApplicationRouteLink({ id, revision, email = false }: { id: string; revision: number; email?: boolean }) {
  const progress = useLocalProgress()
  const historyUnavailable = progress.view && !["ready", "saved", "not_saved"].includes(progress.view.status)
  async function record() {
    // Native navigation happens immediately; this best-effort local action never blocks it.
    await progress.reload()
    await progress.change({ type: "route_opened", id })
  }
  return <>
    <a href={`/opportunities/${id}/apply?revision=${revision}`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground" onClick={record} onAuxClick={event => { if (event.button === 1) void record() }}>{email ? "Open email application route" : "Apply at the original source"} →</a>
    <p className="mt-3 text-sm text-muted-foreground">Opens separately. For saved opportunities, we try to record when you select this route in this browser. The action does not change your personal stage or confirm submission.</p>
    {(progress.busy || progress.message || historyUnavailable) && <p role="status" aria-live="polite" className="mt-2 text-sm">{progress.busy ? "Updating local route history…" : progress.message || "We couldn’t confirm a local route record. The link above still checks current application details."}</p>}
  </>
}

function ProgressNotice({ progress }: { progress: Progress }) {
  const status = progress.view?.status
  return <>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Saved progress stays in this browser. Clearing this site’s data or changing devices can lose your saved list. People using this browser may see it. There is no account backup or cross-device sync.</p>
    <p className="mt-2 text-sm text-muted-foreground">Saving is a personal reminder. It does not confirm eligibility or submission. Checklist ticks remain temporary.</p>
    <p role="status" aria-live="polite" className="mt-3 text-sm">{progress.busy ? "Updating saved progress…" : progress.message || (!status ? "Loading saved progress…" : status === "unreadable" ? progress.view?.status === "unreadable" && progress.view.reason === "unsupported_version" ? "Saved progress uses a different format that this version cannot read. Its data has not been reset; use a compatible version or explicitly clear it from the saved list." : "Saved progress data cannot be read. Its data has not been reset; reload or explicitly clear it from the saved list." : status === "unavailable" ? "Browser storage is unavailable. We cannot confirm your saved progress." : "")}</p>
    {status && !["ready", "saved"].includes(status) && <button type="button" className={`${button} mt-3`} onClick={() => { void progress.reload() }} disabled={progress.busy}>Reload saved progress</button>}
  </>
}

export function SaveOpportunity({ id, revision }: { id: string; revision: number }) {
  const progress = useLocalProgress(), [copyMessage, setCopyMessage] = useState("")
  const snapshot = progress.view && "snapshot" in progress.view ? progress.view.snapshot : null
  const saved = snapshot?.items.find(item => item.opportunityId === id)
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
    {saved && <>
      <SavedRevision item={saved} id={id} revision={revision} busy={progress.busy} change={progress.change} canAcknowledge />
      <PersonalProgress item={saved} busy={progress.busy} change={progress.change} />
    </>}
    {copyMessage && <p role="status" className="mt-3 text-sm">{copyMessage}</p>}
  </section>
}

function SavedItem({ item, items, token, busy, change, remove }: { item: LocalProgressItem; items: LocalProgressItem[]; token: string | null; busy: boolean; change: Progress["change"]; remove: () => void }) {
  const { opportunityId: id, savedAt } = item
  const [summary, setSummary] = useState<SavedSummary | null>(null)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    const reader = createSavedSummaryReader(setSummary)
    const read = () => { void reader.refresh(id) }
    const visible = () => { if (document.visibilityState === "visible") read() }
    read(); window.addEventListener("focus", read); window.addEventListener("pageshow", read); document.addEventListener("visibilitychange", visible)
    return () => { reader.dispose(); window.removeEventListener("focus", read); window.removeEventListener("pageshow", read); document.removeEventListener("visibilitychange", visible) }
  }, [id, refresh])
  const title = summary?.kind === "current" ? summary.title : "Saved opportunity"
  const other = summary && "id" in summary && summary.id !== id ? items.find(entry => entry.opportunityId === summary.id) : undefined
  return <li className="rounded-xl border border-border p-5">
    <h2 className="break-words text-lg font-semibold"><Link href={`/opportunities/${id}`} className="text-primary underline">{title}</Link></h2>
    <p className="mt-2 text-xs text-muted-foreground">Saved in this browser <LocalTime value={savedAt} /></p>
    <p className="mt-2 text-sm text-muted-foreground">{!summary ? "Loading current public details…" : summary.kind === "current" ? summary.state === "closed" ? "This intake is closed. Your saved reference is retained." : "Open details to check current conditions and the issuer’s application route." : summary.kind === "restricted" ? "This listing is unavailable or under review. No application action is offered here." : summary.kind === "missing" ? "No current public listing was found. Your saved reference is retained." : "Current details could not be loaded. Open the reference to try again."}</p>
    {summary && "id" in summary && <SavedRevision item={item} id={summary.id} revision={summary.revision} busy={busy} change={change} alsoSaved={items.some(other => other.opportunityId === summary.id)} />}
    {other && summary && "revision" in summary && <SavedIdentityReview key={`${id}:${other.opportunityId}:${summary.revision}:${token}`} item={item} target={other} revision={summary.revision} token={token} busy={busy} change={change} />}
    <button type="button" className={`${button} mt-3`} onClick={() => setRefresh(value => value + 1)}>Check current public details</button>
    <PersonalProgress item={item} busy={busy} change={change} />
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
      <ul className="mt-6 space-y-4">{snapshot.items.slice(0, limit).map(item => <SavedItem key={item.opportunityId} item={item} items={snapshot.items} token={snapshot.token} busy={progress.busy} change={progress.change} remove={() => { void progress.change({ type: "remove", id: item.opportunityId }) }} />)}</ul>
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
