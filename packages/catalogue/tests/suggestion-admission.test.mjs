import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SuggestionReceipts } from '../src/suggestion-receipts.mjs';
import { SuggestionAdmission } from '../src/suggestion-admission.mjs';

const start = '2026-10-16T12:00:00.000Z';
const urls = ['https://source.example/notice', 'https://source.example/other', 'https://source.example/third'];
const source = { id: 'test_source', revision: 1, name: 'Synthetic publisher', urls,
  permission: { reference: 'Synthetic test permission only', method: 'structured_json', reuse: 'Test only', reviewedAt: start },
  categories: ['bursary','learnership','apprenticeship','internship','graduate_programme','job'],
  owner: 'test_owner', paused: false, cadenceHours: 24, maxBytes: 500000 };
const policy = { intakeEnabled: true, maxWork: 3, maxReceipts: 8, createAttemptsPerHour: 50,
  statusReadsPerHour: 600, receiptTtlMs: 86400000 };
const collections = ['m0_sources','m0_suggestion_state','m0_suggestion_receipts','m0_suggestion_replays','m0_suggestion_work','m0_suggestion_limits'];
const random = () => randomBytes(32).toString('hex');
const json = value => ({ json: JSON.stringify(value) });
let app, db, receipts, service, now;
const row = async ref => JSON.parse((await ref.get()).data().json);
const rows = async name => (await db.collection(name).get()).docs.map(d => JSON.parse(d.data().json));
const serviceWith = overrides => new SuggestionAdmission(db, receipts, { ...policy, ...overrides });
const submit = (url = urls[0], key = random(), target = service) => target.admitReview({ url }, key);
const expectCode = (promise, code) => assert.rejects(promise, error => error.message === code && Object.keys(error).join(',') === 'code');
const statusCommand = result => ({ receiptId: result.access.receiptId, capability: result.access.capability });
before(() => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST ?? '', /^127\.0\.0\.1:[1-9]\d{3,4}$/);
  // Dedicated and standard catalogue runners are allowed; data stays in this fixed demo project.
  assert.match(process.env.GCLOUD_PROJECT ?? '', /^demo-skilved-(?:b03|admission|receipts)$/);
  app = initializeApp({ projectId: 'demo-skilved-admission' }, 'suggestion-admission-test');db = getFirestore(app);
  receipts = new SuggestionReceipts(db, { keyRing: { activeKeyId: 'test1', keys: [{ id: 'test1', secret: 'a1'.repeat(32) }] },
    maxTtlMs: 86400000, now: () => now });
});
beforeEach(async () => {
  // Destructive resets are limited to the guarded isolated demo project's six owned collections.
  for (const name of collections) {
    const docs = await db.collection(name).get(), batch = db.batch();
    for (const doc of docs.docs) batch.delete(doc.ref);
    if (docs.size) await batch.commit();
  }
  now = start;service = serviceWith({});
  await db.doc('m0_sources/test_source').set(json(source));
  await service.stateRef().set(json({ schemaVersion: 1, revision: 1, workCount: 0, receiptCount: 0 }));
});
after(async () => { await db?.terminate(); if (app) await deleteApp(app); });

test('missing/invalid policy stays unavailable with no default capacity or SDK calls', () => {
  for (const invalid of [undefined, {}, { ...policy, maxWork: 101 }, { ...policy, maxReceipts: 501 },
    { ...policy, createAttemptsPerHour: 51 }, { ...policy, statusReadsPerHour: 601 },
    { ...policy, receiptTtlMs: 86400001 }, { ...policy, extra: 'PRIVATE' }])
    assert.throws(() => new SuggestionAdmission({}, receipts, invalid), error => error.message === 'SUGGESTION_UNAVAILABLE');
});

test('same-key concurrent and response-loss retries create one receipt/work with immutable access', async () => {
  const key = random();
  const results = await Promise.all(Array.from({ length: 4 }, () => submit(urls[0], key)));
  for (const result of results) assert.deepEqual(result, results[0]);
  now = '2026-10-16T12:10:00.000Z';
  const restarted = serviceWith({});
  assert.deepEqual(await submit(urls[0], key, restarted), results[0]);
  assert.equal((await rows('m0_suggestion_receipts')).length, 1);
  assert.equal((await rows('m0_suggestion_replays')).length, 1);
  const works = await rows('m0_suggestion_work');assert.equal(works.length, 1);
  assert.equal(works[0].mode, 'review_only');assert.equal(works[0].state, 'pending');assert.equal(works[0].receiptCount, 1);
  assert.deepEqual(await row(service.stateRef()), { schemaVersion: 1, revision: 2, workCount: 1, receiptCount: 1 });
  assert.equal((await rows('m0_suggestion_limits'))[0].count, 5);
  await expectCode(submit(urls[1], key), 'SUGGESTION_CONFLICT');
});

