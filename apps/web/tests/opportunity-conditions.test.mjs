import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { loadUi } from "./helpers/load-ui.mjs"
import { allFixtures, makeRecord } from "../../../packages/types/tests/fixtures/opportunities.mjs"

const require = createRequire(import.meta.url), React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")
const { projectOpportunity } = require("@skilved/types/opportunities/internal")
const { PublicOpportunitySchema } = require("@skilved/types/opportunities")
const components = loadUi("components/catalogue/OpportunityConditions.tsx")
const render = (name, o) => renderToStaticMarkup(React.createElement(components[name], { opportunity: PublicOpportunitySchema.parse(o) }))
const opportunity = () => projectOpportunity(makeRecord()).opportunity
const unknown = state => ({ state, value: null, originalText: state === "not_stated" ? null : "Synthetic wording needs clarification.", citations: state === "not_stated" ? [] : ["citation_fixture"] })

test("all six categories and both internships show actual route, roles, conditions and support without private data", () => {
  for (const record of allFixtures()) {
    const o = projectOpportunity(record).opportunity
    const context = render("OpportunityContext", o), conditions = render("OpportunityConditions", o)
    if (o.category === "internship") assert.match(context, o.internship.subtype === "graduate" ? /Graduate internship/ : /Student \/ work-integrated learning \(WIL\) internship/)
    else assert.doesNotMatch(context, /Internship route|Graduate internship/)
    assert.match(context, /Issuer: Fictional Learning Workshop/)
    assert.match(context, /Fictional 2027 intake A/)
    assert.match(conditions, /Listed places: Fictional City, gauteng, ZA/)
    assert.match(conditions, /Coverage: Local. Attendance: In person/)
    assert.match(conditions, /Relocation: Not stated/)
    assert.match(conditions, /Residence conditions/)
    assert.match(conditions, /Stipend · Per month/)
    assert.match(conditions, /Wording in the notice: Fictional stipend: ZAR 4000 per month/)
    assert.match(conditions, /Tuition · For the programme/)
    assert.match(conditions, /Consider travel, accommodation and other recurring costs/)
    assert.doesNotMatch(context + conditions, /PRIVATE_|reviewer_fixture|snapshot_fixture|assertion_|private.example/)
  }
})

test("other and unknown internship routes retain wording without choosing student or graduate", () => {
  for (const subtype of ["other_stated", "unknown"]) {
    const o = projectOpportunity(makeRecord("internship", subtype)).opportunity
    const html = render("OpportunityContext", o)
    assert.match(html, subtype === "unknown" ? /Internship route not established/ : /Other route stated in the notice/)
    if (subtype === "other_stated") assert.match(html, /Fictional other internship route/)
    assert.doesNotMatch(html, /Graduate internship|Student \/ work-integrated/)
    assert.match(html, /does not decide eligibility/)
  }
})

test("roles and location attendance stay distinct from residence with fact-specific citations", () => {
  const o = opportunity()
  o.citations.push({ id: "host_notice", label: "Host notice", url: "https://host.example/notice" })
  const fact = (role, name) => ({ ...o.organisations[0], value: { role, name }, originalText: name + " stated role.", citations: ["host_notice"] })
  o.organisations = [fact("employer_host", "Host A"), fact("training_provider", "Provider B"), fact("qualification_issuer", "Issuer C"), fact("oversight", "Body D")]
  o.location.value = { places: [], coverage: "national", attendance: "hybrid", relocation: "Relocation at own expense" }
  o.location.originalText = "Synthetic national coverage with hybrid attendance; relocation at own expense."
  o.residence = { ...o.intake, value: "Resident in the stated district", originalText: "Synthetic residence restriction: district only." }
  const html = render("OpportunityContext", o), conditions = render("OpportunityConditions", o)
  for (const label of ["Employer or host: Host A", "Training provider: Provider B", "Qualification issuer: Issuer C", "Oversight body: Body D"]) assert.ok(html.includes(label), label)
  const roles = html.slice(html.indexOf("Organisations and roles"))
  assert.match(roles, /href="https:\/\/host.example\/notice"/)
  assert.doesNotMatch(roles, /https:\/\/issuer.example\/notice/)
  assert.match(conditions, /Coverage: National. Attendance: Hybrid/)
  assert.match(conditions, /Relocation: Relocation at own expense/)
  assert.match(conditions, /Synthetic residence restriction: district only/)
  assert.match(conditions, /does not establish residence eligibility or relocation support/)
})

test("uncertain and absent conditions never assert structured values and give clarification next steps", () => {
  for (const state of ["not_stated", "ambiguous", "conflicting"]) {
    const o = opportunity()
    for (const key of ["location", "residence", "experience", "intake", "practicalConditions"]) o[key] = unknown(state)
    o.organisations = [unknown(state)]
    o.compensation = [unknown(state)]
    const html = render("OpportunityContext", o) + render("OpportunityConditions", o)
    assert.match(html, state === "ambiguous" ? /The notice is unclear/ : state === "conflicting" ? /The sources disagree/ : /Not stated in the reviewed notice/)
    assert.doesNotMatch(html, /Attendance: In person|Employer or host:|Stipend ·|ZAR 4000|Fictional City/)
    assert.match(html, /ask the issuer through the contact details/)
    assert.match(html, /Missing support details do not mean support is offered or excluded/)
  }
  const o = opportunity(); o.organisations = []; o.compensation = []
  assert.match(render("OpportunityContext", o), /No additional organisation roles are stated/)
  assert.match(render("OpportunityConditions", o), /Pay and support are not stated/)
})

test("projection removes pending facts and rendered public wording escapes markup", () => {
  const record = makeRecord()
  for (const fact of [record.location, record.practicalConditions, ...record.compensation, ...record.organisations]) {
    fact.review = "pending"; fact.originalText = "PRIVATE_UNREVIEWED_CONDITION"
  }
  const hidden = projectOpportunity(record).opportunity
  assert.doesNotMatch(render("OpportunityContext", hidden) + render("OpportunityConditions", hidden), /PRIVATE_UNREVIEWED_CONDITION|Stipend ·|Attendance: In person|Issuer: Fictional/)
  const o = opportunity()
  o.practicalConditions.originalText = '<script>condition</script> & obligations'
  o.citations[0].label = '<img onerror=bad> notice'
  const html = render("OpportunityConditions", o)
  assert.match(html, /&lt;script&gt;condition&lt;\/script&gt; &amp; obligations/)
  assert.match(html, /&lt;img onerror=bad&gt; notice/)
  assert.doesNotMatch(html, /<script>|<img onerror/)
})
