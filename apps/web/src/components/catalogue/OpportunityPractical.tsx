import { ArrowDownRight, ArrowUpRight, BriefcaseBusiness, Clock3, House, MapPin } from "lucide-react"
import type { PublicOpportunity } from "@skilved/types/opportunities"
import { opportunityIdentity, provinceLabels } from "@/lib/opportunity-presentation"
import { contextStates } from "@/lib/opportunity-context"

type TextFact = PublicOpportunity["residence"]
type PracticalFact = TextFact | PublicOpportunity["location"]
const attendance = { in_person:"In person", hybrid:"Hybrid", remote:"Remote", not_stated:"Attendance not stated" }
const coverage = { local:"Local", national:"National", international:"International", not_stated:"Coverage not stated" }
const headings = { bursary:"The study setting, in detail.", learnership:"How learning fits into life.", apprenticeship:"The workplace behind the trade.", internship:"The shape of the placement.", graduate_programme:"Inside the programme arrangement.", job:"The working arrangement." }
function missing(state: PracticalFact["state"]) {
  return state === "ambiguous" ? "The notice is unclear about this." : state === "conflicting" ? "The sources disagree about this." : "Not stated in the reviewed notice."
}

function ConditionSource({ fact, citations, label }: { fact:PracticalFact; citations:PublicOpportunity["citations"]; label:string }) {
  const sources = [...new Set(fact.citations)].flatMap(id => { const source=citations.find(item=>item.id===id);return source?[source]:[] })
  return <details className="condition-source"><summary aria-label={`Read wording and sources for ${label}`}><span>Wording & sources<small>{sources.length ? `${sources.length} reference${sources.length===1?"":"s"} for this detail` : "No source reference recorded"}</small></span><ArrowDownRight size={15} aria-hidden/></summary>
    <div><p className="condition-original">{fact.originalText ? `Wording in the notice: ${fact.originalText}` : "No separate source wording is recorded for this detail."}</p>
      {sources.length ? <ul>{sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noreferrer noopener"><span>{source.label}<small>{new URL(source.url).hostname}</small></span><ArrowUpRight size={14} aria-hidden/></a></li>)}</ul> : <p className="condition-source-missing">No public source reference is available here for this detail.</p>}
      <a className="condition-evidence-link" href="#evidence">Read the separate evidence checks<ArrowDownRight size={13} aria-hidden/></a>
    </div>
  </details>
}

export function OpportunityPractical({ opportunity:o }: { opportunity:PublicOpportunity }) {
  const location = o.location.state === "stated" ? o.location.value : null
  const conditions = [
    {id:"residence-heading",number:"02",label:"Residence conditions",fact:o.residence,Icon:House,note:"Read residence conditions separately from the places listed above."},
    {id:"experience-heading",number:"03",label:"Experience",fact:o.experience,Icon:BriefcaseBusiness,note:"Read this wording with the required and preferred instructions in preparation."},
    {id:"arrangement-heading",number:"04",label:"Duration and other practical conditions",fact:o.practicalConditions,Icon:Clock3,note:"Check the original notice for any hours, duration, attendance or other commitments."},
  ]
  return <section className={`conditions-file ${opportunityIdentity[o.category].theme}`} aria-labelledby="conditions-heading">
    <header><p className="mini-label">The practical file</p><h2 id="conditions-heading" tabIndex={-1}>{headings[o.category]}</h2><p>Read the setting and the commitments as separate details, each with its own wording and references.</p></header>
    <div className="condition-ledger">
      <section className={`condition-entry condition-state-${o.location.state}`} aria-labelledby="location-heading">
        <header><span className="condition-entry-mark" aria-hidden><MapPin size={19}/><small>01</small></span><div><h3 id="location-heading" tabIndex={-1}>Location and attendance</h3><p className="condition-state">{contextStates[o.location.state]}</p></div></header>
        {location ? <div className="condition-location">
          <dl className="condition-setting"><div><dt>Coverage</dt><dd>{coverage[location.coverage]}</dd></div><div><dt>Attendance</dt><dd>{attendance[location.attendance]}</dd></div></dl>
          <div className="condition-places"><h4>Places in this notice</h4>{location.places.length ? <ol>{location.places.map((place,index)=><li key={index}><span className="condition-place-number" aria-hidden>{String(index+1).padStart(2,"0")}</span><dl className="condition-place-fields"><div><dt>City / locality</dt><dd>{place.city ?? "City not stated"}</dd></div><div><dt>Province</dt><dd>{place.province ? provinceLabels[place.province] : "Province not stated"}</dd></div><div><dt>Country code</dt><dd>{place.country ?? "Country not stated"}</dd></div></dl></li>)}</ol> : <p className="condition-empty">No individual places are recorded. Read the coverage and attendance wording above.</p>}</div>
          <div className="condition-relocation"><h4>Relocation wording</h4><p>{location.relocation ?? "Relocation not stated"}</p></div>
        </div> : <p className="condition-unresolved">{missing(o.location.state)} Read the available source wording before relying on a place or attendance arrangement.</p>}
        <ConditionSource fact={o.location} citations={o.citations} label="location and attendance"/>
      </section>
      {conditions.map(({id,number,label,fact,Icon,note})=><section key={id} className={`condition-entry condition-state-${fact.state}`} aria-labelledby={id}>
        <header><span className="condition-entry-mark" aria-hidden><Icon size={19}/><small>{number}</small></span><div><h3 id={id} tabIndex={-1}>{label}</h3><p className="condition-state">{contextStates[fact.state]}</p></div></header>
        <div className="condition-text"><p className={fact.state==="stated"&&fact.value!==null?"condition-value":"condition-unresolved"}>{fact.state==="stated"&&fact.value!==null ? fact.value : missing(fact.state)}</p><p className="condition-reading-note">{note}</p>{id==="experience-heading"&&<a href="#preparation">Read the connected requirements<ArrowDownRight size={13} aria-hidden/></a>}</div>
        <ConditionSource fact={fact} citations={o.citations} label={label.toLowerCase()}/>
      </section>)}
    </div>
    <footer><p>A listed location or national coverage does not establish residence eligibility or relocation support. If attendance, duration or another condition is missing or unclear, check the original notice and ask the issuer through the contact details given there before making arrangements.</p></footer>
  </section>
}
