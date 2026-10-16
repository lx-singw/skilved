import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { projectOpportunity } from '@skilved/types/opportunities/internal';
import { makeRecord } from '../../types/tests/fixtures/opportunities.mjs';
import { Catalogue } from '../src/store.mjs';
import { SuggestionReceipts } from '../src/suggestion-receipts.mjs';
import { SuggestionAdmission } from '../src/suggestion-admission.mjs';
import { SuggestionReview } from '../src/suggestion-review.mjs';
import { SuggestionWork } from '../src/suggestion-records.mjs';
import { handleSuggestion } from '../src/suggestion-http.mjs';

const start='2026-10-16T12:00:00.000Z',url='https://source.example/notice';
const source={id:'test_source',revision:1,name:'Synthetic only',urls:[url],
  permission:{reference:'Synthetic fixture only',method:'structured_json',reuse:'Test only',reviewedAt:start},
  categories:['bursary','learnership','apprenticeship','internship','graduate_programme','job'],owner:'source',paused:false,cadenceHours:24,maxBytes:500000};
const policy={intakeEnabled:true,maxWork:100,maxReceipts:500,createAttemptsPerHour:50,statusReadsPerHour:600,receiptTtlMs:86400000};
const names=['sources','suggestion_state','suggestion_receipts','suggestion_replays','suggestion_public_replays','suggestion_work','suggestion_limits','operators','audit','public','drafts','snapshots','aliases'];
const random=()=>randomBytes(32).toString('hex'),json=v=>({json:JSON.stringify(v)}),access=v=>({receiptId:v.receiptId,capability:v.capability});
let app,db,receipts,admission,review,now;
const data=async ref=>JSON.parse((await ref.get()).data().json);
const set=(name,id,v)=>db.doc('m0_'+name+'/'+id).set(json(v));
const rows=async name=>(await db.collection('m0_'+name).get()).docs;
const code=(promise,expected)=>assert.rejects(promise,e=>e.code===expected);
const create=async(key=random(),target=admission)=>(await target.create({url},key)).access;
const withdraw=(entry,target=admission)=>target.withdraw(access(entry));
const status=entry=>admission.status(access(entry));
async function work(entry){return data(admission.workRef((await data(receipts.receiptRef(entry.receiptId))).workId));}
async function snapshot(){return Promise.all(['suggestion_receipts','suggestion_work','suggestion_replays','suggestion_state','public','drafts','audit'].map(async name=>[name,(await rows(name)).map(row=>[row.id,row.data()])]));}
async function decide(entry,outcome,ids=[]){const w=await work(entry);return review.decide('source',{workId:w.id,expectedRevision:w.revision,outcome,publicResultIds:ids});}
before(()=>{
  assert.match(process.env.FIRESTORE_EMULATOR_HOST??'',/^127\.0\.0\.1:[1-9]\d{3,4}$/);assert.equal(process.env.GCLOUD_PROJECT,'demo-skilved-b03');
  app=initializeApp({projectId:'demo-skilved-withdrawal'},'suggestion-withdrawal-test');db=getFirestore(app);
  receipts=new SuggestionReceipts(db,{keyRing:{activeKeyId:'test1',keys:[{id:'test1',secret:'a1'.repeat(32)}]},maxTtlMs:86400000,now:()=>now});
});
beforeEach(async()=>{
  for(const name of names){const docs=await rows(name),batch=db.batch();for(const doc of docs)batch.delete(doc.ref);if(docs.length)await batch.commit();}
  now=start;admission=new SuggestionAdmission(db,receipts,policy);
  review=new SuggestionReview(admission,new Catalogue(db,{verifyIdToken:async token=>{if(token==='source')return{uid:'source'};throw new Error();}},()=>now));
  await set('sources',source.id,source);await admission.stateRef().set(json({schemaVersion:1,revision:1,workCount:0,receiptCount:0}));
  await db.doc('m0_operators/source').set({active:true,roles:['source']});
});
after(async()=>{await db?.terminate();if(app)await deleteApp(app);});

