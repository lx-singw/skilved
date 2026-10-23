import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SuggestionReceipts, ReceiptCreateCommand, ReceiptRecord } from '../src/suggestion-receipts.mjs';
const secret = 'a1'.repeat(32), now = () => '2026-10-16T10:00:00.000Z';
const options = { keyRing: { activeKeyId: 'key1', keys: [{ id: 'key1', secret }] }, maxTtlMs: 86400000, now };

test('receipt key configuration has no default, bounds rotation and fails with safe errors', () => {
  for (const input of [undefined, {}, { ...options, keyRing: undefined }, { ...options, maxTtlMs: 0 },
    ...[null,'short',secret].map(recoveryEpoch=>({...options,recoveryEpoch})),
    { ...options, maxTtlMs: 31 * 86400000 }, { ...options, now: undefined },
    ...[{ activeKeyId: 'missing', keys: [{ id: 'key1', secret }] },
      { activeKeyId: 'key1', keys: [{ id: 'key1', secret: 'PRIVATE_BAD_KEY' }] },
      { activeKeyId: 'key1', keys: [{ id: 'key1', secret }, { id: 'key1', secret }] },
      { activeKeyId: 'key1', keys: Array.from({ length: 5 }, (_, i) => ({ id: `key${i}`, secret })) },
    ].map(keyRing => ({ ...options, keyRing }))]) {
    assert.throws(() => new SuggestionReceipts({}, input), error => error.message === 'SUGGESTION_UNAVAILABLE');
  }
  assert.equal(JSON.stringify(new SuggestionReceipts({}, options)).includes(secret), false);
});

test('capability derivation is scoped to receipt, nonce and key; retained keys support rotation', () => {
  const receipt = { id: 'b'.repeat(64), nonce: 'c'.repeat(64), keyId: 'key1' };
  const store = new SuggestionReceipts({}, options), token = store.derive(receipt);
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.equal(store.derive(receipt), token);
  for (const changed of [{ id: 'd'.repeat(64) }, { nonce: 'd'.repeat(64) }])
    assert.notEqual(store.derive({ ...receipt, ...changed }), token);
  const rotated = new SuggestionReceipts({}, { ...options, keyRing: { activeKeyId: 'key2',
    keys: [{ id: 'key2', secret: 'd1'.repeat(32) }, ...options.keyRing.keys] } });
  assert.equal(rotated.derive(receipt), token);
  assert.notEqual(rotated.derive({ ...receipt, keyId: 'key2' }), token);
  const removed = new SuggestionReceipts({}, { ...options, keyRing: { activeKeyId: 'key2', keys: [{ id: 'key2', secret }] } });
  assert.equal(removed.derive(receipt), null);
});

test('private creation commands reject personal fields and records reject raw secrets and inconsistent states', () => {
  const command = { url: 'https://source.example/notice', workId: 'b'.repeat(64), idempotencyKey: 'c'.repeat(64), expiresAt: '2026-10-17T10:00:00.000Z' };
  assert.equal(ReceiptCreateCommand.safeParse(command).success, true);
  for (const extra of [{ notes: 'PRIVATE' }, { userId: 'PRIVATE' }, { idempotencyKey: 'short' }, { url: command.url + '?session=PRIVATE' }])
    assert.equal(ReceiptCreateCommand.safeParse({ ...command, ...extra }).success, false);
  const record = { schemaVersion: 1, id: 'b'.repeat(64), nonce: 'c'.repeat(64), keyId: 'key1', capabilityHash: 'd'.repeat(64),
    workId: 'e'.repeat(64), status: 'received', revision: 1, createdAt: now(), updatedAt: now(), expiresAt: command.expiresAt,
    revokedAt: null, publicResultIds: [] };
  assert.equal(ReceiptRecord.safeParse(record).success, true);
  for (const extra of [{ capability: 'PRIVATE' }, { url: command.url }, { revokedAt: '2025-01-01T00:00:00.000Z' },
    { status: 'withdrawn' }, { status: 'resolved_to_listing' }, { publicResultIds: ['draft'] }, { updatedAt: command.expiresAt }])
    assert.equal(ReceiptRecord.safeParse({ ...record, ...extra }).success, false);
});
