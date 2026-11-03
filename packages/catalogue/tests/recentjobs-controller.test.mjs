import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {getRuntime} from '../src/runtime.mjs';
import {RecentJobsController,planRecentJobsWake} from '../src/recentjobs-controller.mjs';
import {RECENTJOBS_INDEX} from '../src/worker-policy.mjs';
import {syntheticExtraction} from './fixtures/recentjobs-model.mjs';
import {runRecentJobsController} from '../src/recentjobs-runner.mjs';

const hash = s => createHash('sha256').update(s).digest('hex');
const payload = row => ({json:JSON.stringify(row)});
const value = row => row.exists ? JSON.parse(row.data().json) : null;
const html = await readFile(new URL('./fixtures/recentjobs-synthetic.html',import.meta.url),'utf8');
const at = '2026-09-26T21:59:59.000Z', reset = '2026-09-26T22:00:00.000Z';
let db;
before(async()=>{
  process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-controller';
  db=(await getRuntime()).db;
});
after(async()=>{await db?.terminate();});

function plan(changes={}) {
  return planRecentJobsWake({sourceId:'authored_source',cadenceHours:24,at,jobs:[],
    discoveryPending:false,discoveryScheduled:true,...changes});
}
function job(id='authored_job',changes={}) {
  return {id,sourceId:'authored_source',kind:'detail',state:'pending',nextAt:reset,leaseUntil:null,...changes};
}
test('wake planner honors stored quota reset and future retries alongside existing counters',()=>{
  assert.equal(plan({jobs:[job()]}).nextWakeAt,reset);
  assert.equal(plan({jobs:[job('marker',{nextAt:at,sourceBudgetResetAt:reset})]}).nextWakeAt,reset);
  assert.equal(plan({jobs:[job()],at:reset}).state,'ready');
  const later='2026-09-26T22:03:04.000Z';
  assert.equal(plan({jobs:[job('authored_job',{nextAt:later})]}).nextWakeAt,later);
  assert.equal(plan().nextWakeAt,'2026-09-27T00:00:00.000Z');
});
test('wake planner respects both leases, overdue priority and discovery continuation',()=>{
  const due=job('due',{nextAt:at}), held=job('held',{nextAt:at,leaseUntil:reset,state:'running'});
  assert.deepEqual(plan({jobs:[held,due]}).dueJobIds,['due']);
  assert.equal(plan({jobs:[due],sourceLeaseUntil:reset}).nextWakeAt,reset);
  assert.equal(plan({jobs:[held]}).nextWakeAt,reset);
  assert.equal(plan({discoveryScheduled:false}).state,'ready');
  assert.equal(plan({discoveryScheduled:false,discoveryPending:true,jobs:[job()]}).nextWakeAt,reset);
  assert.deepEqual(plan({jobs:[due,job('discovery',{kind:'discover',nextAt:at})]}).dueJobIds,['discovery','due']);
});
test('wake planner rejects hidden overflow and corrupt or cross-source queue state',()=>{
  assert.throws(()=>plan({jobs:Array.from({length:201},(_,i)=>job(`job_${i}`))}),{code:'CONTROLLER_QUEUE_CAPACITY'});
  for(const jobs of [[job(),job()],[job('bad',{sourceId:'other'})],[job('bad',{nextAt:'invalid'})],
    [job('bad',{state:'done'})],[job('bad',{leaseUntil:'invalid'})],[null]])
    assert.throws(()=>plan({jobs}),{code:'CONTROLLER_STATE_INVALID'});
});

