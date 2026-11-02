import assert from "node:assert/strict"
import {createRequire} from "node:module"
import {test} from "node:test"
import {loadUi} from "./helpers/load-ui.mjs"
import {makeRecord} from "../../../packages/types/tests/fixtures/opportunities.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server")
const {projectOpportunity}=require("@skilved/types/opportunities/internal"),{PublicOpportunitySchema}=require("@skilved/types/opportunities")
const {evidenceQuestions,evidenceOverview}=loadUi("lib/source-evidence.ts")
const {SourceEvidence,SourceEvidenceSummary}=loadUi("components/catalogue/SourceEvidence.tsx")
const example=()=>projectOpportunity(makeRecord()).opportunity
const render=(Component,o)=>renderToStaticMarkup(React.createElement(Component,{opportunity:o}))

test("several records for one question remain distinct and counts never become a pass rate",()=>{
 const o=example(),original=o.checks[0]
 o.checks=[original,{...original,outcome:"contradicted",checkedAt:"2026-10-15T10:00:00.000Z"},{...original,outcome:"unresolved",checkedAt:"2026-10-16T10:00:00.000Z"}]
 PublicOpportunitySchema.parse(o)
 assert.deepEqual(evidenceOverview(o),{sources:1,records:3,withoutRecords:5})
 const html=render(SourceEvidenceSummary,o)
 assert.match(html,/not an overall verdict/)
 assert.doesNotMatch(html,/score|%|progress|verified opportunity/i)
 const detail=render(SourceEvidence,o)
 for(const wording of ["Supported by the cited evidence","Conflicting evidence; needs review","Unresolved; needs confirmation"])assert.ok(detail.includes(wording))
})

test("record ordering uses check time without mutating the public projection or removing older outcomes",()=>{
 const o=example(),check=o.checks[0]
 o.checks=[{...check,checkedAt:"2026-10-15T10:00:00.000Z",outcome:"failed"},{...check,checkedAt:"2026-10-17T10:00:00.000Z",outcome:"supported"},{...check,checkedAt:"2026-10-16T10:00:00.000Z",outcome:"unresolved"},{...check,checkedAt:"2026-10-15T10:00:00.900Z",outcome:"contradicted"}]
 PublicOpportunitySchema.parse(o)
 const before=JSON.stringify(o)
 const question=evidenceQuestions(o).find(q=>q.scope==="application_relationship")
 assert.deepEqual(question.checks.map(c=>c.outcome),["supported","unresolved","contradicted","failed"])
 assert.equal(JSON.stringify(o),before)
 const html=render(SourceEvidence,o)
 assert.ok(html.indexOf("Supported by the cited evidence")<html.indexOf("Unresolved; needs confirmation"))
 assert.ok(html.indexOf("Unresolved; needs confirmation")<html.indexOf("Conflicting evidence; needs review"))
 assert.ok(html.indexOf("Conflicting evidence; needs review")<html.indexOf("Check failed; needs confirmation"))
})

test("recorded checks open initially while missing questions remain explicit and independently expandable",()=>{
 const o=example(),html=render(SourceEvidence,o),groups=evidenceQuestions(o)
 assert.equal(groups.length,6)
 assert.equal((html.match(/class="evidence-question" open=""/g)??[]).length,1)
 for(const group of groups)assert.ok(html.includes('id="'+group.href.slice(1)+'"'))
 assert.equal((html.match(/No check recorded/g)??[]).length,5)
 assert.match(render(SourceEvidenceSummary,o),/href="#evidence-questions"/)
})

test("a reachable destination does not create an availability, issuer or requirement check",()=>{
 const o=example();o.checks=[{...o.checks[0],scope:"destination_reachability",outcome:"supported"}]
 const groups=evidenceQuestions(o)
 for(const scope of ["availability","issuer_attribution","requirements"])assert.equal(groups.find(q=>q.scope===scope).checks.length,0)
 assert.match(render(SourceEvidence,o),/reachable website does not establish who issued/)
 assert.deepEqual(evidenceOverview(o),{sources:1,records:1,withoutRecords:5})
 o.checks=[]
 const html=render(SourceEvidence,o)
 assert.equal((html.match(/<time /g)??[]).length,1)
 assert.equal((html.match(/No recorded check for this question/g)??[]).length,6)
})

test("long source labels and addresses remain escaped, inspectable and attached to the correct check",()=>{
 const o=example()
 o.citations.push({id:"secondary",label:"Secondary source "+ "long label ".repeat(15)+"<unsafe>",url:"https://secondary.example/notice?reference="+ "x".repeat(300)+"&view=full"})
 o.checks[0].citations=["secondary"]
 PublicOpportunitySchema.parse(o)
 const html=render(SourceEvidence,o)
 assert.match(html,/&lt;unsafe&gt;/);assert.doesNotMatch(html,/<unsafe>/)
 assert.match(html,/secondary.example/)
 assert.match(html,/Inspect the address/)
 const question=html.slice(html.indexOf('id="source-check-application_relationship"'),html.indexOf('id="source-check-destination_reachability"'))
 assert.match(question,/https:\/\/secondary.example/)
 assert.doesNotMatch(question,/https:\/\/issuer.example/)
 assert.match(question,/target="_blank" rel="noreferrer noopener"/)
})

test("listing and recorded next-check times retain their separate meanings and exact SAST dates",()=>{
 const o=example();o.updatedAt="2026-10-20T10:00:00.000Z";o.checks[0].checkedAt="2026-10-15T10:00:00.000Z";o.checks[0].nextCheckAt="2026-10-16T10:00:00.000Z";o.checks[0].method="automatic"
 const html=render(SourceEvidence,o)
 assert.match(html,/datetime="2026-10-15T10:00:00.000Z"/i)
 assert.match(html,/datetime="2026-10-16T10:00:00.000Z"/i)
 assert.match(html,/datetime="2026-10-20T10:00:00.000Z"/i)
 assert.match(html,/12:00 SAST/)
 assert.match(html,/not evidence that another check has occurred/)
 assert.match(html,/update time is separate from each source check/)
 assert.doesNotMatch(html,/just verified|checked today|scheduled check completed/i)
})

test("missing source references and checks remain usable without invented notices or external requests",()=>{
 const o=example();o.citations=[];o.checks=[]
 const html=render(SourceEvidence,o)
 assert.match(html,/No public source reference is available/)
 assert.deepEqual(evidenceOverview(o),{sources:0,records:0,withoutRecords:6})
 assert.doesNotMatch(html,/<img|<iframe|<script|issuer.example|snapshot_fixture|PRIVATE_/)
})