test('distinct submitters share review-only work without sharing capabilities or leaking input', async () => {
  const a = await submit(), b = await submit();
  assert.notEqual(a.access.receiptId, b.access.receiptId);assert.notEqual(a.access.capability, b.access.capability);
  const works = await rows('m0_suggestion_work');assert.equal(works.length, 1);assert.equal(works[0].receiptCount, 2);
  assert.equal(works[0].sourceId, source.id);assert.equal(works[0].sourceRevision, 1);assert.match(works[0].permissionHash, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify([a,b]).includes(urls[0]));
  for (const name of ['m0_suggestion_state','m0_suggestion_limits','m0_suggestion_receipts','m0_suggestion_replays']) {
    const data = JSON.stringify(await rows(name));assert.ok(!data.includes(urls[0]));assert.ok(!data.includes(a.access.capability));
  }
});

test('source pause, unsupported URLs, malformed registry and document identity mismatch cannot enqueue', async () => {
  await expectCode(submit('https://unreviewed.example/notice'), 'SUGGESTION_UNSUPPORTED');
  await db.doc('m0_sources/test_source').set(json({ ...source, paused: true }));
  await expectCode(submit(), 'SUGGESTION_PAUSED');
  await db.doc('m0_sources/test_source').set(json({ ...source, id: 'forged_source' }));
  await expectCode(submit(), 'SUGGESTION_UNAVAILABLE');
  await db.doc('m0_sources/test_source').set({ json: 'PRIVATE_MALFORMED_SOURCE' });
  await expectCode(submit(), 'SUGGESTION_UNAVAILABLE');
  await db.doc('m0_sources/test_source').delete();
  await expectCode(submit(), 'SUGGESTION_UNAVAILABLE');
  assert.equal((await rows('m0_suggestion_work')).length, 0);assert.equal((await rows('m0_suggestion_receipts')).length, 0);
  assert.equal((await rows('m0_suggestion_limits'))[0].count, 5);
});

test('current source revision and permission drift block new references but authorized replay still recovers access', async () => {
  const key = random(), first = await submit(urls[0], key);
  for (const changed of [{ ...source, revision: 2 }, { ...source, permission: { ...source.permission, reuse: 'Changed permission' } }]) {
    await db.doc('m0_sources/test_source').set(json(changed));
    await expectCode(submit(), 'SUGGESTION_SOURCE_CHANGED');
    assert.deepEqual(await submit(urls[0], key), first);
  }
  await db.doc('m0_sources/test_source').set(json({ ...source, paused: true }));
  assert.deepEqual(await submit(urls[0], key), first);await expectCode(submit(), 'SUGGESTION_PAUSED');
  assert.equal((await rows('m0_suggestion_work'))[0].receiptCount, 1);
});