async function fixture({count=1,calls=2}={}) {
  const sourceId=`controller_${randomUUID()}`,principal=`${randomUUID()}@example.test`;
  let now=at;
  const state={requests:[],extractions:0,validations:0,afterFetch:null};
  const urls=Array.from({length:count},(_,i)=>`https://recentjobs.co.za/2026/09/26/authored-controller-${i}/`);
  const source={id:sourceId,revision:1,name:'Authored controller source',urls:[RECENTJOBS_INDEX],
    permission:{reference:'Synthetic test only',method:'recentjobs_html',reuse:'Authored fixtures',reviewedAt:at},
    categories:['apprenticeship'],owner:'authored_owner',paused:false,cadenceHours:24,maxBytes:500000,
    automation:{mode:'shadow',employerCrawl:true,qualificationRef:'Synthetic only',maxArticles:10,discovery:{maxPages:1},
      maxModelCallsPerDay:calls,minRequestIntervalMs:2000,checkTtlHours:24,
      issuers:[{name:'Fictional Workshop',host:'employer.example',pathPrefix:'/apply',evidence:'Synthetic relationship'}]}};
  const options={sourceId,sourceRevision:1,now:()=>now,sleep:async()=>{},fetcher:async(_source,url)=>{
    state.requests.push(url);await state.afterFetch?.(url);
    if(url.endsWith('/robots.txt'))return {url,text:'User-agent: *\nAllow: /'};
    if(url===RECENTJOBS_INDEX)return {url,text:`<div class="articles-wrap">${urls.map(url=>`<article class="type-post"><h2 class="entry-title"><a href="${url}">Fictional apprentice</a></h2></article>`).join('')}</div>`};
    if(urls.includes(url))return {url,text:count===1?html:'<article class="type-post"><h1 class="entry-title">Fictional apprentice</h1><div class="entry-content"><p>Authored incomplete notice.</p></div></article>'};
    if(url==='https://employer.example/apply')return {url,text:`<script type="application/ld+json">${JSON.stringify({'@type':'JobPosting',title:'Electrical apprentice',hiringOrganization:{name:'Fictional Workshop'},validThrough:'2026-10-30',description:'Fictional Workshop seeks an electrical apprentice. Applicants require Grade 12 with Mathematics OR N3 Electrical.'})}</script>`};
    assert.fail('Unexpected synthetic fetch');
  },extractor:async()=>{state.extractions++;return {extraction:syntheticExtraction(),provenance:{model:'synthetic',usage:{totalTokens:20}}};},
  validator:async()=>{state.validations++;return {supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'},{source:'primary',quote:'Fictional Workshop'}],provenance:{model:'synthetic',usage:{totalTokens:20}}};}};
  const controller=new RecentJobsController(db,principal,options),worker=controller.worker;
  await worker.ref('sources',sourceId).set(payload(source));
  const grant={principal,active:true,sources:[sourceId],roles:['ingest']};
  await worker.ref('workers',worker.actor).set(grant);
  return {controller,worker,source,sourceId,state,grant,options,
    restart:()=>new RecentJobsController(db,principal,options),now:()=>now,
    advance:ms=>{now=new Date(Date.parse(now)+ms).toISOString();}};
}

test('normal tick persists source-budget wake, survives restart and resumes the same job at exact SAST renewal',async()=>{
  const f=await fixture(),budget={sourceId:f.sourceId,date:'2026-09-26',calls:2};
  const oldRef=f.worker.ref('model_budgets',hash(`${f.sourceId}:2026-09-26`));
  await oldRef.set(payload(budget));
  const first=await f.controller.tick();
  assert.equal(first.nextWakeAt,reset);assert.equal(first.queued,1);assert.equal(first.outcomes.pending,1);
  assert.equal(f.state.extractions,0);assert.equal(f.state.validations,0);
  const queue=(await db.collection('m0_worker_queue').where('sourceId','==',f.sourceId).get()).docs;
  const jobRef=f.worker.ref('worker_jobs',queue[0].id),saved=value(await jobRef.get()),requests=f.state.requests.length;
  assert.equal(saved.sourceBudgetWaits,1);assert.equal(saved.attempts,1);
  const second=await f.restart().tick();
  assert.equal(second.nextWakeAt,reset);assert.equal(second.results.length,0);
  assert.deepEqual(value(await jobRef.get()),saved);assert.equal(f.state.requests.length,requests);
  f.advance(999);assert.equal((await f.restart().tick()).results.length,0);
  f.advance(1);const resumed=await f.restart().tick();
  assert.equal(resumed.results.length,1);assert.equal(resumed.outcomes.done,1);assert.equal(resumed.queued,0);
  assert.equal(f.state.extractions,1);assert.equal(f.state.validations,1);
  assert.deepEqual(value(await oldRef.get()),budget);
  assert.equal(value(await f.worker.ref('model_budgets',hash(`${f.sourceId}:2026-09-27`)).get()).calls,2);
  assert.equal(value(await jobRef.get()).attempts,2);assert.equal(value(await jobRef.get()).sourceBudgetWaits,1);
  assert.equal((await f.worker.ref('public',resumed.results[0].recordId).get()).exists,false);
  assert.equal((await f.worker.ref('drafts',resumed.results[0].recordId).get()).exists,true);
});
test('bounded ticks drain discovery continuations and isolate notice holds across process restarts',async()=>{
  const f=await fixture({count:21});
  const one=await f.controller.tick();assert.equal(one.results.length,11);assert.equal(one.state,'ready');
  assert.equal(Date.parse(one.nextWakeAt)-Date.parse(f.now()),60000);
  const two=await f.restart().tick();assert.equal(two.results.length,11);
  const three=await f.restart().tick();assert.equal(three.queued,0);
  const rows=(await db.collection('m0_worker_jobs').where('json','!=','').get()).docs.map(value).filter(row=>row.sourceId===f.sourceId);
  assert.equal(rows.length,24);assert.ok(rows.every(row=>row.attempts===1));
  assert.equal(rows.filter(row=>row.state==='exception').length,21);
  assert.equal(f.state.extractions,0);assert.equal(f.state.validations,0);
  assert.equal(value(await f.worker.ref('worker_controllers',f.sourceId).get()).sourceRevision,1);
});
test('a crashed claim stays leased, then normal lease recovery resumes without duplicate jobs',async()=>{
  const f=await fixture(),id=await f.worker.schedule(f.sourceId),claim=await f.worker.claim(f.sourceId,id);
  const waiting=await f.restart().tick();assert.equal(waiting.nextWakeAt,claim.leaseUntil);assert.equal(waiting.results.length,0);
  assert.equal(f.state.requests.length,0);
  f.advance(Date.parse(claim.leaseUntil)-Date.parse(f.now()));
  const recovered=await f.restart().tick();assert.ok(recovered.results.length>0);
  assert.equal(value(await f.worker.ref('worker_jobs',id).get()).attempts,2);
});
test('concurrent controllers share the existing job/source leases and never duplicate acquisition or model work',async()=>{
  const f=await fixture();
  const results=await Promise.all([f.controller.tick(),f.restart().tick()]);
  assert.equal(results.flatMap(r=>r.results).filter(r=>r.recordId).length,1);
  assert.equal(f.state.extractions,1);assert.equal(f.state.validations,1);
  const id=hash(`${f.sourceId}:discover:${Math.floor(Date.parse(f.now())/86400000)}`);
  assert.equal(value(await f.worker.ref('worker_jobs',id).get()).attempts,1);
});
test('policy, pause and grant fences reject before scheduling or checkpointing',async()=>{
  for(const change of ['revision','paused','automatic','inactive','publish','expired']){
    const f=await fixture();
    if(['revision','paused','automatic'].includes(change))await f.worker.ref('sources',f.sourceId).set(payload({...f.source,
      ...(change==='revision'?{revision:2}:change==='paused'?{paused:true}:{automation:{...f.source.automation,mode:'automatic'}})}));
    else await f.worker.ref('workers',f.worker.actor).set({...f.grant,...(change==='inactive'?{active:false}:change==='publish'?{roles:['ingest','publish']}:{expiresAt:f.now()})});
    await assert.rejects(f.controller.tick(),{code:change==='revision'?'CONTROLLER_POLICY_CHANGED':
      ['publish','automatic'].includes(change)?'CONTROLLER_SHADOW_ONLY':change==='paused'?'SOURCE_PAUSED':'WORKER_FORBIDDEN'});
    assert.equal(f.state.requests.length,0);assert.equal(f.state.extractions,0);
    assert.equal((await f.worker.ref('worker_controllers',f.sourceId).get()).exists,false);
  }
});
test('policy changes during acquisition fence every following transaction and retain recoverable leases',async()=>{
  const f=await fixture();let changed=false;
  f.state.afterFetch=async()=>{if(!changed){changed=true;await f.worker.ref('sources',f.sourceId).set(payload({...f.source,revision:2}));}};
  await assert.rejects(f.controller.tick(),{code:'CONTROLLER_POLICY_CHANGED'});
  assert.equal(f.state.requests.length,1);assert.equal(f.state.extractions,0);
  assert.equal((await f.worker.ref('worker_controllers',f.sourceId).get()).exists,false);
});
test('the pinned policy is rechecked after pacing before the first network request',async()=>{
  const f=await fixture();let changed=false;
  const controller=new RecentJobsController(db,f.grant.principal,{...f.options,sleep:async()=>{
    if(!changed){changed=true;await f.worker.ref('sources',f.sourceId).set(payload({...f.source,revision:2}));}
  }});
  await assert.rejects(controller.tick(),{code:'CONTROLLER_POLICY_CHANGED'});
  assert.equal(f.state.requests.length,0);assert.equal(f.state.extractions,0);
});
test('queue overflow refuses execution rather than hiding future work past a bounded query',async()=>{
  const f=await fixture();await f.worker.schedule(f.sourceId);
  const batch=db.batch();
  for(let i=0;i<200;i++){
    const id=`extra_${i}`;
    batch.set(f.worker.ref('worker_jobs',id),payload(job(id,{sourceId:f.sourceId,nextAt:f.now()})));
    batch.set(f.worker.ref('worker_queue',id),{sourceId:f.sourceId});
  }
  await batch.commit();
  await assert.rejects(f.controller.tick(),{code:'CONTROLLER_QUEUE_CAPACITY'});
  assert.equal(f.state.requests.length,0);assert.equal(f.state.extractions,0);
});
test('a still-ready unclaimable job stops with an operational error rather than repeated polling',async()=>{
  const f=await fixture(),id=await f.worker.schedule(f.sourceId),ref=f.worker.ref('worker_jobs',id);
  await ref.set(payload({...value(await ref.get()),modelWindowRetries:6}));
  await assert.rejects(f.controller.tick(),{code:'CONTROLLER_STATE_INVALID'});
  assert.equal(f.state.requests.length,0);assert.equal(f.state.extractions,0);
  assert.equal((await f.worker.ref('worker_controllers',f.sourceId).get()).exists,false);
});
test('idle probes enforce admission without any writes and the SDK rejects attempted read-only mutation',async()=>{
  const f=await fixture(),audits=(await db.collection('m0_audit').get()).size;
  assert.equal((await f.controller.probe()).state,'ready');
  assert.equal((await db.collection('m0_audit').get()).size,audits);
  const ref=f.worker.ref('worker_controllers',f.sourceId);
  await assert.rejects(f.worker.transaction(f.sourceId,'authored.readonly',async tx=>tx.set(ref,payload({unexpected:true})),false,{readOnly:true}),/read-only transactions cannot execute writes/);
  assert.equal((await ref.get()).exists,false);assert.equal((await db.collection('m0_audit').get()).size,audits);
});
test('the runner waits through source renewal and completes the same normal job',async()=>{
  const f=await fixture(),oldRef=f.worker.ref('model_budgets',hash(`${f.sourceId}:2026-09-26`)),budget={sourceId:f.sourceId,date:'2026-09-26',calls:2};
  await oldRef.set(payload(budget));await f.controller.tick();let elapsed=0;
  const result=await runRecentJobsController({createController:async()=>f.restart(),maxTicks:1,maxRunMs:2000,
    now:()=>Date.parse(f.now()),monotonic:()=>elapsed,wait:async ms=>{f.advance(ms);elapsed+=ms;}});
  assert.equal(result.reason,'max_ticks');assert.equal(result.ticks,1);assert.equal(f.now(),reset);
  assert.equal(f.state.extractions,1);assert.equal(f.state.validations,1);assert.deepEqual(value(await oldRef.get()),budget);
  assert.equal((await db.collection('m0_worker_queue').where('sourceId','==',f.sourceId).get()).size,0);
});
test('repeated waiting probes preserve jobs, audit and controller metadata until a bounded stop',async()=>{
  const f=await fixture(),oldRef=f.worker.ref('model_budgets',hash(`${f.sourceId}:2026-09-26`));
  await oldRef.set(payload({sourceId:f.sourceId,date:'2026-09-26',calls:2}));await f.controller.tick();
  const ref=f.worker.ref('worker_controllers',f.sourceId),saved=(await ref.get()).data(),audit=(await db.collection('m0_audit').get()).size,requests=f.state.requests.length;
  let elapsed=0;const result=await runRecentJobsController({createController:async()=>f.restart(),maxRunMs:500,pollMs:100,
    now:()=>Date.parse(f.now()),monotonic:()=>elapsed,wait:async ms=>{f.advance(ms);elapsed+=ms;}});
  assert.equal(result.ticks,0);assert.equal(result.reason,'max_runtime');assert.equal(f.state.requests.length,requests);
  assert.deepEqual((await ref.get()).data(),saved);assert.equal((await db.collection('m0_audit').get()).size,audit);
});
test('a revoked grant while waiting stops before further network, spending or checkpoint writes',async()=>{
  const f=await fixture(),oldRef=f.worker.ref('model_budgets',hash(`${f.sourceId}:2026-09-26`));
  await oldRef.set(payload({sourceId:f.sourceId,date:'2026-09-26',calls:2}));await f.controller.tick();
  const requests=f.state.requests.length,ref=f.worker.ref('worker_controllers',f.sourceId),saved=(await ref.get()).data();let elapsed=0;
  await assert.rejects(runRecentJobsController({createController:async()=>f.restart(),maxRunMs:2000,pollMs:100,
    now:()=>Date.parse(f.now()),monotonic:()=>elapsed,wait:async ms=>{f.advance(ms);elapsed+=ms;await f.worker.ref('workers',f.worker.actor).set({...f.grant,active:false});}}),{code:'WORKER_FORBIDDEN'});
  assert.equal(f.state.requests.length,requests);assert.equal(f.state.extractions,0);assert.deepEqual((await ref.get()).data(),saved);
});
test('graceful stop drains the admitted discovery job and prevents a subsequent detail claim',async()=>{
  const f=await fixture(),stopping=new AbortController();f.state.afterFetch=()=>stopping.abort();
  const result=await runRecentJobsController({createController:async()=>f.restart(),signal:stopping.signal,maxRunMs:2000});
  assert.equal(result.reason,'signal');assert.equal(result.ticks,1);assert.equal(f.state.extractions,0);
  const queue=(await db.collection('m0_worker_queue').where('sourceId','==',f.sourceId).get()).docs;
  assert.equal(queue.length,1);assert.equal(value(await f.worker.ref('worker_jobs',queue[0].id).get()).attempts,0);
});
test('runtime exhaustion during a tick drains one job and prevents the rest of the batch',async()=>{
  const f=await fixture();let elapsed=0;
  f.state.afterFetch=()=>{f.advance(100);elapsed+=100;};
  const result=await runRecentJobsController({createController:async()=>f.restart(),maxRunMs:100,
    now:()=>Date.parse(f.now()),monotonic:()=>elapsed});
  assert.equal(result.reason,'max_runtime');assert.equal(result.ticks,1);assert.equal(f.state.extractions,0);
  const queue=(await db.collection('m0_worker_queue').where('sourceId','==',f.sourceId).get()).docs;
  assert.equal(queue.length,1);assert.equal(value(await f.worker.ref('worker_jobs',queue[0].id).get()).attempts,0);
});
