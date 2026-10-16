import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { projectOpportunity } from '@skilved/types/opportunities/internal';
import { makeRecord } from '../../types/tests/fixtures/opportunities.mjs';
import { Catalogue } from '../src/store.mjs';
import { SuggestionReceipts } from '../src/suggestion-receipts.mjs';
import { SuggestionAdmission } from '../src/suggestion-admission.mjs';
import { SuggestionReview } from '../src/suggestion-review.mjs';

const start='2026-10-16T12:00:00.000Z',url='https://source.example/notice';
const source={ id:'test_source',revision:1,name:'Synthetic source',urls:[url],
  permission:{reference:'Synthetic permission only',method:'structured_json',reuse:'Tests only',reviewedAt:start},
  categories:['bursary','learnership','apprenticeship','internship','graduate_programme','job'],owner:'source_operator',paused:false,cadenceHours:24,maxBytes:500000 };
const policy={intakeEnabled:true,maxWork:100,maxReceipts:500,createAttemptsPerHour:50,statusReadsPerHour:600,receiptTtlMs:86400000};
const collections=['sources','suggestion_state','suggestion_receipts','suggestion_replays','suggestion_public_replays','suggestion_work',
  'suggestion_limits','public','drafts','snapshots','aliases','operators','audit'];
const random=()=>randomBytes(32).toString('hex'),json=v=>({json:JSON.stringify(v)}),access=v=>({receiptId:v.receiptId,capability:v.capability});
let app,db,receipts,admission,catalogue,review,now;
const set=(collection,id,value)=>db.collection('m0_'+collection).doc(id).set(json(value));
const data=async ref=>JSON.parse((await ref.get()).data().json);
const rows=async collection=>(await db.collection('m0_'+collection).get()).docs;
const code=(promise,expected)=>assert.rejects(promise,e=>e.code===expected);
const create=async()=> (await admission.create({url},random())).access;
const get=entry=>admission.status(access(entry));
async function work(entry){return data(admission.workRef((await data(receipts.receiptRef(entry.receiptId))).workId));}
const decide=(w,outcome,ids=[],token='source')=>review.decide(token,{workId:w.id,expectedRevision:w.revision,outcome,publicResultIds:ids});
async function publish(id='result_A') {
  const record=makeRecord('job');record.id=id;record.citations[0].url=url;
  await set('drafts',id,record);await set('public',id,projectOpportunity(record));
  await set('snapshots','snapshot_fixture_1',{id:'snapshot_fixture_1',sourceId:source.id,sourceRevision:1,url,retrievedAt:start});return record;
}
before(()=>{
  assert.match(process.env.FIRESTORE_EMULATOR_HOST??'',/^127\.0\.0\.1:[1-9]\d{3,4}$/);
  assert.match(process.env.FIREBASE_AUTH_EMULATOR_HOST??'',/^127\.0\.0\.1:[1-9]\d{3,4}$/);
  assert.equal(process.env.GCLOUD_PROJECT,'demo-skilved-b03');
  app=initializeApp({projectId:'demo-skilved-review'},'suggestion-review-test');db=getFirestore(app);
  receipts=new SuggestionReceipts(db,{keyRing:{activeKeyId:'test1',keys:[{id:'test1',secret:'a1'.repeat(32)}]},maxTtlMs:86400000,now:()=>now});
  catalogue=new Catalogue(db,{verifyIdToken:async token=>{if(['source','reviewer','guest'].includes(token))return {uid:token};throw new Error();}},()=>now);
});
beforeEach(async()=>{
  for(const collection of collections){const docs=await rows(collection),batch=db.batch();for(const doc of docs)batch.delete(doc.ref);if(docs.length)await batch.commit();}
  now=start;admission=new SuggestionAdmission(db,receipts,policy);review=new SuggestionReview(admission,catalogue);
  await set('sources',source.id,source);await admission.stateRef().set(json({schemaVersion:1,revision:1,workCount:0,receiptCount:0}));
  for(const uid of ['source','reviewer','guest'])await db.doc('m0_operators/'+uid).set({active:true,roles:uid==='guest'?[]:[uid]});
});
after(async()=>{await db?.terminate();if(app)await deleteApp(app);});

