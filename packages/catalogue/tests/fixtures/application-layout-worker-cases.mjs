import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {syntheticExtraction} from './recentjobs-model.mjs';
import {RECENTJOBS_INDEX} from '../../src/worker-policy.mjs';
import {APPLICATION_LAYOUTS_PROFILE} from '../../src/worker-detail-adapter.mjs';

// Reusable normal-worker acceptance cases. During the pinned-run wait these are
// executed against the exact prepared integration in an isolated local copy.
export function registerApplicationLayoutWorkerCases(test,db,Worker,Source) {
  const payload=v=>({json:JSON.stringify(v)}),value=s=>s.exists?JSON.parse(s.data().json):null;
  const hash=s=>createHash('sha256').update(s).digest('hex');
  const url='https://recentjobs.co.za/2026/09/26/fictional-apprentice/';
  const emailQuote='HOW TO APPLY\nAPPLICATION EMAIL\napplications@employer.example\nEmail subject:\nAuthored intake 2027';
  const email='<h2>HOW TO APPLY</h2><p>APPLICATION EMAIL</p><p>applications@employer.example</p><p>Email subject:</p><p>Authored intake 2027</p>';
  const footer='<footer><div><a href="https://whatsapp.com/channel/authored">Join our WhatsApp group</a></div><div><a href="https://employer.example/apply/new">Apply now online</a></div></footer>';
  const anchor='<a href="https://employer.example/apply">Apply now</a>';
  const detailResult=r=>r.results.find(r=>r.recordId);
  async function fixture({opted=true,route='email',registered=true,deadline=true,calls=10}={}) {
    const id='layout_'+randomUUID(),principal=randomUUID()+'@example.test';let at='2026-09-26T10:00:00.000Z';
    const base=await readFile(new URL('./recentjobs-synthetic.html',import.meta.url),'utf8');
    const state={requests:[],extractions:0,validations:0,html:base.replace(anchor,route==='email'?email:route==='footer'?footer:anchor)};
    if(!deadline)state.html=state.html.replace('<p>Closing date: 30 October 2026</p>','');
    const source={id,revision:1,name:'Authored layout integration',urls:[RECENTJOBS_INDEX],permission:{reference:'Authored only',method:'recentjobs_html',reuse:'Synthetic tests only',reviewedAt:at},categories:['apprenticeship'],owner:'fixture_owner',paused:false,cadenceHours:1,maxBytes:500000,
      automation:{mode:'shadow',employerCrawl:false,...(opted?{applicationLayouts:'shadow_v1'}:{}),qualificationRef:'Synthetic integration only',maxArticles:10,maxModelCallsPerDay:calls,minRequestIntervalMs:2000,checkTtlHours:24,issuers:[{name:'Fictional Workshop',aliases:[],host:'employer.example',pathPrefix:'/apply',emailAddresses:registered?['applications@employer.example']:[],evidence:'Authored only'}]}};
    const options={now:()=>at,sleep:async()=>{},fetcher:async(_source,target)=>{
      state.requests.push(target);
      if(target==='https://recentjobs.co.za/robots.txt')return{url:target,text:'User-agent: *\nAllow: /'};
      if(target===RECENTJOBS_INDEX)return{url:target,text:`<div class="articles-wrap"><article class="type-post"><h2 class="entry-title"><a href="${url}">Fictional electrical apprentice</a></h2></article></div>`};
      if(target===url)return{url:target,text:state.html};assert.fail('Unexpected employer or external retrieval');
    },extractor:async candidate=>{state.extractions++;const extraction=syntheticExtraction();if(candidate.applicationCandidates[0].method==='email')extraction.practicalConditions={state:'stated',value:emailQuote,quote:emailQuote};return{extraction,provenance:{usage:{totalTokens:20}}};},
    validator:async()=>{state.validations++;return{supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'}],provenance:{usage:{totalTokens:20}}};}};
    const worker=new Worker(db,principal,options);await worker.ref('sources',id).set(payload(source));await worker.ref('workers',worker.actor).set({principal,active:true,sources:[id],roles:['ingest']});
    return{worker,state,source,id,advance:()=>{at=new Date(Date.parse(at)+3600000).toISOString();},restart:()=>new Worker(db,principal,options),save:()=>worker.ref('sources',id).set(payload(source)),hold:async()=>value(await worker.ref('worker_holds',hash(id+':'+url)).get()),budget:async()=>value(await worker.ref('model_budgets',hash(id+':2026-09-26')).get()),details:()=>state.requests.filter(r=>r===url).length,base,footer,anchor};
  }
  async function cacheRows(){return(await db.collection('m0_model_cache').get()).docs.map(d=>[d.id,d.data()]).sort((a,b)=>a[0].localeCompare(b[0]));}

  test('prepared source schema restricts the opt-in to explicit shadow mode',async()=>{
    const f=await fixture();assert.equal(Source.parse(f.source).automation.applicationLayouts,'shadow_v1');
    for(const mode of ['automatic','disabled'])assert.equal(Source.safeParse({...f.source,automation:{...f.source.automation,mode}}).success,false);
    for(const applicationLayouts of [false,null,'shadow_v2'])assert.equal(Source.safeParse({...f.source,automation:{...f.source.automation,applicationLayouts}}).success,false);
  });
  test('opt-in email reaches an unapproved private draft and restart reuses real extraction/validation caches',async()=>{
    const f=await fixture(),first=detailResult(await f.worker.run(f.id));assert.ok(first);assert.equal(first.published,false);
    const draft=value(await f.worker.ref('drafts',first.recordId).get());assert.equal(draft.applicationRoute.value.destination,'applications@employer.example');assert.equal(draft.publication.approved,false);assert.ok(draft.practicalConditions.originalText.includes('Authored intake 2027'));
    const caches=await cacheRows(),budget=await f.budget();f.advance();const again=detailResult(await f.restart().run(f.id));assert.ok(again);assert.equal(again.snapshotId,first.snapshotId);
    assert.equal(f.state.extractions,1);assert.equal(f.state.validations,1);assert.deepEqual(await cacheRows(),caches);assert.deepEqual(await f.budget(),budget);assert.equal(budget.calls,2);assert.equal(f.details(),2);
    assert.equal((await f.worker.ref('public',first.recordId).get()).exists,false);assert.ok(f.state.requests.every(r=>r.startsWith('https://recentjobs.co.za/')));
  });
  test('enabling the parser releases a legacy hold while preserving its original exception and history',async()=>{
    const f=await fixture({opted:false});await f.worker.run(f.id);const hold=await f.hold();assert.equal(hold.reason,'NOTICE_PRECISION_UNSUPPORTED');assert.equal(Object.hasOwn(hold,'detailAdapterProfile'),false);assert.equal(f.state.extractions,0);
    f.source.automation.applicationLayouts='shadow_v1';await f.save();f.advance();const result=detailResult(await f.restart().run(f.id));assert.ok(result);assert.equal(result.published,false);assert.equal(f.details(),2);
    assert.deepEqual(await f.hold(),hold);assert.equal(value(await f.worker.ref('worker_jobs',hold.jobId).get()).state,'exception');assert.equal((await f.worker.ref('worker_exceptions',hold.jobId).get()).exists,true);assert.equal((await f.budget()).calls,2);
  });
  test('disabling the parser releases enhanced holds and later legacy retries reuse the new hold without spending',async()=>{
    const f=await fixture({deadline:false});await f.worker.run(f.id);const enhanced=await f.hold();assert.equal(enhanced.detailAdapterProfile,APPLICATION_LAYOUTS_PROFILE);
    delete f.source.automation.applicationLayouts;await f.save();f.advance();const second=await f.restart().run(f.id);assert.ok(!second.results.some(r=>r.sourceHeld));assert.equal(f.details(),2);const legacy=await f.hold();assert.equal(Object.hasOwn(legacy,'detailAdapterProfile'),false);
    f.advance();assert.ok((await f.restart().run(f.id)).results.some(r=>r.sourceHeld));assert.equal(f.details(),2);assert.equal(f.state.extractions,0);assert.equal(f.state.validations,0);assert.equal(await f.budget(),null);
    assert.equal(value(await f.worker.ref('worker_jobs',enhanced.jobId).get()).state,'exception');
  });
  test('unchanged content shares caches across profile changes without creating a new model allowance',async()=>{
    const f=await fixture({route:'legacy'}),first=detailResult(await f.worker.run(f.id));assert.ok(first);const cache=await cacheRows(),budget=await f.budget();
    delete f.source.automation.applicationLayouts;await f.save();f.advance();const second=detailResult(await f.restart().run(f.id));assert.ok(second);assert.equal(second.snapshotId,first.snapshotId);
    assert.deepEqual(await cacheRows(),cache);assert.deepEqual(await f.budget(),budget);assert.equal(f.state.extractions,1);assert.equal(f.state.validations,1);
  });
  test('changed footer content separates snapshots and caches while preserving source identity and actual spend',async()=>{
    const f=await fixture({opted:false,route:'legacy'}),first=detailResult(await f.worker.run(f.id));assert.ok(first);const cache=await cacheRows();
    f.source.automation.applicationLayouts='shadow_v1';await f.save();f.state.html=f.base.replace(f.anchor,f.footer);f.advance();const next=detailResult(await f.restart().run(f.id));assert.ok(next);assert.equal(next.recordId,first.recordId);assert.notEqual(next.snapshotId,first.snapshotId);
    const after=await cacheRows();for(const row of cache)assert.deepEqual(after.find(r=>r[0]===row[0]),row);assert.equal(after.length,cache.length+2);assert.equal((await f.budget()).calls,4);assert.equal(f.state.extractions,2);assert.equal(f.state.validations,2);
    const draft=value(await f.worker.ref('drafts',next.recordId).get());assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply/new');assert.equal(draft.publication.approved,false);assert.doesNotMatch(value(await f.worker.ref('snapshots',next.snapshotId).get()).text,/WhatsApp/);
  });
  test('parser changes cannot evade an exhausted source allowance or replace the prior draft',async()=>{
    const f=await fixture({opted:false,route:'legacy',calls:2}),first=detailResult(await f.worker.run(f.id));assert.ok(first);const draft=value(await f.worker.ref('drafts',first.recordId).get()),cache=await cacheRows(),budget=await f.budget();
    f.source.automation.applicationLayouts='shadow_v1';await f.save();f.state.html=f.base.replace(f.anchor,f.footer);f.advance();const result=await f.restart().run(f.id);assert.ok(result.results.some(r=>r.reason==='MODEL_BUDGET_EXHAUSTED'));
    assert.equal(f.state.extractions,1);assert.equal(f.state.validations,1);assert.deepEqual(await f.budget(),budget);assert.deepEqual(await cacheRows(),cache);assert.deepEqual(value(await f.worker.ref('drafts',first.recordId).get()),draft);
    assert.equal((await f.worker.ref('public',first.recordId).get()).exists,false);
  });
  test('unqualified email recipients and undated footer methods still stop before model work and drafting',async()=>{
    for(const options of [{registered:false},{route:'footer',deadline:false}]){
      const f=await fixture(options),result=await f.worker.run(f.id);assert.ok(result.results.some(r=>['ISSUER_RELATIONSHIP_UNQUALIFIED','NOTICE_PRECISION_UNSUPPORTED'].includes(r.reason)));
      assert.equal(f.state.extractions,0);assert.equal(f.state.validations,0);assert.equal(await f.budget(),null);assert.equal((await f.worker.ref('drafts',hash(f.id+':'+hash(url))).get()).exists,false);
    }
  });
}
