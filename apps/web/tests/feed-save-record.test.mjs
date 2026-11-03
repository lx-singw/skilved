import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { loadUi } from "./helpers/load-ui.mjs"
import { makeRecord } from "../../../packages/types/tests/fixtures/opportunities.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server"),{projectOpportunity}=require("@skilved/types/opportunities/internal")
const link={__esModule:true,default:({href,children,...props})=>React.createElement("a",{href,...props},children)}
const item=Object.freeze({opportunityId:"public_card",userStage:"preparing",savedAt:"2026-11-03T08:00:00.000Z",updatedAt:"2026-11-03T09:00:00.000Z",lastViewedRevision:7,lastRouteOpenedAt:null,reportedAppliedAt:null})
const href="/opportunities/public_card?from=%2F%3Fcategory%3Djob"
const props={id:item.opportunityId,revision:7,href,title:"A public notice"}
const {FeedSavedRecord}=loadUi("components/catalogue/FeedSave.tsx",{"next/link":link})
function nodes(tree,predicate){const result=[];function visit(node){if(Array.isArray(node))node.forEach(visit);else if(node&&typeof node==="object"){if(predicate(node))result.push(node);visit(node.props?.children)}}visit(tree);return result}
function harness(initial){let progress=initial,cursor=0,effects=[],refs=[];const calls=[]
 const ui=loadUi("components/catalogue/FeedSave.tsx",{"next/link":link,"@/lib/use-local-progress":{useLocalProgress:()=>({...progress,change:command=>{calls.push(command);return Promise.resolve()},reload:()=>{calls.push("reload");return Promise.resolve()}})},react:{...React,useRef:value=>refs[cursor++]??(refs[cursor-1]={current:value}),useEffect:effect=>effects.push(effect)}})
 return {calls,set:next=>{progress=next},render:()=>{cursor=0;effects=[];return ui.FeedSave(props)},runEffects:(active)=>{const previous=globalThis.document,body={};try{globalThis.document={body,activeElement:active??body};effects.forEach(effect=>effect())}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous}}}
}

test("saved feed records keep all four personal stages distinct and link to the useful reading section",()=>{
 const expected={interested:["Interested","opportunity-story"],preparing:["Preparing","preparation"],applied_reported:["Applied — marked by you","your-workspace"],not_pursuing:["No longer pursuing","opportunity-story"]}
 for(const [userStage,[label,fragment]]of Object.entries(expected)){
  const tree=FeedSavedRecord({item:{...item,userStage},revision:7,href}),html=renderToStaticMarkup(tree)
  assert.ok(html.includes(label));assert.equal(nodes(tree,n=>typeof n.props?.href==="string")[0].props.href,href+"#"+fragment)
  assert.match(html,/Browser only/);assert.match(html,/browser’s timezone/);assert.match(html,/dateTime="2026-11-03T08:00:00.000Z"/i)
  assert.doesNotMatch(html,/<button|<input|\/apply|eligibility confirmed|application submitted/i)
  if(userStage==="applied_reported")assert.match(html,/Submission is not confirmed/)
  if(userStage==="preparing")assert.match(html,/Requirement ticks remain temporary/)
 }
})

test("differing revisions retain personal stage and require reading without recording a review",()=>{
 for(const revision of [6,8]){
  const tree=FeedSavedRecord({item,revision,href}),html=renderToStaticMarkup(tree)
  assert.match(html,/Details differ from your saved version/);assert.match(html,/Your stage is kept/);assert.match(html,/Preparing/)
  assert.equal(nodes(tree,n=>typeof n.props?.href==="string")[0].props.href,href+"#opportunity-story")
  assert.doesNotMatch(html,/Mark.*reviewed|<button|acknowledge_revision|Current notice loaded/)
 }
 assert.equal(item.lastViewedRevision,7)
})

