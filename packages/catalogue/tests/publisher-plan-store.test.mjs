import {test,after} from 'node:test';import assert from 'node:assert/strict';import {randomUUID,createHash} from 'node:crypto';
import {getRuntime} from '../src/runtime.mjs';import {Catalogue} from '../src/store.mjs';import {planRecentJobsPublisher} from '../src/publisher-plan.mjs';
process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-publisher-plan';
const {db}=await getRuntime(),at='2026-11-02T10:00:00.000Z',uid='authored_'+randomUUID(),c=new Catalogue(db,{verifyIdToken:async()=>({uid})},()=>at),hash=v=>createHash('sha256').update(v).digest('hex'),payload=v=>({json:JSON.stringify(v)});
after(async()=>{await db.terminate();});

test('the normal Source API requires current role/revision and preserves spent ledger, old versions and private records on expansion',async()=>{
 const id='publisher_'+randomUUID(),source={id,revision:2,name:'Authored earlier pilot',urls:['https://recentjobs.co.za/category/apprenticeships/'],permission:{reference:'Authored evidence',method:'recentjobs_html',reuse:'Private emulator only',reviewedAt:at},categories:['apprenticeship'],owner:uid,paused:false,cadenceHours:24,maxBytes:500000,
  automation:{mode:'shadow',employerCrawl:false,undatedNotices:'reject',qualificationRef:'Authored scope',maxArticles:1,maxModelCallsPerDay:2,minRequestIntervalMs:3000,checkTtlHours:24,issuers:[]}};
 const budgets=[{sourceId:id,date:'2026-11-01',calls:7},{sourceId:id,date:'2026-11-02',calls:2}],sourceRaw=payload(source),olderVersion=payload({...source,revision:1});
 await c.ref('sources',id).set(sourceRaw);await c.ref('source_versions',hash(id+':1')).set(olderVersion);await c.ref('source_versions',hash(id+':2')).set(sourceRaw);
 for(const b of budgets)await c.ref('model_budgets',hash(id+':'+b.date)).set(payload(b));
 const retained={drafts:{json:'{"fixture":"private unchanged draft"}'},model_cache:{json:'{"fixture":"synthetic cache, not a provider response"}'},worker_jobs:{json:'{"fixture":"pending original job"}'},model_usage:{json:'{"fixture":"existing provider spend"}'},model_availability:{json:'{"fixture":"existing exhaustion hold"}'}};
 for(const [name,data] of Object.entries(retained))await c.ref(name,id).set(data);
 const p=planRecentJobsPublisher({source,observedAt:at,budgets,discovery:{maxPages:2,maxArticles:10}}),command=p.command;
 await c.ref('operators',uid).set({active:true,roles:['reviewer']});
 await assert.rejects(c.registerSource('authored-emulator-identity',command.source,command.expected,command.reason),{code:'FORBIDDEN'});assert.deepEqual((await c.ref('sources',id).get()).data(),sourceRaw);
 await c.ref('operators',uid).set({active:true,roles:['source']});
 assert.deepEqual(await c.registerSource('authored-emulator-identity',command.source,command.expected,command.reason),{revision:3});
 await assert.rejects(c.registerSource('authored-emulator-identity',command.source,command.expected,command.reason),{code:'CONFLICT'});
 assert.deepEqual(JSON.parse((await c.ref('sources',id).get()).data().json),command.source);assert.deepEqual((await c.ref('source_versions',hash(id+':1')).get()).data(),olderVersion);assert.deepEqual((await c.ref('source_versions',hash(id+':2')).get()).data(),sourceRaw);
 for(const b of budgets)assert.deepEqual((await c.ref('model_budgets',hash(id+':'+b.date)).get()).data(),payload(b));
 for(const [name,data] of Object.entries(retained))assert.deepEqual((await c.ref(name,id).get()).data(),data);
 assert.equal((await c.ref('public',id).get()).exists,false);assert.equal(p.sourceBudget.remaining,0);assert.equal(p.command.source.automation.employerCrawl,false);
});
