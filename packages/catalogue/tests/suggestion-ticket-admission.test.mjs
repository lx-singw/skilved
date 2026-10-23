import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { projectOpportunity } from '@skilved/types/opportunities/internal';
import { makeRecord } from '../../types/tests/fixtures/opportunities.mjs';
import { SuggestionReceipts } from '../src/suggestion-receipts.mjs';
import { SuggestionAdmission } from '../src/suggestion-admission.mjs';
import { SuggestionReplayTickets } from '../src/suggestion-replay-tickets.mjs';

const start = '2026-10-16T12:00:00.000Z', url = 'https://source.example/notice', other = 'https://source.example/other';
const source = { id: 'test_source', revision: 1, name: 'Synthetic source', urls: [url, other],
  permission: { reference: 'Synthetic permission only', method: 'structured_json', reuse: 'Test only', reviewedAt: start },
  categories: ['bursary','learnership','apprenticeship','internship','graduate_programme','job'],
  owner: 'test_owner', paused: false, cadenceHours: 24, maxBytes: 500000 };
const policy = { intakeEnabled: true, maxWork: 3, maxReceipts: 8, createAttemptsPerHour: 50,
  statusReadsPerHour: 600, receiptTtlMs: 86400000 };
const collections = ['m0_sources','m0_suggestion_state','m0_suggestion_receipts','m0_suggestion_replays',
  'm0_suggestion_public_replays','m0_suggestion_work','m0_suggestion_limits','m0_public','m0_drafts','m0_snapshots','m0_aliases'];
let app, db, now, receipts, tickets, service;
const json = value => ({ json: JSON.stringify(value) });
const row = async ref => JSON.parse((await ref.get()).data().json);
const rows = async name => (await db.collection(name).get()).docs.map(doc => JSON.parse(doc.data().json));
const at = delta => new Date(Date.parse(start) + delta).toISOString();
const signer = overrides => new SuggestionReplayTickets({ epoch: '11'.repeat(32), secret: '22'.repeat(32),
  notBefore: start, ttlMs: 60000, now: () => now, ...overrides });
const admission = (overrides = {}, replayTickets = tickets, target = db) =>
  new SuggestionAdmission(target, receipts, { ...policy, ...overrides }, { replayTickets });
const access = result => ({ receiptId: result.access.receiptId, capability: result.access.capability });
const expectCode = (promise, code) => assert.rejects(promise, error => error.message === code && Object.keys(error).join(',') === 'code');
const create = (ticket, target = service, inputUrl = url) => target.create({ url: inputUrl }, ticket);
async function publish() {
  const record = makeRecord('apprenticeship'); record.id = 'approved_A'; record.citations[0].url = url;
  await db.doc('m0_drafts/approved_A').set(json(record));
  await db.doc('m0_public/approved_A').set(json(projectOpportunity(record)));
  await db.doc('m0_snapshots/snapshot_fixture_1').set(json({ id: 'snapshot_fixture_1', sourceId: source.id,
    sourceRevision: 1, url, retrievedAt: start, hash: 'a'.repeat(64), text: 'Synthetic fixture only' }));
}
before(() => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST ?? '', /^127\.0\.0\.1:[1-9]\d{3,4}$/);
  assert.equal(process.env.GCLOUD_PROJECT, 'demo-skilved-b03');
  app = initializeApp({ projectId: 'demo-skilved-ticket-admission' }, 'suggestion-ticket-admission'); db = getFirestore(app);
  receipts = new SuggestionReceipts(db, { keyRing: { activeKeyId: 'test1', keys: [{ id: 'test1', secret: 'a1'.repeat(32) }] },
    maxTtlMs: 86400000, now: () => now });
});
beforeEach(async () => {
  // Only these named collections in the fixed isolated emulator project are reset.
  for (const name of collections) {
    const docs = await db.collection(name).get(), batch = db.batch();
    for (const doc of docs.docs) batch.delete(doc.ref);
    if (docs.size) await batch.commit();
  }
  now = start; tickets = signer(); service = admission();
  await db.doc('m0_sources/test_source').set(json(source));
  await service.stateRef().set(json({ schemaVersion: 1, revision: 1, workCount: 0, receiptCount: 0 }));
});
after(async () => { await db?.terminate(); if (app) await deleteApp(app); });

