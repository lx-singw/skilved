import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Catalogue } from '../src/store.mjs';
import { SuggestionReceipts } from '../src/suggestion-receipts.mjs';
import { SuggestionAdmission } from '../src/suggestion-admission.mjs';
import { SuggestionReview } from '../src/suggestion-review.mjs';
import { SuggestionLeases } from '../src/suggestion-leases.mjs';
import { SuggestionWork } from '../src/suggestion-records.mjs';

const start='2026-10-16T12:00:00.000Z',urls=['https://source.example/a','https://source.example/b'];
const source={id:'source',revision:1,name:'Synthetic only',urls,
  permission:{reference:'Synthetic fixture only',method:'structured_json',reuse:'Test only',reviewedAt:start},
  categories:['bursary','learnership','apprenticeship','internship','graduate_programme','job'],owner:'source',paused:false,cadenceHours:24,maxBytes:500000};
const policy={intakeEnabled:true,maxWork:100,maxReceipts:500,createAttemptsPerHour:50,statusReadsPerHour:600,receiptTtlMs:86400000};
const collections=['sources','suggestion_state','suggestion_receipts','suggestion_replays','suggestion_public_replays','suggestion_work','suggestion_limits','operators','audit','public'];
const random=()=>randomBytes(32).toString('hex'),json=v=>({json:JSON.stringify(v)}),access=v=>({receiptId:v.receiptId,capability:v.capability});
let app,db,receipts,admission,catalogue,review,leases,now;
const data=async ref=>JSON.parse((await ref.get()).data().json);
const rows=async name=>(await db.collection('m0_'+name).get()).docs;
const code=(promise,expected)=>assert.rejects(promise,e=>e.code===expected);
const create=async(url=urls[0])=>(await admission.create({url},random())).access;
const work=async entry=>data(admission.workRef((await data(receipts.receiptRef(entry.receiptId))).workId));
const acquire=async(entry,token='source')=>{const w=await work(entry);return leases.acquire(token,{workId:w.id,expectedRevision:w.revision});};
const command=(lease,outcome='reviewing')=>({workId:lease.workId,leaseId:lease.leaseId,generation:lease.generation,outcome});
const complete=(lease,outcome='reviewing',token='source')=>leases.complete(token,command(lease,outcome));
const withdraw=entry=>admission.withdraw(access(entry));
const snapshot=()=>Promise.all(['suggestion_receipts','suggestion_work','audit','public'].map(async name=>[name,(await rows(name)).map(row=>[row.id,row.data()])]));
before(()=>{
  assert.match(process.env.FIRESTORE_EMULATOR_HOST??'',/^127\.0\.0\.1:[1-9]\d{3,4}$/);assert.equal(process.env.GCLOUD_PROJECT,'demo-skilved-b03');
  app=initializeApp({projectId:'demo-skilved-suggestion-leases'},'suggestion-lease-test');db=getFirestore(app);
  receipts=new SuggestionReceipts(db,{keyRing:{activeKeyId:'test1',keys:[{id:'test1',secret:'a1'.repeat(32)}]},maxTtlMs:86400000,now:()=>now});
  catalogue=new Catalogue(db,{verifyIdToken:async token=>{if(['source','other','guest'].includes(token))return{uid:token};throw new Error();}},()=>now);
});
beforeEach(async()=>{
  for(const name of collections){const docs=await rows(name),batch=db.batch();for(const doc of docs)batch.delete(doc.ref);if(docs.length)await batch.commit();}
  now=start;admission=new SuggestionAdmission(db,receipts,policy);review=new SuggestionReview(admission,catalogue);leases=new SuggestionLeases(admission,catalogue,{leaseMs:10000});
  await db.doc('m0_sources/source').set(json(source));await admission.stateRef().set(json({schemaVersion:1,revision:1,workCount:0,receiptCount:0}));
  for(const uid of ['source','other','guest'])await db.doc('m0_operators/'+uid).set({active:true,roles:uid==='guest'?['reviewer']:['source']});
});
after(async()=>{await db?.terminate();if(app)await deleteApp(app);});

