import assert from "node:assert/strict"
import {createRequire} from "node:module"
import {test} from "node:test"
import {loadUi} from "./helpers/load-ui.mjs"
import {Report} from "../../../packages/catalogue/src/schemas.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server")
const client=loadUi("lib/report-client.ts"),{reportIssues,reportKind,sendOpportunityReport}=client
const {ReportResponse}=loadUi("components/catalogue/ReportResponse.tsx")
const input={opportunityId:"public_report_fixture",kind:"incorrect",text:"  The fictional notice gives two different closing dates.  "}
const json=(body={status:"received"},status=202)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8"}})
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return{promise,resolve}}
function nodes(tree,predicate){const out=[];function visit(node){if(Array.isArray(node))node.forEach(visit);else if(node&&typeof node==="object"){if(predicate(node))out.push(node);visit(node.props?.children)}}visit(tree);return out}
function content(node){return typeof node==="string"||typeof node==="number"?String(node):Array.isArray(node)?node.map(content).join(""):node?.props?content(node.props.children):""}
function harness(send=sendOpportunityReport){
 const cells=[],refs=[],effects=[],focus=[];let stateSlot=0,refSlot=0,effectSlot=0,disposed=false,lateUpdates=0;const queued=[]
 const {OpportunityReport}=loadUi("components/catalogue/OpportunityReport.tsx",{
  "@/lib/report-client":{...client,sendOpportunityReport:send},
  react:{...React,useState:initial=>{const i=stateSlot++;if(!(i in cells))cells[i]=initial;return[cells[i],next=>{if(disposed)lateUpdates++;cells[i]=typeof next==="function"?next(cells[i]):next}]},
   useRef:initial=>{const i=refSlot++;return refs[i]??(refs[i]={current:initial})},
   useEffect:(run,deps)=>{const i=effectSlot++,old=effects[i];if(!old||deps.some((value,index)=>!Object.is(value,old.deps[index])))queued.push(()=>{old?.cleanup?.();effects[i]={deps,cleanup:run()}})}
  }
 })
 function render(id=input.opportunityId){
  stateSlot=refSlot=effectSlot=0
  const wrapper=OpportunityReport({id}),tree=wrapper.type(wrapper.props)
  for(const n of nodes(tree,n=>n.props?.ref||n.props?.responseRef)){const ref=n.props.ref??n.props.responseRef;if(ref&&typeof ref==="object")ref.current={focus:()=>focus.push(n.props.value??"response")}}
  queued.splice(0).forEach(run=>run())
  return tree
 }
 function fill(kind="incorrect",text=input.text){nodes(render(),n=>n.type==="input"&&n.props.value===kind)[0].props.onChange();nodes(render(),n=>n.type==="textarea")[0].props.onChange({target:{value:text}})}
 return{cells,focus,render,fill,lateUpdates:()=>lateUpdates,html:()=>renderToStaticMarkup(render()),submit:()=>nodes(render(),n=>n.type==="form")[0].props.onSubmit({preventDefault(){}}),button:label=>nodes(render(),n=>n.type==="button"&&content(n)===label)[0],unmount:()=>{disposed=true;effects.forEach(effect=>effect.cleanup?.())}}
}

test("issue choices match the real report contract and inherited property names are not choices",()=>{
 assert.deepEqual(Object.keys(reportIssues),Report.shape.kind.options)
 for(const kind of ["constructor","toString","__proto__",null,"CLOSED"])assert.equal(reportKind(kind),false)
 for(const kind of Report.shape.kind.options)assert.equal(reportKind(kind),true)
})

test("one bounded credential-free POST contains only the report contract, with no personal-progress extras",async()=>{
 let calls=0
 const result=await sendOpportunityReport({...input,stage:"preparing",privateToken:"PRIVATE_TOKEN",sourceSnapshot:"PRIVATE_SOURCE"},{fetch:async(url,init)=>{
  calls++;assert.equal(url,"/api/v1/reports");assert.equal(init.method,"POST");assert.equal(init.credentials,"omit");assert.equal(init.cache,"no-store");assert.equal(init.mode,"same-origin");assert.equal(init.redirect,"error");assert.equal(init.referrerPolicy,"no-referrer");assert.equal(init.signal.aborted,false)
  assert.deepEqual(init.headers,{"Content-Type":"application/json"})
  const body=JSON.parse(init.body);assert.deepEqual(body,Report.parse(input));assert.doesNotMatch(init.body,/PRIVATE_|stage|preparing/)
  return json()
 }})
 assert.deepEqual(result,{kind:"received"});assert.equal(calls,1)
})

