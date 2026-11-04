import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate as turn} from 'node:timers/promises';
import {getRuntime} from '../src/runtime.mjs';
import {runFastIngestion} from '../src/fast-ingestion-runtime.mjs';
import {supervisionFixture,deferred} from './fixtures/fast-supervision.mjs';
import {originalFixture} from './fixtures/original-notices.mjs';
let db;
before(async()=>{process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-fast-runtime';db=(await getRuntime()).db;});
after(async()=>{await db?.terminate();});
const options=f=>({worker:f.worker,enabled:true,wait:f.clock.wait,monotonic:f.clock.monotonic});
test('runtime requires explicit supervision and a stopped run admits no work',async()=>{
  await assert.rejects(runFastIngestion(),{code:'FAST_INGESTION_DISABLED'});
  const no=await supervisionFixture(db,{supervised:false});await assert.rejects(runFastIngestion(options(no)),{code:'FAST_RUNTIME_CONFIGURATION_REQUIRED'});assert.equal(no.state.fetches.length,0);
  const f=await supervisionFixture(db),stop=new AbortController();stop.abort();const r=await runFastIngestion({...options(f),signal:stop.signal});assert.deepEqual(r.ticks,{discovery:0,dispatch:0});assert.equal(f.state.fetches.length,0);assert.equal(f.clock.timers.size,0);
});
test('bounded lanes discover, wake dispatch, draft and stop at their tick limits without duplicate model work',async()=>{
  const f=await supervisionFixture(db),processed=deferred(),empty=deferred(),stop=new AbortController(),events=[];f.state.beforeFetch=async url=>{if(url===f.source.urls[0])await empty.promise;};
  const run=runFastIngestion({...options(f),maxTicks:2,signal:stop.signal,onEvent:event=>{events.push(event);if(event.lane==='dispatch'&&event.type==='tick'){if(event.selected===0)empty.resolve();else processed.resolve();}}});
  try{await processed.promise;assert.equal((await f.draft()).publication.approved,false);const r=await run;assert.deepEqual(r.ticks,{discovery:1,dispatch:2});assert.deepEqual(r.reasons,{dispatch:'max_ticks',discovery:'max_ticks'});assert.equal(f.state.extractions,1);assert.equal(f.state.validations,1);assert.equal((await f.budget()).calls,2);assert.equal(f.clock.timers.size,0);}
  finally{stop.abort();await run.catch(()=>{});}
});
test('discovery keeps polling while a model request occupies dispatch and its lease is renewed',async()=>{
  const f=await supervisionFixture(db),started=deferred(),release=deferred(),second=deferred(),empty=deferred(),stop=new AbortController();let discoveries=0,observedRenewal;
  f.state.beforeFetch=async url=>{if(url===f.source.urls[0])await empty.promise;};
  f.state.beforeExtract=async()=>{started.resolve();await release.promise;};
  const renew=f.worker.renewExecution.bind(f.worker);f.worker.renewExecution=async(...args)=>{try{return await renew(...args);}finally{observedRenewal?.resolve();}};
  const run=runFastIngestion({...options(f),maxTicks:2,signal:stop.signal,onEvent:event=>{if(event.type==='tick'&&event.lane==='dispatch'&&event.selected===0)empty.resolve();if(event.type==='tick'&&event.lane==='discovery'&&++discoveries===2)second.resolve();}});
  try{
    await started.promise;f.notices.push(originalFixture({slug:'authored-arrived-during-model',path:'/tenant-a/job/999/',reference:null}));
    while(f.clock.monotonic()<120000){observedRenewal=deferred();f.clock.advance(10000);await observedRenewal.promise;await turn();}
    await Promise.race([second.promise,run.then(()=>{throw Error('Runtime ended before the second discovery');})]);assert.equal(discoveries,2);assert.equal(f.state.extractions,1);assert.equal(f.state.validations,0);assert.equal((await f.worker.fast.dispatchSnapshot()).jobs.length,2);
    release.resolve();const r=await run;assert.equal(r.ticks.discovery,2);assert.equal((await f.draft()).publication.approved,false);assert.equal((await f.worker.fast.dispatchSnapshot()).jobs.length,1);assert.equal(f.clock.timers.size,0);
  }finally{stop.abort();release.resolve();await run.catch(()=>{});}
});
test('external stop drains an admitted model request and fences its late cache/draft effects',async()=>{
  const f=await supervisionFixture(db),started=deferred(),release=deferred(),stop=new AbortController();f.state.beforeExtract=async()=>{started.resolve();await release.promise;};
  const run=runFastIngestion({...options(f),signal:stop.signal});
  try{await started.promise;stop.abort();release.resolve();const r=await run;assert.ok(Object.values(r.reasons).every(reason=>reason==='signal'));assert.equal((await f.budget()).calls,1);assert.equal(f.state.validations,0);assert.equal(await f.draft(),null);assert.equal(f.clock.timers.size,0);}
  finally{stop.abort();release.resolve();await run.catch(()=>{});}
});
test('a robots failure stops both lanes once and reports a safe code',async()=>{
  const f=await supervisionFixture(db),events=[];f.state.robots='User-agent: *\nDisallow: /';
  await assert.rejects(runFastIngestion({...options(f),onEvent:e=>events.push(e)}),{code:'ROBOTS_DISALLOWED'});assert.equal(f.state.fetches.length,1);assert.equal(f.clock.timers.size,0);assert.equal(await f.budget(),null);
  assert.deepEqual(events.filter(e=>e.type==='failed'),[{type:'failed',lane:'discovery',error:'ROBOTS_DISALLOWED'}]);
});
test('the elapsed runtime bound prevents future cycles and drains already admitted acquisition',async()=>{
  const f=await supervisionFixture(db),r=await runFastIngestion({...options(f),maxTicks:100,maxRunMs:1});
  assert.ok(Object.values(r.reasons).every(reason=>reason==='max_runtime'));assert.ok(r.ticks.discovery<=1&&r.ticks.dispatch<=1);assert.equal(f.clock.timers.size,0);
});
test('a changed principal during idle time cannot start another cycle',async()=>{
  const f=await supervisionFixture(db),idle=deferred(),stop=new AbortController();let processed=false,discoveryWaiting=false;
  const run=runFastIngestion({...options(f),signal:stop.signal,onEvent:e=>{if(e.type==='tick'&&e.lane==='dispatch'&&e.selected>0)processed=true;if(e.type==='waiting'&&e.lane==='discovery')discoveryWaiting=true;if(e.type==='waiting'&&e.lane==='dispatch'&&processed&&discoveryWaiting)idle.resolve();}});
  try{await idle.promise;const before=f.state.fetches.length;f.worker.principal='changed@example.test';f.clock.advance(120000);await assert.rejects(run,{code:'FAST_RUNTIME_IDENTITY_CHANGED'});assert.equal(f.state.fetches.length,before);assert.equal(f.clock.timers.size,0);}
  finally{stop.abort();await run.catch(()=>{});}
});
