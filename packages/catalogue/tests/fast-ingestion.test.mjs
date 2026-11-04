import{test}from'node:test';import assert from'node:assert/strict';
import{mkdtemp,writeFile,rm,readFile}from'node:fs/promises';import{tmpdir}from'node:os';import{join}from'node:path';
import{FAST_INGESTION_TARGETS as policy,planFastIngestion,assessFastIngestionCapacity}from'../src/fast-ingestion.mjs';
import{planFastIngestionCli}from'../tools/plan-fast-ingestion.mjs';
const at='2026-11-04T08:00:00.000Z';
const job=(id,kind='new',extra={})=>({id,sourceId:'authored_source',kind,enqueuedAt:'2026-11-04T07:59:00.000Z',nextAt:at,...extra});
const plan=(jobs,extra={})=>planFastIngestion({at,policy,jobs,...extra});
const capacity=()=>({policy,forecast:{dailyNotices:40,peakNoticesPerMinute:4,modelCallsPerNotice:2,retryHeadroomPercent:25},
 limits:{pollIntervalMs:120000,minimumPermittedPollMs:120000,sourceCallsPerDay:100,providerCallsPerDay:100,providerCallsPerMinute:10,processingSlots:5,measuredP95ProcessingMs:60000}});

test('new notices dispatch immediately before routine rechecks, preserving source records and input order',()=>{
 const jobs=[job('refresh','refresh'),job('newer'),job('older','new',{enqueuedAt:'2026-11-04T07:58:00.000Z'})],before=structuredClone(jobs),r=plan(jobs);
 assert.equal(r.selectedJobId,'older');assert.equal(r.reason,'new_notice');assert.equal(r.nextWakeAt,at);assert.equal(r.nextNewSinceRefresh,1);assert.deepEqual(jobs,before);assert.equal(r.publicationAuthorized,false);assert.equal(r.dispatchAdmissionRequired,true);
});
test('new notice bursts yield a routine refresh after the configured number of dispatches',()=>{
 const jobs=[job('new'),job('refresh','refresh')];let state=0;
 for(let i=0;i<3;i++){const r=plan(jobs,{newSinceRefresh:state});assert.equal(r.selectedJobId,'new');state=r.nextNewSinceRefresh;}
 const r=plan(jobs,{newSinceRefresh:state});assert.equal(r.selectedJobId,'refresh');assert.equal(r.reason,'refresh_fairness');assert.equal(r.nextNewSinceRefresh,0);
});
test('imminent and overdue publication rechecks take precedence over new work',()=>{
 const r=plan([job('new'),job('soon','refresh',{freshnessDeadline:'2026-11-04T08:02:00.000Z'}),job('overdue','refresh',{freshnessDeadline:'2026-11-04T07:59:59.999Z'})]);
 assert.equal(r.selectedJobId,'overdue');assert.equal(r.reason,'freshness_deadline');assert.ok(r.incidents.some(i=>i.code==='FRESHNESS_RECHECK_OVERDUE'));
});
test('leases, provider waits and source pacing do not block independent ready notices or grant admission',()=>{
 const r=plan([job('leased','new',{leaseUntil:'2026-11-04T08:10:00.000Z'}),job('paced','new',{nextAt:'2026-11-04T08:01:00.000Z'}),
  job('quota','new',{blockedBy:'provider_quota',resumeAt:'2026-11-04T08:05:00.000Z'}),job('ready')]);
 assert.equal(r.selectedJobId,'ready');assert.equal(r.ready,1);assert.equal(r.blocked,3);assert.equal(r.dispatchAdmissionRequired,true);
 const waiting=plan([job('paced','new',{nextAt:'2026-11-04T08:01:00.000Z'})]);assert.equal(waiting.selectedJobId,null);assert.equal(waiting.nextWakeAt,'2026-11-04T08:01:00.000Z');
});
test('a midnight source-budget wait is a capacity incident, not an acceptable production latency',()=>{
 const r=plan([job('budget','new',{blockedBy:'source_budget',resumeAt:'2026-11-04T22:00:00.000Z'})]);
 assert.equal(r.selectedJobId,null);assert.deepEqual(r.incidents.map(i=>i.code),['SOURCE_CAPACITY_BLOCKS_TARGET']);assert.equal(r.nextWakeAt,'2026-11-04T22:00:00.000Z');
});
test('expired provider cooldowns require bounded renewed admission and never silently become dispatchable',()=>{
 const r=plan([job('quota','new',{blockedBy:'provider_quota',resumeAt:'2026-11-04T07:59:59.000Z'})]);
 assert.equal(r.selectedJobId,null);assert.equal(r.nextWakeAt,'2026-11-04T08:01:00.000Z');
});
test('uncertain evidence and unqualified authority remain isolated from dispatch and ready-work latency',()=>{
 const held=[job('evidence','new',{enqueuedAt:'2026-11-01T08:00:00.000Z',blockedBy:'evidence'}),job('authority','new',{blockedBy:'authority'})];
 const r=plan(held);assert.equal(r.selectedJobId,null);assert.equal(r.nextWakeAt,null);assert.deepEqual(r.incidents,[]);assert.equal(r.blocked,2);
 assert.equal(plan([...held,job('ready')]).selectedJobId,'ready');
});
test('backlog alerts trigger at the exact boundary without hiding active leased jobs',()=>{
 const r=plan([job('boundary','new',{enqueuedAt:'2026-11-04T07:55:00.000Z',leaseUntil:'2026-11-04T08:01:00.000Z'}),job('before','new',{enqueuedAt:'2026-11-04T07:55:00.001Z'})]);
 assert.deepEqual(r.incidents.map(i=>i.jobId),['boundary']);assert.equal(r.incidents[0].ageMs,300000);assert.equal(r.overTarget,2);assert.equal(r.oldestTimedAgeMs,300000);
});
test('malformed and duplicate queue records reject rather than disappear from the denominator',()=>{
 for(const jobs of [[job('same'),job('same')],[job('future','new',{enqueuedAt:'2026-11-04T08:00:00.001Z'})],
  [job('missing','new',{blockedBy:'source_budget'})],[job('wrong','new',{freshnessDeadline:at})],
  [job('wrong','new',{resumeAt:at})],Array.from({length:501},(_,i)=>job('job_'+i))])assert.throws(()=>plan(jobs));
 assert.equal(plan([]).nextWakeAt,null);
});
test('capacity estimates include both AI stages and retry headroom without approving production',()=>{
 const r=assessFastIngestionCapacity(capacity());assert.equal(r.requiredCallsPerDay,100);assert.equal(r.requiredCallsPerMinute,10);assert.equal(r.requiredSlots,5);assert.equal(r.capacityEstimatePasses,true);assert.equal(r.liveSloVerified,false);assert.equal(r.qualification,false);assert.equal(r.publicationAuthorized,false);
});
test('staging daily limits, slow polling and insufficient concurrent capacity fail production targets',()=>{
 const input=capacity();Object.assign(input.limits,{pollIntervalMs:86400000,sourceCallsPerDay:2,providerCallsPerDay:20,providerCallsPerMinute:5,processingSlots:1});
 assert.deepEqual(assessFastIngestionCapacity(input).failures,['DISCOVERY_TOO_SLOW','SOURCE_DAILY_CAPACITY_TOO_LOW','PROVIDER_DAILY_CAPACITY_TOO_LOW','PROVIDER_MINUTE_CAPACITY_TOO_LOW','PROCESSING_CONCURRENCY_TOO_LOW']);
});
test('unknown service times, slow processing and polling-permission conflicts cannot receive a passing forecast',()=>{
 const unknown=capacity();unknown.limits.measuredP95ProcessingMs=null;assert.ok(assessFastIngestionCapacity(unknown).failures.includes('PROCESSING_LATENCY_UNMEASURED'));
 unknown.limits.providerCallsPerDay=null;unknown.limits.providerCallsPerMinute=null;assert.ok(assessFastIngestionCapacity(unknown).failures.includes('PROVIDER_DAILY_CAPACITY_UNMEASURED'));assert.ok(assessFastIngestionCapacity(unknown).failures.includes('PROVIDER_MINUTE_CAPACITY_UNMEASURED'));
 const slow=capacity();slow.limits.measuredP95ProcessingMs=180001;assert.ok(assessFastIngestionCapacity(slow).failures.includes('PROCESSING_TOO_SLOW'));
 const permission=capacity();permission.limits.minimumPermittedPollMs=300000;assert.ok(assessFastIngestionCapacity(permission).failures.includes('POLL_PERMISSION_CONFLICT'));
 const oneStage=capacity();oneStage.forecast.modelCallsPerNotice=1;assert.throws(()=>assessFastIngestionCapacity(oneStage));
});
test('offline CLI produces a private report without exposing job IDs or accepting inconsistent targets',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'skilved-fast-plan-'));let reportPath;
 try{
  const path=join(directory,'input.json'),input={version:1,capacity:capacity(),queue:{at,policy,jobs:[job('private_job_marker')]}};
  await writeFile(path,JSON.stringify(input));const output=[];const report=await planFastIngestionCli([path],text=>output.push(text));reportPath=JSON.parse(output[0]).report;
  assert.equal(report.dispatch.selectedJobId,'private_job_marker');assert.doesNotMatch(output[0],/private_job_marker/);assert.equal(report.providerCalls,0);assert.equal(report.cloudWrites,0);assert.equal(report.publicationAuthorized,false);
  assert.equal(JSON.parse(await readFile(reportPath,'utf8')).dispatch.selectedJobId,'private_job_marker');
  input.queue.policy={...policy,pollIntervalMs:300000};await writeFile(path,JSON.stringify(input));await assert.rejects(planFastIngestionCli([path],()=>{}),/FAST_INGESTION_POLICY_MISMATCH/);
  await writeFile(path,'x'.repeat(1000001));await assert.rejects(planFastIngestionCli([path],()=>{}),/FAST_INGESTION_FILE_LIMIT/);
 }finally{if(reportPath)await rm(reportPath);await rm(directory,{recursive:true,force:true});}
});
