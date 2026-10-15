import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { configuration } from '../src/config.mjs';
import { publicAddress, approvedUrl } from '../src/fetch.mjs';
import { getRuntime } from '../src/runtime.mjs';
import { Catalogue } from '../src/store.mjs';
import { handle } from '../src/http.mjs';
import { allFixtures, makeRecord } from '../../types/tests/fixtures/opportunities.mjs';

let runtime,store,token,guest,uid,now='2026-09-25T18:00:00.000Z';
const json=object=>({json:JSON.stringify(object)});
const source={ id:'test_source',revision:1,name:'Fictional test publisher',urls:['https://source.example/notice'],permission:{reference:'Synthetic fixture owned by this test',method:'structured_json',reuse:'Test only',reviewedAt:now},categories:['bursary','learnership','apprenticeship','internship','graduate_programme','job'],owner:'test_owner',paused:false,cadenceHours:24,maxBytes:500000 };
async function signup(){const r=await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fixture`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:`${randomUUID()}@example.test`,password:randomUUID(),returnSecureToken:true})});assert.equal(r.status,200);return r.json();}
before(async()=>{
  // Refuse to run destructive test setup against any cloud resource.
  process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-b03';
  configuration();runtime=await getRuntime();store=new Catalogue(runtime.db,runtime.auth,()=>now);
  const user=await signup();uid=user.localId;token=user.idToken;guest=(await signup()).idToken;
  await runtime.db.doc(`m0_operators/${uid}`).set({active:true,roles:['reviewer','source']});
});
after(async()=>{await runtime?.db.terminate();});
const fetchFixture=async(_source,url)=>({url,text:JSON.stringify(makeRecord())});
async function ingest(key='first',fetcher=fetchFixture){const j=await store.enqueue(token,{sourceId:source.id,url:source.urls[0],key},'Test ingestion');return store.runJob(token,j.id,fetcher);}

test('production/emulator guards reject unsafe configuration before SDK creation',()=>{
  assert.equal(configuration({}),null);
  for(const env of [
    {NODE_ENV:'production',FIREBASE_AUTH_EMULATOR_HOST:''},
    {SKILVED_CATALOGUE_MODE:'cloud',SKILVED_CATALOGUE_PROJECT:'demo-test'},
    {SKILVED_CATALOGUE_MODE:'emulator',SKILVED_CATALOGUE_PROJECT:'real-project'},
    {SKILVED_CATALOGUE_MODE:'emulator',SKILVED_CATALOGUE_PROJECT:'demo-test',FIRESTORE_EMULATOR_HOST:'evil.test:8080',FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099'},
  ]) assert.throws(()=>configuration(env),/UNSAFE_CONFIGURATION/);
});
test('fetch address and exact allowlist reject private/reserved/mapped/credential routes',()=>{
  for(const address of ['127.0.0.1','10.0.0.1','169.254.169.254','100.64.0.1','192.168.1.1','192.0.2.1','224.0.0.1','::1','fc00::1','fe80::1','::ffff:8.8.8.8','2001:db8::1'])assert.equal(publicAddress(address),false,address);
  assert.equal(publicAddress('8.8.8.8'),true);
  for(const url of ['http://source.example/notice','https://source.example/other','https://user:pass@source.example/notice','https://source.example:8443/notice','https://127.0.0.1/','https://source.example/notice#frag']) assert.throws(()=>approvedUrl(url,source));
});
test('verified identity and server-owned current role required; forged token and guest denied',async()=>{
  await assert.rejects(store.registerSource('',source,null,'Register fixture'),/UNAUTHORIZED/);
  await assert.rejects(store.registerSource('forged',source,null,'Register fixture'),/UNAUTHORIZED/);
  await assert.rejects(store.registerSource(guest,source,null,'Register fixture'),/FORBIDDEN/);
  await store.registerSource(token,source,null,'Register fixture');
  await runtime.db.doc(`m0_operators/${uid}`).update({active:false});
  await assert.rejects(store.queue(token,'sources'),/FORBIDDEN/);
  await runtime.db.doc(`m0_operators/${uid}`).update({active:true});
});
let id,snapshotId;
test('ingestion is idempotent, strips approval/checks, stores snapshot and remains private',async()=>{
  const first=await ingest();id=first.recordId;snapshotId=first.snapshotId;assert.equal(first.state,'done');
  const draft=await store.inspect(token,'drafts',id);assert.equal(draft.publication.approved,false);assert.equal(draft.checks.length,0);assert.equal(draft.title.review,'pending');
  await assert.rejects(store.detail(id),/NOT_FOUND/);
  const job=await store.enqueue(token,{sourceId:source.id,url:source.urls[0],key:'first'},'Duplicate');assert.equal(job.state,'done');
  await assert.rejects(store.runJob(token,job.id,fetchFixture),/JOB_UNAVAILABLE/);
  assert.equal((await store.inspect(token,'snapshots',snapshotId)).hash.length,64);
  assert.equal((await store.inspect(token,'snapshots',snapshotId)).sourceRevision,1);
  assert.equal((await runtime.db.collection('m0_source_versions').get()).size,1);
});
test('review publication persists across client recreation and excludes private content',async()=>{
  const draft=await store.inspect(token,'drafts',id);
  const p=await store.publish(token,id,draft.revision,'publish','Reviewed synthetic facts');assert.equal(p.revision,2);
  const restarted=new Catalogue(runtime.db,runtime.auth,()=>now);
  const detail=await restarted.detail(id);assert.equal(detail.kind,'opportunity');assert.equal(detail.opportunity.application.state,'unavailable');
  assert.doesNotMatch(JSON.stringify(detail),/PRIVATE_|reviewedBy|sourceSnapshotIds/);
  assert.equal((await store.list(new URLSearchParams())).items.length,1);
});
test('stale and concurrent reviewer actions conflict and retain atomic audit/version history',async()=>{
  await assert.rejects(store.publish(token,id,1,'close','Stale close'),/CONFLICT/);
  const results=await Promise.allSettled([store.publish(token,id,2,'withhold','Review concern'),store.publish(token,id,2,'close','Close notice')]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await store.inspect(token,'drafts',id)).revision,3);
  assert.ok((await store.queue(token,'audit')).items.length>0);
  assert.ok((await store.queue(token,'outbox')).items.length>0);
});
test('restore is explicit; serious reports restrict immediately and report bodies stay private',async()=>{
  await store.publish(token,id,3,'restore','Recheck synthetic notice');
  assert.deepEqual(await store.report({opportunityId:id,kind:'unsafe_destination',text:'PRIVATE_REPORT_SENTINEL'}),{status:'received'});
  assert.deepEqual(await store.report({opportunityId:'does_not_exist',kind:'other',text:'Unknown record'}),{status:'received'});
  const report=(await store.queue(token,'reports')).items.find(r=>r.opportunityId===id);
  await assert.rejects(store.triage(guest,report.id,1,'serious','Restrict'),/FORBIDDEN/);
  await store.triage(token,report.id,1,'serious','Credible concern needs review');
  assert.equal((await store.detail(id)).status.status,'under_review');
  assert.equal((await store.list(new URLSearchParams())).items.length,0);
});
test('source correction invalidates old public output; withdrawn records cannot be revived by ingestion',async()=>{
  let draft=await store.inspect(token,'drafts',id);await store.publish(token,id,draft.revision,'restore','Reviewed correction');
  const result=await ingest('changed',async(s,url)=>{const r=makeRecord();r.summary.value='Changed synthetic notice';return {url,text:JSON.stringify(r)};});
  assert.equal(result.recordId,id);assert.equal((await store.detail(id)).status.status,'under_review');
  draft=await store.inspect(token,'drafts',id);await store.publish(token,id,draft.revision,'withdraw','Withdraw notice');
  await ingest('changed_again',async(s,url)=>{const r=makeRecord();r.summary.value='Another change';return {url,text:JSON.stringify(r)};});
  draft=await store.inspect(token,'drafts',id);assert.equal(draft.lifecycle,'withdrawn');
  await assert.rejects(store.publish(token,id,draft.revision,'publish','Must not revive'),/RESTORE_REQUIRES_REVIEW/);
  assert.equal((await store.detail(id)).status.status,'withdrawn');
});
test('public reports lead to authenticated correction and current public wording across six categories and both internships',async()=>{
  const provider=async()=>({config:{reads:true,reports:true},catalogue:store});
  for(const fixture of allFixtures()){
    const key=`report_correction_${fixture.category}_${fixture.internship?.subtype??'none'}`;
    const result=await ingest(key,async(s,url)=>{fixture.id=key;return{url,text:JSON.stringify(fixture)};});
    await store.publish(token,result.recordId,1,'publish','Reviewed synthetic correction journey');
    const response=await handle(new Request('https://skilved.test/api/v1/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({opportunityId:result.recordId,kind:'incorrect',text:'PRIVATE_CORRECTION_REPORT'})}),undefined,provider);
    assert.equal(response.status,202);assert.deepEqual(await response.json(),{status:'received'});
    const report=(await store.queue(token,'reports')).items.find(r=>r.opportunityId===result.recordId);
    assert.ok(report);await assert.rejects(store.triage(guest,report.id,1,'serious','Unauthorized'),/FORBIDDEN/);
    await store.triage(token,report.id,1,'serious','Source conditions need correction');
    const read=()=>handle(new Request('https://skilved.test/api/v1/opportunities/'+result.recordId),result.recordId,provider);
    let publicResponse=await read();assert.equal(publicResponse.headers.get('cache-control'),'no-store');
    assert.equal((await publicResponse.json()).status.status,'under_review');
    assert.equal((await store.list(new URLSearchParams())).items.some(o=>o.id===result.recordId),false);
    const draft=await store.inspect(token,'drafts',result.recordId),previousRevision=draft.revision;
    draft.revision++;draft.practicalConditions.value='Corrected synthetic attendance condition';draft.practicalConditions.originalText='Synthetic source correction: attendance is two days each week.';
    await assert.rejects(store.saveDraft(token,draft,previousRevision-1,'Stale correction'),/CONFLICT/);
    await store.saveDraft(token,draft,previousRevision,'Reviewed source correction');
    assert.equal((await (await read()).json()).status.status,'under_review');
    await store.publish(token,draft.id,draft.revision,'restore','Explicit reviewer restoration after correction');
    publicResponse=await read();assert.equal(publicResponse.status,200);
    const current=await publicResponse.json();assert.equal(current.kind,'opportunity');
    assert.equal(current.opportunity.category,fixture.category);assert.deepEqual(current.opportunity.internship,fixture.internship);
    assert.equal(current.opportunity.practicalConditions.originalText,'Synthetic source correction: attendance is two days each week.');
    assert.doesNotMatch(JSON.stringify(current),/PRIVATE_|reviewedBy|sourceSnapshotIds|reviewerNotes/);
    assert.ok((await store.list(new URLSearchParams())).items.some(o=>o.id===result.recordId));
    await store.publish(token,draft.id,current.opportunity.revision,'withhold','End isolated correction journey');
  }
});
test('separate intake identities, filter completeness, stable pagination and stale cursors',async()=>{
  for(let i=0;i<4;i++){
    const result=await ingest(`intake_${i}`,async(s,url)=>{const r=makeRecord(i%2?'job':'bursary');r.id=`intake_${i}`;r.summary.value=`needle ${i}`;r.location.value.coverage='national';return {url,text:JSON.stringify(r)};});
    await store.publish(token,result.recordId,1,'publish','Reviewed another intake');
  }
  const params=new URLSearchParams('q=needle&province=western_cape&limit=1');
  const page=await store.list(params);assert.equal(page.items.length,1);assert.ok(page.nextCursor);
  params.set('cursor',page.nextCursor);const next=await store.list(params);assert.notEqual(page.items[0].id,next.items[0].id);
  const all=await store.list(new URLSearchParams('category=job&q=needle'));assert.equal(all.items.length,2);
  await store.publish(token,page.items[0].id,page.items[0].revision,'withhold','Restrict current');
  await assert.rejects(store.list(params),/STALE_CURSOR/);
  await assert.rejects(store.list(new URLSearchParams('admin=true')),/INVALID_QUERY/);
});
test('reviewed destination needs exact revision check; editing draft immediately restricts publication',async()=>{
  const result=await ingest('handoff',async(s,url)=>{const r=makeRecord();r.id='handoff';return{url,text:JSON.stringify(r)};});
  let draft=await store.inspect(token,'drafts',result.recordId);draft.revision++;
  draft.checks=[{id:'relationship',scope:'application_relationship',outcome:'supported',checkedAt:now,nextCheckAt:null,reviewerId:'not_authoritative',citationIds:['source_notice'],recordRevision:2,destination:draft.applicationRoute.value.destination,public:true,notes:'PRIVATE_CHECK_NOTES'}];
  await store.saveDraft(token,draft,1,'Reviewed destination relationship');
  await store.publish(token,draft.id,2,'publish','Review complete');
  const detail=await store.detail(draft.id);assert.equal(detail.opportunity.application.state,'available');
  draft=await store.inspect(token,'drafts',draft.id);draft.revision++;draft.applicationRoute.value.destination='https://issuer.example/new-route';
  await store.saveDraft(token,draft,3,'Material destination correction');
  assert.equal((await store.detail(draft.id)).status.status,'under_review');
  await store.publish(token,draft.id,4,'publish','Facts reviewed without route check');
  assert.equal((await store.detail(draft.id)).opportunity.application.state,'unavailable');
});
test('confirmed aliases hide duplicate, cycle is rejected, reversal retains original withdrawal',async()=>{
  const list=await store.list(new URLSearchParams());const target=list.items[0].id;
  await store.alias(token,{schemaVersion:1,fromId:id,toId:target,revision:1,decision:'confirmed'},null,'Reviewed duplicate identity');
  assert.equal((await store.detail(id)).opportunity.id,target);
  await assert.rejects(store.alias(token,{schemaVersion:1,fromId:target,toId:id,revision:1,decision:'confirmed'},null,'Cycle'),/NOT_FOUND|ALIAS_CYCLE/);
  await store.alias(token,{schemaVersion:1,fromId:id,toId:target,revision:2,decision:'reversed'},1,'Mistaken merge reversed');
  assert.equal((await store.detail(id)).status.status,'withdrawn');
});
test('failure retains last success; retries bounded; lease recovery and pause prevent completion',async()=>{
  const j=await store.enqueue(token,{sourceId:source.id,url:source.urls[0],key:'failure'},'Retry test');
  const healthBefore=(await runtime.db.doc('m0_source_health/test_source').get()).data();
  for(let i=0;i<3;i++){await store.runJob(token,j.id,async()=>{throw new Error('SECRET_NETWORK_ERROR');});now=new Date(Date.parse(now)+200000).toISOString();}
  assert.equal((await store.inspect(token,'jobs',j.id)).state,'failed');
  await assert.rejects(store.runJob(token,j.id,fetchFixture),/JOB_UNAVAILABLE/);
  assert.deepEqual((await runtime.db.doc('m0_source_health/test_source').get()).data(),healthBefore);
  const leaseJob=await store.enqueue(token,{sourceId:source.id,url:source.urls[0],key:'lease'},'Lease test');
  const lease=await store.inspect(token,'jobs',leaseJob.id);await runtime.db.doc(`m0_jobs/${leaseJob.id}`).set(json({...lease,lease:'old',leaseUntil:'2020-01-01T00:00:00.000Z'}));
  assert.equal((await store.runJob(token,leaseJob.id,fetchFixture)).state,'done');
  await store.registerSource(token,{...source,revision:2,paused:true},1,'Pause source');
  await assert.rejects(store.enqueue(token,{sourceId:source.id,url:source.urls[0],key:'paused'},'Cannot fetch'),/SOURCE_PAUSED/);
});
test('source pause during retrieval fences completion and source lease bounds concurrent work',async()=>{
  await store.registerSource(token,{...source,revision:3,paused:false},2,'Resume controlled test');
  const a=await store.enqueue(token,{sourceId:source.id,url:source.urls[0],key:'inflight'},'In flight test');
  const b=await store.enqueue(token,{sourceId:source.id,url:source.urls[0],key:'parallel'},'Parallel test');
  await assert.rejects(store.runJob(token,a.id,async(s,url)=>{
    await assert.rejects(store.runJob(token,b.id,fetchFixture),/SOURCE_BUSY/);
    await store.registerSource(token,{...source,revision:4,paused:true},3,'Pause during retrieval');return fetchFixture(s,url);
  }),/SOURCE_CHANGED/);
  assert.equal((await store.inspect(token,'jobs',a.id)).state,'running');
  now=new Date(Date.parse(now)+31000).toISOString();
  await store.registerSource(token,{...source,revision:5,paused:false},4,'Resume after expired lease');
  assert.equal((await store.runJob(token,a.id,fetchFixture)).state,'done');
});
test('public HTTP uses safe status, no-store, bounded report validation and disabled mode',async()=>{
  const provider=async()=>({config:{reads:true,reports:true},catalogue:store});
  let r=await handle(new Request('https://skilved.test/api/v1/opportunities?admin=true'),undefined,provider);assert.equal(r.status,400);assert.equal(r.headers.get('cache-control'),'no-store');
  r=await handle(new Request('https://skilved.test/api/v1/opportunities'),'private_id',provider);assert.equal(r.status,404);
  r=await handle(new Request('https://skilved.test/api/v1/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:'a'.repeat(9000)}),undefined,provider);assert.equal(r.status,413);
  r=await handle(new Request('https://skilved.test/api/v1/opportunities'),undefined,async()=>({config:{reads:false}}));assert.equal(r.status,503);
});
test('direct unauthenticated Firestore client access denied by emulator rules',async()=>{
  const r=await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/demo-skilved-b03/databases/(default)/documents/m0_sources/test_source`);
  assert.equal(r.status,403);
});
test('new operator process reads persistent history through real token verification',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'skilved-b03-'));
  try {
    await writeFile(join(directory,'token'),token,{mode:0o600});
    await writeFile(join(directory,'command.json'),JSON.stringify({command:'inspect',collection:'drafts',id}),{mode:0o600});
    const {stdout}=await promisify(execFile)(process.execPath,['tools/operator.mjs',join(directory,'command.json')],{env:{...process.env,SKILVED_OPERATOR_TOKEN_FILE:join(directory,'token')},timeout:20000});
    assert.equal(JSON.parse(stdout).id,id);
  }finally{await rm(directory,{recursive:true,force:true});}
});
test('report quota survives service recreation; disabled authenticated user rejected',async()=>{
  const bucket=now.slice(0,13).replace(/[^0-9]/g,'');await runtime.db.doc(`m0_report_limits/${bucket}`).set(json({count:99}));
  await store.report({opportunityId:id,kind:'other',text:'Last slot'});
  await assert.rejects(new Catalogue(runtime.db,runtime.auth,()=>now).report({opportunityId:id,kind:'other',text:'Over quota'}),/RATE_LIMITED/);
  await runtime.auth.updateUser(uid,{disabled:true});
  await assert.rejects(store.queue(token,'drafts'),/UNAUTHORIZED/);
});

