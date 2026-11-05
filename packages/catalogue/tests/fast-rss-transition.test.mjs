import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {Catalogue} from '../src/store.mjs';
import {getRuntime} from '../src/runtime.mjs';
import {FastIngestionStore,encodeFastJob} from '../src/fast-ingestion-store.mjs';
import {collectRssTransitionSnapshot,planRssTransition} from '../src/fast-rss-transition.mjs';
import {RECENTJOBS_CATEGORY_FEED as feedUrl} from '../src/publisher-feed-policy.mjs';
import {originalFixture} from './fixtures/original-notices.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex'),payload=v=>({json:JSON.stringify(v)}),value=row=>row.exists?JSON.parse(row.data().json):null;
let db;
before(async()=>{process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-rss-transition';db=(await getRuntime()).db;});
after(async()=>{await db?.terminate();});
async function fixture({role='source',completePoll=false}={}){
 let at='2026-11-05T10:00:00.000Z';const source=structuredClone(originalFixture().source),id='rss_transition_'+randomUUID(),uid='operator_'+randomUUID(),principal=randomUUID()+'@example.test';source.id=id;
 source.automation.fastIngestion={version:'shadow_v1',discoveryIntervalMs:120000,maxConcurrentJobs:2,leaseMs:600000};source.automation.maxModelCallsPerDay=2;
 const store=new FastIngestionStore(db,principal,{enabled:true,sourceId:id,sourceRevision:1,privateRefresh:true,now:()=>at}),catalogue=new Catalogue(db,{verifyIdToken:async token=>{if(token!=='authored-token')throw Error('Authored invalid token');return{uid};}},()=>at);
 await store.ref('sources',id).set(payload(source));await store.ref('source_versions',hash(id+':1')).set(payload(source));await store.ref('operators',uid).set({active:true,roles:[role]});
 await store.ref('workers',store.actor).set({active:true,principal,sources:[id],roles:['ingest']});
 const firstSeenAt='2026-11-04T08:00:00.000Z',history={inventorySha256:'a'.repeat(64),firstSeenBasis:'legacy_observation_bound',sloEligible:false},urls=[0,1].map(n=>'https://recentjobs.co.za/2026/11/04/authored-transition-'+n+'/');
 for(const url of urls){const noticeId=hash(id+':'+url);await store.ref('ingestion_notices',noticeId).set({...payload({id:noticeId,sourceId:id,url,firstSeenAt,firstPollId:null,history}),sourceId:id,firstSeenAt});
  await store.ref('ingestion_jobs',noticeId).set(encodeFastJob({id:noticeId,sourceId:id,sourceRevision:1,url,firstSeenAt,updatedAt:firstSeenAt,stage:'fetch',state:'held',nextAt:firstSeenAt,attempts:0,lease:null,leaseUntil:null,principal:null,fetchReservation:null,timeline:{},blockedBy:'evidence',history}));}
 await store.activatePrivateRefresh();await store.ref('ingestion_dispatch',id).set(payload({sourceId:id,sourceRevision:1,newSinceRefresh:3}));
 const poll=await store.poll();const reservation=await store.reserveFetch(poll.claim);await store.admitFetch(poll.claim,reservation);
 if(completePoll)await store.recordDiscovery(poll.claim,urls);else await store.recordSourceChallenge(poll.claim);
 await store.ref('model_budgets',hash(id+':2026-11-05')).set(payload({sourceId:id,date:'2026-11-05',calls:2}));
 for(const name of ['model_cache','model_usage','model_availability'])await store.ref(name,hash(id+':'+name)).set(payload({sourceId:id,authoredRetained:name,requests:2,until:'2026-11-06T08:00:00.000Z'}));
 await store.ref('drafts',hash(id+':draft')).set(payload({sourceId:id,publication:{approved:false},authoredRetained:'private evidence'}));
 await store.ref('workers',store.actor).update({active:false});if(!completePoll)at='2026-11-05T10:10:00.001Z';
 const snapshot=await collectRssTransitionSnapshot(db,{now:()=>at}),input={version:1,sourceId:id,snapshot,evidence:{feedUrl,feedHash:'b'.repeat(64),retrievedAt:'2026-11-05T09:00:00.000Z',qualificationRef:'Authored RSS transport qualification'},externalRuns:[]};
 const plan=planRssTransition(input,{now:()=>at}),review={expectedSha256:plan.sha256,reason:'Reviewed authored held-only RSS transition'};
 return{source,id,uid,principal,store,catalogue,urls,input,plan,review,now:()=>at,advance:ms=>{at=new Date(Date.parse(at)+ms).toISOString();},apply:(options={})=>catalogue.adoptRssSource('authored-token',input,{...review,...options}),
  capture:()=>collectRssTransitionSnapshot(db,{now:()=>at})};
}
test('held-only RSS plan preserves identity, ages, history, attempts, quota authority and fetch pacing',async()=>{
 const f=await fixture();assert.equal(f.plan.ready,true);assert.equal(f.plan.heldJobs,2);assert.equal(f.plan.targetSource.revision,2);assert.equal(f.plan.targetSource.automation.maxModelCallsPerDay,2);assert.equal(f.plan.targetSource.automation.publisherFeed,'rss_shadow_v1');
 assert.equal(f.plan.targetSource.automation.discovery.maxPages,1);assert.equal(f.plan.quotaWrites,false);assert.equal(f.plan.heldJobsReleased,false);
 for(const change of f.plan.changes.filter(row=>row.collection==='m0_ingestion_jobs')){const before=JSON.parse(change.before.json),after=JSON.parse(change.after.json);assert.deepEqual(after,{...before,sourceRevision:2});assert.equal(after.state,'held');assert.equal(after.history.sloEligible,false);}
 assert.ok(f.plan.changes.some(row=>row.collection==='m0_ingestion_cursors'&&row.after===null));assert.ok(f.plan.changes.every(row=>!/(?:model_|draft|public|pacing|polls|notices|workers)/.test(row.collection)));
});
test('active grants, live leases, unfinished jobs, refresh watches and scheduled work block the plan',async()=>{
 const f=await fixture(),mutate=(name,fn)=>{const input=structuredClone(f.input);fn(input.snapshot.collections[name]);return planRssTransition(input,{now:f.now});};
 assert.ok(mutate('m0_workers',rows=>{rows.find(r=>r.id===f.store.actor).data.active=true;}).blockers.includes('WORKER_GRANT_ACTIVE'));
 assert.ok(mutate('m0_ingestion_polls',rows=>{const r=rows.find(r=>JSON.parse(r.data.json).sourceId===f.id);r.data=payload({...JSON.parse(r.data.json),leaseUntil:'2026-11-05T10:20:00.000Z'});}).blockers.includes('POLL_LEASE_ACTIVE'));
 assert.ok(mutate('m0_ingestion_jobs',rows=>{const r=rows.find(r=>JSON.parse(r.data.json).sourceId===f.id);r.data=encodeFastJob({...JSON.parse(r.data.json),state:'queued'});}).blockers.includes('HELD_ONLY_REQUIRED'));
 assert.ok(mutate('m0_ingestion_refresh_watches',rows=>rows.push({id:hash(f.id+':watch'),data:payload({sourceId:f.id})})).blockers.includes('REFRESH_ADOPTION_REQUIRED'));
 const scheduled=structuredClone(f.input);scheduled.externalRuns=[{id:'authored_run',sourceId:f.id,sourceRevision:1,state:'scheduled',plannedAt:f.now()}];assert.ok(planRssTransition(scheduled,{now:f.now}).blockers.includes('SCHEDULED_OR_RUNNING_WORK'));
 const omitted=structuredClone(f.input);delete omitted.snapshot.collections.m0_model_usage;assert.throws(()=>planRssTransition(omitted,{now:f.now}),{code:'RSS_TRANSITION_INVENTORY_INCOMPLETE'});
});
test('normal Source API applies and archives atomically without releasing held jobs or changing retained model records',async()=>{
 const f=await fixture(),before=await f.capture(),result=await f.apply();assert.equal(result.status,'adopted');const after=await f.capture();
 const changed=new Set(['m0_sources','m0_source_versions','m0_ingestion_jobs','m0_ingestion_cursors','m0_ingestion_refresh_features','m0_ingestion_dispatch','m0_ingestion_rss_adoptions','m0_ingestion_revision_archives']);
 for(const name of Object.keys(before.collections))if(!changed.has(name))assert.deepEqual(after.collections[name],before.collections[name],name);
 assert.deepEqual(value(await f.store.ref('sources',f.id).get()),f.plan.targetSource);assert.deepEqual(value(await f.store.ref('source_versions',hash(f.id+':1')).get()),f.source);
 for(const row of f.plan.changes){const got=await db.collection(row.collection).doc(row.id).get();if(row.after===null)assert.equal(got.exists,false);else assert.deepEqual(got.data(),row.after);}
 const archives=after.collections.m0_ingestion_revision_archives.map(row=>JSON.parse(row.data.json)).filter(row=>row.sourceId===f.id);assert.equal(archives.length,f.plan.changes.length);for(const change of f.plan.changes)assert.deepEqual(archives.find(row=>row.collection===change.collection&&row.id===change.id).before,change.before);
});
test('reviewer-only or invalid identity and mismatched review hashes cannot apply',async()=>{
 const denied=await fixture({role:'reviewer'});await assert.rejects(denied.apply(),{code:'FORBIDDEN'});await assert.rejects(denied.catalogue.adoptRssSource('bad',denied.input,denied.review),{code:'UNAUTHORIZED'});
 const f=await fixture();await assert.rejects(f.apply({expectedSha256:'c'.repeat(64)}),{code:'RSS_TRANSITION_HASH_MISMATCH'});assert.equal(value(await f.store.ref('sources',f.id).get()).revision,1);
});
test('spent budgets, provider holds, caches and source grant changes invalidate the entire reviewed inventory',async()=>{
 for(const name of ['model_budgets','model_usage','model_availability','model_cache','workers']){
  const f=await fixture(),rows=f.input.snapshot.collections['m0_'+name],row=rows.find(row=>name==='workers'?row.id===f.store.actor:JSON.parse(row.data.json).sourceId===f.id),changed={...row.data,authoredConcurrentChange:true};
  await f.store.ref(name,row.id).set(changed);await assert.rejects(f.apply(),{code:'RSS_TRANSITION_INVENTORY_CHANGED'});assert.deepEqual((await f.store.ref(name,row.id).get()).data(),changed);assert.equal(value(await f.store.ref('sources',f.id).get()).revision,1);
 }
});
test('concurrent application is idempotent and later replay has no extra audit or charge writes',async()=>{
 const f=await fixture(),results=await Promise.all([f.apply(),f.apply()]);assert.deepEqual(results.map(row=>row.status).sort(),['adopted','verified']);const audits=(await db.collection('m0_audit').get()).size;
 f.advance(900001);assert.equal((await f.apply()).status,'verified');assert.equal((await db.collection('m0_audit').get()).size,audits);
});
test('stale first application and conflicting archive/version documents refuse without partial source changes',async()=>{
 const old=await fixture();old.advance(900001);await assert.rejects(old.apply(),{code:'RSS_TRANSITION_BLOCKED'});
 for(const name of ['source_versions','ingestion_revision_archives']){const f=await fixture(),id=name==='source_versions'?hash(f.id+':2'):hash(f.plan.sha256+':'+f.plan.changes[0].collection+':'+f.plan.changes[0].id),data=payload({authoredConflict:true});
  await f.store.ref(name,id).set(data);await assert.rejects(f.apply(),{code:'RSS_TRANSITION_BLOCKED'});assert.deepEqual((await f.store.ref(name,id).get()).data(),data);assert.equal(value(await f.store.ref('sources',f.id).get()).revision,1);}
});
test('changed archives or applied Source versions cannot be accepted as successful replay',async()=>{
 const f=await fixture();await f.apply();const id=hash(f.plan.sha256+':'+f.plan.changes[0].collection+':'+f.plan.changes[0].id);await f.store.ref('ingestion_revision_archives',id).set(payload({authoredChanged:true}));await assert.rejects(f.apply(),{code:'RSS_TRANSITION_REPLAY_CONFLICT'});
});
test('same-bucket RSS startup uses a distinct poll identity and keeps imported notices held with shared refresh state',async()=>{
 const f=await fixture({completePoll:true}),oldCursor=value(await f.store.ref('ingestion_cursors',f.id).get());await f.apply();await f.store.ref('workers',f.store.actor).update({active:true});
 await assert.rejects(f.store.poll(),{code:'SOURCE_CHANGED'});const store=new FastIngestionStore(db,f.principal,{enabled:true,sourceId:f.id,sourceRevision:2,privateRefresh:true,now:f.now}),poll=await store.poll();assert.equal(poll.state,'ready');assert.notEqual(poll.claim.id,oldCursor.pollId);assert.equal(poll.discoveryUrl,feedUrl);
 const list={adapter:'recentjobs_rss_discovery_v1',sourceUrl:feedUrl,feedHash:'b'.repeat(64),coverage:'feed_window_only',articles:f.urls.map(url=>({sourceUrl:url,title:'Authored apprenticeship',itemHash:'c'.repeat(64),publishedAt:'2026-11-04T08:00:00.000Z'})),nextPage:null};
 const {page}=await store.discoveryPage(poll.claim,feedUrl,{capture:{list,retrievedAt:f.now()}});assert.equal((await store.recordDiscovery(poll.claim,f.urls,{pageReceiptId:page.id})).queued,0);
 const state=await store.snapshot();assert.equal(state.jobs.filter(row=>row.state==='held').length,2);assert.equal(state.summary.latencyEligible,0);assert.equal(await store.claimNotice(state.jobs[0].id),null);
 assert.equal(value(await store.ref('ingestion_dispatch',f.id).get()).newSinceRefresh,3);assert.equal(value(await store.ref('ingestion_refresh_features',f.id).get()).sourceRevision,2);assert.equal(value(await store.ref('model_budgets',hash(f.id+':2026-11-05')).get()).calls,2);
});
test('ordinary source editing cannot bypass the reviewed RSS revision operation',async()=>{
 const f=await fixture();await assert.rejects(f.catalogue.registerSource('authored-token',f.plan.targetSource,1,'Authored direct RSS edit'),{code:'FAST_SOURCE_REVISION_ADOPTION_REQUIRED'});assert.equal(value(await f.store.ref('sources',f.id).get()).revision,1);
});
test('Source-role expiry during retained-state checks fences the commit',async()=>{
 const f=await fixture();await f.store.ref('operators',f.uid).set({active:true,roles:['source'],roleExpiries:{source:new Date(Date.parse(f.now())+1000).toISOString()}});
 let calls=0;f.catalogue.now=()=>{if(++calls===4)f.advance(2000);return f.now();};
 await assert.rejects(f.apply(),{code:'FORBIDDEN'});assert.equal(value(await f.store.ref('sources',f.id).get()).revision,1);assert.equal(value(await f.store.ref('model_budgets',hash(f.id+':2026-11-05')).get()).calls,2);
});
test('failure after archive writes rolls back every revision binding and preserves spend',async()=>{
 const f=await fixture(),failingDb={collection:db.collection.bind(db),runTransaction:work=>db.runTransaction(tx=>work(new Proxy(tx,{get:(target,key)=>key==='set'?(ref,...args)=>{
  if(ref.path==='m0_sources/'+f.id)throw Object.assign(Error('Authored transaction failure'),{code:'AUTHORED_COMMIT_FAILURE'});return target.set(ref,...args);
 }:typeof target[key]==='function'?target[key].bind(target):target[key]})))};
 const catalogue=new Catalogue(failingDb,f.catalogue.auth,f.now);await assert.rejects(catalogue.adoptRssSource('authored-token',f.input,f.review),{code:'AUTHORED_COMMIT_FAILURE'});
 assert.equal(value(await f.store.ref('sources',f.id).get()).revision,1);for(const row of f.plan.changes)assert.deepEqual((await db.collection(row.collection).doc(row.id).get()).data(),row.before);
 assert.equal((await db.collection('m0_ingestion_revision_archives').get()).docs.filter(row=>JSON.parse(row.data().json).sourceId===f.id).length,0);
 assert.equal(value(await f.store.ref('model_budgets',hash(f.id+':2026-11-05')).get()).calls,2);
});
