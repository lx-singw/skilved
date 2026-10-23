import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Catalogue } from '../src/store.mjs';
import { SuggestionReceipts } from '../src/suggestion-receipts.mjs';
import { SuggestionReplayTickets } from '../src/suggestion-replay-tickets.mjs';
import { SuggestionAdmission } from '../src/suggestion-admission.mjs';
import { SuggestionLeases } from '../src/suggestion-leases.mjs';
import { SuggestionReview } from '../src/suggestion-review.mjs';

const start='2026-10-16T12:00:00.000Z', url='https://source.example/notice';
const epochA='31'.repeat(32), epochB='32'.repeat(32);
const keyRing={activeKeyId:'test',keys:[{id:'test',secret:'a1'.repeat(32)}]};
const policy={intakeEnabled:true,maxWork:3,maxReceipts:8,createAttemptsPerHour:50,statusReadsPerHour:600,receiptTtlMs:86400000};
const source={id:'source',revision:1,name:'Synthetic recovery fixture only',urls:[url],
  permission:{reference:'Synthetic fixture; no real permission',method:'structured_json',reuse:'Test only',reviewedAt:start},
  categories:['bursary','learnership','apprenticeship','internship','graduate_programme','job'],
  owner:'source',paused:false,cadenceHours:24,maxBytes:500000};
const retained=['suggestion_state','suggestion_receipts','suggestion_replays','suggestion_public_replays','suggestion_work'];
const collections=[...retained,'suggestion_limits','sources','operators','audit','public'];
const json=value=>({json:JSON.stringify(value)}), access=value=>({receiptId:value.receiptId,capability:value.capability});
const code=(promise,expected)=>assert.rejects(promise,error=>error.code===expected && error.message===expected);
let app,db,catalogue,now;
function bundle(recoveryEpoch) {
  const receipts=new SuggestionReceipts(db,{keyRing,maxTtlMs:86400000,now:()=>now,recoveryEpoch});
  const tickets=new SuggestionReplayTickets({epoch:'11'.repeat(32),secret:'22'.repeat(32),notBefore:start,
    ttlMs:60000,now:()=>now,recoveryEpoch});
  const admission=new SuggestionAdmission(db,receipts,policy,{replayTickets:tickets});
  return {receipts,tickets,admission,leases:new SuggestionLeases(admission,catalogue,{leaseMs:10000}),
    review:new SuggestionReview(admission,catalogue)};
}
const read=async ref=>JSON.parse((await ref.get()).data().json);
const work=async(b,a)=>read(b.admission.workRef((await read(b.receipts.receiptRef(a.receiptId))).workId));
async function create(b) {
  const issued=await b.admission.issueTicket({url}), result=await b.admission.create({url},issued.ticket);
  return {ticket:issued.ticket,...result.access};
}
const acquire=async(b,a)=>{const w=await work(b,a);return b.leases.acquire('source',{workId:w.id,expectedRevision:w.revision});};
const command=lease=>({workId:lease.workId,leaseId:lease.leaseId,generation:lease.generation,outcome:'reviewing'});
async function snapshot() {
  return Promise.all(retained.map(async name=>[name,(await db.collection('m0_'+name).get()).docs
    .map(row=>[row.id,row.data()]).sort((a,b)=>a[0].localeCompare(b[0]))]));
}
async function restore(saved) {
  // Reapply a previously captured fixture only in this fixed isolated emulator project.
  const batch=db.batch();for(const [name,rows] of saved)for(const [id,value] of rows)batch.set(db.doc('m0_'+name+'/'+id),value);
  await batch.commit();
}
before(()=>{
  assert.match(process.env.FIRESTORE_EMULATOR_HOST??'',/^127\.0\.0\.1:[1-9]\d{3,4}$/);
  assert.equal(process.env.GCLOUD_PROJECT,'demo-skilved-b03');
  app=initializeApp({projectId:'demo-skilved-suggestion-recovery'},'suggestion-recovery-test');db=getFirestore(app);
  catalogue=new Catalogue(db,{verifyIdToken:async token=>{if(token==='source')return{uid:'source'};throw new Error();}},()=>now);
});
beforeEach(async()=>{
  for(const name of collections){const rows=await db.collection('m0_'+name).get(),batch=db.batch();
    for(const row of rows.docs)batch.delete(row.ref);if(rows.size)await batch.commit();}
  now=start;await db.doc('m0_sources/source').set(json(source));
  await db.doc('m0_operators/source').set({active:true,roles:['source']});
  await db.doc('m0_suggestion_state/admission').set(json({schemaVersion:1,revision:1,workCount:0,receiptCount:0}));
});
after(async()=>{await db?.terminate();if(app)await deleteApp(app);});

test('recovery composition cannot omit or disagree on the trusted epoch',async()=>{
  const a=bundle(epochA),b=bundle(epochB),legacy=bundle();
  for(const [receipts,tickets] of [[a.receipts,b.tickets],[a.receipts,legacy.tickets],[legacy.receipts,a.tickets]])
    assert.throws(()=>new SuggestionAdmission(db,receipts,policy,{replayTickets:tickets}),e=>e.code==='SUGGESTION_UNAVAILABLE');
  assert.throws(()=>new SuggestionAdmission(db,a.receipts,policy),e=>e.code==='SUGGESTION_UNAVAILABLE');
  assert.equal(a.receipts.recoveryEpoch,epochA);assert.equal(a.tickets.recoveryEpoch,epochA);
  assert.throws(()=>{a.receipts.recoveryEpoch=epochB;},TypeError);
  assert.equal((await db.collection('m0_suggestion_receipts').get()).size,0);
});

