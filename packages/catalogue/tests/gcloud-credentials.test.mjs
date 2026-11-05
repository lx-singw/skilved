import test from 'node:test';
import assert from 'node:assert/strict';
import { OAuth2Client } from 'google-auth-library';
import { gcloudCredentialSource } from '../tools/gcloud-credentials.mjs';

function fixture() {
  const state = { account: 'operator@example.test', now: Date.now(), calls: [], token: 'synthetic-first', expiry: null, override: {}, error: false };
  state.expiry = new Date(state.now + 11 * 60_000).toISOString();
  const run = (bin, args, options) => {
    state.calls.push({ bin, args, options });
    if (state.error) throw new Error('private synthetic credential payload');
    if (args[1] === 'get-value') return state.account;
    return JSON.stringify({ credential: { access_token: state.token, token_expiry: state.expiry }, configuration: { properties: { core: { account: state.contextAccount ?? state.account }, auth: state.override } } });
  };
  const env = {};
  const source = gcloudCredentialSource({ run, now: () => state.now, env });
  return { source, state, env };
}

test('uses reported expiry unchanged and requests a minimum lifetime without exposing the token', () => {
  const { source, state } = fixture();
  const credential = source.credentials();
  assert.equal(credential.expiry_date, Date.parse(state.expiry));
  assert.equal(credential.access_token, state.token);
  assert.deepEqual(state.calls.find(c => c.args[1] === 'config-helper').args, ['config', 'config-helper', '--min-expiry=10m', '--format=json']);
  assert.ok(state.calls.every(c => c.options.stdio.join(',') === 'ignore,pipe,pipe'));
  assert.ok(state.calls.every(c=>c.options.timeout===30000&&c.options.maxBuffer===1048576));
});
test('a configured local account must match before any credential metadata is obtained',()=>{
 const calls=[];assert.throws(()=>gcloudCredentialSource({expectedAccount:'expected@example.test',run:(_bin,args)=>{calls.push(args);return'other@example.test';}}),{code:'GCLOUD_ACCOUNT_CHANGED'});
 assert.deepEqual(calls,[['config','get-value','account']]);
});

test('real SDK eager refresh obtains new metadata before the old reported expiry', async () => {
  const { source, state } = fixture();
  const client = source.oauth(OAuth2Client);
  const originalExpiry = client.credentials.expiry_date;
  // Advance the SDK clock through its public refresh threshold; no HTTP is mocked.
  client.eagerRefreshThresholdMillis = 12 * 60_000;
  state.token = 'synthetic-renewed';
  state.expiry = new Date(state.now + 60 * 60_000).toISOString();
  assert.equal((await client.getAccessToken()).token, 'synthetic-renewed');
  assert.ok(client.credentials.expiry_date > originalExpiry);
  assert.equal(client.credentials.expiry_date, Date.parse(state.expiry));
  assert.equal(source.refreshCount(), 1);
});

test('rejects missing, invalid, expired and imminently expiring metadata', () => {
  for (const expiry of [undefined, '', 'unknown', new Date(0).toISOString(), new Date(Date.now() + 60_000).toISOString()]) {
    const { source, state } = fixture();state.expiry = expiry;
    assert.throws(() => source.credentials(), { code: 'GCLOUD_CREDENTIAL_METADATA_INVALID' });
  }
});

test('rejects account changes both before and inside the CLI metadata response', () => {
  const a = fixture();a.state.account = 'changed@example.test';
  assert.throws(() => a.source.credentials(), { code: 'GCLOUD_ACCOUNT_CHANGED' });
  const b = fixture();b.state.contextAccount = 'changed@example.test';
  assert.throws(() => b.source.credentials(), { code: 'GCLOUD_ACCOUNT_CHANGED' });
});

test('rejects credential overrides and conflicting runtime environments', () => {
  for (const key of ['impersonate_service_account', 'access_token_file', 'credential_file_override']) {
    const { source, state } = fixture();state.override[key] = 'synthetic';
    assert.throws(() => source.credentials(), { code: 'GCLOUD_CREDENTIAL_OVERRIDE' });
  }
  for (const key of ['GOOGLE_APPLICATION_CREDENTIALS', 'FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST']) {
    const { source, env } = fixture();env[key] = 'synthetic';
    assert.throws(() => source.credentials(), { code: 'GCLOUD_CREDENTIAL_ENV_CONFLICT' });
  }
});

test('sanitizes command failures and refuses malformed tokens', async () => {
  const { source, state } = fixture();const client = source.oauth(OAuth2Client);
  state.error = true;client.eagerRefreshThresholdMillis = 12 * 60_000;
  await assert.rejects(client.getAccessToken(), error => error.code === 'GCLOUD_CREDENTIAL_COMMAND_FAILED' && !error.message.includes('private'));
  assert.equal(source.refreshCount(), 0);
  for (const token of ['', null, 'synthetic\nsecret']) {
    const f = fixture();f.state.token = token;
    assert.throws(() => f.source.credentials(), { code: 'GCLOUD_CREDENTIAL_METADATA_INVALID' });
  }
});
