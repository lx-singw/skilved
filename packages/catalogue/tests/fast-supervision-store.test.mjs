import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate as turn} from 'node:timers/promises';
import {getRuntime} from '../src/runtime.mjs';
import {FastRecentJobsDiscovery} from '../src/fast-recentjobs-discovery.mjs';
import {FastNoticeDispatcher} from '../src/fast-notice-dispatcher.mjs';
import {DomainError} from '../src/config.mjs';
import {supervisionFixture,deferred,hash,payload,value} from './fixtures/fast-supervision.mjs';
let db;
before(async()=>{process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-fast-supervision';db=(await getRuntime()).db;});
after(async()=>{await db?.terminate();});
function watchRenew(target,name) {
  const original=target[name].bind(target),waiters=[];target[name]=async(...args)=>{
    try{const result=await original(...args);waiters.shift()?.resolve({result});return result;}
    catch(error){waiters.shift()?.resolve({error});throw error;}
  };
  return async clock=>{const next=deferred();waiters.push(next);clock.advance(10000);const r=await next.promise;await turn();return r;};
}
async function seedJobs(f,count,state) {
  const rows=[];
  for(let i=0;i<count;i++){
    const url=`https://recentjobs.co.za/2026/10/28/authored-retained-${i}/`,id=hash(f.id+':'+url),at=f.clock.now();
    const job={id,sourceId:f.id,sourceRevision:1,url,firstSeenAt:at,updatedAt:at,stage:state==='complete'?'complete':'fetch',state,nextAt:at,attempts:0,lease:null,leaseUntil:null,principal:null,fetchReservation:null,
      timeline:state==='complete'?{startedAt:at,retrievedAt:at,extractedAt:at,privateReadyAt:at}:{},...(state==='complete'?{outcome:'validated_private'}:{})};
    rows.push([f.worker.fast.ref('ingestion_jobs',id),{...payload(job),sourceId:f.id,state,nextAt:at,firstSeenAt:at}],
      [f.worker.fast.ref('ingestion_notices',id),{...payload({id,sourceId:f.id,url,firstSeenAt:at,firstPollId:hash('authored-old-poll')}),sourceId:f.id,firstSeenAt:at}]);
  }
  for(let offset=0;offset<rows.length;offset+=400){const batch=db.batch();rows.slice(offset,offset+400).forEach(([ref,data])=>batch.set(ref,data));await batch.commit();}
  return rows;
}
test('long model work atomically renews coordinator, slot and compatibility leases past the original expiry',async()=>{
  const f=await supervisionFixture(db),[job]=await f.seed(),started=deferred(),release=deferred();f.state.beforeExtract=async()=>{started.resolve();await release.promise;};
  const pulse=watchRenew(f.worker,'renewExecution'),run=f.worker.runNotice(job.id);await started.promise;
  const original=value(await f.worker.fast.ref('ingestion_jobs',job.id).get()).leaseUntil;
  for(let i=0;i<4;i++){const heartbeat=await pulse(f.clock);assert.equal(heartbeat.error,undefined);}
  const fast=value(await f.worker.fast.ref('ingestion_jobs',job.id).get()),executionId=hash('fast-single:'+job.id+':1'),compat=value(await f.worker.fast.ref('fast_worker_jobs',executionId).get()),lease=value(await f.worker.fast.ref('fast_worker_leases',executionId).get()),slots=value(await f.worker.fast.ref('ingestion_slots',f.id).get());
  assert.ok(f.clock.now()>original);assert.equal(fast.leaseUntil,compat.leaseUntil);assert.equal(lease.until,fast.leaseUntil);assert.equal(slots.active[job.id].until,fast.leaseUntil);
  release.resolve();assert.equal((await run).state,'done');assert.equal((await f.budget()).calls,2);assert.equal((await f.draft()).publication.approved,false);assert.equal(f.clock.timers.size,0);
});
test('a slow listing response renews its poll and commits a real queued receipt after the original expiry',async()=>{
  const f=await supervisionFixture(db),started=deferred(),release=deferred();f.state.beforeFetch=async url=>{if(url===f.source.urls[0]){started.resolve();await release.promise;}};
  const pulse=watchRenew(f.worker.fast,'renew'),run=new FastRecentJobsDiscovery(f.worker,{enabled:true}).poll();await started.promise;
  for(let i=0;i<4;i++)assert.equal((await pulse(f.clock)).error,undefined);
  release.resolve();const result=await run;assert.equal(result.state,'complete');assert.equal(result.queued,1);assert.equal((await f.worker.fast.dispatchSnapshot()).jobs[0].firstSeenAt,f.clock.now());assert.equal(await f.budget(),null);assert.equal(f.clock.timers.size,0);
});
test('a failed atomic renewal rolls back every lease and fences the pending model response without refunding it',async()=>{
  const f=await supervisionFixture(db),[job]=await f.seed(),started=deferred(),release=deferred();f.state.beforeExtract=async()=>{started.resolve();await release.promise;};
  const prepare=f.worker.fast.prepareRenewal.bind(f.worker.fast);f.worker.fast.prepareRenewal=async(...args)=>{const r=await prepare(...args);return{...r,commit:()=>{r.commit();throw new DomainError('AUTHORED_RENEWAL_ROLLBACK');}};};
  const pulse=watchRenew(f.worker,'renewExecution'),run=f.worker.runNotice(job.id);await started.promise;
  const executionId=hash('fast-single:'+job.id+':1'),refs=[f.worker.fast.ref('ingestion_jobs',job.id),f.worker.fast.ref('ingestion_slots',f.id),f.worker.fast.ref('fast_worker_jobs',executionId),f.worker.fast.ref('fast_worker_leases',executionId)],before=await Promise.all(refs.map(r=>r.get().then(s=>s.data())));
  assert.equal((await pulse(f.clock)).error.code,'AUTHORED_RENEWAL_ROLLBACK');assert.deepEqual(await Promise.all(refs.map(r=>r.get().then(s=>s.data()))),before);
  release.resolve();await assert.rejects(run,{code:'AUTHORED_RENEWAL_ROLLBACK'});assert.equal((await f.budget()).calls,1);assert.equal(f.state.validations,0);assert.equal(await f.draft(),null);assert.equal(f.clock.timers.size,0);
});
test('revocation during a model request stops renewal and prevents later cache or draft effects',async()=>{
  const f=await supervisionFixture(db),[job]=await f.seed(),started=deferred(),release=deferred();f.state.beforeExtract=async()=>{started.resolve();await release.promise;};
  const pulse=watchRenew(f.worker,'renewExecution'),run=f.worker.runNotice(job.id);await started.promise;const caches=(await db.collection('m0_model_cache').get()).size;
  await f.worker.fast.ref('workers',f.worker.actor).update({active:false});assert.equal((await pulse(f.clock)).error.code,'WORKER_FORBIDDEN');release.resolve();await assert.rejects(run,{code:'WORKER_FORBIDDEN'});
  assert.equal((await f.budget()).calls,1);assert.equal((await db.collection('m0_model_cache').get()).size,caches);assert.equal(await f.draft(),null);assert.equal(f.clock.timers.size,0);
});
test('a renewal whose old lease expires during preparation cannot resurrect either ownership record',async()=>{
  const f=await supervisionFixture(db),[job]=await f.seed(),started=deferred(),release=deferred();f.state.beforeExtract=async()=>{started.resolve();await release.promise;};
  const prepare=f.worker.fast.prepareRenewal.bind(f.worker.fast);f.worker.fast.prepareRenewal=async(...args)=>{const r=await prepare(...args);return{...r,commit:()=>{f.clock.advance(30001);r.commit();}};};
  const pulse=watchRenew(f.worker,'renewExecution'),run=f.worker.runNotice(job.id);await started.promise;const original=value(await f.worker.fast.ref('ingestion_jobs',job.id).get()).leaseUntil;
  assert.equal((await pulse(f.clock)).error.code,'STALE_LEASE');release.resolve();await assert.rejects(run,{code:'STALE_LEASE'});assert.equal(value(await f.worker.fast.ref('ingestion_jobs',job.id).get()).leaseUntil,original);assert.equal(value(await f.worker.fast.ref('fast_worker_jobs',hash('fast-single:'+job.id+':1')).get()).leaseUntil,original);assert.equal(await f.draft(),null);assert.equal((await f.budget()).calls,1);assert.equal(f.clock.timers.size,0);
});
test('the per-execution time bound prevents indefinite renewal and fences a late model answer',async()=>{
  const f=await supervisionFixture(db,{maxRunMs:15000}),[job]=await f.seed(),started=deferred(),release=deferred();f.state.beforeExtract=async()=>{started.resolve();await release.promise;};
  const run=f.worker.runNotice(job.id);await started.promise;f.clock.advance(15000);await turn();release.resolve();await assert.rejects(run,{code:'FAST_LEASE_RUNTIME_LIMIT'});
  assert.equal((await f.budget()).calls,1);assert.equal(f.state.validations,0);assert.equal(await f.draft(),null);assert.equal(f.clock.timers.size,0);
});
test('retained completed history beyond 500 rows does not fill the active queue or get deleted by dispatch',async()=>{
  const f=await supervisionFixture(db),retained=await seedJobs(f,501,'complete'),marker=await retained[0][0].get();
  const discovered=await new FastRecentJobsDiscovery(f.worker,{enabled:true}).poll();assert.equal(discovered.queued,1);assert.equal((await f.worker.fast.dispatchSnapshot()).jobs.length,1);
  const result=await new FastNoticeDispatcher(f.worker,{enabled:true}).tick();assert.equal(result.results[0].state,'done');assert.equal((await f.worker.fast.dispatchSnapshot()).jobs.length,0);assert.deepEqual((await retained[0][0].get()).data(),marker.data());
  await assert.rejects(f.worker.fast.snapshot(),{code:'FAST_INGESTION_QUEUE_CAPACITY'});assert.equal((await f.budget()).calls,2);
});
test('concurrent admission at the active capacity boundary commits one chunk and preserves the other for retry',async()=>{
  const f=await supervisionFixture(db,{count:2}),retained=await seedJobs(f,499,'queued'),poll=await f.worker.fast.poll();
  const results=await Promise.allSettled(f.notices.map(n=>f.worker.fast.recordDiscovery(poll.claim,[n.detailUrl],{complete:false})));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.code,'FAST_INGESTION_QUEUE_CAPACITY');assert.equal((await f.worker.fast.dispatchSnapshot()).jobs.length,500);
  const blocked=f.notices[results.findIndex(r=>r.status==='rejected')];assert.equal((await f.worker.fast.ref('ingestion_notices',hash(f.id+':'+blocked.detailUrl)).get()).exists,false);
  const ref=retained[0][0],held={...value(await ref.get()),state:'held',blockedBy:'evidence'};await ref.set({...payload(held),sourceId:f.id,state:'held',nextAt:held.nextAt,firstSeenAt:held.firstSeenAt});
  const retry=await f.worker.fast.recordDiscovery(poll.claim,[blocked.detailUrl],{complete:true});assert.equal(retry.queued,1);assert.equal((await f.worker.fast.dispatchSnapshot()).jobs.length,500);assert.equal(await f.budget(),null);
});