test("invalid identifiers, kinds and descriptions never make a request",async()=>{
 let calls=0;const fetch=async()=>{calls++;return json()}
 for(const patch of [{opportunityId:"../private"},{kind:"constructor"},{kind:""},{text:" \n\t "},{text:"x".repeat(1501)}])assert.deepEqual(await sendOpportunityReport({...input,...patch},{fetch}),{kind:"invalid"})
 assert.equal(calls,0)
 const text="界".repeat(1500);assert.equal((await sendOpportunityReport({...input,text},{fetch})).kind,"received");assert.equal(calls,1)
})

test("HTTP rejections stay distinct and never echo a server error body",async()=>{
 for(const [status,kind] of [[400,"invalid"],[413,"invalid"],[429,"limited"],[503,"unavailable"],[200,"unavailable"]]){
  const result=await sendOpportunityReport(input,{fetch:async()=>json({error:"PRIVATE_BACKEND_REASON",status:"received"},status)})
  assert.deepEqual(result,{kind});assert.doesNotMatch(JSON.stringify(result),/PRIVATE_/)
 }
})

test("only the exact JSON acknowledgement confirms receipt",async()=>{
 const responses=[
  json({status:"resolved"}),json({status:"received",privateReference:"PRIVATE_REF"}),json([{status:"received"}]),json(null),
  new Response('{"status":',{status:202,headers:{"Content-Type":"application/json"}}),
  new Response('{"status":"received"}',{status:202,headers:{"Content-Type":"text/html"}}),
  new Response(null,{status:202,headers:{"Content-Type":"application/json"}}),
  new Response(new Uint8Array([0xff]),{status:202,headers:{"Content-Type":"application/json"}}),
  new Response('{"status":"received"}'+" ".repeat(2048),{status:202,headers:{"Content-Type":"application/json"}}),
  new Response('{"status":"received"}',{status:202,headers:{"Content-Type":"application/json","Content-Length":"2049"}}),
  Object.defineProperty(json(),"redirected",{value:true}),
 ]
 for(const response of responses)assert.deepEqual(await sendOpportunityReport(input,{fetch:async()=>response}),{kind:"unconfirmed"})
})

test("a split JSON response is validated after complete bounded reading",async()=>{
 const chunks=['{"sta','tus":"rece','ived"}'];let index=0
 const response=new Response(new ReadableStream({pull(controller){if(index===chunks.length)controller.close();else controller.enqueue(new TextEncoder().encode(chunks[index++]))}}),{status:202,headers:{"Content-Type":"application/json"}})
 assert.deepEqual(await sendOpportunityReport(input,{fetch:async()=>response}),{kind:"received"})
})

test("a fetch that ignores abort has a deadline, one attempt and no late success",{timeout:2000},async()=>{
 const late=deferred();let calls=0,signal,cancelled=false
 const result=await sendOpportunityReport(input,{timeoutMs:5,fetch:async(_url,init)=>{calls++;signal=init.signal;return late.promise}})
 assert.deepEqual(result,{kind:"unconfirmed"});assert.equal(signal.aborted,true);assert.equal(calls,1)
 late.resolve(new Response(new ReadableStream({cancel(){cancelled=true}}),{status:202,headers:{"Content-Type":"application/json"}}))
 await Promise.resolve();await Promise.resolve();await Promise.resolve()
 assert.equal(cancelled,true);assert.deepEqual(result,{kind:"unconfirmed"});assert.equal(calls,1)
})

test("an unfinished response body is cancelled at the same overall deadline",{timeout:2000},async()=>{
 let cancelled=false,calls=0
 const response=new Response(new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('{"status":'))},cancel(){cancelled=true}}),{status:202,headers:{"Content-Type":"application/json"}})
 assert.deepEqual(await sendOpportunityReport(input,{timeoutMs:5,fetch:async()=>{calls++;return response}}),{kind:"unconfirmed"})
 assert.equal(cancelled,true);assert.equal(calls,1)
})

test("unmount cancellation and a pre-aborted signal cannot become confirmed or auto-retry",{timeout:2000},async()=>{
 let calls=0;const controller=new AbortController()
 const result=sendOpportunityReport(input,{signal:controller.signal,fetch:async()=>{calls++;return new Promise(()=>{})}})
 controller.abort();assert.deepEqual(await result,{kind:"unconfirmed"});assert.equal(calls,1)
 assert.deepEqual(await sendOpportunityReport(input,{signal:controller.signal,fetch:async()=>{calls++;return json()}}),{kind:"unconfirmed"});assert.equal(calls,1)
})

