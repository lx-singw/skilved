import { ArrowUpRight } from "lucide-react"
import type { PublicOpportunity } from "@skilved/types/opportunities"
import { issuerInitials, opportunityFacts, opportunityIdentity } from "@/lib/opportunity-presentation"
import { CategoryOverviewFacts } from "./OpportunityLens"
import { NoticeDate, OpportunityGlyph } from "./OpportunityIdentity"

export function OpportunityOverview({ opportunity: o }: { opportunity: PublicOpportunity }) {
  const identity = opportunityIdentity[o.category]
  const unknowns = [
    o.location.state !== "stated" && {label: "Location", href: "#conditions-heading"},
    (o.location.state !== "stated" || !o.location.value || o.location.value.attendance === "not_stated") && {label: "Attendance", href: "#conditions-heading"},
    o.deadline.state !== "stated" && {label: "Closing date", href: "#application-heading"},
    o.entryStage.state !== "stated" && {label: "Entry stage", href: "#entry-stage-heading"},
    (!o.compensation.length || o.compensation.some(f => f.state !== "stated")) && {label: "Pay or support", href: "#funding-heading"},
    o.experience.state !== "stated" && {label: "Experience", href: "#conditions-heading"},
    o.residence.state !== "stated" && {label: "Residence conditions", href: "#conditions-heading"},
  ].filter((item): item is {label: string; href: string} => Boolean(item))
  return <header className={`opportunity-overview ${identity.theme}`}>
    <div className="overview-banner"><span>{identity.label}{o.lifecycle === "closed" && <strong className="overview-closed">Intake closed</strong>}</span><span>{identity.verb}<ArrowUpRight size={16} aria-hidden /></span></div>
    <div className="overview-title">
      <div><p className="overview-issuer"><span className="issuer-monogram" aria-hidden>{issuerInitials(o)}</span>{o.issuer.value ?? "Issuer not stated"}</p><h1>{o.title.value ?? "Opportunity details"}</h1><p className="overview-fields">{o.fields.length ? o.fields.join(" / ") : "Field not stated"}</p></div>
      <div className="overview-art"><OpportunityGlyph category={o.category} large /><span>{identity.focus}</span></div>
    </div>
    <CategoryOverviewFacts opportunity={o} />
    {unknowns.length > 0 && <div className="clarity-note"><span className="clarity-mark" aria-hidden>?</span><p><strong>Keep these questions open.</strong> {unknowns.map(item => <a key={item.label} href={item.href}>{item.label}</a>)}</p></div>}
  </header>
}
export function ApplicationDate({ opportunity: o }: { opportunity: PublicOpportunity }) {
  const facts = opportunityFacts(o)
  return <div className={`application-date ${opportunityIdentity[o.category].theme}`}><NoticeDate opportunity={o} /><p>{facts.deadline}</p>{o.deadline.state !== "stated" && o.deadline.originalText && <p>Wording in the notice: {o.deadline.originalText}</p>}</div>
}
