import type { PublicOpportunity } from "@skilved/types/opportunities"

export const organisationRoles = {
  issuer:{label:"Issuer",description:"Named as issuing the notice."},
  employer_host:{label:"Employer or host",description:"Named as the employer or placement host."},
  training_provider:{label:"Training provider",description:"Named as providing training."},
  qualification_issuer:{label:"Qualification issuer",description:"Named as issuing the qualification."},
  oversight:{label:"Oversight body",description:"Named in an oversight role."},
} as const
export const contextTitles = {
  bursary:"Funding intake & organisations",
  learnership:"Learning intake & organisations",
  apprenticeship:"Training intake & organisations",
  internship:"Internship route, intake & organisations",
  graduate_programme:"Programme intake & organisations",
  job:"Recruitment intake & organisations",
} as const
export const contextStates = {stated:"Stated in the notice",not_stated:"Not stated",ambiguous:"Needs clarification",conflicting:"Sources disagree"} as const
export function contextInventory(o:PublicOpportunity) {
  const stated=o.organisations.filter(fact=>fact.state==="stated"&&fact.value).length
  const unresolved=o.organisations.length-stated
  return {title:contextTitles[o.category],stated,unresolved,description:[
    `${stated} stated role entr${stated===1?"y":"ies"}`,
    ...(unresolved?[`${unresolved} unresolved entr${unresolved===1?"y":"ies"}`]:[]),
    `Intake: ${contextStates[o.intake.state].toLowerCase()}`,
  ].join(" · ")}
}
