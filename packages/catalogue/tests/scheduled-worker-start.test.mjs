import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scheduledWorkerStartWindow,runScheduledWorkerStart} from '../tools/scheduled-worker-start.mjs';

const plan={startAt:'2026-11-04T21:40:00.000Z',latestStartAt:'2026-11-04T22:30:00.000Z'};
const at=value=>({now:()=>Date.parse(value)});

test('early and missed starts never initialize the privileged worker callback',async()=>{
 for(const [date,state]of [['2026-11-04T04:30:00.000Z','waiting'],['2026-11-05T04:30:00.000Z','expired']]){
  assert.deepEqual(await runScheduledWorkerStart(plan,()=>assert.fail('bootstrap before admission'),at(date)),{window:{...plan,state},activated:false});
 }
});
test('exact start and an interior instant activate once with the callback result',async()=>{
 for(const date of [plan.startAt,'2026-11-04T22:00:00.000Z']){
  let calls=0;const result=await runScheduledWorkerStart(plan,async()=>{calls++;return'controlled-result';},at(date));
  assert.equal(calls,1);assert.equal(result.activated,true);assert.equal(result.result,'controlled-result');
 }
});
test('the latest-start boundary is exclusive and does not revive a missed window',()=>{
 assert.equal(scheduledWorkerStartWindow(plan,at(plan.latestStartAt)).state,'expired');
 assert.equal(scheduledWorkerStartWindow(plan,at('2026-11-06T21:40:00.000Z')).state,'expired');
});
test('invalid schedules, excessive start windows and invalid clocks reject before activation',async()=>{
 for(const invalid of [null,{}, {...plan,startAt:'not-a-time'},{...plan,startAt:'2026-11-04T23:40:00+02:00'},
  {...plan,latestStartAt:plan.startAt},{...plan,latestStartAt:'2026-11-05T21:40:00.000Z'}])
  await assert.rejects(runScheduledWorkerStart(invalid,()=>assert.fail('invalid schedule'),at(plan.startAt)),{code:'SCHEDULE_CONFIGURATION_REQUIRED'});
 await assert.rejects(runScheduledWorkerStart(plan,()=>assert.fail('invalid clock'),{now:()=>NaN}),{code:'SCHEDULE_CONFIGURATION_REQUIRED'});
});
test('a failed bootstrap is never retried by the scheduling gate',async()=>{
 let calls=0;await assert.rejects(runScheduledWorkerStart(plan,async()=>{calls++;throw Object.assign(Error('controlled failure'),{code:'WORKER_UNAUTHORIZED'});},at(plan.startAt)),{code:'WORKER_UNAUTHORIZED'});
 assert.equal(calls,1);
});
test('every invocation rechecks wall time and leaves the saved schedule unchanged',async()=>{
 const original=structuredClone(plan);let clock=Date.parse(plan.startAt);
 assert.equal((await runScheduledWorkerStart(plan,()=>null,{now:()=>clock})).activated,true);
 clock-=60000;assert.equal((await runScheduledWorkerStart(plan,()=>assert.fail('early clock'),{now:()=>clock})).activated,false);
 assert.deepEqual(plan,original);
});
