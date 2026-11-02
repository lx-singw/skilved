import assert from "node:assert/strict"
import {createRequire} from "node:module"
import {test} from "node:test"
import {loadUi} from "./helpers/load-ui.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server"),{IDBFactory}=require("fake-indexeddb")
const {SuggestionUrlSchema}=require("@skilved/types/opportunities/suggestions")
const {suggestionLinkFeedback,suggestionRetryIndex,suggestionReceiptView}=loadUi("lib/suggestion-presentation.ts")
const {SuggestionReceipt}=loadUi("components/catalogue/SuggestionReceipt.tsx")
const {createSuggestionSession,INITIAL_SUGGESTION_STATE}=loadUi("lib/suggestion-session.ts")
const {createSuggestionAccessStore}=loadUi("lib/suggestion-access.ts")
const {createSuggestionClient,createSuggestionTransport}=loadUi("lib/suggestion-client.ts")
const start="2099-11-02T10:00:00.000Z",expiry="2099-11-03T10:00:00.000Z",url="https://source.example/private-path"
const access={receiptId:"b".repeat(64),capability:"c".repeat(64),expiresAt:expiry}
const ticket="s1."+"a".repeat(64)+"."+Date.parse(start)+"."+Date.parse(expiry)+"."+"d".repeat(64)+"."+"e".repeat(64)
const draft={kind:"draft",id:"PRIVATE_DRAFT",url,createdAt:start}
const pending={...draft,kind:"pending",id:"PRIVATE_PENDING",ticket,expiresAt:expiry,sentAt:start}
const receipt={kind:"receipt",id:"PRIVATE_RECEIPT",access,savedAt:start}
const empty={status:"ready",snapshot:{token:null,items:[]}}
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return{promise,resolve}}
function nodes(tree,predicate){const out=[];function visit(node){if(Array.isArray(node))node.forEach(visit);else if(node&&typeof node==="object"){if(predicate(node))out.push(node);visit(node.props?.children)}}visit(tree);return out}
function text(node){return typeof node==="string"||typeof node==="number"?String(node):Array.isArray(node)?node.map(text).join(""):node?.props?text(node.props.children):""}
const button=(tree,label)=>nodes(tree,n=>n.type==="button"&&text(n)===label)[0]
function harness(read,value=url){
 const cells=[value,null];let slot=0
 const {Suggestions}=loadUi("components/catalogue/Suggestions.tsx",{
  react:{...React,useState:initial=>{const i=slot++;if(!(i in cells))cells[i]=initial;return[cells[i],next=>{cells[i]=typeof next==="function"?next(cells[i]):next}]}},
  "@/lib/use-suggestions":{useSuggestions:read}
 })
 const render=(props={enabled:true,intakeEnabled:true})=>{slot=0;return Suggestions(props)}
 return{cells,render,form:()=>nodes(render(),n=>n.type==="form")[0],input:()=>nodes(render(),n=>n.type==="input")[0],html:props=>renderToStaticMarkup(render(props))}
}
function sessionHarness(client,store={read:async()=>empty}){
 const session=createSuggestionSession(store,client)
 return{session,...harness(()=>({...session.getSnapshot(),action:session.action,reload:()=>session.refresh(true)}))}
}

test("format feedback follows the exact URL contract without fetching, cleaning or echoing paths",()=>{
 const values=["",url,"HTTPS://SOURCE.EXAMPLE/a","http://source.example/a","https://user:secret@source.example/a","https://source.example/a?PRIVATE=1","https://source.example/a#PRIVATE","https://source.example/a%20b","https://127.0.0.1/a"," https://source.example/a","https://source.example/a;x=1","not a link"]
 const before=globalThis.fetch;let calls=0
 try{globalThis.fetch=()=>{calls++;throw Error("No preflight network")}
  for(const value of values){const result=suggestionLinkFeedback(value);assert.equal(result.kind==="format",SuggestionUrlSchema.safeParse(value).success);assert.doesNotMatch(JSON.stringify(result),/private-path|PRIVATE=1|user:secret|canonicalUrl/)}
  assert.equal(suggestionLinkFeedback(url).hostname,"source.example");assert.match(suggestionLinkFeedback(url).description,/format only/)
  assert.equal(calls,0)
 }finally{globalThis.fetch=before}
})

