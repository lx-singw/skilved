import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { allFixtures, makeRecord } from "../../../packages/types/tests/fixtures/opportunities.mjs"
import { loadUi } from "./helpers/load-ui.mjs"
const require=createRequire(import.meta.url),React=require("react")
const {renderToStaticMarkup}=require("react-dom/server")
const {projectOpportunity}=require("@skilved/types/opportunities/internal")
const {PublicOpportunitySchema,ENTRY_STAGE_LABELS}=require("@skilved/types/opportunities")
const {EntryStage}=loadUi("components/catalogue/EntryStage.tsx")
const render=o=>renderToStaticMarkup(React.createElement(EntryStage,{opportunity:o}))
test("entry stage displays reviewed labels, original wording and only its own citation across all categories",()=>{
 for(const record of allFixtures()){
  record.entryStage={...record.title,id:"stage_assertion",value:Object.keys(ENTRY_STAGE_LABELS),originalText:"Synthetic wording: several source-stated stages."}
  const o=projectOpportunity(record).opportunity
  o.citations.push({id:"stage_notice",label:"Stage notice",url:"https://stage.example/notice"})
  o.entryStage.citations=["stage_notice"];PublicOpportunitySchema.parse(o)
  const html=render(o)
  for(const label of Object.values(ENTRY_STAGE_LABELS))assert.ok(html.includes(label),label)
  assert.match(html,/Wording in the notice:/);assert.match(html,/Synthetic wording: several source-stated stages/);
  assert.match(html,/href="https:\/\/stage.example\/notice"/);assert.doesNotMatch(html,/https:\/\/issuer.example\/notice/)
  assert.match(html,/do not decide eligibility/);assert.match(html,/Entry level does not mean no experience is required/)
  assert.doesNotMatch(html,/PRIVATE_|reviewer_fixture|snapshot_fixture|stage_assertion/)
 }
})
test("missing and uncertain entry stage never choose labels or infer from an experienced job",()=>{
 const o=projectOpportunity(makeRecord("job")).opportunity
 delete o.entryStage
 assert.match(render(o),/No reviewed entry stage is stated here/)
 assert.doesNotMatch(render(o),/entry-stage-labels|Experienced/)
 for(const [state,text] of [["ambiguous","The entry stage is unclear"],["conflicting","Sources disagree"]]){
  o.entryStage={state,value:null,originalText:"Synthetic stage uncertainty.",citations:["citation_fixture"]}
  const html=render(PublicOpportunitySchema.parse(o))
  assert.ok(html.includes(text));assert.match(html,/Synthetic stage uncertainty/);assert.match(html,/confirm unclear conditions with the issuer/)
  assert.doesNotMatch(html,/entry-stage-labels/)
 }
})
test("unreviewed stages stay hidden and public wording/citation labels escape markup",()=>{
 const record=makeRecord()
 record.entryStage={...record.title,id:"stage_assertion",value:["entry_level"],originalText:"PRIVATE_UNREVIEWED_STAGE",review:"pending"}
 assert.doesNotMatch(render(projectOpportunity(record).opportunity),/PRIVATE_UNREVIEWED_STAGE|entry-stage-labels/)
 record.entryStage.review="approved";record.entryStage.originalText='Synthetic <script>wording</script> & conditions.'
 const o=projectOpportunity(record).opportunity;o.citations[0].label="Source <img onerror=bad>"
 const html=render(PublicOpportunitySchema.parse(o))
 assert.match(html,/&lt;script&gt;wording&lt;\/script&gt; &amp; conditions/);assert.match(html,/Source &lt;img onerror=bad&gt;/)
 assert.doesNotMatch(html,/<script>|<img onerror/)
})