test('ticket configuration is explicit, rejects duck types and stays unavailable without intake', async () => {
  for (const options of [null, {}, { replayTickets: {} }, { replayTickets: tickets, fallback: true }])
    assert.throws(() => new SuggestionAdmission({}, receipts, policy, options), error => error.code === 'SUGGESTION_UNAVAILABLE');
  await expectCode(new SuggestionAdmission(db, receipts, policy).issueTicket({ url }), 'SUGGESTION_UNAVAILABLE');
  await expectCode(admission({ intakeEnabled: false }).issueTicket({ url }), 'SUGGESTION_UNAVAILABLE');
  assert.equal((await rows('m0_suggestion_limits')).length, 0);
});

test('issuance rechecks source policy and charges failures without allocating private work', async () => {
  const a = await service.issueTicket({ url }), b = await service.issueTicket({ url });
  assert.notEqual(a.ticket, b.ticket);
  await expectCode(service.issueTicket({ url, email: 'PRIVATE' }), 'INVALID_COMMAND');
  await expectCode(service.issueTicket({ url: 'https://unreviewed.example/notice' }), 'SUGGESTION_UNSUPPORTED');
  await db.doc('m0_sources/test_source').set(json({ ...source, paused: true }));
  await expectCode(service.issueTicket({ url }), 'SUGGESTION_PAUSED');
  for (const name of ['m0_suggestion_receipts','m0_suggestion_replays','m0_suggestion_public_replays','m0_suggestion_work'])
    assert.equal((await rows(name)).length, 0);
  assert.equal((await row(service.stateRef())).revision, 1);
  assert.equal((await rows('m0_suggestion_limits'))[0].count, 5);
});

test('issuance and submission share a committed attempt budget', async () => {
  const bounded = admission({ createAttemptsPerHour: 2 });
  await expectCode(bounded.issueTicket({ private: 'PRIVATE' }), 'INVALID_COMMAND');
  const issued = await bounded.issueTicket({ url });
  await expectCode(create(issued.ticket, bounded), 'SUGGESTION_RATE_LIMITED');
  assert.equal((await rows('m0_suggestion_limits'))[0].count, 2);
  assert.equal((await rows('m0_suggestion_receipts')).length, 0);
});

test('concurrent and restarted retries keep separate submitters and private immutable access', async () => {
  const a = await service.issueTicket({ url }), b = await service.issueTicket({ url });
  const results = await Promise.all(Array.from({ length: 4 }, () => create(a.ticket)));
  for (const result of results) assert.deepEqual(result, results[0]);
  const second = await create(b.ticket); assert.notDeepEqual(access(second), access(results[0]));
  const restarted = admission({ maxReceipts: 2 });
  await db.doc('m0_sources/test_source').set(json({ ...source, paused: true }));
  now = at(10000); assert.deepEqual(await create(a.ticket, restarted), results[0]);
  const work = (await rows('m0_suggestion_work'))[0]; assert.equal(work.receiptCount, 2); assert.equal(work.referenceCount, 2);
  for (const name of ['m0_suggestion_limits','m0_suggestion_replays','m0_suggestion_receipts','m0_suggestion_state']) {
    const text = JSON.stringify(await rows(name));
    for (const value of [url, a.ticket, b.ticket, results[0].access.capability, '22'.repeat(32)]) assert.equal(text.includes(value), false);
  }
});

test('delayed first submission clamps receipt and mapping to the original ticket deadline', async () => {
  const issued = await service.issueTicket({ url }); now = at(10000);
  const result = await create(issued.ticket); assert.equal(result.access.expiresAt, issued.expiresAt);
  const key = tickets.verify({ url, ticket: issued.ticket }).replayKey;
  const mapping = await row(receipts.replayRef(key));
  assert.equal(mapping.expiresAt, issued.expiresAt); assert.equal(mapping.retainUntil, issued.expiresAt);
  now = at(20000); assert.deepEqual(await create(issued.ticket), result);
  assert.deepEqual(await row(receipts.replayRef(key)), mapping);
});

