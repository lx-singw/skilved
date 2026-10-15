import { ENTRY_STAGE_LABELS, type PublicOpportunity } from "@skilved/types/opportunities"

export function EntryStage({ opportunity }: { opportunity: PublicOpportunity }) {
  const fact = opportunity.entryStage
  const stated = fact?.state === "stated" && fact.value
  const uncertain = fact?.state === "ambiguous" || fact?.state === "conflicting"
  const citations = opportunity.citations.filter(c => fact?.citations.includes(c.id))
  return <section className="mt-8" aria-labelledby="entry-stage-heading">
    <h2 id="entry-stage-heading" className="text-xl font-semibold">Entry stage</h2>
    {stated ? <>
      <p className="mt-3 font-medium">Source-stated stage: {stated.map(stage => ENTRY_STAGE_LABELS[stage]).join(" · ")}</p>
      <p className="mt-3 whitespace-pre-wrap break-words text-muted-foreground"><span className="font-medium">Wording in the notice: </span>{fact.originalText}</p>
    </> : <p className="mt-3 text-muted-foreground">{fact?.state === "conflicting" ? "Sources disagree about the entry stage." : uncertain ? "The entry stage is unclear in the notice." : "No reviewed entry stage is stated here."} Read the full requirements and confirm unclear conditions with the issuer using the notice&apos;s contact details.</p>}
    {uncertain && fact.originalText && <p className="mt-3 whitespace-pre-wrap break-words text-muted-foreground">{fact.originalText}</p>}
    {citations.length > 0 && <ul className="mt-3 space-y-2">{citations.map(c => <li key={c.id}><a href={c.url} className="break-words text-primary underline">{c.label}</a></li>)}</ul>}
    <p className="mt-3 text-sm text-muted-foreground">These labels help with discovery; they do not decide eligibility. Entry level does not mean no experience is required.</p>
  </section>
}
