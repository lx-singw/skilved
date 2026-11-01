import { BriefcaseBusiness, GraduationCap, Hammer, Layers3, Sprout } from "lucide-react"
import type { PublicOpportunity } from "@skilved/types/opportunities"
import { noticeDate, opportunityIdentity } from "@/lib/opportunity-presentation"

const icons = { bursary: GraduationCap, learnership: Sprout, apprenticeship: Hammer, internship: Layers3, graduate_programme: GraduationCap, job: BriefcaseBusiness }
export function OpportunityGlyph({ category, large = false }: { category: PublicOpportunity["category"]; large?: boolean }) {
  const Icon = icons[category]
  return <span className={`opportunity-glyph ${large ? "glyph-large" : ""}`} aria-hidden><i /><i /><i /><Icon size={large ? 42 : 21} strokeWidth={1.5} /></span>
}
export function NoticeDate({ opportunity: o }: { opportunity: PublicOpportunity }) {
  const date = noticeDate(o)
  return <div className="notice-date">
    <span>{o.lifecycle === "closed" ? "Intake closed" : "Date in notice"}</span>
    {date ? <time dateTime={date.iso}><strong>{date.day}</strong><span>{date.month}<small>{date.year}</small></span></time> : <strong className="date-unknown">{o.deadline.state === "stated" && o.deadline.value?.kind === "open_until_filled" ? "Until filled" : "To confirm"}</strong>}
  </div>
}
export function OpportunitySignature({ opportunity: o }: { opportunity: PublicOpportunity }) {
  const identity = opportunityIdentity[o.category]
  return <div className="opportunity-signature"><OpportunityGlyph category={o.category} /><span>{identity.focus}</span><span className="signature-category">{identity.label}</span></div>
}