test("closed intakes route back to their reading even when personal progress says preparing or applied",()=>{
 for(const userStage of ["preparing","applied_reported"]){
  const tree=FeedSavedRecord({item:{...item,userStage},revision:7,href,closed:true}),html=renderToStaticMarkup(tree)
  assert.match(html,/Read the closed intake/);assert.doesNotMatch(html,/Continue preparing|href="[^\"]*\/apply/)
  assert.equal(nodes(tree,n=>typeof n.props?.href==="string")[0].props.href,href+"#opportunity-story")
 }
})

test("storage recovery distinguishes unreadable, conflict, full and unavailable without writing or clearing",()=>{
 const cases=[[{status:"unreadable",reason:"unsupported_version"},/different format/],[{status:"unreadable",reason:"invalid_data"},/cannot be read/],[{status:"conflict"},/changed elsewhere/],[{status:"full"},/saved list is full/],[{status:"unavailable"},/Browser storage is unavailable/]]
 for(const [view,pattern]of cases){
  const ui=harness({view,busy:false,message:""}),tree=ui.render(),html=renderToStaticMarkup(tree)
  assert.match(html,pattern);assert.doesNotMatch(html,/Saved here|Your place in this notice|<form|Clear.*browser/)
  const buttons=nodes(tree,n=>n.type==="button")
  assert.equal(buttons[0].props.disabled,true);assert.equal(ui.calls.length,0)
  buttons[1].props.onClick();assert.deepEqual(ui.calls,["reload"])
  assert.ok(nodes(tree,n=>n.props?.href==="/saved").length)
 }
})

test("only the initiating save moves focus after confirmation; background changes never replay or steal focus",()=>{
 const empty={view:{status:"ready",snapshot:{items:[]}},busy:false,message:""},ui=harness(empty)
 let tree=ui.render();ui.runEffects();nodes(tree,n=>n.type==="button")[0].props.onClick()
 assert.deepEqual(ui.calls,[{type:"save",id:"public_card",revision:7}])
 ui.set({...empty,busy:true});tree=ui.render();ui.runEffects();assert.equal(nodes(tree,n=>n.type==="button")[0].props.disabled,true)
 ui.set({view:{status:"saved",snapshot:{items:[item]}},busy:false,message:"Saved in this browser."})
 tree=ui.render();let focuses=0
 nodes(tree,n=>n.props?.className==="feed-saved-link")[0].props.ref.current={focus:()=>{focuses++}}
 ui.runEffects();assert.equal(focuses,1);assert.equal(ui.calls.length,1)
 tree=ui.render();ui.runEffects();assert.equal(focuses,1)
 const background=harness({view:{status:"ready",snapshot:{items:[item]}},busy:false,message:""})
 tree=background.render();nodes(tree,n=>n.props?.className==="feed-saved-link")[0].props.ref.current={focus:()=>{focuses++}}
 background.runEffects();assert.equal(focuses,1);assert.equal(background.calls.length,0)
 const moved=harness(empty);tree=moved.render();nodes(tree,n=>n.type==="button")[0].props.onClick()
 moved.set({view:{status:"saved",snapshot:{items:[item]}},busy:false,message:"Saved in this browser."});tree=moved.render()
 nodes(tree,n=>n.props?.className==="feed-saved-link")[0].props.ref.current={focus:()=>{focuses++}}
 moved.runEffects({id:"another-control"});assert.equal(focuses,1)
})

test("real opportunity cards provide the title, canonical return context and closed-state boundary to save controls",()=>{
 let received
 const {OpportunityPost}=loadUi("components/catalogue/OpportunityPost.tsx",{"next/link":link,"./FeedSave":{FeedSave:props=>{received=props;return null}}})
 const record=makeRecord("job"),projection=projectOpportunity(record)
 assert.equal(projection.kind,"opportunity")
 renderToStaticMarkup(React.createElement(OpportunityPost,{opportunity:projection.opportunity,query:new URLSearchParams("category=job&province=gauteng")}))
 assert.equal(received.title,record.title.value);assert.equal(received.id,record.id);assert.equal(received.revision,record.revision)
 const url=new URL(received.href,"https://skilved.example")
 assert.equal(url.searchParams.get("from"),"/?category=job&province=gauteng")
 assert.equal(received.closed,projection.opportunity.lifecycle==="closed")
 const {ApplicationPanel}=loadUi("components/catalogue/ApplicationPanel.tsx",{"next/link":link,"./FeedSave":{FeedSave:props=>{received=props;return null}}})
 renderToStaticMarkup(React.createElement(ApplicationPanel,{opportunity:projection.opportunity}))
 assert.equal(received.href,"") // Same-page workspace fragment retains the detail page's return context.
 assert.equal(received.showRecord,false)
 assert.equal(received.title,record.title.value)
})
