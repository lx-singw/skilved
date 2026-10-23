import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { SuggestionReplayTickets } from '../src/suggestion-replay-tickets.mjs';

const epoch = '11'.repeat(32), secret = '22'.repeat(32), nonce = '33'.repeat(32);
const url = 'https://source.example/notice', start = '2026-10-22T12:00:00.000Z';
const issued = Date.parse(start), ttlMs = 60000, expires = issued + ttlMs;
const defaults = { epoch, secret, notBefore: start, ttlMs, now: () => start };
const make = options => new SuggestionReplayTickets({ ...defaults, ...options });
const iso = value => new Date(value).toISOString();
const rejected = (fn, code = 'SUGGESTION_NOT_FOUND') => assert.throws(fn, error =>
  error.message === code && error.code === code && !error.message.includes(url) && !error.message.includes(secret));
// Independent Python stdlib hmac/hashlib fixture, captured before implementing tests.
const fixture = ['s1', epoch, issued, expires, nonce,
  '602bab6ee9c7932f47c3800fa9fc8238f703dbe9721557042a9f39afbd4dcc31'].join('.');
function signed({ e = epoch, i = issued, x = expires, n = nonce, u = url, key = secret, domain = 'skilved.suggestion.replay-ticket.v1' } = {}) {
  const mac = createHmac('sha256', Buffer.from(key, 'hex')).update(JSON.stringify([domain, e, i, x, n, u])).digest('hex');
  return ['s1', e, i, x, n, mac].join('.');
}

test('independent fixed ticket binds URL, immutable expiry and internal replay digest', () => {
  const store = make();
  const expected = { epoch, issuedAt: start, expiresAt: iso(expires),
    replayKey: '47acef02d4cf8b4ebb5615ef3f7997404cbe3c7fb237268a3723140ce44007d0' };
  assert.deepEqual(store.verify({ url, ticket: fixture }), expected);
  assert.deepEqual(make({ now: () => iso(expires - 1) }).verify({ url, ticket: fixture }), expected);
  assert.deepEqual(store.verify({ url: 'HTTPS://SOURCE.EXAMPLE/notice', ticket: fixture }), expected);
});

test('issuance is bounded, private and distinct for separate submitters', () => {
  const store = make(), a = store.issue({ url }), b = store.issue({ url });
  assert.notEqual(a.ticket, b.ticket);
  assert.ok(a.ticket.length <= 230);
  assert.equal(a.expiresAt, iso(expires));
  assert.deepEqual(Object.keys(a).sort(), ['expiresAt', 'ticket']);
  for (const output of [a, b, store, store.verify({ url, ticket: a.ticket })]) {
    assert.equal(JSON.stringify(output).includes(url), false);
    assert.equal(JSON.stringify(output).includes(secret), false);
  }
  assert.notEqual(store.verify({ url, ticket: a.ticket }).replayKey, store.verify({ url, ticket: b.ticket }).replayKey);
  assert.equal(a.ticket.split('.')[4].length, 64);
});

test('configuration is explicit and strict with no retained old epoch or secret defaults', () => {
  for (const options of [undefined, null, {}, { ...defaults, epoch: undefined }, { ...defaults, secret: 'PRIVATE' },
    { ...defaults, epoch: epoch.toUpperCase().replaceAll('1', 'A') }, { ...defaults, now: undefined },
    { ...defaults, notBefore: '2026-10-22' }, { ...defaults, notBefore: '2026-02-30T00:00:00.000Z' },
    ...[0, -1, 1.5, NaN, Infinity, 30 * 86400000 + 1].map(ttlMs => ({ ...defaults, ttlMs })),
    { ...defaults, epoch: secret }, { ...defaults, keys: [{ epoch, secret }] }, { ...defaults, database: {} }])
    rejected(() => new SuggestionReplayTickets(options), 'SUGGESTION_UNAVAILABLE');
});

test('every token field and notice binding rejects tampering with the same safe error', () => {
  const parts = fixture.split('.');
  const changes = ['s2', '44'.repeat(32), String(issued + 1), String(expires + 1), '55'.repeat(32), '66'.repeat(32)];
  for (let index = 0; index < parts.length; index++) {
    const changed = [...parts]; changed[index] = changes[index];
    rejected(() => make().verify({ url, ticket: changed.join('.') }));
  }
  rejected(() => make().verify({ url: url + '/other', ticket: fixture }));
  rejected(() => make().verify({ url, ticket: signed({ key: '44'.repeat(32) }) }));
  rejected(() => make().verify({ url, ticket: signed({ domain: 'skilved.suggestion.receipt.status-withdraw.v1' }) }));
});