test('one withdrawal revokes only its receipt; surviving review/credentials and all retained slots remain unchanged',async()=>{
  const a=await create(),b=await create();await decide(a,'reviewing');const old=await work(a),br=await data(receipts.receiptRef(b.receiptId)),state=await data(admission.stateRef());
  now='2026-10-16T12:01:00.000Z';assert.deepEqual(await withdraw(a),{schemaVersion:1,receiptId:a.receiptId,status:'withdrawn'});
  const revoked=await data(receipts.receiptRef(a.receiptId)),next=await work(b);
  assert.equal(revoked.status,'withdrawn');assert.equal(revoked.revokedAt,now);assert.deepEqual(revoked.publicResultIds,[]);assert.equal(revoked.expiresAt,a.expiresAt);
  assert.equal(next.referenceCount,1);assert.equal(next.receiptCount,2);assert.equal(next.generation,old.generation);assert.equal(next.state,'reviewing');
  assert.deepEqual(await data(receipts.receiptRef(b.receiptId)),br);assert.deepEqual(await data(admission.stateRef()),state);
  await code(status(a),'SUGGESTION_NOT_FOUND');assert.equal((await status(b)).status,'reviewing');assert.equal((await rows('audit')).length,1);
});

test('last needed withdrawal cancels and fences work without deleting independently approved public facts',async()=>{
  const a=await create(),record=makeRecord('job');record.id='public_result';record.citations[0].url=url;
  await set('drafts',record.id,record);await set('public',record.id,projectOpportunity(record));
  await set('snapshots','snapshot_fixture_1',{id:'snapshot_fixture_1',sourceId:source.id,sourceRevision:1,url,retrievedAt:start});
  await decide(a,'resolved_to_listing',[record.id]);const old=await work(a),before=[(await rows('public'))[0].data(),(await rows('drafts'))[0].data()];
  await withdraw(a);const next=await work(a);assert.equal(next.state,'cancelled');assert.equal(next.referenceCount,0);assert.equal(next.receiptCount,1);
  assert.equal(next.generation,old.generation+1);assert.deepEqual(next.publicResultIds,[]);
  assert.deepEqual([(await rows('public'))[0].data(),(await rows('drafts'))[0].data()],before);
  assert.equal((await admission.create({url},random())).kind,'approved');
});

test('wrong/missing/cross-receipt/expired/revoked credentials are nonenumerating and never mutate private work',async()=>{
  const a=await create(),b=await create(),before=await snapshot();
  for(const invalid of [null,{},a,{receiptId:a.receiptId},{receiptId:random(),capability:a.capability},{receiptId:a.receiptId,capability:b.capability},
    {...access(a),notes:'PRIVATE'},{receiptId:a.receiptId,capability:'a'.repeat(64)+'\n'}])await code(admission.withdraw(invalid),'SUGGESTION_NOT_FOUND');
  assert.deepEqual(await snapshot(),before);now=a.expiresAt;await code(withdraw(a),'SUGGESTION_NOT_FOUND');assert.deepEqual(await snapshot(),before);
  now=start;await withdraw(a);const after=await snapshot();await code(withdraw(a),'SUGGESTION_NOT_FOUND');assert.deepEqual(await snapshot(),after);
});

test('revoked create replay stays dead after service recreation; fresh keys restart cancelled work in a new generation',async()=>{
  const key=random(),a=await create(key),old=await work(a),map=await data(receipts.replayRef(key));await withdraw(a);
  const cancelled=await work(a),restarted=new SuggestionAdmission(db,receipts,policy);await code(create(key,restarted),'SUGGESTION_NOT_FOUND');
  assert.deepEqual(await data(receipts.replayRef(key)),map);const b=await create(random(),restarted),next=await work(b);
  assert.notEqual(a.receiptId,b.receiptId);assert.equal(next.state,'pending');assert.equal(next.referenceCount,1);assert.equal(next.receiptCount,2);
  assert.equal(cancelled.generation,old.generation+1);assert.equal(next.generation,cancelled.generation+1);
  await code(status(a),'SUGGESTION_NOT_FOUND');await code(create(key,restarted),'SUGGESTION_NOT_FOUND');assert.equal((await status(b)).status,'received');
});