test('atomic work and receipt capacity cannot be exceeded; replay consumes no additional slot', async () => {
  const bounded = serviceWith({ maxWork: 1, maxReceipts: 2 });
  const key = random(), first = await submit(urls[0], key, bounded);
  await expectCode(submit(urls[1], random(), bounded), 'SUGGESTION_CAPACITY');
  const contested = await Promise.allSettled([submit(urls[0], random(), bounded), submit(urls[0], random(), bounded)]);
  assert.equal(contested.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(contested.filter(r => r.status === 'rejected' && r.reason.code === 'SUGGESTION_CAPACITY').length, 1);
  assert.deepEqual(await submit(urls[0], key, bounded), first);
  const state = await row(bounded.stateRef());assert.equal(state.workCount, 1);assert.equal(state.receiptCount, 2);
  assert.equal((await rows('m0_suggestion_work'))[0].receiptCount, 2);
});

test('missing/corrupt/drifted state fails closed instead of resetting capacity or creating orphans', async () => {
  for (const value of [null, { json: 'PRIVATE_CORRUPT' }, json({ schemaVersion: 1, revision: 1, receiptCount: 1, workCount: 0 })]) {
    if (value === null) await service.stateRef().delete();else await service.stateRef().set(value);
    await expectCode(submit(), 'SUGGESTION_UNAVAILABLE');
  }
  assert.equal((await rows('m0_suggestion_receipts')).length, 0);assert.equal((await rows('m0_suggestion_replays')).length, 0);
  await service.stateRef().set(json({ schemaVersion: 1, revision: 1, receiptCount: 0, workCount: 0 }));
  await submit();const work = (await db.collection('m0_suggestion_work').get()).docs[0];
  await work.ref.set(json({ ...JSON.parse(work.data().json), receiptCount: 2 }));
  await expectCode(submit(), 'SUGGESTION_UNAVAILABLE');
  assert.equal((await rows('m0_suggestion_receipts')).length, 1);
});

test('different URLs racing for the last work slot cannot exceed work capacity', async () => {
  const bounded = serviceWith({ maxWork: 1 });
  const results = await Promise.allSettled([submit(urls[0], random(), bounded), submit(urls[1], random(), bounded)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter(r => r.status === 'rejected' && r.reason.code === 'SUGGESTION_CAPACITY').length, 1);
  const state = await row(service.stateRef());assert.equal(state.workCount, 1);assert.equal(state.receiptCount, 1);
  assert.equal((await rows('m0_suggestion_work')).length, 1);assert.equal((await rows('m0_suggestion_receipts')).length, 1);
});

test('failure after queued receipt writes rolls back receipt, replay, work and capacity while keeping the attempt charge', async () => {
  await service.stateRef().set(json({ schemaVersion: 1, revision: Number.MAX_SAFE_INTEGER, receiptCount: 0, workCount: 0 }));
  await expectCode(submit(), 'SUGGESTION_UNAVAILABLE');
  for (const name of ['m0_suggestion_receipts','m0_suggestion_replays','m0_suggestion_work'])
    assert.equal((await rows(name)).length, 0);
  assert.equal((await row(service.stateRef())).revision, Number.MAX_SAFE_INTEGER);
  assert.equal((await rows('m0_suggestion_limits'))[0].count, 1);
});

test('failed and retried create calls consume committed attempt budget; rate counter survives rollback and rolls hourly', async () => {
  const bounded = serviceWith({ createAttemptsPerHour: 3 });const key = random();
  await expectCode(bounded.admitReview({ url: urls[0], email: 'PRIVATE_CONTACT' }, key), 'INVALID_COMMAND');
  const first = await submit(urls[0], key, bounded);assert.deepEqual(await submit(urls[0], key, bounded), first);
  await expectCode(submit(urls[0], key, bounded), 'SUGGESTION_RATE_LIMITED');
  assert.equal((await rows('m0_suggestion_limits'))[0].count, 3);
  now = '2026-10-16T13:00:00.000Z';assert.deepEqual(await submit(urls[0], key, bounded), first);
  const counters = await rows('m0_suggestion_limits');assert.equal(counters.length, 2);assert.equal(counters.find(c => c.windowStart.includes('13:00')).count, 1);
});

test('concurrent attempts cannot overdraw a budget even when all payloads fail validation', async () => {
  const bounded = serviceWith({ createAttemptsPerHour: 2 });
  const results = await Promise.allSettled(Array.from({ length: 4 }, () => bounded.admitReview({ private: 'PRIVATE' }, random())));
  assert.equal(results.filter(r => r.status === 'rejected' && r.reason.code === 'INVALID_COMMAND').length, 2);
  assert.equal(results.filter(r => r.status === 'rejected' && r.reason.code === 'SUGGESTION_RATE_LIMITED').length, 2);
  assert.equal((await rows('m0_suggestion_limits'))[0].count, 2);
});

test('status budget includes wrong credentials and works while new requests are disabled', async () => {
  const first = await submit(), bounded = serviceWith({ intakeEnabled: false, statusReadsPerHour: 2 });
  await expectCode(submit(urls[0], random(), bounded), 'SUGGESTION_UNAVAILABLE');
  await expectCode(bounded.status({ ...statusCommand(first), capability: random() }), 'SUGGESTION_NOT_FOUND');
  assert.equal((await bounded.status(statusCommand(first))).status, 'received');
  await expectCode(bounded.status(statusCommand(first)), 'SUGGESTION_RATE_LIMITED');
  const counters = await rows('m0_suggestion_limits');assert.equal(counters.find(c => c.kind === 'status').count, 2);
  assert.equal(counters.find(c => c.kind === 'create').count, 1);
});

test('malformed or mismatched counters remain untouched and unavailable', async () => {
  const ref = db.doc('m0_suggestion_limits/create_2026101612');
  for (const value of [{ json: 'PRIVATE_BAD_COUNTER' }, json({ schemaVersion: 1, kind: 'status', windowStart: start, count: 1 })]) {
    await ref.set(value);await expectCode(submit(), 'SUGGESTION_UNAVAILABLE');assert.deepEqual((await ref.get()).data(), value);
  }
});

test('expiry and revoked replay cannot enqueue again; physical slots remain conservatively retained', async () => {
  const key = random(), first = await submit(urls[0], key), ref = receipts.receiptRef(first.access.receiptId);
  const record = await row(ref);await ref.set(json({ ...record, status: 'withdrawn', revokedAt: start }));
  await expectCode(submit(urls[0], key), 'SUGGESTION_NOT_FOUND');
  now = first.access.expiresAt;
  await expectCode(submit(urls[0], key), 'SUGGESTION_NOT_FOUND');
  assert.equal((await row(service.stateRef())).receiptCount, 1);
  assert.equal((await rows('m0_suggestion_work'))[0].receiptCount, 1);
});
