import { ArrowDownRight, ArrowUpRight, BookOpen, BriefcaseBusiness, Compass, GraduationCap, School, Sprout } from "lucide-react"
import { ENTRY_STAGE_LABELS, type PublicOpportunity } from "@skilved/types/opportunities"
import { contextStates } from "@/lib/opportunity-context"
import { opportunityIdentity } from "@/lib/opportunity-presentation"

const stageIcons = {school_leaver:School,student:BookOpen,graduate:GraduationCap,entry_level:Sprout,experienced:BriefcaseBusiness}

export function EntryStage({ opportunity:o }: { opportunity:PublicOpportunity }) {
  const fact = o.entryStage
  const stated = fact?.state === "stated" ? fact.value : null
  const citations = [...new Set(fact?.citations ?? [])].flatMap(id => {
    const source = o.citations.find(item => item.id === id)
    return source ? [source] : []
  })
  return <section className={`entry-stage-file ${opportunityIdentity[o.category].theme}`} aria-labelledby="entry-stage-heading">
    <header><span className="entry-stage-mark" aria-hidden><Compass size={23}/></span><div><p className="mini-label">The entry picture</p><h2 id="entry-stage-heading" tabIndex={-1}>Entry stage</h2><p className="entry-stage-state">{contextStates[fact?.state ?? "not_stated"]}</p></div></header>
    {stated?.length ? <div className="entry-stage-labels"><p>Source-stated stage{stated.length===1?"":"s"}</p><ul aria-label="Stage labels in this notice">{stated.map(stage => {
      const Icon = stageIcons[stage]
      return <li key={stage}><Icon size={17} aria-hidden/><span>{ENTRY_STAGE_LABELS[stage]}</span></li>
    })}</ul><p className="entry-stage-relationship">Read how these labels relate in the connected requirements. Multiple labels do not establish separate application routes.</p></div>
    : <p className="entry-stage-unresolved">{fact?.state === "conflicting" ? "Sources disagree about the entry stage." : fact?.state === "ambiguous" ? "The entry stage is unclear in the notice." : "No reviewed entry stage is stated here."} Read the full requirements and confirm unclear conditions with the issuer using the notice&apos;s contact details.</p>}
    <div className="entry-stage-reading"><p>These labels help with discovery; they do not decide eligibility. Entry level does not mean no experience is required.</p><nav aria-label="Read the entry conditions"><a href="#preparation">Read connected requirements<ArrowDownRight size={14} aria-hidden/></a><a href="#experience-heading">Inspect experience wording<ArrowDownRight size={14} aria-hidden/></a></nav></div>
    <details className="entry-stage-source"><summary aria-label="Read entry-stage wording and sources"><span>Wording & sources<small>{citations.length ? `${citations.length} reference${citations.length===1?"":"s"} for the entry stage` : "No source reference recorded"}</small></span><ArrowDownRight size={15} aria-hidden/></summary>
      <div><p>{fact?.originalText ? `Wording in the notice: ${fact.originalText}` : "No source wording is recorded for the entry stage."}</p>
        {citations.length ? <ul>{citations.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer noopener"><span>{source.label}<small>{new URL(source.url).hostname}</small></span><ArrowUpRight size={14} aria-hidden/></a></li>)}</ul> : <p>No public source reference is available here for the entry stage.</p>}
        <a className="entry-stage-evidence" href="#evidence">Read the separate evidence checks<ArrowDownRight size={14} aria-hidden/></a>
      </div>
    </details>
  </section>
}
