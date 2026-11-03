import { ArrowDownRight, ArrowUpRight, Banknote, BedDouble, BookOpen, Bus, CircleHelp, GraduationCap, HandCoins, Wallet } from "lucide-react"
import type { PublicOpportunity } from "@skilved/types/opportunities"
import { opportunityIdentity, supportAmount, supportLabels, supportNumber } from "@/lib/opportunity-presentation"

type SupportFact = PublicOpportunity["compensation"][number]
const icons = { salary:Banknote, stipend:Wallet, tuition:GraduationCap, books:BookOpen, accommodation:BedDouble, transport:Bus, allowance:HandCoins, other:CircleHelp }
const periods = { hour:"Per hour", day:"Per day", week:"Per week", month:"Per month", year:"Per year", once:"Once", programme:"For the programme", not_stated:"Period not stated" }
const states = { stated:"Stated in the notice", not_stated:"Not stated", ambiguous:"Needs clarification", conflicting:"Sources disagree" }
const headings = { bursary:"Read the funding picture.", learnership:"Support through the learning.", apprenticeship:"Pay and training support.", internship:"Support for the placement.", graduate_programme:"Programme pay and support.", job:"Pay and benefits, in detail." }

export function SupportEntry({ fact, index, citations }: { fact:SupportFact; index:number; citations:PublicOpportunity["citations"] }) {
  const value = fact.state === "stated" ? fact.value : null
  const Icon = value ? icons[value.kind] : CircleHelp
  const pricedAmount = value ? supportAmount(value) : null
  const amountText = pricedAmount ?? (value && value.amount !== null ? `${supportNumber(value.amount)}${value.maximum !== null && value.maximum !== value.amount ? `–${supportNumber(value.maximum)}` : ""} · currency not stated` : "Amount not stated")
  const references = [...new Set(fact.citations)].flatMap(id => { const source=citations.find(item=>item.id===id);return source?[source]:[] })
  const title = value ? `${supportLabels[value.kind]} · ${periods[value.period]}` : `Support entry ${index+1}`
  return <li className={`support-ledger-item support-state-${fact.state}`}>
    <header className="support-entry-heading"><span className="support-entry-mark" aria-hidden><Icon size={19}/><small>{String(index+1).padStart(2,"0")}</small></span><div><h3 id={`support-entry-${index+1}`} tabIndex={-1}>{title}</h3><p className="support-entry-state">{states[fact.state]}</p></div></header>
    {value ? <>
      <div className={`support-ledger-value ${pricedAmount ? "" : "support-amount-unknown"}`}><p>Amount in this entry</p><strong>{amountText}</strong></div>
      <dl className="support-terms">
        <div><dt>Recorded amount</dt><dd>{value.amount === null ? "Amount not stated" : supportNumber(value.amount)}</dd></div>
        {value.maximum !== null && <div><dt>Recorded maximum</dt><dd>{supportNumber(value.maximum)}</dd></div>}
        <div><dt>Currency</dt><dd>{value.currency ?? "Currency not stated"}</dd></div><div><dt>Period</dt><dd>{periods[value.period]}</dd></div>
        <div className="support-coverage"><dt>Coverage in this entry</dt><dd>{value.coverage ?? "Coverage not stated"}</dd></div>
      </dl>
    </> : <p className="support-entry-limit">{fact.state === "ambiguous" ? "The notice is unclear about this." : fact.state === "conflicting" ? "The sources disagree about this." : "Not stated in the reviewed notice."} Read the available wording before relying on an amount or coverage.</p>}
    <details className="support-entry-source"><summary aria-label={`Read wording and sources for support entry ${index+1}`}><span>Wording & sources<small>{references.length ? `${references.length} reference${references.length===1?"":"s"} for this entry` : "No source reference recorded"}</small></span><ArrowDownRight size={15} aria-hidden/></summary>
      <div><p className="support-original">{fact.originalText ? `Wording in the notice: ${fact.originalText}` : "No source wording is recorded for this entry."}</p>
        {references.length ? <ul>{references.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noreferrer noopener"><span>{source.label}<small>{new URL(source.url).hostname}</small></span><ArrowUpRight size={14} aria-hidden/></a></li>)}</ul> : <p className="support-source-missing">No public source reference is available here for this entry.</p>}
        <a className="support-check-link" href="#evidence">Read the separate evidence checks<ArrowDownRight size={13} aria-hidden/></a>
      </div>
    </details>
  </li>
}

export function OpportunitySupport({ opportunity:o }: { opportunity:PublicOpportunity }) {
  return <section className={`support-file ${opportunityIdentity[o.category].theme}`} aria-labelledby="funding-heading">
    <header><p className="mini-label">The pay & support file</p><h2 id="funding-heading" tabIndex={-1}>{headings[o.category]}</h2><p>Read each entry with its own period, coverage and source wording. Different entries may describe different benefits or conditions.</p></header>
    {o.compensation.length ? <><p className="support-file-index">{o.compensation.length} separate entr{o.compensation.length===1?"y":"ies"} in this notice</p><ol className="support-ledger">{o.compensation.map((fact,index)=><SupportEntry key={index} fact={fact} index={index} citations={o.citations}/>)}</ol></> : <p className="support-file-empty">Pay and support are not stated in the reviewed notice.</p>}
    <footer><p>Consider travel, accommodation and other recurring costs. Check the notice for what support covers and when it is paid; ask the issuer using the notice’s contact details if this is unclear. Missing support details do not mean support is offered or excluded.</p></footer>
  </section>
}