test('legacy, malformed, oversized and extra-field commands fail closed without echo', () => {
  for (const ticket of ['ab'.repeat(32), '', null, 123, fixture + '.extra', 'x'.repeat(100000),
    fixture + '\n', fixture.replace(String(issued), '0' + issued), fixture.replace(String(issued), '1.7926704e12'),
    fixture.replace(String(issued), '+' + issued), fixture.replace(String(issued), '-1'), fixture.replace('s1.', 'S1.'),
    fixture.replace('602bab', '602BAB')]) rejected(() => make().verify({ url, ticket }));
  for (const input of [undefined, {}, { url, ticket: fixture, receiptId: 'PRIVATE' },
    { url: url + '?session=PRIVATE', ticket: fixture }, { url, ticket: { toString: () => fixture } }])
    rejected(() => make().verify(input));
  for (const input of [undefined, {}, { url, notes: 'PRIVATE' }, { url: url + '#PRIVATE' }])
    rejected(() => make().issue(input), 'INVALID_COMMAND');
});

test('exact expiry, future issuance and activation boundaries cannot extend validity', () => {
  assert.equal(make().verify({ url, ticket: fixture }).issuedAt, start);
  rejected(() => make({ now: () => iso(expires) }).verify({ url, ticket: fixture }));
  rejected(() => make().verify({ url, ticket: signed({ i: issued + 1, x: expires + 1 }) }));
  rejected(() => make().verify({ url, ticket: signed({ i: issued - 1, x: expires - 1 }) }));
  rejected(() => make({ notBefore: iso(issued + 1), now: () => iso(issued + 1) }).verify({ url, ticket: fixture }));
  rejected(() => make({ now: () => iso(issued - 1) }).verify({ url, ticket: fixture }), 'SUGGESTION_UNAVAILABLE');
});

test('a valid MAC cannot bypass configured duration, zero duration or calendar bounds', () => {
  for (const x of [issued, issued - 1, expires + 1, 253402300800000, 999999999999999])
    rejected(() => make().verify({ url, ticket: signed({ x }) }));
  rejected(() => make({ ttlMs: ttlMs - 1 }).verify({ url, ticket: fixture }));
  for (const duration of [1, 30 * 86400000]) {
    const store = make({ ttlMs: duration }), response = store.issue({ url });
    assert.equal(Date.parse(response.expiresAt) - issued, duration);
    assert.equal(store.verify({ url, ticket: response.ticket }).expiresAt, response.expiresAt);
    rejected(() => make({ ttlMs: duration, now: () => iso(issued + duration) }).verify({ url, ticket: response.ticket }));
  }
});

test('invalid, throwing, rolled-back and calendar-overflow clocks have safe failures', () => {
  for (const now of [() => 'PRIVATE_CLOCK', () => { throw new Error('PRIVATE_CLOCK'); }, () => iso(issued - 1)]) {
    rejected(() => make({ now }).issue({ url }), 'SUGGESTION_UNAVAILABLE');
    rejected(() => make({ now }).verify({ url, ticket: fixture }), 'SUGGESTION_UNAVAILABLE');
  }
  rejected(() => make({ now: () => '9999-12-31T23:59:59.999Z' }).issue({ url }), 'SUGGESTION_UNAVAILABLE');
});

test('external epoch retirement rejects old tickets independently of restored history', () => {
  const before = make().issue({ url });
  // No database argument/history is accepted by this verifier. A fresh instance with
  // the retained epoch still accepts unexpired tickets, so restore requires retirement.
  assert.equal(make().verify({ url, ticket: before.ticket }).epoch, epoch);
  const after = make({ epoch: '44'.repeat(32) });
  rejected(() => after.verify({ url, ticket: before.ticket }));
  const current = after.issue({ url });
  assert.equal(after.verify({ url, ticket: current.ticket }).epoch, '44'.repeat(32));
  rejected(() => make().verify({ url, ticket: current.ticket }));
  rejected(() => make({ secret: '55'.repeat(32) }).verify({ url, ticket: before.ticket }));
});
