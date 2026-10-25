import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { STAGING_MIGRATION_COLLECTIONS, stagingMigrationManifestHash,
  validateStagingMigrationManifest, importStagingMigration } from '../src/staging-migration.mjs';

const at = '2026-10-25T15:00:00.000Z', now = () => at;
const env = { SKILVED_CATALOGUE_MODE: 'cloud', SKILVED_CATALOGUE_PROJECT: 'skilved-staging' };
const hash = value => createHash('sha256').update(value).digest('hex');
const clone = value => JSON.parse(JSON.stringify(value));
const source = { id: 'fixture_source', revision: 2, name: 'Offline staging fixture',
  urls: ['https://recentjobs.co.za/category/apprenticeships/'],
  permission: { reference: 'Synthetic fixture permission', method: 'recentjobs_html',
    reuse: 'Private synthetic test only', reviewedAt: '2026-10-22T12:00:00.000Z' },
  categories: ['apprenticeship'], owner: 'test_fixture', paused: false, cadenceHours: 6, maxBytes: 500000,
  automation: { mode: 'shadow', employerCrawl: false, undatedNotices: 'shadow_recent_v2',
    qualificationRef: 'Synthetic fixture', maxArticles: 1, maxModelCallsPerDay: 12,
    minRequestIntervalMs: 3000, checkTtlHours: 6, issuers: [] } };
const scopeHash = 'a'.repeat(64), model = 'gemini-3.5-flash-lite', day = '2026-10-25';
const json = (id, record, extra = {}) => ({ id, data: { json: JSON.stringify(record), ...extra } });
function seal(manifest) { manifest.sha256 = stagingMigrationManifestHash(manifest); return manifest; }
function fixture() {
  const collections = Object.fromEntries(STAGING_MIGRATION_COLLECTIONS.map(name => [name, []]));
  collections.m0_sources = [json(source.id, source)];
  collections.m0_source_versions = [json(hash(`${source.id}:2`), source)];
  collections.m0_worker_jobs = [json('pending_job', { id: 'pending_job', sourceId: source.id, sourceRevision: 2,
    state: 'pending', modelWindow: { nextModel: 'gemini-3.6-flash' }, acquiredAt: '2026-10-23T12:00:00.000Z' })];
  collections.m0_model_budgets = [json(hash(`${source.id}:${day}`), { sourceId: source.id, date: day, calls: 12 })];
  collections.m0_model_usage = [json(hash(`${scopeHash}:${model}:${day}`), { scopeHash, provider: 'gemini', model,
    date: day, requests: 15, knownInputTokens: 250, knownTotalTokens: 500, unknownUsageCalls: 3, minute: [] })];
  collections.m0_model_calls = [json('spent_call', { sourceId: source.id, jobId: 'pending_job', at,
    provider: 'gemini', model, usage: null, state: 'failed' })];
  collections.m0_model_availability = [json(hash(`${scopeHash}:${model}`), { scopeHash, provider: 'gemini', model,
    until: '2026-10-26T07:00:00.000Z', reason: 'provider_daily_exhaustion' })];
  collections.m0_model_cache = [{ id: 'unchanged_cache', data: { json: '{ "literal" : "exact bytes" }', format: 'unchanged' } }];
  collections.m0_drafts = [json('expired_draft', { id: 'expired_draft', revision: 3, lifecycle: 'review',
    publication: { approved: false, previouslyPublic: false }, reviewExpiresAt: '2026-10-25T10:58:58.985Z' })];
  collections.m0_worker_assessments = [json('private_assessment', { reviewExpiresAt: '2026-10-25T17:40:20.326Z',
    publication: false, historicalEvidence: 'unchanged' })];
  return seal({ version: 1, scope: 'private_worker_history', targetProjectId: 'skilved-staging', createdAt: at,
    provenance: { pilotSha256: 'b'.repeat(64), quotaSha256: 'c'.repeat(64),
      pilotObservedAt: '2026-10-25T11:40:29.557Z', quotaExportedAt: '2026-10-25T11:40:29.601Z' },
    sourceBindings: [{ id: source.id, revision: 2, maxModelCallsPerDay: 12 }],
    quotaSummary: { scopeHash, requests: 15, knownTotalTokens: 500, unknownUsageCalls: 3 }, collections });
}
const options = manifest => ({ expectedSha256: manifest.sha256, env, now });

