import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getApps } from 'firebase-admin/app';
import { handleSuggestionRequest } from '../src/suggestion-runtime.mjs';
const key = 'a'.repeat(64), origin = 'https://app.example';
const manifest = { origin, keyRing: { activeKeyId: 'test', keys: [{ id: 'test', secret: key }] },
  policy: { intakeEnabled: true, maxWork: 100, maxReceipts: 500, createAttemptsPerHour: 50, statusReadsPerHour: 600, receiptTtlMs: 86400000 } };
const env = { SKILVED_SUGGESTIONS_ENABLED:'true', SKILVED_CATALOGUE_MODE:'cloud', SKILVED_CATALOGUE_PROJECT:'test-runtime', SKILVED_CATALOGUE_READS:'true', SKILVED_SUGGESTIONS_CONFIG:JSON.stringify(manifest) };
const request = (method = 'POST', path = '') => new Request(origin+'/api/v1/opportunity-suggestions'+path,{ method,
  headers:{ 'Content-Type':'application/json', 'Idempotency-Key':key }, ...(method === 'POST' ? { body:JSON.stringify({url:'https://source.example/notice'}) } : {}) });

test('route adapter guards missing/disabled/invalid settings before runtime or app initialization', async () => {
  const apps = getApps().length;let calls = 0;const runtimeProvider = async () => { calls++;throw new Error('PRIVATE_SDK'); };
  for (const settings of [{},{...env,SKILVED_SUGGESTIONS_ENABLED:'false'},{...env,SKILVED_SUGGESTIONS_CONFIG:'PRIVATE_BAD'}]) {
    const response = await handleSuggestionRequest(request(),{env:settings,runtimeProvider});assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/PRIVATE/);
  }
  assert.equal(calls,0);assert.equal(getApps().length,apps);
});

test('transport and unavailable withdrawal stop before runtime, while project/mode mismatch fails closed', async () => {
  let calls = 0;const runtimeProvider = async () => { calls++;return { config:{ mode:'cloud',projectId:'wrong-project' }, get db() { assert.fail('Wrong database must never be used'); } }; };
  assert.equal((await handleSuggestionRequest(request('DELETE','/'+key),{env,runtimeProvider})).status,503);
  assert.equal((await handleSuggestionRequest(request('GET','/'+key+'/status'),{env,runtimeProvider})).status,404);
  assert.equal(calls,0);
  assert.equal((await handleSuggestionRequest(request(),{env,runtimeProvider})).status,503);assert.equal(calls,1);
  const disabledIntake={...env,SKILVED_SUGGESTIONS_CONFIG:JSON.stringify({...manifest,policy:{...manifest.policy,intakeEnabled:false}})};
  assert.equal((await handleSuggestionRequest(request(),{env:disabledIntake,runtimeProvider})).status,503);assert.equal(calls,1);
});
