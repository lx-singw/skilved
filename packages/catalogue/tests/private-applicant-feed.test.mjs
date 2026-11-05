import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {getFirestore} from 'firebase-admin/firestore';
import {getRuntime} from '../src/runtime.mjs';
import {Catalogue} from '../src/store.mjs';
import {PrivateApplicantFeed} from '../src/private-applicant-feed.mjs';
import {allFacts} from '../src/worker-policy.mjs';
import {makeRecord} from '../../types/tests/fixtures/opportunities.mjs';
import {supervisionFixture,payload} from './fixtures/fast-supervision.mjs';
let runtime,sharedRuntime;
before(async()=>{
 process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-b03';sharedRuntime=await getRuntime();
 // The reader intentionally sees a whole bounded inventory. Isolate its
 // capacity fixtures from other suites while using the normal Auth project.
 runtime={...sharedRuntime,db:getFirestore(sharedRuntime.auth.app,'private-feed-'+randomUUID())};
});
after(async()=>{await runtime?.db.terminate();await sharedRuntime?.db.terminate();});
async function signup(){
 const r=await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fixture`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:randomUUID()+'@example.test',password:randomUUID(),returnSecureToken:true})});assert.equal(r.status,200);return r.json();
}
async function fixture({count=1}={}){
 const user=await signup(),sourceId='private_source_'+randomUUID(),snapshotId='private_snapshot_'+randomUUID();let at='2026-10-29T10:00:00.000Z';
 const store=new Catalogue(runtime.db,runtime.auth,()=>at),source={id:sourceId,revision:1,name:'Authored private feed source',urls:['https://issuer.example/notice'],permission:{reference:'Authored permission',method:'structured_json',reuse:'Synthetic only',reviewedAt:at},categories:['apprenticeship','job'],owner:'fixture_owner',paused:false,cadenceHours:24,maxBytes:500000};
 await store.ref('operators',user.localId).set({active:true,roles:['reviewer','source']});await store.registerSource(user.idToken,source,null,'Authored private feed source');
 await store.ref('snapshots',snapshotId).set(payload({id:snapshotId,sourceId,url:source.urls[0],sourceRevision:1}));
 const ids=[];
 const add=async({category='apprenticeship',title,deadline='2026-10-30'}={})=>{
  const r=makeRecord(category);r.id='private_notice_'+randomUUID();r.checks=[];r.publication.previouslyPublic=false;r.citations[0].snapshotId=snapshotId;
  allFacts(r).forEach(f=>{if(f.sourceSnapshotIds.length)f.sourceSnapshotIds=[snapshotId];});r.deadline.value.localDate=deadline;
  if(title){r.title.value=title;r.title.originalText=title;}
  await store.saveDraft(user.idToken,r,null,'Authored private draft');ids.push(r.id);return r.id;
 };
 for(let i=0;i<count;i++)await add({title:'Authored private notice '+i});
 await store.ref('operators',user.localId).set({active:true,roles:['reviewer']});
 return{store,user,source,sourceId,ids,add,feed:new PrivateApplicantFeed(store,{enabled:true,sourceIds:[sourceId]}),now:()=>at,
  advance:ms=>{at=new Date(Date.parse(at)+ms).toISOString();}};
}
async function inventory(){const result={};for(const ref of await runtime.db.listCollections())result[ref.id]=(await ref.get()).docs.map(d=>({id:d.id,data:d.data()}));return result;}
test('private feed is explicit and scoped, with no anonymous or non-reviewer access',async()=>{
 assert.throws(()=>new PrivateApplicantFeed(null),{code:'PRIVATE_FEED_DISABLED'});
 const f=await fixture(),guest=await signup();assert.throws(()=>new PrivateApplicantFeed(f.store,{enabled:true,sourceIds:[]}),{code:'PRIVATE_FEED_CONFIGURATION_REQUIRED'});
 await assert.rejects(f.feed.list(''),{code:'UNAUTHORIZED'});await assert.rejects(f.feed.list(guest.idToken),{code:'FORBIDDEN'});
 assert.equal((await f.feed.list(f.user.idToken)).page.items.length,1);
});
test('reviewer-only previews preserve actual draft timestamps and all stored data without exposing private facts or application actions',async()=>{
 const f=await fixture(),raw=await f.store.inspect(f.user.idToken,'drafts',f.ids[0]),before=await inventory(),result=await f.feed.list(f.user.idToken);
 const o=result.page.items[0];assert.equal(result.publication,false);assert.equal(o.updatedAt,raw.updatedAt);assert.equal(o.createdAt,raw.createdAt);assert.equal(o.application.state,'unavailable');assert.equal(o.application.reason,'needs_review');assert.equal(o.revision,raw.revision+1);
 assert.doesNotMatch(JSON.stringify(result),/PRIVATE_|reviewedBy|sourceSnapshotIds|reviewerNotes|rawSource/);assert.deepEqual(await inventory(),before);
 await assert.rejects(f.store.detail(raw.id),{code:'NOT_FOUND'});assert.equal((await f.store.inspect(f.user.idToken,'drafts',raw.id)).publication.approved,false);
});
test('new and edited canonical drafts appear on subsequent reads without a seeded viewer list',async()=>{
 const f=await fixture(),first=await f.feed.list(f.user.idToken);f.advance(1000);const id=await f.add({title:'Authored arrived later'}),second=await f.feed.list(f.user.idToken);
 assert.equal(second.page.items[0].id,id);assert.equal(second.page.items.length,2);assert.notEqual(second.page.catalogueRevision,first.page.catalogueRevision);
 const r=await f.store.inspect(f.user.idToken,'drafts',id);r.revision++;r.requirements.revision=r.revision;r.title.value='Authored corrected title';r.title.originalText=r.title.value;
 await f.store.saveDraft(f.user.idToken,r,r.revision-1,'Authored correction');const detail=await f.feed.detail(f.user.idToken,id);assert.equal(detail.draftRevision,r.revision);assert.equal(detail.projection.opportunity.title.value,r.title.value);assert.equal(detail.publication,false);
});
test('the normal fast worker produces a draft that the already-created private feed picks up automatically',async()=>{
 const f=await supervisionFixture(runtime.db,{supervised:false}),user=await signup(),store=new Catalogue(runtime.db,runtime.auth,f.clock.now);await store.ref('operators',user.localId).set({active:true,roles:['reviewer']});
 const feed=new PrivateApplicantFeed(store,{enabled:true,sourceIds:[f.id]});assert.equal((await feed.list(user.idToken)).page.items.length,0);
 const [job]=await f.seed();assert.equal((await f.worker.runNotice(job.id)).state,'done');const result=await feed.list(user.idToken);assert.equal(result.page.items.length,1);assert.equal(result.page.items[0].id,(await f.draft()).id);assert.equal(result.page.items[0].application.state,'unavailable');assert.equal((await f.budget()).calls,2);await assert.rejects(store.detail(result.page.items[0].id),{code:'NOT_FOUND'});
});
test('semantic rejection supplies no new private feed record',async()=>{
 const f=await supervisionFixture(runtime.db,{supervised:false}),user=await signup(),store=new Catalogue(runtime.db,runtime.auth,f.clock.now);await store.ref('operators',user.localId).set({active:true,roles:['reviewer']});
 const feed=new PrivateApplicantFeed(store,{enabled:true,sourceIds:[f.id]});f.worker.validator=async()=>({supported:false,issues:[{field:'requirements',reason:'Authored unsupported evidence'}],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'}]});
 const [job]=await f.seed(),result=await f.worker.runNotice(job.id);assert.equal(result.reason,'SEMANTIC_VALIDATION_FAILED');assert.equal((await feed.list(user.idToken)).page.items.length,0);assert.equal(await f.draft(),null);
});
test('filters and cursor pages use stable private generations rather than read-time publication dates',async()=>{
 const f=await fixture({count:3});const query=new URLSearchParams({limit:'2'}),first=await f.feed.list(f.user.idToken,query);assert.ok(first.page.nextCursor);
 f.advance(1000);const next=new URLSearchParams(query);next.set('cursor',first.page.nextCursor);const second=await f.feed.list(f.user.idToken,next);assert.equal(second.page.items.length,1);assert.equal(second.page.catalogueRevision,first.page.catalogueRevision);assert.equal(new Set([...first.page.items,...second.page.items].map(o=>o.id)).size,3);
 const job=await f.add({category:'job',title:'Authored job category'});const filtered=await f.feed.list(f.user.idToken,new URLSearchParams({category:'job',q:'job category'}));assert.deepEqual(filtered.page.items.map(o=>o.id),[job]);
 await assert.rejects(f.feed.list(f.user.idToken,new URLSearchParams({limit:'0'})),{code:'INVALID_QUERY'});
});
test('a changed private inventory invalidates continuations and in-flight mixed-version reads',async()=>{
 const f=await fixture({count:2}),query=new URLSearchParams({limit:'1'}),first=await f.feed.list(f.user.idToken,query);await f.add();query.set('cursor',first.page.nextCursor);await assert.rejects(f.feed.list(f.user.idToken,query),{code:'STALE_CURSOR'});
 const preview=f.store.previewPublication.bind(f.store);let changed=false;f.store.previewPublication=async(...args)=>{const r=await preview(...args);if(!changed){changed=true;await f.add();}return r;};await assert.rejects(f.feed.list(f.user.idToken),{code:'PRIVATE_FEED_CHANGED'});
});
test('revocation or exact reviewer-role expiry during a read refuses the entire response',async()=>{
 const f=await fixture(),preview=f.store.previewPublication.bind(f.store);f.store.previewPublication=async(...args)=>{const p=await preview(...args);await f.store.ref('operators',f.user.localId).update({active:false});return p;};await assert.rejects(f.feed.list(f.user.idToken),{code:'FORBIDDEN'});
 await f.store.ref('operators',f.user.localId).set({active:true,roles:['reviewer'],roleExpiries:{reviewer:f.now()}});await assert.rejects(f.feed.detail(f.user.idToken,f.ids[0]),{code:'FORBIDDEN'});
});
test('elapsed closing dates disappear from discovery and become review-only saved references',async()=>{
 const f=await fixture();assert.equal((await f.feed.list(f.user.idToken)).page.items.length,1);f.advance(24*3600000);
 assert.equal((await f.feed.list(f.user.idToken)).page.items.length,0);const detail=await f.feed.detail(f.user.idToken,f.ids[0]);assert.equal(detail.projection.kind,'status');assert.equal(detail.projection.status.status,'under_review');assert.doesNotMatch(JSON.stringify(detail),/Authored private notice/);
});
test('source pause, withheld/public dispositions and unsupported source scopes cannot leak preview facts',async()=>{
 const f=await fixture({count:3});for(const [i,kind]of ['withheld','public'].entries()){
  const r=await f.store.inspect(f.user.idToken,'drafts',f.ids[i]);if(kind==='withheld')r.publication.disposition='withheld';else{r.publication.approved=true;r.publication.previouslyPublic=true;r.publication.disposition='clear';r.lifecycle='published';}await f.store.ref('drafts',r.id).set(payload(r));
 }
 assert.equal((await f.feed.list(f.user.idToken)).page.items.length,1);await assert.rejects(f.feed.detail(f.user.idToken,f.ids[0]),{code:'NOT_FOUND'});
 await f.store.ref('sources',f.sourceId).set(payload({...f.source,paused:true}));assert.equal((await f.feed.list(f.user.idToken)).page.items.length,0);assert.equal((await f.feed.detail(f.user.idToken,f.ids[2])).projection.kind,'status');
 const other=new PrivateApplicantFeed(f.store,{enabled:true,sourceIds:['different_authored_source']});assert.equal((await other.list(f.user.idToken)).page.items.length,0);await assert.rejects(other.detail(f.user.idToken,f.ids[2]),{code:'NOT_FOUND'});
});
test('automatic-check expiry remains enforced by the existing read-only preview gate',async()=>{
 const f=await fixture(),r=await f.store.inspect(f.user.idToken,'drafts',f.ids[0]);r.checks=[{id:'authored_auto',scope:'requirements',outcome:'supported',method:'automatic',checkedAt:f.now(),nextCheckAt:'2026-10-29T10:01:00.000Z',reviewerId:'authored_worker',citationIds:[r.citations[0].id],recordRevision:r.revision,destination:null,public:true,notes:'PRIVATE_CHECK_SENTINEL'}];await f.store.ref('drafts',r.id).set(payload(r));
 assert.equal((await f.feed.list(f.user.idToken)).page.items.length,1);f.advance(60000);assert.equal((await f.feed.list(f.user.idToken)).page.items.length,0);assert.equal((await f.feed.detail(f.user.idToken,r.id)).projection.kind,'status');
});
test('bounded draft inventory refuses overflow rather than truncating private results',async()=>{
 const f=await fixture({count:0}),batch=runtime.db.batch();for(let i=0;i<101;i++)batch.set(f.store.ref('drafts','authored_capacity_'+i),payload({id:'authored_capacity_'+i}));await batch.commit();await assert.rejects(f.feed.list(f.user.idToken),{code:'PRIVATE_FEED_CAPACITY'});
});