test('listed-field filtering precedes pagination and excludes unknown fields only when selected',async()=>{
  const { projectOpportunity } = await import('@skilved/types/opportunities/internal');
  const ids=[];
  try {
    for(let i=0;i<5;i++){
      const r=makeRecord();r.id='field_page_'+i;r.title.value='Synthetic field pagination';r.fields=i%2===0?[]:['Café & Engineering'];
      r.updatedAt='2026-10-15T10:00:0'+i+'.000Z';ids.push(r.id);
      await runtime.db.doc('m0_public/'+r.id).set(json(projectOpportunity(r)));
    }
    const params=new URLSearchParams({q:'Synthetic field pagination',field:'café & engineering',limit:'1'});
    const first=await store.list(params);assert.deepEqual(first.items.map(o=>o.id),['field_page_3']);assert.ok(first.nextCursor);
    params.set('cursor',first.nextCursor);const second=await store.list(params);
    assert.deepEqual(second.items.map(o=>o.id),['field_page_1']);assert.equal(second.nextCursor,null);
    params.set('field','Nursing');await assert.rejects(store.list(params),/INVALID_CURSOR/);
    const all=await store.list(new URLSearchParams({q:'Synthetic field pagination'}));assert.equal(all.items.length,5);
    assert.equal(all.items.filter(o=>o.fields.length===0).length,3);
  } finally { for(const recordId of ids) await runtime.db.doc('m0_public/'+recordId).delete(); }
});

