"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"

type Feedback = { kind: "error" | "received"; message: string } | null

export function OpportunityReport({ id }: { id: string }) {
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const pending = useRef(false)
  const status = useRef<HTMLParagraphElement>(null)

  useEffect(() => { if (feedback) status.current?.focus() }, [feedback])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    const form = event.currentTarget
    const data = new FormData(form)
    const kind = String(data.get("kind") ?? "")
    const text = String(data.get("text") ?? "").trim()
    if (!["incorrect", "closed", "unsafe_destination", "other"].includes(kind) || !text || text.length > 1500) {
      setFeedback({ kind: "error", message: "Choose an issue and add a short description, up to 1,500 characters." })
      return
    }
    pending.current = true
    setSending(true)
    setFeedback(null)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    try {
      const response = await fetch("/api/v1/reports", { method: "POST", credentials: "omit", cache: "no-store",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ opportunityId: id, kind, text }), signal: controller.signal })
      const body: unknown = await response.json().catch(() => null)
      if (response.status === 202 && body && typeof body === "object" && "status" in body && body.status === "received") {
        form.reset()
        setFeedback({ kind: "received", message: "Report received. It has been added to the review queue. This confirms receipt, not that the issue has been verified or resolved." })
      } else {
        setFeedback({ kind: "error", message: response.status === 429 ? "Reporting is busy right now. Please try again later." : response.status === 400 || response.status === 413 ? "The report could not be accepted. Check your description and try again." : "Reporting is temporarily unavailable. Please try again later." })
      }
    } catch {
      setFeedback({ kind: "error", message: "We couldn’t confirm receipt. You can retry, but an earlier report may already have arrived. Keep your description here until you are ready." })
    } finally { clearTimeout(timeout); pending.current = false; setSending(false) }
  }

  return <section className="mt-8 border-t border-border pt-6" aria-labelledby="report-heading">
    <h2 id="report-heading" className="text-xl font-semibold">Something needs checking?</h2>
    <details className="mt-3 rounded-xl border border-border bg-card">
      <summary className="min-h-11 cursor-pointer px-4 py-3 font-medium">Report an issue with this opportunity</summary>
      <div className="px-4 pb-5">
        <p id="report-privacy" className="text-sm leading-relaxed text-muted-foreground">Tell us about incorrect details, a closed intake, a suspicious link or a payment request. Do not include ID numbers, passwords, contact details or documents. Reports are reviewed privately.</p>
        <p ref={status} tabIndex={-1} role={feedback?.kind === "error" ? "alert" : "status"} className="mt-4 text-sm leading-relaxed focus:outline-none">{feedback?.message}</p>
        {feedback?.kind !== "received" && <form method="post" action="/api/v1/reports" onSubmit={submit} className="mt-4 space-y-4" aria-describedby="report-privacy" autoComplete="off">
          <noscript><p className="text-sm text-muted-foreground">Enable JavaScript to send a report from this form.</p></noscript>
          <div><label htmlFor="report-kind" className="text-sm font-medium">What needs checking?</label>
            <select id="report-kind" name="kind" required defaultValue="" disabled={sending} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-background px-3 py-2">
              <option value="" disabled>Choose an issue</option>
              <option value="incorrect">Incorrect or unclear information</option>
              <option value="closed">The intake appears closed</option>
              <option value="unsafe_destination">Suspicious link or payment request</option>
              <option value="other">Another issue</option>
            </select></div>
          <div><label htmlFor="report-text" className="text-sm font-medium">Brief description</label>
            <textarea id="report-text" name="text" required maxLength={1500} rows={4} disabled={sending} aria-describedby="report-length" className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2" />
            <p id="report-length" className="mt-2 text-xs text-muted-foreground">Up to 1,500 characters. No personal details or attachments.</p></div>
          <button type="submit" disabled={sending} className="min-h-11 rounded-md bg-primary px-5 py-2 font-medium text-primary-foreground disabled:opacity-60">{sending ? "Sending report…" : "Send report"}</button>
        </form>}
      </div>
    </details>
  </section>
}
