import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {FastNoticeDispatcher} from '../src/fast-notice-dispatcher.mjs';
import {FastRecentJobsWorker} from '../src/fast-recentjobs-worker.mjs';
import {getRuntime} from '../src/runtime.mjs';
import {originalFixture} from './fixtures/original-notices.mjs';
import {syntheticExtraction} from './fixtures/recentjobs-model.mjs';

const hash=s=>createHash('sha256').update(s).digest('hex'),payload=v=>({json:JSON.stringify(v)}),value=s=>s.exists?JSON.parse(s.data().json):null;
let db;
before(async()=>{process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-fast-dispatch';db=(await getRuntime()).db;});
after(async()=>{await db?.terminate();});

async function fixture({count=2,slots=2,calls=20,stagger=false,closesAtReset=false}={}) {
  let at='2026-10-29T10:00:00.000Z';
  const id='dispatch_'+randomUUID(),principal=randomUUID()+'@example.test';
  const authored=Array.from({length:count},(_,i)=>originalFixture({slug:'authored-dispatch-'+i,path:'/tenant-a/job/'+(400+i)+'/',reference:null}));
  const source=structuredClone(authored[0].source);source.id=id;source.automation.employerCrawl=false;delete source.automation.originalVerification;
  source.automation.maxModelCallsPerDay=calls;source.automation.fastIngestion={version:'shadow_v1',discoveryIntervalMs:120000,maxConcurrentJobs:slots,leaseMs:600000};
  const state={fetches:0,extractions:0,validations:0,supported:true,beforeExtract:null};
  const worker=new FastRecentJobsWorker(db,principal,{enabled:true,sourceId:id,sourceRevision:1,provider:'groq',now:()=>at,
    sleep:async ms=>{at=new Date(Date.parse(at)+ms).toISOString();},
    fetcher:async(_source,url)=>{state.fetches++;if(url.endsWith('/robots.txt'))return{url,text:'User-agent: *\nAllow: /'};const notice=authored.find(a=>a.detailUrl===url);assert.ok(notice,'Only authored source requests');return{url,text:closesAtReset?notice.detailHtml:notice.detailHtml.replaceAll('30 October 2026','30 November 2026')};},
    extractor:async()=>{state.extractions++;await state.beforeExtract?.();const extraction=syntheticExtraction();if(!closesAtReset)extraction.deadline={state:'stated',value:{kind:'date',originalText:'Closing date: 30 November 2026',localDate:'2026-11-30',localTime:null,timezone:null,utcInstant:null},quote:'Closing date: 30 November 2026'};return{extraction};},
    validator:async()=>{state.validations++;return{supported:state.supported,issues:state.supported?[]:[{field:'requirements',reason:'Authored mismatch'}],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'}]};}});
  await worker.fast.ref('sources',id).set(payload(source));await worker.fast.ref('workers',worker.actor).set({principal,active:true,sources:[id],roles:['ingest']});
  let poll=await worker.fast.poll();await worker.fast.recordDiscovery(poll.claim,authored.slice(0,stagger?1:count).map(a=>a.detailUrl));
  if(stagger){at=new Date(Date.parse(at)+120000).toISOString();poll=await worker.fast.poll();await worker.fast.recordDiscovery(poll.claim,authored.map(a=>a.detailUrl));}
  const snapshot=()=>worker.fast.snapshot();
  return{worker,source,state,id,authored,snapshot,dispatcher:new FastNoticeDispatcher(worker,{enabled:true}),
    advance:ms=>{at=new Date(Date.parse(at)+ms).toISOString();},now:()=>at,
    budget:async day=>value(await worker.fast.ref('model_budgets',hash(id+':'+(day??'2026-10-29'))).get()),
    drafts:async()=>Promise.all(authored.map(a=>worker.fast.ref('drafts',hash(id+':'+hash(a.detailUrl))).get())),
    save:()=>worker.fast.ref('sources',id).set(payload(source))};
}

test('dispatch requires explicit enablement, a real fast worker and a bounded batch',async()=>{
  assert.throws(()=>new FastNoticeDispatcher(null),{code:'FAST_INGESTION_DISABLED'});
  assert.throws(()=>new FastNoticeDispatcher({runNotice(){}},{enabled:true}),{code:'FAST_DISPATCH_WORKER_REQUIRED'});
  const f=await fixture();for(const maxJobs of [0,21,1.5,NaN])await assert.rejects(f.dispatcher.tick({maxJobs}),{code:'FAST_DISPATCH_CONFIGURATION_REQUIRED'});
  await assert.rejects(f.dispatcher.tick({signal:{aborted:false}}),{code:'FAST_DISPATCH_CONFIGURATION_REQUIRED'});
  assert.equal(f.state.fetches,0);assert.equal(await f.budget(),null);
});
test('one bounded batch makes canonical private drafts within concurrency; the next tick drains remaining due work',async()=>{
  const f=await fixture({count:3}),before=(await f.snapshot()).jobs;
  const first=await f.dispatcher.tick();assert.equal(first.selected,2);assert.ok(first.results.every(r=>r.state==='done'));assert.equal((await f.snapshot()).summary.privateReady,2);
  const second=await f.dispatcher.tick();assert.equal(second.selected,1);assert.equal(second.results[0].state,'done');assert.equal(f.state.extractions,3);assert.equal(f.state.validations,3);assert.equal((await f.budget()).calls,6);
  assert.ok((await f.drafts()).every(s=>value(s).publication.approved===false));
  assert.deepEqual((await f.snapshot()).jobs.map(j=>j.firstSeenAt),before.map(j=>j.firstSeenAt));assert.equal((await db.collection('m0_public').get()).size,0);
});
test('batch cap selects the oldest actual observation before newer notices',async()=>{
  const f=await fixture({count:3,stagger:true}),r=await f.dispatcher.tick({maxJobs:1});assert.equal(r.selected,1);
  const jobs=(await f.snapshot()).jobs,completed=jobs.find(j=>j.state==='complete');assert.equal(completed.url,f.authored[0].detailUrl);assert.ok(jobs.filter(j=>j.state==='queued').every(j=>j.firstSeenAt>completed.firstSeenAt));
});
test('an unexpired owner occupies a slot; expiry recovers that notice without stealing its live lease',async()=>{
  const f=await fixture(),job=(await f.snapshot()).jobs[0],claim=await f.worker.fast.claimNotice(job.id);
  const r=await f.dispatcher.tick();assert.equal(r.activeAtSelection,1);assert.equal(r.selected,1);assert.notEqual(r.results[0].id,claim.id);
  assert.equal((await f.snapshot()).jobs.find(j=>j.id===claim.id).lease,claim.lease);
  f.advance(600000);const recovered=await f.dispatcher.tick();assert.equal(recovered.selected,1);assert.equal(recovered.results[0].id,claim.id);assert.equal(recovered.results[0].state,'done');
});
test('competing dispatchers share atomic ownership and never duplicate model work or drafts',async()=>{
  const f=await fixture(),other=new FastNoticeDispatcher(f.worker,{enabled:true});
  const results=await Promise.all([f.dispatcher.tick(),other.tick()]);assert.equal(results.flatMap(r=>r.results).filter(r=>r.state==='done').length,2);
  assert.equal(f.state.extractions,2);assert.equal(f.state.validations,2);assert.equal((await f.budget()).calls,4);assert.ok((await f.drafts()).every(s=>s.exists));
});
test('independent semantic failure remains held with charged work and no canonical draft',async()=>{
  const f=await fixture();f.state.supported=false;const r=await f.dispatcher.tick();assert.ok(r.results.every(row=>row.reason==='SEMANTIC_VALIDATION_FAILED'));
  assert.ok((await f.snapshot()).jobs.every(j=>j.state==='held'));assert.ok((await f.drafts()).every(s=>!s.exists));assert.equal((await f.budget()).calls,4);
  assert.equal((await f.dispatcher.tick()).selected,0);
});
test('source exhaustion waits until the recorded reset and resumes cached extraction without resetting old spend',async()=>{
  const f=await fixture({calls:2});let arrived=0,release;const gate=new Promise(resolve=>{release=resolve;});f.state.beforeExtract=async()=>{if(++arrived===2)release();await gate;};
  await f.dispatcher.tick();const budget=await f.budget(),waiting=(await f.snapshot()).jobs;assert.ok(waiting.every(j=>j.state==='queued'&&j.blockedBy==='source_budget'));
  assert.equal((await f.dispatcher.tick()).selected,0);assert.equal(f.state.extractions,2);assert.equal(f.state.validations,0);
  f.advance(Date.parse(waiting[0].nextAt)-Date.parse(f.now()));const resumed=await f.dispatcher.tick();assert.ok(resumed.results.every(r=>r.state==='done'),JSON.stringify(resumed));assert.equal(f.state.extractions,2);assert.equal(f.state.validations,2);assert.deepEqual(await f.budget(),budget);assert.equal((await f.budget('2026-10-30')).calls,2);
});
test('even accidentally queued imported history and old-revision jobs receive no dispatch',async()=>{
  const f=await fixture(),jobs=(await f.snapshot()).jobs,history={inventorySha256:'a'.repeat(64),firstSeenBasis:'legacy_observation_bound',sloEligible:false};
  const historical={...jobs[0],history};await f.worker.fast.ref('ingestion_jobs',historical.id).set({...payload(historical),sourceId:f.id,state:historical.state,nextAt:historical.nextAt,firstSeenAt:historical.firstSeenAt});
  const old={...jobs[1],sourceRevision:2};await f.worker.fast.ref('ingestion_jobs',old.id).set({...payload(old),sourceId:f.id,state:old.state,nextAt:old.nextAt,firstSeenAt:old.firstSeenAt});
  const r=await f.dispatcher.tick();assert.equal(r.selected,0);assert.equal(r.historicalRowsSkipped,1);assert.equal(r.revisionRowsSkipped,1);assert.equal(f.state.fetches,0);assert.equal(await f.budget(),null);
});
test('a notice that closes while waiting is rejected at reset before further model work',async()=>{
  const f=await fixture({count:1,calls:1,closesAtReset:true});await f.dispatcher.tick();const before=await f.budget(),job=(await f.snapshot()).jobs[0];assert.equal(job.blockedBy,'source_budget');
  f.advance(Date.parse(job.nextAt)-Date.parse(f.now()));const r=await f.dispatcher.tick();assert.equal(r.results[0].reason,'NOTICE_NOT_OPEN');assert.equal((await f.snapshot()).jobs[0].state,'held');
  assert.equal(f.state.extractions,1);assert.equal(f.state.validations,0);assert.deepEqual(await f.budget(),before);assert.equal(await f.budget('2026-10-30'),null);assert.ok((await f.drafts()).every(s=>!s.exists));
});
test('pause after selection is rechecked by claims and prevents fetch/model work',async()=>{
  const f=await fixture(),snapshot=f.worker.fast.snapshot.bind(f.worker.fast);f.worker.fast.snapshot=async()=>{const s=await snapshot();f.source.paused=true;await f.save();return s;};
  const r=await f.dispatcher.tick();assert.equal(r.state,'partial_failure');assert.ok(r.results.every(row=>row.reason==='SOURCE_PAUSED'));assert.equal(f.state.fetches,0);assert.equal(await f.budget(),null);
});
test('a rejected execution does not abandon its sibling or expose private error text',async()=>{
  const f=await fixture(),jobs=(await f.snapshot()).jobs.sort((a,b)=>a.id.localeCompare(b.id)),run=f.worker.runNotice.bind(f.worker);
  f.worker.runNotice=async id=>{if(id===jobs[0].id)throw Object.assign(new Error('PRIVATE_NOTICE_AND_PROVIDER_RESPONSE'),{code:'https://private.example/answer'});return run(id);};
  const r=await f.dispatcher.tick();assert.equal(r.state,'partial_failure');assert.equal(r.results.filter(row=>row.state==='done').length,1);assert.equal(r.results.find(row=>row.state==='failed').reason,'FAST_DISPATCH_EXECUTION_FAILED');assert.doesNotMatch(JSON.stringify(r),/PRIVATE_NOTICE|private\.example/);assert.equal((await f.snapshot()).summary.privateReady,1);
  f.worker.runNotice=async()=>undefined;const invalid=await f.dispatcher.tick();assert.equal(invalid.state,'partial_failure');assert.equal(invalid.results[0].reason,'FAST_DISPATCH_RESULT_INVALID');assert.equal(f.state.extractions,1);
});
test('stop signals prevent new admissions before and after a selection read',async()=>{
  const f=await fixture(),first=new AbortController();first.abort();assert.equal((await f.dispatcher.tick({signal:first.signal})).state,'stopped');
  const second=new AbortController(),snapshot=f.worker.fast.snapshot.bind(f.worker.fast);f.worker.fast.snapshot=async()=>{const s=await snapshot();second.abort();return s;};
  const r=await f.dispatcher.tick({signal:second.signal});assert.equal(r.state,'stopped');assert.ok(r.results.every(row=>row.state==='stopped'));assert.equal(f.state.fetches,0);assert.equal(await f.budget(),null);
});