test('withdrawal remains possible with intake off and paused, removed or corrupt source records',async()=>{
  const a=await create(),b=await create(),c=await create(),off=new SuggestionAdmission(db,receipts,{...policy,intakeEnabled:false});
  await set('sources',source.id,{...source,paused:true});await withdraw(a,off);
  await db.doc('m0_sources/'+source.id).delete();await withdraw(b,off);
  await db.doc('m0_sources/'+source.id).set({json:'PRIVATE_CORRUPT'});await withdraw(c,off);assert.equal((await work(c)).state,'cancelled');
});

test('an expired unrevoked reference does not keep cancelled work needed; retained/reference counts remain distinct',async()=>{
  const a=await create(),b=await create(),ref=receipts.receiptRef(a.receiptId),record=await data(ref);
  await ref.set(json({...record,expiresAt:'2026-10-16T12:00:01.000Z'}));now='2026-10-16T12:01:00.000Z';await withdraw(b);
  const next=await work(b);assert.equal(next.state,'cancelled');assert.equal(next.receiptCount,2);assert.equal(next.referenceCount,1);
  assert.deepEqual(await data(ref),{...record,expiresAt:'2026-10-16T12:00:01.000Z'});await code(status(a),'SUGGESTION_NOT_FOUND');
});

test('concurrent last withdrawals decrement exactly once each and cancel one generation',async()=>{
  const a=await create(),b=await create(),old=await work(a);const result=await Promise.all([withdraw(a),withdraw(b)]);assert.equal(result.length,2);
  const next=await work(a);assert.equal(next.referenceCount,0);assert.equal(next.receiptCount,2);assert.equal(next.generation,old.generation+1);assert.equal(next.state,'cancelled');
  for(const entry of [a,b])await code(status(entry),'SUGGESTION_NOT_FOUND');
});

test('same-receipt concurrent withdrawal has one acknowledgement and one not-found without double decrement',async()=>{
  const a=await create(),results=await Promise.allSettled([withdraw(a),withdraw(a)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.code==='SUGGESTION_NOT_FOUND').length,1);
  assert.equal((await work(a)).referenceCount,0);assert.equal((await data(receipts.receiptRef(a.receiptId))).revision,2);
});

test('withdrawal versus fresh admission preserves new access in either valid serialization',async()=>{
  const a=await create(),old=await work(a),result=await Promise.all([withdraw(a),create()]),b=result[1],next=await work(b);
  assert.equal(next.referenceCount,1);assert.equal(next.receiptCount,2);assert.equal(next.state,'pending');
  assert.ok([old.generation,old.generation+2].includes(next.generation));assert.equal((await status(b)).status,'received');await code(status(a),'SUGGESTION_NOT_FOUND');
});

test('withdrawal versus review never rewrites revoked receipt or leaves cancelled work resolved',async()=>{
  const a=await create(),w=await work(a),result=await Promise.allSettled([withdraw(a),review.decide('source',{workId:w.id,expectedRevision:w.revision,outcome:'reviewing'})]);
  assert.equal(result[0].status,'fulfilled');if(result[1].status==='rejected')assert.equal(result[1].reason.code,'CONFLICT');
  assert.equal((await work(a)).state,'cancelled');const record=await data(receipts.receiptRef(a.receiptId));assert.equal(record.status,'withdrawn');assert.equal(record.revokedAt,start);
  const cancelled=await work(a);await code(review.decide('source',{workId:cancelled.id,expectedRevision:cancelled.revision,outcome:'reviewing'}),'CONFLICT');
});

