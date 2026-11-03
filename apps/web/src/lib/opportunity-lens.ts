import type { PublicOpportunity } from "@skilved/types/opportunities"
import { opportunityFacts, requirementRoute, uncertainty } from "./opportunity-presentation"

export type LensFact = { key: string; label: string; value: string; detail?: string; href: string; unresolved: boolean }
type Wording = PublicOpportunity["experience"]
function wording(fact: Wording, missing: string) {
  return fact.state === "stated" && fact.value
    ? fact.originalText ?? fact.value
    : uncertainty(fact.state, missing)
}
const lenses = {
  bursary: { heading: "Build your study plan.", caption: "The funding picture", story: "What this bursary makes possible.", order: ["support", "fields", "education", "place", "conditions"], labels: {support:"Funding in the notice", fields:"Study fields", education:"Study entry conditions", conditions:"Funding & study arrangements"}, questions: ["Which costs are covered, and which stay with you?", "Does your course and study year meet the connected conditions?", "Which documents are needed, and at what stage?"] },
  learnership: { heading: "Understand the learning arrangement.", caption: "Learning meets work", story: "The learning and work ahead.", order: ["conditions", "support", "place", "education", "provider"], labels: {conditions:"Training arrangement", support:"Stipend & support", education:"Learning entry conditions"}, questions: ["How are learning and workplace time arranged?", "Which qualification is stated, and who awards it?", "What support and attendance commitments are specified?"] },
  apprenticeship: { heading: "Look at the path into the trade.", caption: "Your craft, in context", story: "The craft and the commitment.", order: ["fields", "support", "place", "conditions", "provider", "education"], labels: {fields:"Trade / field", support:"Pay & training support", conditions:"Training & workplace conditions", education:"Trade entry conditions"}, questions: ["Which trade and qualification does the notice name?", "Who provides training, and where is the workplace?", "What duration, assessment and support arrangements are stated?"] },
  internship: { heading: "Find the shape of the placement.", caption: "Experience with context", story: "Inside this placement.", order: ["route", "fields", "place", "support", "conditions", "education"], labels: {fields:"Placement discipline", support:"Placement support", conditions:"Placement arrangement", education:"Study & completion conditions"}, questions: ["Is this a student / WIL or graduate route?", "Are enrolment, completion or institution letters required?", "What are the placement duration, duties and support?"] },
  graduate_programme: { heading: "See where the programme could take you.", caption: "From study into practice", story: "Inside the graduate programme.", order: ["fields", "education", "place", "support", "conditions"], labels: {fields:"Programme fields", education:"Degree & completion conditions", support:"Programme pay & support", conditions:"Programme arrangement"}, questions: ["Which degree, discipline and completion dates are accepted?", "Does the notice describe rotations, training or a fixed placement?", "What duration and employment terms are actually stated?"] },
  job: { heading: "Get a clearer picture of the role.", caption: "The working picture", story: "The role behind the title.", order: ["support", "experience", "place", "conditions", "education"], labels: {support:"Pay & benefits in the notice", experience:"Experience wording", conditions:"Working conditions", education:"Education conditions"}, questions: ["What pay and benefits are stated?", "What contract, hours and working arrangement are specified?", "Which experience and skills are required or preferred?"] },
} as const

export function opportunityLens(o: PublicOpportunity) {
  const config = lenses[o.category], facts = opportunityFacts(o)
  const education = o.requirements.requirements.filter(r => r.kind === "education" || r.kind === "subjects")
  const providers = o.organisations.filter(f => f.state === "stated" && f.value?.role === "training_provider")
  const providerUnknown = o.organisations.some(f => f.state !== "stated")
  const practicalDetail = o.practicalConditions.state !== "stated" ? o.practicalConditions.originalText ?? undefined : undefined
  const entries: Record<string, LensFact> = {
    support: {key:"support",label:"Pay & support",value:o.category === "bursary" ? facts.support : facts.supportDetail !== "See the original wording" ? facts.supportDetail : facts.support,detail:facts.supportDetail !== "See the original wording" ? o.category === "bursary" ? facts.supportDetail : facts.support : "Check the source for amounts, coverage and conditions.",href:"#funding-heading",unresolved:!o.compensation.length || o.compensation.some(f => f.state !== "stated")},
    fields: {key:"fields",label:"Fields",value:o.fields.join(" · ") || "Field not stated",href:"#opportunity-story",unresolved:!o.fields.length},
    place: {key:"place",label:o.category === "bursary" ? "Study setting" : "Work / training setting",value:facts.place,detail:facts.attendance,href:"#location-heading",unresolved:o.location.state !== "stated" || o.location.value?.attendance === "not_stated"},
    education: {key:"education",label:"Education conditions",value:education.length ? `${education.length} education / subject instruction${education.length === 1 ? "" : "s"} to review` : "Education conditions not stated",detail:education.length ? requirementRoute(o) : "Read the complete connected requirements.",href:"#preparation",unresolved:!education.length || education.some(r => r.fact.state !== "stated" || r.level === "unclear")},
    experience: {key:"experience",label:"Experience",value:wording(o.experience,"Experience not stated"),detail:o.experience.state !== "stated" ? o.experience.originalText ?? undefined : undefined,href:"#experience-heading",unresolved:o.experience.state !== "stated"},
    conditions: {key:"conditions",label:"Practical conditions",value:wording(o.practicalConditions,"Practical conditions not stated"),detail:practicalDetail,href:"#arrangement-heading",unresolved:o.practicalConditions.state !== "stated"},
    provider: {key:"provider",label:"Training provider",value:providers.length ? providers.map(f => f.value!.name).join(" · ") : providerUnknown ? "Training provider needs clarification" : "Training provider not stated",detail:providerUnknown ? "Some organisation roles are unresolved." : "A provider name does not establish accreditation.",href:"#context-heading",unresolved:!providers.length || providerUnknown},
    route: {key:"route",label:"Placement route",value:o.internship?.subtype === "student_wil" ? "Student / work-integrated learning" : o.internship?.subtype === "graduate" ? "Graduate internship" : o.internship?.subtype === "other_stated" ? "Other route stated in the notice" : "Internship route not established",detail:o.internship?.originalText ?? "Check enrolment and completion conditions.",href:"#context-heading",unresolved:!o.internship || o.internship.subtype === "unknown"},
  }
  return { ...config, facts: config.order.map(key => ({...entries[key],label:(config.labels as Record<string,string>)[key] ?? entries[key].label})) }
}