test('a shorter receipt lifetime retains replay denial until the longer ticket window ends', async () => {
  const bounded = admission({ receiptTtlMs: 1000 }), issued = await bounded.issueTicket({ url });
  const key = tickets.verify({ url, ticket: issued.ticket }).replayKey, result = await create(issued.ticket, bounded);
  assert.equal(result.access.expiresAt, at(1000));
  const mapping = await row(receipts.replayRef(key)); assert.equal(mapping.retainUntil, at(60000));
  now = at(1000); await expectCode(create(issued.ticket, bounded), 'SUGGESTION_NOT_FOUND');
  assert.deepEqual(await row(receipts.replayRef(key)), mapping);
  assert.equal((await row(bounded.stateRef())).receiptCount, 1);
});

test('expired tickets cannot become fresh requests after fixture-only removal of all private history', async () => {
  const issued = await service.issueTicket({ url }); await create(issued.ticket); now = issued.expiresAt;
  // Synthetic deletion is not a production cleanup implementation or restore observation.
  for (const name of ['m0_suggestion_receipts','m0_suggestion_replays','m0_suggestion_work']) {
    const docs = await db.collection(name).get(), batch = db.batch();
    for (const doc of docs.docs) batch.delete(doc.ref); if (docs.size) await batch.commit();
  }
  await service.stateRef().set(json({ schemaVersion: 1, revision: 1, receiptCount: 0, workCount: 0 }));
  await expectCode(create(issued.ticket), 'SUGGESTION_NOT_FOUND');
  assert.equal((await rows('m0_suggestion_receipts')).length, 0);
  const fresh = await service.issueTicket({ url }); assert.equal((await create(fresh.ticket)).kind, 'received');
});

test('wrong URL, raw digest, legacy key, retired epoch and paused source never enqueue', async () => {
  const issued = await service.issueTicket({ url }), digest = tickets.verify({ url, ticket: issued.ticket }).replayKey;
  await expectCode(create(issued.ticket, service, other), 'SUGGESTION_NOT_FOUND');
  for (const key of [digest, 'ab'.repeat(32), 'PRIVATE']) await expectCode(create(key), 'SUGGESTION_NOT_FOUND');
  await expectCode(service.admitReview({ url }, digest), 'SUGGESTION_NOT_FOUND');
  await expectCode(create(issued.ticket, admission({}, signer({ epoch: '44'.repeat(32) }))), 'SUGGESTION_NOT_FOUND');
  await db.doc('m0_sources/test_source').set(json({ ...source, paused: true }));
  await expectCode(create(issued.ticket), 'SUGGESTION_PAUSED');
  assert.equal((await rows('m0_suggestion_receipts')).length, 0);
});

test('approved-result replay has immutable expiry and retention without leaking IDs into the binding', async () => {
  await publish(); const bounded = admission({ receiptTtlMs: 1000 }), issued = await bounded.issueTicket({ url });
  const key = tickets.verify({ url, ticket: issued.ticket }).replayKey;
  assert.deepEqual(await create(issued.ticket, bounded), { kind: 'approved', publicResultIds: ['approved_A'] });
  const ref = bounded.publicReplayRef(key), mapping = await row(ref);
  assert.equal(mapping.expiresAt, at(1000)); assert.equal(mapping.retainUntil, at(60000));
  assert.equal(JSON.stringify(mapping).includes('approved_A'), false);
  now = at(500); await db.doc('m0_public/approved_A').delete();
  assert.deepEqual(await create(issued.ticket, bounded), { kind: 'previous_result_unavailable' });
  now = at(1000); await expectCode(create(issued.ticket, bounded), 'SUGGESTION_NOT_FOUND');
  assert.deepEqual(await row(ref), mapping);
  for (const name of ['m0_suggestion_receipts','m0_suggestion_work']) assert.equal((await rows(name)).length, 0);
});

test('withdrawn replay remains denied while another ticket keeps its shared work', async () => {
  const a = await service.issueTicket({ url }), b = await service.issueTicket({ url });
  const first = await create(a.ticket), second = await create(b.ticket);
  const key = tickets.verify({ url, ticket: a.ticket }).replayKey, mapping = await row(receipts.replayRef(key));
  await service.withdraw(access(first)); await expectCode(create(a.ticket), 'SUGGESTION_NOT_FOUND');
  assert.equal((await service.status(access(second))).status, 'received');
  const work = (await rows('m0_suggestion_work'))[0]; assert.equal(work.referenceCount, 1); assert.equal(work.state, 'pending');
  assert.deepEqual(await row(receipts.replayRef(key)), mapping);
});

