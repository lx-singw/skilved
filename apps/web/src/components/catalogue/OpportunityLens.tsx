import { ArrowDownRight, ArrowUpRight, Banknote, BookOpen, Building2, ClipboardList, GraduationCap, MapPin, Route, Users } from "lucide-react"
import type { PublicOpportunity } from "@skilved/types/opportunities"
import { opportunityLens, type LensFact } from "@/lib/opportunity-lens"

const icons = {support:Banknote,fields:BookOpen,place:MapPin,education:GraduationCap,experience:Users,conditions:ClipboardList,provider:Building2,route:Route}
export function LensValue({ fact }: { fact: Pick<LensFact,"value"|"detail"> }) {
  return <>{fact.value.length > 180 ? <details className="lens-long-wording"><summary>{fact.value.slice(0,140)}…<span>Read full wording</span></summary><p>{fact.value}</p></details> : <span>{fact.value}</span>}{fact.detail && <small>{fact.detail}</small>}</>
}
export function CategoryCardFacts({ opportunity: o }: { opportunity: PublicOpportunity }) {
  const lens = opportunityLens(o), [lead,...rest] = lens.facts
  const Icon = icons[lead.key as keyof typeof icons]
  return <div className="category-card-facts">
    <dl className="category-lead"><div><dt><Icon size={16} aria-hidden />{lead.label}</dt><dd><LensValue fact={lead} /></dd></div></dl>
    <dl className="category-secondary">{rest.slice(0,3).map(fact => { const Icon = icons[fact.key as keyof typeof icons]; return <div key={fact.key}><dt><Icon size={14} aria-hidden />{fact.label}</dt><dd><LensValue fact={fact} /></dd></div> })}</dl>
  </div>
}
export function CategoryOverviewFacts({ opportunity: o }: { opportunity: PublicOpportunity }) {
  const lens = opportunityLens(o)
  return <dl className="category-overview-facts">{lens.facts.slice(0,4).map((fact,i) => <div key={fact.key} className={i === 0 ? "category-overview-lead" : ""}><dt>{fact.label}</dt><dd><LensValue fact={fact} /></dd></div>)}</dl>
}
export function OpportunityProfile({ opportunity: o }: { opportunity: PublicOpportunity }) {
  const lens = opportunityLens(o)
  return <section className="category-profile" aria-labelledby="category-profile-heading">
    <div className="category-profile-intro"><p className="mini-label">{lens.caption}</p><h3 id="category-profile-heading">{lens.heading}</h3></div>
    <dl>{lens.facts.slice(4).map((fact,i) => <div key={fact.key}><dt><span className="lens-index" aria-hidden>{String(i+1).padStart(2,"0")}</span>{fact.label}</dt><dd><LensValue fact={fact} /><a href={fact.href}>Read {fact.key === "education" ? "connected requirements" : fact.key === "provider" || fact.key === "route" ? "organisation & route details" : fact.key === "support" ? "support wording" : fact.key === "fields" ? "the opportunity" : "practical conditions"}<ArrowDownRight size={13} aria-hidden /></a></dd></div>)}</dl>
    <details className="category-questions"><summary>Three questions to take to the notice<ArrowUpRight size={15} aria-hidden /></summary><ol>{lens.questions.map(question => <li key={question}>{question}</li>)}</ol><p>These are prompts to check against the source, not extra application requirements.</p></details>
  </section>
}
