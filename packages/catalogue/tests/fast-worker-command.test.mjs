import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {runFastWorkerCommand} from '../tools/run-fast-recentjobs.mjs';

function setup(){
  const calls=[],signals=new EventEmitter();let captured;
  class Worker {constructor(db,principal,options){captured=options;this.privateRefresh=options.privateRefresh;calls.push('worker');this.fast={dispatchSnapshot:async()=>{calls.push('preflight');}};this.queueRefreshes=async options=>{assert.deepEqual(options,{limit:1,checkOnly:true});calls.push('refresh-preflight');};}}
  const dependencies={extractionConfiguration:()=>({provider:'groq'}),
    getRuntime:async()=>({config:{},db:{terminate:async()=>{calls.push('close');}}}),
    workerPrincipal:async()=>{calls.push('identity');return'worker@example.test';},FastRecentJobsWorker:Worker,
    runFastIngestion:async options=>{calls.push('run');return{publiclyVisible:false};}};
  return{calls,signals,dependencies,get captured(){return captured;},output:()=>{}};
}
test('explicit opt-in and a pinned revision are required before identity or database work',async()=>{
  const s=setup();for(const args of [[],['source'],['--enable-shadow','source','0'],['--enable-shadow','source','1','extra']])
    await assert.rejects(runFastWorkerCommand(args,s),/INVALID_COMMAND/);
  assert.deepEqual(s.calls,[]);assert.ok((await runFastWorkerCommand(['--help'],s)).help);
});
test('launcher verifies identity and active query before invoking supervised runtime and closes database',async()=>{
  const s=setup();await runFastWorkerCommand(['--enable-shadow','example_source','3'],s);
  assert.deepEqual(s.calls,['identity','worker','preflight','run','close']);
  assert.equal(s.captured.sourceRevision,3);assert.deepEqual(s.captured.leaseSupervision,{enabled:true});
  assert.equal(s.signals.listenerCount('SIGTERM'),0);
});
test('private refresh requires its explicit flag and a read-only refresh query preflight',async()=>{
 const s=setup();await runFastWorkerCommand(['--enable-shadow','example_source','3','--refresh-private'],s);
 assert.equal(s.captured.privateRefresh,true);assert.deepEqual(s.calls,['identity','worker','preflight','refresh-preflight','run','close']);
});
test('failed preflight closes database without discovery or processing',async()=>{
  const s=setup();s.dependencies.FastRecentJobsWorker=class {constructor(){this.fast={dispatchSnapshot:async()=>{throw Error('index missing');}};}};
  await assert.rejects(runFastWorkerCommand(['--enable-shadow','source','3'],s),/index missing/);
  assert.deepEqual(s.calls,['identity','close']);assert.equal(s.signals.listenerCount('SIGINT'),0);
});
test('stop signal reaches runtime and database closes only after admitted work drains',async()=>{
  const s=setup();s.dependencies.runFastIngestion=async({signal})=>{
    s.signals.emit('SIGTERM');assert.ok(signal.aborted);assert.ok(!s.calls.includes('close'));
    await Promise.resolve();s.calls.push('drained');return{publiclyVisible:false};};
  await runFastWorkerCommand(['--enable-shadow','source','3'],s);
  assert.deepEqual(s.calls.slice(-2),['drained','close']);
});
