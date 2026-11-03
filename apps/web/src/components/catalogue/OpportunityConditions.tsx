import type { PublicOpportunity } from "@skilved/types/opportunities"
import { ArrowDownRight, ArrowUpRight, BookOpen, Building2, FileText, GraduationCap, Landmark } from "lucide-react"
import { contextInventory, contextStates, organisationRoles } from "@/lib/opportunity-context"
import { OpportunitySupport } from "./OpportunitySupport"

type PublicFact = PublicOpportunity["practicalConditions"] | PublicOpportunity["location"] | PublicOpportunity["compensation"][number] | PublicOpportunity["organisations"][number]

const roleIcons = { issuer:FileText, employer_host:Building2, training_provider:BookOpen, qualification_issuer:GraduationCap, oversight:Landmark }
const attendance = { in_person: "In person", hybrid: "Hybrid", remote: "Remote", not_stated: "Not stated" }
const coverage = { local: "Local", national: "National", international: "International", not_stated: "Not stated" }

function FactWording({ fact, citations }: { fact: PublicFact; citations: PublicOpportunity["citations"] }) {
  return <>
    {fact.state !== "stated" && <p>{fact.state === "ambiguous" ? "The notice is unclear about this." : fact.state === "conflicting" ? "The sources disagree about this." : "Not stated in the reviewed notice."}</p>}
    {fact.originalText && <p className="whitespace-pre-wrap break-words">Wording in the notice: {fact.originalText}</p>}
    {fact.citations.length > 0 && <ul className="mt-2 space-y-1">{fact.citations.map(id => {
      const citation = citations.find(item => item.id === id)
      return citation ? <li key={id}><a href={citation.url} rel="noreferrer noopener" className="break-words text-primary underline">{citation.label}</a></li> : null
    })}</ul>}
  </>
}

function ContextEvidence({fact,citations,label}:{fact:PublicFact;citations:PublicOpportunity["citations"];label:string}) {
  const references=[...new Set(fact.citations)].flatMap(id=>{const ref=citations.find(item=>item.id===id);return ref?[ref]:[]})
  if(!fact.originalText&&!references.length)return <p className="context-source-missing">No source wording or reference recorded for this detail.</p>
  return <details className="context-evidence"><summary aria-label={`Read the source wording for ${label}`}>Read the source wording<ArrowDownRight size={13} aria-hidden/></summary><div>
    <p className="mini-label">Wording in the notice</p><p className="context-original">{fact.originalText??"No separate wording recorded for this detail."}</p>
    {references.length?<ul>{references.map(ref=><li key={ref.id}><a href={ref.url} rel="noreferrer noopener">{ref.label}<ArrowUpRight size={12} aria-hidden/></a></li>)}</ul>:<p className="context-source-missing">No source reference recorded for this detail.</p>}
  </div></details>
}

