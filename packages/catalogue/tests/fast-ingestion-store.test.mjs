import{test,before,after}from'node:test';import assert from'node:assert/strict';import{randomUUID,createHash}from'node:crypto';
import{FastIngestionStore,parseFastIngestionSource,summarizeFastIngestion}from'../src/fast-ingestion-store.mjs';import{Source}from'../src/schemas.mjs';import{getRuntime}from'../src/runtime.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex'),payload=v=>({json:JSON.stringify(v)}),value=s=>s.exists?JSON.parse(s.data().json):null;
let db;before(async()=>{process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-fast-store';db=(await getRuntime()).db;});after(async()=>{await db?.terminate();});
async function fixture({slots=2,leaseMs=60000}={}){
 let at='2026-11-04T08:00:00.000Z';const id='fast_'+randomUUID(),principal=randomUUID()+'@example.test';
 const source={id,revision:1,name:'Authored fast source',urls:['https://recentjobs.co.za/category/apprenticeships/'],permission:{reference:'Authored test permission',method:'recentjobs_html',reuse:'Synthetic only',reviewedAt:at},categories:['apprenticeship'],owner:'fixture_owner',paused:false,cadenceHours:24,maxBytes:500000,
  automation:{mode:'shadow',employerCrawl:false,qualificationRef:'Authored coordinator only',maxArticles:10,maxModelCallsPerDay:2,minRequestIntervalMs:3000,checkTtlHours:24,issuers:[],fastIngestion:{version:'shadow_v1',discoveryIntervalMs:120000,maxConcurrentJobs:slots,leaseMs}}};
 const options={enabled:true,sourceId:id,sourceRevision:1,now:()=>at};const store=new FastIngestionStore(db,principal,options);
 await store.ref('sources',id).set(payload(source));await store.ref('workers',store.actor).set({principal,active:true,sources:[id],roles:['ingest']});
 const budgetRef=store.ref('model_budgets',hash(id+':2026-11-04')),budget={sourceId:id,date:'2026-11-04',calls:2};await budgetRef.set(payload(budget));
 const restart=()=>new FastIngestionStore(db,principal,options);
 const discover=async(n=3)=>{const poll=await restart().poll();assert.equal(poll.state,'ready');const urls=Array.from({length:n},(_,i)=>`https://recentjobs.co.za/2026/11/04/authored-${i}/`);await restart().recordDiscovery(poll.claim,urls);const rows=await db.collection('m0_ingestion_jobs').where('sourceId','==',id).get();return rows.docs.map(d=>value(d)).sort((a,b)=>a.url.localeCompare(b.url));};
 return{store,source,id,principal,options,restart,now:()=>at,advance:ms=>{at=new Date(Date.parse(at)+ms).toISOString();},discover,budget,budgetRef,save:()=>store.ref('sources',id).set(payload(source))};
}
test('coordinator is default-off and its shared source policy stays explicit and shadow-only',async()=>{
 assert.throws(()=>new FastIngestionStore(null,'caller@example.test'),{code:'FAST_INGESTION_DISABLED'});
 const f=await fixture();assert.equal(Source.safeParse(f.source).success,true);assert.equal(parseFastIngestionSource(f.source).automation.fastIngestion.discoveryIntervalMs,120000);
 for(const mode of ['automatic','disabled'])assert.throws(()=>parseFastIngestionSource({...f.source,automation:{...f.source.automation,mode}}));
 for(const change of [{discoveryIntervalMs:119999},{maxConcurrentJobs:21},{leaseMs:1},{version:'automatic'}])assert.throws(()=>parseFastIngestionSource({...f.source,automation:{...f.source.automation,fastIngestion:{...f.source.automation.fastIngestion,...change}}}));
});
test('concurrent schedulers claim one poll and schedule the next at the exact two-minute boundary',async()=>{
 const f=await fixture(),polls=await Promise.all(Array.from({length:5},()=>f.restart().poll()));assert.equal(polls.filter(p=>p.state==='ready').length,1);
 await f.store.recordDiscovery(polls.find(p=>p.state==='ready').claim,[]);assert.equal((await f.restart().poll()).state,'waiting');f.advance(119999);assert.equal((await f.restart().poll()).state,'waiting');f.advance(1);const next=await f.restart().poll();assert.equal(next.state,'ready');assert.notEqual(next.claim.id,polls.find(p=>p.state==='ready').claim.id);
 assert.deepEqual(value(await f.budgetRef.get()),f.budget);
});
test('expired poll ownership is recovered after restart and stale owners cannot record discovery',async()=>{
 const f=await fixture(),old=(await f.store.poll()).claim;f.advance(60000);const next=(await f.restart().poll()).claim;assert.equal(old.id,next.id);assert.notEqual(old.lease,next.lease);
 await assert.rejects(f.store.recordDiscovery(old,[]),{code:'STALE_LEASE'});await f.restart().recordDiscovery(next,[]);
});
test('rediscovery deduplicates notice jobs and preserves first seen through process restarts',async()=>{
 const f=await fixture(),first=await f.discover(2);f.advance(120000);const second=await f.discover(3);assert.equal(second.length,3);
 for(let i=0;i<2;i++){assert.equal(second[i].id,first[i].id);assert.equal(second[i].firstSeenAt,first[i].firstSeenAt);assert.equal(second[i].attempts,0);}
 assert.equal(second[2].firstSeenAt,f.now());assert.deepEqual(value(await f.budgetRef.get()),f.budget);
});
test('per-notice claims enforce the source concurrency bound without a global processing lock',async()=>{
 const f=await fixture(),jobs=await f.discover(),claims=await Promise.all(jobs.map(j=>f.restart().claimNotice(j.id)));assert.equal(claims.filter(Boolean).length,2);const first=claims.find(Boolean);
 assert.equal(await f.restart().claimNotice(first.id),null);f.advance(100);await f.store.checkpoint(first,'retrieved');f.advance(100);await f.store.checkpoint(first,'extracted');f.advance(100);const result=await f.store.checkpoint(first,'validated_private');assert.equal(result.firstSeenToPrivateReadyMs,300);assert.equal(result.publiclyVisible,false);
 const waiting=jobs[claims.findIndex(c=>c===null)];assert.ok(await f.restart().claimNotice(waiting.id));assert.deepEqual(value(await f.budgetRef.get()),f.budget);
 assert.equal((await db.collection('m0_public').get()).size,0);assert.equal((await db.collection('m0_drafts').get()).size,0);
});
test('parallel fetch reservations share source pacing, are idempotent, and reject early or replayed turns',async()=>{
 const f=await fixture({slots:3}),jobs=await f.discover(),claims=await Promise.all(jobs.map(j=>f.store.claimNotice(j.id))),reservations=await Promise.all(claims.map(c=>f.restart().reserveFetch(c)));
 const paired=claims.map((c,i)=>({claim:c,reservation:reservations[i]})).sort((a,b)=>a.reservation.at.localeCompare(b.reservation.at));assert.deepEqual(paired.map(p=>Date.parse(p.reservation.at)-Date.parse(f.now())),[0,3000,6000]);
 assert.deepEqual(await f.restart().reserveFetch(paired[0].claim),paired[0].reservation);await assert.rejects(f.store.admitFetch(paired[1].claim,paired[1].reservation),{code:'FETCH_RESERVATION_INVALID'});
 assert.equal((await f.store.admitFetch(paired[0].claim,paired[0].reservation)).networkPermissionRequired,true);await assert.rejects(f.store.admitFetch(paired[0].claim,paired[0].reservation),{code:'FETCH_RESERVATION_INVALID'});
 f.advance(3000);await f.restart().admitFetch(paired[1].claim,paired[1].reservation);f.advance(3000);await f.restart().admitFetch(paired[2].claim,paired[2].reservation);
});
test('late simultaneous arrivals cannot collapse reserved pacing gaps into a fetch burst',async()=>{
 const f=await fixture(),jobs=await f.discover(2),claims=await Promise.all(jobs.map(j=>f.store.claimNotice(j.id))),reservations=await Promise.all(claims.map(c=>f.store.reserveFetch(c)));f.advance(10000);
 const results=await Promise.allSettled(claims.map((c,i)=>f.restart().admitFetch(c,reservations[i])));assert.equal(results.filter(r=>r.status==='fulfilled').length,1);const failed=results.findIndex(r=>r.status==='rejected');assert.equal(results[failed].reason.code,'FETCH_PACING_RETRY');
 f.advance(3000);await f.restart().admitFetch(claims[failed],reservations[failed]);
});
test('quota deferral releases a processing slot and preserves stage, first seen, timestamps and spending',async()=>{
 const f=await fixture({slots:1}),jobs=await f.discover(2),claim=await f.store.claimNotice(jobs[0].id);f.advance(1000);await f.store.checkpoint(claim,'retrieved');const first=value(await f.store.ref('ingestion_jobs',claim.id).get());
 const until='2026-11-04T08:02:00.000Z';await f.store.defer(claim,{reason:'source_budget',until});assert.equal(await f.restart().claimNotice(claim.id),null);assert.ok(await f.restart().claimNotice(jobs[1].id));f.advance(119000);
 const resumed=await f.restart().claimNotice(claim.id);assert.ok(resumed);assert.equal(resumed.stage,'extract');assert.equal(resumed.modelAdmissionRequired,true);const stored=value(await f.store.ref('ingestion_jobs',claim.id).get());assert.equal(stored.firstSeenAt,first.firstSeenAt);assert.equal(stored.timeline.startedAt,first.timeline.startedAt);assert.equal(stored.timeline.retrievedAt,first.timeline.retrievedAt);assert.deepEqual(value(await f.budgetRef.get()),f.budget);
});
test('lease renewal extends ownership; expiry permits replacement and rejects stale checkpoints',async()=>{
 const f=await fixture(),[job]=await f.discover(1),old=await f.store.claimNotice(job.id);f.advance(30000);const renewed=await f.restart().renew(old);assert.equal(renewed.leaseUntil,'2026-11-04T08:01:30.000Z');f.advance(30001);assert.equal(await f.restart().claimNotice(job.id),null);f.advance(29999);const next=await f.restart().claimNotice(job.id);assert.ok(next);assert.notEqual(next.lease,old.lease);await assert.rejects(f.store.checkpoint(old,'retrieved'),{code:'STALE_LEASE'});
});
test('authority and evidence holds do not automatically reopen or consume another model allowance',async()=>{
 const f=await fixture(),[job]=await f.discover(1),claim=await f.store.claimNotice(job.id);await f.store.defer(claim,{reason:'evidence'});f.advance(86400000);assert.equal(await f.restart().claimNotice(job.id),null);assert.deepEqual(value(await f.budgetRef.get()),f.budget);
});
test('revocation, source pause and revision changes fence admission and milestones after a paced wait',async()=>{
 for(const mode of ['revoked','paused','changed']){
  const f=await fixture(),[job]=await f.discover(1),claim=await f.store.claimNotice(job.id),reservation=await f.store.reserveFetch(claim);
  if(mode==='revoked')await f.store.ref('workers',f.store.actor).update({active:false});else{if(mode==='paused')f.source.paused=true;else f.source.revision++;await f.save();}
  await assert.rejects(f.restart().admitFetch(claim,reservation));await assert.rejects(f.restart().checkpoint(claim,'retrieved'));assert.deepEqual(value(await f.budgetRef.get()),f.budget);
 }
});
test('invalid destinations, duplicate canonical URLs, wrong-order milestones and corrupt stored state reject',async()=>{
 const f=await fixture(),poll=(await f.store.poll()).claim;
 await assert.rejects(f.store.recordDiscovery(poll,['https://evil.example/job/']));await assert.rejects(f.store.recordDiscovery(poll,['https://recentjobs.co.za/2026/11/04/same/','https://RECENTJOBS.CO.ZA/2026/11/04/same/']),{code:'FAST_DISCOVERY_INVALID'});
 await f.store.recordDiscovery(poll,['https://recentjobs.co.za/2026/11/04/authored/']);const rows=await db.collection('m0_ingestion_jobs').where('sourceId','==',f.id).get(),id=rows.docs[0].id,claim=await f.store.claimNotice(id);
 await assert.rejects(f.store.checkpoint(claim,'validated_private'),{code:'FAST_STAGE_INVALID'});await f.store.ref('ingestion_pacing',f.id).set(payload({sourceId:f.id,nextAt:'invalid',lastAdmittedAt:null}));await assert.rejects(f.store.reserveFetch(claim),{code:'FAST_INGESTION_STATE_INVALID'});
});
test('durable private milestones preserve the full cohort without claiming measured public publication',async()=>{
 const f=await fixture({slots:3}),jobs=await f.discover(),first=await f.store.claimNotice(jobs[0].id),held=await f.store.claimNotice(jobs[1].id);
 await f.store.defer(held,{reason:'authority'});f.advance(1000);await f.store.checkpoint(first,'retrieved');f.advance(1000);await f.store.checkpoint(first,'extracted');f.advance(1000);await f.store.checkpoint(first,'validated_private');f.advance(177000);
 const before=(await db.collection('m0_ingestion_events').where('sourceId','==',f.id).get()).size,snapshot=await f.restart().snapshot(),rows=snapshot.jobs,summary=snapshot.summary;
 assert.equal(summary.observed,3);assert.equal(summary.privateReady,1);assert.equal(summary.held,1);assert.equal(summary.queued,1);assert.equal(summary.unfinishedOverThreeMinutes,1);assert.equal(summary.p95FirstSeenToPrivateReadyMs,3000);assert.equal(summary.publicVisibilityMeasured,false);assert.equal(summary.p95FirstSeenToPublicMs,null);assert.equal(summary.livePublishingSloVerified,false);
 assert.equal(summarizeFastIngestion([],f.now()).p95FirstSeenToPrivateReadyMs,null);assert.throws(()=>summarizeFastIngestion([rows[0],rows[0]],f.now()));
 assert.equal((await db.collection('m0_ingestion_events').where('sourceId','==',f.id).get()).size,before);
});
test('invalid grants and expiry during admission cannot create coordinator work or a read-only snapshot',async()=>{
 for(const change of [{roles:['ingest','publish']},{sources:[]},{principal:'other@example.test'},{expiresAt:'2026-11-04T08:00:00.000Z'},{expiresAt:'invalid'}]) {
  const f=await fixture();await f.store.ref('workers',f.store.actor).update(change);await assert.rejects(f.store.poll(),{code:'WORKER_FORBIDDEN'});await assert.rejects(f.store.snapshot(),{code:'WORKER_FORBIDDEN'});assert.equal((await db.collection('m0_ingestion_events').where('sourceId','==',f.id).get()).size,0);
 }
 const f=await fixture();await f.store.ref('workers',f.store.actor).update({expiresAt:'2026-11-04T08:00:02.000Z'});
 const store=new FastIngestionStore(db,f.principal,{...f.options,assertAdmission:async()=>f.advance(2000)});await assert.rejects(store.poll(),{code:'WORKER_FORBIDDEN'});assert.equal((await db.collection('m0_ingestion_events').where('sourceId','==',f.id).get()).size,0);
});
test('inconsistent indexed queue metadata refuses both dispatch ownership and latency reporting',async()=>{
 const f=await fixture(),[job]=await f.discover(1);await f.store.ref('ingestion_jobs',job.id).update({state:'complete'});
 await assert.rejects(f.store.claimNotice(job.id),{code:'FAST_INGESTION_STATE_INVALID'});await assert.rejects(f.store.snapshot(),{code:'FAST_INGESTION_STATE_INVALID'});
});
