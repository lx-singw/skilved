import type { PublicOpportunity } from "@skilved/types/opportunities"
type Scope = PublicOpportunity["checks"][number]["scope"]
export const sourceQuestions: Record<Scope,{label:string;description:string}> = {
  issuer_attribution:{label:"Who issued the opportunity",description:"Does the evidence attribute this notice to the named issuer?"},
  announcement:{label:"Source announcement",description:"What public announcement supports this listing?"},
  application_relationship:{label:"Application route linked to the notice",description:"Does the recorded application route belong to this notice?"},
  destination_reachability:{label:"Application destination reachable",description:"Could the destination be reached at the recorded time?"},
  availability:{label:"Opportunity availability",description:"What was established about the intake’s availability?"},
  requirements:{label:"Requirement wording and meaning",description:"What was checked about the wording and connected requirements?"},
}
export function evidenceQuestions(o: PublicOpportunity) {
  return (Object.entries(sourceQuestions) as [Scope,{label:string;description:string}][]).map(([scope,question])=>({
    ...question,scope,href:`#source-check-${scope}`,
    checks:o.checks.filter(check=>check.scope===scope).sort((a,b)=>b.checkedAt.localeCompare(a.checkedAt)),
  }))
}
export function evidenceOverview(o: PublicOpportunity) {
  const groups=evidenceQuestions(o)
  return {sources:o.citations.length,records:o.checks.length,withoutRecords:groups.filter(group=>!group.checks.length).length}
}
