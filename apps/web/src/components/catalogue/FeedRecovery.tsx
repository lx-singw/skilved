import Link from "next/link"
import { ArrowRight, Bookmark, Compass, RefreshCw } from "lucide-react"
import { parseReadQuery } from "@skilved/types/opportunities"
import { catalogueHref } from "@/lib/catalogue-query"

type Failure = "unavailable" | "invalid_query" | "invalid_cursor" | "stale_cursor"
const messages = {
  disabled: { label:"Browsing availability", title:"Public browsing is unavailable here.", description:"Public catalogue access is not enabled in this workspace. You can still read the field guide and open your browser-local Saved workspace.", meaning:"Current catalogue results have not been loaded. This is not a count of published notices.", next:"Get to know the notices, their sources and the tools available here.", action:"Read the field guide" },
  unavailable: { label:"Feed / Loading interrupted", title:"Your feed couldn’t load this time.", description:"We couldn’t load current opportunities. This does not establish that notices have closed or been removed.", meaning:"Current results could not be checked. An unavailable feed is different from an empty search.", next:"Reload these results to try again with the same valid choices.", action:"Reload opportunities" },
  stale_cursor: { label:"Feed / Results changed", title:"The results have changed", description:"The catalogue changed while you were moving through these results. Start again from the first page with the same filters.", meaning:"This continuation no longer matches the current catalogue. It does not establish that no opportunities match.", next:"Keep your choices and restart from the first results page.", action:"Restart these results" },
  invalid_cursor: { label:"Feed / Page link", title:"This results link needs a fresh search", description:"This continuation link could not be used. Start from the first page with the same valid filters.", meaning:"The page link needs a fresh start. Your valid filter choices can stay.", next:"Keep your choices and restart from the first results page.", action:"Restart these results" },
  invalid_query: { label:"Feed / Filter choices", title:"These filters could not be read", description:"Duplicate or unsupported filters cannot be used. Return to the feed and choose filters from the controls there.", meaning:"These choices could not be interpreted. No matching-results count is available.", next:"Clear the unreadable choices and begin a new search.", action:"Clear invalid filters" },
} as const

export function FeedRecovery({ reason, query, readsDisabled = false }: { reason:Failure; query:URLSearchParams; readsDisabled?:boolean }) {
  const valid = parseReadQuery(query).ok
  const kind = !valid ? "invalid_query" : readsDisabled && reason === "unavailable" ? "disabled" : reason
  const message = messages[kind]
  const href = kind === "disabled" ? "/about" : kind === "invalid_query" ? "/" : catalogueHref(query, { restart:kind === "stale_cursor" || kind === "invalid_cursor" })
  return <section className="feed-recovery-file" aria-labelledby="feed-recovery-heading" role="status">
    <div className="feed-recovery-index"><Compass size={17} aria-hidden/><span>A place to keep exploring</span></div>
    <header><p className="eyebrow">{message.label}</p><h2 id="feed-recovery-heading">{message.title}</h2><p>{message.description}</p></header>
    <dl className="feed-recovery-reading"><div><dt>What this means</dt><dd>{message.meaning}</dd></div><div><dt>Your next step</dt><dd>{message.next}</dd></div></dl>
    <div className="feed-recovery-actions">{kind === "unavailable" ? <a href={href} className="primary-button"><RefreshCw size={16} aria-hidden/>{message.action}</a> : <Link href={href} className="primary-button">{message.action}<ArrowRight size={16} aria-hidden/></Link>}<Link href="/saved"><Bookmark size={15} aria-hidden/>Open Saved</Link></div>
    <p className="feed-recovery-local">Saved references and personal stages stay in this browser. There is no account backup or cross-device sync.</p>
  </section>
}
