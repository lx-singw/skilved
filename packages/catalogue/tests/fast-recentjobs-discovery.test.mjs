import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {FastRecentJobsWorker} from '../src/fast-recentjobs-worker.mjs';
import {FastRecentJobsDiscovery} from '../src/fast-recentjobs-discovery.mjs';
import {FastNoticeDispatcher} from '../src/fast-notice-dispatcher.mjs';
import {parseRecentJobsList} from '../src/adapters/recentjobs.mjs';
import {RECENTJOBS_INDEX} from '../src/worker-policy.mjs';
import {getRuntime} from '../src/runtime.mjs';
import {originalFixture} from './fixtures/original-notices.mjs';
import {syntheticExtraction} from './fixtures/recentjobs-model.mjs';

const hash=s=>createHash('sha256').update(s).digest('hex'),payload=v=>({json:JSON.stringify(v)}),value=s=>s.exists?JSON.parse(s.data().json):null;
const pageUrl=n=>n===1?RECENTJOBS_INDEX:`${RECENTJOBS_INDEX}page/${n}/`;
const html=(articles,next)=>`<div class="articles-wrap">${articles.map(a=>`<article class="type-post"><h2 class="entry-title"><a href="${a.detailUrl}">Authored electrical apprentice</a></h2></article>`).join('')}</div>${next?`<nav class="posts-navigation"><a href="${next}">Older posts</a></nav>`:''}`;
let db;
before(async()=>{process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-fast-discovery';db=(await getRuntime()).db;});
after(async()=>{await db?.terminate();});
async function fixture({sizes=[5,2],maxPages=sizes.length,chunk=2,gemini=false}={}) {
  let at='2026-10-29T10:00:00.000Z';const id='discovery_'+randomUUID(),principal=randomUUID()+'@example.test';
  const authored=Array.from({length:sizes.reduce((a,b)=>a+b,0)+1},(_,i)=>originalFixture({slug:'authored-fast-discovery-'+i,path:'/tenant-a/job/'+(600+i)+'/',reference:null}));
  const source=structuredClone(authored[0].source);source.id=id;source.automation.employerCrawl=false;delete source.automation.originalVerification;
  source.automation.maxArticles=chunk;source.automation.discovery={maxPages};source.automation.fastIngestion={version:'shadow_v1',discoveryIntervalMs:120000,maxConcurrentJobs:2,leaseMs:600000};
  const state={fetches:[],robots:'User-agent: *\nAllow: /',hook:null,invalid:null,extractions:0,validations:0,lists:[]};let offset=0;
  sizes.forEach((n,i)=>{state.lists.push(html(authored.slice(offset,offset+n),i+1<sizes.length?pageUrl(i+2):null));offset+=n;});
  const options={enabled:true,sourceId:id,sourceRevision:1,now:()=>at,provider:gemini?'gemini':'groq',
    ...(gemini?{env:{SKILVED_CATALOGUE_MODE:'emulator',SKILVED_CATALOGUE_PROJECT:db.projectId,SKILVED_GEMINI_PROJECT_ID:'authored-'+randomUUID(),SKILVED_GEMINI_AUTHORITY_PROJECT:db.projectId,SKILVED_GEMINI_AUTHORITY_EPOCH:'a'.repeat(64)}}:{}),
    sleep:async ms=>{at=new Date(Date.parse(at)+ms).toISOString();},fetcher:async(_source,url,_io,format)=>{
      state.fetches.push({url,at,format});await state.hook?.(url);
      if(url.endsWith('/robots.txt'))return{url,text:state.robots};
      if(url.startsWith(RECENTJOBS_INDEX)){const number=Number(new URL(url).pathname.match(/\/page\/(\d+)\/$/)?.[1]??1);return state.invalid??{url,text:state.lists[number-1]};}
      const detail=authored.find(a=>a.detailUrl===url);assert.ok(detail,'Only authored source requests');return{url,text:detail.detailHtml};
    },extractor:async()=>{state.extractions++;return{extraction:syntheticExtraction()};},validator:async()=>{state.validations++;return{supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'}]};}};
  const make=()=>new FastRecentJobsWorker(db,principal,options),worker=make();await worker.fast.ref('sources',id).set(payload(source));await worker.fast.ref('workers',worker.actor).set({principal,active:true,sources:[id],roles:['ingest']});
  let authorityRef,authority;if(gemini){authorityRef=worker.fast.ref('model_authorities',worker.quotaScope);authority={version:1,provider:'gemini',scopeHash:worker.quotaScope,projectId:db.projectId,epoch:'a'.repeat(64),status:'active',migrationSha256:'b'.repeat(64),quotaSha256:'c'.repeat(64),activatedAt:at};await authorityRef.set(payload(authority));}
  return{worker,source,state,id,authored,authorityRef,authority,discovery:new FastRecentJobsDiscovery(worker,{enabled:true}),restart:()=>new FastRecentJobsDiscovery(make(),{enabled:true}),
    now:()=>at,advance:ms=>{at=new Date(Date.parse(at)+ms).toISOString();},save:()=>worker.fast.ref('sources',id).set(payload(source)),
    jobs:async()=>(await worker.fast.snapshot()).jobs,
    budget:async()=>value(await worker.fast.ref('model_budgets',hash(id+':2026-10-29')).get())};
}
test('discovery requires explicit enablement, a fast worker and approved page policy before fetch',async()=>{
  assert.throws(()=>new FastRecentJobsDiscovery(null),{code:'FAST_INGESTION_DISABLED'});assert.throws(()=>new FastRecentJobsDiscovery({},{enabled:true}),{code:'FAST_DISCOVERY_WORKER_REQUIRED'});
  const f=await fixture(),controller=new AbortController();controller.abort();assert.equal((await f.discovery.poll({signal:controller.signal})).state,'stopped');await assert.rejects(f.discovery.poll({signal:{aborted:false}}),{code:'FAST_DISCOVERY_CONFIGURATION_REQUIRED'});
  delete f.source.automation.discovery;await f.save();await assert.rejects(f.discovery.poll(),{code:'FAST_DISCOVERY_POLICY_REQUIRED'});assert.equal(f.state.fetches.length,0);
});
test('bounded pagination queues every card in policy-sized chunks with paced robots and index requests',async()=>{
  const f=await fixture(),r=await f.discovery.poll();assert.equal(r.state,'complete');assert.equal(r.pages,2);assert.equal(r.queued,7);assert.equal((await f.jobs()).length,7);assert.equal(r.stop,'end');
  assert.deepEqual(f.state.fetches.map(r=>r.url),['https://recentjobs.co.za/robots.txt',pageUrl(1),'https://recentjobs.co.za/robots.txt',pageUrl(2)]);
  for(let i=1;i<f.state.fetches.length;i++)assert.ok(Date.parse(f.state.fetches[i].at)-Date.parse(f.state.fetches[i-1].at)>=2000);
  assert.equal(await f.budget(),null);assert.equal(f.state.extractions,0);
});
test('poll waiting avoids requests and later rediscovery queues only new links without resetting known ages or charges',async()=>{
  const f=await fixture({sizes:[2]}),first=await f.discovery.poll(),before=await f.jobs();const budget={sourceId:f.id,date:'2026-10-29',calls:2,retained:'authored spend'};
  await f.worker.fast.ref('model_budgets',hash(f.id+':2026-10-29')).set(payload(budget));const count=f.state.fetches.length;
  assert.equal((await f.discovery.poll()).state,'waiting');assert.equal(f.state.fetches.length,count);
  f.advance(Date.parse(first.nextPollAt)-Date.parse(f.now()));f.state.lists[0]=html(f.authored,null);const second=await f.restart().poll();assert.equal(second.queued,1);
  const after=await f.jobs();for(const job of before)assert.equal(after.find(j=>j.id===job.id).firstSeenAt,job.firstSeenAt);assert.deepEqual(await f.budget(),budget);
});
test('restart after a partial chunk reuses the saved page and its original observation time',async()=>{
  const f=await fixture({sizes:[5]}),record=f.worker.fast.recordDiscovery.bind(f.worker.fast);let calls=0;
  f.worker.fast.recordDiscovery=async(...args)=>{if(++calls===2)throw Error('Authored crash after first chunk');return record(...args);};
  await assert.rejects(f.discovery.poll(),/Authored crash/);const before=await f.jobs();assert.equal(before.length,2);const fetched=f.state.fetches.length,originalAt=before[0].firstSeenAt;
  f.advance(600000);const r=await f.restart().poll();assert.equal(r.queued,3);assert.equal(r.cacheHits,1);assert.equal(f.state.fetches.length,fetched);assert.ok((await f.jobs()).every(j=>j.firstSeenAt===originalAt));
});
test('stop after capture leaves a resumable receipt and creates no apparently fresh notices on recovery',async()=>{
  const f=await fixture({sizes:[3]}),controller=new AbortController(),capture=f.worker.fast.discoveryPage.bind(f.worker.fast);let capturedAt;
  f.worker.fast.discoveryPage=async(...args)=>{const r=await capture(...args);if(args[2]?.capture){capturedAt=r.page.retrievedAt;controller.abort();}return r;};
  await assert.rejects(f.discovery.poll({signal:controller.signal}),{code:'FAST_DISCOVERY_STOPPED'});assert.equal((await f.jobs()).length,0);const fetched=f.state.fetches.length;
  f.advance(600000);const r=await f.restart().poll();assert.equal(r.queued,3);assert.equal(f.state.fetches.length,fetched);assert.ok((await f.jobs()).every(j=>j.firstSeenAt===capturedAt));
});
test('competing pollers acquire one poll and perform one acquisition cycle',async()=>{
  const f=await fixture({sizes:[3]}),results=await Promise.all([f.discovery.poll(),f.restart().poll()]);assert.equal(results.filter(r=>r.state==='complete').length,1);assert.equal(results.filter(r=>r.state==='waiting').length,1);assert.equal(f.state.fetches.length,2);assert.equal((await f.jobs()).length,3);
});
test('robots denial and excessive crawl delay stop before acquiring an index',async()=>{
  for(const robots of ['User-agent: *\nDisallow: /','User-agent: *\nAllow: /\nCrawl-delay: 30']){
    const f=await fixture();f.state.robots=robots;await assert.rejects(f.discovery.poll(),{code:robots.includes('Disallow')?'ROBOTS_DISALLOWED':'ROBOTS_DELAY_EXCEEDS_POLICY'});assert.equal(f.state.fetches.length,1);assert.equal((await f.jobs()).length,0);assert.equal(await f.budget(),null);
  }
});
test('unexpected response URL, oversized body and unsupported layout cannot queue a listing',async()=>{
  for(const invalid of [{url:'https://example.test/other',text:'private redirect'},{url:pageUrl(1),text:'x'.repeat(500001)},{url:pageUrl(1),text:'<p>Changed listing layout</p>'}]){
    const f=await fixture();f.state.invalid=invalid;await assert.rejects(f.discovery.poll());assert.equal((await f.jobs()).length,0);assert.equal(await f.budget(),null);
  }
});
test('a source challenge records a durable wait across restart without calls, jobs, quota resets or fake freshness',async()=>{
 const f=await fixture({sizes:[2]}),budget={sourceId:f.id,date:'2026-10-29',calls:2};
 await f.worker.fast.ref('model_budgets',hash(f.id+':2026-10-29')).set(payload(budget));
 f.state.invalid={url:pageUrl(1),text:'<title>One moment...</title><p>Checking your browser...</p><script>const endpoint="/.hk-sg-pass";</script>'};
 const result=await f.discovery.poll();assert.equal(result.state,'source_challenged');assert.equal(result.queued,0);assert.equal(f.state.fetches.length,2);assert.equal((await f.jobs()).length,0);assert.deepEqual(await f.budget(),budget);
 const blockedUntil=result.nextPollAt;assert.ok(blockedUntil>f.now());assert.equal((await f.restart().poll()).nextPollAt,blockedUntil);assert.equal(f.state.fetches.length,2);
 const events=(await db.collection('m0_ingestion_events').where('sourceId','==',f.id).get()).docs.map(d=>value(d));assert.equal(events.filter(e=>e.action==='poll.source_challenged').length,1);
 f.advance(Date.parse(blockedUntil)-Date.parse(f.now()));f.state.invalid=null;const resumed=await f.restart().poll();assert.equal(resumed.state,'complete');assert.equal(resumed.queued,2);assert.ok((await f.jobs()).every(j=>j.firstSeenAt>=blockedUntil));assert.deepEqual(await f.budget(),budget);
});
test('a recognized challenge cannot hide revoked access or source pause during the failed request',async()=>{
 for(const mode of ['grant','pause']){
  const f=await fixture();f.state.invalid={url:pageUrl(1),text:'<title>One moment...</title><p>Checking your browser...</p><script>"/.hk-sg-pass"</script>'};
  f.state.hook=async url=>{if(url!==pageUrl(1))return;if(mode==='pause'){f.source.paused=true;await f.save();}else await f.worker.fast.ref('workers',f.worker.actor).update({active:false});};
  await assert.rejects(f.discovery.poll(),{code:mode==='pause'?'SOURCE_PAUSED':'WORKER_FORBIDDEN'});assert.equal((await db.collection('m0_ingestion_jobs').where('sourceId','==',f.id).get()).size,0);assert.equal(await f.budget(),null);
 }
});
test('pause, worker revocation and Gemini authority revocation after robots fence the index request',async()=>{
  for(const mode of ['pause','grant','authority']){
    const f=await fixture({gemini:mode==='authority'});f.state.hook=async url=>{if(!url.endsWith('/robots.txt'))return;if(mode==='pause'){f.source.paused=true;await f.save();}else if(mode==='grant')await f.worker.fast.ref('workers',f.worker.actor).update({active:false});else await f.authorityRef.set(payload({...f.authority,status:'revoked'}));};
    await assert.rejects(f.discovery.poll(),{code:mode==='pause'?'SOURCE_PAUSED':mode==='grant'?'WORKER_FORBIDDEN':'GEMINI_QUOTA_AUTHORITY_STALE'});assert.equal(f.state.fetches.length,1);assert.equal(await f.budget(),null);
  }
});
test('tampered page content is refused before its first queue chunk',async()=>{
  const f=await fixture({sizes:[3]}),capture=f.worker.fast.discoveryPage.bind(f.worker.fast);
  f.worker.fast.discoveryPage=async(...args)=>{const r=await capture(...args);if(args[2]?.capture)await f.worker.fast.ref('ingestion_discovery_pages',r.page.id).set(payload({...r.page,hash:'0'.repeat(64)}));return r;};
  await assert.rejects(f.discovery.poll(),{code:'FAST_DISCOVERY_RECEIPT_INVALID'});assert.equal((await f.jobs()).length,0);
});
test('page policy prevents skipped pagination and receipts from another poll cannot backdate new jobs',async()=>{
  const f=await fixture({sizes:[2,2]}),r=await f.discovery.poll();f.advance(Date.parse(r.nextPollAt)-Date.parse(f.now()));const poll=await f.worker.fast.poll();
  await assert.rejects(f.worker.fast.discoveryPage(poll.claim,pageUrl(2)),{code:'FAST_DISCOVERY_RECEIPT_INVALID'});
  const receipt=hash(r.pollId+':page:'+pageUrl(1));await assert.rejects(f.worker.fast.recordDiscovery(poll.claim,[f.authored[0].detailUrl],{pageReceiptId:receipt}),{code:'FAST_DISCOVERY_RECEIPT_INVALID'});
  const list=parseRecentJobsList({html:f.state.lists[0],url:pageUrl(1)});await assert.rejects(f.worker.fast.discoveryPage(poll.claim,pageUrl(1),{capture:{list,retrievedAt:new Date(Date.parse(f.now())+1).toISOString()}}),{code:'FAST_DISCOVERY_RECEIPT_INVALID'});
});
test('page limit completes approved discovery without fetching the next page or truncating its current page',async()=>{
  const f=await fixture({sizes:[5,2],maxPages:1}),r=await f.discovery.poll();assert.equal(r.stop,'page_limit');assert.equal(r.queued,5);assert.equal(r.pages,1);assert.equal(f.state.fetches.length,2);assert.equal((await f.jobs()).length,5);
});
test('discovery and notice processing share fetch pacing and reach independently validated canonical drafts',async()=>{
  const f=await fixture({sizes:[2]}),first=await f.discovery.poll();f.advance(Date.parse(first.nextPollAt)-Date.parse(f.now()));
  const [discovery,dispatch]=await Promise.all([f.restart().poll(),new FastNoticeDispatcher(f.worker,{enabled:true}).tick()]);assert.equal(discovery.queued,0);assert.ok(dispatch.results.every(r=>r.state==='done'),JSON.stringify(dispatch));
  assert.equal(f.state.extractions,2);assert.equal(f.state.validations,2);assert.equal((await f.budget()).calls,4);
  for(let i=1;i<f.state.fetches.length;i++)assert.ok(Date.parse(f.state.fetches[i].at)-Date.parse(f.state.fetches[i-1].at)>=2000,JSON.stringify(f.state.fetches));
  for(const a of f.authored.slice(0,2)){const draft=value(await f.worker.fast.ref('drafts',hash(f.id+':'+hash(a.detailUrl))).get());assert.equal(draft.applicationRoute.value.destination,a.url);assert.equal(draft.publication.approved,false);}
  assert.equal((await db.collection('m0_public').get()).size,0);
});
test('a late response from an expired poll owner cannot capture or queue; a replacement must acquire again',async()=>{
  const f=await fixture({sizes:[2]});f.state.hook=async url=>{if(url===pageUrl(1))f.advance(600001);};await assert.rejects(f.discovery.poll(),{code:'STALE_LEASE'});assert.equal((await f.jobs()).length,0);
  f.state.hook=null;const r=await f.restart().poll();assert.equal(r.queued,2);assert.equal(r.cacheHits,0);assert.equal(f.state.fetches.length,4);
});
