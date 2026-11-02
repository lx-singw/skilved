import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {test} from 'node:test'
import {loadUi} from './helpers/load-ui.mjs'
const require=createRequire(import.meta.url),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{IDBFactory}=require('fake-indexeddb')
async function load(path,overrides={}){const code=ts.transpileModule(await readFile(new URL('../src/'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}});const out={};new Function('require','exports',code.outputText)(id=>overrides[id]??require(id),out);return out}
const core=await load('lib/suggestion-access.ts'),network=await load('lib/suggestion-client.ts',{'./suggestion-access':core}),{createSuggestionSession:session,INITIAL_SUGGESTION_STATE:initial}=await load('lib/suggestion-session.ts',{'./suggestion-access':core,'./suggestion-client':network})
const start='2026-10-16T12:00:00.000Z',expiry='2026-10-16T12:01:00.000Z',url='https://source.example/private-notice'
const access={receiptId:'b'.repeat(64),capability:'c'.repeat(64),expiresAt:expiry},ticket='s1.'+'a'.repeat(64)+'.'+Date.parse(start)+'.'+Date.parse(expiry)+'.'+'d'.repeat(64)+'.'+'e'.repeat(64)
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve}}
const empty={status:'ready',snapshot:{token:null,items:[]}}
function fixture(){let seq=0;const store=core.createSuggestionAccessStore({indexedDB:new IDBFactory(),now:()=>start,newToken:()=> 'write_'+ ++seq});const transport=network.createSuggestionTransport({now:()=>start,fetch:async path=>new Response(JSON.stringify(path.endsWith('/tickets')?{ticket,expiresAt:expiry}:{kind:'received',access}),{headers:{'Content-Type':'application/json'}})});return {store,client:network.createSuggestionClient(store,transport,()=> 'local_attempt')}}

