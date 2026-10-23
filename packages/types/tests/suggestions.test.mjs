import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { SuggestionRequestSchema, SuggestionUrlSchema } = require('../dist/opportunities/suggestions.js');
const { SuggestionAccessSchema, SuggestionStatusResponseSchema } = require('../dist/opportunities/suggestions.js');
const { SuggestionCreateResponseSchema } = require('../dist/opportunities/suggestions.js');
const { SuggestionWithdrawResponseSchema } = require('../dist/opportunities/suggestions.js');
const { SuggestionReplayTicketSchema, SuggestionTicketResponseSchema } = require('../dist/opportunities/suggestions.js');

test('signed replay syntax is bounded and canonical without treating syntax as signature verification', () => {
  const issued = Date.parse('2026-10-22T12:00:00.000Z'), expires = issued + 60000;
  const token = (i = issued, x = expires) => ['s1','a'.repeat(64),i,x,'b'.repeat(64),'c'.repeat(64)].join('.');
  assert.equal(SuggestionReplayTicketSchema.parse(token()), token());
  for (const value of ['a'.repeat(64), token()+'\n', token()+', '+token(), token().toUpperCase(), 'x'.repeat(231),
    token('0'+issued), token('1.7926704e12'), token(issued, issued), token(issued, issued + 30*86400000 + 1),
    token(issued,253402300800000), token().replace('s1.','s2.')])
    assert.equal(SuggestionReplayTicketSchema.safeParse(value).success, false);
});

test('ticket issuance responses have matching immutable expiry and no unrelated fields', () => {
  const expiresAt = '2026-10-22T12:01:00.000Z';
  const ticket = ['s1','a'.repeat(64),Date.parse('2026-10-22T12:00:00.000Z'),Date.parse(expiresAt),'b'.repeat(64),'c'.repeat(64)].join('.');
  const value = { ticket, expiresAt }; assert.deepEqual(SuggestionTicketResponseSchema.parse(value), value);
  for (const patch of [{ expiresAt: '2026-10-22T12:02:00.000Z' }, { url: 'PRIVATE' }, { capability: 'PRIVATE' },
    { ticket: 'a'.repeat(64) }, { expiresAt: 'PRIVATE' }])
    assert.equal(SuggestionTicketResponseSchema.safeParse({ ...value, ...patch }).success, false);
});

test('withdrawal acknowledgements are strict and contain no credentials, source or shared work details', () => {
  const value = { schemaVersion: 1, receiptId: 'a'.repeat(64), status: 'withdrawn' };
  assert.deepEqual(SuggestionWithdrawResponseSchema.parse(value), value);
  for (const patch of [{ capability: 'PRIVATE' }, { workId: 'PRIVATE' }, { url: 'PRIVATE' },
    { publicResultIds: ['listing'] }, { status: 'received' }, { receiptId: 'short' }, { revision: 2 }])
    assert.equal(SuggestionWithdrawResponseSchema.safeParse({ ...value, ...patch }).success, false);
});

test('create outcomes keep public results separate from private access and reject stale result payloads', () => {
  for (const response of [{ kind: 'approved', publicResultIds: ['a','b'] }, { kind: 'previous_result_unavailable' },
    { kind: 'received', access: { receiptId: 'a'.repeat(64), capability: 'b'.repeat(64), expiresAt: '2026-10-17T10:00:00.000Z' } }])
    assert.equal(SuggestionCreateResponseSchema.safeParse(response).success, true);
  for (const response of [{ kind: 'approved', publicResultIds: [] }, { kind: 'approved', publicResultIds: ['a','a'] },
    { kind: 'approved', publicResultIds: ['a'], capability: 'PRIVATE' }, { kind: 'previous_result_unavailable', publicResultIds: ['old'] },
    { kind: 'received', url: 'https://source.example/private' }, { kind: 'approved', publicResultIds: Array.from({ length: 21 }, (_, i) => 'a'+i) }])
    assert.equal(SuggestionCreateResponseSchema.safeParse(response).success, false);
});