test('explicit bounded configuration and strict commands never grant worker/publication authority',async()=>{
  for(const leaseMs of [undefined,0,-1,1.5,30001])assert.throws(()=>new SuggestionLeases(admission,catalogue,{leaseMs}),e=>e.code==='SUGGESTION_UNAVAILABLE');
  const a=await create(),w=await work(a);
  for(const patch of [{expectedRevision:0},{worker:'PRIVATE'},{url:urls[0]}])await code(leases.acquire('source',{workId:w.id,expectedRevision:w.revision,...patch}),'INVALID_COMMAND');
  const lease=await acquire(a);
  for(const patch of [{outcome:'resolved_to_listing'},{publicResultIds:['private_draft']},{notes:'PRIVATE'},{generation:0},{leaseId:'short'}])
    await code(leases.complete('source',{...command(lease),...patch}),'INVALID_COMMAND');
  assert.equal((await rows('public')).length,0);
});

test('current source role, verified owner and active role are required for lease completion',async()=>{
  const a=await create();for(const [token,expected] of [['invalid','UNAUTHORIZED'],['guest','FORBIDDEN']])await code(acquire(a,token),expected);
  const lease=await acquire(a),before=await snapshot();await code(complete(lease,'reviewing','other'),'FORBIDDEN');assert.deepEqual(await snapshot(),before);
  await db.doc('m0_operators/source').update({active:false});await code(complete(lease),'FORBIDDEN');await db.doc('m0_operators/source').update({active:true});
  await complete(lease);assert.equal((await admission.status(access(a))).status,'reviewing');
});

test('global contention admits one current lease across different work and never starts execution',async()=>{
  const a=await create(),b=await create(urls[1]),result=await Promise.allSettled([acquire(a),acquire(b)]);
  assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.equal(result.filter(r=>r.status==='rejected'&&r.reason.code==='CONFLICT').length,1);
  assert.equal((await rows('audit')).length,1);assert.equal((await rows('public')).length,0);
  for(const entry of [a,b])assert.equal((await admission.status(access(entry))).status,'received');
  const winning=result.find(r=>r.status==='fulfilled').value;assert.deepEqual(Object.keys(winning).sort(),['workId','leaseId','generation','expiresAt'].sort());
  const audit=await data((await rows('audit'))[0].ref);assert.equal(audit.action,'suggestions.lease.acquire');assert.ok(!JSON.stringify(audit).includes(winning.leaseId));
});

test('cancellation before acquisition prevents leasing and re-admission cannot revive an older generation',async()=>{
  const a=await create();await withdraw(a);const before=await snapshot();await code(acquire(a),'CONFLICT');assert.deepEqual(await snapshot(),before);
  const b=await create(),lease=await acquire(b);await complete(lease);await code(admission.status(access(a)),'SUGGESTION_NOT_FOUND');
  assert.equal((await admission.status(access(b))).status,'reviewing');
});

test('last withdrawal after acquisition clears lease and stale completion cannot overwrite new admission',async()=>{
  const a=await create(),lease=await acquire(a);await withdraw(a);const cancelled=await work(a);assert.equal(cancelled.lease,null);assert.equal(cancelled.state,'cancelled');
  const b=await create(),before=await snapshot();await code(complete(lease),'CONFLICT');assert.deepEqual(await snapshot(),before);
  const fresh=await acquire(b);assert.ok(fresh.generation>lease.generation);await complete(fresh);assert.equal((await work(b)).lease,null);
});

test('partial withdrawal and new references preserve a needed lease and completion updates only surviving receipts',async()=>{
  const a=await create(),b=await create(),lease=await acquire(a);await withdraw(a);const c=await create();
  assert.equal((await work(b)).lease.id,lease.leaseId);assert.equal((await work(b)).generation,lease.generation);
  const revoked=await data(receipts.receiptRef(a.receiptId));await complete(lease);
  assert.deepEqual(await data(receipts.receiptRef(a.receiptId)),revoked);for(const entry of [b,c])assert.equal((await admission.status(access(entry))).status,'reviewing');
});

test('expired lease completion is read-only; reclaim uses a new ID/generation and rejects old completion',async()=>{
  const a=await create(),first=await acquire(a);now=first.expiresAt;const before=await snapshot();await code(complete(first),'CONFLICT');assert.deepEqual(await snapshot(),before);
  const second=await acquire(a);assert.notEqual(second.leaseId,first.leaseId);assert.ok(second.generation>first.generation);
  await code(complete(first),'CONFLICT');await complete(second,'unresolved');assert.equal((await admission.status(access(a))).status,'unresolved');
});

