import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { allFixtures, makeRecord } from "../../../packages/types/tests/fixtures/opportunities.mjs"
import { loadUi } from "./helpers/load-ui.mjs"

const require = createRequire(import.meta.url), React = require("react"), { renderToStaticMarkup } = require("react-dom/server")
const { projectOpportunity } = require("@skilved/types/opportunities/internal")
const { PublicOpportunitySchema } = require("@skilved/types/opportunities")
const presentation = loadUi("lib/opportunity-presentation.ts")
const { OpportunityPost } = loadUi("components/catalogue/OpportunityPost.tsx")
const { OpportunityOverview, ApplicationDate } = loadUi("components/catalogue/OpportunityOverview.tsx")
const { PreparationChecklist } = loadUi("components/catalogue/PreparationChecklist.tsx")
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props))
const example = () => projectOpportunity(makeRecord()).opportunity
const uncertain = state => ({ state, value: null, originalText: state === "not_stated" ? null : "Conflicting source wording <script>unsafe</script>", citations: state === "not_stated" ? [] : ["citation_fixture"] })

test("category cards retain contextual navigation, original connected instructions and escaped source content", () => {
  for (const record of allFixtures()) {
    const o = projectOpportunity(record).opportunity
    o.title.value += " <script>unsafe</script>"
    const html = render(OpportunityPost, { opportunity: o, query: new URLSearchParams("category=" + o.category + "&province=gauteng") })
    const links=[...html.matchAll(/href="(\/opportunities\/[^\"]*)"/g)].map(match=>match[1])
    assert.equal(links.length,6+o.compensation.length)
    assert.equal(links.filter(link=>!link.includes("#")).length,2)
    for(const anchor of ["#preparation","#funding-heading","#evidence","#deadline-heading",...o.compensation.map((_,index)=>`#support-entry-${index+1}`)])assert.equal(links.filter(link=>link.endsWith(anchor)).length,1)
    assert.match(html, /from=%2F%3Fcategory%3D/)
    assert.match(html, /ANY of .* OR /)
    assert.match(html, /1 source reference to inspect/)
    assert.match(html, /&lt;script&gt;unsafe&lt;\/script&gt;/)
    assert.doesNotMatch(html, /<script>|PRIVATE_|verified opportunity|days left/i)
    assert.ok(html.includes(presentation.opportunityIdentity[o.category].action))
  }
})

test("a calendar date never invents a time, timezone, countdown or closed state", () => {
  const o = example()
  assert.deepEqual(presentation.noticeDate(o), { year: "2026", day: "30", month: "Oct", iso: "2026-10-30" })
  const html = render(OpportunityPost, { opportunity: o, query: new URLSearchParams() })
  assert.match(html, /time and timezone not stated/)
  assert.doesNotMatch(html, /Closed intake|Intake closed|days left|hours left/)
  o.deadline = { state: "stated", value: {kind:"open_until_filled",originalText:"Until filled",localDate:null,localTime:null,timezone:null,utcInstant:null},originalText:"Until filled",citations:["citation_fixture"] }
  PublicOpportunitySchema.parse(o)
  assert.equal(presentation.noticeDate(o), null)
  assert.match(render(OpportunityPost, { opportunity: o, query: new URLSearchParams() }), /Until filled/)
  o.lifecycle = "closed"
  o.application = { state:"unavailable",reason:"closed" }
  assert.match(render(OpportunityPost, { opportunity: PublicOpportunitySchema.parse(o), query: new URLSearchParams() }), /Closed intake/)
})

test("unknown, ambiguous and conflicting facts stay distinct and do not imply eligibility or absent support", () => {
  for (const state of ["not_stated", "ambiguous", "conflicting"]) {
    const o = example()
    o.location = uncertain(state); o.deadline = uncertain(state); o.entryStage = uncertain(state); o.compensation = [uncertain(state)]
    PublicOpportunitySchema.parse(o)
    const facts = presentation.opportunityFacts(o)
    assert.equal(presentation.noticeDate(o), null)
    assert.equal(facts.place, state === "not_stated" ? "Location not stated" : state === "conflicting" ? "Sources disagree" : "Needs clarification")
    assert.equal(facts.support, state === "not_stated" ? "Support not stated" : state === "conflicting" ? "Sources disagree" : "Support needs clarification")
    const html = render(OpportunityOverview, { opportunity: o })
    assert.match(html, /href="#deadline-heading">Closing date/)
    assert.match(html, /href="#entry-stage-heading">Entry stage/)
    assert.match(html, /href="#funding-heading">Pay or support/)
    assert.doesNotMatch(html, /Fictional City|4,000|30 October|you qualify|No support offered/i)
    if (state !== "not_stated") assert.match(render(ApplicationDate, { opportunity: o }), /Wording in the notice: Conflicting source wording &lt;script&gt;unsafe&lt;\/script&gt;/)
  }
})

test("stated support preserves ranges, period, zero and currency while mixed uncertainty remains visible", () => {
  const o = example()
  o.compensation.push(uncertain("conflicting"))
  let facts = presentation.opportunityFacts(o)
  assert.equal(facts.support, "Stipend + Tuition · other details unclear")
  assert.equal(facts.supportDetail, "Stipend: ZAR 4,000 per month")
  o.compensation[0].value.maximum = 6000
  assert.equal(presentation.opportunityFacts(o).supportDetail, "Stipend: ZAR 4,000–6,000 per month")
  o.compensation[0].value.amount = 0; o.compensation[0].value.maximum = null; o.compensation[0].value.period = "not_stated"
  assert.equal(presentation.opportunityFacts(o).supportDetail, "Stipend: ZAR 0 period not stated")
  o.compensation[0].value.currency = null
  assert.equal(presentation.opportunityFacts(o).supportDetail, "See the original wording")
})

test("residence and attendance are not inferred from a place or remote arrangement", () => {
  const o = example()
  o.location.value = { places: [], coverage: "national", attendance: "not_stated", relocation: null }
  assert.equal(presentation.placeLabel(o), "National")
  assert.equal(presentation.opportunityFacts(o).attendance, "Attendance not stated")
  o.location.value.attendance = "remote"
  assert.equal(presentation.placeLabel(o), "Remote")
  const html = render(OpportunityOverview, { opportunity: o })
  assert.match(html, /href="#residence-heading">Residence conditions/)
  assert.doesNotMatch(html, /Everyone eligible|Anyone can apply|Relocation provided/)
})

test("nested requirement branches keep AND, OR and IF paths with a distinct review control per instruction", () => {
  const o = example()
  o.requirements.expression = { op:"all",children:[{op:"any",children:[{op:"ref",id:"matric"},{op:"ref",id:"n2"}]},{op:"if",condition:"matric",then:{op:"ref",id:"n2"},otherwise:{op:"unknown",originalText:"Confirm the other route <script>unsafe</script>"}}] }
  const html = render(PreparationChecklist, { id:o.id,revision:o.revision,requirements:o.requirements })
  for (const wording of ["All of these together", "At least one of these routes", "If this condition applies", "Then follow", "Otherwise follow", "Relationship needs confirmation", "ALL of", "ANY of", "IF "]) assert.ok(html.includes(wording), wording)
  assert.equal((html.match(/type="checkbox"/g) ?? []).length, 2)
  assert.equal((html.match(/id="review-instruction-matric"/g) ?? []).length, 1)
  assert.match(html, /href="#review-instruction-n2"/)
  assert.match(html, /&lt;script&gt;unsafe&lt;\/script&gt;/)
  assert.doesNotMatch(html, /<script>|checked=""/)
})