test('suggestions accept only a bounded URL field and normalize scheme/host without rewriting the path', () => {
  assert.deepEqual(SuggestionRequestSchema.parse({ url: 'HTTPS://SOURCE.EXAMPLE/Notice-A/' }), { url: 'https://source.example/Notice-A/' });
  assert.equal(SuggestionUrlSchema.parse('https://source.example'), 'https://source.example/');
  for (const field of ['email', 'phone', 'document', 'notes', 'profileId', 'receiptToken', 'sourceId', 'category', 'stage'])
    assert.equal(SuggestionRequestSchema.safeParse({ url: 'https://source.example/notice', [field]: 'PRIVATE_SENTINEL' }).success, false, field);
  for (const value of [null, [], 'https://source.example', {}, { url: 12 }, { url: 'https://source.example/' + 'a'.repeat(2048) }])
    assert.equal(SuggestionRequestSchema.safeParse(value).success, false);
});

test('private access and status contracts are strict, bounded and contain no URL or notes', () => {
  const receiptId = 'a'.repeat(64), capability = 'b'.repeat(64);
  const createdAt = '2026-10-16T10:00:00.000Z', expiresAt = '2026-10-17T10:00:00.000Z';
  assert.deepEqual(SuggestionAccessSchema.parse({ receiptId, capability, expiresAt }), { receiptId, capability, expiresAt });
  const status = { schemaVersion: 1, receiptId, status: 'received', revision: 1,
    createdAt, updatedAt: createdAt, expiresAt, publicResultIds: [] };
  assert.deepEqual(SuggestionStatusResponseSchema.parse(status), status);
  for (const field of ['url', 'capability', 'nonce', 'keyId', 'workId', 'notes', 'email'])
    assert.equal(SuggestionStatusResponseSchema.safeParse({ ...status, [field]: 'PRIVATE' }).success, false);
  for (const extra of [{ publicResultIds: ['draft'] }, { revision: 0 }, { updatedAt: expiresAt },
    { createdAt: expiresAt }, { status: 'published' }, { status: 'resolved_to_listing' }])
    assert.equal(SuggestionStatusResponseSchema.safeParse({ ...status, ...extra }).success, false);
  assert.equal(SuggestionStatusResponseSchema.safeParse({ ...status, status: 'resolved_to_listing', publicResultIds: ['approved'] }).success, true);
  assert.equal(SuggestionStatusResponseSchema.safeParse({ ...status, status: 'resolved_to_listing', publicResultIds: ['a', 'a'] }).success, false);
  for (const invalid of ['b'.repeat(63), 'B'.repeat(64), 'b'.repeat(65), '../receipt', 'b'.repeat(64) + '\n'])
    assert.equal(SuggestionAccessSchema.safeParse({ receiptId, capability: invalid, expiresAt }).success, false);
});

test('unsafe, session-bearing and parser-normalized URL forms are rejected rather than stripped', () => {
  const urls = ['http://source.example/a', '//source.example/a', 'file:///etc/passwd', 'data:text/plain,private',
    'https://user:secret@source.example/a', 'https://source.example:443/a', 'https://source.example:444/a',
    'https://127.0.0.1/a', 'https://2130706433/a', 'https://0x7f000001/a', 'https://[::1]/a', 'https://localhost/a',
    'https://source.example/a?token=PRIVATE_SECRET', 'https://source.example/a?', 'https://source.example/a#PRIVATE_SECRET', 'https://source.example/a#',
    ' https://source.example/a', 'https://source.example/a\n', 'https://source.example/\tsecret', 'https://source.example\\@internal.example/a',
    'https://source.example/a/../notice', 'https://source.example/./notice', 'https://source.example/%2e%2e/a',
    'https://source.example/a%3Ftoken%3Dsecret', 'https://source.example/a;jsessionid=secret',
    'https://source.example./a', 'https://source%2eexample/a', 'https://sourcé.example/a'];
  for (const url of urls) assert.equal(SuggestionUrlSchema.safeParse(url).success, false, url);
});

test('suggestion schemas stay separate from general public opportunity projections', () => {
  const general = require('../dist/opportunities/index.js');
  assert.equal(general.SuggestionRequestSchema, undefined);
  assert.equal(general.SuggestionUrlSchema, undefined);
  assert.equal(Object.keys(SuggestionRequestSchema.parse({ url: 'https://source.example/a' })).join(','), 'url');
});
