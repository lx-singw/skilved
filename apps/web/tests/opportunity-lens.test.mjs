import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { categories, makeRecord } from "../../../packages/types/tests/fixtures/opportunities.mjs"
import { loadUi } from "./helpers/load-ui.mjs"

const require = createRequire(import.meta.url), React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")
const { projectOpportunity } = require("@skilved/types/opportunities/internal")
const { PublicOpportunitySchema } = require("@skilved/types/opportunities")
const { opportunityLens } = loadUi("lib/opportunity-lens.ts")
const { OpportunityProfile, CategoryCardFacts } = loadUi("components/catalogue/OpportunityLens.tsx")
const render = (Component, o) => renderToStaticMarkup(React.createElement(Component, {opportunity:o}))
const example = (category="job",subtype="student_wil") => projectOpportunity(makeRecord(category,subtype)).opportunity
const unknown = state => ({state,value:null,originalText:state === "not_stated" ? null : "Source wording <script>unsafe</script>",citations:state === "not_stated" ? [] : ["citation_fixture"]})

test("each category prioritises its own decision facts and retains a setting in the card", () => {
  const first = {bursary:"support",learnership:"conditions",apprenticeship:"fields",internship:"route",graduate_programme:"fields",job:"support"}
  const headings = new Set()
  for (const category of categories) {
    const o = example(category), lens = opportunityLens(o)
    assert.equal(lens.facts[0].key, first[category])
    assert.ok(lens.facts.slice(0,4).some(f => f.key === "place"))
    assert.equal(new Set(lens.facts.map(f => f.key)).size,lens.facts.length)
    headings.add(lens.heading)
    const html = render(OpportunityProfile,o)
    for (const question of lens.questions) assert.ok(html.includes(question.replaceAll("&","&amp;")))
    assert.match(html,/prompts to check against the source, not extra application requirements/)
  }
  assert.equal(headings.size,6)
})

test("education previews count instructions without turning alternatives into combined entry conditions", () => {
  const o=example("bursary"), fact=opportunityLens(o).facts.find(f=>f.key==="education")
  assert.equal(fact.value,"2 education / subject instructions to review")
  assert.equal(fact.detail,"Alternative routes in the notice")
  assert.equal(fact.href,"#preparation")
  assert.doesNotMatch(render(CategoryCardFacts,o),/Grade 12|N2 certificate|You qualify/)
  o.requirements.requirements.forEach(r=>{r.kind="document"})
  assert.equal(opportunityLens(o).facts.find(f=>f.key==="education").value,"Education conditions not stated")
})

test("student, graduate, other and unknown placements retain their distinct route wording", () => {
  for (const [subtype,label] of [["student_wil","Student / work-integrated learning"],["graduate","Graduate internship"],["other_stated","Other route stated in the notice"],["unknown","Internship route not established"]]) {
    const o=example("internship",subtype), route=opportunityLens(o).facts[0]
    assert.equal(route.value,label)
    assert.equal(route.unresolved,subtype==="unknown")
    if(subtype==="other_stated")assert.equal(route.detail,"Fictional other internship route")
  }
})

test("missing, ambiguous and conflicting working conditions remain distinct and source wording is escaped", () => {
  for(const state of ["not_stated","ambiguous","conflicting"]){
    const o=example();o.experience=unknown(state);o.practicalConditions=unknown(state);o.compensation=[unknown(state)]
    PublicOpportunitySchema.parse(o)
    const lens=opportunityLens(o), experience=lens.facts.find(f=>f.key==="experience")
    assert.equal(experience.value,state==="not_stated"?"Experience not stated":state==="ambiguous"?"Needs clarification":"Sources disagree")
    assert.equal(experience.unresolved,true)
    const html=render(OpportunityProfile,o)+render(CategoryCardFacts,o)
    if(state!=="not_stated")assert.match(html,/&lt;script&gt;unsafe&lt;\/script&gt;/)
    assert.doesNotMatch(html,/<script>|Five years|ZAR 4,000|permanent contract|No support offered/)
  }
})

test("pay ranges and zero remain exact while additional unclear benefits stay visible",()=>{
  const o=example(),pay=o.compensation[0]
  pay.value.amount=0;pay.value.maximum=6000;o.compensation.push(unknown("conflicting"))
  PublicOpportunitySchema.parse(o)
  const support=opportunityLens(o).facts[0]
  assert.equal(support.value,"Stipend: ZAR 0–6,000 per month")
  assert.match(support.detail,/Tuition · other details unclear/)
  assert.equal(support.unresolved,true)
})

test("a qualification issuer or oversight body is never promoted to training provider",()=>{
  const o=example("apprenticeship")
  o.organisations[0].value.role="qualification_issuer"
  let provider=opportunityLens(o).facts.find(f=>f.key==="provider")
  assert.equal(provider.value,"Training provider not stated")
  o.organisations.push(unknown("conflicting"))
  provider=opportunityLens(o).facts.find(f=>f.key==="provider")
  assert.equal(provider.value,"Training provider needs clarification")
  o.organisations[0].value.role="training_provider"
  assert.match(opportunityLens(o).facts.find(f=>f.key==="provider").detail,/unresolved/)
})

test("long practical wording can be expanded without losing its end, multiline text or escaping",()=>{
  const o=example("learnership"),text="Long workshop arrangement ".repeat(20)+"\nLast source sentence <unsafe>."
  o.practicalConditions.value=text;o.practicalConditions.originalText=text
  PublicOpportunitySchema.parse(o)
  const html=render(CategoryCardFacts,o)
  assert.match(html,/<details class="lens-long-wording">/)
  assert.match(html,/Read full wording/)
  assert.ok(html.includes(text.replaceAll("<","&lt;").replaceAll(">","&gt;")))
  assert.doesNotMatch(html,/<unsafe>/)
})

test("support details show separate coverage and exact amounts without adding components together",()=>{
  const {OpportunityConditions}=loadUi("components/catalogue/OpportunityConditions.tsx")
  const o=example("bursary")
  o.compensation[0].value.amount=0
  o.compensation[1].value.coverage="Tuition only <unsafe>; accommodation excluded"
  const html=render(OpportunityConditions,o)
  assert.match(html,/ZAR 0 per month/)
  assert.match(html,/Tuition only &lt;unsafe&gt;; accommodation excluded/)
  assert.match(html,/Amount not stated/)
  assert.match(html,/Coverage not stated/)
  assert.doesNotMatch(html,/<unsafe>|Total funding/)
  const {OpportunityOverview}=loadUi("components/catalogue/OpportunityOverview.tsx")
  o.lifecycle="closed";o.application={state:"unavailable",reason:"closed"}
  PublicOpportunitySchema.parse(o)
  assert.match(render(OpportunityOverview,o),/Intake closed/)
})
