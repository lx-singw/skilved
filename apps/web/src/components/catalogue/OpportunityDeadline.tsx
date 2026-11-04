import { ArrowDownRight, ArrowUpRight, Clock3 } from "lucide-react"
import type { PublicOpportunity } from "@skilved/types/opportunities"
import { contextStates } from "@/lib/opportunity-context"
import { opportunityIdentity } from "@/lib/opportunity-presentation"
import { NoticeDate } from "./OpportunityIdentity"

export function ApplicationDate({ opportunity:o }: { opportunity:PublicOpportunity }) {
  const fact = o.deadline
  const deadline = fact.state === "stated" ? fact.value : null
  const sources = [...new Set(fact.citations)].flatMap(id => {
    const source = o.citations.find(item => item.id === id)
    return source ? [source] : []
  })
  return <section className={`application-date deadline-file ${opportunityIdentity[o.category].theme}`} aria-labelledby="deadline-heading">
    <header><Clock3 size={15} aria-hidden/><div><h3 id="deadline-heading" tabIndex={-1}>Closing wording & timing</h3><p>{contextStates[fact.state]}</p></div></header>
    <NoticeDate opportunity={o}/>
    {deadline?.kind === "date" ? <>
      <dl className="deadline-fields">
        <div><dt>Local closing time</dt><dd>{deadline.localTime ? <time>{deadline.localTime}</time> : "Time not stated"}</dd></div>
        <div><dt>Timezone</dt><dd>{deadline.timezone ?? "Timezone not stated"}</dd></div>
        {deadline.utcInstant && <div><dt>Recorded UTC time</dt><dd><time dateTime={deadline.utcInstant}>{deadline.utcInstant.slice(0,10)} · {deadline.utcInstant.slice(11,16)} UTC</time></dd></div>}
      </dl>
      <p className="deadline-reading-note">{!deadline.localTime ? "A calendar date is recorded without a closing time." : !deadline.timezone ? "A local time is recorded without a timezone. Confirm the zone before relying on it." : "Read the local time and timezone together. No conversion to your device’s timezone is applied."}</p>
    </> : <p className="deadline-reading-note">{deadline?.kind === "open_until_filled" ? "The notice says applications continue until filled. No fixed closing date is recorded; this wording does not confirm that places remain available." : fact.state === "conflicting" ? "The recorded sources disagree. No single closing date or time is established here." : fact.state === "ambiguous" ? "The closing wording needs clarification. No single closing date or time is established here." : "A closing date is not stated in the reviewed notice."}</p>}
    <details className="deadline-source"><summary aria-label="Read closing wording and sources"><span>Wording & sources<small>{sources.length ? `${sources.length} reference${sources.length===1?"":"s"} for this timing` : "No source reference recorded"}</small></span><ArrowDownRight size={14} aria-hidden/></summary>
      <div><p>{fact.originalText ? `Wording in the notice: ${fact.originalText}` : "No separate source wording is recorded for this timing."}</p>
        {deadline?.originalText && deadline.originalText !== fact.originalText && <p>Recorded deadline wording: {deadline.originalText}</p>}
        {sources.length ? <ul>{sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer noopener"><span>{source.label}<small>{new URL(source.url).hostname}</small></span><ArrowUpRight size={13} aria-hidden/></a></li>)}</ul> : <p>No public source reference is available here for this timing.</p>}
        <a className="deadline-evidence-link" href="#evidence">Read the separate evidence checks<ArrowDownRight size={13} aria-hidden/></a>
      </div>
    </details>
    <p className="deadline-status-note">The date wording and intake status are separate. Read the current application information below.</p>
  </section>
}
