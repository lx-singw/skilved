import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { makeRecord } from "../../../packages/types/tests/fixtures/opportunities.mjs"
import { loadUi } from "./helpers/load-ui.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server")
const {projectOpportunity}=require("@skilved/types/opportunities/internal"),{PublicOpportunitySchema}=require("@skilved/types/opportunities")
const {ApplicationPanel}=loadUi("components/catalogue/ApplicationPanel.tsx")
const {applicationRecoveryHtml}=loadUi("lib/application-recovery.ts")
const example=()=>projectOpportunity(makeRecord("job")).opportunity
const render=o=>renderToStaticMarkup(React.createElement(ApplicationPanel,{opportunity:PublicOpportunitySchema.parse(o)}))
function handler(read){return loadUi("app/opportunities/[id]/apply/route.ts",{"@/lib/public-catalogue":{readOpportunity:read}}).GET}
const request=(id,query)=>new Request("http://localhost/opportunities/"+id+"/apply"+query)
const context=id=>({params:Promise.resolve({id})})

test("each application method has a readable destination and only portal/email offer guarded opening",()=>{
 for(const method of ["portal","email","post","in_person"]){
  const o=example()
  o.application={state:"available",citations:["citation_fixture"],route:{method,destination:method==="portal"?"https://issuer.example/apply?notice=public":method==="email"?"applications+public@issuer.example":"Fictional Office\nDesk 12, Fictional City"}}
  const html=render(o)
  if(["portal","email"].includes(method)){
   assert.match(html,new RegExp('/opportunities/'+o.id+'/apply\\?revision=1'))
   assert.match(html,/target="_blank"/)
  }else assert.doesNotMatch(html,/\/apply\?revision=|mailto:/)
  if(method==="portal"){assert.match(html,/issuer.example/);assert.match(html,/See the full address/);assert.doesNotMatch(html,/href="https:\/\/issuer.example/)}
  if(method==="email"){assert.match(html,/applications\+public@issuer.example/);assert.match(html,/Copy address/);assert.match(html,/subject line and attachments/)}
  if(method==="post")assert.match(html,/Send the application by post/)
  if(method==="in_person")assert.match(html,/Apply in person/)
  assert.match(html,/opening a route does not mark an application as submitted/)
 }
})

test("closed and unavailable panels do not leak the old destination or offer an application action",()=>{
 const o=example();o.lifecycle="closed";o.application={state:"unavailable",reason:"closed"}
 let html=render(o)
 assert.match(html,/This intake is closed/)
 assert.doesNotMatch(html,/issuer.example\/apply|\/apply\?revision=|Copy address|Your next steps/)
 o.lifecycle="published";o.application={state:"unavailable",reason:"not_stated"}
 html=render(o);assert.match(html,/Application route unavailable/)
 assert.doesNotMatch(html,/\/apply\?revision=|Copy address/)
})

test("document instructions retain strength, uncertainty, conditional wording and a path to their connected route",()=>{
 const o=example(),r=o.requirements.requirements[1]
 r.kind="document";r.level="preferred";r.fact.value={description:"Academic record at appointment",qualification:null,document:{kind:"Academic record",stage:"At appointment",certification:null,format:null,maxBytes:null}}
 r.fact.originalText="If invited, bring the academic record <unsafe>; it is preferred at appointment."
 o.requirements.expression={op:"if",condition:"matric",then:{op:"ref",id:r.id},otherwise:null}
 let html=render(o)
 assert.match(html,/1 document instruction in the notice/)
 assert.match(html,/Preferred as stated/)
 assert.match(html,/If invited, bring the academic record &lt;unsafe&gt;/)
 assert.match(html,/href="#review-instruction-n2"/)
 assert.match(html,/Documents can apply to a particular route or stage/)
 assert.doesNotMatch(html,/<unsafe>|type="file"|Upload|All documents required/)
 r.fact={state:"conflicting",value:null,originalText:"The sources disagree about when this document is needed.",citations:["citation_fixture"]}
 html=render(o);assert.match(html,/Sources disagree about this instruction/)
})

test("successful portal and email handoffs re-read the canonical record and retain native no-store redirects",async()=>{
 const o=example();let calls=0
 const GET=handler(async id=>{assert.equal(id,o.id);calls++;return {kind:"opportunity",opportunity:o}})
 let response=await GET(request(o.id,"?revision=1"),context(o.id))
 assert.equal(response.status,303);assert.equal(response.headers.get("location"),o.application.route.destination)
 assert.equal(response.headers.get("cache-control"),"no-store");assert.equal(response.headers.get("referrer-policy"),"no-referrer")
 o.application.route={method:"email",destination:"applications+public@issuer.example"}
 response=await GET(request(o.id,"?revision=1"),context(o.id))
 assert.equal(response.headers.get("location"),"mailto:applications%2Bpublic@issuer.example")
 assert.equal(calls,2)
})

test("changed, closed, restricted, missing and redirected references fail closed with actionable local recovery",async()=>{
 const base=example(),closed=structuredClone(base),moved=structuredClone(base)
 closed.lifecycle="closed";closed.application={state:"unavailable",reason:"closed"};moved.id="different_public_listing"
 const cases=[
  [{kind:"opportunity",opportunity:{...base,revision:2}},"The application details have changed"],
  [{kind:"opportunity",opportunity:closed},"This intake is closed"],
  [{kind:"status",status:{status:"under_review"}},"needs a fresh check"],
  [{kind:"status",status:{status:"withdrawn"}},"no longer available"],
  [{kind:"unavailable"},"couldn’t check"],
  [null,"couldn’t check"],
  [{kind:"opportunity",opportunity:moved},"another listing"],
 ]
 for(const [current,title]of cases){
  const response=await handler(async()=>current)(request(base.id,"?revision=1"),context(base.id)),html=await response.text()
  assert.equal(response.status,409);assert.equal(response.headers.get("location"),null)
  assert.equal(response.headers.get("cache-control"),"no-store")
  assert.match(response.headers.get("content-type"),/text\/html/)
  assert.match(response.headers.get("content-security-policy"),/default-src 'none'/)
  assert.ok(html.includes(title),title)
  assert.match(html,/Review current details/)
  assert.match(html,/Return to your saved opportunities/)
  assert.doesNotMatch(html,/issuer.example\/apply|mailto:|<script|<form/)
 }
})

test("malformed, duplicate or extra handoff parameters cannot reuse a current route or become response content",async()=>{
 const o=example(),GET=handler(async()=>({kind:"opportunity",opportunity:o}))
 for(const query of ["","?revision=one","?revision=01","?revision=1&revision=1","?revision=1&destination=https://evil.example"]){
  const response=await GET(request(o.id,query),context(o.id)),html=await response.text()
  assert.equal(response.status,409);assert.equal(response.headers.get("location"),null)
  assert.match(html,/This application link needs a fresh check/)
  assert.doesNotMatch(html,/evil.example|application details have changed/)
 }
 const html=applicationRecoveryHtml('../../<script>unsafe</script>',"invalid")
 assert.doesNotMatch(html,/<script>|unsafe/)
 assert.match(html,/href="\/"/)
})

test("a revision change between reading and opening cannot silently open a newer destination",async()=>{
 const o=example();const GET=handler(async()=>({kind:"opportunity",opportunity:o}))
 let response=await GET(request(o.id,"?revision=1"),context(o.id));assert.equal(response.status,303)
 o.revision=2;o.application.route.destination="https://issuer.example/new-intake"
 response=await GET(request(o.id,"?revision=1"),context(o.id));assert.equal(response.status,409)
 assert.equal(response.headers.get("location"),null)
 response=await GET(request(o.id,"?revision=2"),context(o.id));assert.equal(response.status,303)
 assert.equal(response.headers.get("location"),"https://issuer.example/new-intake")
})

test("copying a public destination copies exactly its text and reports failure without affecting progress",async()=>{
 const messages=[],writes=[],saved=Object.getOwnPropertyDescriptor(globalThis,"navigator")
 try{
  Object.defineProperty(globalThis,"navigator",{configurable:true,value:{clipboard:{writeText:async text=>writes.push(text)}}})
  const {CopyApplicationDestination}=loadUi("components/catalogue/CopyApplicationDestination.tsx",{"react":{...React,useState:()=>["",message=>messages.push(message)]}})
  const element=CopyApplicationDestination({destination:"Fictional office\nDesk 12"}),button=element.props.children.find(child=>child.type==="button")
  await button.props.onClick()
  assert.deepEqual(writes,["Fictional office\nDesk 12"]);assert.match(messages.at(-1),/Address copied/)
  Object.defineProperty(globalThis,"navigator",{configurable:true,value:{clipboard:{writeText:async()=>{throw Error("PRIVATE_CLIPBOARD")}}}})
  await button.props.onClick()
  assert.match(messages.at(-1),/Select the address above/)
  assert.doesNotMatch(messages.at(-1),/PRIVATE_CLIPBOARD|Applied/)
 }finally{if(saved)Object.defineProperty(globalThis,"navigator",saved);else delete globalThis.navigator}
})

test("a stalled clipboard request releases the copy action without reporting a confirmed copy",async()=>{
 const {copyApplicationAddress}=loadUi("lib/application-clipboard.ts")
 assert.equal(await copyApplicationAddress("Fictional address",undefined),false)
 assert.equal(await copyApplicationAddress("Fictional address",{writeText:()=>new Promise(()=>{})},5),false)
 assert.equal(await copyApplicationAddress("Fictional address",{writeText:async()=>{throw Error("PRIVATE_PERMISSION")}}),false)
})