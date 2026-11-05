import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {FastRecentJobsWorker} from '../src/fast-recentjobs-worker.mjs';
import {FastRecentJobsDiscovery} from '../src/fast-recentjobs-discovery.mjs';
import {FastNoticeDispatcher} from '../src/fast-notice-dispatcher.mjs';
import {Source} from '../src/schemas.mjs';
import {sourceHoldAdapterFields,sourceHoldAdapterMatches} from '../src/worker-detail-adapter.mjs';
import {parseRecentJobsRss,rssDiscoveryList} from '../src/adapters/recentjobs-rss.mjs';
import {RECENTJOBS_CATEGORY_FEED as feedUrl} from '../src/publisher-feed-policy.mjs';
import {RECENTJOBS_INDEX} from '../src/worker-policy.mjs';
import {getRuntime} from '../src/runtime.mjs';
import {originalFixture,originalHtml} from './fixtures/original-notices.mjs';
import {syntheticExtraction} from './fixtures/recentjobs-model.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex'),payload=v=>({json:JSON.stringify(v)}),value=s=>s.exists?JSON.parse(s.data().json):null;
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function feed(items){return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Authored apprenticeship feed</title><link>https://recentjobs.co.za/</link><atom:link rel="self" type="application/rss+xml" href="${feedUrl}"/><lastBuildDate>Thu, 29 Oct 2026 10:00:00 +0000</lastBuildDate>${items.map((item,i)=>`<item><title>${escape(item.candidate.title)}</title><link>${item.detailUrl}</link><guid isPermaLink="false">https://recentjobs.co.za/?p=${i+1}</guid><pubDate>Thu, 29 Oct 2026 08:00:00 +0000</pubDate><category>Apprenticeships</category><content:encoded><![CDATA[${item.detailHtml.match(/<div class="entry-content">([\s\S]*)<\/div><\/article>/)[1]}]]></content:encoded></item>`).join('')}</channel></rss>`;}
let db;
before(async()=>{process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-rss-worker';db=(await getRuntime()).db;});
after(async()=>{await db?.terminate();});
async function fixture({count=2,original=false,refresh=false}={}){
 let at='2026-10-29T10:00:00.000Z';const id='rss_'+randomUUID(),principal=randomUUID()+'@example.test';
 const authored=Array.from({length:count},(_,i)=>originalFixture({slug:'authored-rss-'+i,path:'/tenant-a/job/'+(800+i)+'/',reference:null}));
 const source=structuredClone(authored[0].source);source.id=id;source.urls.push(feedUrl);source.automation.publisherFeed='rss_shadow_v1';source.automation.maxArticles=2;
 source.automation.fastIngestion={version:'shadow_v1',discoveryIntervalMs:120000,maxConcurrentJobs:2,leaseMs:600000};
 source.automation.employerCrawl=original;if(!original)delete source.automation.originalVerification;
 if(refresh)source.automation.checkTtlHours=1;
 const state={xml:feed(authored),fetches:[],extractions:0,validations:0,robots:'User-agent: *\nAllow: /',hook:null,wrongOriginal:false,omitPrimaryEvidence:false};
 const options={enabled:true,sourceId:id,sourceRevision:1,privateRefresh:refresh,now:()=>at,provider:'groq',sleep:async ms=>{at=new Date(Date.parse(at)+ms).toISOString();},
  fetcher:async(_source,url,_io,format)=>{state.fetches.push({url,at,format});await state.hook?.(url);
   if(url.endsWith('/robots.txt'))return{url,text:state.robots};
   if(url===feedUrl){assert.equal(format,'rss');return{url,text:state.xml};}
   const item=authored.find(item=>item.url===url);assert.ok(item&&original,'No HTML publisher requests or unapproved original requests');
   return{url,text:originalHtml({...item.posting,...(state.wrongOriginal?{title:'Unrelated accountant vacancy'}:{})})};},
  extractor:async()=>{state.extractions++;return{extraction:syntheticExtraction()};},
  validator:async({primary})=>{state.validations++;return{supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'},
    ...(primary&&!state.omitPrimaryEvidence?[{source:'primary',quote:primary.issuer}]:[])]};}};
 const make=()=>new FastRecentJobsWorker(db,principal,options),worker=make();await worker.fast.ref('sources',id).set(payload(source));await worker.fast.ref('workers',worker.actor).set({principal,active:true,sources:[id],roles:['ingest']});
 return{worker,source,state,id,authored,discovery:new FastRecentJobsDiscovery(worker,{enabled:true}),restart:()=>new FastRecentJobsDiscovery(make(),{enabled:true}),
  now:()=>at,advance:ms=>{at=new Date(Date.parse(at)+ms).toISOString();},save:()=>worker.fast.ref('sources',id).set(payload(source)),
  jobs:async()=>(await worker.fast.snapshot()).jobs,budget:async()=>value(await worker.fast.ref('model_budgets',hash(id+':2026-10-29')).get()),
  draft:async item=>value(await worker.fast.ref('drafts',hash(id+':'+hash(item.detailUrl))).get())};
}
test('RSS source policy requires explicit shadow fast mode, exact approved URLs and one-window discovery',async()=>{
 const f=await fixture();assert.ok(Source.safeParse(f.source).success);
 for(const change of [s=>delete s.automation.fastIngestion,s=>{s.automation.discovery.maxPages=2;},s=>{s.automation.mode='automatic';},s=>{s.urls=s.urls.filter(url=>url!==feedUrl);},s=>{s.urls=[feedUrl];}]){
  const source=structuredClone(f.source);change(source);assert.equal(Source.safeParse(source).success,false);
 }
 const fields=sourceHoldAdapterFields(f.source);assert.equal(fields.publisherFeedProfile,'rss_shadow_v1');assert.equal(sourceHoldAdapterMatches(f.source,{}),false);
 const html=structuredClone(f.source);delete html.automation.publisherFeed;assert.equal(sourceHoldAdapterMatches(html,fields),false);assert.equal(sourceHoldAdapterMatches(f.source,fields),true);
 delete f.source.automation.publisherFeed;await f.save();const poll=await f.worker.fast.poll();
 await assert.rejects(f.worker.fast.discoveryPage(poll.claim,feedUrl),{code:'FAST_DISCOVERY_POLICY_REQUIRED'});assert.equal(f.state.fetches.length,0);
});
test('RSS discovery queues every item in bounded chunks with actual receipt ages and no model spend',async()=>{
 const f=await fixture({count:5}),result=await f.discovery.poll();assert.equal(result.queued,5);assert.equal(result.pages,1);assert.equal(result.stop,'end');
 assert.deepEqual(f.state.fetches.map(({url,format})=>({url,format})),[{url:'https://recentjobs.co.za/robots.txt',format:'text'},{url:feedUrl,format:'rss'}]);
 const receipt=value(await f.worker.fast.ref('ingestion_discovery_pages',hash(result.pollId+':page:'+feedUrl)).get());
 assert.equal(receipt.list.coverage,'feed_window_only');assert.equal(receipt.list.feedHash,hash(f.state.xml));assert.equal(receipt.list.articles.length,5);assert.ok(receipt.list.articles.every(a=>a.itemHash.length===64));
 assert.ok((await f.jobs()).every(job=>job.firstSeenAt===receipt.retrievedAt));assert.equal(await f.budget(),null);assert.equal(f.state.extractions,0);
});
test('ordinary RSS dispatch reaches canonical private drafts through extraction and independent validation',async()=>{
 const f=await fixture();await f.discovery.poll();const result=await new FastNoticeDispatcher(f.worker,{enabled:true}).tick();
 assert.ok(result.results.every(row=>row.state==='done'),JSON.stringify(result));assert.equal(f.state.extractions,2);assert.equal(f.state.validations,2);assert.equal((await f.budget()).calls,4);
 for(const item of f.authored){
  const draft=await f.draft(item);assert.equal(draft.applicationRoute.value.destination,item.url);assert.equal(draft.publication.approved,false);
  const snapshot=value(await f.worker.fast.ref('snapshots',draft.private.queueId).get());assert.equal(snapshot.url,item.detailUrl);assert.equal(snapshot.sourceAcquisition.transport,'rss');assert.equal(snapshot.sourceAcquisition.feedHash,hash(f.state.xml));
  assert.equal(snapshot.sourceAcquisition.coverage,'feed_window_only');assert.equal(snapshot.sourceAcquisition.feedUrl,feedUrl);assert.match(snapshot.text,/Grade 12 with Mathematics OR N3 Electrical/);
 }
 assert.equal(f.state.fetches.filter(row=>row.url===feedUrl).length,3);assert.ok(f.state.fetches.every(row=>row.url!==RECENTJOBS_INDEX));
 for(let i=1;i<f.state.fetches.length;i++)assert.ok(Date.parse(f.state.fetches[i].at)-Date.parse(f.state.fetches[i-1].at)>=2000);
 assert.equal((await db.collection('m0_public').get()).size,0);
});
test('restart reuses a partial discovery receipt but detail obtains fresh full content and retains first-seen time',async()=>{
 const f=await fixture({count:3}),record=f.worker.fast.recordDiscovery.bind(f.worker.fast);let calls=0;
 f.worker.fast.recordDiscovery=async(...args)=>{if(++calls===2)throw Error('Authored interruption');return record(...args);};
 await assert.rejects(f.discovery.poll(),/Authored interruption/);const originalAt=(await f.jobs())[0].firstSeenAt,fetched=f.state.fetches.length;
 f.advance(600000);f.state.xml=f.state.xml.replace('seeks an electrical apprentice.','seeks an electrical apprentice. Current copied description.');
 const result=await f.restart().poll();assert.equal(result.cacheHits,1);assert.equal(f.state.fetches.length,fetched);assert.equal(result.queued,1);assert.ok((await f.jobs()).every(job=>job.firstSeenAt===originalAt));
 const job=(await f.jobs()).find(job=>job.url===f.authored[0].detailUrl);assert.equal((await f.worker.runNotice(job.id)).state,'done');
 const draft=await f.draft(f.authored[0]),snapshot=value(await f.worker.fast.ref('snapshots',draft.private.queueId).get());
 assert.equal(snapshot.sourceAcquisition.feedHash,hash(f.state.xml));assert.ok(snapshot.sourceAcquisition.retrievedAt>originalAt);assert.match(snapshot.text,/Current copied description/);
});
test('a missing feed-window item is held without model calls, fabricated closure or a catalogue write',async()=>{
 const f=await fixture();await f.discovery.poll();const job=(await f.jobs()).find(row=>row.url===f.authored[0].detailUrl);f.state.xml=feed(f.authored.slice(1));
 const result=await f.worker.runNotice(job.id);assert.equal(result.state,'exception');assert.equal(result.reason,'RECENTJOBS_RSS_ITEM_UNAVAILABLE');
 assert.equal((await f.jobs()).find(row=>row.id===job.id).state,'held');assert.equal(f.state.extractions,0);assert.equal(f.state.validations,0);assert.equal(await f.budget(),null);assert.equal(await f.draft(f.authored[0]),null);
});
test('RSS receipts cannot be substituted with HTML, replayed into another poll or bypassed',async()=>{
 const f=await fixture(),poll=await f.worker.fast.poll(),list=rssDiscoveryList(parseRecentJobsRss({xml:f.state.xml,url:feedUrl}));
 await assert.rejects(f.worker.fast.recordDiscovery(poll.claim,[f.authored[0].detailUrl]),{code:'FAST_DISCOVERY_RECEIPT_INVALID'});
 await assert.rejects(f.worker.fast.discoveryPage(poll.claim,RECENTJOBS_INDEX),{code:'FAST_DISCOVERY_POLICY_REQUIRED'});
 const {page}=await f.worker.fast.discoveryPage(poll.claim,feedUrl,{capture:{list,retrievedAt:f.now()}});
 await f.worker.fast.ref('ingestion_discovery_pages',page.id).set(payload({...page,list:{...page.list,articles:page.list.articles.map((a,i)=>i? a:{...a,itemHash:'0'.repeat(64)})}}));
 await assert.rejects(f.worker.fast.recordDiscovery(poll.claim,[f.authored[0].detailUrl],{pageReceiptId:page.id}),{code:'FAST_DISCOVERY_RECEIPT_INVALID'});assert.equal((await f.jobs()).length,0);
 const replay=await fixture(),completed=await replay.discovery.poll();replay.advance(Date.parse(completed.nextPollAt)-Date.parse(replay.now()));const later=await replay.worker.fast.poll();
 await assert.rejects(replay.worker.fast.recordDiscovery(later.claim,[replay.authored[0].detailUrl],{pageReceiptId:hash(completed.pollId+':page:'+feedUrl)}),{code:'FAST_DISCOVERY_RECEIPT_INVALID'});
});
test('RSS robots permission and crawl-delay policy apply before any feed request',async()=>{
 for(const robots of ['User-agent: *\nDisallow: /category/apprenticeships/feed/','User-agent: *\nAllow: /\nCrawl-delay: 30']){
  const f=await fixture();f.state.robots=robots;await assert.rejects(f.discovery.poll(),{code:robots.includes('Disallow')?'ROBOTS_DISALLOWED':'ROBOTS_DELAY_EXCEEDS_POLICY'});assert.equal(f.state.fetches.length,1);assert.equal((await f.jobs()).length,0);assert.equal(await f.budget(),null);
 }
});
test('source/grant changes and late ownership fence RSS discovery before queuing or model spend',async()=>{
 for(const mode of ['pause','grant','revision','expiry']){
  const f=await fixture();f.state.hook=async url=>{if(url!==feedUrl)return;
   if(mode==='pause'){f.source.paused=true;await f.save();}else if(mode==='revision'){f.source.revision++;await f.save();}
   else if(mode==='grant')await f.worker.fast.ref('workers',f.worker.actor).update({active:false});else f.advance(600001);};
  await assert.rejects(f.discovery.poll(),{code:{pause:'SOURCE_PAUSED',grant:'WORKER_FORBIDDEN',revision:'SOURCE_CHANGED',expiry:'STALE_LEASE'}[mode]});
  assert.equal((await db.collection('m0_ingestion_jobs').where('sourceId','==',f.id).get()).size,0);assert.equal(f.state.extractions,0);assert.equal(await f.budget(),null);
 }
});
test('RSS original-employer verification accepts a matched notice and rejects a wrong vacancy before extraction',async()=>{
 for(const wrong of [false,true]){
  const f=await fixture({count:1,original:true});f.state.wrongOriginal=wrong;await f.discovery.poll();const job=(await f.jobs())[0],result=await f.worker.runNotice(job.id);
  if(wrong){assert.equal(result.state,'exception');assert.match(result.reason,/^ORIGINAL_NOTICE_/);assert.equal(f.state.extractions,0);assert.equal(await f.draft(f.authored[0]),null);}
  else{assert.equal(result.state,'done',JSON.stringify(result));assert.equal(f.state.extractions,1);assert.equal(f.state.validations,1);assert.equal((await f.draft(f.authored[0])).publication.approved,false);}
  assert.ok(f.state.fetches.some(row=>row.url===f.authored[0].url));
 }
});
test('RSS validation still requires evidence from the original employer when it was crawled',async()=>{
 const f=await fixture({count:1,original:true});f.state.omitPrimaryEvidence=true;await f.discovery.poll();const result=await f.worker.runNotice((await f.jobs())[0].id);
 assert.equal(result.state,'exception');assert.equal(result.reason,'AI_INVALID_VALIDATION');assert.equal(await f.draft(f.authored[0]),null);assert.equal(f.state.validations,1);
});
test('unavailable or invalid RSS uses the durable poll boundary across restart without weakening access fences',async()=>{
 for(const failure of ['UNSUPPORTED_RESPONSE','XML']){
  const f=await fixture();if(failure==='XML')f.state.xml='<p>Authored changed response</p>';
  else f.state.hook=async url=>{if(url===feedUrl)throw Object.assign(Error('Authored unavailable feed'),{code:failure});};
  const result=await f.discovery.poll(),count=f.state.fetches.length;assert.equal(result.state,'source_unavailable');assert.equal(result.queued,0);assert.equal((await f.jobs()).length,0);assert.equal(await f.budget(),null);
  assert.equal((await f.restart().poll()).nextPollAt,result.nextPollAt);assert.equal(f.state.fetches.length,count);
  f.advance(Date.parse(result.nextPollAt)-Date.parse(f.now()));f.state.hook=null;f.state.xml=feed(f.authored);assert.equal((await f.restart().poll()).queued,2);
 }
 const revoked=await fixture();revoked.state.hook=async url=>{if(url===feedUrl){await revoked.worker.fast.ref('workers',revoked.worker.actor).update({active:false});throw Object.assign(Error('Authored unavailable'),{code:'UNSUPPORTED_RESPONSE'});}};
 await assert.rejects(revoked.discovery.poll(),{code:'WORKER_FORBIDDEN'});
 const unsafe=await fixture();unsafe.state.hook=async url=>{if(url===feedUrl)throw Object.assign(Error('Authored unsafe'),{code:'UNSAFE_ADDRESS'});};await assert.rejects(unsafe.discovery.poll(),{code:'UNSAFE_ADDRESS'});
});
test('RSS jobs retain existing spent model allowance and defer rather than resetting the budget',async()=>{
 const f=await fixture({count:1});f.source.automation.maxModelCallsPerDay=2;await f.save();const budget={sourceId:f.id,date:'2026-10-29',calls:2};
 await f.worker.fast.ref('model_budgets',hash(f.id+':2026-10-29')).set(payload(budget));await f.discovery.poll();const job=(await f.jobs())[0],result=await f.worker.runNotice(job.id);
 assert.equal(result.state,'pending');assert.equal((await f.jobs())[0].blockedBy,'source_budget');assert.equal(f.state.extractions,0);assert.deepEqual(await f.budget(),budget);assert.equal(await f.draft(f.authored[0]),null);
});
test('RSS private refresh obtains current provenance, reuses unchanged model work and holds disappearance without rewriting the draft',async()=>{
 const f=await fixture({count:1,refresh:true});await f.discovery.poll();const job=(await f.jobs())[0];assert.equal((await f.worker.runNotice(job.id)).state,'done');
 const original=await f.draft(f.authored[0]),budget=await f.budget(),watch=()=>f.worker.fast.ref('ingestion_refresh_watches',job.id).get().then(value);
 let due=await watch();f.advance(Date.parse(due.nextAt)-Date.parse(f.now()));assert.equal((await f.worker.queueRefreshes()).scheduled,1);assert.equal((await f.worker.runNotice(job.id)).state,'done');
 const current=await f.draft(f.authored[0]);assert.equal(current.id,original.id);assert.equal(current.revision,original.revision+1);assert.deepEqual(await f.budget(),budget);assert.equal(f.state.extractions,1);assert.equal(f.state.validations,1);
 const execution=(await db.collection('m0_fast_worker_jobs').get()).docs.map(value).find(row=>row.fastNoticeId===job.id&&row.recordId===current.id&&row.id!==job.id&&row.sourceAcquisition?.retrievedAt>job.firstSeenAt);
 assert.ok(execution,'A new refresh execution retains its actual RSS acquisition time');
 const before=JSON.stringify(current);due=await watch();f.advance(Date.parse(due.nextAt)-Date.parse(f.now()));assert.equal((await f.worker.queueRefreshes()).scheduled,1);
 f.state.xml=feed([originalFixture({slug:'authored-other-feed-window',reference:null})]);const result=await f.worker.runNotice(job.id);assert.equal(result.reason,'RECENTJOBS_RSS_ITEM_UNAVAILABLE');
 assert.equal(JSON.stringify(await f.draft(f.authored[0])),before);assert.deepEqual(await f.budget(),budget);assert.equal((await f.jobs())[0].state,'held');
});
