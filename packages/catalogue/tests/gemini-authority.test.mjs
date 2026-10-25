import { test } from 'node:test';
import assert from 'node:assert/strict';
import { geminiAuthorityConfiguration, assertGeminiQuotaAuthority } from '../src/ai/gemini-authority.mjs';
import { geminiQuotaScope } from '../src/ai/gemini-quota.mjs';
import { RecentJobsWorker } from '../src/recentjobs-worker.mjs';

const at = '2026-10-25T14:00:00.000Z', epoch = 'a'.repeat(64);
const env = { SKILVED_CATALOGUE_MODE: 'cloud', SKILVED_CATALOGUE_PROJECT: 'skilved-staging',
  SKILVED_GEMINI_PROJECT_ID: 'synthetic-provider', SKILVED_GEMINI_AUTHORITY_PROJECT: 'skilved-staging',
  SKILVED_GEMINI_AUTHORITY_EPOCH: epoch };
const db = { projectId: 'skilved-staging', collection: name => ({ doc: id => ({ name, id }) }) };
const binding = geminiAuthorityConfiguration(db, env);
const record = () => ({ version: 1, provider: 'gemini', scopeHash: geminiQuotaScope(env),
  projectId: db.projectId, epoch, status: 'active', migrationSha256: 'b'.repeat(64),
  quotaSha256: 'c'.repeat(64), activatedAt: '2026-10-25T13:00:00.000Z' });
const tx = data => ({ get: async ref => {
  assert.deepEqual(ref, { name: 'm0_model_authorities', id: binding.scopeHash });
  return { exists: data !== undefined, data: () => data };
} });
const payload = data => ({ json: JSON.stringify(data) });

test('authority uses the provider scope, and requires a binding to the worker database', () => {
  assert.equal(binding.scopeHash, geminiQuotaScope(env));
  assert.notEqual(binding.scopeHash, geminiQuotaScope({SKILVED_GEMINI_PROJECT_ID:db.projectId}));
  assert.ok(Object.isFrozen(binding));
  for (const change of [{SKILVED_GEMINI_AUTHORITY_PROJECT:undefined}, {SKILVED_GEMINI_AUTHORITY_PROJECT:'other-project'},
    {SKILVED_GEMINI_AUTHORITY_EPOCH:undefined}, {SKILVED_GEMINI_AUTHORITY_EPOCH:'a'},
    {SKILVED_GEMINI_PROJECT_ID:undefined}, {SKILVED_CATALOGUE_MODE:'disabled'},
    {SKILVED_CATALOGUE_PROJECT:'other-project'}])
    assert.throws(() => geminiAuthorityConfiguration(db, {...env,...change}), {code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
});

test('only explicit, correctly targeted demo emulators can omit authority', () => {
  const emulator = { SKILVED_CATALOGUE_MODE:'emulator', SKILVED_CATALOGUE_PROJECT:'demo-authority',
    FIRESTORE_EMULATOR_HOST:'127.0.0.1:18080', FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:19099' };
  assert.equal(geminiAuthorityConfiguration({projectId:'demo-authority'},emulator),null);
  assert.throws(() => geminiAuthorityConfiguration({projectId:'demo-other'},emulator), {code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
  assert.throws(() => geminiAuthorityConfiguration({projectId:'demo-authority'},{...emulator,NODE_ENV:'production'}), {code:'UNSAFE_CONFIGURATION'});
  assert.throws(() => geminiAuthorityConfiguration({projectId:'skilved-staging'},{}), {code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
  assert.throws(() => geminiAuthorityConfiguration({projectId:'demo-authority'},{...emulator,
    SKILVED_GEMINI_AUTHORITY_PROJECT:'skilved-staging', SKILVED_GEMINI_AUTHORITY_EPOCH:epoch}), {code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
});

test('active authority is read by provider scope inside the caller transaction', async () => {
  assert.equal(await assertGeminiQuotaAuthority(tx(payload(record())),db,binding,at),undefined);
  await assertGeminiQuotaAuthority({get:()=>assert.fail('isolated emulator must not read cloud authority')},db,null,at);
});

test('absent, corrupt, incomplete and future authority fail closed', async () => {
  for (const data of [undefined, {}, {json:'{'}, {json:'null'}, {json:'[]'}, {...payload(record()),extra:true},
    ...[{version:2}, {provider:'groq'}, {quotaSha256:'missing'}, {migrationSha256:undefined},
      {activatedAt:'2026-10-26T13:00:00.000Z'}, {status:'pending'}, {extra:true}].map(change=>payload({...record(),...change}))])
    await assert.rejects(assertGeminiQuotaAuthority(tx(data),db,binding,at), {code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
});

test('wrong scope, database, epoch and revoked authority reject stale callers', async () => {
  for (const change of [{scopeHash:'d'.repeat(64)}, {projectId:'other-project'}, {epoch:'e'.repeat(64)}, {status:'revoked'}])
    await assert.rejects(assertGeminiQuotaAuthority(tx(payload({...record(),...change})),db,binding,at), {code:'GEMINI_QUOTA_AUTHORITY_STALE'});
});

test('cloud worker checks authority before grants, effects or any transaction writes', async () => {
  const database = {...db, runTransaction: work => work(tx(undefined))};
  // The suite runs under emulators. This fake cloud client must explicitly
  // remove those inherited endpoints, as a real cloud launcher requires.
  const cloudEnv = {...env, FIRESTORE_EMULATOR_HOST:undefined, FIREBASE_AUTH_EMULATOR_HOST:undefined,
    FIREBASE_STORAGE_EMULATOR_HOST:undefined, PUBSUB_EMULATOR_HOST:undefined};
  const worker = new RecentJobsWorker(database,'synthetic@example.test',{provider:'gemini',env:cloudEnv,now:()=>at,
    fetcher:()=>assert.fail('source effect'), extractor:()=>assert.fail('provider effect')});
  await assert.rejects(worker.run('synthetic_source'), {code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
  await assert.rejects(worker.holdModelForDay('synthetic_source','gemini-3.8-flash'), {code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
});
