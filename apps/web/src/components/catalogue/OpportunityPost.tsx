import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, Banknote, BookOpen, MapPin, Users } from "lucide-react"
import { formatRequirements, type PublicOpportunity } from "@skilved/types/opportunities"
import { opportunityHref } from "@/lib/catalogue-query"
import { issuerInitials, opportunityFacts, opportunityIdentity, requirementRoute } from "@/lib/opportunity-presentation"
import { FeedSave } from "./FeedSave"
import { NoticeDate, OpportunitySignature } from "./OpportunityIdentity"

export function OpportunityPost({ opportunity: o, query }: { opportunity: PublicOpportunity; query: URLSearchParams }) {
  const identity = opportunityIdentity[o.category], facts = opportunityFacts(o)
  const href = opportunityHref(o.id, query)
  return <article className={`opportunity-post opportunity-dossier ${identity.theme}`}>
    <OpportunitySignature opportunity={o} />
    <div className="dossier-body">
      <div className="dossier-issuer"><span className="issuer-monogram" aria-hidden>{issuerInitials(o)}</span><span>{o.issuer.value ?? "Issuer not stated"}</span>{o.lifecycle === "closed" && <span className="closed-label">Closed intake</span>}</div>
      <div className="dossier-title"><div><h2><Link href={href}>{o.title.value ?? "Title not stated"}</Link></h2><p className="dossier-field">{o.fields.length ? `Field: ${o.fields.join(" · ")}` : "Field not stated"}</p></div><NoticeDate opportunity={o} /></div>
      <dl className="dossier-facts">
        <div><dt><MapPin size={14} aria-hidden />Where</dt><dd>{facts.place}<small>{facts.attendance}</small></dd></div>
        <div><dt><Banknote size={14} aria-hidden />Support in notice</dt><dd>{facts.support}<small>{facts.supportDetail}</small></dd></div>
        <div><dt><Users size={14} aria-hidden />Entry stage</dt><dd>{facts.stage}<small>Check the full requirements</small></dd></div>
      </dl>
      <p className="dossier-deadline"><span>Closing wording</span>{facts.deadline}</p>
      <details className="card-brief">
        <summary><span><BookOpen size={16} aria-hidden />Inside this opportunity<small>{requirementRoute(o)}</small></span><ArrowDownRight size={18} aria-hidden /></summary>
        <div className="card-brief-content">
          {o.summary.value && <p>{o.summary.value}</p>}
          <h3>Requirements, as connected in the notice</h3><p className="brief-logic">{formatRequirements(o.requirements)}</p>
          <p>These are the notice’s conditions, not an assessment of your eligibility.</p>
          {o.compensation.length > 0 && <><h3>Support wording</h3><ul>{o.compensation.map((fact, i) => <li key={i}>{fact.originalText ?? "Support wording not stated"}{fact.state !== "stated" && <span> · Needs clarification</span>}</li>)}</ul></>}
        </div>
      </details>
      <div className="dossier-provenance"><span className="source-dots" aria-hidden><i /><i /><i /></span>{o.citations.length ? `${o.citations.length} source reference${o.citations.length === 1 ? "" : "s"} to inspect` : "Source reference not available"}<span>Read the evidence in details</span></div>
    </div>
    <footer className="post-actions dossier-actions"><Link href={href}>{identity.action}<ArrowUpRight size={18} aria-hidden /></Link><FeedSave id={o.id} revision={o.revision} /></footer>
  </article>
}