// The fake buffers every create and applies it only if the callback and commit
// succeed, matching the SDK transaction boundary without network credentials.
function database() {
  const data = new Map(), runs = []; let failCommit = false, beforeWrite;
  const ref = (name, id) => ({ name, id });
  const db = { projectId: 'skilved-staging', data, runs,
    collection(name) { return { doc: id => ref(name, id), orderBy: () => ({ limit: limit => ({ name, limit }) }),
      limit: limit => ({ name, limit }) }; },
    async runTransaction(work, opts = {}) {
      const pending = []; let writesStarted = false; const run = { readOnly: opts.readOnly === true, creates: 0 };
      runs.push(run);
      if (!run.readOnly && beforeWrite) await beforeWrite(db);
      const result = await work({
        async get(target) {
          assert.equal(writesStarted, false, 'all reads must precede writes');
          if (target.id !== undefined) { const value = data.get(`${target.name}/${target.id}`);
            return { exists: value !== undefined, data: () => clone(value) }; }
          const docs = [...data].filter(([key]) => key.startsWith(`${target.name}/`)).sort(([a], [b]) => a.localeCompare(b))
            .slice(0, target.limit).map(([key, value]) => ({ id: key.slice(target.name.length + 1), data: () => clone(value) }));
          return { docs, size: docs.length };
        },
        create(target, value) {
          assert.equal(run.readOnly, false); writesStarted = true; run.creates++;
          const key = `${target.name}/${target.id}`;
          if (data.has(key) || pending.some(([id]) => id === key)) throw new Error('ALREADY_EXISTS');
          pending.push([key, clone(value)]);
        },
      });
      if (failCommit && pending.length) throw new Error('SIMULATED_COMMIT_FAILURE');
      for (const [key, value] of pending) data.set(key, value);
      return result;
    },
    failCommit: () => { failCommit = true; }, beforeWrite: work => { beforeWrite = work; },
  };
  return db;
}

test('reviewed inactive migration preserves every ID, raw field, expiry, quota and pending window atomically', async () => {
  const manifest = fixture(), original = clone(manifest), db = database();
  db.data.set('m0_staging_checks/connection_marker', { checked: true });
  const result = await importStagingMigration(db, manifest, options(manifest));
  assert.equal(result.status, 'imported'); assert.equal(result.documentCount, 10);
  assert.deepEqual(db.runs, [{ readOnly: true, creates: 0 }, { readOnly: false, creates: 11 }]);
  for (const [name, rows] of Object.entries(manifest.collections)) for (const row of rows)
    assert.deepEqual(db.data.get(`${name}/${row.id}`), row.data);
  assert.equal(JSON.parse(db.data.get(`m0_source_versions/${hash(`${source.id}:2`)}`).json).id, source.id);
  const receipt = JSON.parse(db.data.get(`m0_staging_imports/${manifest.sha256}`).json);
  assert.equal(receipt.authorityCreated, false); assert.equal(receipt.publication, false);
  assert.equal(receipt.operationalState, 'inactive_replica'); assert.equal(receipt.representation, 'legacy_semantic_reconstruction');
  assert.deepEqual(receipt.quotaSummary, manifest.quotaSummary);
  assert.equal(receipt.collectionCounts.m0_worker_holds, 0); assert.deepEqual(manifest, original);
  assert.deepEqual(db.data.get('m0_staging_checks/connection_marker'), { checked: true });
  assert.equal(db.data.has('m0_workers/pending_job'), false); assert.equal(db.data.has('m0_worker_queue/pending_job'), false);
});

test('an exact replay verifies receipt and all targets using one read-only transaction', async () => {
  const manifest = fixture(), db = database(); await importStagingMigration(db, manifest, options(manifest));
  const before = clone([...db.data]); db.runs.length = 0;
  const result = await importStagingMigration(db, manifest, options(manifest));
  assert.equal(result.status, 'verified'); assert.equal(result.importedAt, at);
  assert.deepEqual(db.runs, [{ readOnly: true, creates: 0 }]); assert.deepEqual([...db.data], before);
});

test('partial historical source version coverage remains explicit rather than being invented', () => {
  const manifest = fixture(); manifest.collections.m0_source_versions = []; seal(manifest);
  const result = validateStagingMigrationManifest(manifest, options(manifest));
  assert.equal(result.collectionCounts.m0_source_versions, 0);
  assert.equal(result.documentCount, 9);
});

test('failed commit cannot leave imported documents or receipt behind', async () => {
  const manifest = fixture(), db = database(); db.failCommit();
  await assert.rejects(importStagingMigration(db, manifest, options(manifest)), /SIMULATED_COMMIT_FAILURE/);
  assert.equal(db.data.size, 0); assert.equal(db.runs.at(-1).creates, 11);
});