test('legacy absent counts derive from actual receipts; explicit wrong counts and unknown generation fields fail closed',async()=>{
  const a=await create(),b=await create(),ref=admission.workRef((await work(a)).id),old=await data(ref);
  const {referenceCount,generation,...legacy}=old;assert.equal(referenceCount,2);assert.equal(generation,1);await ref.set(json(legacy));
  await withdraw(a);assert.equal((await work(b)).referenceCount,1);assert.equal((await work(b)).generation,1);
  const current=await data(ref);await ref.set(json({...current,referenceCount:0}));const before=await snapshot();await code(withdraw(b),'SUGGESTION_UNAVAILABLE');assert.deepEqual(await snapshot(),before);
  for(const patch of [{referenceCount:null},{referenceCount:501},{referenceCount:3},{generation:0},{generation:1.5},{lease:'PRIVATE'}])
    assert.equal(SuggestionWork.safeParse({...current,...patch}).success,false);
});

test('withdrawal failures preserve receipt/work/replay and enforce physical capacity, safe integer and clock bounds',async()=>{
  const a=await create(),wr=admission.workRef((await work(a)).id),rr=receipts.receiptRef(a.receiptId),w=await data(wr),r=await data(rr);
  for(const [ref,patch] of [[wr,{revision:Number.MAX_SAFE_INTEGER}],[wr,{generation:Number.MAX_SAFE_INTEGER}],
    [rr,{revision:Number.MAX_SAFE_INTEGER}],[wr,{updatedAt:'2026-10-16T13:00:00.000Z'}],[rr,{updatedAt:'2026-10-16T13:00:00.000Z'}]]){
    await ref.set(json({...await data(ref),...patch}));const before=await snapshot();await code(withdraw(a),'SUGGESTION_UNAVAILABLE');assert.deepEqual(await snapshot(),before);
    await wr.set(json(w));await rr.set(json(r));
  }
  const bounded=new SuggestionAdmission(db,receipts,{...policy,maxReceipts:1});await withdraw(a,bounded);await code(create(random(),bounded),'SUGGESTION_CAPACITY');
  assert.equal((await data(admission.stateRef())).receiptCount,1);assert.equal((await rows('suggestion_replays')).length,1);
});

test('credential-operation budget includes failed/repeated withdrawal and cannot be refunded by rollback',async()=>{
  const a=await create(),bounded=new SuggestionAdmission(db,receipts,{...policy,intakeEnabled:false,statusReadsPerHour:3});
  await code(bounded.withdraw({...access(a),capability:random()}),'SUGGESTION_NOT_FOUND');await withdraw(a,bounded);
  await code(withdraw(a,bounded),'SUGGESTION_NOT_FOUND');await code(withdraw(a,bounded),'SUGGESTION_RATE_LIMITED');
  const counters=await rows('suggestion_limits');assert.equal(JSON.parse(counters.find(row=>row.id.startsWith('status_')).data().json).count,3);
});

test('wrong credentials fail before corrupt inventory is inspected; disabled DELETE cannot call backend',async()=>{
  const a=await create();await admission.stateRef().set({json:'PRIVATE_CORRUPT'});
  await code(admission.withdraw({...access(a),capability:random()}),'SUGGESTION_NOT_FOUND');await code(withdraw(a),'SUGGESTION_UNAVAILABLE');
  let calls=0;const response=await handleSuggestion(new Request('https://skilved.example/api/v1/opportunity-suggestions/'+a.receiptId,{method:'DELETE',headers:{Authorization:'Bearer '+a.capability}}),{
    config:{enabled:false,intakeEnabled:false,origin:'https://skilved.example'},provider:async()=>{calls++;return admission;}});
  assert.equal(response.status,503);assert.equal(calls,0);assert.equal((await data(receipts.receiptRef(a.receiptId))).revokedAt,null);
});
