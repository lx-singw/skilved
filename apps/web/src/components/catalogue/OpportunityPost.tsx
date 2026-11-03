import Link from "next/link"
import { ArrowUpRight, FileText } from "lucide-react"
import type { PublicOpportunity } from "@skilved/types/opportunities"
import { opportunityHref } from "@/lib/catalogue-query"
import { issuerInitials, opportunityFacts, opportunityIdentity } from "@/lib/opportunity-presentation"
import { CategoryCardFacts } from "./OpportunityLens"
import { FeedSave } from "./FeedSave"
import { NoticeDate, OpportunitySignature } from "./OpportunityIdentity"
import { OpportunityBrief } from "./OpportunityBrief"

export function OpportunityPost({ opportunity: o, query }: { opportunity: PublicOpportunity; query: URLSearchParams }) {
  const identity = opportunityIdentity[o.category], facts = opportunityFacts(o)
  const href = opportunityHref(o.id, query)
  return <article className={`opportunity-post opportunity-dossier ${identity.theme}`}>
    <OpportunitySignature opportunity={o} />
    <div className="dossier-body">
      <div className="dossier-issuer"><span className="issuer-monogram" aria-hidden>{issuerInitials(o)}</span><span>{o.issuer.value ?? "Issuer not stated"}</span>{o.lifecycle === "closed" && <span className="closed-label">Closed intake</span>}</div>
      <div className="dossier-title"><div><h2><Link href={href}>{o.title.value ?? "Title not stated"}</Link></h2><p className="dossier-field">{o.fields.length ? `Field: ${o.fields.join(" · ")}` : "Field not stated"}</p></div><NoticeDate opportunity={o} /></div>
      <CategoryCardFacts opportunity={o} />
      <p className="dossier-deadline"><span>Closing wording</span>{facts.deadline}</p>
      <OpportunityBrief opportunity={o} href={href}/>
      <div className="dossier-provenance"><FileText size={14} aria-hidden/><span>{o.citations.length ? `${o.citations.length} source reference${o.citations.length === 1 ? "" : "s"} to inspect` : "Source reference not available"}</span><Link href={href+"#evidence"}>{o.citations.length?"Inspect the sources":"See source limits"}<ArrowUpRight size={12} aria-hidden/></Link></div>
    </div>
    <footer className="post-actions dossier-actions"><Link href={href}>{identity.action}<ArrowUpRight size={18} aria-hidden /></Link><FeedSave id={o.id} revision={o.revision} href={href} title={o.title.value ?? "this opportunity"} closed={o.lifecycle === "closed"} /></footer>
  </article>
}
