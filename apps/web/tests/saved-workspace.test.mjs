import assert from "node:assert/strict"
import { test } from "node:test"
import { loadUi } from "./helpers/load-ui.mjs"
const { savedWorkspace, savedCardState } = loadUi("lib/saved-workspace.ts")
const item = (id, stage="interested", saved="2026-10-01T00:00:00.000Z", updated=saved) => ({opportunityId:id,userStage:stage,savedAt:saved,updatedAt:updated,lastViewedRevision:2,lastRouteOpenedAt:null,reportedAppliedAt:stage==="applied_reported"?updated:null})
const current = {kind:"current",id:"one",revision:2,title:"Example",state:"published",category:"job",issuer:"Example issuer",deadline:"Date not stated"}

test("counts describe all local stages while each filtered view contains only its own records",()=>{
 const items=[item("one"),item("two","preparing"),item("three","preparing"),item("four","applied_reported"),item("five","not_pursuing")]
 for(const stage of ["all","interested","preparing","applied_reported","not_pursuing"]){
  const result=savedWorkspace(items,stage,"activity")
  assert.deepEqual(result.counts,{all:5,interested:1,preparing:2,applied_reported:1,not_pursuing:1})
  assert.equal(result.visible.length,result.counts[stage])
  if(stage!=="all")assert.ok(result.visible.every(value=>value.userStage===stage))
 }
})

test("ordering uses personal activity or saved time without mutating the stored order or stages",()=>{
 const items=[item("one","interested","2026-10-01T00:00:00.000Z","2026-10-04T00:00:00.000Z"),item("two","preparing","2026-10-03T00:00:00.000Z"),item("three","interested","2026-10-02T00:00:00.000Z")]
 const before=JSON.stringify(items)
 assert.deepEqual(savedWorkspace(items,"all","activity").visible.map(x=>x.opportunityId),["one","two","three"])
 assert.deepEqual(savedWorkspace(items,"all","saved").visible.map(x=>x.opportunityId),["two","three","one"])
 assert.equal(JSON.stringify(items),before)
})

test("filtering happens before display pagination and empty stages keep whole-list counts",()=>{
 const items=Array.from({length:45},(_,i)=>item("item_"+i,i>30?"preparing":"interested"))
 const result=savedWorkspace(items,"preparing","saved")
 assert.equal(result.visible.length,14);assert.equal(result.counts.all,45)
 assert.equal(savedWorkspace(items,"not_pursuing","activity").visible.length,0)
 assert.equal(savedWorkspace([],"all","activity").counts.all,0)
})

test("resume destinations reflect explicit personal stages only after current unchanged details load",()=>{
 for(const [stage,hash,action]of [["interested","","Take a closer look"],["preparing","#preparation","Continue preparing"],["applied_reported","#your-workspace","Review your record"],["not_pursuing","","Revisit this opportunity"]]){
  const saved=item("one",stage),before=JSON.stringify(saved),result=savedCardState(saved,current)
  assert.equal(result.href,"/opportunities/one"+hash);assert.equal(result.action,action);assert.equal(JSON.stringify(saved),before)
 }
 const opened={...item("one"),lastRouteOpenedAt:"2026-10-02T00:00:00.000Z"}
 assert.equal(savedCardState(opened,current).action,"Take a closer look")
})

test("changed or redirected records require review and never acknowledge versions or merge identities",()=>{
 const saved=item("one","preparing"),before=JSON.stringify(saved)
 for(const revision of [1,3]){
  const result=savedCardState(saved,{...current,revision})
  assert.equal(result.label,"Details have changed");assert.equal(result.href,"/opportunities/one")
 }
 const result=savedCardState(saved,{...current,id:"other"})
 assert.equal(result.label,"Reference needs review");assert.equal(result.href,"/opportunities/one");assert.equal(JSON.stringify(saved),before)
})

test("loading, outages, unavailable, missing and closed records never offer a preparation shortcut",()=>{
 const saved=item("one","preparing")
 for(const summary of [null,{kind:"unavailable"},{kind:"missing"},{kind:"restricted",id:"one",revision:3},{...current,state:"closed"}]){
  const result=savedCardState(saved,summary)
  assert.equal(result.href,"/opportunities/one")
  assert.doesNotMatch(result.action,/Continue preparing|Apply/)
 }
 assert.equal(savedCardState(saved,{kind:"unavailable"}).label,"Couldn’t load current details")
 assert.equal(savedCardState(saved,{kind:"missing"}).label,"Public listing not found")
 assert.equal(savedCardState(saved,{...current,state:"closed"}).label,"Intake closed")
})