export function OpportunityContext({ opportunity: o }: { opportunity: PublicOpportunity }) {
  const subtype=o.internship,inventory=contextInventory(o)
  return <details className="context-drawer"><summary id="context-heading"><span>{inventory.title}<small>{inventory.description}</small></span><ArrowDownRight size={18} aria-hidden/></summary>
    <section className="context-file" aria-labelledby="context-file-title"><header><p className="mini-label">The intake & role file</p><h2 id="context-file-title">Intake and organisation roles</h2><p>Read each role as it is recorded in the notice. Names and roles are kept separate from the evidence checks.</p></header>
      {o.category==="internship"&&<div className="context-internship"><p className="mini-label">Internship route</p><h3>{subtype?.subtype==="student_wil"?"Student / work-integrated learning (WIL) internship":subtype?.subtype==="graduate"?"Graduate internship":subtype?.subtype==="other_stated"?"Other route stated in the notice":"Internship route not established."}</h3>{subtype?.originalText&&<p className="context-original">Wording in the notice: {subtype.originalText}</p>}<p>Check enrolment, completion and institution-letter requirements in the notice; this route label does not decide eligibility.</p></div>}
      <div className={`context-intake context-state-${o.intake.state}`}><div className="context-row-heading"><h3>Intake or reference</h3><span className="context-state">{contextStates[o.intake.state]}</span></div><p className="context-value">{o.intake.state==="stated"&&o.intake.value?o.intake.value:o.intake.state==="conflicting"?"The sources disagree about this intake.":o.intake.state==="ambiguous"?"The intake wording needs clarification.":"An intake or reference is not stated in the reviewed notice."}</p><ContextEvidence fact={o.intake} citations={o.citations} label="the intake or reference"/></div>
      <div className={`context-issuer context-state-${o.issuer.state}`}><div className="context-row-heading"><h3>Notice issuer</h3><span className="context-state">{contextStates[o.issuer.state]}</span></div><p className="context-value">{o.issuer.state==="stated"&&o.issuer.value?o.issuer.value:"Issuer not established in this listing."}</p><ContextEvidence fact={o.issuer} citations={o.citations} label="the notice issuer"/></div>
      <div className="context-roles"><div className="context-role-heading"><h3>Organisations and roles</h3><span>Entries as recorded</span></div>
        {o.organisations.length?<ol className="context-role-ledger">{o.organisations.map((fact,index)=>{const role=fact.state==="stated"&&fact.value?organisationRoles[fact.value.role]:null,Icon=fact.state==="stated"&&fact.value?roleIcons[fact.value.role]:FileText;return <li key={index} className={`context-role-entry context-state-${fact.state}`}><div className="context-role-mark" aria-hidden><Icon size={18}/><span>{String(index+1).padStart(2,"0")}</span></div><div className="context-role-body"><div className="context-row-heading"><h4>{role?.label??"Role not established"}</h4><span className="context-state">{contextStates[fact.state]}</span></div><p className="context-value">{fact.state==="stated"&&fact.value?fact.value.name:fact.state==="conflicting"?"The sources disagree about the organisation or its role.":fact.state==="ambiguous"?"The organisation role needs clarification.":"No organisation or role is stated in this entry."}</p>{role&&<p className="context-role-definition">{role.description}</p>}<ContextEvidence fact={fact} citations={o.citations} label={`${role?.label??"unresolved role"} entry ${index+1}`}/></div></li>})}</ol>:<p className="context-empty">No additional organisation roles are stated in the reviewed notice.</p>}
      </div>
      <footer><p>For unclear roles or intake details, read the source notice and use its issuer contact details to ask for clarification.</p><a href="#evidence">Inspect the evidence checks<ArrowDownRight size={13} aria-hidden/></a></footer>
    </section>
  </details>
}

export function OpportunityConditions({ opportunity: o }: { opportunity: PublicOpportunity }) {
  const location = o.location.state === "stated" ? o.location.value : null
  return <>
    <section className="mt-8" aria-labelledby="conditions-heading">
      <h2 id="conditions-heading" className="text-xl font-semibold">Experience and practical conditions</h2>
      <dl className="mt-5 space-y-5">
        <div><dt className="font-medium">Work or study location and attendance</dt><dd className="mt-1 space-y-2 text-muted-foreground">
          {location && <>
            <p className="break-words">Listed places: {location.places.map(place => [place.city, place.province?.replaceAll("_", " "), place.country].filter(Boolean).join(", ")).filter(Boolean).join(" · ") || "Not stated"}</p>
            <p>Coverage: {coverage[location.coverage]}. Attendance: {attendance[location.attendance]}.</p>
            <p className="whitespace-pre-wrap break-words">Relocation: {location.relocation ?? "Not stated"}</p>
          </>}
          <FactWording fact={o.location} citations={o.citations} />
        </dd></div>
        {([["Residence conditions", o.residence], ["Experience", o.experience], ["Duration and other practical conditions", o.practicalConditions]] as const).map(([label, fact]) => <div key={label}>
          <dt className="font-medium">{label}</dt><dd className="mt-1 space-y-2 text-muted-foreground"><FactWording fact={fact} citations={o.citations} /></dd>
        </div>)}
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">A listed location or national coverage does not establish residence eligibility or relocation support. If attendance, duration or another condition is missing or unclear, check the original notice and ask the issuer through the contact details given there before making arrangements.</p>
    </section>
    <OpportunitySupport opportunity={o} />
  </>
}
