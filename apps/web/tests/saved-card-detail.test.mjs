import assert from "node:assert/strict"
import {createRequire} from "node:module"
import {test} from "node:test"
import {loadUi} from "./helpers/load-ui.mjs"
import {categories,makeRecord} from "../../../packages/types/tests/fixtures/opportunities.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server")
const {projectOpportunity}=require("@skilved/types/opportunities/internal")
const {readSavedSummary,createSavedSummaryReader}=loadUi("lib/saved-summary.ts")
const {SavedNoticePreview}=loadUi("components/catalogue/SavedNoticePreview.tsx")
const {PersonalProgressHistory}=loadUi("components/catalogue/PersonalProgressHistory.tsx")
const {SavedRevision}=loadUi("components/catalogue/SavedProgress.tsx",{"@/lib/use-local-progress":{},"@/lib/saved-summary":{}})
const example=(category="job",subtype="student_wil")=>projectOpportunity(makeRecord(category,subtype)).opportunity
const current=async o=>{
 const before=globalThis.fetch
 try{globalThis.fetch=async(url,options)=>{
  assert.equal(url,"/api/v1/opportunities/"+o.id);assert.equal(options.cache,"no-store");assert.equal(options.body,undefined)
  return new Response(JSON.stringify({kind:"opportunity",opportunity:o}))
 };return await readSavedSummary(o.id)}finally{globalThis.fetch=before}
}
const render=summary=>renderToStaticMarkup(React.createElement(SavedNoticePreview,{summary}))
const unknown=state=>({state,value:null,originalText:state==="not_stated"?null:"Unclear source wording <unsafe>",citations:state==="not_stated"?[]:["citation_fixture"]})
const item={opportunityId:"original",lastViewedRevision:1,savedAt:"2026-10-15T10:00:00.000Z",updatedAt:"2026-10-18T10:00:00.000Z",userStage:"not_pursuing",reportedAppliedAt:"2026-10-16T10:00:00.000Z",lastRouteOpenedAt:"2026-10-17T10:00:00.000Z"}

test("six categories bring their own two notice facts into the saved preview without application destinations",async()=>{
 const captions=new Set(),keys={bursary:["support","fields"],learnership:["conditions","support"],apprenticeship:["fields","support"],internship:["route","fields"],graduate_programme:["fields","education"],job:["support","experience"]}
 for(const category of categories){
  const o=example(category),summary=await current(o)
  assert.equal(summary.kind,"current");assert.deepEqual(summary.preview.facts.map(f=>f.key),keys[category])
  captions.add(summary.preview.caption)
  const html=render(summary)
  assert.match(html,/Fictional City, Gauteng/);assert.match(html,/In person/)
  assert.match(html,/Closing wording in the notice/);assert.match(html,/time and timezone not stated/)
  assert.doesNotMatch(html,/<a |<img|<iframe|<script|You qualify|Apply now/i)
  assert.doesNotMatch(JSON.stringify(summary),/destination|userStage|writeToken|PRIVATE_|snapshot_fixture|https:\/\/issuer.example\/apply/)
 }
 assert.equal(captions.size,6)
})

test("zero, exact ranges and unresolved support retain their separate meanings",async()=>{
 const o=example();o.compensation[0].value.amount=0;o.compensation[0].value.maximum=6000;o.compensation.push(unknown("conflicting"))
 const summary=await current(o),html=render(summary)
 assert.match(html,/Stipend: ZAR 0–6,000 per month/)
 assert.match(html,/other details unclear/);assert.equal(summary.preview.facts[0].unresolved,true)
 for(const state of ["not_stated","ambiguous","conflicting"]){
  o.compensation=[unknown(state)];o.experience=unknown(state)
  const s=await current(o),h=render(s)
  assert.equal(s.preview.facts[0].unresolved,true)
  assert.equal(s.preview.facts[1].value,state==="not_stated"?"Experience not stated":state==="ambiguous"?"Needs clarification":"Sources disagree")
  assert.doesNotMatch(h,/No support offered|No experience needed|You qualify/)
 }
})

test("graduate education previews preserve alternatives without turning them into combined eligibility",async()=>{
 const summary=await current(example("graduate_programme")),html=render(summary)
 assert.equal(summary.preview.facts[1].value,"2 education / subject instructions to review")
 assert.match(html,/Alternative routes in the notice/)
 assert.doesNotMatch(html,/Grade 12|N2 certificate|eligible|qualify/i)
})

