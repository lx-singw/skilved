import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, stat, unlink } from 'node:fs/promises';
import { getRuntime } from '../src/runtime.mjs';
import { captureShadowCheckpoint, shadowCheckpointCounts } from '../src/shadow-checkpoint.mjs';

const projectId = 'demo-skilved-checkpoint', now = '2026-10-25T12:00:00.000Z';
const env = { SKILVED_CATALOGUE_MODE: 'emulator', SKILVED_CATALOGUE_PROJECT: projectId,
  FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
  FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST };
const json = value => ({ json: JSON.stringify(value) });
const source = { id: 'source_fixture', revision: 2, automation: { mode: 'shadow', maxModelCallsPerDay: 12 } };
const fixture = {
  sources: ['source_fixture', json(source)],
  source_versions: ['version_document_hash', json(source)],
  worker_notice_origins: ['origin_hash', json({ firstSeenAt: '2026-10-22T15:03:03.266Z' })],
  worker_origin_imports: ['receipt_hash', json({ originKeys: ['origin_hash'], sourceRevision: 2 })],
  worker_assessments: ['assessment_hash', json({ reviewExpiresAt: '2026-10-25T17:40:20.326Z', publication: false })],
  worker_jobs: ['pending_hash', json({ id: 'pending_hash', state: 'pending', modelWindow: { nextModel: 'gemini-3.6-flash' } })],
  worker_holds: ['hold_hash', json({ reason: 'UNDATED_ORIGIN_IMPORT_REQUIRED' })],
  worker_queue: ['pending_hash', { sourceId: source.id }],
  worker_leases: [source.id, json({ lease: null, until: null })],
  workers: ['worker_hash', { principal: 'synthetic@example.test', active: true, roles: ['ingest'] }],
  model_budgets: ['budget_hash', json({ sourceId: source.id, date: '2026-10-25', calls: 12 })],
  model_usage: ['usage_hash', json({ requests: 12, knownTotalTokens: 500, unknownUsageCalls: 2 })],
  model_availability: ['availability_hash', json({ dailyResetAt: '2026-10-26T07:00:00.000Z' })],
  model_calls: ['spent_hash', json({ usage: null })],
  model_cache: ['cache_hash', { json: '{ "unchanged" : true }', format: 'preserved_raw_field' }],
  drafts: ['draft_hash', json({ id: 'draft_hash', revision: 3, reviewExpiresAt: '2026-10-25T10:58:58.985Z' })],
  audit: ['audit_hash', json({ actorType: 'worker', action: 'synthetic' })],
  future_collection: ['future_hash', { id: 'embedded_payload_id', retained: [null, false, 1, 'exact'] }],
};
let runtime;
before(async () => {
  Object.assign(process.env, env); runtime = await getRuntime();
  for (const [name, [id, data]] of Object.entries(fixture)) await runtime.db.collection('m0_' + name).doc(id).set(data);
  await runtime.db.collection('outside_scope').doc('ignored').set({ private: 'other namespace' });
});
after(async () => { await runtime?.db.terminate(); });
const capture = options => captureShadowCheckpoint(runtime.db, { env, now: () => now, ...options });

test('one read-only checkpoint retains all m0 history with raw fields and distinct document IDs', async () => {
  const checkpoint = await capture();
  assert.equal(checkpoint.version, 1); assert.equal(checkpoint.projectId, projectId);
  assert.equal(checkpoint.consistency, 'read_only_transaction'); assert.equal(checkpoint.capturedAt, now);
  assert.deepEqual(Object.keys(checkpoint.collections), Object.keys(fixture).map(n => 'm0_' + n).sort());
  for (const [name, [id, data]] of Object.entries(fixture)) {
    assert.deepEqual(checkpoint.collections['m0_' + name], [{ id, data }]);
    assert.deepEqual((await runtime.db.collection('m0_' + name).doc(id).get()).data(), data);
  }
  assert.equal(checkpoint.collections.m0_source_versions[0].id, 'version_document_hash');
  assert.equal(JSON.parse(checkpoint.collections.m0_source_versions[0].data.json).id, 'source_fixture');
  assert.equal(checkpoint.collections.m0_future_collection[0].id, 'future_hash');
  assert.equal(checkpoint.collections.m0_future_collection[0].data.id, 'embedded_payload_id');
  assert.equal(checkpoint.collections.m0_model_cache[0].data.json, '{ "unchanged" : true }');
  assert.equal(shadowCheckpointCounts(checkpoint).m0_model_budgets, 1);
  const { sha256, ...body } = JSON.parse(JSON.stringify(checkpoint));
  assert.equal(sha256, createHash('sha256').update(JSON.stringify(body)).digest('hex'));
});

