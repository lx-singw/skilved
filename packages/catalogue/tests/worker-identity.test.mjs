import {test} from 'node:test';
import assert from 'node:assert/strict';
import {workerPrincipal} from '../src/worker-identity.mjs';
const config={mode:'cloud',projectId:'skilved-staging'},email='worker@skilved-staging.iam.gserviceaccount.com';
function dependencies(payload={email,email_verified:true}){
 const calls=[];
 return {calls,auth:{getIdTokenClient:async audience=>{
  calls.push(['client',audience]);return {getRequestHeaders:async()=>new Headers({authorization:'Bearer synthetic-id-token'})};
 }},verifier:{verifyIdToken:async input=>{calls.push(['verify',input]);return {getPayload:()=>payload};}}};
}
test('cloud workload and delegated clients use the same mandatory token verification and project audience',async()=>{
 const d=dependencies();assert.equal(await workerPrincipal(config,{},d),email);
 assert.deepEqual(d.calls,[['client','https://skilved.invalid/worker/skilved-staging'],
  ['verify',{idToken:'synthetic-id-token',audience:'https://skilved.invalid/worker/skilved-staging'}]]);
});
test('emulator identity never initializes cloud clients and rejects production or non-demo configuration',async()=>{
 const d={auth:{getIdTokenClient:()=>assert.fail('cloud access')}};
 const env={SKILVED_WORKER_EMULATOR_IDENTITY:'synthetic-worker@example.test'};
 assert.equal(await workerPrincipal({mode:'emulator',projectId:'demo-worker'},env,d),'synthetic-worker@example.test');
 for(const [settings,variables]of [[config,env],[{mode:'emulator',projectId:'skilved-staging'},env],
  [{mode:'emulator',projectId:'demo-worker'},{...env,NODE_ENV:'production'}]])
  await assert.rejects(workerPrincipal(settings,variables,d),{code:'WORKER_UNAUTHORIZED'});
});
test('verified email must be a service account and verification must be boolean true',async()=>{
 for(const payload of [null,{}, {email,email_verified:false},{email,email_verified:'true'},
  {email:'human@example.test',email_verified:true}])
  await assert.rejects(workerPrincipal(config,{},dependencies(payload)),{code:'WORKER_UNAUTHORIZED'});
});
test('missing tokens, signature failures and issuer/client errors are sanitized',async()=>{
 for(const d of [
  {auth:{getIdTokenClient:async()=>({getRequestHeaders:async()=>new Headers()})}},
  {...dependencies(),verifier:{verifyIdToken:async()=>{throw Error('PRIVATE_TOKEN_DIAGNOSTIC');}}},
  {auth:{getIdTokenClient:async()=>{throw Error('PRIVATE_CREDENTIAL_DIAGNOSTIC');}}},
 ])await assert.rejects(workerPrincipal(config,{},d),error=>{
  assert.equal(error.code,'WORKER_UNAUTHORIZED');assert.doesNotMatch(error.stack,/PRIVATE_/);return true;
 });
});
test('disabled, missing or malformed project configuration rejects before requesting credentials',async()=>{
 const d={auth:{getIdTokenClient:()=>assert.fail('credential request')}};
 for(const settings of [null,{}, {mode:'disabled',projectId:'skilved-staging'}, {...config,projectId:'../other'}])
  await assert.rejects(workerPrincipal(settings,{},d),{code:'WORKER_UNAUTHORIZED'});
});
test('an environment email hint cannot replace the verified token principal',async()=>{
 assert.equal(await workerPrincipal(config,{SKILVED_STAGING_WORKER_PRINCIPAL:'other@skilved-staging.iam.gserviceaccount.com'},dependencies()),email);
});

test('transient token acquisition retries within three attempts and still verifies the recovered token',async()=>{
 const d=dependencies(),diagnostics=[],waits=[];let attempts=0;
 d.auth={getIdTokenClient:async()=>({getRequestHeaders:async()=>{
  if(++attempts<3)throw Object.assign(Error('PRIVATE_TOKEN'),{response:{status:503,data:'PRIVATE_BODY'}});
  return new Headers({authorization:'Bearer synthetic-id-token'});
 }})};
 assert.equal(await workerPrincipal(config,{}, {...d,onDiagnostic:r=>diagnostics.push(r),wait:async ms=>waits.push(ms)}),email);
 assert.equal(attempts,3);assert.deepEqual(waits,[1000,2000]);
 assert.deepEqual(diagnostics.map(d=>[d.stage,d.status,d.retrying]),[['token',503,true],['token',503,true]]);
 assert.equal(d.calls.filter(c=>c[0]==='verify').length,1);
 assert.doesNotMatch(JSON.stringify(diagnostics),/PRIVATE|synthetic-id-token/);
});