test('partial targets, extra history, changed data, forged receipts and post-review conflicts fail without writes', async () => {
  const manifest = fixture();
  for (const prepare of [
    db => db.data.set(`m0_sources/${source.id}`, manifest.collections.m0_sources[0].data),
    db => db.data.set('m0_audit/unrelated', { json: '{}' }),
    db => db.data.set(`m0_staging_imports/${manifest.sha256}`, { json: '{}' }),
    db => db.data.set('m0_staging_imports/other_manifest', { json: '{}' }),
  ]) {
    const db = database(); prepare(db); const before = clone([...db.data]);
    await assert.rejects(importStagingMigration(db, manifest, options(manifest)), /STAGING_MIGRATION_TARGET_CONFLICT/);
    assert.deepEqual([...db.data], before); assert.ok(db.runs.every(run => run.creates === 0));
  }
  const db = database(); await importStagingMigration(db, manifest, options(manifest)); db.runs.length = 0;
  db.data.set('m0_model_cache/unchanged_cache', { json: '{"literal":"exact bytes"}', format: 'unchanged' });
  await assert.rejects(importStagingMigration(db, manifest, options(manifest)), /STAGING_MIGRATION_TARGET_CONFLICT/);
  assert.ok(db.runs.every(run => run.creates === 0));
  const race = database(); race.beforeWrite(target => target.data.set('m0_audit/racing_record', { json: '{}' }));
  await assert.rejects(importStagingMigration(race, manifest, options(manifest)), /STAGING_MIGRATION_TARGET_CONFLICT/);
  assert.equal(race.data.size, 1); assert.ok(race.runs.every(run => run.creates === 0));
});

test('cloud project and emulator guards run before any database access', async () => {
  const manifest = fixture();
  for (const unsafe of [{}, { ...env, SKILVED_CATALOGUE_PROJECT: 'skilved-dev' },
    { ...env, SKILVED_CATALOGUE_MODE: 'emulator' }, { ...env, FIRESTORE_EMULATOR_HOST: '127.0.0.1:18080' },
    { ...env, FIREBASE_AUTH_EMULATOR_HOST: '' }]) {
    const db = database(); await assert.rejects(importStagingMigration(db, manifest, { ...options(manifest), env: unsafe }), /UNSAFE_CONFIGURATION/);
    assert.equal(db.runs.length, 0);
  }
  const db = database(); db.projectId = 'skilved-production';
  await assert.rejects(importStagingMigration(db, manifest, options(manifest)), /UNSAFE_CONFIGURATION/);
  assert.equal(db.runs.length, 0);
});

test('operational authority, queues, leases, scheduler state and public data block even a valid manifest', async () => {
  const manifest = fixture();
  for (const name of ['workers', 'worker_queue', 'worker_leases', 'worker_watches', 'public', 'operators', 'model_authorities']) {
    const db = database(); db.data.set(`m0_${name}/existing`, { active: true });
    await assert.rejects(importStagingMigration(db, manifest, options(manifest)), /STAGING_MIGRATION_AUTHORITY_PRESENT/);
    assert.equal(db.data.size, 1); assert.ok(db.runs.every(run => run.creates === 0));
  }
});

test('manifest requires independent review hash and every allowed collection, rejecting privileged or unknown collections', () => {
  const manifest = fixture();
  assert.throws(() => validateStagingMigrationManifest(manifest, { now }), /STAGING_MIGRATION_REVIEW_REQUIRED/);
  assert.throws(() => validateStagingMigrationManifest(manifest, { ...options(manifest), expectedSha256: 'd'.repeat(64) }), /HASH_MISMATCH/);
  const changed = clone(manifest); changed.collections.m0_model_cache[0].data.json = '{}';
  assert.throws(() => validateStagingMigrationManifest(changed, options(manifest)), /HASH_MISMATCH/);
  for (const name of ['m0_workers', 'm0_worker_queue', 'm0_public', 'm0_operators', 'm0_unknown']) {
    const bad = fixture(); bad.collections[name] = []; seal(bad);
    assert.throws(() => validateStagingMigrationManifest(bad, options(bad)), /COLLECTION_INVALID/);
  }
  const missing = fixture(); delete missing.collections.m0_worker_holds; seal(missing);
  assert.throws(() => validateStagingMigrationManifest(missing, options(missing)), /COLLECTION_INVALID/);
});

test('duplicate IDs, path IDs, invalid JSON, unsupported values and transaction limits reject before connecting', () => {
  const mutations = [
    m => m.collections.m0_audit.push(json('duplicate', {}), json('duplicate', {})),
    m => m.collections.m0_audit.push(json('../escape', {})),
    m => m.collections.m0_audit.push({ id: 'broken', data: { json: '{' } }),
    m => m.collections.m0_audit.push({ id: 'array', data: { json: '[]' } }),
    m => m.collections.m0_audit.push({ id: 'nonfinite', data: { json: '{"value":1e400}' } }),
    m => { m.collections.m0_audit = Array.from({ length: 451 }, (_, i) => json(`audit_${i}`, {})); },
    m => m.collections.m0_audit.push(json('too_large', { text: 'x'.repeat(8 * 1024 * 1024) })),
  ];
  for (const mutate of mutations) {
    const manifest = fixture(); mutate(manifest); seal(manifest);
    assert.throws(() => validateStagingMigrationManifest(manifest, options(manifest)), /STAGING_MIGRATION_(?:DATA|JSON|LIMIT)/);
  }
  const unsupported = fixture(); unsupported.collections.m0_audit.push({ id: 'date', data: { json: '{}', at: new Date(at) } });
  assert.throws(() => stagingMigrationManifestHash(unsupported), /DATA_INVALID/);
});