test('session confirms only committed access, serializes double submit and read invalidations never replay mutations',async()=>{
  const f=fixture();let calls=0,notices=0;const s=session(f.store,{...f.client,submit:async(...args)=>{calls++;return f.client.submit(...args)}},()=>notices++)
  assert.deepEqual(s.getServerSnapshot(),initial);await s.refresh(true)
  const action=s.action({type:'submit',url},null);assert.equal(s.getSnapshot().busy,true);assert.equal(s.getSnapshot().message,'')
  await s.action({type:'submit',url},null);await action
  assert.equal(calls,1);assert.equal(notices,1);assert.match(s.getSnapshot().message,/Private receipt saved/);assert.equal(s.getSnapshot().view.snapshot.items[0].kind,'receipt')
  await s.refresh();await s.refresh();assert.equal(calls,1);assert.deepEqual(s.getSnapshot().statuses,{})
})
test('stale observed access conflicts before a new request and refresh never repairs it by replay',async()=>{
  const f=fixture(),s=session(f.store,f.client);await s.refresh(true);await s.action({type:'submit',url},null)
  await s.action({type:'forget',id:'local_attempt'},null);assert.equal(s.getSnapshot().view.status,'conflict');assert.match(s.getSnapshot().message,/Reload/)
  await s.refresh();assert.equal(s.getSnapshot().view.status,'conflict');await s.refresh(true);assert.equal(s.getSnapshot().view.snapshot.items.length,1)
})
test('read invalidation aborts in-flight status and stale/disposed responses cannot publish old results',async()=>{
  const gate=deferred();let aborted=false,current=empty,calls=0
  const s=session({read:async()=>current},{status:async(_token,_id,signal)=>{calls++;signal.addEventListener('abort',()=>{aborted=true});return gate.promise}})
  await s.refresh(true);const action=s.action({type:'status',id:'entry'},null);await s.refresh();assert.equal(aborted,true)
  current={status:'ready',snapshot:{token:'new',items:[]}};gate.resolve({kind:'ok',value:{PRIVATE:'SECRET'}});await action
  assert.equal(calls,1);assert.deepEqual(s.getSnapshot().statuses,{});assert.equal(s.getSnapshot().view.snapshot.token,'new')
  const late=deferred(),disposed=session({read:()=>late.promise});const reading=disposed.refresh(true);disposed.stop();late.resolve(current);await reading;assert.equal(disposed.getSnapshot().view,null)
  disposed.start();await disposed.refresh(true);assert.equal(disposed.getSnapshot().view.snapshot.token,'new')
})
test('failed or private outcomes never announce success or echo errors; withdrawal acknowledges separately',async()=>{
  let notice=0;const s=session({read:async()=>empty},{submit:async()=>{throw Error('PRIVATE_URL_TOKEN')},withdraw:async()=>({kind:'withdrawn',forgotten:false})},()=>notice++)
  await s.refresh(true);await s.action({type:'submit',url},null);assert.match(s.getSnapshot().message,/couldn’t confirm/);assert.doesNotMatch(s.getSnapshot().message,/PRIVATE/);assert.equal(notice,0)
  await s.action({type:'withdraw',id:'entry'},null);assert.match(s.getSnapshot().message,/Withdrawal confirmed/);assert.match(s.getSnapshot().message,/not confirmed/)
})
test('local forget/clear messages distinguish server withdrawal and public outcomes use strict projections',async()=>{
  const s=session({read:async()=>empty,clear:async()=>({status:'saved',snapshot:empty.snapshot})},{forget:async()=>({status:'saved',snapshot:empty.snapshot}),submit:async()=>({kind:'approved',publicResultIds:['public_A']})})
  await s.refresh(true);await s.action({type:'forget',id:'entry'},null);assert.match(s.getSnapshot().message,/did not withdraw/)
  await s.action({type:'clear'},null);assert.match(s.getSnapshot().message,/Server suggestions were not withdrawn/)
  await s.action({type:'submit',url},null);assert.deepEqual(s.getSnapshot().publicIds,['public_A']);assert.match(s.getSnapshot().message,/approved public results/)
})
let state={...initial,action:async()=>{},reload:async()=>{}}
const {Suggestions}=loadUi('components/catalogue/Suggestions.tsx',{'@/lib/use-suggestions':{useSuggestions:()=>state}})
const render=(props={enabled:true,intakeEnabled:true})=>renderToStaticMarkup(React.createElement(Suggestions,props))
test('server rendering starts loading with no personal records or native form credential navigation',()=>{
  state={...state,...initial};const html=render({enabled:false,intakeEnabled:false})
  assert.match(html,/Loading private access/);assert.match(html,/Suggestions are currently unavailable/);assert.match(html,/disabled=""/)
  assert.match(html,/not an application/);assert.match(html,/no account backup/i);assert.doesNotMatch(html,/name="url"|method="get"|action="|No private receipts in this browser|capability|Idempotency-Key/)
})
test('receipt and pending rendering omits URLs, credentials and local IDs; status/public links remain safe',()=>{
  state={...state,...initial,view:{status:'ready',snapshot:{token:'PRIVATE_WRITE',items:[{kind:'receipt',id:'PRIVATE_LOCAL_ID',access:{...access,expiresAt:'2099-10-16T12:01:00.000Z'},savedAt:start},{kind:'pending',id:'PRIVATE_PENDING',url,ticket,expiresAt:expiry,createdAt:start,sentAt:start}]}},statuses:{PRIVATE_LOCAL_ID:{schemaVersion:1,receiptId:access.receiptId,status:'resolved_to_listing',revision:1,createdAt:start,updatedAt:start,expiresAt:expiry,publicResultIds:['public_A']}}}
  const html=render();for(const value of [url,ticket,access.capability,access.receiptId,'PRIVATE_LOCAL_ID','PRIVATE_PENDING','PRIVATE_WRITE'])assert.equal(html.includes(value),false,value)
  assert.match(html,/href="\/opportunities\/public_A"/);assert.match(html,/Public result references available/);assert.match(html,/Access or retry expired/)
  assert.match(html,/Forget local access/);assert.match(html,/Withdraw suggestion/);assert.match(html,/does not withdraw a server suggestion/)
  const off=render({enabled:true,intakeEnabled:false});assert.match(off,/New suggestions and retries are paused/);assert.match(off,/Existing receipt status and withdrawal/)
})
