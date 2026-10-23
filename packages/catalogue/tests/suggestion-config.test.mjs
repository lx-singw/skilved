import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggestionConfiguration } from '../src/suggestion-config.mjs';
import { handleSuggestion } from '../src/suggestion-http.mjs';
const policy = { intakeEnabled: false, maxWork: 100, maxReceipts: 500, createAttemptsPerHour: 50, statusReadsPerHour: 600, receiptTtlMs: 86400000 };
const replayTickets = { epoch: 'c1'.repeat(32), secret: 'b1'.repeat(32), notBefore: '2026-10-16T12:00:00.000Z', ttlMs: 86400000 };
const manifest = { origin: 'https://app.example', keyRing: { activeKeyId: 'synthetic', keys: [{ id: 'synthetic', secret: 'a1'.repeat(32) }] }, policy, replayTickets };
const cloud = { SKILVED_SUGGESTIONS_ENABLED: 'true', SKILVED_CATALOGUE_MODE: 'cloud', SKILVED_CATALOGUE_PROJECT: 'skilved-fixture', SKILVED_CATALOGUE_READS: 'true' };
const env = (overrides = {}, config = manifest) => ({ ...cloud, SKILVED_SUGGESTIONS_CONFIG: JSON.stringify(config), ...overrides });
const denied = input => assert.throws(() => suggestionConfiguration(input), error => error.message === 'UNSAFE_CONFIGURATION' && error.code === 'UNSAFE_CONFIGURATION');

test('disabled flags return before reading other configuration and never write environment', () => {
  for (const flag of [undefined,'false','disabled']) {
    const input = { SKILVED_SUGGESTIONS_ENABLED: flag, get SKILVED_SUGGESTIONS_CONFIG() { assert.fail('Disabled must not read secrets'); } };
    assert.equal(suggestionConfiguration(input),null);
  }
  const input = env(), before = JSON.stringify(input);const result = suggestionConfiguration(input);
  assert.equal(JSON.stringify(input),before);assert.equal(result.http.intakeEnabled,false);assert.equal(result.receipt.maxTtlMs,86400000);
  assert.equal(result.http.emulator,false);assert.equal(result.http.readDeadlineMs,5000);assert.equal(result.http.serviceDeadlineMs,10000);
});

test('enabled malformed manifests, flags, keys, limits and disabled public reads fail with safe errors', () => {
  for (const override of [{ SKILVED_SUGGESTIONS_ENABLED:'yes' },{ SKILVED_SUGGESTIONS_CONFIG:undefined },{ SKILVED_SUGGESTIONS_CONFIG:'PRIVATE_BAD_JSON' },
    { SKILVED_SUGGESTIONS_CONFIG:'x'.repeat(8193) },{ SKILVED_CATALOGUE_MODE:'disabled' },{ SKILVED_CATALOGUE_READS:'false' }])denied(env(override));
  for (const value of [{ ...manifest, extra:'PRIVATE' },{ ...manifest, keyRing:undefined },
    { ...manifest, replayTickets: undefined }, { ...manifest, replayTickets: { ...replayTickets, epoch: replayTickets.secret } },
    { ...manifest, replayTickets: { ...replayTickets, epoch: manifest.keyRing.keys[0].secret } },
    { ...manifest, replayTickets: { ...replayTickets, secret: manifest.keyRing.keys[0].secret } },
    { ...manifest, replayTickets: { ...replayTickets, ttlMs: 30 * 86400000 + 1 } },
    { ...manifest, keyRing:{ activeKeyId:'synthetic', keys:[{ id:'synthetic', secret:'PRIVATE_INVALID' }] } },
    { ...manifest, policy:{ ...policy, maxReceipts:501 } },{ ...manifest, policy:{ ...policy, intakeEnabled:'true' } }])denied(env({},value));
});

test('base production/emulator guards are retained and HTTP origins are loopback emulator only', () => {
  const emulator = { SKILVED_CATALOGUE_MODE:'emulator', SKILVED_CATALOGUE_PROJECT:'demo-skilved-http', FIRESTORE_EMULATOR_HOST:'127.0.0.1:18282', FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:19299' };
  for (const origin of ['http://localhost:3000','http://127.0.0.1:3000']) {
    const result = suggestionConfiguration(env(emulator,{ ...manifest,origin }));assert.equal(result.http.origin,origin);assert.equal(result.http.emulator,true);
    denied(env({}, { ...manifest,origin }));
  }
  for (const origin of ['http://evil.example','http://localhost.evil.example','http://user:PRIVATE@localhost:3000','https://app.example/path','https://app.example?token=PRIVATE'])denied(env(emulator,{ ...manifest,origin }));
  denied(env({ ...emulator,NODE_ENV:'production' }));denied(env({ ...emulator,FIRESTORE_EMULATOR_HOST:'evil.example:8080' }));
  denied(env({ ...emulator,SKILVED_CATALOGUE_PROJECT:'real-project' }));denied(env({ FIRESTORE_EMULATOR_HOST:'127.0.0.1:18282' }));
});

test('validated local origin reaches only status provider while disabled intake still has no runtime call', async () => {
  const emulator = { SKILVED_CATALOGUE_MODE:'emulator', SKILVED_CATALOGUE_PROJECT:'demo-skilved-http', FIRESTORE_EMULATOR_HOST:'127.0.0.1:18282', FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:19299' };
  const config = suggestionConfiguration(env(emulator,{ ...manifest,origin:'http://localhost:3000' })).http;
  let called = 0;const provider = async () => { called++;throw new Error('PRIVATE_RUNTIME_ERROR'); };
  const post = await handleSuggestion(new Request(config.origin+'/api/v1/opportunity-suggestions',{ method:'POST' }),{ config,provider });assert.equal(post.status,503);assert.equal(called,0);
  const get = await handleSuggestion(new Request(config.origin+'/api/v1/opportunity-suggestions/'+'a'.repeat(64)+'/status',{ headers:{ Authorization:'Bearer '+'b'.repeat(64) } }),{ config,provider });
  assert.equal(get.status,503);assert.equal(called,1);assert.doesNotMatch(await get.text(),/PRIVATE/);
});