test('review/queue require verified identity and a current active source role; failures never audit or mutate',async()=>{
  const a=await create(),w=await work(a),before=await data(receipts.receiptRef(a.receiptId));
  for(const [token,expected] of [['bad','UNAUTHORIZED'],['reviewer','FORBIDDEN'],['guest','FORBIDDEN']]){
    await code(decide(w,'reviewing',[],token),expected);await code(review.queue(token),expected);
  }
  await db.doc('m0_operators/source').update({active:false});await code(decide(w,'reviewing'),'FORBIDDEN');
  assert.deepEqual(await data(receipts.receiptRef(a.receiptId)),before);assert.equal((await rows('audit')).length,0);
});

test('shared decisions update distinct receipts atomically, preserve replay/capacity and expose only minimal status',async()=>{
  const key=random(),a=(await admission.create({url},key)).access,b=await create(),w=await work(a),state=await data(admission.stateRef());
  const queue=await review.queue('source');assert.equal(queue.items.length,1);assert.equal(queue.items[0].workId,w.id);
  const text=JSON.stringify(queue);for(const hidden of [a.capability,b.capability,'capabilityHash','nonce','receiptCount',a.receiptId])assert.ok(!text.includes(hidden));
  now='2026-10-16T12:01:00.000Z';assert.deepEqual(await decide(w,'reviewing'),{revision:w.revision+1,status:'reviewing'});
  for(const entry of [a,b]){const status=await get(entry);assert.equal(status.status,'reviewing');assert.equal(status.revision,2);assert.equal(status.expiresAt,entry.expiresAt);
    for(const hidden of ['workId',url,entry.capability,'permissionHash','nonce'])assert.ok(!JSON.stringify(status).includes(hidden));}
  assert.deepEqual(await data(admission.stateRef()),state);assert.deepEqual(await admission.create({url},key),{kind:'received',access:a});
  assert.equal((await rows('public')).length,0);assert.equal((await rows('drafts')).length,0);
  const audit=await data((await rows('audit'))[0].ref);assert.deepEqual(Object.keys(audit).sort(),['action','subject','reason','actor','at'].sort());
  assert.equal(audit.action,'suggestions.review');assert.equal(audit.actor,'source');assert.equal(audit.reason,'Suggestion review started');assert.ok(!JSON.stringify(audit).includes(url));
});

test('strict commands, expected revisions and explicit reopen prevent stale, duplicate and terminal-to-terminal decisions',async()=>{
  const a=await create(),w=await work(a);
  for(const patch of [{expectedRevision:0},{outcome:'withdrawn'},{notes:'PRIVATE'},{reason:url},{publicResultIds:['draft']},{outcome:'resolved_to_listing'}])
    await code(review.decide('source',{workId:w.id,expectedRevision:w.revision,outcome:'reviewing',...patch}),'INVALID_COMMAND');
  await code(decide({...w,revision:99},'reviewing'),'CONFLICT');await decide(w,'unresolved');
  await code(decide(w,'reviewing'),'CONFLICT');await code(decide(await work(a),'unsupported'),'CONFLICT');
  await decide(await work(a),'reviewing');assert.equal((await get(a)).status,'reviewing');assert.equal((await rows('audit')).length,2);
});

test('concurrent reviewers commit one expected revision; either serial order of admission/review preserves shared outcome',async()=>{
  const a=await create(),w=await work(a);
  const results=await Promise.allSettled([decide(w,'reviewing'),decide(w,'paused')]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.code==='CONFLICT').length,1);
  if((await work(a)).state==='paused')await decide(await work(a),'reviewing');
  const auditCount=(await rows('audit')).length,current=await work(a);
  const raced=await Promise.allSettled([decide(current,'unresolved'),create()]);assert.equal(raced[1].status,'fulfilled');
  if(raced[0].status==='rejected')assert.equal(raced[0].reason.code,'CONFLICT');
  const b=raced[1].value;assert.equal((await get(a)).status,(await get(b)).status);assert.equal((await work(a)).receiptCount,2);
  assert.equal((await rows('audit')).length,auditCount+(raced[0].status==='fulfilled'?1:0));
});

test('new submitters inherit unresolved/unsupported/paused outcomes without silently starting new review',async()=>{
  const a=await create();await decide(await work(a),'unsupported');const b=await create();assert.equal((await get(b)).status,'unsupported');
  await decide(await work(a),'reviewing');await decide(await work(a),'paused');const c=await create();assert.equal((await get(c)).status,'paused');
  await decide(await work(a),'reviewing');await decide(await work(a),'unresolved');assert.equal((await get(await create())).status,'unresolved');
});

