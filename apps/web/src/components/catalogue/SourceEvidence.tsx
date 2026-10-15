import type { PublicOpportunity } from "@skilved/types/opportunities"

const scopes = {
  issuer_attribution: "Who issued the opportunity",
  announcement: "Source announcement",
  application_relationship: "Application route linked to the notice",
  destination_reachability: "Application destination reachable",
  availability: "Opportunity availability",
  requirements: "Requirement wording and meaning",
}
const outcomes = {
  supported: "Supported by the cited evidence",
  unresolved: "Unresolved; needs confirmation",
  failed: "Check failed; needs confirmation",
  contradicted: "Conflicting evidence; needs review",
}

function CheckTime({ value }: { value: string }) {
  return <time dateTime={value}>{new Date(value).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", dateStyle: "long", timeStyle: "short" })} SAST</time>
}

function EvidenceLinks({ ids, citations }: { ids: string[]; citations: PublicOpportunity["citations"] }) {
  return <ul className="mt-2 space-y-2">{ids.map(id => {
    const citation = citations.find(item => item.id === id)
    return citation ? <li key={id}><a href={citation.url} rel="noreferrer noopener" className="break-words text-primary underline">{citation.label}</a></li> : null
  })}</ul>
}

export function RequirementExplanation({ opportunity: o }: { opportunity: PublicOpportunity }) {
  // The public schema already rejects stale explanations; keep this display guard too.
  if (!o.explanation || o.explanation.requirementRevision !== o.requirements.revision) return <section className="mt-6" aria-labelledby="explanation-heading">
    <h2 id="explanation-heading" className="text-xl font-semibold">Understanding these requirements</h2>
    <p className="mt-3 text-muted-foreground">A reviewed explanation is not available for these instructions. Read the original wording above and its source notice. If a condition is unclear, ask the issuer using the contact details in that notice.</p>
  </section>
  return <section className="mt-6 rounded-xl border border-border bg-card p-6" aria-labelledby="explanation-heading">
    <h2 id="explanation-heading" className="text-xl font-semibold">Reviewed explanation</h2>
    <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed">{o.explanation.text}</p>
    <p className="mt-3 text-sm text-muted-foreground">This explanation refers to requirement version {o.explanation.requirementRevision}. Read it alongside the original instructions above; it does not decide eligibility or confirm submission.</p>
    <EvidenceLinks ids={o.explanation.citations} citations={o.citations} />
  </section>
}

export function SourceEvidence({ opportunity: o }: { opportunity: PublicOpportunity }) {
  return <section className="mt-8 border-t border-border pt-6" aria-labelledby="sources-heading">
    <h2 id="sources-heading" className="text-xl font-semibold">Sources and checks</h2>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Each check covers the question shown below at its recorded time. A reachable website does not establish who issued a notice or whether applications remain open. These checks do not guarantee eligibility or an application outcome.</p>
    <h3 className="mt-5 font-semibold">Source notices</h3>
    {o.citations.length ? <EvidenceLinks ids={o.citations.map(c => c.id)} citations={o.citations} /> : <p className="mt-2 text-muted-foreground">No public source reference is available. Return to the catalogue for a listing with source details.</p>}
    <dl className="mt-6 space-y-4">{Object.entries(scopes).map(([scope, label]) => {
      const checks = o.checks.filter(check => check.scope === scope)
      return <div key={scope} className="rounded-lg border border-border p-4">
        <dt className="font-semibold">{label}</dt>
        <dd className="mt-2 text-sm leading-relaxed">{checks.length ? <ul className="space-y-4">{checks.map((check, index) => <li key={`${check.checkedAt}:${index}`}>
          <p className="font-medium">{outcomes[check.outcome]}</p>
          <p className="mt-1 text-muted-foreground">{check.method === "automatic" ? "Automated check" : check.method === "human" ? "Human check" : "Check method not recorded"} · Checked <CheckTime value={check.checkedAt} /></p>
          {check.nextCheckAt && <p className="mt-1 text-muted-foreground">Recorded next-check time: <CheckTime value={check.nextCheckAt} />. This is not evidence that another check has occurred.</p>}
          <EvidenceLinks ids={check.citations} citations={o.citations} />
        </li>)}</ul> : <p className="text-muted-foreground">No recorded check for this question.</p>}</dd>
      </div>
    })}</dl>
    <p className="mt-5 text-sm text-muted-foreground">Listing updated <CheckTime value={o.updatedAt} />. This update time is separate from each source check.</p>
    <p className="mt-3 text-sm text-muted-foreground">For missing, failed or conflicting information, read the cited notice and confirm with the issuer using the details there before acting. A failed check alone does not mean the opportunity has closed.</p>
  </section>
}
