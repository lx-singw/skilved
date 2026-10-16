import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SuggestionReceipts } from '../src/suggestion-receipts.mjs';
const start = '2026-10-16T10:00:00.000Z', expiresAt = '2026-10-17T10:00:00.000Z';
const keyRing = { activeKeyId: 'test1', keys: [{ id: 'test1', secret: 'a1'.repeat(32) }] };
const random = () => randomBytes(32).toString('hex');
let app, db, store, now;
const options = () => ({ keyRing, maxTtlMs: 86400000, now: () => now });
const command = () => ({ url: 'https://source.example/notice', workId: random(), idempotencyKey: random(), expiresAt });
const issue = (input, target = store) => db.runTransaction(tx => target.createOrReplay(tx, input), { maxAttempts: 20 });
const read = async ref => JSON.parse((await ref.get()).data().json);
const write = (ref, value) => ref.set({ json: JSON.stringify(value) });
const denied = promise => assert.rejects(promise, error => error.message === 'SUGGESTION_NOT_FOUND');
before(() => {
  // Never instantiate an Admin client against a real project or untrusted host.
  assert.match(process.env.FIRESTORE_EMULATOR_HOST ?? '', /^127\.0\.0\.1:[1-9]\d{3,4}$/);
  assert.equal(process.env.GCLOUD_PROJECT, 'demo-skilved-receipts');
  app = initializeApp({ projectId: 'demo-skilved-receipts' }, 'suggestion-receipts-test');
  db = getFirestore(app); store = new SuggestionReceipts(db, options());
});
beforeEach(() => { now = start; });
after(async () => { await db?.terminate(); if (app) await deleteApp(app); });

test('lost-response replay survives client recreation without plaintext credentials or URL storage', async () => {
  const input = command(), first = await issue(input), before = await read(store.receiptRef(first.access.receiptId));
  const restarted = new SuggestionReceipts(db, options());
  now = '2026-10-16T11:00:00.000Z';
  const replay = await issue({ ...input, expiresAt: '2026-10-18T10:00:00.000Z' }, restarted);
  assert.equal(first.created, true); assert.equal(replay.created, false); assert.deepEqual(replay.access, first.access);
  assert.deepEqual(await read(store.receiptRef(first.access.receiptId)), before);
  const raw = JSON.stringify([before, await read(store.replayRef(input.idempotencyKey))]);
  for (const privateValue of [first.access.capability, input.idempotencyKey, input.url, keyRing.keys[0].secret]) assert.ok(!raw.includes(privateValue));
  await denied(restarted.status(first.access)); // Strict command rejects the response-only expiresAt field.
  const status = await restarted.status({ receiptId: first.access.receiptId, capability: first.access.capability });
  assert.equal(status.status, 'received');
  for (const privateValue of [input.url, input.workId, first.access.capability, input.idempotencyKey])
    assert.ok(!JSON.stringify(status).includes(privateValue));
});

test('concurrent same-key retries create exactly one immutable receipt; changed input conflicts', async () => {
  const input = command(), results = await Promise.all(Array.from({ length: 6 }, () => issue(input)));
  assert.equal(results.filter(r => r.created).length, 1);
  for (const result of results) assert.deepEqual(result.access, results[0].access);
  await assert.rejects(issue({ ...input, url: 'https://source.example/other' }), error => error.message === 'SUGGESTION_CONFLICT');
  await assert.rejects(issue({ ...input, workId: random() }), error => error.message === 'SUGGESTION_CONFLICT');
  const mapping = await read(store.replayRef(input.idempotencyKey));
  assert.equal(mapping.receiptId, results[0].access.receiptId);
  assert.equal((await read(store.receiptRef(mapping.receiptId))).revision, 1);
});

