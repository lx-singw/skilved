import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { SuggestionRequestSchema, SuggestionUrlSchema } = require('../dist/opportunities/suggestions.js');

test('suggestions accept only a bounded URL field and normalize scheme/host without rewriting the path', () => {
  assert.deepEqual(SuggestionRequestSchema.parse({ url: 'HTTPS://SOURCE.EXAMPLE/Notice-A/' }), { url: 'https://source.example/Notice-A/' });
  assert.equal(SuggestionUrlSchema.parse('https://source.example'), 'https://source.example/');
  for (const field of ['email', 'phone', 'document', 'notes', 'profileId', 'receiptToken', 'sourceId', 'category', 'stage'])
    assert.equal(SuggestionRequestSchema.safeParse({ url: 'https://source.example/notice', [field]: 'PRIVATE_SENTINEL' }).success, false, field);
  for (const value of [null, [], 'https://source.example', {}, { url: 12 }, { url: 'https://source.example/' + 'a'.repeat(2048) }])
    assert.equal(SuggestionRequestSchema.safeParse(value).success, false);
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