test('resolution requires every current approved intake and never publishes or selects a private draft',async()=>{
  const a=await create(),w=await work(a);await publish();await publish('result_B');
  for(const ids of [['private_draft'],['result_A'],['result_A','result_A']])
    await code(decide(w,'resolved_to_listing',ids),ids[0]===ids[1]?'INVALID_COMMAND':'SUGGESTION_RESULT_CHANGED');
  const before=(await rows('public')).map(row=>row.data());await decide(w,'resolved_to_listing',['result_B','result_A']);
  assert.deepEqual((await get(a)).publicResultIds,['result_A','result_B']);assert.deepEqual((await rows('public')).map(row=>row.data()),before);
  assert.equal((await rows('audit')).length,1);assert.equal((await admission.create({url},random())).kind,'approved');
});

test('resolved status removes withheld results, returns honest unresolved and never substitutes a newly published result',async()=>{
  const a=await create();await publish();await publish('result_B');await decide(await work(a),'resolved_to_listing',['result_A','result_B']);
  const before=await data(receipts.receiptRef(a.receiptId));await db.doc('m0_public/result_A').delete();
  assert.deepEqual((await get(a)).publicResultIds,['result_B']);await db.doc('m0_public/result_B').delete();await publish('result_C');
  const status=await get(a);assert.equal(status.status,'unresolved');assert.deepEqual(status.publicResultIds,[]);
  assert.deepEqual(await data(receipts.receiptRef(a.receiptId)),before);assert.equal((await rows('audit')).length,1);
});

test('current private revision, source permission/scope/pause and automatic freshness govern every status read',async()=>{
  const a=await create();const record=await publish();await decide(await work(a),'resolved_to_listing',[record.id]);
  for(const patch of [{paused:true},{revision:2},{categories:['bursary']},{permission:{...source.permission,reuse:'Changed fixture'}}]){
    await set('sources',source.id,{...source,...patch});assert.equal((await get(a)).status,'unresolved');
  }
  await set('sources',source.id,source);record.revision++;await set('drafts',record.id,record);assert.equal((await get(a)).status,'unresolved');
  const restored=await publish();restored.checks[0].method='automatic';restored.checks[0].nextCheckAt='2026-10-16T11:00:00.000Z';
  await set('drafts',restored.id,restored);await set('public',restored.id,projectOpportunity(restored));assert.equal((await get(a)).status,'unresolved');
  await publish();assert.equal((await get(a)).status,'resolved_to_listing');
});

test('alias changes never redirect a receipt to an unselected ID; closed approved results remain available',async()=>{
  const a=await create();await publish();await decide(await work(a),'resolved_to_listing',['result_A']);await publish('result_B');
  const alias={schemaVersion:1,fromId:'result_A',toId:'result_B',revision:1,decision:'confirmed'};await set('aliases','result_A',alias);
  assert.equal((await get(a)).status,'unresolved');await set('aliases','result_A',{...alias,revision:2,decision:'reversed'});
  assert.deepEqual((await get(a)).publicResultIds,['result_A']);const record=await publish();record.lifecycle='closed';
  await set('drafts',record.id,record);await set('public',record.id,projectOpportunity(record));assert.equal((await get(a)).status,'resolved_to_listing');
});

test('paused/drifted source cannot start or resolve review but may honestly close it without public IDs',async()=>{
  const a=await create(),w=await work(a);await publish();await set('sources',source.id,{...source,paused:true});
  await code(decide(w,'reviewing'),'SUGGESTION_PAUSED');await code(decide(w,'resolved_to_listing',['result_A']),'SUGGESTION_PAUSED');
  await set('sources',source.id,{...source,revision:2});await code(decide(w,'reviewing'),'SUGGESTION_SOURCE_CHANGED');
  await decide(w,'unresolved');assert.equal((await get(a)).status,'unresolved');
});

