import {test,before,beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {projectOpportunity} from '@skilved/types/opportunities/internal';
import {makeRecord} from '../../types/tests/fixtures/opportunities.mjs';
import {Catalogue} from '../src/store.mjs';
import {DomainError} from '../src/config.mjs';
import {SuggestionReceipts} from '../src/suggestion-receipts.mjs';
import {SuggestionReplayTickets} from '../src/suggestion-replay-tickets.mjs';
import {SuggestionAdmission} from '../src/suggestion-admission.mjs';
import {SuggestionCleanup} from '../src/suggestion-cleanup.mjs';
import {SuggestionLeases} from '../src/suggestion-leases.mjs';

const start='2026-10-16T12:00:00.000Z',urls=['https://source.example/a','https://source.example/b'];
const epochA='31'.repeat(32),epochB='32'.repeat(32),none={retiredRecoveryEpochs:[],retireLegacy:false};
const policy={intakeEnabled:true,maxWork:2,maxReceipts:3,createAttemptsPerHour:50,statusReadsPerHour:600,receiptTtlMs:60000};
const source={id:'source',revision:1,name:'Synthetic reclamation fixture',urls,
  permission:{reference:'Synthetic only',method:'structured_json',reuse:'Test only',reviewedAt:start},
  categories:['bursary','learnership','apprenticeship','internship','graduate_programme','job'],owner:'source',paused:false,cadenceHours:24,maxBytes:500000};
const names=['sources','suggestion_state','suggestion_receipts','suggestion_replays','suggestion_public_replays','suggestion_work','suggestion_limits','operators','audit','public','drafts','snapshots','aliases'];
const json=v=>({json:JSON.stringify(v)}),access=v=>({receiptId:v.receiptId,capability:v.capability});
const code=(promise,expected)=>assert.rejects(promise,e=>e.code===expected&&e.message===expected);
let app,db,catalogue,now;
const at=ms=>{now=new Date(Date.parse(start)+ms).toISOString();};
const rows=async name=>(await db.collection('m0_'+name).get()).docs;
const read=async ref=>JSON.parse((await ref.get()).data().json);
const snapshot=()=>Promise.all(names.map(async name=>[name,(await rows(name)).map(row=>[row.id,row.data()]).sort((a,b)=>a[0].localeCompare(b[0]))]));
function make(recoveryEpoch=epochA,overrides={}) {
  const receipts=new SuggestionReceipts(db,{keyRing:{activeKeyId:'test',keys:[{id:'test',secret:'a1'.repeat(32)}]},maxTtlMs:60000,now:()=>now,recoveryEpoch});
  const tickets=new SuggestionReplayTickets({epoch:'11'.repeat(32),secret:'22'.repeat(32),notBefore:start,ttlMs:60000,now:()=>now,recoveryEpoch});
  const admission=new SuggestionAdmission(db,receipts,{...policy,...overrides},{replayTickets:tickets});
  return {receipts,tickets,admission,leases:new SuggestionLeases(admission,catalogue,{leaseMs:10000})};
}
const cleanup=(b,retirement=none)=>new SuggestionCleanup(b.admission,catalogue,retirement);
async function create(b,url=urls[0]) {const issued=await b.admission.issueTicket({url});return {ticket:issued.ticket,...(await b.admission.create({url},issued.ticket)).access};}
const work=async(b,a)=>read(b.admission.workRef((await read(b.receipts.receiptRef(a.receiptId))).workId));
async function removeReceipt(b,a) {const r=await read(b.receipts.receiptRef(a.receiptId)),w=await work(b,a),s=await read(b.admission.stateRef());
  return cleanup(b).removeReceipt('source',{receiptId:r.id,expectedRevision:r.revision,expectedWorkRevision:w.revision,expectedAdmissionRevision:s.revision});}
const workCommand=async(b,w)=>({workId:w.id,expectedWorkRevision:(await read(b.admission.workRef(w.id))).revision,expectedAdmissionRevision:(await read(b.admission.stateRef())).revision});
const removeWork=async(b,w)=>cleanup(b).removeWork('source',await workCommand(b,w));
const leaseCommand=l=>({workId:l.workId,leaseId:l.leaseId,generation:l.generation,outcome:'reviewing'});
async function publish() {
  const record=makeRecord('apprenticeship');record.id='approved_A';record.citations[0].url=urls[0];
  await db.doc('m0_drafts/approved_A').set(json(record));await db.doc('m0_public/approved_A').set(json(projectOpportunity(record)));
  await db.doc('m0_snapshots/snapshot_fixture_1').set(json({id:'snapshot_fixture_1',sourceId:source.id,sourceRevision:1,url:urls[0],retrievedAt:now,hash:'b'.repeat(64),text:'Synthetic only'}));
}
async function approved(b) {
  const issued=await b.admission.issueTicket({url:urls[0]});assert.equal((await b.admission.create({url:urls[0]},issued.ticket)).kind,'approved');
  return {ticket:issued.ticket,ref:b.admission.publicReplayRef(b.tickets.verify({url:urls[0],ticket:issued.ticket}).replayKey)};
}
const publicCommand=async(b,p)=>({bindingId:p.ref.id,expectedCreatedAt:(await read(p.ref)).createdAt,expectedAdmissionRevision:(await read(b.admission.stateRef())).revision});
const removePublic=async(b,p,retirement=none)=>cleanup(b,retirement).removePublicReplay('source',await publicCommand(b,p));
const counterCommand=async ref=>{const value=await read(ref);return {counterId:ref.id,expectedWindowStart:value.windowStart,expectedCount:value.count};};
async function oldCounter() {const ref=db.doc('m0_suggestion_limits/status_2026101611');await ref.set(json({schemaVersion:1,kind:'status',windowStart:'2026-10-16T11:00:00.000Z',count:1}));return ref;}
async function prepared() {
  const b=make(),a=await create(b),w=await work(b,a);await publish();const p=await approved(b);at(60000);await removeReceipt(b,a);return {b,w,p,c:await oldCounter()};
}
before(()=>{
  assert.match(process.env.FIRESTORE_EMULATOR_HOST??'',/^127\.0\.0\.1:[1-9]\d{3,4}$/);assert.equal(process.env.GCLOUD_PROJECT,'demo-skilved-b03');
  app=initializeApp({projectId:'demo-skilved-suggestion-reclamation'},'suggestion-reclamation-test');db=getFirestore(app);
  catalogue=new Catalogue(db,{verifyIdToken:async token=>{if(['source','guest'].includes(token))return{uid:token};throw new Error();}},()=>now);
});
beforeEach(async()=>{
  for(const name of names){const docs=await rows(name),batch=db.batch();for(const doc of docs)batch.delete(doc.ref);if(docs.length)await batch.commit();}
  at(0);await db.doc('m0_sources/source').set(json(source));await db.doc('m0_suggestion_state/admission').set(json({schemaVersion:1,revision:1,workCount:0,receiptCount:0}));
  for(const uid of ['source','guest'])await db.doc('m0_operators/'+uid).set({active:true,roles:uid==='source'?['source']:['reviewer']});
});
after(async()=>{await db?.terminate();if(app)await deleteApp(app);});

test('all reclamation commands require source identity, strict input and exact concurrency preconditions',async()=>{
  const {b,w,p,c}=await prepared(),service=cleanup(b),before=await snapshot();
  const operations=[['removeWork',await workCommand(b,w)],['removePublicReplay',await publicCommand(b,p)],['removeCounter',await counterCommand(c)]];
  for(const [method,input] of operations) {
    for(const [token,expected] of [['bad','UNAUTHORIZED'],['guest','FORBIDDEN']])await code(service[method](token,input),expected);
    await code(service[method]('source',{...input,notes:'PRIVATE'}),'INVALID_COMMAND');
  }
  const wc=operations[0][1],pc=operations[1][1],cc=operations[2][1];
  await code(service.removeWork('source',{...wc,expectedWorkRevision:wc.expectedWorkRevision+1}),'CONFLICT');
  await code(service.removeWork('source',{...wc,expectedAdmissionRevision:wc.expectedAdmissionRevision+1}),'CONFLICT');
  await code(service.removePublicReplay('source',{...pc,expectedCreatedAt:'2026-10-16T11:00:00.000Z'}),'CONFLICT');
  await code(service.removeCounter('source',{...cc,expectedCount:2}),'CONFLICT');assert.deepEqual(await snapshot(),before);
});

test('saturated work capacity is reclaimed and same-notice recreation exceeds the deleted generation',async()=>{
  const b=make(epochA,{maxWork:1}),a=await create(b),w=await work(b,a),lease=await b.leases.acquire('source',{workId:w.id,expectedRevision:w.revision});
  await code(removeWork(b,w),'CONFLICT');at(60000);await removeReceipt(b,a);const anchor=await read(b.admission.workRef(w.id));
  const ticket=await b.admission.issueTicket({url:urls[1]});await code(b.admission.create({url:urls[1]},ticket.ticket),'SUGGESTION_CAPACITY');
  const cmd=await workCommand(b,w);await cleanup(b).removeWork('source',cmd);await code(cleanup(b).removeWork('source',cmd),'CONFLICT');
  const state=await read(b.admission.stateRef());assert.equal(state.schemaVersion,2);assert.equal(state.workCount,0);assert.equal(state.generationFloor,anchor.generation);
  const current=await create(b),next=await work(b,current);assert.ok(next.generation>anchor.generation);
  await code(b.leases.complete('source',leaseCommand(lease)),'CONFLICT');assert.equal((await b.admission.status(access(current))).status,'received');
});

test('one durable generation floor spans different deleted URLs without per-URL tombstones',async()=>{
  const b=make(),a=await create(b),w=await work(b,a);at(60000);await removeReceipt(b,a);
  const anchor=await read(b.admission.workRef(w.id));await b.admission.workRef(w.id).set(json({...anchor,generation:50}));await removeWork(b,w);
  const other=await create(b,urls[1]);assert.equal((await work(b,other)).generation,51);await b.admission.withdraw(access(other));
  at(120000);const otherWork=await work(b,other);await removeReceipt(b,other);const deleted=await read(b.admission.workRef(otherWork.id));await removeWork(b,otherWork);
  const restarted=make(),current=await create(restarted);assert.ok((await work(restarted,current)).generation>deleted.generation);
  assert.equal((await rows('suggestion_work')).length,1);assert.equal((await read(b.admission.stateRef())).workCount,1);
});

test('malformed and overflow generation floors fail atomically instead of resetting to one',async()=>{
  const b=make(),a=await create(b),w=await work(b,a);at(60000);await removeReceipt(b,a);const original=await read(b.admission.stateRef());
  for(const generationFloor of [-1,1.5,null,Number.MAX_SAFE_INTEGER+1]) {
    await b.admission.stateRef().set(json({...original,generationFloor}));const before=await snapshot();await code(removeWork(b,w),'SUGGESTION_UNAVAILABLE');assert.deepEqual(await snapshot(),before);
  }
  await b.admission.stateRef().set(json(original));const anchor=await read(b.admission.workRef(w.id));await b.admission.workRef(w.id).set(json({...anchor,generation:Number.MAX_SAFE_INTEGER}));
  await removeWork(b,w);const ticket=await b.admission.issueTicket({url:urls[0]});await code(b.admission.create({url:urls[0]},ticket.ticket),'SUGGESTION_UNAVAILABLE');
  assert.equal((await rows('suggestion_receipts')).length,0);assert.equal((await read(b.admission.stateRef())).generationFloor,Number.MAX_SAFE_INTEGER);
  const dropped=await read(b.admission.stateRef());delete dropped.generationFloor;await b.admission.stateRef().set(json(dropped));
  await code(b.admission.create({url:urls[0]},ticket.ticket),'SUGGESTION_UNAVAILABLE');assert.equal((await rows('suggestion_receipts')).length,0);
});

test('work deletion versus re-admission preserves capacity and generation in either serialization',async()=>{
  const b=make(),a=await create(b),w=await work(b,a);at(60000);await removeReceipt(b,a);const anchor=await read(b.admission.workRef(w.id)),cmd=await workCommand(b,w),ticket=await b.admission.issueTicket({url:urls[0]});
  const result=await Promise.allSettled([cleanup(b).removeWork('source',cmd),b.admission.create({url:urls[0]},ticket.ticket)]);
  assert.equal(result[1].status,'fulfilled');if(result[0].status==='rejected')assert.equal(result[0].reason.code,'CONFLICT');
  const current=result[1].value.access,next=await work(b,current);assert.ok(next.generation>anchor.generation);assert.equal((await read(b.admission.stateRef())).workCount,1);assert.equal(next.receiptCount,1);
});

test('public replay capacity and shorter decision expiry remain fenced until the original ticket deadline',async()=>{
  const b=make(epochA,{maxReceipts:1});await publish();const p=await approved(b),record=await read(p.ref);assert.equal(record.recoveryEpoch,epochA);
  await p.ref.set(json({...record,expiresAt:'2026-10-16T12:00:10.000Z'}));at(10000);await code(removePublic(b,p),'CONFLICT');at(59999);await code(removePublic(b,p),'CONFLICT');
  const other=await b.admission.issueTicket({url:urls[0]});await code(b.admission.create({url:urls[0]},other.ticket),'SUGGESTION_CAPACITY');
  at(60000);await removePublic(b,p);assert.equal((await rows('suggestion_public_replays')).length,0);
  await code(b.admission.create({url:urls[0]},p.ticket),'SUGGESTION_NOT_FOUND');const next=await approved(b);assert.ok(next.ticket);assert.ok((await db.doc('m0_public/approved_A').get()).exists);
});

test('untagged finite pre-upgrade public bindings retain their deadline despite legacy retirement declarations',async()=>{
  const b=make();await publish();const p=await approved(b),record=await read(p.ref);delete record.recoveryEpoch;await p.ref.set(json(record));
  assert.equal((await b.admission.create({url:urls[0]},p.ticket)).kind,'approved');const before=await snapshot();
  await code(removePublic(b,p,{retiredRecoveryEpochs:[],retireLegacy:true}),'CONFLICT');assert.deepEqual(await snapshot(),before);
  at(60000);await removePublic(b,p,{retiredRecoveryEpochs:[],retireLegacy:true});await code(b.admission.create({url:urls[0]},p.ticket),'SUGGESTION_NOT_FOUND');
});

test('tagged old epochs and undated legacy public bindings need applicable explicit retirement',async()=>{
  const a=make();await publish();const p=await approved(a),b=make(epochB);await code(removePublic(b,p),'CONFLICT');
  await removePublic(b,p,{retiredRecoveryEpochs:[epochA],retireLegacy:false});await code(b.admission.create({url:urls[0]},p.ticket),'SUGGESTION_NOT_FOUND');
  const legacyReceipts=new SuggestionReceipts(db,{keyRing:{activeKeyId:'test',keys:[{id:'test',secret:'a1'.repeat(32)}]},maxTtlMs:60000,now:()=>now});
  const legacy=new SuggestionAdmission(db,legacyReceipts,policy),key='f1'.repeat(32);await legacy.create({url:urls[0]},key);
  const legacyBinding={ref:legacy.publicReplayRef(key)};await code(removePublic(b,legacyBinding),'CONFLICT');
  await removePublic(b,legacyBinding,{retiredRecoveryEpochs:[],retireLegacy:true});await code(b.admission.create({url:urls[0]},key),'SUGGESTION_NOT_FOUND');
});

test('removing an empty work row preserves a still-live approved replay and honest result-removal behavior',async()=>{
  const b=make(),a=await create(b),w=await work(b,a);at(60000);await removeReceipt(b,a);await publish();const p=await approved(b),record=await read(p.ref);
  await removeWork(b,w);assert.deepEqual(await read(p.ref),record);assert.equal((await b.admission.create({url:urls[0]},p.ticket)).kind,'approved');
  await db.doc('m0_public/approved_A').delete();assert.deepEqual(await b.admission.create({url:urls[0]},p.ticket),{kind:'previous_result_unavailable'});
  assert.equal((await read(b.admission.stateRef())).workCount,0);assert.equal((await rows('suggestion_receipts')).length,0);
});

test('malformed public histories, receipt/public key collisions and oversize JSON do not partially reclaim',async()=>{
  const {b,w,p}=await prepared(),original=p.ref?await p.ref.get():null,record=JSON.parse(original.data().json);
  for(const patch of [{...record,notes:'PRIVATE'},{...record,retainUntil:'9999-01-01T00:00:00.000Z'},{...record,recoveryEpoch:'short'}]) {
    await p.ref.set(json(patch));const before=await snapshot();await code(removePublic(b,p),'SUGGESTION_UNAVAILABLE');assert.deepEqual(await snapshot(),before);await p.ref.set(original.data());
  }
  await p.ref.set({json:' '.repeat(8193)+JSON.stringify(record)});await code(removeWork(b,w),'SUGGESTION_UNAVAILABLE');await p.ref.set(original.data());
  await db.doc('m0_public/approved_A').delete();const a=await create(b),binding=(await rows('suggestion_replays'))[0];
  const collision=db.doc('m0_suggestion_public_replays/'+binding.id);await collision.set(json(record));const before=await snapshot();
  await code(removePublic(b,p),'SUGGESTION_UNAVAILABLE');assert.deepEqual(await snapshot(),before);assert.ok((await b.receipts.receiptRef(a.receiptId).get()).exists);
});

test('counter cleanup refuses current/future windows, wrong identity, unaligned and impossible counts',async()=>{
  const b=make();await b.admission.charge('create');const current=db.doc('m0_suggestion_limits/create_2026101612');await code(cleanup(b).removeCounter('source',await counterCommand(current)),'CONFLICT');
  const ref=db.doc('m0_suggestion_limits/create_2026101613');
  for(const value of [{schemaVersion:1,kind:'create',windowStart:'2026-10-16T13:00:00.000Z',count:1},
    {schemaVersion:1,kind:'status',windowStart:'2026-10-16T11:00:00.000Z',count:1},
    {schemaVersion:1,kind:'create',windowStart:'2026-10-16T13:30:00.000Z',count:1},
    {schemaVersion:1,kind:'create',windowStart:'2026-10-16T13:00:00.000Z',count:51}]) {
    await ref.set(json(value));const before=await snapshot();await code(cleanup(b).removeCounter('source',await counterCommand(ref)),value.windowStart==='2026-10-16T13:00:00.000Z'&&value.count===1?'CONFLICT':'SUGGESTION_UNAVAILABLE');assert.deepEqual(await snapshot(),before);
  }
});

test('exact hour cleanup and a late captured old-window charge never refund current allowance',async()=>{
  const b=make(epochA,{createAttemptsPerHour:2});await b.admission.charge('create');const old=db.doc('m0_suggestion_limits/create_2026101612'),cmd=await counterCommand(old),original=db.runTransaction;
  let release,captured,first=true;const gate=new Promise(resolve=>{release=resolve;}),seen=new Promise(resolve=>{captured=resolve;});
  db.runTransaction=function(update,...options){if(first){first=false;captured();return gate.then(()=>original.call(this,update,...options));}return original.call(this,update,...options);};
  try {
    at(3599999);const late=b.admission.charge('create');await seen;at(3600000);await cleanup(b).removeCounter('source',cmd);
    await b.admission.charge('create');release();await late;assert.equal((await read(old)).count,1);
    await b.admission.charge('create');await code(b.admission.charge('create'),'SUGGESTION_RATE_LIMITED');
    assert.equal((await read(db.doc('m0_suggestion_limits/create_2026101613'))).count,2);
  } finally {release();db.runTransaction=original;}
});

test('same counter reclamation contention commits one deletion and one audit',async()=>{
  const b=make(),ref=await oldCounter(),cmd=await counterCommand(ref),result=await Promise.allSettled([cleanup(b).removeCounter('source',cmd),cleanup(b).removeCounter('source',cmd)]);
  assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.equal(result.find(r=>r.status==='rejected').reason.code,'CONFLICT');
  assert.equal((await rows('audit')).filter(row=>JSON.parse(row.data().json).action==='suggestions.cleanup.counter').length,1);
});

test('queued audit failure and callback clock rollback preserve work floor, public bindings and counters',async()=>{
  const {b,w,p,c}=await prepared(),service=cleanup(b),operations=[['removeWork',await workCommand(b,w)],['removePublicReplay',await publicCommand(b,p)],['removeCounter',await counterCommand(c)]];
  for(const mode of ['audit','clock'])for(const [method,input] of operations) {
    const before=await snapshot(),original=db.runTransaction,savedNow=now;
    db.runTransaction=function(update,...options){return original.call(this,tx=>{const proxy=new Proxy(tx,{get(target,key){
      if(mode==='audit'&&key==='create')return (...args)=>{target.create(...args);throw new DomainError('SUGGESTION_UNAVAILABLE');};
      if(mode==='clock'&&key==='delete')return ref=>{target.delete(ref);at(59999);return proxy;};
      const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});return update(proxy);},...options);};
    try{await code(service[method]('source',input),'SUGGESTION_UNAVAILABLE');}finally{db.runTransaction=original;now=savedNow;}
    assert.deepEqual(await snapshot(),before);
  }
});

test('same-work reclamation contention commits one floor update and keeps other current submitters',async()=>{
  const b=make(),a=await create(b),w=await work(b,a);at(60000);await removeReceipt(b,a);const other=await create(b,urls[1]),cmd=await workCommand(b,w);
  const result=await Promise.allSettled([cleanup(b).removeWork('source',cmd),cleanup(b).removeWork('source',cmd)]);
  assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.equal(result.find(r=>r.status==='rejected').reason.code,'CONFLICT');
  assert.equal((await b.admission.status(access(other))).status,'received');assert.equal((await read(b.admission.stateRef())).workCount,1);
  assert.equal((await rows('audit')).filter(row=>JSON.parse(row.data().json).action==='suggestions.cleanup.work').length,1);
});
