import assert from 'node:assert/strict'
import {test} from 'node:test'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {makeRecord} from '../../../packages/types/tests/fixtures/opportunities.mjs'
const require=createRequire(import.meta.url),ts=require('typescript'),{projectOpportunity}=require('@skilved/types/opportunities/internal')
async function load(name,overrides={}){const out={},compiled=ts.transpileModule(await readFile(new URL('../src/lib/'+name,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});new Function('require','exports',compiled.outputText)(id=>overrides[id]??require(id),out);return out}
const core=await load('public-export.ts'),{createPublicExportActions:session}=await load('public-export-actions.ts',{'./public-export':core}),{sharePublicText:share}=await load('public-export-share.ts')
const origin='https://skilved.example',now=()=> '2026-10-24T02:31:00.000Z',deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve}}
function current(revision){const r=makeRecord('job');r.id='public_job';r.revision=revision;r.checks=r.checks.map(c=>({...c,recordRevision:revision}));r.title.value='Public rôle '+revision;return projectOpportunity(r)}
const payload={kind:'link',text:'Public reference\n'+origin+'/opportunities/public_job',filename:'skilved-public_job.txt',canonicalUrl:origin+'/opportunities/public_job'}
const noFallback={copy:async()=>assert.fail('automatic copy'),download:()=>assert.fail('automatic download')}
test('native adapter passes only exact public text, binds the host and awaits actual handoff settlement',async()=>{
  const gate=deferred(),seen=[];let settled=false;const host={canShare(data){assert.equal(this,host);seen.push(data);return true},share(data){assert.equal(this,host);seen.push(data);return gate.promise}}
  const call=share('Public rôle — café',host).then(value=>{settled=true;return value});assert.equal(settled,false);assert.deepEqual(seen,[{text:'Public rôle — café'},{text:'Public rôle — café'}]);gate.resolve();assert.equal(await call,'handed_off')
  assert.equal(await share('Public',{share:async data=>assert.deepEqual(data,{text:'Public'})}),'handed_off')
})
test('unsupported, denied, throwing host and cancellation/no-target outcomes remain bounded without raw host errors',async()=>{
  assert.equal(await share('Public',{}),'unavailable');assert.equal(await share('Public',{canShare:()=>false,share:async()=>assert.fail()}),'unavailable')
  for(const name of ['NotAllowedError','InvalidStateError','DataError','TypeError'])assert.equal(await share('Public',{share:async()=>{throw {name,message:'PRIVATE_HOST'}}}),'unavailable')
  assert.equal(await share('Public',{share:async()=>{throw new DOMException('PRIVATE_HOST','AbortError')}}),'cancelled_or_unavailable')
  assert.equal(await share('Public',{get share(){throw Error('PRIVATE_HOST')}}),'unavailable')
  assert.equal(await share('Public',{canShare:()=>{throw Error('PRIVATE_HOST')},share:async()=>assert.fail()}),'unavailable')
  assert.equal(await share('Public',{share:async()=>{throw {get name(){throw Error('PRIVATE_HOST')}}}}),'unavailable')
})
test('share intent rereads after preview and shares revised public text, then reference-only after restriction or failed read',async()=>{
  let value=current(1),reads=0,fail=false;const views=[],shared=[]
  const prepare=core.createPublicExportPreparer({origin,now,fetch:async()=>{reads++;if(fail)throw Error('PRIVATE_NETWORK');return new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}})}})
  const s=session('public_job',prepare,v=>views.push(v),{...noFallback,share:async text=>{shared.push(text);return 'handed_off'}})
  await s.run('preview');value=current(2);await s.run('share');assert.match(shared[0],/Public rôle 2/);assert.doesNotMatch(shared[0],/Public rôle 1|PRIVATE_/);assert.equal(reads,2);assert.match(views.at(-1).message,/Delivery is not confirmed/)
  value={kind:'status',status:{schemaVersion:1,id:'public_job',revision:3,status:'under_review',application:'unavailable'}};await s.run('share');assert.match(shared[1],/https:\/\/skilved.example\/opportunities\/public_job/);assert.doesNotMatch(shared[1],/Public rôle|issuer\.example|PRIVATE_/);assert.match(views.at(-1).message,/Only a public reference/)
  fail=true;await s.run('share');assert.equal(views.at(-1).payload.kind,'link');assert.doesNotMatch(shared[2],/PRIVATE_NETWORK|issuer\.example/)
  const disabled=session('public_job',core.createPublicExportPreparer({origin:null,fetch:async()=>assert.fail()}),v=>views.push(v),{...noFallback,share:async()=>assert.fail()});await disabled.run('share');assert.equal(views.at(-1).kind,'disabled')
})
test('share messages distinguish handoff, ambiguous abort and unavailable, without retries or implicit fallback',async()=>{
  for(const outcome of ['handed_off','cancelled_or_unavailable','unavailable',undefined,'PRIVATE_BAD_OUTCOME','throw']){const views=[];let calls=0;const effects={...noFallback};if(outcome!==undefined)effects.share=async()=>{calls++;if(outcome==='throw')throw Error('PRIVATE_HOST');return outcome};const s=session('public_job',async()=>({kind:'prepared',payload}),v=>views.push(v),effects);await s.run('share');const view=views.at(-1);assert.equal(view.kind,'ready');assert.equal(view.payload,payload);assert.equal(calls,outcome===undefined?0:1);assert.doesNotMatch(view.message,/PRIVATE_|sent successfully|delivered|Public text copied/);if(outcome==='handed_off')assert.match(view.message,/handoff completed.*Delivery is not confirmed/);else if(outcome==='cancelled_or_unavailable')assert.match(view.message,/cancelled or no target/);else assert.match(view.message,/Sharing is unavailable/)}
})
test('disposal before fresh read completion or during acting notification prevents native invocation',async()=>{
  const gate=deferred(),views=[];let calls=0,signal;const s=session('public_job',async(_id,sig)=>{signal=sig;return gate.promise},v=>views.push(v),{...noFallback,share:async()=>{calls++;return 'handed_off'}});const running=s.run('share');s.dispose();assert.equal(signal.aborted,true);const count=views.length;gate.resolve({kind:'prepared',payload});await running;assert.equal(calls,0);assert.equal(views.length,count)
  let t;t=session('public_job',async()=>({kind:'prepared',payload}),v=>{if(v.kind==='acting')t.dispose()},{...noFallback,share:async()=>{calls++;return 'handed_off'}});await t.run('share');assert.equal(calls,0)
})
test('pending native handoff serializes duplicate intents and cannot announce completion after teardown',async()=>{
  const gate=deferred(),views=[];let calls=0;const s=session('public_job',async()=>({kind:'prepared',payload}),v=>views.push(v),{...noFallback,share:async()=>{calls++;return gate.promise}});const running=s.run('share');await new Promise(r=>setImmediate(r));assert.equal(views.at(-1).kind,'acting');await s.run('share');assert.equal(calls,1);s.dispose();const count=views.length;gate.resolve('handed_off');await running;assert.equal(views.length,count)
})
