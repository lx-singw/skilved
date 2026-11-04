import{test}from'node:test';import assert from'node:assert/strict';import{mkdtemp,writeFile,readFile,rm}from'node:fs/promises';import{tmpdir}from'node:os';import{join}from'node:path';
import{planFastIngestionMigration}from'../src/fast-ingestion-migration.mjs';import{planFastHistoryMigrationCli}from'../tools/plan-fast-history-migration.mjs';import{migrationFixture,migrationAt,migrationPayload,migrationHash}from'./fixtures/fast-migration.mjs';
const plan=input=>planFastIngestionMigration(input,{now:()=>migrationAt});
test('migration preserves earlier evidence, canonical identities and retained raw data without republishing history',()=>{
 const f=migrationFixture(),before=structuredClone(f.input),r=plan(f.input);assert.equal(r.noticeCount,1);assert.equal(r.readyForHistoryImport,true);assert.equal(r.noticePlans[0].firstKnownObservationAt,'2026-10-30T10:00:00.000Z');assert.equal(r.noticePlans[0].sloEligible,false);assert.equal(r.proposedTargetSource.id,f.sourceId);assert.equal(r.proposedTargetSource.revision,2);assert.equal(r.proposedTargetSource.automation.maxModelCallsPerDay,2);assert.equal(r.sourcePolicyApplied,false);assert.equal(r.cacheAliasesCreated,false);
 const job=JSON.parse(r.proposed.find(p=>p.collection==='m0_ingestion_jobs').data.json),notice=JSON.parse(r.proposed.find(p=>p.collection==='m0_ingestion_notices').data.json);assert.equal(job.state,'held');assert.equal(job.attempts,0);assert.equal(job.firstSeenAt,'2026-10-30T10:00:00.000Z');assert.equal(job.history.sloEligible,false);assert.equal(notice.firstPollId,null);assert.deepEqual(f.input,before);assert.doesNotMatch(JSON.stringify(r),/AUTHORED_PRIVATE_BODY_DO_NOT_PRINT|PRIVATE_RESPONSE_DO_NOT_PRINT|2000-01-01/);
});
test('pending work, queue entries, active grants, lease ownership and scheduled runs block import',()=>{
 for(const change of ['job','queue','grant','lease','schedule','pause']){
  const f=migrationFixture();if(change==='job')f.input.snapshot.collections.m0_worker_jobs[0].data=migrationPayload({...JSON.parse(f.input.snapshot.collections.m0_worker_jobs[0].data.json),state:'pending'});
  if(change==='queue')f.put('worker_queue','authored_queue',{sourceId:f.sourceId},true);
  if(change==='grant')f.put('workers','authored_worker',{active:true,sources:[f.sourceId],roles:['ingest']},true);
  if(change==='lease')f.put('worker_leases',f.sourceId,{lease:'authored',until:'2026-11-04T10:01:00.000Z'});
  if(change==='schedule')f.input.externalRuns.push({id:'authored_scheduled_run',sourceId:f.sourceId,sourceRevision:1,state:'scheduled',plannedAt:'2026-11-04T21:40:00.000Z'});
  if(change==='pause')f.input.snapshot.collections.m0_sources[0].data=migrationPayload({...f.source,paused:false});
  assert.equal(plan(f.input).readyForHistoryImport,false,change);
 }
});
test('a retry time, publisher date or snapshot capture cannot manufacture an unknown notice age',()=>{
 const f=migrationFixture();f.input.snapshot.collections.m0_snapshots=[];f.input.snapshot.collections.m0_drafts=[];const row=JSON.parse(f.input.snapshot.collections.m0_worker_jobs[0].data.json);delete row.sourceRetrievedAt;row.sourcePublishedAt='2000-01-01T00:00:00.000Z';f.input.snapshot.collections.m0_worker_jobs[0].data=migrationPayload(row);
 const r=plan(f.input);assert.equal(r.noticePlans[0].firstKnownObservationAt,null);assert.ok(r.blockers.includes('LEGACY_NOTICE_AGE_UNKNOWN'));assert.equal(r.proposed.length,0);
});
test('missing inventory, duplicate documents, invalid observation times and identity conflicts refuse',()=>{
 const missing=migrationFixture();delete missing.input.snapshot.collections.m0_model_usage;assert.throws(()=>plan(missing.input),/FAST_MIGRATION_INVENTORY_INCOMPLETE/);
 const duplicate=migrationFixture();duplicate.input.snapshot.collections.m0_model_cache.push(duplicate.input.snapshot.collections.m0_model_cache[0]);assert.throws(()=>plan(duplicate.input),/FAST_MIGRATION_DUPLICATE_DOCUMENT/);
 const future=migrationFixture();future.input.snapshot.collections.m0_snapshots[0].data=migrationPayload({sourceId:future.sourceId,url:future.url,retrievedAt:'2026-11-04T10:00:00.001Z'});assert.throws(()=>plan(future.input),/FAST_MIGRATION_TIMESTAMP_INVALID/);
 const identity=migrationFixture();const job=JSON.parse(identity.input.snapshot.collections.m0_worker_jobs[0].data.json);identity.input.snapshot.collections.m0_worker_jobs[0].data=migrationPayload({...job,recordId:'wrong_record'});assert.ok(plan(identity.input).blockers.includes('LEGACY_IDENTITY_CONFLICT'));
});
test('inventory order is immaterial, but raw history changes invalidate the reviewed fingerprint',()=>{
 const f=migrationFixture(),r=plan(f.input),reordered=structuredClone(f.input);for(const rows of Object.values(reordered.snapshot.collections))rows.reverse();reordered.snapshot.collections=Object.fromEntries(Object.entries(reordered.snapshot.collections).reverse());assert.equal(plan(reordered).sha256,r.sha256);
 const changed=structuredClone(f.input);changed.snapshot.collections.m0_model_budgets[0].data=migrationPayload({sourceId:f.sourceId,date:'2026-11-04',calls:1});assert.notEqual(plan(changed).sha256,r.sha256);
 const stale=planFastIngestionMigration(f.input,{now:()=> '2026-11-04T10:15:00.001Z'});assert.equal(stale.sha256,r.sha256);assert.equal(stale.readyForHistoryImport,false);assert.ok(stale.blockers.includes('SNAPSHOT_NOT_CURRENT'));
});
test('public history remains a separate migration requirement',()=>{
 const f=migrationFixture();f.put('public',f.recordId,{authoredPublicMarker:true});assert.ok(plan(f.input).blockers.includes('PUBLIC_HISTORY_REQUIRES_SEPARATE_MIGRATION'));
});
test('CLI writes a private review plan and keeps source bodies and provider answers out of stdout',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'skilved-history-plan-'));let reportPath;try{const f=migrationFixture(),path=join(dir,'input.json');await writeFile(path,JSON.stringify(f.input));const output=[];await planFastHistoryMigrationCli([path],s=>output.push(s),{now:()=>migrationAt});const result=JSON.parse(output[0]);reportPath=result.report;assert.equal(result.readyForHistoryImport,true);assert.doesNotMatch(output[0],/AUTHORED_PRIVATE|PRIVATE_RESPONSE|authored-apprenticeship/);assert.equal(JSON.parse(await readFile(reportPath,'utf8')).noticeCount,1);}finally{if(reportPath)await rm(reportPath);await rm(dir,{recursive:true,force:true});}
});
test('oversized per-notice provenance refuses atomic import before reaching a database write limit',()=>{
 const f=migrationFixture(),original=JSON.parse(f.input.snapshot.collections.m0_worker_jobs[0].data.json);f.input.snapshot.collections.m0_worker_jobs=[];
 for(let i=0;i<2000;i++){const id=migrationHash('authored-history-'+i);f.input.snapshot.collections.m0_worker_jobs.push({id,data:migrationPayload({...original,id,createdAt:original.sourceRetrievedAt,firstSeenAt:original.sourceRetrievedAt})});}
 const r=plan(f.input);assert.ok(r.blockers.includes('MIGRATION_PROVENANCE_CAPACITY'));assert.equal(r.readyForHistoryImport,false);
});
test('earlier discovery captures and never-queued listing links retain their observed age',()=>{
 const f=migrationFixture(),url='https://recentjobs.co.za/2026/10/29/authored-unprocessed/',index='https://recentjobs.co.za/category/apprenticeships/',list={sourceUrl:index,articles:[{sourceUrl:f.url,title:'Authored known notice'},{sourceUrl:url,title:'Authored unprocessed notice'}],nextPage:null};
 f.put('worker_discovery_pages',migrationHash('listing:'+f.sourceId),{sourceId:f.sourceId,url:index,list,hash:migrationHash(JSON.stringify(list)),retrievedAt:'2026-10-29T10:00:00.000Z'});
 const r=plan(f.input);assert.equal(r.noticeCount,2);assert.ok(r.noticePlans.every(n=>n.firstKnownObservationAt==='2026-10-29T10:00:00.000Z'));assert.equal(r.noticePlans.find(n=>n.url===url).legacyJobIds.length,0);assert.ok(r.proposed.filter(p=>p.collection==='m0_ingestion_jobs').every(p=>JSON.parse(p.data.json).state==='held'));
});
