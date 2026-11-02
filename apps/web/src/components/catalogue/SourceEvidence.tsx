import { ArrowDownRight, ArrowUpRight, BookOpen, CircleHelp, Clock3, FileText, Link2 } from "lucide-react"
import type { PublicOpportunity } from "@skilved/types/opportunities"
import { evidenceOverview, evidenceQuestions } from "@/lib/source-evidence"

const outcomes = {
  supported: "Supported by the cited evidence",
  unresolved: "Unresolved; needs confirmation",
  failed: "Check failed; needs confirmation",
  contradicted: "Conflicting evidence; needs review",
}
function CheckTime({ value }: { value: string }) {
  return <time dateTime={value}>{new Date(value).toLocaleString("en-ZA", { timeZone:"Africa/Johannesburg",dateStyle:"long",timeStyle:"short" })} SAST</time>
}
function EvidenceLinks({ ids, citations }: { ids:string[];citations:PublicOpportunity["citations"] }) {
  return <ul className="evidence-record-links">{ids.map(id=>{
    const citation=citations.find(item=>item.id===id)
    return citation ? <li key={id}><a href={citation.url} target="_blank" rel="noreferrer noopener">{citation.label}<ArrowUpRight size={12} aria-hidden /></a></li> : null
  })}</ul>
}
export function RequirementExplanation({ opportunity:o }: { opportunity:PublicOpportunity }) {
  if (!o.explanation || o.explanation.requirementRevision !== o.requirements.revision) return <section className="mt-6" aria-labelledby="explanation-heading">
    <h2 id="explanation-heading" className="text-xl font-semibold">Understanding these requirements</h2>
    <p className="mt-3 text-muted-foreground">A reviewed explanation is not available for these instructions. Read the original wording above and its source notice. If a condition is unclear, ask the issuer using the contact details in that notice.</p>
  </section>
  return <section className="mt-6 rounded-xl border border-border bg-card p-6" aria-labelledby="explanation-heading">
    <h2 id="explanation-heading" className="text-xl font-semibold">Reviewed explanation</h2>
    <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed">{o.explanation.text}</p>
    <p className="mt-3 text-sm text-muted-foreground">This explanation refers to requirement version {o.explanation.requirementRevision}. Read it alongside the original instructions above; it does not decide eligibility or confirm submission.</p>
    <EvidenceLinks ids={o.explanation.citations} citations={o.citations}/>
  </section>
}
export function SourceEvidenceSummary({ opportunity:o }: { opportunity:PublicOpportunity }) {
  const counts=evidenceOverview(o)
  return <div className="evidence-overview">
    <dl><div><dt><Link2 size={14} aria-hidden />Source references</dt><dd>{counts.sources}</dd></div><div><dt><BookOpen size={14} aria-hidden />Recorded checks</dt><dd>{counts.records}</dd></div><div><dt><CircleHelp size={14} aria-hidden />Questions without records</dt><dd>{counts.withoutRecords}</dd></div></dl>
    <div className="evidence-overview-note"><p>Read each question separately. A record count is not an overall verdict on this opportunity.</p><a href="#evidence-questions">Inspect the six questions<ArrowDownRight size={15} aria-hidden /></a></div>
  </div>
}
export function SourceEvidence({ opportunity:o }: { opportunity:PublicOpportunity }) {
  const groups=evidenceQuestions(o)
  return <section className="source-file" aria-labelledby="sources-heading">
    <div className="source-file-intro"><p className="mini-label">The source file</p><h2 id="sources-heading">Sources and checks</h2><p>Each check covers the question shown below at its recorded time. A reachable website does not establish who issued a notice or whether applications remain open. These checks do not guarantee eligibility or an application outcome.</p></div>
    <div className="source-notices-heading"><h3>Source notices</h3><span>Links open separately</span></div>
    {o.citations.length ? <ol className="source-notices">{o.citations.map((citation,index)=><li key={citation.id}><span className="source-reference-number" aria-hidden>{String(index+1).padStart(2,"0")}</span><div><a href={citation.url} target="_blank" rel="noreferrer noopener">{citation.label}<ArrowUpRight size={15} aria-hidden /></a><span className="source-hostname">{new URL(citation.url).hostname}</span><details className="source-address"><summary>Inspect the address<ArrowDownRight size={12} aria-hidden /></summary><p>{citation.url}</p></details></div></li>)}</ol> : <p className="source-empty">No public source reference is available. Return to the catalogue for a listing with source details.</p>}
    <div id="evidence-questions" className="evidence-question-list"><div className="evidence-questions-heading"><h3>Six questions. Separate records.</h3><p>Expand a question to read its evidence. Where there are several checks, the latest check time appears first; earlier records remain available.</p></div>
      {groups.map((group,index)=><details key={group.scope} id={group.href.slice(1)} className="evidence-question" open={group.checks.length>0}>
        <summary><span className="evidence-question-number" aria-hidden>{String(index+1).padStart(2,"0")}</span><span><strong>{group.label}</strong><small>{group.checks.length ? `${group.checks.length} recorded check${group.checks.length===1?"":"s"}` : "No check recorded"}</small></span><ArrowDownRight size={16} aria-hidden /></summary>
        <div className="evidence-question-body"><p className="evidence-question-description">{group.description}</p>
          {group.checks.length ? <ul className="evidence-records">{group.checks.map((check,i)=><li key={`${check.checkedAt}:${i}`} className="evidence-record">
            <p className={`evidence-outcome record-${check.outcome}`}><span aria-hidden/>{outcomes[check.outcome]}</p>
            <p className="evidence-record-time"><Clock3 size={13} aria-hidden /><span>{check.method==="automatic"?"Automated check":check.method==="human"?"Human check":"Check method not recorded"} · Checked <CheckTime value={check.checkedAt}/></span></p>
            {check.nextCheckAt && <p className="evidence-next-check">Recorded next-check time: <CheckTime value={check.nextCheckAt}/>. This is not evidence that another check has occurred.</p>}
            <EvidenceLinks ids={check.citations} citations={o.citations}/>
          </li>)}</ul> : <p className="evidence-missing">No recorded check for this question.</p>}
        </div>
      </details>)}
    </div>
    <div className="source-file-updated"><FileText size={16} aria-hidden /><p>Listing updated <CheckTime value={o.updatedAt}/>. This update time is separate from each source check.</p></div>
    <p className="source-file-guidance">For missing, failed or conflicting information, read the cited notice and confirm with the issuer using the details there before acting. A failed check alone does not mean the opportunity has closed.</p>
  </section>
}