test('entry-stage ingestion resets supplied approval, explicit reviewer publishes it and edits restrict public output',async()=>{
  const actor=await signup(),stageToken=actor.idToken;
  await runtime.db.doc('m0_operators/'+actor.localId).set({active:true,roles:['reviewer','source']});
  const stageSource={...source,id:'stage_source'};
  await store.registerSource(stageToken,stageSource,null,'Register synthetic stage source');
  const job=await store.enqueue(stageToken,{sourceId:stageSource.id,url:stageSource.urls[0],key:'stage_ingestion'},'Stage ingestion');
  const result=await store.runJob(stageToken,job.id,async(s,url)=>{
    const record=makeRecord();record.id='stage_fixture';
    record.entryStage={...record.title,id:'stage_assertion',value:['student','graduate'],originalText:'Synthetic students and graduates may apply.'};
    return{url,text:JSON.stringify(record)};
  });
  assert.equal(result.state,'done');
  let draft=await store.inspect(stageToken,'drafts',result.recordId);
  assert.equal(draft.entryStage.review,'pending');assert.equal(draft.entryStage.reviewedBy,null);
  assert.deepEqual(draft.entryStage.sourceSnapshotIds,[result.snapshotId]);
  assert.deepEqual(draft.entryStage.evidenceRefs,[result.snapshotId]);
  await store.publish(stageToken,draft.id,1,'publish','Human reviewed source stage wording');
  draft=await store.inspect(stageToken,'drafts',draft.id);
  assert.equal(draft.entryStage.reviewedBy,actor.localId);assert.equal(draft.entryStage.review,'approved');
  assert.deepEqual((await store.detail(draft.id)).opportunity.entryStage.value,['student','graduate']);
  draft.revision++;draft.entryStage.value=['experienced'];draft.entryStage.originalText='Synthetic experienced applicants only.';
  await store.saveDraft(stageToken,draft,2,'Correct source-stated stage');
  assert.equal((await store.detail(draft.id)).status.status,'under_review');
  assert.equal((await store.list(new URLSearchParams())).items.some(o=>o.id===draft.id),false);
  await store.publish(stageToken,draft.id,3,'publish','Human reviewed stage correction');
  assert.deepEqual((await store.detail(draft.id)).opportunity.entryStage.value,['experienced']);
});

