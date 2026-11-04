import{test,before,after}from'node:test';import assert from'node:assert/strict';import{createHash,randomUUID}from'node:crypto';
import{FastRecentJobsWorker}from'../src/fast-recentjobs-worker.mjs';import{getRuntime}from'../src/runtime.mjs';import{DomainError}from'../src/config.mjs';
import{originalFixture,originalHtml}from'./fixtures/original-notices.mjs';import{syntheticExtraction}from'./fixtures/recentjobs-model.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex'),payload=x=>({json:JSON.stringify(x)}),value=s=>s.exists?JSON.parse(s.data().json):null;
let db;before(async()=>{process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-fast-bridge';db=(await getRuntime()).db;});after(async()=>{await db?.terminate();});
async function fixture({count=1,calls=20,original=false,provider='groq',providerProject='authored-'+randomUUID(),rpd,authority=false}={}){
 let at='2026-10-29T10:00:00.000Z';const id='bridge_'+randomUUID(),principal=randomUUID()+'@example.test';
 const authored=Array.from({length:count},(_,i)=>originalFixture({slug:'authored-fast-'+i,path:'/tenant-a/job/'+(i+123)+'/',reference:null}));
 const source=structuredClone(authored[0].source);source.id=id;source.automation.maxModelCallsPerDay=calls;source.automation.employerCrawl=original;
 if(!original)delete source.automation.originalVerification;
 source.automation.fastIngestion={version:'shadow_v1',discoveryIntervalMs:120000,maxConcurrentJobs:3,leaseMs:600000};
 const state={fetches:[],extractions:0,validations:0,supported:true,beforeExtract:null,beforeFetch:null,extractionError:null};
 const env={SKILVED_CATALOGUE_MODE:'emulator',SKILVED_CATALOGUE_PROJECT:db.projectId,SKILVED_GEMINI_PROJECT_ID:providerProject,SKILVED_AI_FALLBACK:'false',...(authority?{SKILVED_GEMINI_AUTHORITY_PROJECT:db.projectId,SKILVED_GEMINI_AUTHORITY_EPOCH:'a'.repeat(64)}:{}),...(rpd?{SKILVED_GEMINI_MODEL_LIMITS:JSON.stringify({'gemini-3.5-flash-lite':{rpd}})}:{})};
 const options={enabled:true,sourceId:id,sourceRevision:1,provider,...(provider==='gemini'?{model:'gemini-3.5-flash-lite'}:{}),env,now:()=>at,
  sleep:async ms=>{at=new Date(Date.parse(at)+ms).toISOString();},fetcher:async(_source,url)=>{
   state.fetches.push(url);await state.beforeFetch?.(url);
   if(url.endsWith('/robots.txt'))return{url,text:'User-agent: *\nAllow: /'};
   const detail=authored.find(a=>a.detailUrl===url);if(detail)return{url,text:detail.detailHtml.replaceAll('30 October 2026','30 November 2026')};
   const primary=authored.find(a=>a.url===url);if(primary)return{url,text:originalHtml({...primary.posting,validThrough:primary.expiry??'2026-11-30'})};
   assert.fail('Unexpected fetch '+url);
  },extractor:async(_candidate,config)=>{const send=async()=>{state.extractions++;await state.beforeExtract?.();if(state.extractionError)throw state.extractionError;const extraction=syntheticExtraction();extraction.deadline={state:'stated',value:{kind:'date',originalText:'Closing date: 30 November 2026',localDate:'2026-11-30',localTime:null,timezone:null,utcInstant:null},quote:'Closing date: 30 November 2026'};return{extraction,provenance:{usage:{totalTokens:20}}};};return config.runAttempt?config.runAttempt({model:'gemini-3.5-flash-lite'},send):send();},
  validator:async({primary},config)=>{const send=async()=>{state.validations++;return{supported:state.supported,issues:state.supported?[]:[{field:'requirements',reason:'Authored mismatch'}],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'},...(primary?[{source:'primary',quote:'Fictional Workshop'}]:[])],provenance:{usage:{totalTokens:20}}};};return config.runAttempt?config.runAttempt({model:'gemini-3.5-flash-lite'},send):send();}};
 const worker=new FastRecentJobsWorker(db,principal,options);await worker.fast.ref('sources',id).set(payload(source));await worker.fast.ref('workers',worker.actor).set({principal,active:true,sources:[id],roles:['ingest']});
 const poll=await worker.fast.poll();await worker.fast.recordDiscovery(poll.claim,authored.map(a=>a.detailUrl));const jobs=(await worker.fast.snapshot()).jobs.sort((a,b)=>a.url.localeCompare(b.url));
 return{worker,source,id,principal,state,authored,jobs,options,now:()=>at,advance:ms=>{at=new Date(Date.parse(at)+ms).toISOString();},restart:()=>new FastRecentJobsWorker(db,principal,options),save:()=>worker.fast.ref('sources',id).set(payload(source)),budget:async day=>value(await worker.fast.ref('model_budgets',hash(id+':'+(day??'2026-10-29'))).get()),drafts:async()=>Promise.all(jobs.map(j=>worker.fast.ref('drafts',hash(id+':'+hash(j.url))).get()))};
}
test('bridge is explicit single-notice shadow work and refuses legacy entry points',async()=>{
 assert.throws(()=>new FastRecentJobsWorker(null,'worker@example.test'),{code:'FAST_INGESTION_DISABLED'});
 assert.throws(()=>new FastRecentJobsWorker(null,'worker@example.test',{enabled:true,programmeExtraction:true}),{code:'FAST_BRIDGE_SINGLE_ONLY'});
 const f=await fixture();await assert.rejects(f.worker.run(f.id),{code:'FAST_BRIDGE_ENTRYPOINT_REQUIRED'});
});
test('normal extraction, independent validation and writer create one real private draft with atomic completion',async()=>{
 const f=await fixture(),r=await f.worker.runNotice(f.jobs[0].id);assert.equal(r.state,'done');assert.equal(r.published,false);assert.equal(f.state.extractions,1);assert.equal(f.state.validations,1);
 const draft=value((await f.drafts())[0]);assert.equal(draft.publication.approved,false);assert.equal(draft.applicationRoute.value.destination,f.authored[0].url);assert.equal((await f.worker.fast.snapshot()).summary.privateReady,1);assert.equal((await f.budget()).calls,2);
 assert.equal((await db.collection('m0_public').get()).size,0);assert.ok(f.state.fetches.every(url=>url.startsWith('https://recentjobs.co.za/')));assert.equal((await f.worker.fast.ref('worker_leases',f.id).get()).exists,false);
});
test('simultaneous notices use separate execution contexts and share the exact source budget',{timeout:30000},async()=>{
 const f=await fixture({count:2,calls:2});let arrived=0,release;const gate=new Promise(resolve=>{release=resolve;});f.state.beforeExtract=async()=>{if(++arrived===2)release();await gate;};
 const results=await Promise.all(f.jobs.map(j=>f.worker.runNotice(j.id)));assert.ok(results.every(r=>r.reason==='MODEL_BUDGET_EXHAUSTED'));assert.equal(f.state.extractions,2);assert.equal(f.state.validations,0);assert.equal((await f.budget()).calls,2);
 const queued=(await f.worker.fast.snapshot()).jobs;assert.ok(queued.every(j=>j.state==='queued'&&j.blockedBy==='source_budget'));assert.ok((await f.drafts()).every(d=>!d.exists));assert.ok(queued.every(j=>j.firstSeenAt===f.jobs[0].firstSeenAt));
});
test('natural source-day renewal reuses cached extractions without resetting history or first seen',{timeout:30000},async()=>{
 const f=await fixture({count:2,calls:2});let arrived=0,release;const gate=new Promise(resolve=>{release=resolve;});f.state.beforeExtract=async()=>{if(++arrived===2)release();await gate;};await Promise.all(f.jobs.map(j=>f.worker.runNotice(j.id)));const before=await f.budget(),firstSeen=f.jobs.map(j=>j.firstSeenAt);
 const due=(await f.worker.fast.snapshot()).jobs[0].nextAt;f.advance(Date.parse(due)-Date.parse(f.now()));
 const results=await Promise.all(f.jobs.map(j=>f.restart().runNotice(j.id)));assert.ok(results.every(r=>r.state==='done'),JSON.stringify(results));assert.equal(f.state.extractions,2);assert.equal(f.state.validations,2);assert.deepEqual(await f.budget(),before);assert.equal((await f.budget('2026-10-30')).calls,2);
 assert.ok((await f.drafts()).every(d=>d.exists));assert.deepEqual((await f.worker.fast.snapshot()).jobs.sort((a,b)=>a.url.localeCompare(b.url)).map(j=>j.firstSeenAt),firstSeen);
});
test('independent semantic rejection preserves actual spend and leaves no draft or completion marker',async()=>{
 const f=await fixture();f.state.supported=false;const r=await f.worker.runNotice(f.jobs[0].id);assert.equal(r.reason,'SEMANTIC_VALIDATION_FAILED');assert.equal((await f.budget()).calls,2);assert.ok((await f.drafts()).every(d=>!d.exists));const snapshot=await f.worker.fast.snapshot();assert.equal(snapshot.summary.privateReady,0);assert.equal(snapshot.jobs[0].state,'held');
});
test('optional original verification still checks fresh employer evidence before model work',async()=>{
 const good=await fixture({original:true});assert.equal((await good.worker.runNotice(good.jobs[0].id)).state,'done');assert.ok(good.state.fetches.includes(good.authored[0].url));
 const bad=await fixture({original:true});bad.authored[0].expiry='2026-10-28';const result=await bad.worker.runNotice(bad.jobs[0].id);assert.ok(result.reason.startsWith('ORIGINAL_NOTICE_'));assert.equal(bad.state.extractions,0);assert.equal(await bad.budget(),null);assert.equal((await bad.worker.fast.snapshot()).jobs[0].blockedBy,'evidence');
});
test('provider daily exhaustion persists through the existing shared Gemini usage tables',async()=>{
 const project='authored-'+randomUUID(),f=await fixture({provider:'gemini',providerProject:project,rpd:1});const result=await f.worker.runNotice(f.jobs[0].id);assert.equal(result.reason,'AI_RATE_LIMITED');assert.equal(f.state.extractions,1);assert.equal(f.state.validations,0);assert.equal((await f.budget()).calls,1);const row=(await f.worker.fast.snapshot()).jobs[0];assert.equal(row.blockedBy,'provider_quota');assert.ok(row.nextAt>f.now());
 const g=await fixture({provider:'gemini',providerProject:project,rpd:1});await g.worker.runNotice(g.jobs[0].id);assert.equal(g.state.extractions,0);assert.equal(await g.budget(),null);
});
test('a provider-labelled budget error cannot impersonate a rejected source reservation',async()=>{
 const f=await fixture();f.state.extractionError=new DomainError('MODEL_BUDGET_EXHAUSTED');const result=await f.worker.runNotice(f.jobs[0].id);assert.equal(result.state,'exception');assert.equal((await f.worker.fast.snapshot()).jobs[0].state,'held');assert.equal((await f.budget()).calls,1);
});
test('legacy pending work and known notice history refuse cutover without modifying their records',async()=>{
 for(const mode of ['queue','draft','hold','public']){
  const f=await fixture(),ref=mode==='queue'?f.worker.fast.ref('worker_queue','authored_legacy_job'):['draft','public'].includes(mode)?f.worker.fast.ref(mode==='draft'?'drafts':'public',hash(f.id+':'+hash(f.jobs[0].url))):f.worker.fast.ref('worker_holds',hash(f.id+':'+f.jobs[0].url));
  const saved=mode==='queue'?{sourceId:f.id}:payload({authoredLegacyMarker:true});await ref.set(saved);const r=await f.worker.runNotice(f.jobs[0].id);assert.ok(['FAST_LEGACY_WORK_PENDING','FAST_NOTICE_HISTORY_REQUIRES_MIGRATION'].includes(r.reason));assert.deepEqual((await ref.get()).data(),saved);assert.equal(f.state.fetches.length,0);assert.equal(f.state.extractions,0);assert.equal(await f.budget(),null);
 }
});
test('pause during a dispatched model request cannot write its cache, candidate or canonical draft',async()=>{
 const f=await fixture();f.state.beforeExtract=async()=>{f.source.paused=true;await f.save();};await assert.rejects(f.worker.runNotice(f.jobs[0].id),{code:'SOURCE_PAUSED'});assert.equal((await f.budget()).calls,1);assert.ok((await f.drafts()).every(d=>!d.exists));assert.equal(f.state.validations,0);
});
test('failed atomic settlement rolls back the draft and completed marker while retaining charged model work',async()=>{
 const f=await fixture(),prepare=f.worker.fast.prepareSettlement.bind(f.worker.fast);f.worker.fast.prepareSettlement=async(...args)=>{const prepared=await prepare(...args);return{commit:outcome=>{prepared.commit(outcome);if(outcome.outcome==='validated_private')throw new DomainError('AUTHORED_SETTLEMENT_FAILURE');}};};
 const result=await f.worker.runNotice(f.jobs[0].id);assert.equal(result.state,'exception');assert.ok((await f.drafts()).every(d=>!d.exists));assert.equal((await f.budget()).calls,2);const snapshot=await f.worker.fast.snapshot();assert.equal(snapshot.summary.privateReady,0);assert.equal(snapshot.jobs[0].state,'held');
});
test('lease expiry before commit rolls back completion; a replacement reuses both model caches',async()=>{
 const f=await fixture(),write=f.worker.catalogue.writePublication.bind(f.worker.catalogue);f.worker.catalogue.writePublication=(...args)=>{write(...args);f.advance(600001);};
 await assert.rejects(f.worker.runNotice(f.jobs[0].id),{code:'STALE_LEASE'});assert.ok((await f.drafts()).every(d=>!d.exists));assert.equal((await f.budget()).calls,2);
 const result=await f.restart().runNotice(f.jobs[0].id);assert.equal(result.state,'done');assert.equal(f.state.extractions,1);assert.equal(f.state.validations,1);assert.equal((await f.budget()).calls,2);assert.equal((await f.worker.fast.snapshot()).summary.privateReady,1);
});
test('pre-existing source spending is shared without renaming, replacing or resetting its counter',async()=>{
 const f=await fixture({calls:2}),budget={sourceId:f.id,date:'2026-10-29',calls:1,retainedMarker:'authored prior reservation'};await f.worker.fast.ref('model_budgets',hash(f.id+':2026-10-29')).set(payload(budget));
 const r=await f.worker.runNotice(f.jobs[0].id);assert.equal(r.reason,'MODEL_BUDGET_EXHAUSTED');assert.equal(f.state.extractions,1);assert.equal(f.state.validations,0);assert.deepEqual(await f.budget(),{...budget,calls:2});assert.equal((await f.worker.fast.snapshot()).jobs[0].blockedBy,'source_budget');
});
test('authority revocation after reservation preserves the charge and fences cache/draft writes',async()=>{
 const f=await fixture({provider:'gemini',authority:true}),ref=f.worker.fast.ref('model_authorities',f.worker.quotaScope),record={version:1,provider:'gemini',scopeHash:f.worker.quotaScope,projectId:db.projectId,epoch:'a'.repeat(64),status:'active',migrationSha256:'b'.repeat(64),quotaSha256:'c'.repeat(64),activatedAt:f.now()};await ref.set(payload(record));
 f.state.beforeExtract=async()=>ref.set(payload({...record,status:'revoked'}));await assert.rejects(f.worker.runNotice(f.jobs[0].id),{code:'GEMINI_QUOTA_AUTHORITY_STALE'});assert.equal(f.state.extractions,1);assert.equal(f.state.validations,0);assert.equal((await f.budget()).calls,1);assert.ok((await f.drafts()).every(d=>!d.exists));
});