test('capture refuses disabled, cloud, production, remote or mismatched projects before reading the database', async () => {
  const forbidden = { projectId, listCollections: () => { assert.fail('must guard before DB access'); } };
  for (const bad of [{}, { ...env, SKILVED_CATALOGUE_MODE: 'cloud', SKILVED_CATALOGUE_PROJECT: 'live-project' },
    { ...env, NODE_ENV: 'production' }, { ...env, FIRESTORE_EMULATOR_HOST: 'remote.example:8080' },
    { ...env, SKILVED_CATALOGUE_PROJECT: 'demo-other-project' }])
    await assert.rejects(captureShadowCheckpoint(forbidden, { env: bad }), /UNSAFE_CONFIGURATION/);
});

test('document, collection and byte limits reject the entire checkpoint without truncation', async () => {
  for (const options of [{ maxDocuments: 1 }, { maxCollections: 1 }, { maxBytes: 100 }])
    await assert.rejects(capture(options), /SHADOW_CHECKPOINT_LIMIT/);
  for (const options of [{ maxDocuments: 0 }, { maxBytes: Infinity }, { maxCollections: 65 }, { unexpected: 1 }])
    await assert.rejects(capture(options), /SHADOW_CHECKPOINT_LIMIT_INVALID/);
  assert.equal((await capture()).collections.m0_model_budgets[0].data.json, fixture.model_budgets[1].json);
});

test('Firestore-specific types reject instead of being silently converted to JSON', async () => {
  const ref = runtime.db.collection('m0_unsupported_type').doc('timestamp');
  try {
    await ref.set({ at: new Date(now) });
    await assert.rejects(capture(), /SHADOW_CHECKPOINT_DATA_UNSUPPORTED/);
  } finally { await ref.delete(); }
});

test('new collection membership during capture is rejected and transactions are read-only', async () => {
  let calls = 0, readOnly = false;
  const db = { projectId, listCollections: async () => ++calls === 1 ? [] : [{ id: 'm0_new_collection' }],
    runTransaction: async (fn, options) => { readOnly = options.readOnly; return fn({}); } };
  await assert.rejects(captureShadowCheckpoint(db, { env }), /SHADOW_CHECKPOINT_COLLECTIONS_CHANGED/);
  assert.equal(readOnly, true);
});

const run = (args, childEnv = {}) => spawnSync(process.execPath, ['tools/export-shadow-checkpoint.mjs', ...args], {
  cwd: new URL('..', import.meta.url), env: childEnv, encoding: 'utf8', timeout: 20000,
});
test('export CLI help needs no credentials and unsafe or invalid invocations cannot connect', () => {
  const help = run(['--help']); assert.equal(help.status, 0); assert.match(help.stdout, /read-only transaction/);
  assert.match(help.stdout, /not an Auth backup/);
  for (const bad of [{}, { ...env, FIREBASE_AUTH_EMULATOR_HOST: 'remote.example:9099' }]) {
    const result = run([], bad); assert.equal(result.status, 1);
    assert.deepEqual(JSON.parse(result.stderr), { error: 'UNSAFE_CONFIGURATION' });
  }
  const invalid = run(['--restore']); assert.equal(invalid.status, 1);
  assert.deepEqual(JSON.parse(invalid.stderr), { error: 'INVALID_COMMAND' });
});

test('export CLI produces a private versioned file without source or AI configuration', async () => {
  const result = run([], env); assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.match(output.report, /\/\.artifacts\/shadow\/[^/]+\.json$/);
  try {
    const report = JSON.parse(await readFile(output.report, 'utf8'));
    assert.equal(report.mode, 'local_emulator_checkpoint'); assert.equal(report.checkpoint.version, 1);
    assert.equal(report.checkpoint.sha256, output.sha256);
    assert.deepEqual(report.checkpoint.collections.m0_model_budgets, [{ id: fixture.model_budgets[0], data: fixture.model_budgets[1] }]);
    assert.equal((await stat(output.report)).mode & 0o777, 0o600);
    assert.doesNotMatch(result.stdout, /synthetic@example|embedded_payload_id|preserved_raw_field/);
  } finally { await unlink(output.report); }
});