test("saved internships retain each placement route rather than inferring a graduate route",async()=>{
 for(const [subtype,wording]of [["student_wil","Student / work-integrated learning"],["graduate","Graduate internship"],["other_stated","Other route stated in the notice"],["unknown","Internship route not established"]]){
  const summary=await current(example("internship",subtype))
  assert.equal(summary.preview.facts[0].value,wording)
  assert.equal(summary.preview.facts[0].unresolved,subtype==="unknown")
 }
})

test("long multiline wording remains complete and escaped behind a native disclosure",async()=>{
 const o=example("learnership"),wording="Fictional workshop arrangement ".repeat(30)+"\nFinal condition <unsafe>."
 o.practicalConditions.value=wording;o.practicalConditions.originalText=wording
 const summary=await current(o),html=render(summary)
 assert.match(html,/<details class="lens-long-wording">/);assert.match(html,/Read full wording/)
 assert.ok(html.includes(wording.replaceAll("<","&lt;").replaceAll(">","&gt;")))
 assert.doesNotMatch(html,/<unsafe>/)
})

test("closing-date ambiguity and disagreement remain distinct without a countdown or invented timezone",async()=>{
 const o=example()
 for(const state of ["not_stated","ambiguous","conflicting"]){
  o.deadline=unknown(state);o.location=unknown(state)
  const s=await current(o),html=render(s)
  assert.equal(s.deadline,state==="not_stated"?"Closing date not stated":state==="ambiguous"?"Needs clarification":"Sources disagree")
  assert.match(html,/Closing details/);assert.doesNotMatch(html,/Closing wording in the notice|days left|23:59|SAST/)
  if(state!=="not_stated")assert.match(html,/Wording to clarify: Unclear source wording &lt;unsafe&gt;/)
 }
})

test("personal history retains an earlier Applied report after setting aside and never infers submission",()=>{
 const before=JSON.stringify(item),html=renderToStaticMarkup(React.createElement(PersonalProgressHistory,{item}))
 for(const value of [item.savedAt,item.updatedAt,item.reportedAppliedAt,item.lastRouteOpenedAt])assert.ok(html.includes('dateTime="'+value+'"')||html.includes('datetime="'+value+'"'))
 assert.match(html,/Applied — marked by you/);assert.match(html,/not confirmed submission/)
 assert.match(html,/does not confirm that the issuer’s page loaded/)
 assert.match(html,/browser’s local timezone/)
 assert.equal(JSON.stringify(item),before)
 const absent=renderToStaticMarkup(React.createElement(PersonalProgressHistory,{item:{...item,reportedAppliedAt:null,lastRouteOpenedAt:null}}))
 assert.doesNotMatch(absent,/Applied — marked by you|Last route-opening action recorded/)
 assert.match(absent,/No route-opening action is recorded/)
})

test("a newer status read clears all prior preview facts while retaining the independent personal record",async()=>{
 const observations=[],s=await current(example()),before=JSON.stringify(item)
 let next=s
 const reader=createSavedSummaryReader(v=>observations.push(v),async()=>next)
 await reader.refresh("original");assert.equal(observations[1].preview.facts.length,2)
 for(const result of [{kind:"restricted",id:"original",revision:3},{kind:"missing"},{kind:"unavailable"}]){
  next=result;const pending=reader.refresh("original")
  assert.equal(observations.at(-1),null);await pending
  assert.deepEqual(observations.at(-1),result);assert.equal(observations.at(-1).preview,undefined)
 }
 reader.dispose();assert.equal(JSON.stringify(item),before)
})

test("compact change notices leave the primary action to the card while identity review stays explicit",()=>{
 let writes=0
 const props={item,id:item.opportunityId,revision:5,busy:false,change:()=>writes++,compact:true}
 const html=renderToStaticMarkup(React.createElement(SavedRevision,props))
 assert.match(html,/notice changed/);assert.match(html,/stage and history are kept/)
 assert.doesNotMatch(html,/<a |<button|Mark these details/)
 const identity=renderToStaticMarkup(React.createElement(SavedRevision,{...props,id:"resolved",alsoSaved:true}))
 assert.match(identity,/currently resolves to another listing/);assert.match(identity,/href="\/opportunities\/resolved"/)
 assert.match(identity,/retained separately/);assert.equal(writes,0)
})
