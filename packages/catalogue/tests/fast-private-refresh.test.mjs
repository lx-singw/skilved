import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {getRuntime} from '../src/runtime.mjs';
import {FastRecentJobsWorker} from '../src/fast-recentjobs-worker.mjs';
import {FastNoticeDispatcher} from '../src/fast-notice-dispatcher.mjs';
import {supervisionFixture,hash,payload,value} from './fixtures/fast-supervision.mjs';
import {syntheticExtraction} from './fixtures/recentjobs-model.mjs';
import {fastExecutionId} from '../src/fast-refresh-records.mjs';
import {runFastIngestion} from '../src/fast-ingestion-runtime.mjs';
import {deferred} from './fixtures/fast-supervision.mjs';
import {DomainError} from '../src/config.mjs';
let db;
before(async()=>{process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-private-refresh';db=(await getRuntime()).db;});
after(async()=>{await db?.terminate();});
async function fixture({enabled=true,count=1,calls=20,longDeadline=false,supervised=false}={}){
 const f=await supervisionFixture(db,{count,supervised});
 f.source.automation.checkTtlHours=1;f.source.automation.maxModelCallsPerDay=calls;
 if(longDeadline){for(const n of f.notices)n.detailHtml=n.detailHtml.replaceAll('30 October 2026','30 November 2026');
  f.options.extractor=async()=>{f.state.extractions++;await f.state.beforeExtract?.();const extraction=syntheticExtraction();extraction.deadline.value.localDate='2026-11-30';extraction.deadline.value.originalText=extraction.deadline.value.originalText.replace('October','November');extraction.deadline.quote=extraction.deadline.quote.replace('October','November');return{extraction};};}
 await f.save();const options={...f.options,privateRefresh:enabled};
 const worker=new FastRecentJobsWorker(db,f.worker.principal,options),jobs=(await f.seed()).sort((a,b)=>f.notices.findIndex(n=>n.detailUrl===a.url)-f.notices.findIndex(n=>n.detailUrl===b.url));
 const now=f.clock.now;
 const readWatch=async id=>value(await db.collection('m0_ingestion_refresh_watches').doc(id??jobs[0].id).get());
 const restart=()=>new FastRecentJobsWorker(db,worker.principal,options);
 const job=async()=> (await worker.fast.snapshot()).jobs.find(j=>j.id===jobs[0].id);
 const due=async()=>{const watches=(await Promise.all(jobs.map(j=>readWatch(j.id)))).filter(Boolean);assert.ok(watches.length);f.clock.advance(Math.max(0,...watches.map(w=>Date.parse(w.nextAt)-Date.parse(now()))));};
 return{...f,worker,jobs,restart,readWatch,job,due,now};
}
test('private refresh is opt-in; successful completion registers an atomic TTL watch only when enabled',async()=>{
 const off=await fixture({enabled:false});assert.equal((await off.worker.runNotice(off.jobs[0].id)).state,'done');assert.equal(await off.readWatch(),null);assert.equal((await off.worker.queueRefreshes()).state,'disabled');
 const f=await fixture();assert.equal((await f.worker.runNotice(f.jobs[0].id)).state,'done');const w=await f.readWatch();assert.equal(w.state,'waiting');assert.equal(w.generation,0);
 assert.equal(Date.parse(w.nextAt)-Date.parse(w.updatedAt),3600000);assert.equal((await f.worker.queueRefreshes()).scheduled,0);
});
test('refresh opt-in persists across restarts and old completed work requires reviewed adoption',async()=>{
 const f=await fixture();await f.worker.runNotice(f.jobs[0].id);
 const wrong=new FastRecentJobsWorker(db,f.worker.principal,{...f.options,privateRefresh:false});
 await assert.rejects(wrong.fast.poll(),{code:'FAST_REFRESH_OPT_IN_REQUIRED'});
 const old=await fixture({enabled:false});await old.worker.runNotice(old.jobs[0].id);
 const later=new FastRecentJobsWorker(db,old.worker.principal,{...old.options,privateRefresh:true});
 await assert.rejects(later.queueRefreshes(),{code:'FAST_REFRESH_HISTORY_ADOPTION_REQUIRED'});assert.equal(await old.readWatch(),null);
});
test('first activation refuses live ownership and never resets the retained queue or attempt count',async()=>{
 const f=await fixture({enabled:false}),claim=await f.worker.fast.claimNotice(f.jobs[0].id);
 assert.ok(claim);const before=await f.job(),enabled=new FastRecentJobsWorker(db,f.worker.principal,{...f.options,privateRefresh:true});
 await assert.rejects(enabled.fast.activatePrivateRefresh(),{code:'FAST_REFRESH_ACTIVE_WORK'});assert.deepEqual(await f.job(),before);
 f.clock.advance(30001);assert.equal((await enabled.fast.activatePrivateRefresh()).state,'activated');
 const after=(await enabled.fast.snapshot()).jobs.find(j=>j.id===before.id);assert.deepEqual(after,before);assert.equal(await f.budget(),null);
});
test('due refresh is atomic and restart-safe, keeps old execution/history, reuses caches and preserves first seen',async()=>{
 const f=await fixture();await f.worker.runNotice(f.jobs[0].id);const original=await f.job(),draft=await f.draft(),executionId=fastExecutionId(original),execution=(await db.collection('m0_fast_worker_jobs').doc(executionId).get()).data(),budget=await f.budget();
 for(let generation=1;generation<=3;generation++){
  await f.due();const results=await Promise.all([f.worker.queueRefreshes(),f.restart().queueRefreshes()]);assert.equal(results.reduce((n,r)=>n+r.scheduled,0),1);
  const queued=await f.job();assert.equal(queued.refresh.generation,generation);assert.equal(queued.cycleAttempts,0);assert.equal(queued.firstSeenAt,original.firstSeenAt);
  assert.equal((await f.restart().runNotice(queued.id)).state,'done');
 }
 const end=await f.job(),current=await f.draft();assert.equal(end.attempts,4);assert.equal(end.cycleAttempts,1);assert.equal(current.id,draft.id);assert.equal(current.createdAt,draft.createdAt);assert.equal(current.revision,draft.revision+3);
 assert.equal(f.state.extractions,1);assert.equal(f.state.validations,1);assert.deepEqual(await f.budget(),budget);
 assert.deepEqual((await db.collection('m0_fast_worker_jobs').doc(executionId).get()).data(),execution);
 assert.equal((await db.collection('m0_ingestion_refresh_versions').where('sourceId','==',f.id).get()).size,3);
 const summary=(await f.worker.fast.snapshot()).summary;assert.equal(summary.refreshedPrivateReady,1);assert.equal(summary.latencyEligible,0);assert.equal(summary.p95FirstSeenToPrivateReadyMs,null);
});
test('changed source content uses new model bindings and advances the same canonical draft',async()=>{
 const f=await fixture();await f.worker.runNotice(f.jobs[0].id);const old=await f.draft();await f.due();f.notices[0].detailHtml=f.notices[0].detailHtml.replace('</div></article>','<p>Updated opportunity information.</p></div></article>');
 await f.worker.queueRefreshes();assert.equal((await f.worker.runNotice(f.jobs[0].id)).state,'done');assert.equal(f.state.extractions,2);assert.equal(f.state.validations,2);assert.equal((await f.budget()).calls,4);
 const draft=await f.draft();assert.equal(draft.id,old.id);assert.equal(draft.revision,old.revision+1);
});
test('a refreshed extraction can wait for natural budget reset without losing its cycle or cached stage',async()=>{
 const f=await fixture({calls:3,longDeadline:true});await f.worker.runNotice(f.jobs[0].id);await f.due();f.notices[0].detailHtml=f.notices[0].detailHtml.replace('</div></article>','<p>Updated opportunity information.</p></div></article>');await f.worker.queueRefreshes();
 const pending=await f.worker.runNotice(f.jobs[0].id);assert.equal(pending.reason,'MODEL_BUDGET_EXHAUSTED');const row=await f.job();assert.equal(row.state,'queued');assert.equal(row.refresh.generation,1);assert.equal(row.stage,'validate');const spent=await f.budget();assert.equal(spent.calls,3);
 f.clock.advance(Date.parse(row.nextAt)-Date.parse(f.now()));assert.equal((await f.restart().runNotice(row.id)).state,'done');assert.equal(f.state.extractions,2);assert.equal(f.state.validations,2);assert.deepEqual(await f.budget(),spent);
 assert.equal(JSON.parse((await db.collection('m0_model_budgets').doc(hash(f.id+':2026-10-30')).get()).data().json).calls,1);
});
test('closed fresh evidence stays held without renewing the draft or spending another model call',async()=>{
 const f=await fixture();await f.worker.runNotice(f.jobs[0].id);const draft=await f.draft(),budget=await f.budget();await f.due();f.notices[0].detailHtml=f.notices[0].detailHtml.replace('30 October 2026','28 October 2026');await f.worker.queueRefreshes();
 const result=await f.worker.runNotice(f.jobs[0].id);assert.equal(result.state,'exception');assert.equal((await f.job()).state,'held');assert.deepEqual(await f.draft(),draft);assert.deepEqual(await f.budget(),budget);
 f.clock.advance(7200000);assert.equal((await f.worker.queueRefreshes()).scheduled,0);assert.equal((await f.job()).refresh.generation,1);
});
test('a failed semantic recheck does not gain another generation merely by waiting',async()=>{
 const f=await fixture();await f.worker.runNotice(f.jobs[0].id);const draft=await f.draft();await f.due();f.notices[0].detailHtml=f.notices[0].detailHtml.replace('</div></article>','<p>Updated opportunity information.</p></div></article>');await f.worker.queueRefreshes();
 f.worker.validator=async()=>{f.state.validations++;return{supported:false,issues:[{field:'summary',reason:'Authored mismatch'}],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'}]};};
 assert.equal((await f.worker.runNotice(f.jobs[0].id)).reason,'SEMANTIC_VALIDATION_FAILED');assert.deepEqual(await f.draft(),draft);assert.equal((await f.budget()).calls,4);
 f.clock.advance(3600000);assert.equal((await f.worker.queueRefreshes()).scheduled,0);assert.equal((await f.job()).refresh.generation,1);
});
test('reviewed or manually edited drafts are isolated without dropping other due notices',async()=>{
 const f=await fixture({count:2});for(const j of f.jobs)await f.worker.runNotice(j.id);await f.due();const draft=await f.draft();await db.collection('m0_drafts').doc(draft.id).set(payload({...draft,updatedAt:f.now()}));
 const result=await f.worker.queueRefreshes();assert.equal(result.blocked,1);assert.equal(result.scheduled,1);assert.equal((await f.readWatch()).state,'blocked');
});
test('a draft edit during a refresh fences later effects while retaining admitted charges',async()=>{
 const f=await fixture({supervised:true});await f.worker.runNotice(f.jobs[0].id);await f.due();f.notices[0].detailHtml=f.notices[0].detailHtml.replace('</div></article>','<p>Updated opportunity information.</p></div></article>');await f.worker.queueRefreshes();
 const before=await f.draft();f.state.beforeExtract=async()=>{f.clock.advance(10001);await db.collection('m0_drafts').doc(before.id).set(payload({...before,updatedAt:f.now()}));};
 const result=await f.worker.runNotice(f.jobs[0].id);assert.equal(result.reason,'FAST_REFRESH_BINDING_CHANGED');assert.equal((await f.job()).state,'held');assert.equal((await f.budget()).calls,3);assert.equal(f.state.validations,1);assert.equal((await f.draft()).revision,before.revision);assert.equal(f.clock.timers.size,0);
});
test('three new admissions yield to a ready refresh and the counter survives competing workers',async()=>{
 const f=await fixture({count:4});await f.worker.runNotice(f.jobs[0].id);await f.due();await f.worker.queueRefreshes();
 const dispatcher=new FastNoticeDispatcher(f.worker,{enabled:true});const first=await dispatcher.tick();assert.equal(first.selected,2);assert.equal(first.state,'settled',JSON.stringify(first));assert.equal((await f.worker.fast.dispatchSnapshot()).newSinceRefresh,3,JSON.stringify(first));
 const newJob=(await f.worker.fast.snapshot()).jobs.find(j=>j.state==='queued'&&!j.refresh);assert.equal(await f.worker.fast.claimNotice(newJob.id),null);
 const next=await dispatcher.tick();assert.equal(next.selected,1);assert.equal((await f.worker.fast.dispatchSnapshot()).newSinceRefresh,0);
 assert.equal((await dispatcher.tick()).selected,1);
});
test('refresh follows the committed deadline boundary rather than extending the source TTL past closure',async()=>{
 const f=await fixture();f.source.automation.checkTtlHours=24;await f.save();assert.equal((await f.worker.runNotice(f.jobs[0].id)).state,'done');
 assert.equal((await f.readWatch()).nextAt,'2026-10-29T22:00:00.000Z');
});
test('failed watch registration rolls back the draft and completion together while calls stay charged',async()=>{
 const f=await fixture(),prepare=f.worker.fast.prepareRefreshWatch.bind(f.worker.fast);
 f.worker.fast.prepareRefreshWatch=async(...args)=>{const commit=await prepare(...args);return(...values)=>{commit(...values);throw new DomainError('AUTHORED_WATCH_FAILURE');};};
 const result=await f.worker.runNotice(f.jobs[0].id);assert.equal(result.state,'exception');assert.equal(await f.draft(),null);assert.equal(await f.readWatch(),null);assert.equal((await f.budget()).calls,2);assert.equal((await f.job()).state,'held');
});
test('expired refresh leases recover the same cycle with cached work and retained old executions',async()=>{
 const f=await fixture();await f.worker.runNotice(f.jobs[0].id);const old=await f.draft();await f.due();await f.worker.queueRefreshes();
 const write=f.worker.catalogue.writePublication.bind(f.worker.catalogue);f.worker.catalogue.writePublication=(...args)=>{write(...args);f.clock.advance(30001);};
 await assert.rejects(f.worker.runNotice(f.jobs[0].id),{code:'STALE_LEASE'});assert.deepEqual(await f.draft(),old);
 assert.equal((await f.restart().runNotice(f.jobs[0].id)).state,'done');const row=await f.job();assert.equal(row.refresh.generation,1);assert.equal(row.cycleAttempts,2);assert.equal((await f.budget()).calls,2);
});
test('historical rows cannot acquire a refresh generation even with a plausible waiting watch',async()=>{
 const f=await fixture();await f.worker.runNotice(f.jobs[0].id);await f.due();const jobRef=db.collection('m0_ingestion_jobs').doc(f.jobs[0].id),noticeRef=db.collection('m0_ingestion_notices').doc(f.jobs[0].id),watchRef=db.collection('m0_ingestion_refresh_watches').doc(f.jobs[0].id);
 const jobData=(await jobRef.get()).data(),noticeData=(await noticeRef.get()).data(),watchData=(await watchRef.get()).data(),history={inventorySha256:'a'.repeat(64),firstSeenBasis:'legacy_observation_bound',sloEligible:false};
 const rawJob=JSON.parse(jobData.json);rawJob.history=history;const json=JSON.stringify(rawJob);
 await jobRef.set({...jobData,json});await noticeRef.set({...noticeData,json:JSON.stringify({...JSON.parse(noticeData.json),history})});
 await watchRef.set({...watchData,json:JSON.stringify({...JSON.parse(watchData.json),jobSha256:hash(json)})});
 const result=await f.worker.queueRefreshes();assert.equal(result.scheduled,0);assert.equal(result.blocked,1);assert.equal((await f.job()).history.sloEligible,false);assert.equal((await f.job()).refresh,undefined);assert.equal((await f.budget()).calls,2);
});
test('runtime restart automatically queues and dispatches due private refreshes without new model calls',async()=>{
 const f=await fixture({supervised:true}),empty=deferred();f.state.beforeFetch=async url=>{if(url===f.source.urls[0])await empty.promise;};
 // Seeded initial work lets dispatch release discovery without a wall-clock wait.
 const first=await runFastIngestion({worker:f.worker,enabled:true,maxTicks:1,wait:f.clock.wait,monotonic:f.clock.monotonic,onEvent:e=>{if(e.type==='refresh')empty.resolve();}});
 assert.equal(first.publiclyVisible,false);assert.equal((await f.draft()).revision,1);await f.due();f.state.beforeFetch=null;
 const events=[];await runFastIngestion({worker:f.restart(),enabled:true,maxTicks:1,wait:f.clock.wait,monotonic:f.clock.monotonic,onEvent:e=>events.push(e)});
 assert.ok(events.some(e=>e.type==='refresh'&&e.scheduled===1));assert.equal((await f.draft()).revision,2);assert.equal(f.state.extractions,1);assert.equal(f.state.validations,1);assert.equal(f.clock.timers.size,0);
});
test('a failed refresh query preflight prevents discovery and model work',async()=>{
 const f=await fixture({supervised:true});f.worker.queueRefreshes=async()=>{throw new DomainError('AUTHORED_INDEX_UNAVAILABLE');};
 await assert.rejects(runFastIngestion({worker:f.worker,enabled:true,maxTicks:1}),{code:'AUTHORED_INDEX_UNAVAILABLE'});assert.equal(f.state.fetches.length,0);assert.equal(f.state.extractions,0);
});
