import type { PublicOpportunity } from "@skilved/types/opportunities"
import { ArrowDownRight, ArrowUpRight, BookOpen, Building2, FileText, GraduationCap, Landmark } from "lucide-react"
import { contextInventory, contextStates, organisationRoles } from "@/lib/opportunity-context"
import { OpportunitySupport } from "./OpportunitySupport"
import { OpportunityPractical } from "./OpportunityPractical"

type PublicFact = PublicOpportunity["practicalConditions"] | PublicOpportunity["location"] | PublicOpportunity["compensation"][number] | PublicOpportunity["organisations"][number]

const roleIcons = { issuer:FileText, employer_host:Building2, training_provider:BookOpen, qualification_issuer:GraduationCap, oversight:Landmark }

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
  return <>
    <OpportunityPractical opportunity={o} />
    <OpportunitySupport opportunity={o} />
  </>
}