test('restored unrevoked access, replay and unexpired lease fail under a fresh external epoch with identical keys and clock',async()=>{
  const a=bundle(epochA),old=await create(a),lease=await acquire(a,old),saved=await snapshot();
  await a.admission.withdraw(access(old));assert.equal((await work(a,old)).state,'cancelled');
  await restore(saved);assert.deepEqual(await snapshot(),saved);
  const b=bundle(epochB),before=await snapshot();
  await code(b.admission.status(access(old)),'SUGGESTION_NOT_FOUND');
  await code(b.admission.withdraw(access(old)),'SUGGESTION_NOT_FOUND');
  await code(b.admission.create({url},old.ticket),'SUGGESTION_NOT_FOUND');
  await code(b.leases.complete('source',command(lease)),'CONFLICT');
  await code(acquire(b,old),'CONFLICT');
  const w=await work(b,old);
  await code(b.review.decide('source',{workId:w.id,expectedRevision:w.revision,outcome:'reviewing'}),'CONFLICT');
  assert.deepEqual(await snapshot(),before);assert.equal(now,start);
  // A restart with the same current external configuration remains available for fresh issuance.
  const current=await bundle(epochB).admission.issueTicket({url});assert.ok(current.ticket);
});

test('fresh work can share retained history, replace a retired lease and update only current-epoch receipts',async()=>{
  const a=bundle(epochA),old=await create(a),oldLease=await acquire(a,old),saved=await snapshot();
  await a.admission.withdraw(access(old));await restore(saved);
  const oldRecord=await read(a.receipts.receiptRef(old.receiptId)),b=bundle(epochB),current=await create(b);
  assert.notEqual(current.receiptId,old.receiptId);assert.notEqual(current.capability,old.capability);
  const currentRecord=await read(b.receipts.receiptRef(current.receiptId));assert.equal(currentRecord.recoveryEpoch,epochB);
  const lease=await acquire(b,current),w=await work(b,current);
  assert.equal(w.lease.recoveryEpoch,epochB);assert.ok(lease.generation>oldLease.generation);
  await code(b.leases.complete('source',command(oldLease)),'CONFLICT');
  await b.leases.complete('source',command(lease));
  assert.equal((await bundle(epochB).admission.status(access(current))).status,'reviewing');
  assert.deepEqual(await read(a.receipts.receiptRef(old.receiptId)),oldRecord);
  await code(b.admission.status(access(old)),'SUGGESTION_NOT_FOUND');
  const counts=await read(b.admission.stateRef());assert.equal(counts.workCount,1);assert.equal(counts.receiptCount,2);
  const retainedWork=await work(b,current);assert.equal(retainedWork.receiptCount,2);assert.equal(retainedWork.referenceCount,2);
});

test('receipt epoch substitution cannot reuse an old capability MAC or fall back to unscoped derivation',async()=>{
  const a=bundle(epochA),old=await create(a),record=await read(a.receipts.receiptRef(old.receiptId)),b=bundle(epochB);
  assert.equal(b.receipts.derive(record),null);assert.equal(bundle().receipts.derive(record),null);
  const altered={...record,recoveryEpoch:epochB};await b.receipts.receiptRef(old.receiptId).set(json(altered));
  assert.notEqual(b.receipts.derive(altered),old.capability);
  await code(b.admission.status(access(old)),'SUGGESTION_NOT_FOUND');
  await code(b.admission.status({receiptId:old.receiptId,capability:b.receipts.derive(altered)}),'SUGGESTION_NOT_FOUND');
  assert.deepEqual(await read(b.receipts.receiptRef(old.receiptId)),altered);
});

test('legacy snapshots stay physically retained but cannot obtain recovery-mode access or work authority',async()=>{
  const legacy=bundle(),old=await create(legacy),lease=await acquire(legacy,old),saved=await snapshot(),b=bundle(epochA);
  await code(b.admission.status(access(old)),'SUGGESTION_NOT_FOUND');
  await code(b.admission.create({url},old.ticket),'SUGGESTION_NOT_FOUND');
  await code(b.leases.complete('source',command(lease)),'CONFLICT');
  const current=await create(b);assert.notEqual(current.receiptId,old.receiptId);
  assert.equal((await read(b.admission.stateRef())).receiptCount,2);
  const previous=saved.find(([name])=>name==='suggestion_receipts')[1][0][1];
  assert.deepEqual((await legacy.receipts.receiptRef(old.receiptId).get()).data(),previous);
  await code(legacy.admission.status(access(current)),'SUGGESTION_NOT_FOUND');
});

test('withdrawal needs only current-epoch references while retaining old unrevoked rows and generation fences',async()=>{
  const a=bundle(epochA),old=await create(a),oldRecord=await read(a.receipts.receiptRef(old.receiptId)),b=bundle(epochB);
  const first=await create(b),second=await create(b),lease=await acquire(b,first);
  await b.admission.withdraw(access(first));assert.equal((await work(b,second)).lease.id,lease.leaseId);
  assert.equal((await b.admission.status(access(second))).status,'received');
  await b.admission.withdraw(access(second));const cancelled=await work(b,second);
  assert.equal(cancelled.state,'cancelled');assert.equal(cancelled.lease,null);assert.ok(cancelled.generation>lease.generation);
  assert.equal(cancelled.receiptCount,3);assert.equal(cancelled.referenceCount,1);
  assert.deepEqual(await read(a.receipts.receiptRef(old.receiptId)),oldRecord);
  await code(b.leases.complete('source',command(lease)),'CONFLICT');
  assert.equal((await read(b.admission.stateRef())).receiptCount,3);
  assert.equal((await db.collection('m0_suggestion_replays').get()).size,3);
});
