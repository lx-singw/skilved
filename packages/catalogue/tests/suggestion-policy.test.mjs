import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifySuggestion } from '../src/suggestion-policy.mjs';
import { RECENTJOBS_INDEX } from '../src/worker-policy.mjs';
const notice = 'https://recentjobs.co.za/2026/10/16/synthetic-opportunity/';
const source = (id = 'synthetic_source') => ({ id, revision: 3, name: 'Synthetic reviewed-source fixture', urls: [RECENTJOBS_INDEX],
  permission: { reference: 'SYNTHETIC_NOT_PERMISSION', method: 'recentjobs_html', reuse: 'Synthetic test only', reviewedAt: '2026-10-16T10:00:00.000Z' },
  categories: ['bursary','learnership','apprenticeship','internship','graduate_programme','job'], owner: 'synthetic_operator', paused: false, cadenceHours: 24, maxBytes: 1000 });

test('pure intake classifier reuses the existing reviewed RecentJobs detail policy without fetching or narrowing categories', () => {
  assert.deepEqual(classifySuggestion({ url: notice }, [source()]), { kind: 'eligible', url: notice, sourceId: 'synthetic_source', sourceRevision: 3 });
  for (const url of [RECENTJOBS_INDEX, 'https://recentjobs.co.za/login/', 'https://other.example/2026/10/16/synthetic-opportunity/', 'https://recentjobs.co.za.evil.example/2026/10/16/synthetic-opportunity/'])
    assert.deepEqual(classifySuggestion({ url }, [source()]), { kind: 'unsupported' });
  assert.deepEqual(classifySuggestion({ url: notice }, [{ ...source(), paused: true }]), { kind: 'paused' });
});

test('structured sources match exact approved URLs, not a host or path prefix', () => {
  const s = source(); s.permission.method = 'structured_json'; s.urls = ['https://source.example/notices/approved.json'];
  assert.equal(classifySuggestion({ url: s.urls[0] }, [s]).kind, 'eligible');
  for (const url of ['https://source.example/notices/other.json', 'https://source.example/notices/approved.json/extra'])
    assert.deepEqual(classifySuggestion({ url }, [s]), { kind: 'unsupported' });
});

test('ambiguous, duplicate, missing, malformed and oversized registries fail closed without exposing source data', () => {
  const bad = [{ ...source(), permission: undefined }];
  for (const registry of [undefined, [], bad, [source(), source()], [source(), source('second')], Array.from({ length: 101 }, (_, i) => source('source_' + i))])
    assert.deepEqual(classifySuggestion({ url: notice }, registry), { kind: 'unavailable' });
});

test('invalid private-looking inputs produce only a safe error class', () => {
  for (const input of [{ url: 'https://source.example/a?session=PRIVATE_SECRET' }, { url: notice, email: 'PRIVATE_EMAIL' }, { url: 'https://internal.local/PRIVATE_SECRET', notes: 'PRIVATE_NOTES' }]) {
    const result = classifySuggestion(input, [source()]); assert.deepEqual(result, { kind: 'invalid' }); assert.doesNotMatch(JSON.stringify(result), /PRIVATE_|url|sourceId/);
  }
});
