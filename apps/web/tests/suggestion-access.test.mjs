import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {test} from 'node:test'
const require=createRequire(import.meta.url),ts=require('typescript'),{IDBFactory,IDBObjectStore}=require('fake-indexeddb')
async function load(path){const code=ts.transpileModule(await readFile(new URL('../src/lib/'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});const out={};new Function('require','exports',code.outputText)(require,out);return out}
const {createSuggestionAccessStore:make,SUGGESTION_ACCESS_DATABASE:database}=await load('suggestion-access.ts')
const {createLocalProgressStore,LOCAL_PROGRESS_DATABASE}=await load('local-progress.ts')
const start='2026-10-16T12:00:00.000Z',expiry='2026-10-16T12:01:00.000Z',url='https://source.example/a'
const ticket='s1.'+'a'.repeat(64)+'.'+Date.parse(start)+'.'+Date.parse(expiry)+'.'+'d'.repeat(64)+'.'+'e'.repeat(64)
const access={receiptId:'b'.repeat(64),capability:'c'.repeat(64),expiresAt:expiry}
function fixture(){const indexedDB=new IDBFactory();let seq=0,time=start;const options={indexedDB,newToken:()=> 'write_'+ ++seq,now:()=>time};return {indexedDB,store:make(options),other:()=>make(options),time:v=>{time=v}}}
async function raw(factory,value,write=false){return new Promise((resolve,reject)=>{const r=factory.open(database,1);r.onupgradeneeded=()=>r.result.createObjectStore('access');r.onsuccess=()=>{const db=r.result,tx=db.transaction('access',write?'readwrite':'readonly'),request=write?tx.objectStore('access').put(value,'current'):tx.objectStore('access').get('current');tx.oncomplete=()=>{db.close();resolve(request.result)};tx.onabort=()=>{db.close();reject(tx.error)}};r.onerror=()=>reject(r.error)})}
async function pending(f){let r=await f.store.change(null,{type:'prepare',id:'attempt',url});r=await f.store.change(r.snapshot.token,{type:'ticket',id:'attempt',ticket,expiresAt:expiry});return r}

test('private ledger commits draft, ticket, send and receipt across connections without retaining URL/ticket after receipt',async()=>{
  const f=fixture();assert.notEqual(database,LOCAL_PROGRESS_DATABASE);assert.deepEqual((await f.store.read()).snapshot,{token:null,items:[]})
  let r=await pending(f);assert.equal(r.status,'saved');assert.deepEqual((await f.other().read()).snapshot,r.snapshot)
  assert.equal((await f.store.change(r.snapshot.token,{type:'received',id:'attempt',access})).status,'invalid')
  r=await f.other().change(r.snapshot.token,{type:'sent',id:'attempt'});assert.equal(r.snapshot.items[0].sentAt,start)
  r=await f.store.change(r.snapshot.token,{type:'received',id:'attempt',access});assert.equal(r.status,'saved');assert.equal(r.snapshot.items[0].kind,'receipt')
  assert.deepEqual((await f.other().read()).snapshot,r.snapshot)
  const text=await raw(f.indexedDB);assert.equal(text.includes(ticket),false);assert.equal(text.includes(url),false)
  assert.equal(text.includes(access.capability),true);assert.doesNotMatch(text,/publicResult|status|notes|title/)
})
test('two connections have one CAS winner and forget/clear/deletion reject stale asynchronous completion',async()=>{
  const f=fixture(),r=await pending(f),results=await Promise.all([f.store.change(r.snapshot.token,{type:'sent',id:'attempt'}),f.other().change(r.snapshot.token,{type:'sent',id:'attempt'})])
  assert.deepEqual(results.map(r=>r.status).sort(),['conflict','saved']);const sent=results.find(r=>r.status==='saved')
  assert.equal((await f.other().change(sent.snapshot.token,{type:'forget',id:'attempt'})).status,'saved')
  assert.equal((await f.store.change(sent.snapshot.token,{type:'received',id:'attempt',access})).status,'conflict')
  const cleared=await f.other().clear();assert.equal((await f.store.change(sent.snapshot.token,{type:'received',id:'attempt',access})).status,'conflict')
  await new Promise((resolve,reject)=>{const d=f.indexedDB.deleteDatabase(database);d.onsuccess=resolve;d.onerror=reject})
  assert.equal((await f.store.change(cleared.snapshot.token,{type:'prepare',id:'stale',url})).status,'conflict');assert.deepEqual((await f.store.read()).snapshot.items,[])
})
test('abort after put success and quota failure do not acknowledge or replace committed pending access',async()=>{
  const f=fixture(),r=await pending(f),original=IDBObjectStore.prototype.put
  try{
    IDBObjectStore.prototype.put=function(){throw new DOMException('PRIVATE_QUOTA','QuotaExceededError')}
    assert.deepEqual(await f.store.change(r.snapshot.token,{type:'sent',id:'attempt'}),{status:'unavailable'})
    IDBObjectStore.prototype.put=function(...args){const request=original.apply(this,args),tx=this.transaction;request.addEventListener('success',()=>tx.abort());return request}
    assert.equal((await f.store.clear()).status,'unavailable')
  }finally{IDBObjectStore.prototype.put=original}
  assert.deepEqual((await f.other().read()).snapshot,r.snapshot)
})
test('corrupt, future, oversized and private extra fields are preserved until explicit receipt clear',async()=>{
  const draft={kind:'draft',id:'attempt',url,createdAt:start}
  for(const value of ['{bad','x'.repeat(100001),JSON.stringify({schemaVersion:2}),JSON.stringify({schemaVersion:1,writeToken:'seed',items:[{...draft,notes:'PRIVATE'}]}),JSON.stringify({schemaVersion:1,writeToken:'seed',items:[draft,draft]})]){
    const f=fixture();await raw(f.indexedDB,value,true);assert.equal((await f.store.read()).status,'unreadable');assert.equal((await f.store.change('seed',{type:'prepare',id:'other',url})).status,'unreadable');assert.equal(await raw(f.indexedDB),value)
    assert.equal((await f.store.clear()).status,'saved');assert.deepEqual((await f.store.read()).snapshot.items,[])
  }
})
test('bounds, clock rollback, expiry and response extension do not silently change access',async()=>{
  const f=fixture();let r=await pending(f)
  assert.equal((await f.store.change(r.snapshot.token,{type:'sent',id:'attempt',capability:'PRIVATE'})).status,'invalid')
  f.time('2020-01-01T00:00:00.000Z');assert.equal((await f.store.change(r.snapshot.token,{type:'sent',id:'attempt'})).status,'invalid');f.time(start)
  r=await f.store.change(r.snapshot.token,{type:'sent',id:'attempt'})
  assert.equal((await f.store.change(r.snapshot.token,{type:'received',id:'attempt',access:{...access,expiresAt:'2026-10-16T12:02:00.000Z'}})).status,'invalid')
  f.time(expiry);assert.equal((await f.store.change(r.snapshot.token,{type:'received',id:'attempt',access})).status,'expired');assert.equal((await f.store.read()).snapshot.items[0].kind,'pending')
  const full={schemaVersion:1,writeToken:'full',items:Array.from({length:25},(_,i)=>({kind:'draft',id:'attempt_'+i,url,createdAt:start}))};await raw(f.indexedDB,JSON.stringify(full),true);f.time(start)
  assert.equal((await f.store.change('full',{type:'prepare',id:'extra',url})).status,'full')
})
test('receipt clear and progress clear preserve the other actual IndexedDB database',async()=>{
  const f=fixture();let seq=0;const progress=createLocalProgressStore({indexedDB:f.indexedDB,newToken:()=> 'progress_'+ ++seq,now:()=>start})
  await pending(f);await progress.change(null,{type:'save',id:'listing',revision:1});await f.store.clear();assert.equal((await progress.read()).snapshot.items.length,1)
  const empty=await f.store.read();await f.store.change(empty.snapshot.token,{type:'prepare',id:'new',url});assert.equal((await progress.clear()).status,'saved');assert.equal((await f.store.read()).snapshot.items.length,1)
})
test('unavailable and blocked receipt storage return bounded safe errors',async()=>{
  for(const indexedDB of [{open(){throw Error('PRIVATE_STORAGE')}},{open(){const r={};queueMicrotask(()=>r.onblocked());return r}}]){
    const store=make({indexedDB});assert.deepEqual(await store.read(),{status:'unavailable'});assert.deepEqual(await store.clear(),{status:'unavailable'});assert.deepEqual(await store.change(null,{type:'prepare',id:'attempt',url}),{status:'unavailable'})
  }
})
test('oversized stored strings are rejected before allocating an encoded copy',async()=>{
  const f=fixture();await raw(f.indexedDB,'x'.repeat(100001),true)
  const original=TextEncoder.prototype.encode;let oversized=0
  try{
    TextEncoder.prototype.encode=function(value){if(value.length>100000)oversized++;return original.call(this,value)}
    assert.equal((await f.store.read()).status,'unreadable');assert.equal(oversized,0)
  }finally{TextEncoder.prototype.encode=original}
})
