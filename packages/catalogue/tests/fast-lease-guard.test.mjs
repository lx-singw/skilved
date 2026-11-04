import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FastLeaseGuard,leaseSupervisionOptions} from '../src/fast-lease-guard.mjs';
import {manualClock,deferred} from './fixtures/fast-supervision.mjs';
test('lease supervision is explicit and rejects invalid bounds and hooks',()=>{
  assert.equal(leaseSupervisionOptions(false),false);for(const input of [true,{}, {enabled:true,maxRunMs:0},{enabled:true,maxRunMs:3600001},{enabled:true,wait:1},{enabled:true,unknown:true}])assert.throws(()=>leaseSupervisionOptions(input),{code:'FAST_LEASE_CONFIGURATION_REQUIRED'});
});
test('renewals never overlap and scope exit waits for a pending renewal to settle',async()=>{
  const clock=manualClock(),renewed=deferred(),release=deferred(),work=deferred();let active=0,maximum=0,calls=0;
  const guard=new FastLeaseGuard({...leaseSupervisionOptions({enabled:true,wait:clock.wait,monotonic:clock.monotonic}),intervalMs:10000,
    renew:async()=>{calls++;maximum=Math.max(maximum,++active);renewed.resolve();await release.promise;active--;}});
  const result=guard.run(()=>work.promise);clock.advance(10000);await renewed.promise;clock.advance(20000);assert.equal(calls,1);
  work.resolve('authored result');let finished=false;result.then(()=>{finished=true;});await Promise.resolve();assert.equal(finished,false);release.resolve();assert.equal(await result,'authored result');assert.equal(maximum,1);assert.equal(clock.timers.size,0);
});
test('heartbeat failure fences work and is retained through cleanup',async()=>{
  const clock=manualClock(),work=deferred(),called=deferred(),error=Object.assign(new Error('private'),{code:'AUTHORED_RENEW_FAILURE'});
  const guard=new FastLeaseGuard({...leaseSupervisionOptions({enabled:true,wait:clock.wait,monotonic:clock.monotonic}),intervalMs:10000,renew:async()=>{called.resolve();throw error;}});
  const result=guard.run(()=>work.promise);clock.advance(10000);await called.promise;await guard.pending;assert.throws(()=>guard.assertHealthy(),{code:'AUTHORED_RENEW_FAILURE'});work.resolve();await assert.rejects(result,{code:'AUTHORED_RENEW_FAILURE'});assert.equal(clock.timers.size,0);
});
test('maximum active duration and backward monotonic clocks stop further renewal',async()=>{
  for(const mode of ['deadline','clock']){
    const clock=manualClock(),work=deferred();let renewals=0,back=false;const mono=()=>back?-1:clock.monotonic();
    const guard=new FastLeaseGuard({...leaseSupervisionOptions({enabled:true,maxRunMs:15000,wait:clock.wait,monotonic:mono}),intervalMs:10000,renew:async()=>{renewals++;}});
    const result=guard.run(()=>work.promise);if(mode==='deadline')clock.advance(15000);else{back=true;clock.advance(10000);}await guard.pending;work.resolve();await assert.rejects(result,{code:mode==='deadline'?'FAST_LEASE_RUNTIME_LIMIT':'FAST_LEASE_CLOCK_INVALID'});assert.equal(renewals,0);
  }
});
test('a stop signal fences a returned response without renewing or leaking a timer',async()=>{
  const clock=manualClock(),stop=new AbortController(),work=deferred();let renewals=0;
  const guard=new FastLeaseGuard({...leaseSupervisionOptions({enabled:true,wait:clock.wait,monotonic:clock.monotonic}),intervalMs:10000,signal:stop.signal,renew:async()=>{renewals++;}});
  const result=guard.run(()=>work.promise);stop.abort();work.resolve();await assert.rejects(result,{code:'FAST_LEASE_STOPPED'});assert.equal(renewals,0);assert.equal(clock.timers.size,0);
});
