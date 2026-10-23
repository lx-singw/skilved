import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {test} from 'node:test'
const require=createRequire(import.meta.url),ts=require('typescript'),{IDBFactory}=require('fake-indexeddb')
async function load(path,overrides={}){const code=ts.transpileModule(await readFile(new URL('../src/lib/'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});const out={};new Function('require','exports',code.outputText)(id=>overrides[id]??require(id),out);return out}
const core=await load('suggestion-access.ts'),{createSuggestionClient:client,createSuggestionTransport:transport}=await load('suggestion-client.ts',{'./suggestion-access':core})
const start='2026-10-16T12:00:00.000Z',expiry='2026-10-16T12:01:00.000Z',url='https://source.example/a',root='/api/v1/opportunity-suggestions'
const ticket='s1.'+'a'.repeat(64)+'.'+Date.parse(start)+'.'+Date.parse(expiry)+'.'+'d'.repeat(64)+'.'+'e'.repeat(64)
const access={receiptId:'b'.repeat(64),capability:'c'.repeat(64),expiresAt:expiry},issued={ticket,expiresAt:expiry},received={kind:'received',access}
const status={schemaVersion:1,receiptId:access.receiptId,status:'received',revision:1,createdAt:start,updatedAt:start,expiresAt:expiry,publicResultIds:[]}
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json'}})
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve}}
function fixture(){const indexedDB=new IDBFactory();let seq=0;const options={indexedDB,newToken:()=> 'write_'+ ++seq,now:()=>start};const store=core.createSuggestionAccessStore(options);return {indexedDB,store,other:()=>core.createSuggestionAccessStore(options)}}
const wire=(fetch,extra={})=>transport({fetch,now:()=>start,...extra})

