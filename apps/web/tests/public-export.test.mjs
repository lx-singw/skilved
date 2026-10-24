import assert from 'node:assert/strict'
import {test} from 'node:test'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {makeRecord} from '../../../packages/types/tests/fixtures/opportunities.mjs'
const require=createRequire(import.meta.url),ts=require('typescript')
async function load(path){const out={},code=ts.transpileModule(await readFile(new URL('../src/lib/'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});new Function('require','exports',code.outputText)(require,out);return out}
const {publicExportSettings:settings}=await load('public-export-config.ts')
const {createPublicExportPreparer:preparer,createPublicExportReader:reader}=await load('public-export.ts')
const {projectOpportunity}=require('@skilved/types/opportunities/internal')
const origin='https://skilved.example',time='2026-10-24T01:40:00.000Z'
function current(id='public_job',revision=1){const r=makeRecord('job');r.id=id;r.revision=revision;r.checks=r.checks.map(c=>({...c,recordRevision:revision}));return projectOpportunity(r)}
const json=(value,init={})=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json; charset=utf-8'},...init})
const options=fetch=>({origin,now:()=>time,fetch})
function ref(result,id='public_job'){assert.equal(result.kind,'unavailable');assert.equal(result.payload.kind,'link');assert.equal(result.payload.canonicalUrl,origin+'/opportunities/'+id);assert.doesNotMatch(JSON.stringify(result),/PRIVATE_|issuer\.example|Fictional|Official application destination/)}
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}

test('public export settings expose only explicit strict public origin and fail closed without reading unrelated environment',()=>{
 assert.deepEqual(settings({}),{origin:null})
 const env={SKILVED_PUBLIC_ORIGIN:origin,SECRET:'PRIVATE_ENV_SENTINEL'}
 assert.deepEqual(settings(env),{origin});assert.ok(!JSON.stringify(settings(env)).includes('PRIVATE_'))
 for(const value of ['http://skilved.example','https://u:PRIVATE@skilved.example','https://skilved.example/','https://skilved.example/path','https://skilved.example?auth=PRIVATE','https://skilved.example#PRIVATE','not an origin'])assert.deepEqual(settings({SKILVED_PUBLIC_ORIGIN:value}),{origin:null})
 const throwing={get SKILVED_PUBLIC_ORIGIN(){throw Error('PRIVATE_ENV_FAILURE')}};assert.deepEqual(settings(throwing),{origin:null})
})

test('every intent performs fixed-path no-store credential-free public GET and reads changed current revision',async()=>{
 const calls=[];let revision=0
 const prepare=preparer(options(async(path,init)=>{calls.push({path,init});return json(current('public_job',++revision))}))
 const first=await prepare('public_job'),second=await prepare('public_job')
 assert.equal(first.kind,'prepared');assert.equal(second.kind,'prepared');assert.match(first.payload.text,/Listing revision: 1/);assert.match(second.payload.text,/Listing revision: 2/)
 assert.equal(calls.length,2)
 for(const {path,init} of calls){
  assert.equal(path,'/api/v1/opportunities/public_job')
  assert.equal(init.method,'GET');assert.equal(init.cache,'no-store');assert.equal(init.credentials,'omit');assert.equal(init.redirect,'error');assert.equal(init.referrerPolicy,'no-referrer')
  assert.deepEqual(init.headers,{Accept:'application/json'});assert.equal(init.body,undefined);assert.ok(init.signal instanceof AbortSignal)
 }
})

test('trusted public detail canonical identity builds alias target link and restricted canonical reference',async()=>{
 const prepare=preparer(options(async path=>{assert.equal(path,'/api/v1/opportunities/old_reference');return json(current('canonical_job',7))}))
 const out=await prepare('old_reference');assert.equal(out.kind,'prepared');assert.equal(out.payload.canonicalUrl,origin+'/opportunities/canonical_job');assert.equal(out.payload.filename,'skilved-canonical_job-r7.txt')
 assert.ok(!out.payload.text.includes('/old_reference'))
 const restricted=preparer(options(async()=>json({kind:'status',status:{schemaVersion:1,id:'canonical_job',revision:8,status:'under_review',application:'unavailable'}})))
 const closed=await restricted('old_reference');assert.equal(closed.kind,'prepared');assert.equal(closed.payload.kind,'link');assert.equal(closed.payload.canonicalUrl,origin+'/opportunities/canonical_job');assert.doesNotMatch(closed.payload.text,/Fictional|issuer\.example/)
})

