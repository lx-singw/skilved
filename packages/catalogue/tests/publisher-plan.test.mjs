import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {planRecentJobsPublisher} from '../src/publisher-plan.mjs';
import {planPublisherCli} from '../tools/plan-recentjobs-publisher.mjs';
const source={id:'existing_publisher',revision:2,name:'Earlier pilot',urls:['https://recentjobs.co.za/category/apprenticeships/','https://recentjobs.co.za/2026/11/01/authored/'],
 permission:{reference:'Authored permission',method:'recentjobs_html',reuse:'Private tests',reviewedAt:'2026-11-01T00:00:00.000Z'},categories:['apprenticeship'],owner:'reviewer',paused:false,cadenceHours:24,maxBytes:500000,
 automation:{mode:'shadow',employerCrawl:true,undatedNotices:'reject',originalVerification:'shadow_v1',qualificationRef:'Authored pilot',maxArticles:1,maxModelCallsPerDay:2,minRequestIntervalMs:3000,checkTtlHours:24,
 issuers:[{name:'Authored Workshop',aliases:[],host:'employer.example',pathPrefix:'/jobs/one',emailAddresses:[],evidence:'Authored exact scope'}]}};
const fixture=()=>({source:structuredClone(source),observedAt:'2026-11-02T10:00:00.000Z',budgets:[{sourceId:source.id,date:'2026-11-01',calls:7},{sourceId:source.id,date:'2026-11-02',calls:2}],discovery:{maxPages:2,maxArticles:10}});

test('publisher proposal retains identity, trust, acquisition choices and historical overspend without changing input',()=>{
 const input=fixture(),before=structuredClone(input),p=planRecentJobsPublisher(input),s=p.command.source;
 assert.equal(s.id,source.id);assert.equal(s.revision,3);assert.equal(p.command.expected,2);assert.equal(p.requiredRole,'source');
 for(const key of ['owner','permission','urls','categories','paused','cadenceHours','maxBytes'])assert.deepEqual(s[key],source[key]);
 for(const key of ['issuers','employerCrawl','originalVerification','undatedNotices','maxModelCallsPerDay','minRequestIntervalMs','checkTtlHours'])assert.deepEqual(s.automation[key],source.automation[key]);
 assert.deepEqual(s.automation.discovery,{maxPages:2});assert.equal(s.automation.maxArticles,10);assert.equal(s.automation.mode,'shadow');
 assert.deepEqual(p.budgetHistory.rows.map(r=>r.calls),[7,2]);assert.equal(p.sourceBudget.remaining,0);assert.equal(p.sourceBudget.earliestModelAdmission,'2026-11-02T22:00:00.000Z');
 assert.equal(p.applied,false);assert.equal(p.cloudWrites,0);assert.equal(p.providerCalls,0);assert.equal(p.publication,false);assert.deepEqual(input,before);
});

test('source-day renewal does not rewrite earlier spend or change the cap',()=>{
 const input=fixture();input.observedAt='2026-11-02T22:00:00.000Z';const p=planRecentJobsPublisher(input);
 assert.equal(p.sourceBudget.day,'2026-11-03');assert.equal(p.sourceBudget.calls,0);assert.equal(p.sourceBudget.remaining,2);assert.equal(p.sourceBudget.earliestModelAdmission,input.observedAt);assert.deepEqual(p.budgetHistory.rows.map(r=>r.calls),[7,2]);
 input.budgets.push({sourceId:source.id,date:'2026-11-03',calls:3});assert.equal(planRecentJobsPublisher(input).sourceBudget.remaining,0);
});

test('missing source-day rows preserve history and do not manufacture a replacement source',()=>{
 const input=fixture();input.budgets.pop();input.source.automation.employerCrawl=false;
 const p=planRecentJobsPublisher(input);assert.equal(p.command.source.id,source.id);assert.equal(p.command.source.automation.employerCrawl,false);assert.equal(p.sourceBudget.remaining,2);assert.equal(p.budgetHistory.rows.length,1);
});

