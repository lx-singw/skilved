import {randomUUID,createHash} from 'node:crypto';
import {FastRecentJobsWorker} from '../../src/fast-recentjobs-worker.mjs';
import {originalFixture} from './original-notices.mjs';
import {syntheticExtraction} from './recentjobs-model.mjs';
export const hash=s=>createHash('sha256').update(s).digest('hex'),payload=v=>({json:JSON.stringify(v)}),value=s=>s.exists?JSON.parse(s.data().json):null;
export const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
export function manualClock() {
  let ms=0;const timers=new Set();
  return{monotonic:()=>ms,now:()=>new Date(Date.parse('2026-10-29T10:00:00.000Z')+ms).toISOString(),timers,
    advance:n=>{ms+=n;for(const t of [...timers])if(t.at<=ms){timers.delete(t);t.cleanup();t.resolve();}},
    wait:(delay,signal)=>new Promise((resolve,reject)=>{
      const cancel=()=>{timers.delete(t);signal?.removeEventListener('abort',cancel);reject(Object.assign(new Error('Authored cancellation'),{name:'AbortError'}));};
      const t={at:ms+delay,resolve,cleanup:()=>signal?.removeEventListener('abort',cancel)};
      if(signal?.aborted){cancel();return;}timers.add(t);signal?.addEventListener('abort',cancel,{once:true});
    })};
}
export async function supervisionFixture(db,{count=1,supervised=true,leaseMs=30000,maxRunMs=900000}={}) {
  const clock=manualClock(),id='supervision_'+randomUUID(),principal=randomUUID()+'@example.test';
  const notices=Array.from({length:count},(_,i)=>originalFixture({slug:'authored-supervision-'+i,path:'/tenant-a/job/'+(800+i)+'/',reference:null}));
  const source=structuredClone(notices[0].source);source.id=id;source.automation.employerCrawl=false;delete source.automation.originalVerification;
  source.automation.fastIngestion={version:'shadow_v1',discoveryIntervalMs:120000,maxConcurrentJobs:2,leaseMs};
  const list=()=>`<div class="articles-wrap">${notices.map(a=>`<article class="type-post"><h2 class="entry-title"><a href="${a.detailUrl}">Authored apprentice</a></h2></article>`).join('')}</div>`;
  const state={extractions:0,validations:0,fetches:[],beforeExtract:null,beforeFetch:null,robots:'User-agent: *\nAllow: /'};
  const options={enabled:true,sourceId:id,sourceRevision:1,provider:'groq',now:clock.now,sleep:async ms=>clock.advance(ms),
    leaseSupervision:supervised?{enabled:true,maxRunMs,wait:clock.wait,monotonic:clock.monotonic}:false,
    fetcher:async(_source,url)=>{state.fetches.push({url,at:clock.now()});await state.beforeFetch?.(url);if(url.endsWith('/robots.txt'))return{url,text:state.robots};if(url===source.urls[0])return{url,text:list()};const notice=notices.find(n=>n.detailUrl===url);if(!notice)throw Error('Unexpected authored fetch');return{url,text:notice.detailHtml};},
    extractor:async()=>{state.extractions++;await state.beforeExtract?.();return{extraction:syntheticExtraction()};},
    validator:async()=>{state.validations++;return{supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'}]};}};
  const worker=new FastRecentJobsWorker(db,principal,options);await worker.fast.ref('sources',id).set(payload(source));await worker.fast.ref('workers',worker.actor).set({principal,active:true,sources:[id],roles:['ingest']});
  const seed=async()=>{const poll=await worker.fast.poll();await worker.fast.recordDiscovery(poll.claim,notices.map(n=>n.detailUrl));return(await worker.fast.dispatchSnapshot()).jobs;};
  return{worker,clock,state,id,source,notices,options,seed,save:()=>worker.fast.ref('sources',id).set(payload(source)),
    budget:async()=>value(await worker.fast.ref('model_budgets',hash(id+':2026-10-29')).get()),
    draft:async()=>value(await worker.fast.ref('drafts',hash(id+':'+hash(notices[0].detailUrl))).get())};
}
