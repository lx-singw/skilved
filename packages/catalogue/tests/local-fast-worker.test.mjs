import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {spawnSync} from 'node:child_process';
import {runLocalFastWorker,localFastSettings,localWorkerFailure} from '../tools/run-local-fast-worker.mjs';
const env={NODE_ENV:'production',SKILVED_CATALOGUE_MODE:'cloud',SKILVED_CATALOGUE_PROJECT:'skilved-staging',SKILVED_CATALOGUE_READS:'false',SKILVED_CATALOGUE_REPORTS:'false',SKILVED_SUGGESTIONS_ENABLED:'false',SKILVED_AI_MODE:'gemini'};
const args=['--enable-shadow','authored_source','5','--principal','authored-worker@skilved-staging.iam.gserviceaccount.com','--account','operator@example.test','--refresh-private'];
test('local launcher requires explicit staging-only configuration and a pinned source, account and principal',async()=>{
 for(const override of [{SKILVED_CATALOGUE_PROJECT:'other-project'},{SKILVED_CATALOGUE_MODE:'emulator'},{SKILVED_CATALOGUE_READS:'true'},{SKILVED_AI_MODE:'groq'},{NODE_ENV:'development'}])
  assert.throws(()=>localFastSettings(args,{...env,...override}));
 for(const input of [[],args.slice(0,6),[...args.slice(0,2),'0',...args.slice(3)],[...args.slice(0,4),'other@different.iam.gserviceaccount.com',...args.slice(5)],[...args,'--refresh-private'],[...args,'--unknown']])
  assert.throws(()=>localFastSettings(input,env));
 assert.deepEqual(localFastSettings([...args,'--check'],env).workerArgs,['--enable-shadow','authored_source','5','--refresh-private','--check']);
 assert.ok((await runLocalFastWorker(['--help'],{env:{}})).help);
});
test('delegated ID-token verification and principal equality precede the unchanged bounded command',async()=>{
 const signals=new EventEmitter(),identityAuth={},db={},events=[];
 const deps={localDelegatedRuntime:async(settings,environment)=>{assert.equal(settings.account,args[6]);assert.equal(environment,env);events.push('clients');return{config:settings.config,identityAuth,db};},
  workerPrincipal:async(_config,environment,options)=>{assert.equal(environment,env);assert.equal(options.auth,identityAuth);events.push('verified');return args[4];},
  runFastWorkerCommand:async(command,options)=>{assert.deepEqual(command,['--enable-shadow','authored_source','5','--refresh-private']);assert.equal(options.signals,signals);const runtime=await options.dependencies.getRuntime();assert.equal(runtime.db,db);assert.equal(await options.dependencies.workerPrincipal(runtime.config,env,{signal:new AbortController().signal}),args[4]);events.push('run');return{publiclyVisible:false};}};
 assert.equal((await runLocalFastWorker(args,{env,signals,dependencies:deps})).publiclyVisible,false);assert.deepEqual(events,['clients','verified','run']);
 deps.workerPrincipal=async()=> 'different@skilved-staging.iam.gserviceaccount.com';
 await assert.rejects(runLocalFastWorker(args,{env,signals,dependencies:deps}),{code:'WORKER_UNAUTHORIZED'});
});
test('supervision retries only recognized transient failures and exposes no raw error content',()=>{
 for(const code of [14,4,'UNAVAILABLE','ECONNRESET'])assert.equal(localWorkerFailure({code}).exitCode,1);
 assert.equal(localWorkerFailure({code:'WORKER_UNAUTHORIZED',identityFailure:{stage:'token',status:503,credentialCode:null}}).exitCode,1);
 for(const code of ['WORKER_FORBIDDEN','FAST_SOURCE_REVISION_ADOPTION_REQUIRED','GCLOUD_ACCOUNT_CHANGED','AI_CONFIGURATION_REQUIRED','PRIVATE_TOKEN_SENTINEL invalid message']){
  const result=localWorkerFailure({code,message:'PRIVATE_TOKEN_SENTINEL'});assert.equal(result.exitCode,78);assert.doesNotMatch(JSON.stringify(result),/PRIVATE_TOKEN_SENTINEL/);
 }
 assert.equal(localWorkerFailure({code:'WORKER_UNAUTHORIZED',identityFailure:{stage:'credentials',status:503,credentialCode:'GCLOUD_ACCOUNT_CHANGED'}}).exitCode,78);
 assert.deepEqual(localWorkerFailure({code:9,name:'Error',message:'PRIVATE_TOKEN_SENTINEL'}),{error:'LOCAL_FAST_WORKER_FAILED',exitCode:78,failureKind:'Error',backendStatus:9});
});
test('actual local CLI refuses missing configuration with a terminal status before accessing credentials',()=>{
 const result=spawnSync(process.execPath,['packages/catalogue/tools/run-local-fast-worker.mjs',...args],{cwd:new URL('../../../',import.meta.url),env:{PATH:process.env.PATH},encoding:'utf8'});
 assert.equal(result.status,78);assert.deepEqual(JSON.parse(result.stderr),{error:'LOCAL_FAST_CONFIGURATION_REQUIRED',exitCode:78});
});
