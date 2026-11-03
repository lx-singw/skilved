import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runRecentJobsController} from '../src/recentjobs-runner.mjs';

function fixture() {
  let wall = Date.parse('2026-11-03T14:00:00.000Z'), elapsed = 0;
  const state = {events:[],waits:[],ticks:[],factories:0,probe:null,tick:null,afterWait:null,identity:null};
  const ready = () => ({state:'ready',nextWakeAt:new Date(wall).toISOString(),queued:1,ready:1,reason:'ready'});
  const waiting = ms => ({state:'waiting',nextWakeAt:new Date(wall+ms).toISOString(),queued:1,ready:0,reason:'job_due'});
  const options = {maxTicks:1,maxRunMs:9*3600000,now:()=>wall,monotonic:()=>elapsed,
    wait:async ms=>{assert.ok(ms>0&&ms<=60000);state.waits.push(ms);wall+=ms;elapsed+=ms;await state.afterWait?.();},
    onEvent:event=>state.events.push(event),createController:async()=>{
      state.factories++;return {...(state.identity?.()??{sourceId:'authored_source',sourceRevision:1,worker:{principal:'authored@example.test'}}),
        probe:async()=>state.probe?.()??ready(),tick:async options=>{state.ticks.push(wall);return state.tick?.(options)??waiting(3600000);}};
    }};
  return {state,options,ready,waiting,now:()=>wall,back:ms=>{wall-=ms;}};
}
test('runner waits eight virtual hours without a tick and resumes at the saved reset',async()=>{
  const f=fixture(),wake=f.now()+8*3600000;
  f.state.probe=()=>f.now()>=wake?f.ready():{...f.waiting(1),nextWakeAt:new Date(wake).toISOString()};
  const result=await runRecentJobsController(f.options);
  assert.equal(result.reason,'max_ticks');assert.equal(result.ticks,1);
  assert.deepEqual(f.state.ticks,[wake]);assert.equal(f.state.waits.length,480);
  assert.equal(f.state.events.filter(e=>e.type==='waiting').length,1);
  assert.ok(f.state.factories>=481);
});
test('ready continuations honor checkpoint delay and tick bounds',async()=>{
  const f=fixture(),start=f.now();f.state.tick=()=>({...f.ready(),nextWakeAt:new Date(f.now()+60000).toISOString()});
  const result=await runRecentJobsController({...f.options,maxTicks:3});
  assert.equal(result.ticks,3);assert.deepEqual(f.state.ticks,[start,start+60000,start+120000]);
});
test('maximum runtime stops a deferred runner without touching a job',async()=>{
  const f=fixture();const target=f.waiting(3600000);f.state.probe=()=>target;
  const result=await runRecentJobsController({...f.options,maxRunMs:10});
  assert.equal(result.reason,'max_runtime');assert.equal(result.ticks,0);assert.deepEqual(f.state.waits,[10]);
});
test('already stopped and aborted idle runners exit cleanly',async()=>{
  const first=fixture(),stopping=new AbortController();stopping.abort();
  assert.equal((await runRecentJobsController({...first.options,signal:stopping.signal})).reason,'signal');
  assert.equal(first.state.factories,0);
  const second=fixture(),signal=new AbortController(),target=second.waiting(600000);second.state.probe=()=>target;
  second.state.afterWait=()=>signal.abort();
  assert.equal((await runRecentJobsController({...second.options,signal:signal.signal})).reason,'signal');
  assert.equal(second.state.ticks.length,0);
});
test('an abortable sleep cancellation is a stop, not an operational failure',async()=>{
  const f=fixture(),stopping=new AbortController();f.state.probe=()=>f.waiting(60000);
  const result=await runRecentJobsController({...f.options,signal:stopping.signal,wait:async()=>{
    stopping.abort();throw Object.assign(new Error(),{name:'AbortError'});
  }});
  assert.equal(result.reason,'signal');assert.ok(!f.state.events.some(e=>e.type==='failed'));
});
test('authorization and other probe errors fail once rather than looping',async()=>{
  const f=fixture();f.state.probe=()=>{throw Object.assign(new Error('private detail'),{code:'WORKER_FORBIDDEN'});};
  await assert.rejects(runRecentJobsController(f.options),{code:'WORKER_FORBIDDEN'});
  assert.equal(f.state.factories,1);assert.equal(f.state.ticks.length,0);
  assert.deepEqual(f.state.events,[{type:'failed',ticks:0,error:'WORKER_FORBIDDEN'}]);
});
test('renewed identity cannot change the pinned principal, source or revision',async()=>{
  for(const changed of [{sourceId:'other_source'},{sourceRevision:2},{worker:{principal:'other@example.test'}}]){
    const f=fixture(),target=f.waiting(120000);f.state.probe=()=>target;
    f.state.identity=()=>({sourceId:'authored_source',sourceRevision:1,worker:{principal:'authored@example.test'},
      ...(f.state.factories>1?changed:{})});
    await assert.rejects(runRecentJobsController(f.options),{code:'RUNNER_IDENTITY_CHANGED'});
    assert.equal(f.state.ticks.length,0);
  }
});
test('monotonic duration bounds a backward wall-clock change',async()=>{
  const f=fixture(),target=f.waiting(3600000);f.state.probe=()=>target;f.state.afterWait=()=>f.back(120000);
  const result=await runRecentJobsController({...f.options,maxRunMs:60000});
  assert.equal(result.reason,'max_runtime');assert.equal(result.ticks,0);
});
test('invalid wake metadata cannot cause a busy loop',async()=>{
  for(const change of [{state:'unknown'},{nextWakeAt:'invalid'},{queued:201},{ready:2},
    {state:'waiting',nextWakeAt:'2026-11-03T14:00:00.000Z'}]){
    const f=fixture();f.state.probe=()=>({...f.ready(),...change});
    await assert.rejects(runRecentJobsController(f.options),{code:'RUNNER_STATE_INVALID'});
    assert.equal(f.state.ticks.length,0);
  }
});
test('configuration has explicit runtime, tick and poll limits',async()=>{
  for(const change of [{maxTicks:0},{maxTicks:101},{maxRunMs:0},{maxRunMs:43200001},{pollMs:60001},{signal:{}},{monotonic:()=>NaN}]){
    const f=fixture();await assert.rejects(runRecentJobsController({...f.options,...change}),{code:change.monotonic?'RUNNER_STATE_INVALID':'RUNNER_CONFIGURATION_REQUIRED'});
  }
});