test('automatic, paused, nonpublisher and unconfigured inputs cannot obtain an expansion command',()=>{
 for(const change of [s=>{s.paused=true;},s=>{s.automation.mode='disabled';},s=>{s.automation.mode='automatic';s.automation.originalVerification=undefined;s.cadenceHours=24;},s=>{s.permission.method='structured_json';},s=>{s.urls=s.urls.slice(1);},s=>{s.categories=['job'];},s=>{delete s.automation;}]){
  const input=fixture();change(input.source);assert.throws(()=>planRecentJobsPublisher(input),e=>/^PUBLISHER_PLAN_/.test(e.code));
 }
});

test('mixed-source, duplicate, invalid-date and corrupt spend bindings reject without input echo',()=>{
 for(const change of [b=>{b[0].sourceId='other';},b=>{b.push({...b[1]});},b=>{b[0].date='2026-02-30';},b=>{b[0].calls=-1;},b=>{b[0].calls=1.2;},b=>{b[0].extra='PRIVATE_TOKEN_VALUE';}]){
  const input=fixture();change(input.budgets);assert.throws(()=>planRecentJobsPublisher(input),e=>/^PUBLISHER_PLAN_/.test(e.code)&&!e.message.includes('PRIVATE_TOKEN_VALUE'));
 }
});

test('discovery and revision bounds cannot shrink current processing or exceed supported limits',()=>{
 for(const discovery of [{maxPages:6,maxArticles:10},{maxPages:2,maxArticles:11},{maxPages:0,maxArticles:10},{maxPages:2,maxArticles:0},{maxPages:1,maxArticles:5}]){
  const input=fixture();input.source.automation.discovery={maxPages:2};input.source.automation.maxArticles=10;input.discovery=discovery;
  assert.throws(()=>planRecentJobsPublisher(input),e=>/^PUBLISHER_PLAN_/.test(e.code));
 }
 const input=fixture();input.source.revision=Number.MAX_SAFE_INTEGER;assert.throws(()=>planRecentJobsPublisher(input),{code:'PUBLISHER_PLAN_INVALID'});
});

test('review hashes bind source changes, requested bounds and spend while ignoring object-key ordering',()=>{
 const input=fixture(),p=planRecentJobsPublisher(input);assert.equal(planRecentJobsPublisher({...input,source:Object.fromEntries(Object.entries(input.source).reverse()),budgets:[...input.budgets].reverse()}).sha256,p.sha256);
 const omitted=fixture();omitted.source.automation.missingDateEvidence=undefined;assert.equal(planRecentJobsPublisher(omitted).sha256,p.sha256);
 for(const change of [x=>{x.source.revision++;},x=>{x.source.automation.maxModelCallsPerDay++;},x=>{x.budgets[1].calls++;},x=>{x.discovery.maxPages++;}]){
  const changed=fixture();change(changed);assert.notEqual(planRecentJobsPublisher(changed).sha256,p.sha256);
 }
});

test('CLI emits a bounded private proposal and rejects malformed files without connecting to a service',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'skilved-publisher-plan-'));try{
  const path=join(dir,'input.json');await writeFile(path,JSON.stringify(fixture()));const output=[];const p=await planPublisherCli([path],text=>output.push(text));assert.deepEqual(JSON.parse(output[0]),p);
  await assert.rejects(planPublisherCli([],()=>assert.fail()),/PUBLISHER_PLAN_ARGUMENT_INVALID/);await writeFile(path,'not JSON PRIVATE_TOKEN_VALUE');await assert.rejects(planPublisherCli([path]),e=>e.message==='PUBLISHER_PLAN_INVALID');
  await writeFile(path,'x'.repeat(2000001));await assert.rejects(planPublisherCli([path]),/PUBLISHER_PLAN_FILE_LIMIT/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
