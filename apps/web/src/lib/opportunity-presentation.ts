import { ENTRY_STAGE_LABELS, type PublicOpportunity } from "@skilved/types/opportunities"

export const opportunityIdentity = {
  bursary: { label: "Bursary", theme: "tone-study", verb: "Fund your studies", action: "Explore this bursary", focus: "Study support" },
  learnership: { label: "Learnership", theme: "tone-learn", verb: "Learn through doing", action: "Explore this learnership", focus: "Learning & work" },
  apprenticeship: { label: "Apprenticeship", theme: "tone-craft", verb: "Build your craft", action: "Explore this apprenticeship", focus: "Trade pathway" },
  internship: { label: "Internship", theme: "tone-experience", verb: "Put learning into practice", action: "Explore this internship", focus: "Practical experience" },
  graduate_programme: { label: "Graduate programme", theme: "tone-graduate", verb: "Take your next step", action: "Explore this programme", focus: "Graduate pathway" },
  job: { label: "Job", theme: "tone-work", verb: "Find your next role", action: "Explore this role", focus: "Work opportunity" },
} as const

export const provinceLabels: Record<string, string> = { eastern_cape: "Eastern Cape", free_state: "Free State", gauteng: "Gauteng", kwazulu_natal: "KwaZulu-Natal", limpopo: "Limpopo", mpumalanga: "Mpumalanga", north_west: "North West", northern_cape: "Northern Cape", western_cape: "Western Cape" }
export const supportLabels = { salary: "Salary", stipend: "Stipend", tuition: "Tuition", books: "Books", accommodation: "Accommodation", transport: "Transport", allowance: "Allowance", other: "Other support" }
const attendanceLabels = { remote: "Remote", hybrid: "Hybrid", in_person: "In person", not_stated: "Attendance not stated" }

export function uncertainty(state: string, fallback = "Not stated") {
  return state === "conflicting" ? "Sources disagree" : state === "ambiguous" ? "Needs clarification" : fallback
}
export function placeLabel(o: PublicOpportunity) {
  if (o.location.state !== "stated" || !o.location.value) return uncertainty(o.location.state, "Location not stated")
  const location = o.location.value
  if (location.attendance === "remote") return "Remote"
  if (location.coverage === "national") return "National"
  return location.places.map(p => [p.city, p.province ? provinceLabels[p.province] ?? p.province.replaceAll("_", " ") : null, p.country === "ZA" ? null : p.country].filter(Boolean).join(", ")).join(" · ") || "Location not stated"
}
export function supportAmount(value: NonNullable<PublicOpportunity["compensation"][number]["value"]>) {
  if (value.amount === null || !value.currency) return null
  const periods = { hour: "per hour", day: "per day", week: "per week", month: "per month", year: "per year", once: "once", programme: "for the programme", not_stated: "period not stated" }
  const number = (amount: number) => amount.toLocaleString("en-GB", { maximumFractionDigits: 20 })
  return `${value.currency} ${number(value.amount)}${value.maximum !== null && value.maximum !== value.amount ? `–${number(value.maximum)}` : ""} ${periods[value.period]}`
}
export function opportunityFacts(o: PublicOpportunity) {
  const statedSupport = o.compensation.filter(f => f.state === "stated" && f.value)
  const kinds = [...new Set(statedSupport.map(f => supportLabels[f.value!.kind]))]
  const unresolvedSupport = o.compensation.some(f => f.state !== "stated")
  const stages = o.entryStage?.state === "stated" && o.entryStage.value
  const priced = statedSupport.find(f => f.value!.amount !== null && f.value!.currency)?.value
  const supportDetail = priced ? `${supportLabels[priced.kind]}: ${supportAmount(priced)}` : "See the original wording"
  return {
    place: placeLabel(o),
    attendance: o.location.state === "stated" && o.location.value ? attendanceLabels[o.location.value.attendance] : "Attendance not established",
    support: kinds.length ? kinds.join(" + ") + (unresolvedSupport ? " · other details unclear" : "") : o.compensation.some(f => f.state === "conflicting") ? "Sources disagree" : o.compensation.some(f => f.state === "ambiguous") ? "Support needs clarification" : "Support not stated",
    supportDetail,
    stage: stages ? stages.map(s => ENTRY_STAGE_LABELS[s]).join(" · ") : uncertainty(o.entryStage?.state ?? "not_stated", "Entry stage not stated"),
    deadline: o.deadline.state === "stated" ? o.deadline.originalText ?? o.deadline.value?.originalText ?? "Closing date not stated" : uncertainty(o.deadline.state, "Closing date not stated"),
  }
}
export function noticeDate(o: PublicOpportunity) {
  const deadline = o.deadline.state === "stated" ? o.deadline.value : null
  if (!deadline || deadline.kind !== "date" || !deadline.localDate) return null
  // Format a calendar date without inventing a closing time, zone or countdown.
  const [year, month, day] = deadline.localDate.split("-")
  return { year, day, month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(month) - 1], iso: deadline.localDate }
}
export function issuerInitials(o: PublicOpportunity) {
  const issuer = o.issuer.state === "stated" ? o.issuer.value : null
  return issuer ? issuer.trim().split(/\s+/u).slice(0, 2).map(part => Array.from(part)[0]).join("").toLocaleUpperCase("en-ZA") : "?"
}
export function requirementRoute(o: PublicOpportunity) {
  const expression = o.requirements.expression
  if (expression.op === "any") return "Alternative routes in the notice"
  if (expression.op === "all") return "Combined conditions in the notice"
  if (expression.op === "if") return "Conditional routes in the notice"
  if (expression.op === "unknown") return "Requirement relationship needs clarification"
  return "An instruction to review"
}