test('a new closed restricted missing or failing current read never reuses earlier public facts',async()=>{
 let next=current();const prepare=preparer(options(async()=>next instanceof Response?next:json(next)))
 assert.equal((await prepare('public_job')).payload.kind,'checklist')
 const closed=makeRecord('job');closed.id='public_job';closed.lifecycle='closed'
 for(const value of [projectOpportunity(closed),{kind:'status',status:{schemaVersion:1,id:'public_job',revision:2,status:'withdrawn',application:'unavailable'}}]){
  next=value;const r=await prepare('public_job');assert.equal(r.kind,'prepared');assert.equal(r.payload.kind,'link');assert.doesNotMatch(r.payload.text,/Official application destination|Fictional/)
 }
 for(const status of [404,429,500,503]){next=json({error:'PRIVATE_RESPONSE_BODY'},{status});ref(await prepare('public_job'))}
 const failed=preparer(options(async()=>{throw Error('PRIVATE_NETWORK_ERROR')}));ref(await failed('public_job'))
})

test('invalid origin ID or deadline disables before fetch and invalid clock cannot produce output',async()=>{
 let calls=0;const fetch=async()=>{calls++;return json(current())}
 for(const config of [{origin:null},{origin:'https://user:PRIVATE@skilved.example'},{timeoutMs:0},{timeoutMs:8001},{timeoutMs:NaN}]){
  assert.deepEqual(await preparer({...options(fetch),...config})('public_job'),{kind:'disabled'})
 }
 for(const id of ['../PRIVATE','id?token=PRIVATE',''])assert.deepEqual(await preparer(options(fetch))(id),{kind:'disabled'})
 assert.equal(calls,0)
 for(const now of [()=> 'invalid',()=>{throw Error('PRIVATE_CLOCK')}])assert.deepEqual(await preparer({...options(fetch),now})('public_job'),{kind:'disabled'})
})

test('wrong media type redirect malformed private response and invalid public identity yield canonical-only fallback',async()=>{
 const bad=[
  json(current(),{headers:{'Content-Type':'text/html'}}),
  json(current(),{headers:{'Content-Type':'application/json; charset=utf-16'}}),
  new Response('PRIVATE_BROKEN_JSON',{headers:{'Content-Type':'application/json'}}),
  json({...current(),privateProgress:'PRIVATE_STAGES_RECEIPT'}),
  json({kind:'opportunity',opportunity:{...current().opportunity,id:'../PRIVATE'}}),
  new Response(null,{headers:{'Content-Type':'application/json'}}),
 ]
 const redirected=json(current());Object.defineProperty(redirected,'redirected',{value:true});bad.push(redirected)
 for(const response of bad)ref(await preparer(options(async()=>response))('public_job'))
})

test('declared lengths streamed byte cap and invalid UTF-8 fail closed with response cancellation',async()=>{
 for(const length of ['500001','10000000','-1','PRIVATE']){
  let cancelled=0;const response=new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array([123]))},cancel(){cancelled++}}),{headers:{'Content-Type':'application/json','Content-Length':length}})
  ref(await preparer(options(async()=>response))('public_job'));assert.ok(cancelled>0)
 }
 let cancelled=0
 const tooBig=new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(500001))},cancel(){cancelled++}}),{headers:{'Content-Type':'application/json','Content-Length':'1'}})
 ref(await preparer(options(async()=>tooBig))('public_job'));assert.ok(cancelled>0,'oversized stream must be cancelled')
 const invalid=new Response(new Uint8Array([0xc3,0x28]),{headers:{'Content-Type':'application/json'}})
 ref(await preparer(options(async()=>invalid))('public_job'))
})

test('whole deadline returns fallback even when fetch never settles or obeys abort', {timeout:1500},async()=>{
 let signal;const prepare=preparer({...options(async(_path,init)=>{signal=init.signal;return new Promise(()=>{})}),timeoutMs:10})
 const start=Date.now();ref(await prepare('public_job'));assert.ok(signal.aborted);assert.ok(Date.now()-start<1000)
})

