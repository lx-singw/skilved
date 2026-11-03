import type { PublicOpportunity } from "@skilved/types/opportunities"
type Instruction=PublicOpportunity["requirements"]["requirements"][number]
export const instructionKinds={education:"Education",subjects:"Subjects",age:"Age",citizenship:"Citizenship",experience:"Experience",residence:"Residence",availability:"Availability",document:"Document",funding:"Funding",other:"Other instruction"} as const
export const completionLabels={completed:"Completed as stated",provisional:"Provisional as stated",in_progress:"In progress as stated",not_stated:"Completion not stated"} as const
export function preparationDetails(item:Instruction,citations:PublicOpportunity["citations"]) {
  const value=item.fact.state==="stated"?item.fact.value:null
  const sources=[...new Set(item.fact.citations)].flatMap(id=>{const ref=citations.find(c=>c.id===id);return ref?[ref]:[]})
  return {kind:instructionKinds[item.kind],value,sources,qualification:value?.qualification??null,document:value?.document??null}
}
export function exactFileLimit(bytes:number|null) {
  return bytes===null?"Not stated in this entry":`${bytes.toLocaleString("en-GB")} byte${bytes===1?"":"s"}`
}
