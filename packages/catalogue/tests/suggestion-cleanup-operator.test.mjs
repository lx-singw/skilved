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
  app=initializeApp({projectId:'demo-skilved-cleanup-operator'},'suggestion-cleanup-operator-test');db=getFirestore(app);
  catalogue=new Catalogue(db,{verifyIdToken:async token=>{if(['source','guest'].includes(token))return{uid:token};throw new Error();}},()=>now);
});
beforeEach(async()=>{
  for(const name of names){const docs=await rows(name),batch=db.batch();for(const doc of docs)batch.delete(doc.ref);if(docs.length)await batch.commit();}
  at(0);await db.doc('m0_sources/source').set(json(source));await db.doc('m0_suggestion_state/admission').set(json({schemaVersion:1,revision:1,workCount:0,receiptCount:0}));
  for(const uid of ['source','guest'])await db.doc('m0_operators/'+uid).set({active:true,roles:uid==='source'?['source']:['reviewer']});
});
after(async()=>{await db?.terminate();if(app)await deleteApp(app);});

import {executeSuggestionCleanup as execute} from '../src/suggestion-cleanup-operator.mjs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {getAuth} from 'firebase-admin/auth';

const settings=(epoch=epochA)=>({catalogue:{mode:'emulator',projectId:'demo-skilved-cleanup-operator'},policy,
  receipt:{keyRing:{activeKeyId:'test',keys:[{id:'test',secret:'a1'.repeat(32)}]},maxTtlMs:60000,recoveryEpoch:epoch},
  replayTickets:{epoch:'11'.repeat(32),secret:'22'.repeat(32),notBefore:start,ttlMs:60000,recoveryEpoch:epoch}});
const dispatch=(command,options={})=>execute({db,catalogue,config:settings().catalogue},options.token??'source',command,
  settings(options.epoch??epochA),{retirement:options.retirement??none,mutationsEnabled:options.enabled??true},()=>now);
const preview=(target,extra={},options={})=>dispatch({command:'suggestion-cleanup-preview',preview:{target,...extra}},options);
const remove=(target,cleanup,options={})=>dispatch({command:'suggestion-cleanup-'+target,cleanup},options);
const candidate=async(target,options={})=>(await preview(target,{},options)).items[0];

test('source-authenticated previews are bounded stable pages of minimal preconditions and never mutate',async()=>{
  const b=make(),a=await create(b),other=await create(b),third=await create(b,urls[1]);await publish();await approved(b);
  const before=await snapshot();
  for(const [token,expected] of [['bad','UNAUTHORIZED'],['guest','FORBIDDEN']])await code(preview('receipt',{}, {token}),expected);
  for(const extra of [{limit:0},{limit:51},{after:'url/private'},{url:urls[0]},{retirement:none}])await code(preview('receipt',extra),'INVALID_COMMAND');
  await code(preview('counter',{after:'create_2026'}),'INVALID_COMMAND');
  const ids=[];let after;
  do {const p=await preview('receipt',{limit:1,...(after?{after}:{})});assert.equal(p.items.length,1);
    assert.deepEqual(Object.keys(p.items[0]).sort(),['expectedAdmissionRevision','expectedRevision','expectedWorkRevision','receiptId']);
    ids.push(p.items[0].receiptId);after=p.next;
  }while(after);
  assert.deepEqual(ids,[a.receiptId,other.receiptId,third.receiptId].sort());
  const all=await Promise.all(['receipt','work','public-replay','counter'].map(target=>preview(target,{limit:50})));
  assert.deepEqual(all.map(p=>p.items.length),[3,2,1,1]);
  const text=JSON.stringify(all);for(const privateValue of [...urls,a.capability,a.ticket,epochA,'a1'.repeat(32),'22'.repeat(32)])assert.equal(text.includes(privateValue),false);
  assert.doesNotMatch(text,/capability|url|notes|nonce|inputHash|recoveryEpoch/);
  assert.deepEqual(await snapshot(),before);
});

