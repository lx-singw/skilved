import { ENTRY_STAGE_LABELS, parseReadQuery } from "@skilved/types/opportunities"
import { catalogueHref } from "./catalogue-query"
import { provinceLabels } from "./opportunity-presentation"

export const feedCategories = { bursary: "Bursaries", learnership: "Learnerships", apprenticeship: "Apprenticeships", internship: "Internships", graduate_programme: "Graduate programmes", job: "Jobs" }
const coverageLabels = {local:"Local coverage",national:"National coverage",international:"International coverage"}
export type FeedSelectionKey = "q" | "category" | "province" | "coverage" | "remote" | "field" | "stage"
export function changeFeed(input: URLSearchParams, changes: Partial<Record<FeedSelectionKey,string | null>>) {
  if (!parseReadQuery(input).ok) throw new Error("INVALID_QUERY")
  const next = new URLSearchParams(input)
  next.delete("cursor")
  for (const [key,value] of Object.entries(changes)) {
    if (value) next.set(key,value); else next.delete(key)
  }
  return catalogueHref(next)
}
export function feedSelections(input: URLSearchParams) {
  const parsed = parseReadQuery(input)
  if (!parsed.ok) throw new Error("INVALID_QUERY")
  const q = parsed.query
  const selections: {key:FeedSelectionKey;label:string}[] = []
  if (q.category) selections.push({key:"category",label:feedCategories[q.category]})
  if (q.q) selections.push({key:"q",label:`Search: ${q.q}`})
  if (q.province) selections.push({key:"province",label:provinceLabels[q.province]})
  if (q.coverage) selections.push({key:"coverage",label:coverageLabels[q.coverage]})
  if (q.remote !== undefined) selections.push({key:"remote",label:q.remote ? "Remote" : "In person or hybrid"})
  if (q.field) selections.push({key:"field",label:`Field: ${q.field}`})
  if (q.stage) selections.push({key:"stage",label:ENTRY_STAGE_LABELS[q.stage]})
  return selections.map(selection => ({...selection,href:changeFeed(input,{[selection.key]:null})}))
}
export function feedRecovery(input: URLSearchParams) {
  const parsed = parseReadQuery(input)
  if (!parsed.ok) throw new Error("INVALID_QUERY")
  const q = parsed.query
  const options: {title:string;description:string;href:string}[] = []
  if (q.q) options.push({title:"Try without the search phrase",description:`Remove “${q.q}” and keep your other choices.`,href:changeFeed(input,{q:null})})
  if (q.field) options.push({title:"Include every field",description:"Also includes notices with no field stated.",href:changeFeed(input,{field:null})})
  if (q.stage) options.push({title:"Include every entry stage",description:"Also includes notices with no entry stage stated.",href:changeFeed(input,{stage:null})})
  if (q.province || q.coverage || q.remote !== undefined) options.push({title:"Widen the location",description:"Remove province, coverage and attendance choices. Keep the rest.",href:changeFeed(input,{province:null,coverage:null,remote:null})})
  if (q.category) options.push({title:"Explore every category",description:"Keep your search and other choices across all opportunity types.",href:changeFeed(input,{category:null})})
  return options.slice(0,3)
}
export function feedResultsHeading(input: URLSearchParams) {
  const parsed = parseReadQuery(input)
  if (!parsed.ok) throw new Error("INVALID_QUERY")
  const q = parsed.query
  return q.q ? `Results for “${q.q}”` : q.category ? `${feedCategories[q.category]} to explore` : "Possibilities to explore"
}