test('whole deadline covers stalled body and cancels without waiting for a producer', {timeout:1500},async()=>{
 let cancelled=0
 const response=new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('{"kind":'))},cancel(){cancelled++}}),{headers:{'Content-Type':'application/json'}})
 const start=Date.now();ref(await preparer({...options(async()=>response),timeoutMs:10})('public_job'));assert.ok(cancelled>0);assert.ok(Date.now()-start<1000)
})

test('explicit abort yields no payload including an already-aborted signal', {timeout:1500},async()=>{
 let calls=0
 const prepare=preparer(options(async()=>{calls++;return new Promise(()=>{})})),controller=new AbortController()
 const pending=prepare('public_job',controller.signal);controller.abort()
 assert.deepEqual(await pending,{kind:'cancelled'});assert.deepEqual(await prepare('public_job',controller.signal),{kind:'cancelled'});assert.equal(calls,1)
})

test('superseding intent clears previous output and obsolete completion can neither publish nor return payload',async()=>{
 const first=deferred(),states=[];let n=0
 const newer={kind:'prepared',payload:{kind:'link',text:'CURRENT',canonicalUrl:origin+'/opportunities/new',filename:'current.txt'}}
 const old={kind:'prepared',payload:{kind:'link',text:'OBSOLETE',canonicalUrl:origin+'/opportunities/old',filename:'old.txt'}}
 const session=reader(s=>states.push(s),async()=>++n===1?first.promise:newer)
 const pending=session.refresh('old'),latest=await session.refresh('new')
 assert.deepEqual(latest,newer);assert.deepEqual(states.slice(0,2),[{kind:'loading'},{kind:'loading'}])
 first.resolve(old);assert.equal(await pending,null);assert.deepEqual(states.at(-1),newer);assert.ok(!JSON.stringify(states).includes('OBSOLETE'))
})

test('cancellation disposal and unexpected reader errors cannot publish or return private or obsolete data',async()=>{
 const wait=deferred(),states=[],session=reader(s=>states.push(s),async()=>wait.promise)
 const pending=session.refresh('public_job');session.cancel();session.dispose();wait.resolve({kind:'disabled'})
 assert.equal(await pending,null);assert.deepEqual(states,[{kind:'loading'},{kind:'idle'}]);assert.equal(await session.refresh('public_job'),null)
 const bad=reader(s=>states.push(s),async()=>{throw Error('PRIVATE_READER_FAILURE')});assert.deepEqual(await bad.refresh('public_job'),{kind:'disabled'});assert.ok(!JSON.stringify(states).includes('PRIVATE_'));bad.dispose()
})

test('copy time is captured after current read and local storage is never consulted',async()=>{
 const wait=deferred(),before='2026-10-24T01:00:00.000Z';let clock=before
 const previous=new Map()
 for(const key of ['localStorage','indexedDB']){previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,get(){throw Error('PRIVATE_BROWSER_SENTINEL')}})}
 try{
  const prepare=preparer({...options(async()=>wait.promise),now:()=>clock}),pending=prepare('public_job')
  clock=time;wait.resolve(json(current()));const out=await pending;assert.equal(out.kind,'prepared');assert.ok(out.payload.text.includes('Copy prepared: '+time));assert.ok(!out.payload.text.includes('Copy prepared: '+before));assert.doesNotMatch(JSON.stringify(out),/PRIVATE_|reviewer_fixture|snapshot_fixture/)
 }finally{for(const [key,value] of previous){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key]}}
})

test('consumer cancellation during prepared notification also invalidates the result returned to an action',async()=>{
 const prepared={kind:'prepared',payload:{kind:'link',text:'PUBLIC',canonicalUrl:origin+'/opportunities/public_job',filename:'public.txt'}}
 for(const action of ['cancel','dispose']){
  let session;const states=[]
  session=reader(state=>{states.push(state);if(state.kind==='prepared')session[action]()},async()=>prepared)
  assert.equal(await session.refresh('public_job'),null,'consumer '+action+' must invalidate the returned action payload')
  if(action==='cancel')assert.deepEqual(states.at(-1),{kind:'idle'})
 }
})