test('transport sends URL-only bodies and secrets only in scoped headers with no cookies/referrer/cache/redirects',async()=>{
  const calls=[],t=wire(async(path,options)=>{calls.push([path,options]);return json(path.endsWith('/tickets')?issued:options.method==='DELETE'?{schemaVersion:1,receiptId:access.receiptId,status:'withdrawn'}:options.method==='GET'?status:received)})
  assert.equal((await t.ticket({url})).kind,'ok');assert.equal((await t.create({url,ticket})).kind,'ok');assert.equal((await t.status(access)).kind,'ok');assert.equal((await t.withdraw(access)).kind,'ok')
  assert.deepEqual(calls.map(([p])=>p),[root+'/tickets',root,root+'/'+access.receiptId+'/status',root+'/'+access.receiptId])
  for(const [path,o] of calls){assert.equal(path.includes(ticket),false);assert.equal(path.includes(access.capability),false);assert.equal(o.credentials,'omit');assert.equal(o.cache,'no-store');assert.equal(o.redirect,'error');assert.equal(o.mode,'same-origin');assert.equal(o.referrerPolicy,'no-referrer');assert.equal(o.headers.Cookie,undefined);if(o.body)assert.deepEqual(JSON.parse(o.body),{url})}
  assert.equal(calls[1][1].headers['Idempotency-Key'],ticket);assert.equal(calls[2][1].headers.Authorization,'Bearer '+access.capability)
})
test('transport rejects invalid input/output, wrong receipt identity/expiry and private server errors',async()=>{
  let calls=0;const t=wire(async()=>{calls++;return json({private:'PRIVATE_PAYLOAD'})})
  assert.deepEqual(await t.ticket({url,contact:'PRIVATE'}),{kind:'invalid'});assert.deepEqual(await t.create({url,ticket:'BAD'}),{kind:'invalid'});assert.deepEqual(await t.status({...access,notes:'PRIVATE'}),{kind:'invalid'});assert.equal(calls,0)
  assert.deepEqual(await t.ticket({url}),{kind:'unavailable'});assert.deepEqual(await wire(async()=>json({...status,receiptId:'f'.repeat(64)})).status(access),{kind:'unavailable'})
  assert.deepEqual(await wire(async()=>json({...status,expiresAt:'2026-10-16T12:02:00.000Z'})).status(access),{kind:'unavailable'})
  for(const [http,kind] of [[400,'invalid'],[404,'not_found'],[429,'limited'],[503,'unavailable']])assert.deepEqual(await wire(async()=>json({error:'PRIVATE_ERROR'},http)).ticket({url}),{kind})
  assert.deepEqual(await wire(async()=>{throw Error('PRIVATE_EXCEPTION')}).ticket({url}),{kind:'unavailable'})
})
test('bounded streams, redirects, abort and a fetch ignoring abort cannot produce success',async()=>{
  const redirected=json(issued);Object.defineProperty(redirected,'redirected',{value:true});assert.deepEqual(await wire(async()=>redirected).ticket({url}),{kind:'unavailable'})
  for(const response of [new Response('x'.repeat(8193),{headers:{'Content-Type':'application/json'}}),new Response(JSON.stringify(issued),{headers:{'Content-Type':'text/html'}}),json({...issued,expiresAt:start})])assert.deepEqual(await wire(async()=>response).ticket({url}),{kind:'unavailable'})
  assert.deepEqual(await wire(()=>new Promise(()=>{}),{timeoutMs:10}).ticket({url}),{kind:'unavailable'})
  let cancelled=false;const stream=new ReadableStream({pull(){},cancel(){cancelled=true}})
  assert.deepEqual(await wire(async()=>new Response(stream,{headers:{'Content-Type':'application/json'}}),{timeoutMs:10}).ticket({url}),{kind:'unavailable'});assert.equal(cancelled,true)
  const abort=new AbortController();abort.abort();let calls=0;assert.deepEqual(await wire(async()=>{calls++;return json(issued)}).ticket({url},abort.signal),{kind:'unavailable'});assert.equal(calls,0)
})
test('workflow commits a draft before issuance, ticket and send before create, and access before saved feedback',async()=>{
  const f=fixture(),t=wire(async(path)=>{const r=await f.other().read(),item=r.snapshot.items[0];if(path.endsWith('/tickets')){assert.equal(item.kind,'draft');return json(issued)}assert.equal(item.kind,'pending');assert.equal(item.ticket,ticket);assert.equal(item.sentAt,start);return json(received)})
  const c=client(f.store,t,()=> 'attempt');assert.deepEqual(await c.submit(null,{url}),{kind:'saved',id:'attempt'})
  const saved=await f.other().read();assert.equal(saved.snapshot.items[0].kind,'receipt');assert.equal(saved.snapshot.items[0].access.capability,access.capability)
  assert.deepEqual(await c.retry(saved.snapshot.token,'attempt'),{kind:'local',status:'invalid'})
})
test('response loss retains the same sent ticket across a new connection; explicit retry never reissues it',async()=>{
  const f=fixture();let issues=0,creates=0
  const t=wire(async(path,o)=>{if(path.endsWith('/tickets')){issues++;return json(issued)}creates++;assert.equal(o.headers['Idempotency-Key'],ticket);if(creates===1)throw Error('PRIVATE_LOST_RESPONSE');return json(received)})
  assert.deepEqual(await client(f.store,t,()=> 'attempt').submit(null,{url}),{kind:'unavailable'})
  const pending=await f.other().read();assert.equal(pending.snapshot.items[0].kind,'pending');assert.equal(pending.snapshot.items[0].ticket,ticket)
  assert.deepEqual(await client(f.other(),t).retry(pending.snapshot.token,'attempt'),{kind:'saved',id:'attempt'});assert.equal(issues,1);assert.equal(creates,2)
})
test('clear or database deletion while issuance/create is in flight cannot resurrect access',async()=>{
  for(const phase of ['issue','create','delete']){
    const f=fixture(),gate=deferred(),entered=deferred();let creates=0
    const t=wire(async(path)=>{if(path.endsWith('/tickets')){if(phase==='issue'){entered.resolve();return gate.promise}return json(issued)}creates++;entered.resolve();return gate.promise})
    const task=client(f.store,t,()=> 'attempt').submit(null,{url});await entered.promise
    if(phase==='delete')await new Promise((resolve,reject)=>{const r=f.indexedDB.deleteDatabase(core.SUGGESTION_ACCESS_DATABASE);r.onsuccess=resolve;r.onerror=reject})
    else await f.other().clear()
    gate.resolve(json(phase==='issue'?issued:received));assert.deepEqual(await task,{kind:'local',status:'conflict'});assert.deepEqual((await f.store.read()).snapshot.items,[]);if(phase==='issue')assert.equal(creates,0)
  }
})
test('storage failure never sends create or claims saved; late receipt save failure leaves retry evidence',async()=>{
  const f=fixture();let calls=0;const t=wire(async path=>{calls++;return json(path.endsWith('/tickets')?issued:received)})
  const broken={...f.store,change:async()=>({status:'unavailable'})};assert.deepEqual(await client(broken,t,()=> 'attempt').submit(null,{url}),{kind:'local',status:'unavailable'});assert.equal(calls,0)
  const failReceive={...f.store,change:(token,c)=>c.type==='received'?Promise.resolve({status:'unavailable'}):f.store.change(token,c)}
  assert.deepEqual(await client(failReceive,t,()=> 'attempt').submit(null,{url}),{kind:'local',status:'unavailable'});assert.equal((await f.store.read()).snapshot.items[0].kind,'pending')
})
test('status does not cache results; withdrawal acknowledgement and local forget are distinct',async()=>{
  const f=fixture();let withdrawals=0;const t=wire(async(path,o)=>json(path.endsWith('/tickets')?issued:o.method==='DELETE'?(withdrawals++,{schemaVersion:1,receiptId:access.receiptId,status:'withdrawn'}):o.method==='GET'?status:received))
  const c=client(f.store,t,()=> 'attempt');await c.submit(null,{url});const saved=await f.store.read()
  assert.equal((await c.status(saved.snapshot.token,'attempt')).kind,'ok');assert.deepEqual((await f.store.read()).snapshot,saved.snapshot)
  const bad=client(f.store,wire(async()=>json({error:'PRIVATE'},503)));assert.deepEqual(await bad.withdraw(saved.snapshot.token,'attempt'),{kind:'unavailable'});assert.equal((await f.store.read()).snapshot.items.length,1)
  assert.deepEqual(await c.withdraw(saved.snapshot.token,'attempt'),{kind:'withdrawn',forgotten:true});assert.equal(withdrawals,1);assert.deepEqual((await f.store.read()).snapshot.items,[])
  const empty=await f.store.read();await f.store.change(empty.snapshot.token,{type:'prepare',id:'local_only',url});const current=await f.store.read();await c.forget(current.snapshot.token,'local_only');assert.equal(withdrawals,1)
})
test('public outcomes are returned without local access cache, and stale status cannot overwrite a local clear',async()=>{
  for(const response of [{kind:'approved',publicResultIds:['approved_A']},{kind:'previous_result_unavailable'}]){
    const f=fixture(),c=client(f.store,wire(async path=>json(path.endsWith('/tickets')?issued:response)),()=> 'attempt');assert.deepEqual(await c.submit(null,{url}),response);assert.deepEqual((await f.store.read()).snapshot.items,[])
  }
  const f=fixture();await client(f.store,wire(async path=>json(path.endsWith('/tickets')?issued:received)),()=> 'attempt').submit(null,{url});const saved=await f.store.read(),gate=deferred(),entered=deferred()
  const task=client(f.store,wire(async()=>{entered.resolve();return gate.promise})).status(saved.snapshot.token,'attempt');await entered.promise;await f.other().clear();gate.resolve(json(status));assert.deepEqual(await task,{kind:'local',status:'conflict'})
})