test('stale, future, reversed or ambiguous provenance metadata rejects', () => {
  for (const mutate of [m => { m.createdAt = '2026-10-26T15:00:00.000Z'; },
    m => { m.createdAt = '2026-10-23T15:00:00.000Z'; },
    m => { m.provenance.quotaExportedAt = '2026-10-25T11:00:00.000Z'; },
    m => { m.provenance.pilotObservedAt = '2026-10-20T11:00:00.000Z'; },
    m => { m.provenance.pilotObservedAt = '2026-10-25'; },
    m => { m.provenance.unreviewed = true; }]) {
    const manifest = fixture(); mutate(manifest); seal(manifest);
    assert.throws(() => validateStagingMigrationManifest(manifest, options(manifest)), /METADATA_INVALID/);
  }
});

test('source identities, revisions, version document IDs and reviewed caps cannot be changed independently', () => {
  for (const mutate of [m => { m.sourceBindings[0].revision = 3; },
    m => { m.sourceBindings[0].maxModelCallsPerDay = 100; },
    m => { m.collections.m0_source_versions[0].id = source.id; },
    m => { m.collections.m0_sources[0].data.json = JSON.stringify({ ...source, revision: 3 }); },
    m => { const s = clone(source); s.automation.mode = 'automatic'; m.collections.m0_sources[0].data.json = JSON.stringify(s); },
    m => { const s = clone(source); s.automation.employerCrawl = true; m.collections.m0_sources[0].data.json = JSON.stringify(s); },
    m => { m.collections.m0_worker_jobs[0].data.json = JSON.stringify({ sourceId: 'unknown_source', sourceRevision: 1 }); },
    m => { m.collections.m0_worker_jobs[0].data.json = JSON.stringify({ sourceId: source.id, sourceRevision: 3 }); }]) {
    const manifest = fixture(); mutate(manifest); seal(manifest);
    assert.throws(() => validateStagingMigrationManifest(manifest, options(manifest)), /SOURCE_INVALID/);
  }
});

test('spent budgets and quota ledger cannot be reset or reconstructed from fewer call receipts', () => {
  const original = fixture(); assert.equal(validateStagingMigrationManifest(original, options(original)).documentCount, 10);
  for (const mutate of [m => { const r = JSON.parse(m.collections.m0_model_budgets[0].data.json); r.calls = 0;
      m.collections.m0_model_budgets[0].data.json = JSON.stringify(r); },
    m => { m.collections.m0_model_budgets[0].id = 'wrong_budget_identity'; },
    m => { m.quotaSummary.requests = 1; },
    m => { m.quotaSummary.knownTotalTokens = 0; },
    m => { m.quotaSummary.unknownUsageCalls = 0; },
    m => { m.collections.m0_model_usage = []; },
    m => { m.collections.m0_model_usage[0].id = 'wrong_quota_identity'; },
    m => { const r = JSON.parse(m.collections.m0_model_usage[0].data.json); r.scopeHash = 'd'.repeat(64);
      m.collections.m0_model_usage[0].data.json = JSON.stringify(r); },
    m => { const r = JSON.parse(m.collections.m0_model_usage[0].data.json);
      r.minute = [{ id: 'same_request', at: m.provenance.quotaExportedAt, inputTokens: null },
        { id: 'same_request', at: m.provenance.quotaExportedAt, inputTokens: 3 }];
      m.collections.m0_model_usage[0].data.json = JSON.stringify(r); },
    m => { const r = JSON.parse(m.collections.m0_model_usage[0].data.json);
      r.minute = [{ id: 'request', at: 'invalid', inputTokens: null }];
      m.collections.m0_model_usage[0].data.json = JSON.stringify(r); }]) {
    const manifest = fixture(); mutate(manifest); seal(manifest);
    assert.throws(() => validateStagingMigrationManifest(manifest, options(manifest)), /(?:BUDGET|QUOTA)_INVALID/);
  }
});

test('published or formerly public drafts cannot enter the inactive private replica', () => {
  for (const mutate of [r => { r.publication.approved = true; }, r => { r.publication.previouslyPublic = true; },
    r => { r.lifecycle = 'published'; }]) {
    const manifest = fixture(), row = manifest.collections.m0_drafts[0], record = JSON.parse(row.data.json);
    mutate(record); row.data.json = JSON.stringify(record); seal(manifest);
    assert.throws(() => validateStagingMigrationManifest(manifest, options(manifest)), /PUBLICATION_FORBIDDEN/);
  }
});