test('expired/revoked receipts are untouched; no active references cannot be reviewed and credentials cannot revive',async()=>{
  const a=await create(),b=await create(),c=await create();const ar=receipts.receiptRef(a.receiptId),br=receipts.receiptRef(b.receiptId);
  const first=await data(ar),second=await data(br);await ar.set(json({...first,expiresAt:'2026-10-16T12:00:01.000Z'}));
  await br.set(json({...second,status:'withdrawn',revokedAt:start}));const before=[await data(ar),await data(br)];now='2026-10-16T12:01:00.000Z';
  await decide(await work(c),'reviewing');assert.deepEqual([await data(ar),await data(br)],before);assert.equal((await get(c)).status,'reviewing');
  for(const entry of [a,b])await code(get(entry),'SUGGESTION_NOT_FOUND');now='2026-10-17T12:00:00.000Z';
  await code(decide(await work(c),'unresolved'),'CONFLICT');assert.equal((await rows('audit')).length,1);
});

test('corrupt capacity, future clocks and orphan/malformed work fail atomically; resolved reads never trust stored IDs',async()=>{
  const a=await create(),w=await work(a),ref=admission.workRef(w.id);await admission.stateRef().set(json({schemaVersion:1,revision:2,workCount:0,receiptCount:1}));
  await code(decide(w,'reviewing'),'SUGGESTION_UNAVAILABLE');await admission.stateRef().set(json({schemaVersion:1,revision:2,workCount:1,receiptCount:1}));
  await ref.set(json({...w,updatedAt:'2026-10-16T13:00:00.000Z'}));await code(decide(w,'reviewing'),'SUGGESTION_UNAVAILABLE');await ref.set(json(w));
  const rr=receipts.receiptRef(a.receiptId);await rr.set(json({...await data(rr),revision:Number.MAX_SAFE_INTEGER}));await code(decide(w,'reviewing'),'SUGGESTION_UNAVAILABLE');
  await rr.set(json({...await data(rr),revision:1}));await publish();await decide(w,'resolved_to_listing',['result_A']);await ref.delete();
  await code(get(a),'SUGGESTION_UNAVAILABLE');await code(get({...a,capability:random()}),'SUGGESTION_NOT_FOUND');
});

test('500 retained references transition in one bounded emulator transaction with unchanged physical counts',async()=>{
  const a=await create(),w=await work(a),original=await data(receipts.receiptRef(a.receiptId));
  const batch=db.batch();for(let i=0;i<499;i++){const id=random();batch.set(receipts.receiptRef(id),json({...original,id,nonce:random(),capabilityHash:random()}));}await batch.commit();
  await admission.workRef(w.id).set(json({...w,receiptCount:500}));await admission.stateRef().set(json({schemaVersion:1,revision:2,workCount:1,receiptCount:500}));
  await decide(await work(a),'reviewing');const all=await rows('suggestion_receipts');assert.equal(all.length,500);
  assert.ok(all.every(row=>JSON.parse(row.data().json).status==='reviewing'));assert.equal((await data(admission.stateRef())).receiptCount,500);
});

test('actual local Auth emulator token verification and current persisted source role authorize review',async()=>{
  const response=await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key`,{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({returnSecureToken:true})});assert.equal(response.status,200);
  const {idToken,localId}=await response.json();assert.ok(idToken);await db.doc('m0_operators/'+localId).set({active:true,roles:['source']});
  // REST fake API keys use the CLI's fixed Auth project; receipt/role data stays in this suite's isolated Firestore project.
  assert.equal(JSON.parse(Buffer.from(idToken.split('.')[1],'base64url')).aud,'demo-skilved-b03');
  const authApp=initializeApp({projectId:'demo-skilved-b03'},'suggestion-review-auth-only');
  try {
    const actual=new SuggestionReview(admission,new Catalogue(db,getAuth(authApp),()=>now)),a=await create(),w=await work(a);
    await actual.decide(idToken,{workId:w.id,expectedRevision:w.revision,outcome:'reviewing'});assert.equal((await get(a)).status,'reviewing');
    await db.doc('m0_operators/'+localId).update({active:false});await code(actual.queue(idToken),'FORBIDDEN');
  } finally {await getAuth(authApp).deleteUser(localId);await deleteApp(authApp);}
});

test('overlapping current source registrations cannot resolve review or expose previously resolved IDs',async()=>{
  const a=await create(),w=await work(a);await publish();await set('sources','overlap',{...source,id:'overlap'});
  await code(decide(w,'resolved_to_listing',['result_A']),'SUGGESTION_UNAVAILABLE');await db.doc('m0_sources/overlap').delete();
  await decide(w,'resolved_to_listing',['result_A']);await set('sources','overlap',{...source,id:'overlap'});
  assert.equal((await get(a)).status,'unresolved');assert.deepEqual((await get(a)).publicResultIds,[]);
});
