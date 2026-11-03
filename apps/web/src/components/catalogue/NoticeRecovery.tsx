import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Bookmark, Compass, FileQuestion, RefreshCw, ScanLine } from "lucide-react"
import { catalogueReturnHref } from "@/lib/catalogue-query"

type RecoveryKind = "missing" | "error" | "unavailable" | "under_review" | "unpublished"

const messages = {
  missing: { label: "Page not found / 404", title: "This path doesn’t lead to a page.", description: "We couldn’t find a page at this address. That alone doesn’t tell you whether an opportunity has closed or been removed.", known: "No page found at this address", next: "Check the address, or start again from the feed.", symbol: "404" },
  error: { label: "Page interrupted", title: "This page didn’t finish loading.", description: "We couldn’t show the page this time. You can try again, or return to the feed and keep exploring.", known: "The page could not be displayed", next: "Try loading the page again. If it keeps failing, return to the feed.", symbol: "↻" },
  unavailable: { label: "Notice / Load interrupted", title: "We couldn’t load this opportunity.", description: "Its current details and application route could not be checked. This does not establish that the listing has closed or been removed.", known: "Current details could not be checked", next: "Try loading these details again, or return to your results.", symbol: "…" },
  under_review: { label: "Notice / Under review", title: "This opportunity needs a fresh check.", description: "This listing is under review on Skilved. The application link is unavailable while it needs a fresh check. This does not establish that the issuer has closed its intake.", known: "The listing is under review", next: "Return to the feed for other published notices. You can revisit this address later.", symbol: "Ⅱ" },
  unpublished: { label: "Notice / No longer published", title: "This listing is no longer available.", description: "This notice is no longer published on Skilved, and its application link is unavailable here. This status alone does not establish the issuer’s current intake dates.", known: "The listing is no longer published", next: "Return to the feed to explore currently published notices.", symbol: "—" },
} as const

/** Reading and recovery only: no storage access, automatic retry or application action. */
export function RecoveryPanel({ kind, backHref = "/", hasResults = false, action }: { kind: RecoveryKind; backHref?: string; hasResults?: boolean; action?: ReactNode }) {
  const message = messages[kind]
  const notice = kind === "unavailable" || kind === "under_review" || kind === "unpublished"
  return <main id="main-content" className="workspace recovery-workspace">
    <Link href={backHref} className="recovery-back"><ArrowLeft size={16} aria-hidden />{hasResults ? "Back to results" : "Back to the feed"}</Link>
    <div className="recovery-file">
      <div className="recovery-index"><span>Skilved / Keep your bearings</span><span aria-hidden>{message.symbol}</span></div>
      <div className="recovery-opening">
        <div className="recovery-mark" aria-hidden>{notice ? <ScanLine size={30} /> : <FileQuestion size={30} />}</div>
        <p className="eyebrow">{message.label}</p><h1>{message.title}</h1><p className="recovery-description">{message.description}</p>
        <div className="recovery-actions">{action}<Link href={backHref} className={action ? "recovery-secondary" : "primary-button"}>{hasResults ? "Return to these results" : "Explore the feed"}<ArrowRight size={16} aria-hidden /></Link></div>
      </div>
      <dl className="recovery-reading"><div><dt>What we know</dt><dd>{message.known}</dd></div><div><dt>Your next step</dt><dd>{message.next}</dd></div>{notice && <div><dt>Application route</dt><dd>No application action is available on this screen.</dd></div>}</dl>
    </div>
    <section className="recovery-ways" aria-labelledby="recovery-ways-heading"><p className="eyebrow">A way forward</p><h2 id="recovery-ways-heading">Pick up from here.</h2>
      <div className="recovery-destinations"><Link href="/saved"><Bookmark size={22} aria-hidden /><span><strong>Revisit your shortlist</strong><small>Open references and personal stages saved in this browser.</small></span><ArrowRight size={17} aria-hidden /></Link><Link href="/about"><Compass size={22} aria-hidden /><span><strong>Find your bearings</strong><small>A guide to notices, sources and making your next move.</small></span><ArrowRight size={17} aria-hidden /></Link></div>
      <p className="recovery-storage">Saved is local to this browser, with no account backup or cross-device sync. A saved reference is not a current copy of a notice.</p>
    </section>
  </main>
}

export function NoticeRecovery({ id, from, state }: { id: string; from: string | string[] | undefined; state: "unavailable" | "under_review" | "withdrawn" | "archived" }) {
  const back = catalogueReturnHref(from, id)
  const retry = `/opportunities/${encodeURIComponent(id)}${back ? `?${new URLSearchParams({ from: back.split("#")[0] })}` : ""}`
  return <RecoveryPanel kind={state === "withdrawn" || state === "archived" ? "unpublished" : state} backHref={back ?? "/"} hasResults={!!back}
    action={state === "unavailable" ? <a href={retry} className="primary-button"><RefreshCw size={16} aria-hidden />Try loading these details again</a> : undefined} />
}