test("the workbench preserves native grouping, bounded POST and nonpersistent privacy guidance",()=>{
 const h=harness(),html=h.html()
 assert.equal(nodes(h.render(),n=>n.type==="input"&&n.props.type==="radio").length,4)
 assert.match(html,/method="post"/);assert.match(html,/action="\/api\/v1\/reports"/);assert.match(html,/maxLength="1500"/i);assert.match(html,/Reports are reviewed privately/);assert.match(html,/Leaving or reloading can lose it/);assert.match(html,/Enable JavaScript/)
 assert.doesNotMatch(html,/<select|type="file"|name="email"|name="phone"|name="stage"|name="reviewed"/)
 h.fill("closed","Fictional report draft")
 assert.match(h.html(),/An inaccessible website alone does not establish closure/);assert.match(h.html(),/22 \/ 1,500/)
 assert.equal(nodes(h.render(),n=>n.type==="output")[0].props["aria-live"],"off")
 h.fill("unsafe_destination");assert.match(h.html(),/information you already have/)
})

test("uncertain and rejected sends retain the concern and description, with duplicate submits blocked",async()=>{
 for(const kind of ["unconfirmed","limited","unavailable","invalid"]){
  const pending=deferred();let calls=0
  const h=harness(async()=>{calls++;return pending.promise});h.fill("closed")
  const first=h.submit(),duplicate=h.submit()
  assert.equal(calls,1);assert.equal(nodes(h.render(),n=>n.type==="fieldset")[0].props.disabled,true);assert.equal(nodes(h.render(),n=>n.type==="textarea")[0].props.disabled,true)
  assert.equal(h.button("Sending report…").props.disabled,true)
  pending.resolve({kind});await first;await duplicate
  assert.equal(calls,1);assert.equal(nodes(h.render(),n=>n.type==="textarea")[0].props.value,input.text);assert.equal(nodes(h.render(),n=>n.type==="input"&&n.props.value==="closed")[0].props.checked,true)
  assert.equal(h.button("Send report").props.disabled,false);assert.equal(h.focus.at(-1),"response");assert.doesNotMatch(h.html(),/Report received/)
 }
})

test("actual transport failure preserves input and an explicit successful retry clears only after acknowledgement",async()=>{
 let calls=0
 const h=harness((body,options)=>sendOpportunityReport(body,{...options,fetch:async()=>{calls++;if(calls===1)throw Error("PRIVATE_NETWORK_REASON");return json()}}))
 h.fill();await h.submit();assert.equal(calls,1);assert.match(h.html(),/earlier report may already have arrived/);assert.equal(nodes(h.render(),n=>n.type==="textarea")[0].props.value,input.text)
 await h.submit();assert.equal(calls,2);assert.equal(nodes(h.render(),n=>n.type==="form").length,0);assert.match(h.html(),/Report received/);assert.doesNotMatch(h.html(),/fictional notice gives|PRIVATE_NETWORK_REASON/)
 h.button("Start a different report").props.onClick();assert.equal(nodes(h.render(),n=>n.type==="textarea")[0].props.value,"");assert.equal(nodes(h.render(),n=>n.type==="input"&&n.props.checked).length,0);assert.equal(h.focus.at(-1),"incorrect");assert.equal(calls,2)
})

test("discarding the component aborts its request and a late acknowledgement cannot update it",async()=>{
 const pending=deferred();let signal
 const h=harness(async(_input,options)=>{signal=options.signal;return pending.promise});h.fill();const result=h.submit()
 h.unmount();assert.equal(signal.aborted,true);pending.resolve({kind:"received"});await result;assert.equal(h.lateUpdates(),0)
})

test("receipt copy confirms only receipt and offers no invented review outcome, ticket or application confirmation",()=>{
 const html=renderToStaticMarkup(React.createElement(ReportResponse,{result:{kind:"received"}}))
 assert.match(html,/role="status"/);assert.match(html,/not that the issue has been verified or resolved/);assert.match(html,/Not established by this receipt/);assert.match(html,/does not submit an application or change your saved progress/);assert.match(html,/does not include a progress-tracking link/)
 assert.doesNotMatch(html,/<time|href=|receiptId|capability|application submitted|review complete|PRIVATE_/)
 for(const kind of ["invalid","limited","unavailable","unconfirmed"]){
  const error=renderToStaticMarkup(React.createElement(ReportResponse,{result:{kind}}))
  assert.match(error,/role="alert"/);assert.doesNotMatch(error,/Report received|review outcome/i)
 }
})