test('same work has separate private access; wrong, missing and malformed credentials never expose status', async () => {
  const input = command(), a = (await issue(input)).access, b = (await issue({ ...input, idempotencyKey: random() })).access;
  assert.notEqual(a.receiptId, b.receiptId); assert.notEqual(a.capability, b.capability);
  const access = ({ receiptId, capability }) => ({ receiptId, capability });
  const status = await store.status(access(a));
  assert.deepEqual(Object.keys(status).sort(), ['schemaVersion','receiptId','status','revision','createdAt','updatedAt','expiresAt','publicResultIds'].sort());
  assert.equal(status.status, 'received');
  for (const invalid of [{ receiptId: a.receiptId, capability: b.capability }, { receiptId: random(), capability: a.capability },
    { receiptId: a.receiptId, capability: random() }, { receiptId: a.receiptId }, null, { ...access(a), notes: 'PRIVATE' }]) await denied(store.status(invalid));
});

test('anonymous direct database reads and writes remain denied for receipt and replay collections', async () => {
  const input = command(), access = (await issue(input)).access;
  for (const ref of [store.receiptRef(access.receiptId), store.replayRef(input.idempotencyKey)]) {
    const url = `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/demo-skilved-receipts/databases/(default)/documents/${ref.path}`;
    assert.equal((await fetch(url)).status, 403);
    assert.equal((await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { json: { stringValue: 'PRIVATE_CLIENT_WRITE' } } }) })).status, 403);
  }
});

test('expiry, revocation, missing and corrupt persistence deny status and replay without resurrection', async () => {
  for (const kind of ['expired','revoked','missing','malformed','changed-id','malformed-map']) {
    now = start;
    const input = command(), access = (await issue(input)).access, ref = store.receiptRef(access.receiptId);
    const original = await read(ref);
    if (kind === 'expired') now = expiresAt;
    if (kind === 'revoked') await write(ref, { ...original, status: 'withdrawn', revokedAt: start });
    if (kind === 'missing') await ref.delete();
    if (kind === 'malformed') await ref.set({ json: '{PRIVATE_MALFORMED' });
    if (kind === 'changed-id') await write(ref, { ...original, id: random() });
    if (kind === 'malformed-map') await store.replayRef(input.idempotencyKey).set({ json: '{PRIVATE_BAD_MAPPING' });
    const before = (await ref.get()).data();
    if (kind !== 'malformed-map') await denied(store.status({ receiptId: access.receiptId, capability: access.capability }));
    await denied(issue(input));
    assert.deepEqual((await ref.get()).data(), before);
  }
});

test('rotation retains existing access/replay; removed or replaced key invalidates both', async () => {
  const input = command(), access = (await issue(input)).access;
  const nextKey = { id: 'test2', secret: 'b2'.repeat(32) };
  const rotated = new SuggestionReceipts(db, { ...options(), keyRing: { activeKeyId: 'test2', keys: [nextKey, ...keyRing.keys] } });
  assert.deepEqual((await issue(input, rotated)).access, access);
  assert.equal((await rotated.status({ receiptId: access.receiptId, capability: access.capability })).status, 'received');
  const newAccess = (await issue(command(), rotated)).access;
  assert.equal((await read(rotated.receiptRef(newAccess.receiptId))).keyId, 'test2');
  for (const keys of [[nextKey], [{ id: 'test1', secret: nextKey.secret }]]) {
    const changed = new SuggestionReceipts(db, { ...options(), keyRing: { activeKeyId: keys[0].id, keys } });
    await denied(issue(input, changed));
    await denied(changed.status({ receiptId: access.receiptId, capability: access.capability }));
  }
});

test('invalid TTL/clock fail safely and resolved IDs stay withheld pending current-public guard', async () => {
  for (const invalid of ['2026-10-16T09:59:59.000Z', start, '2026-10-18T10:00:00.000Z'])
    await assert.rejects(issue({ ...command(), expiresAt: invalid }), error => error.message === 'INVALID_COMMAND');
  const input = command(), access = (await issue(input)).access, ref = store.receiptRef(access.receiptId);
  await write(ref, { ...await read(ref), status: 'resolved_to_listing', publicResultIds: ['private_draft_sentinel'] });
  await assert.rejects(store.status({ receiptId: access.receiptId, capability: access.capability }), error => error.message === 'SUGGESTION_UNAVAILABLE');
  now = 'PRIVATE_BAD_CLOCK';
  await assert.rejects(issue(command()), error => error.message === 'SUGGESTION_UNAVAILABLE');
});
