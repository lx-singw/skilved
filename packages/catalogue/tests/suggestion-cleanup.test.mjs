import {test,before,beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {Catalogue} from '../src/store.mjs';
import {DomainError} from '../src/config.mjs';
import {SuggestionReceipts} from '../src/suggestion-receipts.mjs';
import {SuggestionReplayTickets} from '../src/suggestion-replay-tickets.mjs';
import {SuggestionAdmission} from '../src/suggestion-admission.mjs';
import {SuggestionCleanup} from '../src/suggestion-cleanup.mjs';
import {SuggestionLeases} from '../src/suggestion-leases.mjs';
import {SuggestionWork} from '../src/suggestion-records.mjs';

const start='2026-10-16T12:00:00.000Z',urls=['https://source.example/a','https://source.example/b'];
const epochA='31'.repeat(32),epochB='32'.repeat(32),none={retiredRecoveryEpochs:[],retireLegacy:false};
const policy={intakeEnabled:true,maxWork:3,maxReceipts:2,createAttemptsPerHour:50,statusReadsPerHour:600,receiptTtlMs:60000};
const source={id:'source',revision:1,name:'Synthetic cleanup fixture',urls,
  permission:{reference:'Synthetic only; no source permission',method:'structured_json',reuse:'Test only',reviewedAt:start},
  categories:['bursary','learnership','apprenticeship','internship','graduate_programme','job'],owner:'source',paused:false,cadenceHours:24,maxBytes:500000};
const names=['sources','suggestion_state','suggestion_receipts','suggestion_replays','suggestion_public_replays','suggestion_work','suggestion_limits','operators','audit','public'];
const json=v=>({json:JSON.stringify(v)}),random=()=>randomBytes(32).toString('hex'),access=v=>({receiptId:v.receiptId,capability:v.capability});
const code=(promise,expected)=>assert.rejects(promise,e=>e.code===expected&&e.message===expected);
let app,db,catalogue,now;
function make(recoveryEpoch,overrides={}) {
  const receipts=new SuggestionReceipts(db,{keyRing:{activeKeyId:'test',keys:[{id:'test',secret:'a1'.repeat(32)}]},
    maxTtlMs:60000,now:()=>now,recoveryEpoch});
  const tickets=new SuggestionReplayTickets({epoch:'11'.repeat(32),secret:'22'.repeat(32),notBefore:start,ttlMs:60000,now:()=>now,recoveryEpoch});
  const admission=new SuggestionAdmission(db,receipts,{...policy,...overrides},{replayTickets:tickets});
  return {receipts,tickets,admission,leases:new SuggestionLeases(admission,catalogue,{leaseMs:10000})};
}
const clean=(b,retirement=none)=>new SuggestionCleanup(b.admission,catalogue,retirement);
const rows=async name=>(await db.collection('m0_'+name).get()).docs;
const read=async ref=>JSON.parse((await ref.get()).data().json);
const at=ms=>{now=new Date(Date.parse(start)+ms).toISOString();};
async function create(b,url=urls[0]) {const issued=await b.admission.issueTicket({url});return {ticket:issued.ticket,...(await b.admission.create({url},issued.ticket)).access};}
const work=async(b,a)=>read(b.admission.workRef((await read(b.receipts.receiptRef(a.receiptId))).workId));
async function command(b,a) {const r=await read(b.receipts.receiptRef(a.receiptId)),w=await work(b,a),s=await read(b.admission.stateRef());
  return {receiptId:r.id,expectedRevision:r.revision,expectedWorkRevision:w.revision,expectedAdmissionRevision:s.revision};}
const remove=async(b,a,retirement=none)=>clean(b,retirement).removeReceipt('source',await command(b,a));
const snapshot=()=>Promise.all(names.map(async name=>[name,(await rows(name)).map(row=>[row.id,row.data()]).sort((a,b)=>a[0].localeCompare(b[0]))]));
const leaseCommand=l=>({workId:l.workId,leaseId:l.leaseId,generation:l.generation,outcome:'reviewing'});
const acquire=async(b,a)=>{const w=await work(b,a);return b.leases.acquire('source',{workId:w.id,expectedRevision:w.revision});};
before(()=>{
  assert.match(process.env.FIRESTORE_EMULATOR_HOST??'',/^127\.0\.0\.1:[1-9]\d{3,4}$/);assert.equal(process.env.GCLOUD_PROJECT,'demo-skilved-b03');
  app=initializeApp({projectId:'demo-skilved-suggestion-cleanup'},'suggestion-cleanup-test');db=getFirestore(app);
  catalogue=new Catalogue(db,{verifyIdToken:async token=>{if(['source','guest'].includes(token))return{uid:token};throw new Error();}},()=>now);
});
beforeEach(async()=>{
  for(const name of names){const docs=await rows(name),batch=db.batch();for(const doc of docs)batch.delete(doc.ref);if(docs.length)await batch.commit();}
  at(0);await db.doc('m0_sources/source').set(json(source));await db.doc('m0_suggestion_state/admission').set(json({schemaVersion:1,revision:1,workCount:0,receiptCount:0}));
  for(const uid of ['source','guest'])await db.doc('m0_operators/'+uid).set({active:true,roles:uid==='source'?['source']:['reviewer']});
});
after(async()=>{await db?.terminate();if(app)await deleteApp(app);});

test('cleanup requires fenced composition and explicit bounded trusted retirement policy',async()=>{
  const b=make(epochA),legacy=make();
  assert.throws(()=>clean(legacy),e=>e.code==='SUGGESTION_UNAVAILABLE');
  for(const retirement of [undefined,{},null,{...none,retireLegacy:1},{...none,extra:true},
    {...none,retiredRecoveryEpochs:[epochA]},{...none,retiredRecoveryEpochs:[epochB,epochB]},
    {...none,retiredRecoveryEpochs:Array.from({length:9},()=>random())}])
    assert.throws(()=>new SuggestionCleanup(b.admission,catalogue,retirement),e=>e.code==='SUGGESTION_UNAVAILABLE');
  assert.throws(()=>new SuggestionCleanup(b.admission,{},none),e=>e.code==='SUGGESTION_UNAVAILABLE');
});

test('identity/source role, strict command and all expected revisions precede deletion or audit',async()=>{
  const b=make(epochA),a=await create(b);at(60000);const c=await command(b,a),before=await snapshot();
  for(const [token,expected] of [['bad','UNAUTHORIZED'],['guest','FORBIDDEN']])await code(clean(b).removeReceipt(token,c),expected);
  for(const patch of [{expectedRevision:0},{url:'PRIVATE'},{retireLegacy:true},{expectedWorkRevision:0}])
    await code(clean(b).removeReceipt('source',{...c,...patch}),'INVALID_COMMAND');
  for(const field of ['expectedRevision','expectedWorkRevision','expectedAdmissionRevision'])
    await code(clean(b).removeReceipt('source',{...c,[field]:c[field]+1}),'CONFLICT');
  assert.deepEqual(await snapshot(),before);
});

test('shorter receipt expiry and revocation cannot remove denial history before the immutable ticket deadline',async()=>{
  const b=make(epochA,{receiptTtlMs:10000}),a=await create(b);at(5000);await b.admission.withdraw(access(a));
  const before=await snapshot();await code(remove(b,a),'CONFLICT');at(10000);await code(remove(b,a),'CONFLICT');
  assert.deepEqual(await snapshot(),before);at(59999);await code(remove(b,a),'CONFLICT');
  at(60000);const result=await remove(b,a);assert.equal(result.removedReceipts,1);assert.equal(result.removedReplayBindings,1);
  assert.equal((await rows('suggestion_receipts')).length,0);assert.equal((await rows('suggestion_replays')).length,0);
  await code(b.admission.create({url:urls[0]},a.ticket),'SUGGESTION_NOT_FOUND');await code(b.admission.status(access(a)),'SUGGESTION_NOT_FOUND');
});

test('exact expiry reclaims saturated receipt capacity while retaining cancelled work and monotone re-admission generation',async()=>{
  const b=make(epochA),a=await create(b),other=await create(b,urls[1]),old=await work(b,a);at(60000);
  const issued=await b.admission.issueTicket({url:urls[0]});await code(b.admission.create({url:urls[0]},issued.ticket),'SUGGESTION_CAPACITY');
  const c=await command(b,a),result=await clean(b).removeReceipt('source',c),anchor=await read(b.admission.workRef(old.id));
  assert.deepEqual(result,{revision:c.expectedAdmissionRevision+1,removedReceipts:1,removedReplayBindings:1,retainedWork:true});
  assert.equal(anchor.receiptCount,0);assert.equal(anchor.referenceCount,0);assert.equal(anchor.state,'cancelled');assert.equal(anchor.lease,null);assert.ok(anchor.generation>old.generation);
  assert.equal((await read(b.admission.stateRef())).workCount,2);assert.equal((await read(b.admission.stateRef())).receiptCount,1);
  await code(clean(b).removeReceipt('source',c),'CONFLICT');
  const next=(await b.admission.create({url:urls[0]},issued.ticket)).access,w=await work(b,next);
  assert.ok(w.generation>anchor.generation);assert.equal(w.receiptCount,1);assert.equal((await read(b.admission.stateRef())).workCount,2);
  assert.equal((await b.admission.status(access(next))).status,'received');assert.ok((await b.receipts.receiptRef(other.receiptId).get()).exists);
});

test('expired shared receipt cleanup preserves another current receipt, its lease and independent public facts',async()=>{
  const b=make(epochA),a=await create(b);at(30000);const other=await create(b),record=await read(b.receipts.receiptRef(other.receiptId));
  at(55000);const lease=await acquire(b,other);await db.doc('m0_public/independent').set({fixture:'preserve'});
  at(60000);const before=await work(b,other);await remove(b,a);const after=await work(b,other);
  assert.equal(after.generation,before.generation);assert.deepEqual(after.lease,before.lease);assert.equal(after.receiptCount,1);assert.equal(after.referenceCount,1);
  assert.deepEqual(await read(b.receipts.receiptRef(other.receiptId)),record);assert.deepEqual((await db.doc('m0_public/independent').get()).data(),{fixture:'preserve'});
  await b.leases.complete('source',leaseCommand(lease));assert.equal((await b.admission.status(access(other))).status,'reviewing');
});

test('epoch mismatch is not retirement proof; explicit trusted retirement removes otherwise live inaccessible history',async()=>{
  const a=make(epochA),old=await create(a),b=make(epochB),before=await snapshot();
  await code(remove(b,old),'CONFLICT');assert.deepEqual(await snapshot(),before);
  await remove(b,old,{retiredRecoveryEpochs:[epochA],retireLegacy:false});
  assert.equal((await rows('suggestion_receipts')).length,0);await code(b.admission.create({url:urls[0]},old.ticket),'SUGGESTION_NOT_FOUND');
  const current=await create(b);assert.equal((await b.admission.status(access(current))).status,'received');
});

test('undated legacy history remains until explicit legacy retirement; current malformed windows are never inferred',async()=>{
  const legacy=make(),raw=random(),old=(await new SuggestionAdmission(db,legacy.receipts,policy).create({url:urls[0]},raw)).access,b=make(epochA);
  await code(remove(b,old),'CONFLICT');await remove(b,old,{retiredRecoveryEpochs:[],retireLegacy:true});
  await code(b.admission.create({url:urls[0]},raw),'SUGGESTION_NOT_FOUND');
  const current=await create(b),map=(await rows('suggestion_replays'))[0],value=JSON.parse(map.data().json);delete value.retainUntil;
  await map.ref.set(json(value));at(60000);const before=await snapshot();await code(remove(b,current),'SUGGESTION_UNAVAILABLE');assert.deepEqual(await snapshot(),before);
});

test('missing, orphaned, duplicate, inconsistent and malformed history never partially deletes',async()=>{
  const b=make(epochA),a=await create(b),map=(await rows('suggestion_replays'))[0],original=map.data(),binding=JSON.parse(original.json);at(60000);
  const patches=[async()=>map.ref.delete(),async()=>map.ref.set(json({...binding,inputHash:'f'.repeat(64)})),
    async()=>map.ref.set(json({...binding,retainUntil:'9999-01-01T00:00:00.000Z'})),async()=>map.ref.set(json({...binding,notes:'PRIVATE'})),
    async()=>db.doc('m0_suggestion_replays/'+'f'.repeat(64)).set(original),
    async()=>db.doc('m0_suggestion_replays/'+'f'.repeat(64)).set(json({...binding,receiptId:'f'.repeat(64)})),
    async()=>map.ref.set({json:' '.repeat(8193)+JSON.stringify(binding)})];
  for(const patch of patches){await patch();const before=await snapshot();await code(remove(b,a),'SUGGESTION_UNAVAILABLE');assert.deepEqual(await snapshot(),before);
    await db.doc('m0_suggestion_replays/'+'f'.repeat(64)).delete();await map.ref.set(original);}
});

test('failure after queued deletes rolls back every deletion, count, work change and audit',async()=>{
  const b=make(epochA),a=await create(b);at(60000);const c=await command(b,a),before=await snapshot(),original=db.runTransaction;
  db.runTransaction=function(update,...options){return original.call(this,tx=>{let deletes=0;const proxy=new Proxy(tx,{get(target,key){
    if(key==='delete')return ref=>{target.delete(ref);if(++deletes===2)throw new DomainError('SUGGESTION_UNAVAILABLE');return proxy;};
    const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});return update(proxy);},...options);};
  try{await code(clean(b).removeReceipt('source',c),'SUGGESTION_UNAVAILABLE');}finally{db.runTransaction=original;}
  assert.deepEqual(await snapshot(),before);
});

test('same-command contention yields one deletion and audit; fresh admission contention preserves coherent counts',async()=>{
  const b=make(epochA),a=await create(b);at(60000);const c=await command(b,a),results=await Promise.allSettled([clean(b).removeReceipt('source',c),clean(b).removeReceipt('source',c)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.code,'CONFLICT');
  assert.equal((await rows('audit')).filter(row=>JSON.parse(row.data().json).action==='suggestions.cleanup.receipt').length,1);
  const first=await create(b);at(120000);const ticket=await b.admission.issueTicket({url:urls[0]}),next=await command(b,first);
  const race=await Promise.allSettled([clean(b).removeReceipt('source',next),b.admission.create({url:urls[0]},ticket.ticket)]);
  assert.equal(race[1].status,'fulfilled');if(race[0].status==='rejected'){assert.equal(race[0].reason.code,'CONFLICT');await remove(b,first);}
  const current=race[1].value.access;assert.equal((await read(b.admission.stateRef())).receiptCount,1);assert.equal((await work(b,current)).receiptCount,1);
  assert.equal((await b.admission.status(access(current))).status,'received');
});

test('cleanup versus another withdrawal cancels final need without stale lease completion or lost decrements',async()=>{
  const b=make(epochA),a=await create(b);at(30000);const other=await create(b);at(55000);const lease=await acquire(b,other);at(60000);
  const c=await command(b,a),race=await Promise.allSettled([clean(b).removeReceipt('source',c),b.admission.withdraw(access(other))]);
  assert.equal(race[1].status,'fulfilled');if(race[0].status==='rejected'){assert.equal(race[0].reason.code,'CONFLICT');await remove(b,a);}
  const w=await work(b,other);assert.equal(w.receiptCount,1);assert.equal(w.referenceCount,0);assert.equal(w.state,'cancelled');assert.equal(w.lease,null);
  await code(b.leases.complete('source',leaseCommand(lease)),'CONFLICT');
  assert.equal(SuggestionWork.safeParse({...w,receiptCount:0,referenceCount:0,state:'pending'}).success,false);
  assert.equal(SuggestionWork.safeParse({...w,receiptCount:0,referenceCount:undefined}).success,false);
});