test("same-address drafts and live pending entries use explicit retry; expired retries and receipts do not block a separate submission",()=>{
 assert.equal(suggestionRetryIndex("HTTPS://SOURCE.EXAMPLE/private-path",[draft],start),0)
 assert.equal(suggestionRetryIndex(url,[{...draft,url:"https://other.example/a"},pending],start),1)
 assert.equal(suggestionRetryIndex(url,[pending],expiry),-1)
 assert.equal(suggestionRetryIndex(url,[receipt],start),-1)
 assert.equal(suggestionRetryIndex(url+"?private=1",[draft],start),-1)
})

test("receipt presentation distinguishes draft, unsent ticket, sent response and expiry without exposing private access",()=>{
 assert.equal(suggestionReceiptView(draft,undefined,start).title,"Not submitted")
 assert.match(suggestionReceiptView(draft,undefined,start).description,/No suggestion was submitted/)
 assert.equal(suggestionReceiptView({...pending,sentAt:null},undefined,start).title,"Send attempt not recorded")
 assert.match(suggestionReceiptView({...pending,sentAt:null},undefined,start).description,/no send attempt is recorded/)
 assert.match(suggestionReceiptView(pending,undefined,start).description,/submission response was not confirmed/)
 assert.equal(suggestionReceiptView(receipt,undefined,expiry).expired,true)
 const status={status:"resolved_to_listing",updatedAt:start,publicResultIds:["public_A"]}
 const view=suggestionReceiptView(receipt,status,start)
 assert.match(view.server.label,/Public result references/);assert.equal(view.localTime,start);assert.equal(view.server.updatedAt,start)
 for(const value of [url,ticket,access.receiptId,access.capability,receipt.id])assert.equal(JSON.stringify(view).includes(value),false)
})

test("receipt controls honour paused intake, expiry and unavailable storage without conflating local forget and withdrawal",()=>{
 const actions=[],props={item:receipt,index:0,now:start,ready:true,enabled:true,intakeEnabled:false,onAction:action=>actions.push(action)}
 let tree=SuggestionReceipt(props)
 assert.equal(button(tree,"Refresh status").props.disabled,false)
 button(tree,"Withdraw suggestion").props.onClick();button(tree,"Forget local access").props.onClick()
 assert.deepEqual(actions,["withdraw","forget"])
 tree=SuggestionReceipt({...props,item:pending});assert.equal(button(tree,"Retry this entry").props.disabled,true)
 tree=SuggestionReceipt({...props,now:expiry});assert.equal(button(tree,"Refresh status").props.disabled,true);assert.equal(button(tree,"Forget local access").props.disabled,false)
 tree=SuggestionReceipt({...props,ready:false});assert.equal(button(tree,"Forget local access").props.disabled,true)
 const html=renderToStaticMarkup(React.createElement(SuggestionReceipt,props))
 for(const secret of [url,ticket,access.receiptId,access.capability,receipt.id])assert.equal(html.includes(secret),false)
})

test("completion signals clear only confirmed submit or retry intents and reject obsolete completion",async()=>{
 for(const [result,expected]of [[{kind:"saved",id:"attempt"},true],[{kind:"approved",publicResultIds:["public_A"]},true],[{kind:"previous_result_unavailable"},false],[{kind:"unavailable"},false],[{kind:"limited"},false],[{kind:"local",status:"conflict"},false]]){
  const s=createSuggestionSession({read:async()=>empty},{submit:async()=>result,retry:async()=>result})
  await s.refresh(true);assert.equal(await s.action({type:"submit",url},null),expected)
 }
 const gate=deferred(),s=createSuggestionSession({read:async()=>empty},{submit:()=>gate.promise})
 await s.refresh(true);const action=s.action({type:"submit",url},null)
 assert.equal(await s.action({type:"submit",url},null),false)
 await s.refresh();gate.resolve({kind:"approved",publicResultIds:["public_A"]})
 assert.equal(await action,false);assert.deepEqual(s.getSnapshot().publicIds,[])
})

test("failed attempts retain entered text and format errors never start a request",async()=>{
 let calls=0
 const h=sessionHarness({submit:async()=>{calls++;throw Error("PRIVATE_FAILURE")}})
 await h.session.refresh(true)
 await h.form().props.onSubmit({preventDefault(){}})
 assert.equal(h.cells[0],url);assert.equal(calls,1);assert.doesNotMatch(h.session.getSnapshot().message,/PRIVATE_FAILURE/)
 h.input().props.onChange({target:{value:url+"?PRIVATE=1"}})
 assert.equal(h.input().props["aria-invalid"],true)
 assert.equal(button(h.render(),"Suggest link for review").props.disabled,true)
 await h.form().props.onSubmit({preventDefault(){}});assert.equal(calls,1)
})