test('preview does not authorize early removal and stale commands preserve a surviving submitter',async()=>{
  const b=make(),a=await create(b),first=await candidate('receipt');at(30000);const other=await create(b);
  const before=await snapshot();await code(remove('receipt',first),'CONFLICT');
  await code(remove('receipt',await candidate('receipt'),{enabled:false}),'SUGGESTION_UNAVAILABLE');
  await code(remove('work',await candidate('work')),'CONFLICT');assert.deepEqual(await snapshot(),before);
  const p=(await preview('receipt')).items.find(c=>c.receiptId===a.receiptId);at(60000);await remove('receipt',p);
  assert.equal((await work(b,other)).referenceCount,1);assert.equal((await work(b,other)).state,'pending');
  await code(remove('receipt',p),'CONFLICT');assert.equal((await b.receipts.receiptRef(other.receiptId).get()).exists,true);
  const w=await work(b,other);assert.ok((await b.leases.acquire('source',{workId:w.id,expectedRevision:w.revision})).leaseId);
});

test('integrated operator expiry removal frees receipt and work capacity while fencing recreation',async()=>{
  const b=make(),a=await create(b),w=await work(b,a),old=await candidate('work');at(60000);
  await remove('receipt',await candidate('receipt'));await code(remove('work',old),'CONFLICT');
  const command=await candidate('work');await remove('work',command);await code(remove('work',command),'CONFLICT');
  const fresh=await create(b),next=await work(b,fresh),state=await read(b.admission.stateRef());
  assert.ok(next.generation>w.generation);assert.equal(state.schemaVersion,2);assert.equal(state.receiptCount,1);assert.equal(state.workCount,1);
  const actions=(await rows('audit')).map(r=>JSON.parse(r.data().json).action);
  assert.ok(actions.includes('suggestions.cleanup.receipt'));assert.ok(actions.includes('suggestions.cleanup.work'));
});

test('recovery-context receipt retirement comes only from trusted configuration and rechecks current context',async()=>{
  const b=make(),a=await create(b),p=await candidate('receipt',{epoch:epochB}),before=await snapshot();
  await code(remove('receipt',p,{epoch:epochB}),'CONFLICT');
  await code(dispatch({command:'suggestion-cleanup-receipt',cleanup:p,retirement:{retireLegacy:true,retiredRecoveryEpochs:[epochA]}}),'INVALID_COMMAND');
  await code(remove('receipt',p,{epoch:epochB,retirement:{...none,retiredRecoveryEpochs:[epochB]}}),'SUGGESTION_UNAVAILABLE');
  assert.deepEqual(await snapshot(),before);
  await remove('receipt',p,{epoch:epochB,retirement:{...none,retiredRecoveryEpochs:[epochA]}});
  assert.equal((await b.receipts.receiptRef(a.receiptId).get()).exists,false);
});

test('operator public replay command preserves finite untagged windows and independent public facts',async()=>{
  const b=make();await publish();const p=await approved(b),r=await read(p.ref);delete r.recoveryEpoch;await p.ref.set(json(r));
  const c=await candidate('public-replay'),before=await snapshot();
  await code(remove('public-replay',c,{retirement:{...none,retireLegacy:true}}),'CONFLICT');assert.deepEqual(await snapshot(),before);
  at(60000);await remove('public-replay',c,{retirement:{...none,retireLegacy:true}});
  assert.equal((await p.ref.get()).exists,false);assert.equal((await db.doc('m0_public/approved_A').get()).exists,true);
  await code(b.admission.create({url:urls[0]},p.ticket),'SUGGESTION_NOT_FOUND');
});

test('operator counter pages and commands reject current windows and changed counts without refunding allowance',async()=>{
  const b=make();await create(b);const old=await oldCounter(),p=(await preview('counter',{limit:1}));assert.equal(p.items.length,1);assert.ok(p.next);
  const all=await preview('counter'),current=all.items.find(c=>c.counterId.startsWith('create')),elapsed=all.items.find(c=>c.counterId===old.id);
  const before=await snapshot();await code(remove('counter',current),'CONFLICT');
  await old.set(json({schemaVersion:1,kind:'status',windowStart:'2026-10-16T11:00:00.000Z',count:2}));
  await code(remove('counter',elapsed),'CONFLICT');const newer=(await preview('counter')).items.find(c=>c.counterId===old.id);
  await remove('counter',newer);const currentRow=await read(db.doc('m0_suggestion_limits/'+current.counterId));assert.equal(currentRow.count,current.expectedCount);
  assert.equal((await old.get()).exists,false);assert.notDeepEqual(await snapshot(),before);
});