test('transient certificate acquisition can recover, but persistent transport failures stop after three attempts',async()=>{
 const d=dependencies();let attempts=0;d.verifier={verifyIdToken:async()=>{
  if(++attempts===1)throw Object.assign(Error('PRIVATE_CERT_URL'),{cause:{code:'EAI_AGAIN'}});
  return {getPayload:()=>({email,email_verified:true})};
 }};
 const diagnostics=[];assert.equal(await workerPrincipal(config,{}, {...d,onDiagnostic:r=>diagnostics.push(r),wait:async()=>{}}),email);
 assert.equal(diagnostics[0].stage,'verification');assert.equal(diagnostics[0].networkCode,'EAI_AGAIN');
 let calls=0;const failed={auth:{getIdTokenClient:async()=>{calls++;throw Object.assign(Error('PRIVATE_SOCKET'),{code:'ETIMEDOUT'});}},wait:async()=>{}};
 await assert.rejects(workerPrincipal(config,{},failed),error=>{
  assert.equal(error.code,'WORKER_UNAUTHORIZED');assert.equal(error.identityFailure.attempt,3);assert.equal(error.identityFailure.retrying,false);
  assert.doesNotMatch(JSON.stringify(error),/PRIVATE/);return true;
 });assert.equal(calls,3);
});

test('authorization, account changes, invalid signatures and invalid principals never retry',async()=>{
 for(const error of [Object.assign(Error('PRIVATE'),{response:{status:401},cause:{code:'ECONNRESET'}}),
  Object.assign(Error('PRIVATE'),{response:{status:403}}),Object.assign(Error('PRIVATE'),{code:'GCLOUD_ACCOUNT_CHANGED'}),
  Error('PRIVATE_SIGNATURE'),Object.assign(Error('PRIVATE'),{response:{status:400}})]){
  let calls=0;await assert.rejects(workerPrincipal(config,{}, {auth:{getIdTokenClient:async()=>{calls++;throw error;}},wait:async()=>assert.fail('retry')}),{code:'WORKER_UNAUTHORIZED'});assert.equal(calls,1);
 }
 await assert.rejects(workerPrincipal(config,{}, {...dependencies({email:'human@example.test',email_verified:true}),wait:async()=>assert.fail('retry')}),{code:'WORKER_UNAUTHORIZED'});
});

test('diagnostic callbacks cannot alter retry decisions or bypass token verification',async()=>{
 const d=dependencies();d.verifier={verifyIdToken:async()=>{throw Error('PRIVATE_SIGNATURE');}};
 await assert.rejects(workerPrincipal(config,{}, {...d,onDiagnostic:row=>{row.retrying=true;throw Error('PRIVATE_CALLBACK');},wait:async()=>assert.fail('retry')}),error=>{
  assert.equal(error.code,'WORKER_UNAUTHORIZED');assert.equal(error.identityFailure.retrying,false);assert.equal(error.identityFailure.stage,'verification');assert.doesNotMatch(error.stack,/PRIVATE/);return true;
 });
});

test('cancellation stops identity retries and never returns an admitted principal',async()=>{
 const signal=new AbortController();let calls=0;
 const auth={getIdTokenClient:async()=>{calls++;throw Object.assign(Error(),{response:{status:429}});}};
 await assert.rejects(workerPrincipal(config,{}, {auth,signal:signal.signal,wait:async()=>signal.abort()}),{code:'WORKER_STOP_REQUESTED'});
 assert.equal(calls,1);
 await assert.rejects(workerPrincipal(config,{}, {...dependencies(),signal:signal.signal}),{code:'WORKER_STOP_REQUESTED'});
});

test('the default retry timer is abortable and timer failures do not expose raw diagnostics',async()=>{
 const stopping=new AbortController();let timer;
 const auth={getIdTokenClient:async()=>{throw Object.assign(Error('PRIVATE'),{code:'ECONNRESET'});}};
 try{await assert.rejects(workerPrincipal(config,{}, {auth,signal:stopping.signal,onDiagnostic:()=>{timer=setTimeout(()=>stopping.abort(),0);}}),{code:'WORKER_STOP_REQUESTED'});}
 finally{clearTimeout(timer);}
 await assert.rejects(workerPrincipal(config,{}, {auth,wait:async()=>{throw Error('PRIVATE_TIMER');}}),error=>{
  assert.equal(error.code,'WORKER_UNAUTHORIZED');assert.doesNotMatch(error.stack,/PRIVATE/);return true;
 });
});