test('expired references block both acquisition and an existing lease handoff without extending receipt expiry',async()=>{
  const a=await create(),ref=receipts.receiptRef(a.receiptId),original=await data(ref);await ref.set(json({...original,expiresAt:'2026-10-16T12:00:01.000Z'}));
  const lease=await acquire(a);now='2026-10-16T12:00:02.000Z';const before=await snapshot();await code(complete(lease),'CONFLICT');assert.deepEqual(await snapshot(),before);
  now=lease.expiresAt;await code(acquire(a),'CONFLICT');assert.deepEqual(await snapshot(),before);
});

test('source pause/revision/permission/allowlist/ambiguity changes fence completion without side effects',async()=>{
  const a=await create(),lease=await acquire(a);
  for(const [patch,expected] of [[{paused:true},'SUGGESTION_PAUSED'],[{revision:2},'SUGGESTION_SOURCE_CHANGED'],
    [{permission:{...source.permission,reuse:'Changed'}},'SUGGESTION_SOURCE_CHANGED'],[{urls:[urls[1]]},'SUGGESTION_SOURCE_CHANGED']]){
    await db.doc('m0_sources/source').set(json({...source,...patch}));const before=await snapshot();await code(complete(lease),expected);assert.deepEqual(await snapshot(),before);
  }
  await db.doc('m0_sources/source').set(json(source));await db.doc('m0_sources/overlap').set(json({...source,id:'overlap'}));
  await code(complete(lease),'SUGGESTION_SOURCE_CHANGED');await db.doc('m0_sources/overlap').delete();await complete(lease);
});

test('reviewer decision clears active lease and fences its later completion',async()=>{
  const a=await create(),lease=await acquire(a),w=await work(a);await review.decide('source',{workId:w.id,expectedRevision:w.revision,outcome:'unresolved'});
  const before=await snapshot();await code(complete(lease),'CONFLICT');assert.deepEqual(await snapshot(),before);assert.equal((await work(a)).lease,null);
});

test('concurrent completion and final withdrawal always end revoked/cancelled in either serialization',async()=>{
  const a=await create(),lease=await acquire(a),result=await Promise.allSettled([complete(lease),withdraw(a)]);assert.equal(result[1].status,'fulfilled');
  if(result[0].status==='rejected')assert.equal(result[0].reason.code,'CONFLICT');
  const w=await work(a);assert.equal(w.state,'cancelled');assert.equal(w.lease,null);assert.equal(w.referenceCount,0);
  assert.equal((await data(receipts.receiptRef(a.receiptId))).status,'withdrawn');
});

test('concurrent completion and fresh admission preserve reference counts and the resulting shared outcome',async()=>{
  const a=await create(),lease=await acquire(a),result=await Promise.all([complete(lease),create()]),b=result[1],w=await work(b);
  assert.equal(w.receiptCount,2);assert.equal(w.referenceCount,2);assert.equal(w.state,'reviewing');assert.equal(w.lease,null);
  for(const entry of [a,b])assert.equal((await admission.status(access(entry))).status,'reviewing');
});

test('wrong lease identity, future clocks, corrupt state and generation overflow never partially persist',async()=>{
  const a=await create(),lease=await acquire(a),ref=admission.workRef(lease.workId),original=await data(ref);
  for(const patch of [{leaseId:random()},{generation:lease.generation+1},{workId:random()}]){
    const before=await snapshot();await code(leases.complete('source',{...command(lease),...patch}),'CONFLICT');assert.deepEqual(await snapshot(),before);
  }
  now='2026-10-16T11:59:59.000Z';await code(complete(lease),'CONFLICT');now=start;
  await ref.set(json({...original,generation:Number.MAX_SAFE_INTEGER,lease:{...original.lease,generation:Number.MAX_SAFE_INTEGER}}));
  const before=await snapshot();await code(complete({...lease,generation:Number.MAX_SAFE_INTEGER}),'SUGGESTION_UNAVAILABLE');assert.deepEqual(await snapshot(),before);
  for(const patch of [{lease:{...original.lease,generation:0}},{lease:{...original.lease,expiresAt:'2026-10-16T12:00:31.000Z'}},
    {lease:{...original.lease,id:'short'}},{state:'cancelled'},{lease:{...original.lease,notes:'PRIVATE'}}])assert.equal(SuggestionWork.safeParse({...original,...patch}).success,false);
});
