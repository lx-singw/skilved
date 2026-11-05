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
test('check-only verifies normal identity, source/grant and query gates without running or activating refresh',async()=>{
 const s=setup(),result=await runFastWorkerCommand(['--enable-shadow','example_source','3','--refresh-private','--check'],s);
 assert.equal(result.ready,true);assert.deepEqual(s.calls,['identity','worker','preflight','refresh-preflight','close']);
 const simple=setup();await runFastWorkerCommand(['--enable-shadow','example_source','3','--check'],simple);assert.ok(!simple.calls.includes('run'));
 for(const flags of [['--check','--check'],['--refresh-private','extra']])await assert.rejects(runFastWorkerCommand(['--enable-shadow','example_source','3',...flags],setup()),/INVALID_COMMAND/);
});
test('failed preflight closes database without discovery or processing',async()=>{
  const s=setup();s.dependencies.FastRecentJobsWorker=class {constructor(){this.fast={dispatchSnapshot:async()=>{throw Error('index missing');}};}};
  await assert.rejects(runFastWorkerCommand(['--enable-shadow','source','3'],s),/index missing/);
  assert.deepEqual(s.calls,['identity','close']);assert.equal(s.signals.listenerCount('SIGINT'),0);
});
test('sanitized machine-identity diagnostics reach supervision and failure still closes the database',async()=>{
 const s=setup(),events=[];
 s.output=event=>events.push(event);s.dependencies.workerPrincipal=async(_config,_env,{onDiagnostic})=>{
  await onDiagnostic({stage:'token',attempt:1,status:403,networkCode:null,credentialCode:null,retrying:false});throw Object.assign(Error('WORKER_UNAUTHORIZED'),{code:'WORKER_UNAUTHORIZED'});
 };
 await assert.rejects(runFastWorkerCommand(['--enable-shadow','source','3'],s),{code:'WORKER_UNAUTHORIZED'});
 assert.deepEqual(events,[{type:'identity_failure',stage:'token',attempt:1,status:403,networkCode:null,credentialCode:null,retrying:false}]);assert.deepEqual(s.calls,['close']);
});
test('stop signal reaches runtime and database closes only after admitted work drains',async()=>{
  const s=setup();s.dependencies.runFastIngestion=async({signal})=>{
    s.signals.emit('SIGTERM');assert.ok(signal.aborted);assert.ok(!s.calls.includes('close'));
    await Promise.resolve();s.calls.push('drained');return{publiclyVisible:false};};
  await runFastWorkerCommand(['--enable-shadow','source','3'],s);
  assert.deepEqual(s.calls.slice(-2),['drained','close']);
});
