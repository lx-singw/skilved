"use client"
import Link from "next/link"
import { useState } from "react"
import { useSuggestions } from "@/lib/use-suggestions"

const button = "min-h-11 rounded-md border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
const labels = { received: "Received for review", reviewing: "Being reviewed", resolved_to_listing: "Current public results available", unresolved: "No result confirmed", unsupported: "Unsupported link", paused: "Review paused", withdrawn: "Withdrawn" }
type Confirmation = { type: "clear" | "forget" | "withdraw"; id?: string; token: string | null } | null
export function Suggestions({ enabled, intakeEnabled }: { enabled: boolean; intakeEnabled: boolean }) {
  const session = useSuggestions(), [url, setUrl] = useState(""), [confirm, setConfirm] = useState<Confirmation>(null)
  const snapshot = session.view && "snapshot" in session.view ? session.view.snapshot : null
  const token = snapshot?.token ?? null, ready = !!snapshot && !session.busy
  const readable = session.view?.status === "ready" || session.view?.status === "saved"
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!ready || !enabled || !intakeEnabled) return
    await session.action({ type: "submit", url }, token); setUrl("")
  }
  return <div className="mt-5 space-y-7">
    <p className="leading-relaxed text-muted-foreground">Share one supported public notice link for review. Do not send contact details, documents, login links or application answers. A suggestion is not an application, proof of eligibility or a promise of publication or response time.</p>
    <p className="text-sm text-muted-foreground">Private access is saved only in this browser. People using this browser may see it. There is no account backup or cross-device sync. Clearing browser data can permanently lose access; the public link cannot recover it.</p>
    {!enabled ? <p role="note" className="rounded-lg border border-border p-4">Suggestions are currently unavailable. You can still forget access stored in this browser.</p>
      : !intakeEnabled && <p role="note" className="rounded-lg border border-border p-4">New suggestions and retries are paused. Existing receipt status and withdrawal can still be checked.</p>}
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-5" aria-label="Suggest a link">
      <label htmlFor="suggestion-url" className="block font-medium">Public HTTPS notice link</label>
      <input id="suggestion-url" type="url" required maxLength={2048} autoComplete="off" value={url} onChange={event => setUrl(event.target.value)}
        disabled={!ready || !enabled || !intakeEnabled} aria-describedby="suggestion-url-help" className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2" />
      <p id="suggestion-url-help" className="text-sm text-muted-foreground">Use a clean public notice link without query parameters or a fragment. Some valid links are not yet supported. We do not fetch arbitrary sites or submit applications.</p>
      <button type="submit" className={button} disabled={!ready || !enabled || !intakeEnabled}>Suggest link for review</button>
    </form>
    <p role="status" aria-live="polite" className="min-h-6 text-sm">{session.busy ? "Checking this request. Saved access is confirmed only after storage commits…" : session.message}</p>
    {session.publicIds.length > 0 && <div className="space-y-2"><h2 className="text-lg font-semibold">Review current public results</h2>{session.publicIds.map((id, index) => <Link key={id} href={`/opportunities/${id}`} className="block text-primary underline">Public result {index + 1}</Link>)}</div>}
    <section aria-labelledby="private-receipts-heading" className="space-y-4">
      <h2 id="private-receipts-heading" className="text-xl font-semibold">Your private receipts in this browser</h2>
      {!session.view ? <p role="status">Loading private access…</p> : !readable ? <div className="space-y-3">
        <p>{session.view.status === "unreadable" ? "Stored access cannot be read. It has not been reset. Explicit receipt clear will discard it."
          : session.view.status === "conflict" ? "Access changed in another action or tab. Reload and review before trying again."
          : "Browser storage is unavailable. We cannot confirm saved access."}</p>
        <button type="button" className={button} disabled={session.busy} onClick={() => { void session.reload() }}>Reload receipts</button>
      </div> : snapshot?.items.length === 0 ? <p>No private receipts in this browser. Lost access cannot be recovered from a public link.</p> : snapshot?.items.map((item, index) => {
        const expired = item.kind !== "draft" && (item.kind === "receipt" ? item.access.expiresAt : item.expiresAt) <= new Date().toISOString()
        const status = session.statuses[item.id]
        return <article key={item.id} aria-label={`Receipt ${index + 1}`} className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold">Receipt {index + 1}</h3>
          <p className="text-sm">{expired ? "Access or retry expired. Keep or forget this local reference."
            : item.kind === "draft" ? "Ticket not confirmed. No create request was sent. Retry explicitly when available."
            : item.kind === "pending" ? "Create response not confirmed. Retry uses this entry’s saved ticket; do not submit the same link again to recover it."
            : "Private access saved. Status is checked only when you choose Refresh status."}</p>
          {item.kind !== "draft" && <p className="text-sm text-muted-foreground">Expires <time dateTime={item.kind === "receipt" ? item.access.expiresAt : item.expiresAt}>{new Date(item.kind === "receipt" ? item.access.expiresAt : item.expiresAt).toLocaleString("en-ZA")}</time></p>}
          {status && <div className="space-y-2"><p>{labels[status.status]}</p><p className="text-sm text-muted-foreground">Last checked response reflects server updates through <time dateTime={status.updatedAt}>{new Date(status.updatedAt).toLocaleString("en-ZA")}</time>. It does not confirm an application.</p>
            {status.publicResultIds.map((id, i) => <Link key={id} href={`/opportunities/${id}`} className="block text-primary underline">Review public result {i + 1}</Link>)}
          </div>}
          <div className="flex flex-wrap gap-2">
            {item.kind === "receipt" ? <><button type="button" className={button} disabled={!ready || !enabled || expired} onClick={() => { void session.action({ type: "status", id: item.id }, token) }}>Refresh status</button>
              <button type="button" className={button} disabled={!ready || !enabled || expired} onClick={() => setConfirm({ type: "withdraw", id: item.id, token })}>Withdraw suggestion</button></>
              : <button type="button" className={button} disabled={!ready || !enabled || !intakeEnabled || expired} onClick={() => { void session.action({ type: "retry", id: item.id }, token) }}>Retry this entry</button>}
            <button type="button" className={button} disabled={!ready} onClick={() => setConfirm({ type: "forget", id: item.id, token })}>Forget local access</button>
          </div>
        </article>
      })}
      {(readable || session.view?.status === "unreadable") && <button type="button" className={button} disabled={session.busy} onClick={() => setConfirm({ type: "clear", token })}>Clear receipt access</button>}
      <p className="text-sm text-muted-foreground">Forgetting or clearing local access does not withdraw a server suggestion, remove public facts or clear saved opportunity progress. Server access can expire, and review may remain unresolved.</p>
    </section>
    {confirm && <section role="alert" className="space-y-3 rounded-lg border border-border p-5">
      <h2 className="font-semibold">{confirm.type === "withdraw" ? "Withdraw this suggestion?" : "Discard private local access?"}</h2>
      <p>{confirm.type === "withdraw" ? "This asks the server to revoke your receipt and stop its participation in review. Other people’s suggestions and public facts remain. Success requires server acknowledgement."
        : "This cannot be undone in this browser. You may lose the ability to check or withdraw this suggestion. It sends no withdrawal request and does not clear saved opportunity progress."}</p>
      <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={session.busy} onClick={() => { const action = confirm; setConfirm(null); void session.action(action.type === "clear" ? { type: "clear" } : { type: action.type, id: action.id! }, action.token) }}>{confirm.type === "withdraw" ? "Confirm server withdrawal" : "Confirm local discard"}</button>
        <button type="button" className={button} disabled={session.busy} onClick={() => setConfirm(null)}>Keep access</button></div>
    </section>}
  </div>
}
