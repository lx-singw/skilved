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
