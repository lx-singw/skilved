import{test,before,after}from'node:test';import assert from'node:assert/strict';
import{getRuntime}from'../src/runtime.mjs';import{Catalogue}from'../src/store.mjs';
import{collectFastMigrationSnapshot,planFastIngestionMigration,importFastIngestionHistory}from'../src/fast-ingestion-migration.mjs';
import{FastIngestionStore,summarizeFastIngestion}from'../src/fast-ingestion-store.mjs';
import{FastRecentJobsWorker}from'../src/fast-recentjobs-worker.mjs';
import{RecentJobsWorker}from'../src/recentjobs-worker.mjs';
import{migrationFixture,migrationAt,migrationHash,migrationPayload}from'./fixtures/fast-migration.mjs';
let db;before(async()=>{process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-fast-migration';db=(await getRuntime()).db;});after(async()=>{await db?.terminate();});
async function fixture({role='source',withoutDraft=false}={}){
 const f=migrationFixture();let at=migrationAt;
 if(withoutDraft)f.input.snapshot.collections.m0_drafts=[];
 for(const[name,rows]of Object.entries(f.input.snapshot.collections))for(const row of rows)await db.collection(name).doc(row.id).set(row.data);
 const uid='operator_'+migrationHash(f.sourceId).slice(0,20);await db.collection('m0_operators').doc(uid).set({active:true,roles:[role]});
 const catalogue=new Catalogue(db,{verifyIdToken:async token=>{if(token!=='authored-source-token')throw Error('Bad token');return{uid};}},()=>at);
 const input={...f.input,snapshot:await collectFastMigrationSnapshot(db,{now:()=>at})};const plan=planFastIngestionMigration(input,{now:()=>at});
 return{...f,input,plan,catalogue,uid,now:()=>at,advance:ms=>{at=new Date(Date.parse(at)+ms).toISOString();},apply:(options={})=>importFastIngestionHistory(catalogue,'authored-source-token',input,{expectedSha256:plan.sha256,reason:'Authored migration review',...options})};
}
test('Source-role import creates held metadata only and replay verifies without changing retained history or audit count',async()=>{
 const f=await fixture(),before=await collectFastMigrationSnapshot(db,{now:f.now});assert.equal(f.plan.readyForHistoryImport,true);assert.equal((await f.apply()).status,'imported');
 assert.deepEqual((await collectFastMigrationSnapshot(db,{now:f.now})).collections,before.collections);const audit=(await db.collection('m0_audit').get()).size;f.advance(900001);assert.equal((await f.apply()).status,'verified');assert.equal((await db.collection('m0_audit').get()).size,audit);
 const jobs=await db.collection('m0_ingestion_jobs').where('sourceId','==',f.sourceId).get();assert.equal(jobs.size,1);const job=JSON.parse(jobs.docs[0].data().json);assert.equal(job.state,'held');assert.equal(job.history.sloEligible,false);assert.equal(job.sourceRevision,2);assert.equal(JSON.parse((await db.collection('m0_sources').doc(f.sourceId).get()).data().json).revision,1);
});
test('reviewer-only access, invalid tokens and unreviewed hashes cannot import records',async()=>{
 const f=await fixture({role:'reviewer'});await assert.rejects(f.apply(),{code:'FORBIDDEN'});await assert.rejects(importFastIngestionHistory(f.catalogue,'bad-token',f.input,{expectedSha256:f.plan.sha256,reason:'Authored denial'}),{code:'UNAUTHORIZED'});await assert.rejects(f.apply({expectedSha256:'a'.repeat(64)}),{code:'FAST_MIGRATION_HASH_MISMATCH'});assert.equal((await db.collection('m0_ingestion_jobs').where('sourceId','==',f.sourceId).get()).size,0);
});
test('changed source budgets invalidate review instead of overwriting or refreshing spending',async()=>{
 const f=await fixture(),ref=db.collection('m0_model_budgets').doc(migrationHash(f.sourceId+':2026-11-04'));const changed=migrationPayload({sourceId:f.sourceId,date:'2026-11-04',calls:3});await ref.set(changed);
 await assert.rejects(f.apply(),{code:'FAST_MIGRATION_INVENTORY_CHANGED'});assert.deepEqual((await ref.get()).data(),changed);assert.equal((await db.collection('m0_ingestion_jobs').where('sourceId','==',f.sourceId).get()).size,0);
});
test('conflicting target metadata is never overwritten, including unindexed documents',async()=>{
 const f=await fixture(),target=f.plan.proposed.find(r=>r.collection==='m0_ingestion_jobs'),ref=db.collection(target.collection).doc(target.id),conflict={json:'{"authoredConflict":true}'};await ref.set(conflict);
 await assert.rejects(f.apply(),{code:'FAST_MIGRATION_TARGET_CONFLICT'});assert.deepEqual((await ref.get()).data(),conflict);assert.equal((await db.collection('m0_ingestion_migrations').doc(f.plan.sha256).get()).exists,false);
});
test('first import refuses stale inventory while a completed import replay remains read-only',async()=>{
 const f=await fixture();f.advance(900001);await assert.rejects(f.apply(),{code:'FAST_MIGRATION_BLOCKED'});assert.equal((await db.collection('m0_ingestion_jobs').where('sourceId','==',f.sourceId).get()).size,0);
});
test('after reviewed Source API adoption, rediscovery retains held history and keeps it out of latency percentiles',async()=>{
 const f=await fixture();await f.apply();await f.catalogue.adoptFastSource('authored-source-token',f.input,{expectedSha256:f.plan.sha256,reason:'Reviewed authored history adoption'});
 const principal='authored-fast-worker@example.test',store=new FastIngestionStore(db,principal,{enabled:true,sourceId:f.sourceId,sourceRevision:2,now:f.now});await store.ref('workers',store.actor).set({active:true,principal,roles:['ingest'],sources:[f.sourceId]});
 const poll=await store.poll();const discovered=await store.recordDiscovery(poll.claim,[f.url]);assert.equal(discovered.queued,0);const snapshot=await store.snapshot();assert.equal(snapshot.summary.held,1);assert.equal(snapshot.summary.historicalAgeBounds,1);assert.equal(snapshot.summary.latencyEligible,0);assert.equal(snapshot.summary.p95FirstSeenToPrivateReadyMs,null);assert.equal(await store.claimNotice(snapshot.jobs[0].id),null);
 const fakeCompletion={...snapshot.jobs[0],state:'complete',stage:'complete',outcome:'validated_private',updatedAt:f.now(),timeline:{startedAt:'2026-11-04T09:58:00.000Z',retrievedAt:'2026-11-04T09:58:30.000Z',extractedAt:'2026-11-04T09:59:00.000Z',privateReadyAt:f.now()}};const summary=summarizeFastIngestion([fakeCompletion],f.now());assert.equal(summary.privateReady,1);assert.equal(summary.p95FirstSeenToPrivateReadyMs,null);assert.equal(summary.p95FirstSeenToPublicMs,null);
 assert.equal(JSON.parse((await store.ref('model_budgets',migrationHash(f.sourceId+':2026-11-04')).get()).data().json).calls,2);
});
test('tampered migration receipts are refused rather than repaired or trusted',async()=>{
 const f=await fixture();await f.apply();const ref=db.collection('m0_ingestion_migrations').doc(f.plan.sha256),data=(await ref.get()).data();const changed={...data,json:JSON.stringify({...JSON.parse(data.json),quotaWrites:true})};await ref.set(changed);await assert.rejects(f.apply(),{code:'FAST_MIGRATION_TARGET_CONFLICT'});assert.deepEqual((await ref.get()).data(),changed);
});
test('accidentally re-queued imported history cannot receive a fresh execution retry budget',async()=>{
 const f=await fixture({withoutDraft:true});await f.apply();await db.collection('m0_sources').doc(f.sourceId).set(migrationPayload(f.plan.proposedTargetSource));
 const principal='authored-history-bridge@example.test';let fetches=0;const worker=new FastRecentJobsWorker(db,principal,{enabled:true,sourceId:f.sourceId,sourceRevision:2,now:f.now,fetcher:async()=>{fetches++;throw Error('Must not fetch history');}});await worker.fast.ref('workers',worker.actor).set({active:true,principal,roles:['ingest'],sources:[f.sourceId]});
 const ref=db.collection('m0_ingestion_jobs').doc(f.plan.noticePlans[0].id),data=(await ref.get()).data(),job=JSON.parse(data.json);await ref.set({...data,state:'queued',json:JSON.stringify({...job,state:'queued'})});const result=await worker.runNotice(job.id);assert.equal(result.reason,'FAST_NOTICE_HISTORY_REQUIRES_MIGRATION');assert.equal(fetches,0);assert.equal((await worker.fast.snapshot()).jobs[0].state,'held');
});

test('ordinary Source edits cannot bypass reviewed fast-policy adoption',async()=>{
 const f=await fixture();
 await assert.rejects(f.catalogue.registerSource('authored-source-token',f.plan.proposedTargetSource,1,'Attempt direct fast opt-in'),{code:'FAST_SOURCE_ADOPTION_REQUIRED'});
 assert.equal(JSON.parse((await db.collection('m0_sources').doc(f.sourceId).get()).data().json).revision,1);
});
test('source adoption requires the exact reviewed and intact imported history',async()=>{
 const f=await fixture(),review={expectedSha256:f.plan.sha256,reason:'Reviewed authored fast adoption'};
 await assert.rejects(f.catalogue.adoptFastSource('authored-source-token',f.input,review),{code:'FAST_SOURCE_HISTORY_REQUIRED'});
 await f.apply();const row=f.plan.proposed.find(r=>r.collection==='m0_ingestion_jobs');
 await db.collection(row.collection).doc(row.id).set({...row.data,state:'queued'});
 await assert.rejects(f.catalogue.adoptFastSource('authored-source-token',f.input,review),{code:'FAST_MIGRATION_TARGET_CONFLICT'});
 assert.equal(JSON.parse((await db.collection('m0_sources').doc(f.sourceId).get()).data().json).revision,1);
});
test('atomic concurrent adoption preserves spend, caches and held history and has idempotent replay',async()=>{
 const f=await fixture();await f.apply();const before=await collectFastMigrationSnapshot(db,{now:f.now}),review={expectedSha256:f.plan.sha256,reason:'Reviewed authored adoption'};
 const results=await Promise.all([f.catalogue.adoptFastSource('authored-source-token',f.input,review),f.catalogue.adoptFastSource('authored-source-token',f.input,review)]);
 assert.deepEqual(results.map(r=>r.status).sort(),['adopted','verified']);
 const after=await collectFastMigrationSnapshot(db,{now:f.now});
 for(const name of Object.keys(before.collections).filter(n=>!['m0_sources','m0_source_versions'].includes(n)))assert.deepEqual(after.collections[name],before.collections[name]);
 const source=JSON.parse((await db.collection('m0_sources').doc(f.sourceId).get()).data().json);
 assert.deepEqual(source,f.plan.proposedTargetSource);assert.equal(source.automation.maxModelCallsPerDay,2);
 for(const row of f.plan.proposed)assert.deepEqual((await db.collection(row.collection).doc(row.id).get()).data(),row.data);
 const audits=(await db.collection('m0_audit').get()).size;f.advance(900001);
 assert.equal((await f.catalogue.adoptFastSource('authored-source-token',f.input,review)).status,'verified');
 assert.equal((await db.collection('m0_audit').get()).size,audits);
});
test('reviewer-only identity cannot adopt policy and spent-budget changes invalidate review',async()=>{
 const denied=await fixture({role:'reviewer'});
 await assert.rejects(denied.catalogue.adoptFastSource('authored-source-token',denied.input,{expectedSha256:denied.plan.sha256,reason:'Authored role denial'}),{code:'FORBIDDEN'});
 const f=await fixture();await f.apply();await db.collection('m0_model_budgets').doc(migrationHash(f.sourceId+':2026-11-04')).set(migrationPayload({sourceId:f.sourceId,date:'2026-11-04',calls:3}));
 await assert.rejects(f.catalogue.adoptFastSource('authored-source-token',f.input,{expectedSha256:f.plan.sha256,reason:'Authored stale accounting'}),{code:'FAST_MIGRATION_INVENTORY_CHANGED'});
});
test('legacy workers refuse an adopted fast source before source or model work',async()=>{
 const f=await fixture();await f.apply();await f.catalogue.adoptFastSource('authored-source-token',f.input,{expectedSha256:f.plan.sha256,reason:'Authored fast lane adoption'});
 const principal='authored-legacy-worker@example.test',worker=new RecentJobsWorker(db,principal);
 await worker.ref('workers',worker.actor).set({active:true,principal,roles:['ingest'],sources:[f.sourceId]});
 await assert.rejects(worker.transaction(f.sourceId,'worker.test',()=>assert.fail('legacy work admitted')),{code:'FAST_WORKER_REQUIRED'});
 const store=new FastIngestionStore(db,principal,{enabled:true,sourceId:f.sourceId,sourceRevision:2,now:f.now});
 const state=await store.snapshot();assert.equal(state.jobs[0].state,'held');assert.equal(state.jobs[0].history.sloEligible,false);
 const source=JSON.parse((await db.collection('m0_sources').doc(f.sourceId).get()).data().json);
 await assert.rejects(f.catalogue.registerSource('authored-source-token',{...source,revision:3,automation:{...source.automation,fastIngestion:undefined}},2,'Attempt fast policy removal'),{code:'FAST_SOURCE_ADOPTION_REQUIRED'});
});
test('tampered adoption receipts or later policy changes cannot be replayed as a successful cutover',async()=>{
 const f=await fixture();await f.apply();const review={expectedSha256:f.plan.sha256,reason:'Authored replay fence'};
 await f.catalogue.adoptFastSource('authored-source-token',f.input,review);
 const ref=db.collection('m0_ingestion_adoptions').doc(f.plan.sha256),saved=(await ref.get()).data();
 await ref.set(migrationPayload({...JSON.parse(saved.json),quotaWrites:true}));
 await assert.rejects(f.catalogue.adoptFastSource('authored-source-token',f.input,review),{code:'FAST_SOURCE_ADOPTION_CONFLICT'});
 await ref.set(saved);
 const source=JSON.parse((await db.collection('m0_sources').doc(f.sourceId).get()).data().json);
 await assert.rejects(f.catalogue.registerSource('authored-source-token',{...source,revision:3,automation:{...source.automation,maxModelCallsPerDay:3}},2,'Attempt unsupported fast revision edit'),{code:'FAST_SOURCE_REVISION_ADOPTION_REQUIRED'});
 await f.catalogue.registerSource('authored-source-token',{...source,revision:3,paused:true},2,'Pause adopted authored source');
 await assert.rejects(f.catalogue.registerSource('authored-source-token',{...source,revision:4,paused:false},3,'Attempt unsafe fast source resume'),{code:'FAST_SOURCE_REVISION_ADOPTION_REQUIRED'});
 await assert.rejects(f.catalogue.adoptFastSource('authored-source-token',f.input,review),{code:'FAST_SOURCE_ADOPTION_CONFLICT'});
});
