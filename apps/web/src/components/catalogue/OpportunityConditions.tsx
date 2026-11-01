import type { PublicOpportunity } from "@skilved/types/opportunities"

import { supportAmount } from "@/lib/opportunity-presentation"

type PublicFact = PublicOpportunity["practicalConditions"] | PublicOpportunity["location"] | PublicOpportunity["compensation"][number] | PublicOpportunity["organisations"][number]

const roles = { issuer: "Issuer", employer_host: "Employer or host", training_provider: "Training provider", qualification_issuer: "Qualification issuer", oversight: "Oversight body" }
const attendance = { in_person: "In person", hybrid: "Hybrid", remote: "Remote", not_stated: "Not stated" }
const coverage = { local: "Local", national: "National", international: "International", not_stated: "Not stated" }
const support = { salary: "Salary", stipend: "Stipend", tuition: "Tuition", books: "Books", accommodation: "Accommodation", transport: "Transport", allowance: "Allowance", other: "Other support" }
const periods = { hour: "Per hour", day: "Per day", week: "Per week", month: "Per month", year: "Per year", once: "Once", programme: "For the programme", not_stated: "Period not stated" }

function FactWording({ fact, citations }: { fact: PublicFact; citations: PublicOpportunity["citations"] }) {
  return <>
    {fact.state !== "stated" && <p>{fact.state === "ambiguous" ? "The notice is unclear about this." : fact.state === "conflicting" ? "The sources disagree about this." : "Not stated in the reviewed notice."}</p>}
    {fact.originalText && <p className="whitespace-pre-wrap break-words">Wording in the notice: {fact.originalText}</p>}
    {fact.citations.length > 0 && <ul className="mt-2 space-y-1">{fact.citations.map(id => {
      const citation = citations.find(item => item.id === id)
      return citation ? <li key={id}><a href={citation.url} rel="noreferrer noopener" className="break-words text-primary underline">{citation.label}</a></li> : null
    })}</ul>}
  </>
}

export function OpportunityContext({ opportunity: o }: { opportunity: PublicOpportunity }) {
  const subtype = o.internship
  return <section className="mt-8" aria-labelledby="context-heading">
    <h2 id="context-heading" className="text-xl font-semibold">About this opportunity</h2>
    <dl className="mt-4 space-y-4">
      {o.category === "internship" && <div><dt className="font-medium">Internship route</dt><dd className="mt-1 space-y-2 text-muted-foreground">
        <p>{subtype?.subtype === "student_wil" ? "Student / work-integrated learning (WIL) internship" : subtype?.subtype === "graduate" ? "Graduate internship" : subtype?.subtype === "other_stated" ? "Other route stated in the notice" : "Internship route not established."}</p>
        {subtype?.originalText && <p className="whitespace-pre-wrap break-words">Wording in the notice: {subtype.originalText}</p>}
        <p>Check enrolment, completion and institution-letter requirements in the notice; this route label does not decide eligibility.</p>
      </dd></div>}
      <div><dt className="font-medium">Intake or reference</dt><dd className="mt-1 space-y-2 text-muted-foreground"><FactWording fact={o.intake} citations={o.citations} /></dd></div>
      <div><dt className="font-medium">Organisations and roles</dt><dd className="mt-2 text-muted-foreground">
        {o.organisations.length ? <ul className="space-y-4">{o.organisations.map((fact, index) => <li key={index} className="space-y-2">
          {fact.state === "stated" && fact.value && <p className="break-words font-medium">{roles[fact.value.role]}: {fact.value.name}</p>}
          <FactWording fact={fact} citations={o.citations} />
        </li>)}</ul> : <p>No additional organisation roles are stated in the reviewed notice.</p>}
      </dd></div>
    </dl>
    <p className="mt-4 text-sm text-muted-foreground">For unclear roles or intake details, read the source notice and use its issuer contact details to ask for clarification.</p>
  </section>
}

export function OpportunityConditions({ opportunity: o }: { opportunity: PublicOpportunity }) {
  const location = o.location.state === "stated" ? o.location.value : null
  return <>
    <section className="mt-8" aria-labelledby="conditions-heading">
      <h2 id="conditions-heading" className="text-xl font-semibold">Experience and practical conditions</h2>
      <dl className="mt-5 space-y-5">
        <div><dt className="font-medium">Work or study location and attendance</dt><dd className="mt-1 space-y-2 text-muted-foreground">
          {location && <>
            <p className="break-words">Listed places: {location.places.map(place => [place.city, place.province?.replaceAll("_", " "), place.country].filter(Boolean).join(", ")).filter(Boolean).join(" · ") || "Not stated"}</p>
            <p>Coverage: {coverage[location.coverage]}. Attendance: {attendance[location.attendance]}.</p>
            <p className="whitespace-pre-wrap break-words">Relocation: {location.relocation ?? "Not stated"}</p>
          </>}
          <FactWording fact={o.location} citations={o.citations} />
        </dd></div>
        {([["Residence conditions", o.residence], ["Experience", o.experience], ["Duration and other practical conditions", o.practicalConditions]] as const).map(([label, fact]) => <div key={label}>
          <dt className="font-medium">{label}</dt><dd className="mt-1 space-y-2 text-muted-foreground"><FactWording fact={fact} citations={o.citations} /></dd>
        </div>)}
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">A listed location or national coverage does not establish residence eligibility or relocation support. If attendance, duration or another condition is missing or unclear, check the original notice and ask the issuer through the contact details given there before making arrangements.</p>
    </section>
    <section className="mt-8" aria-labelledby="funding-heading">
      <h2 id="funding-heading" className="text-xl font-semibold">Pay and support</h2>
      {o.compensation.length ? <ul className="support-ledger">{o.compensation.map((fact, index) => <li key={index} className="support-ledger-item">
        {fact.state === "stated" && fact.value && <p className="font-medium">{support[fact.value.kind]} · {periods[fact.value.period]}</p>}
        {fact.state === "stated" && fact.value && <div className="support-ledger-value"><strong>{supportAmount(fact.value) ?? "Amount or currency not stated"}</strong><p>Coverage: {fact.value.coverage ?? "Coverage not stated"}</p></div>}
        <FactWording fact={fact} citations={o.citations} />
      </li>)}</ul> : <p className="mt-3 text-muted-foreground">Pay and support are not stated in the reviewed notice.</p>}
      <p className="mt-4 text-sm text-muted-foreground">Consider travel, accommodation and other recurring costs. Check the notice for what support covers and when it is paid; ask the issuer using the notice’s contact details if this is unclear. Missing support details do not mean support is offered or excluded.</p>
    </section>
  </>
}