test('an injected ABORTED retry revalidates expiry and rolls back queued writes', async () => {
  const issued = tickets.issue({ url }); let calls = 0, attempts = 0;
  const proxy = new Proxy(db, { get(target, name) {
    if (name === 'runTransaction') return callback => {
      const call = ++calls;
      return target.runTransaction(async tx => {
        if (call === 2) attempts++;
        const result = await callback(tx);
        if (call === 2 && attempts === 1) { now = issued.expiresAt; throw Object.assign(new Error('Synthetic ABORTED'), { code: 10 }); }
        return result;
      });
    };
    const value = Reflect.get(target, name); return typeof value === 'function' ? value.bind(target) : value;
  } });
  await expectCode(create(issued.ticket, admission({}, tickets, proxy)), 'SUGGESTION_NOT_FOUND');
  assert.equal(attempts, 2);
  for (const name of ['m0_suggestion_receipts','m0_suggestion_replays','m0_suggestion_work']) assert.equal((await rows(name)).length, 0);
  assert.equal((await row(service.stateRef())).revision, 1); assert.equal((await rows('m0_suggestion_limits'))[0].count, 1);
});

test('expiry after approved-result reads still rolls back the final binding and state write', async () => {
  await publish(); const issued = tickets.issue({ url }); let advanced = false;
  const proxy = new Proxy(db, { get(target, name) {
    if (name === 'runTransaction') return callback => target.runTransaction(tx => callback(new Proxy(tx, { get(transaction, key) {
      if (key === 'get') return async ref => {
        const result = await transaction.get(ref);
        if (ref.path === 'm0_suggestion_state/admission') { now = issued.expiresAt; advanced = true; }
        return result;
      };
      const value = Reflect.get(transaction, key); return typeof value === 'function' ? value.bind(transaction) : value;
    } })));
    const value = Reflect.get(target, name); return typeof value === 'function' ? value.bind(target) : value;
  } });
  await expectCode(create(issued.ticket, admission({}, tickets, proxy)), 'SUGGESTION_NOT_FOUND');
  assert.equal(advanced, true); assert.equal((await rows('m0_suggestion_public_replays')).length, 0);
  assert.equal((await row(service.stateRef())).revision, 1); assert.equal((await rows('m0_public')).length, 1);
});

test('disagreeing trusted clocks cannot issue an apparently valid future receipt', async () => {
  const future = signer({ now: () => at(1) }), issued = future.issue({ url });
  await expectCode(create(issued.ticket, admission({}, future)), 'SUGGESTION_UNAVAILABLE');
  await expectCode(admission({}, future).issueTicket({ url }), 'SUGGESTION_UNAVAILABLE');
  assert.equal((await rows('m0_suggestion_receipts')).length, 0);
});

test('malformed retention bounds fail closed while legacy mappings remain byte-for-byte unchanged', async () => {
  const issued = await service.issueTicket({ url }); await create(issued.ticket);
  const key = tickets.verify({ url, ticket: issued.ticket }).replayKey, ref = receipts.replayRef(key), mapping = await row(ref);
  for (const retainUntil of [at(30 * 86400000 + 1), at(30 * 86400000 + 60001)]) {
    await ref.set(json({ ...mapping, retainUntil })); await expectCode(create(issued.ticket), 'SUGGESTION_NOT_FOUND');
  }
  await ref.set(json({ ...mapping, retainUntil: start })); await expectCode(create(issued.ticket), 'SUGGESTION_NOT_FOUND');
  const legacy = new SuggestionAdmission(db, receipts, policy), legacyKey = 'bc'.repeat(32);
  await legacy.create({ url }, legacyKey); const oldRef = receipts.replayRef(legacyKey), old = (await oldRef.get()).data();
  assert.equal(JSON.parse(old.json).retainUntil, undefined);
  now = at(1000); await legacy.create({ url }, legacyKey); assert.deepEqual((await oldRef.get()).data(), old);
  await publish(); const approvedTicket = await service.issueTicket({ url }); await create(approvedTicket.ticket);
  const approvedKey = tickets.verify({ url, ticket: approvedTicket.ticket }).replayKey;
  const approvedRef = service.publicReplayRef(approvedKey), approvedMap = await row(approvedRef);
  await approvedRef.set(json({ ...approvedMap, retainUntil: at(30 * 86400000 + 2000) }));
  await expectCode(create(approvedTicket.ticket), 'SUGGESTION_UNAVAILABLE');
});
