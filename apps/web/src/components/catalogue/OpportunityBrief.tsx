import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, BookOpen, FileText, GitBranch } from "lucide-react"
import { formatRequirements, type PublicOpportunity } from "@skilved/types/opportunities"
import { opportunityLens } from "@/lib/opportunity-lens"
import { requirementRoute, uncertainty } from "@/lib/opportunity-presentation"

const titles = { bursary:"Inside the study brief", learnership:"Inside the learning brief", apprenticeship:"Inside the trade brief", internship:"Inside the placement brief", graduate_programme:"Inside the programme brief", job:"Inside the role brief" }
const levels = {required:"Required as stated",preferred:"Preferred as stated",unclear:"Strength needs confirmation"}

export function OpportunityBrief({ opportunity:o, href }: { opportunity:PublicOpportunity; href:string }) {
  const documents=o.requirements.requirements.filter(item=>item.kind==="document"),lens=opportunityLens(o)
  return <details className="card-brief">
    <summary><span><BookOpen size={16} aria-hidden/>{titles[o.category]}<small>{requirementRoute(o)}</small></span><ArrowDownRight size={18} aria-hidden/></summary>
    <div className="card-brief-content">
      <div className="brief-introduction"><p className="mini-label">In the notice</p><h3>{lens.story}</h3>
        <p className="brief-source-summary">{o.summary.state==="stated"&&o.summary.value ? o.summary.value : uncertainty(o.summary.state,"Summary not stated")}</p>
        {o.summary.state!=="stated"&&o.summary.originalText&&<p className="brief-original-wording">{o.summary.originalText}</p>}
      </div>
      <dl className="brief-inventory"><div><dt>Recorded instructions</dt><dd>{o.requirements.requirements.length}</dd></div><div><dt>Document entries</dt><dd>{documents.length}</dd></div><div><dt>Source references</dt><dd>{o.citations.length}</dd></div></dl>
      <p className="brief-inventory-note">Follow the alternatives and conditions in the notice; you may not need every entry.</p>
      <details className="brief-connected"><summary><GitBranch size={15} aria-hidden/>Read the connected requirement wording<ArrowDownRight size={14} aria-hidden/></summary>
        <p className="brief-logic">{formatRequirements(o.requirements)}</p><p>These are the notice’s conditions, not an assessment of your eligibility.</p>
      </details>
      <div className="brief-documents"><h3><FileText size={15} aria-hidden/>Document wording to read</h3>
        {documents.length ? <><p className="brief-document-note">Document entries can sit in alternative or conditional routes. Read how the instructions connect before preparing them.</p>
          <ol>{documents.map((item,index)=><li key={item.id}><span className="brief-document-number" aria-hidden>{String(index+1).padStart(2,"0")}</span><div><span className="brief-document-level">{levels[item.level]}</span><p>{item.fact.originalText??item.fact.value?.description??"Document instruction not stated; confirm with the issuer"}</p>{item.fact.state!=="stated"&&<small>{uncertainty(item.fact.state,"Details not stated")}</small>}</div></li>)}</ol></>
          : <p className="brief-document-note">No separate document entries are recorded. Check the complete connected wording for what to prepare.</p>}
      </div>
      <details className="brief-support"><summary>Read the support wording<ArrowDownRight size={14} aria-hidden/></summary>
        {o.compensation.length ? <ul>{o.compensation.map((fact,index)=><li key={index}><p>{fact.originalText??"Support wording not stated"}</p>{fact.state!=="stated"&&<small>{uncertainty(fact.state,"Details not stated")}</small>}</li>)}</ul> : <p>No support wording is recorded. Check the original notice for coverage and conditions.</p>}
      </details>
      <nav className="brief-detail-links" aria-label={`Read more about ${o.title.value??"this opportunity"}`}><Link href={href+"#preparation"}>Review the full preparation view<ArrowUpRight size={14} aria-hidden/></Link><Link href={href+"#funding-heading"}>Explore support and coverage<ArrowUpRight size={14} aria-hidden/></Link></nav>
    </div>
  </details>
}
