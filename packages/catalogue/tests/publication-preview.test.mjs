import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {getRuntime} from '../src/runtime.mjs';
import {Catalogue} from '../src/store.mjs';
import {allFacts} from '../src/worker-policy.mjs';
import {makeRecord} from '../../types/tests/fixtures/opportunities.mjs';
let runtime;
const now='2026-10-26T03:00:00.000Z',payload=x=>({json:JSON.stringify(x)});
before(async()=>{
 process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-b03';
 runtime=await getRuntime();
});
after(async()=>{await runtime?.db.terminate();});
async function signup(){
 const r=await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fixture`,{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:randomUUID()+'@example.test',password:randomUUID(),returnSecureToken:true})});
 assert.equal(r.status,200);return r.json();
}
async function fixture(){
 const user=await signup(),token=user.idToken,id='preview_'+randomUUID(),snapshotId='snapshot_'+randomUUID();
 const store=new Catalogue(runtime.db,runtime.auth,()=>now);
 await runtime.db.doc('m0_operators/'+user.localId).set({active:true,roles:['reviewer','source']});
 const source={id:'source_'+randomUUID(),revision:1,name:'Synthetic preview source',urls:['https://issuer.example/notice'],
  permission:{reference:'Synthetic preview permission',method:'structured_json',reuse:'Synthetic test only',reviewedAt:now},
  categories:['apprenticeship'],owner:'synthetic_owner',paused:false,cadenceHours:24,maxBytes:500000};
 await store.registerSource(token,source,null,'Register synthetic preview source');
 await runtime.db.doc('m0_snapshots/'+snapshotId).set(payload({id:snapshotId,sourceId:source.id,url:source.urls[0],sourceRevision:1}));
 const record=makeRecord();record.id=id;record.publication.previouslyPublic=false;record.checks=[];
 record.citations[0].snapshotId=snapshotId;allFacts(record).forEach(f=>{if(f.sourceSnapshotIds.length)f.sourceSnapshotIds=[snapshotId];});
 await store.saveDraft(token,record,null,'Create private synthetic preview record');
 return{store,token,id,user,source};
}
async function inventory(){
 const result={};for(const ref of await runtime.db.listCollections())result[ref.id]=(await ref.get()).docs.map(r=>({id:r.id,data:r.data()}));return result;
}

test('publication preview requires a current verified reviewer, exact revision and supported action',async()=>{
 const f=await fixture(),guest=await signup();
 await assert.rejects(f.store.previewPublication('',f.id,1,'publish'),{code:'UNAUTHORIZED'});
 await assert.rejects(f.store.previewPublication(guest.idToken,f.id,1,'publish'),{code:'FORBIDDEN'});
 await assert.rejects(f.store.previewPublication(f.token,f.id,2,'publish'),{code:'CONFLICT'});
 await assert.rejects(f.store.previewPublication(f.token,f.id,1,'delete'),{code:'INVALID_COMMAND'});
 await runtime.db.doc('m0_operators/'+f.user.localId).update({active:false});
 await assert.rejects(f.store.previewPublication(f.token,f.id,1,'publish'),{code:'FORBIDDEN'});
});

test('preview is read-only, excludes private facts and matches later publication of unchanged inputs',async()=>{
 const f=await fixture(),before=await inventory();
 const preview=await f.store.previewPublication(f.token,f.id,1,'publish');
 assert.equal(preview.kind,'publication_preview');assert.equal(preview.publication,false);
 assert.equal(preview.expectedRevision,1);assert.equal(preview.projectedRevision,2);
 assert.equal(preview.projection.opportunity.application.state,'unavailable');
 assert.doesNotMatch(JSON.stringify(preview),/PRIVATE_|reviewedBy|sourceSnapshotIds|reviewerNotes/);
 assert.deepEqual(await inventory(),before);
 await assert.rejects(f.store.detail(f.id),{code:'NOT_FOUND'});
 const actual=await f.store.publish(f.token,f.id,1,'publish','Explicit synthetic reviewer publication');
 assert.equal(actual.catalogueRevision,preview.projectedCatalogueRevision);
 assert.deepEqual(await f.store.detail(f.id),preview.projection);
});

test('a preview cannot authorize execution after source pause or role revocation',async()=>{
 const f=await fixture();
 await f.store.previewPublication(f.token,f.id,1,'publish');
 await f.store.registerSource(f.token,{...f.source,revision:2,paused:true},1,'Pause after preview');
 await assert.rejects(f.store.previewPublication(f.token,f.id,1,'publish'),{code:'SOURCE_PAUSED'});
 await assert.rejects(f.store.publish(f.token,f.id,1,'publish','Reject stale preview'),{code:'SOURCE_PAUSED'});
 await f.store.registerSource(f.token,{...f.source,revision:3},2,'Resume synthetic source');
 await f.store.previewPublication(f.token,f.id,1,'publish');
 await runtime.db.doc('m0_operators/'+f.user.localId).update({active:false});
 await assert.rejects(f.store.publish(f.token,f.id,1,'publish','Role no longer active'),{code:'FORBIDDEN'});
});

test('route checks and withdrawal rules are identical in preview and publication',async()=>{
 const f=await fixture();let record=await f.store.inspect(f.token,'drafts',f.id);record.revision++;
 record.checks=[{id:'synthetic_relationship',scope:'application_relationship',outcome:'supported',checkedAt:now,nextCheckAt:null,
  reviewerId:'untrusted_json_identity',citationIds:['citation_fixture'],recordRevision:2,
  destination:record.applicationRoute.value.destination,public:true,notes:'PRIVATE_PREVIEW_NOTE'}];
 await f.store.saveDraft(f.token,record,1,'Synthetic relationship observation');
 let preview=await f.store.previewPublication(f.token,f.id,2,'publish');
 assert.equal(preview.projection.opportunity.application.state,'available');
 await f.store.publish(f.token,f.id,2,'publish','Explicit synthetic review');
 assert.deepEqual(await f.store.detail(f.id),preview.projection);
 preview=await f.store.previewPublication(f.token,f.id,3,'withdraw');
 await f.store.publish(f.token,f.id,3,'withdraw','Synthetic withdrawal');
 assert.deepEqual(await f.store.detail(f.id),preview.projection);
 await assert.rejects(f.store.previewPublication(f.token,f.id,4,'publish'),{code:'RESTORE_REQUIRES_REVIEW'});
 preview=await f.store.previewPublication(f.token,f.id,4,'restore');assert.equal(preview.projectedRevision,5);
 assert.equal((await f.store.detail(f.id)).status.status,'withdrawn');
 await assert.rejects(f.store.publish(f.token,f.id,3,'restore','Stale preview revision'),{code:'CONFLICT'});
});

test('publication and restore cannot turn an expired automatic check into a permanent human check',async()=>{
 const f=await fixture();let record=await f.store.inspect(f.token,'drafts',f.id);record.revision++;
 record.checks=[{id:'automatic_relationship',scope:'application_relationship',outcome:'supported',method:'automatic',
  checkedAt:'2026-10-26T02:00:00.000Z',nextCheckAt:now,reviewerId:'original_worker',citationIds:['citation_fixture'],
  recordRevision:2,destination:record.applicationRoute.value.destination,public:true,notes:null}];
 await f.store.saveDraft(f.token,record,1,'Synthetic automatic check');
 let preview=await f.store.previewPublication(f.token,f.id,2,'publish');
 assert.equal(preview.projection.kind,'status');assert.equal(preview.projection.status.status,'under_review');
 await f.store.publish(f.token,f.id,2,'publish','Synthetic publication');
 assert.deepEqual(await f.store.detail(f.id),preview.projection);
 assert.equal((await f.store.list(new URLSearchParams())).items.some(item=>item.id===f.id),false);
 record=await f.store.inspect(f.token,'drafts',f.id);
 assert.equal(record.checks[0].method,'automatic');assert.equal(record.checks[0].reviewerId,'original_worker');
 assert.equal(record.checks[0].nextCheckAt,now);
 preview=await f.store.previewPublication(f.token,f.id,3,'restore');
 assert.equal(preview.projection.status.status,'under_review');
 await f.store.publish(f.token,f.id,3,'restore','Synthetic restoration');
 assert.deepEqual(await f.store.detail(f.id),preview.projection);
 record=await f.store.inspect(f.token,'drafts',f.id);record.revision++;
 record.checks=[{...record.checks[0],id:'new_human_check',method:'human',checkedAt:now,nextCheckAt:null,recordRevision:5}];
 await f.store.saveDraft(f.token,record,4,'New synthetic human observation');
 preview=await f.store.previewPublication(f.token,f.id,5,'publish');
 assert.equal(preview.projection.opportunity.application.state,'available');
});

test('a fresh automatic check survives reviewer publication and expires at its original boundary',async()=>{
 const f=await fixture();let clock=Date.parse(now);
 const store=new Catalogue(runtime.db,runtime.auth,()=>new Date(clock).toISOString());
 let record=await store.inspect(f.token,'drafts',f.id);record.revision++;
 const expiry=new Date(clock+1000).toISOString();
 record.checks=[{id:'fresh_automatic',scope:'application_relationship',outcome:'supported',method:'automatic',
  checkedAt:now,nextCheckAt:expiry,reviewerId:'original_worker',citationIds:['citation_fixture'],recordRevision:2,
  destination:record.applicationRoute.value.destination,public:true,notes:null}];
 await store.saveDraft(f.token,record,1,'Synthetic current automatic check');
 const preview=await store.previewPublication(f.token,f.id,2,'publish');
 assert.equal(preview.projection.opportunity.application.state,'available');
 await store.publish(f.token,f.id,2,'publish','Synthetic publication');
 assert.equal((await store.detail(f.id)).kind,'opportunity');clock+=1000;
 assert.equal((await store.detail(f.id)).status.status,'under_review');
 assert.equal((await store.list(new URLSearchParams())).items.some(item=>item.id===f.id),false);
});

test('private automatic checks cannot silently bypass public freshness on publish or restore',async()=>{
 for(const expiry of [now,'2026-10-26T04:00:00.000Z']){
  const f=await fixture();let record=await f.store.inspect(f.token,'drafts',f.id);record.revision++;
  const check={scope:'application_relationship',outcome:'supported',method:'human',checkedAt:now,nextCheckAt:null,
   reviewerId:'reviewer_fixture',citationIds:['citation_fixture'],recordRevision:2,
   destination:record.applicationRoute.value.destination,public:true,notes:null};
  record.checks=[{...check,id:'public_relationship'},
   {...check,id:'private_automatic',scope:'availability',method:'automatic',nextCheckAt:expiry,public:false}];
  await f.store.saveDraft(f.token,record,1,'Synthetic private automatic observation');
  for(const action of ['publish','restore']){
   await assert.rejects(f.store.previewPublication(f.token,f.id,2,action),{code:'PRIVATE_AUTOMATIC_CHECK_UNSUPPORTED'});
   await assert.rejects(f.store.publish(f.token,f.id,2,action,'Reject unsafe projection'),{code:'PRIVATE_AUTOMATIC_CHECK_UNSUPPORTED'});
  }
  await assert.rejects(f.store.detail(f.id),{code:'NOT_FOUND'});
  await f.store.publish(f.token,f.id,2,'withdraw','Withdrawal remains available');
  record=await f.store.inspect(f.token,'drafts',f.id);assert.equal(record.lifecycle,'withdrawn');
 }
});