test('source-stated stage filtering precedes pagination while legacy and uncertain records remain browsable',async()=>{
  const {projectOpportunity}=await import('@skilved/types/opportunities/internal');
  const ids=[];
  try {
    for(let i=0;i<6;i++){
      const r=makeRecord();r.id='stage_page_'+i;r.title.value='Synthetic stage pagination';r.fields=['Engineering'];
      if(i%2===1) r.entryStage={...r.title,id:'stage_assertion',value:['student','graduate'],originalText:'Synthetic students and graduates.'};
      if(i===4) r.entryStage={...r.title,id:'stage_assertion',state:'ambiguous',value:null,originalText:'Synthetic unclear stage.'};
      r.updatedAt='2026-10-15T10:00:0'+i+'.000Z';
      const projection=projectOpportunity(r);assert.equal(projection.kind,'opportunity');
      if(i===0)delete projection.opportunity.entryStage;
      ids.push(r.id);await runtime.db.doc('m0_public/'+r.id).set(json(projection));
    }
    const params=new URLSearchParams({q:'Synthetic stage pagination',stage:'graduate',field:'Engineering',limit:'1'}),seen=[];
    for(let page=0;page<3;page++){
      const result=await store.list(params);assert.equal(result.items.length,1);seen.push(result.items[0].id);
      if(page<2){assert.ok(result.nextCursor);params.set('cursor',result.nextCursor);}
      else assert.equal(result.nextCursor,null);
    }
    assert.deepEqual(seen,['stage_page_5','stage_page_3','stage_page_1']);
    params.set('stage','experienced');await assert.rejects(store.list(params),/INVALID_CURSOR/);
    const all=await store.list(new URLSearchParams({q:'Synthetic stage pagination'}));
    assert.equal(all.items.length,6);assert.equal(all.items.find(o=>o.id==='stage_page_0').entryStage.state,'not_stated');
  }finally{for(const id of ids)await runtime.db.doc('m0_public/'+id).delete();}
});
