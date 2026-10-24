import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {test} from 'node:test'
import {makeRecord} from '../../../packages/types/tests/fixtures/opportunities.mjs'
const require=createRequire(import.meta.url),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server')
const {projectOpportunity}=require('@skilved/types/opportunities/internal')
async function load(path,overrides={}){const code=ts.transpileModule(await readFile(new URL('../src/'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}});const out={};new Function('require','exports',code.outputText)(id=>overrides[id]??require(id),out);return out}
const core=await load('lib/public-export.ts'),actions=await load('lib/public-export-actions.ts',{'./public-export':core})
const origin='https://skilved.example',now=()=> '2026-10-24T02:00:00.000Z'
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve}}
function current(revision=1){const r=makeRecord('job');r.id='public_job';r.revision=revision;r.checks=r.checks.map(c=>({...c,recordRevision:revision}));r.title.value='Public rôle '+revision+' — café';return projectOpportunity(r)}
function fixture(options={}){let value=current(),calls=0;const views=[],copied=[],downloads=[];const prepare=core.createPublicExportPreparer({origin,now,fetch:async()=>{calls++;return new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}})},...options});const session=actions.createPublicExportActions('public_job',prepare,v=>views.push(v),{copy:async text=>copied.push(text),download:payload=>downloads.push(payload)});return {session,views,copied,downloads,get calls(){return calls},set value(v){value=v}}}
test('preview never authorizes later copy/download: each reads a changed revision and clears old output',async()=>{
  const f=fixture();await f.session.run('preview');assert.match(f.views.at(-1).payload.text,/Public rôle 1/);assert.equal(f.copied.length,0)
  f.value=current(2);const copying=f.session.run('copy');assert.equal(f.views.at(-1).kind,'reading');assert.equal(f.views.at(-1).payload,undefined);await copying
  assert.match(f.copied[0],/Public rôle 2/);assert.doesNotMatch(f.copied[0],/Public rôle 1/);assert.equal(f.views.at(-1).message,'Public text copied.')
  f.value=current(3);await f.session.run('download');assert.match(f.downloads[0].text,/Public rôle 3/);assert.match(f.downloads[0].filename,/public_job/);assert.equal(f.calls,3)
  assert.match(f.views.at(-1).message,/download requested/);assert.doesNotMatch(f.views.at(-1).message,/saved|delivered/)
  f.session.hide();assert.deepEqual(f.views.at(-1),{kind:'idle',message:''})
})
test('rapid duplicate intents serialize while a fresh read or native effect is pending',async()=>{
  const gate=deferred(),effect=deferred();let reads=0,copies=0;const views=[]
  const s=actions.createPublicExportActions('public_job',async()=>{reads++;return gate.promise},v=>views.push(v),{copy:async()=>{copies++;return effect.promise},download:()=>assert.fail()})
  const first=s.run('copy');await s.run('download');s.hide();assert.equal(reads,1);assert.equal(views.at(-1).kind,'reading')
  gate.resolve({kind:'prepared',payload:{kind:'checklist',text:'Public',filename:'public.txt',canonicalUrl:origin+'/opportunities/public_job'}})
  await new Promise(r=>setImmediate(r));assert.equal(copies,1);assert.equal(views.at(-1).kind,'acting');await s.run('copy');assert.equal(reads,1)
  effect.resolve();await first;assert.equal(views.at(-1).message,'Public text copied.')
})
test('restricted/missing/failed current reads export only a public reference without the old official destination',async()=>{
  const f=fixture();await f.session.run('preview');assert.match(f.views.at(-1).payload.text,/Public rôle/)
  f.value={kind:'status',status:{schemaVersion:1,id:'public_job',revision:2,status:'withdrawn',application:'unavailable'}}
  await f.session.run('copy');assert.doesNotMatch(f.copied[0],/Public rôle|example\.gov|PRIVATE_/);assert.match(f.copied[0],/https:\/\/skilved.example\/opportunities\/public_job/);assert.equal(f.views.at(-1).payload.kind,'link');assert.match(f.views.at(-1).message,/Only a public reference/)
  const failed=fixture({fetch:async()=>{throw Error('PRIVATE_NETWORK_DETAIL')}});await failed.session.run('download');assert.equal(failed.downloads[0].kind,'link');assert.doesNotMatch(JSON.stringify(failed.views),/PRIVATE_NETWORK/)
})
test('absent origin causes no network or native effect and no public payload',async()=>{
  const f=fixture({origin:null,fetch:async()=>assert.fail('network')});await f.session.run('copy');assert.equal(f.views.at(-1).kind,'disabled');assert.equal(f.copied.length,0);assert.equal(f.downloads.length,0);assert.equal(f.views.at(-1).payload,undefined)
})
test('clipboard/download denial retains selectable public preview without success or raw errors',async()=>{
  for(const intent of ['copy','download']){const views=[];const s=actions.createPublicExportActions('public_job',core.createPublicExportPreparer({origin,now,fetch:async()=>new Response(JSON.stringify(current()),{headers:{'Content-Type':'application/json'}})}),v=>views.push(v),{copy:async()=>{throw Error('PRIVATE_DENIAL')},download:()=>{throw Error('PRIVATE_DENIAL')}});await s.run(intent);assert.equal(views.at(-1).kind,'ready');assert.match(views.at(-1).payload.text,/Public rôle/);assert.match(views.at(-1).message,/select/i);assert.doesNotMatch(views.at(-1).message,/copied\.|requested\.|PRIVATE_DENIAL/)}
})
test('unmount aborts pending read and suppresses late payload/effect; already handed-off effects cannot announce late success',async()=>{
  const read=deferred(),views=[];let signal,effects=0
  const s=actions.createPublicExportActions('public_job',async(_id,s)=>{signal=s;return read.promise},v=>views.push(v),{copy:async()=>effects++,download:()=>effects++})
  const run=s.run('copy');s.dispose();assert.equal(signal.aborted,true);const size=views.length;read.resolve({kind:'prepared',payload:{kind:'link',text:'Public',filename:'public.txt',canonicalUrl:origin}});await run;assert.equal(views.length,size);assert.equal(effects,0)
  const effect=deferred(),later=[];const t=actions.createPublicExportActions('public_job',async()=>({kind:'prepared',payload:{kind:'link',text:'Public',filename:'public.txt',canonicalUrl:origin}}),v=>later.push(v),{copy:()=>effect.promise,download:()=>{}})
  const copying=t.run('copy');await new Promise(r=>setImmediate(r));assert.equal(later.at(-1).kind,'acting');t.dispose();const count=later.length;effect.resolve();await copying;assert.equal(later.length,count)
})
test('consumer teardown on reading/acting notification prevents the next network/native side effect',async()=>{
  for(const phase of ['reading','acting']){let effects=0,reads=0,s;const states=[];s=actions.createPublicExportActions('public_job',async()=>{reads++;return {kind:'prepared',payload:{kind:'link',text:'Public',filename:'public.txt',canonicalUrl:origin}}},v=>{states.push(v);if(v.kind===phase)s.dispose()},{copy:async()=>effects++,download:()=>effects++});await s.run('copy');assert.equal(effects,0);assert.equal(reads,phase==='reading'?0:1);assert.equal(states.at(-1).kind,phase)}
})
test('native clipboard adapter waits for success and rejects unsupported/denied host without persistence access',async()=>{
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator'),storage=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),gate=deferred();let text,finished=false
  try{Object.defineProperty(globalThis,'localStorage',{configurable:true,get:()=>assert.fail('private persistence accessed')});Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:t=>{text=t;return gate.promise}}}});const call=actions.copyPublicText('Public café').then(()=>{finished=true});assert.equal(text,'Public café');assert.equal(finished,false);gate.resolve();await call;assert.equal(finished,true)
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:{}});await assert.rejects(actions.copyPublicText('Public'))
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async()=>{throw Error('denied')}}}});await assert.rejects(actions.copyPublicText('Public'))
  }finally{for(const [key,d] of [['navigator',descriptor],['localStorage',storage]]){if(d)Object.defineProperty(globalThis,key,d);else delete globalThis[key]}}
})
test('download adapter hands exact UTF-8 text/filename to one temporary link and revokes URLs on success/failure',async()=>{
  const doc=Object.getOwnPropertyDescriptor(globalThis,'document'),create=URL.createObjectURL,revoke=URL.revokeObjectURL,timer=globalThis.setTimeout;const blobs=[],revoked=[];let appended=0,clicked=0,removed=0,cleanup,link,fail=false
  try{URL.createObjectURL=blob=>{blobs.push(blob);return 'blob:public-fixture'};URL.revokeObjectURL=u=>revoked.push(u);globalThis.setTimeout=fn=>{cleanup=fn;return 1};Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:tag=>{assert.equal(tag,'a');link={click:()=>{clicked++;if(fail)throw Error('denied')},remove:()=>removed++};return link},body:{append:()=>appended++}}})
    const payload={kind:'checklist',text:'Public rôle — café\nANY A OR B',filename:'skilved-public_job-r2.txt',canonicalUrl:origin+'/opportunities/public_job'};actions.downloadPublicText(payload);assert.equal(await blobs[0].text(),payload.text);assert.equal(blobs[0].type,'text/plain;charset=utf-8');assert.equal(link.download,payload.filename);assert.equal(link.href,'blob:public-fixture');assert.equal(link.hidden,true);assert.equal(appended,1);assert.equal(clicked,1);assert.equal(removed,1);assert.deepEqual(revoked,[]);cleanup();assert.deepEqual(revoked,['blob:public-fixture'])
    fail=true;assert.throws(()=>actions.downloadPublicText(payload));assert.equal(removed,2);assert.equal(revoked.length,2)
  }finally{URL.createObjectURL=create;URL.revokeObjectURL=revoke;globalThis.setTimeout=timer;if(doc)Object.defineProperty(globalThis,'document',doc);else delete globalThis.document}
})
test('server render keeps export disabled before hydration and does not embed checklist or private values',async()=>{
  const {PublicChecklistExport}=await load('components/catalogue/PublicChecklistExport.tsx',{'@/lib/public-export':core,'@/lib/public-export-actions':actions})
  for(const origin of [null,'https://skilved.example']){const html=renderToStaticMarkup(React.createElement(PublicChecklistExport,{id:'public_job',origin}));assert.equal((html.match(/disabled=""/g)??[]).length,3);assert.match(html,/Each action checks the current listing again/);assert.match(html,/receipts are excluded/);assert.match(html,/Opening links may use data/);assert.doesNotMatch(html,/textarea|PRIVATE_|name="|method="|action="/);if(!origin)assert.match(html,/export is currently unavailable/)}
})
