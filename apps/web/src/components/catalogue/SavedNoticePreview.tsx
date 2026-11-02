import { CalendarDays, MapPin } from "lucide-react"
import type { SavedSummary } from "@/lib/saved-summary"
import { LensValue } from "./OpportunityLens"

export function SavedNoticePreview({ summary }: { summary: Extract<SavedSummary,{kind:"current"}> }) {
  const { preview } = summary
  return <div className="saved-notice-preview">
    <p className="mini-label">{preview.caption}</p>
    <dl className="saved-notice-facts">{preview.facts.map((fact,index)=><div key={fact.key} className={fact.value.length>180?"saved-fact-wide":undefined}>
      <dt><span aria-hidden>{String(index+1).padStart(2,"0")}</span>{fact.label}</dt>
      <dd className={fact.unresolved?"saved-fact-uncertain":undefined}><LensValue fact={fact}/></dd>
    </div>)}</dl>
    <div className="saved-notice-setting"><MapPin size={14} aria-hidden/><p>{preview.place}<small>{preview.attendance}</small></p></div>
    <div className="saved-notice-closing"><CalendarDays size={14} aria-hidden/><p><small>{preview.deadlineState==="stated"?"Closing wording in the notice":"Closing details"}</small>{summary.deadline}{preview.deadlineWording && <small className="saved-closing-wording">Wording to clarify: {preview.deadlineWording}</small>}</p></div>
  </div>
}