test("confirmed completion clears the original input while preserving a newer edit",async()=>{
 const h=sessionHarness({submit:async()=>({kind:"approved",publicResultIds:["public_A"]})})
 await h.session.refresh(true);await h.form().props.onSubmit({preventDefault(){}});assert.equal(h.cells[0],"")
 const gate=deferred(),newer=sessionHarness({submit:()=>gate.promise})
 await newer.session.refresh(true);const input=newer.input(),action=newer.form().props.onSubmit({preventDefault(){}})
 input.props.onChange({target:{value:"https://other.example/notice"}})
 gate.resolve({kind:"approved",publicResultIds:["public_A"]});await action
 assert.equal(newer.cells[0],"https://other.example/notice")
})

test("response loss keeps the original ticket, blocks a duplicate submit and clears its input only after explicit retry succeeds",async()=>{
 let seq=0,issues=0,creates=0
 const store=createSuggestionAccessStore({indexedDB:new IDBFactory(),now:()=>start,newToken:()=> "token_"+ ++seq})
 const transport=createSuggestionTransport({now:()=>start,fetch:async path=>{
  if(path.endsWith("/tickets")){issues++;return new Response(JSON.stringify({ticket,expiresAt:expiry}),{headers:{"Content-Type":"application/json"}})}
  creates++;if(creates===1)throw Error("Synthetic response loss")
  return new Response(JSON.stringify({kind:"received",access}),{headers:{"Content-Type":"application/json"}})
 }})
 const client=createSuggestionClient(store,transport,()=> "attempt")
 const h=sessionHarness(client,store);await h.session.refresh(true)
 await h.form().props.onSubmit({preventDefault(){}});assert.equal(h.cells[0],url)
 const saved=await store.read();assert.equal(saved.snapshot.items[0].ticket,ticket)
 assert.equal(button(h.render(),"Suggest link for review").props.disabled,true)
 await h.form().props.onSubmit({preventDefault(){}});assert.equal(creates,1)
 const card=nodes(h.render(),n=>n.type?.name==="SuggestionReceipt")[0]
 await card.props.onAction("retry")
 assert.equal(issues,1);assert.equal(creates,2);assert.equal(h.cells[0],"")
 assert.equal((await store.read()).snapshot.items[0].kind,"receipt")
})

test("discard confirmation stays beside its entry, sends no request until confirmed and retains the observed token",async()=>{
 const calls=[];let state={...INITIAL_SUGGESTION_STATE,view:{status:"ready",snapshot:{token:"PRIVATE_OLD",items:[receipt,{...receipt,id:"PRIVATE_OTHER"}]}},action:async(...args)=>{calls.push(args);return false},reload:async()=>{}}
 const h=harness(()=>state,""),first=nodes(h.render(),n=>n.type?.name==="SuggestionReceipt")[0]
 await first.props.onAction("forget");assert.equal(calls.length,0)
 let html=h.html();assert.ok(html.indexOf("Discard private local access?")<html.indexOf('aria-label="Receipt 2"'))
 assert.match(html,/sends no withdrawal request/);assert.doesNotMatch(html,/PRIVATE_OLD|PRIVATE_RECEIPT|PRIVATE_OTHER/)
 state={...state,view:{...state.view,snapshot:{...state.view.snapshot,token:"PRIVATE_NEW"}}}
 button(h.render(),"Confirm local discard").props.onClick()
 assert.deepEqual(calls,[[{type:"forget",id:receipt.id},"PRIVATE_OLD"]])
})

test("loading, storage failures and paused service never masquerade as an empty receipt list or expose native form credentials",()=>{
 let state={...INITIAL_SUGGESTION_STATE,action:async()=>false,reload:async()=>{}}
 const h=harness(()=>state,"")
 let html=h.html();assert.match(html,/Loading private access/);assert.doesNotMatch(html,/No private receipts in this browser/)
 for(const status of ["unreadable","unavailable","conflict"]){state={...state,view:{status,reason:"invalid_data"}};html=h.html();assert.match(html,/Reload receipts/);assert.doesNotMatch(html,/No private receipts in this browser/)}
 state={...state,view:empty};html=h.html({enabled:true,intakeEnabled:false})
 assert.match(html,/New suggestions and retries are paused/);assert.match(html,/No private receipts in this browser/)
 assert.doesNotMatch(html,/Clear receipt access/)
 assert.doesNotMatch(html,/name="url"|method="get"|action="|Idempotency-Key|capability/)
})
