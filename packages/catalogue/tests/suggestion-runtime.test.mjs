import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getApps } from 'firebase-admin/app';
import { handleSuggestionRequest, suggestionPageSettings } from '../src/suggestion-runtime.mjs';
const key = 'a'.repeat(64), origin = 'https://app.example';
const manifest = { origin, recoveryEpoch: 'd1'.repeat(32), keyRing: { activeKeyId: 'test', keys: [{ id: 'test', secret: key }] },
  replayTickets: { epoch: 'c1'.repeat(32), secret: 'b1'.repeat(32), notBefore: '2026-10-16T12:00:00.000Z', ttlMs: 86400000 },
  policy: { intakeEnabled: true, maxWork: 100, maxReceipts: 500, createAttemptsPerHour: 50, statusReadsPerHour: 600, receiptTtlMs: 86400000 } };
const env = { SKILVED_SUGGESTIONS_ENABLED:'true', SKILVED_CATALOGUE_MODE:'cloud', SKILVED_CATALOGUE_PROJECT:'test-runtime', SKILVED_CATALOGUE_READS:'true', SKILVED_SUGGESTIONS_CONFIG:JSON.stringify(manifest) };
const ticket = ['s1', 'c1'.repeat(32), Date.parse('2026-10-16T12:00:00.000Z'), Date.parse('2026-10-17T12:00:00.000Z'), 'd1'.repeat(32), 'e1'.repeat(32)].join('.');
const request = (method = 'POST', path = '') => new Request(origin+'/api/v1/opportunity-suggestions'+path,{ method,
  headers:{ 'Content-Type':'application/json', 'Idempotency-Key':ticket }, ...(method === 'POST' ? { body:JSON.stringify({url:'https://source.example/notice'}) } : {}) });

test('page flags expose booleans only, preserve intake-off access and do not initialize providers',()=>{
  const apps=getApps().length;
  for(const value of [{},{...env,SKILVED_SUGGESTIONS_ENABLED:'false'},{...env,SKILVED_SUGGESTIONS_CONFIG:'PRIVATE'}])
    assert.deepEqual(suggestionPageSettings(value),{enabled:false,intakeEnabled:false});
  assert.deepEqual(suggestionPageSettings(env),{enabled:true,intakeEnabled:true});
  const off={...env,SKILVED_SUGGESTIONS_CONFIG:JSON.stringify({...manifest,policy:{...manifest.policy,intakeEnabled:false}})};
  assert.deepEqual(suggestionPageSettings(off),{enabled:true,intakeEnabled:false});assert.equal(getApps().length,apps);
  assert.doesNotMatch(JSON.stringify(suggestionPageSettings(env)),/secret|epoch|keyRing|origin|policy/);
});

test('route adapter guards missing/disabled/invalid settings before runtime or app initialization', async () => {
  const apps = getApps().length;let calls = 0;const runtimeProvider = async () => { calls++;throw new Error('PRIVATE_SDK'); };
  for (const settings of [{},{...env,SKILVED_SUGGESTIONS_ENABLED:'false'},{...env,SKILVED_SUGGESTIONS_CONFIG:'PRIVATE_BAD'}]) {
    const response = await handleSuggestionRequest(request(),{env:settings,runtimeProvider});assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/PRIVATE/);
  }
  assert.equal(calls,0);assert.equal(getApps().length,apps);
});

test('transport stops before runtime; valid create/withdrawal enforce project binding even with intake off', async () => {
  let calls = 0;const runtimeProvider = async () => { calls++;return { config:{ mode:'cloud',projectId:'wrong-project' }, get db() { assert.fail('Wrong database must never be used'); } }; };
  assert.equal((await handleSuggestionRequest(request('DELETE','/'+key),{env,runtimeProvider})).status,404);
  assert.equal((await handleSuggestionRequest(request('GET','/'+key+'/status'),{env,runtimeProvider})).status,404);
  assert.equal(calls,0);
  assert.equal((await handleSuggestionRequest(request(),{env,runtimeProvider})).status,503);assert.equal(calls,1);
  const disabledIntake={...env,SKILVED_SUGGESTIONS_CONFIG:JSON.stringify({...manifest,policy:{...manifest.policy,intakeEnabled:false}})};
  assert.equal((await handleSuggestionRequest(request(),{env:disabledIntake,runtimeProvider})).status,503);assert.equal(calls,1);
  const deletion=new Request(origin+'/api/v1/opportunity-suggestions/'+key,{method:'DELETE',headers:{Authorization:'Bearer '+key}});
  assert.equal((await handleSuggestionRequest(deletion,{env:disabledIntake,runtimeProvider})).status,503);assert.equal(calls,2);
});