test('preview rejects inconsistent inventories and malformed counter identity without partial writes',async()=>{
  const b=make(),a=await create(b),w=await work(b,a);
  await b.admission.workRef(w.id).set(json({...w,url:'https://private.invalid/changed'}));let before=await snapshot();
  for(const target of ['receipt','work','public-replay'])await code(preview(target),'SUGGESTION_UNAVAILABLE');
  assert.deepEqual(await snapshot(),before);
  await db.doc('m0_suggestion_limits/status_2026101611').set(json({schemaVersion:1,kind:'create',windowStart:'2026-10-16T11:00:00.000Z',count:1}));
  before=await snapshot();await code(preview('counter'),'SUGGESTION_UNAVAILABLE');assert.deepEqual(await snapshot(),before);
});

test('actual operator CLI uses private token file, default-off mutations and persisted source role',async()=>{
  const response=await fetch('http://'+process.env.FIREBASE_AUTH_EMULATOR_HOST+'/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fixture',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({returnSecureToken:true})});assert.equal(response.status,200);
  const {idToken,localId}=await response.json(),authApp=initializeApp({projectId:'demo-skilved-b03'},'cleanup-cli-auth'),cliDb=getFirestore(authApp);
  const dir=await mkdtemp(join(tmpdir(),'skilved-cleanup-cli-')),counter=cliDb.doc('m0_suggestion_limits/status_2000010100'),operator=cliDb.doc('m0_operators/'+localId);
  const manifest={origin:'http://localhost:3000',recoveryEpoch:epochA,policy,keyRing:settings().receipt.keyRing,
    replayTickets:{epoch:'11'.repeat(32),secret:'22'.repeat(32),notBefore:start,ttlMs:60000}};
  const run=async(command,enabled=false)=>{
    await writeFile(join(dir,'command.json'),JSON.stringify(command),{mode:0o600});
    return promisify(execFile)(process.execPath,['tools/operator.mjs',join(dir,'command.json')],{timeout:30000,
      env:{...process.env,NODE_ENV:'test',SKILVED_CATALOGUE_MODE:'emulator',SKILVED_CATALOGUE_PROJECT:'demo-skilved-b03',SKILVED_CATALOGUE_READS:'true',
        SKILVED_SUGGESTIONS_ENABLED:'true',SKILVED_SUGGESTIONS_CONFIG:JSON.stringify(manifest),SKILVED_OPERATOR_TOKEN_FILE:join(dir,'token'),
        SKILVED_SUGGESTION_CLEANUP_CONFIG:JSON.stringify({mutationsEnabled:enabled,retirement:none})}});
  };
  try {
    await writeFile(join(dir,'token'),idToken,{mode:0o600});await operator.set({active:true,roles:['source']});
    await counter.set(json({schemaVersion:1,kind:'status',windowStart:'2000-01-01T00:00:00.000Z',count:1}));
    const first=await run({command:'suggestion-cleanup-preview',preview:{target:'counter'}}),c=JSON.parse(first.stdout).items.find(r=>r.counterId===counter.id);assert.ok(c);
    const command={command:'suggestion-cleanup-counter',cleanup:c};
    await assert.rejects(run(command),e=>JSON.parse(e.stderr).error==='SUGGESTION_UNAVAILABLE');assert.equal((await counter.get()).exists,true);
    assert.deepEqual(JSON.parse((await run(command,true)).stdout),{removedCounters:1});assert.equal((await counter.get()).exists,false);
    await operator.update({active:false});await assert.rejects(run({command:'suggestion-cleanup-preview',preview:{target:'counter'}}),e=>JSON.parse(e.stderr).error==='FORBIDDEN');
    assert.equal(first.stdout.includes(idToken),false);assert.doesNotMatch(first.stdout,/capability|url|retirement/);
  } finally {
    await counter.delete();await operator.delete();for(const row of (await cliDb.collection('m0_audit').where('json','>=','').get()).docs) {
      if(JSON.parse(row.data().json).actor===localId)await row.ref.delete();
    }
    await getAuth(authApp).deleteUser(localId);await cliDb.terminate();await deleteApp(authApp);await rm(dir,{recursive:true,force:true});
  }
});
