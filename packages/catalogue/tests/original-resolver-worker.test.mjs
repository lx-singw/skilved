import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { RecentJobsWorker } from '../src/recentjobs-worker.mjs';
import { Catalogue } from '../src/store.mjs';
import { Source } from '../src/schemas.mjs';
import { DomainError } from '../src/config.mjs';
import { getRuntime } from '../src/runtime.mjs';
import { RECENTJOBS_INDEX } from '../src/worker-policy.mjs';
import { syntheticExtraction } from './fixtures/recentjobs-model.mjs';
import { originalFixture, originalHtml, originalMicrodataHtml } from './fixtures/original-notices.mjs';
const value = snap => snap.exists ? JSON.parse(snap.data().json) : null;
const payload = v => ({ json: JSON.stringify(v) });
const hash = text => createHash('sha256').update(text).digest('hex');
let db;
before(async () => {
  process.env.SKILVED_CATALOGUE_MODE = 'emulator'; process.env.SKILVED_CATALOGUE_PROJECT = 'demo-skilved-original';
  db = (await getRuntime()).db;
});
after(async () => { await db?.terminate(); });

async function fixture(kinds = ['matched_a','matched_b','wrong_url','wrong_ref','closed','unavailable','unknown','unsupported']) {
  let now = '2026-10-29T10:00:00.000Z';
  const sourceId = `publisher_${randomUUID()}`, principal = `${randomUUID()}@example.test`, uid = `operator_${randomUUID()}`;
  const cases = kinds.map((kind, index) => {
    const f = originalFixture({ issuer: kind.endsWith('_b') ? 'Imaginary Works' : 'Fictional Workshop',
      host: kind.endsWith('_b') ? 'second.example' : kind === 'unknown' ? 'unqualified.example' : 'careers.example',
      path: `/tenant-a/job/${index + 100}/`, reference: `AP-${index + 100}`, slug: `authored-${kind.replaceAll('_','-')}` });
    if (kind === 'wrong_url') f.posting.url = 'https://careers.example/tenant-a/job/9999/';
    if (kind === 'wrong_ref') f.posting.description = '<p>Reference: AP-9999</p>';
    if (kind === 'closed') f.posting.validThrough = '2026-10-20';
    if (kind === 'microdata_legacy') f.posting.validThrough = 'Fri Oct 30 22:00:00 UTC 2026';
    if (kind === 'legacy_utc_a' || kind === 'microdata_legacy_match_b') f.posting.validThrough = 'Fri Oct 30 09:00:00 UTC 2026';
    if (kind === 'legacy_bad_weekday') f.posting.validThrough = 'Thu Oct 30 09:00:00 UTC 2026';
    f.primaryHtml = kind === 'unsupported' ? '<h1>Careers search</h1>' : kind.startsWith('microdata_') ? originalMicrodataHtml(f.posting) : originalHtml(f.posting);
    return { ...f, kind };
  });
  const source = Source.parse({ ...cases[0].source, id: sourceId,
    automation: { ...cases[0].source.automation, issuers: [
      ...originalFixture().source.automation.issuers,
      ...originalFixture({ issuer: 'Imaginary Works', host: 'second.example' }).source.automation.issuers,
    ] } });
  const state = { requests: [], extracted: [], validated: [], afterValidation: null, afterRobots: null };
  const options = { now: () => now, sleep: async () => {},
    fetcher: async (_source, url) => {
      state.requests.push(url);
      if (url.endsWith('/robots.txt')) {
        await state.afterRobots?.(url);
        return { url, text: 'User-agent: *\nAllow: /' };
      }
      if (url === RECENTJOBS_INDEX) return { url, text: `<div class="articles-wrap">${cases.map(c =>
        `<article class="type-post"><h2 class="entry-title"><a href="${c.detailUrl}">${c.candidate.title}</a></h2></article>`).join('')}</div>` };
      const detail = cases.find(c => c.detailUrl === url);
      if (detail) return { url, text: detail.detailHtml };
      const primary = cases.find(c => c.url === url);
      assert.ok(primary, `Unexpected acquisition: ${url}`);
      if (primary.kind === 'unavailable') throw new DomainError('UNSUPPORTED_RESPONSE');
      return { url, text: primary.primaryHtml };
    },
    extractor: async candidate => {
      state.extracted.push(candidate.sourceUrl);
      const c = cases.find(c => c.detailUrl === candidate.sourceUrl);
      const x = JSON.parse(JSON.stringify(syntheticExtraction()).replaceAll('Fictional Workshop', c.posting.hiringOrganization.name));
      const reference = c.candidate.sourceText.match(/^Reference: (.+)$/m);
      x.intake = { state: 'stated', value: reference[1], quote: reference[0] };
      return { extraction: x, provenance: { usage: { totalTokens: 20 } } };
    },
    validator: async ({ primary }) => {
      state.validated.push(primary.issuer); await state.afterValidation?.();
      return { supported: true, issues: [], evidence: [
        { source: 'recentjobs', quote: 'Grade 12 with Mathematics OR N3 Electrical' },
        { source: 'primary', quote: primary.issuer },
      ], provenance: { usage: { totalTokens: 20 } } };
    } };
  const worker = new RecentJobsWorker(db, principal, options);
  const catalogue = new Catalogue(db, { verifyIdToken: async token => {
    if (token !== 'authored-token') throw new Error('Invalid authored token'); return { uid };
  } }, options.now);
  await worker.ref('operators', uid).set({ active: true, roles: ['source','reviewer'] });
  await catalogue.registerSource('authored-token', source, null, 'Register authored publisher and resolver policy');
  const grant = { principal, active: true, sources: [sourceId], roles: ['ingest'] };
  await worker.ref('workers', worker.actor).set(grant);
  const rows = async collection => (await db.collection(`m0_${collection}`).get()).docs.map(value).filter(r => r.sourceId === sourceId);
  return { worker, source, sourceId, grant, cases, state, catalogue, rows, uid,
    restart: (overrides = {}) => new RecentJobsWorker(db, principal, { ...options, ...overrides }),
    advance: ms => { now = new Date(Date.parse(now) + ms).toISOString(); } };
}

test('one publisher batch corroborates two employers, isolates wrong vacancies and spends AI only on matches', async () => {
  const f = await fixture(), result = await f.worker.run(f.sourceId);
  assert.equal(result.results.length, 9);
  assert.equal(result.results.filter(r => r.recordId).length, 2);
  assert.equal(f.state.extracted.length, 2); assert.equal(f.state.validated.length, 2);
  assert.deepEqual(new Set(f.state.validated), new Set(['Fictional Workshop','Imaginary Works']));
  const resolutions = await f.rows('worker_original_resolutions'); assert.equal(resolutions.length, 8);
  const counts = {};
  for (const r of resolutions) counts[r.resolution.outcome] = (counts[r.resolution.outcome] ?? 0) + 1;
  assert.deepEqual(counts, { matched: 2, conflicting: 2, closed: 1, unavailable: 1, unsupported: 2 });
  assert.ok(!f.state.requests.some(url => url.includes('unqualified.example')));
  assert.ok(!f.state.requests.some(url => url.includes('9999')));
  assert.equal(value(await f.worker.ref('model_budgets', hash(`${f.sourceId}:2026-10-29`)).get()).calls, 4);
  const decisions = await f.rows('worker_decisions'); assert.equal(decisions.length, 2);
  for (const decision of decisions) {
    assert.equal(decision.validationBasis, 'discovery_and_primary');
    assert.ok(resolutions.some(r => r.id === decision.originalResolutionId && r.resolution.outcome === 'matched'));
    const draft = value(await f.worker.ref('drafts', decision.recordId).get());
    assert.equal(draft.publication.approved, false); assert.equal(draft.citations.length, 2);
    assert.equal((await f.worker.ref('public', decision.recordId).get()).exists, false);
  }
  for (const exception of await f.rows('worker_exceptions')) {
    assert.equal(exception.stage, 'original_resolution');
    const receipt = resolutions.find(r => r.id === exception.originalResolutionId); assert.ok(receipt);
    assert.equal((await f.worker.ref('worker_candidates', exception.jobId).get()).exists, false);
    if (receipt.primarySnapshotId) assert.equal((await f.worker.ref('snapshots', receipt.primarySnapshotId).get()).exists, true);
  }
  assert.deepEqual((await f.worker.ref('workers', f.worker.actor).get()).data(), f.grant);
  assert.deepEqual(value(await f.worker.ref('sources', f.sourceId).get()), f.source);
});
test('normal shadow worker admits corroborated Microdata for two issuers but holds conflicting dates before AI', async () => {
  const f = await fixture(['microdata_a','microdata_b','microdata_legacy']);
  const result = await f.worker.run(f.sourceId);
  assert.equal(result.results.filter(r => r.recordId).length, 2);
  assert.equal(f.state.extracted.length, 2); assert.equal(f.state.validated.length, 2);
  const resolutions = await f.rows('worker_original_resolutions'); assert.equal(resolutions.length, 3);
  assert.ok(resolutions.every(r => r.resolution.adapter === 'jobposting_microdata_v1' && r.resolution.version === 'original_jobposting_v3'));
  assert.equal(resolutions.filter(r => r.resolution.outcome === 'matched').length, 2);
  assert.equal(resolutions.find(r => r.resolution.outcome === 'conflicting').resolution.reason, 'DEADLINE_CONFLICT');
  assert.equal((await f.rows('worker_decisions')).length, 2);
  assert.equal(value(await f.worker.ref('model_budgets', hash(`${f.sourceId}:2026-10-29`)).get()).calls, 4);
  for (const decision of await f.rows('worker_decisions')) {
    assert.equal(value(await f.worker.ref('drafts', decision.recordId).get()).publication.approved, false);
    assert.equal((await f.worker.ref('public', decision.recordId).get()).exists, false);
  }
  assert.equal((await f.rows('worker_exceptions')).length, 1);
});
test('shared UTC deadline decoding admits same-day originals across formats and holds shifted or malformed dates before AI', async () => {
  const f = await fixture(['legacy_utc_a','microdata_legacy_match_b','microdata_legacy','legacy_bad_weekday']);
  const result = await f.worker.run(f.sourceId);
  assert.equal(result.results.filter(r => r.recordId).length, 2);
  assert.equal(f.state.extracted.length, 2); assert.equal(f.state.validated.length, 2);
  const resolutions = await f.rows('worker_original_resolutions'); assert.equal(resolutions.length, 4);
  const matched = resolutions.filter(r => r.resolution.outcome === 'matched'); assert.equal(matched.length, 2);
  assert.deepEqual(new Set(matched.map(r => r.resolution.adapter)), new Set(['jobposting_jsonld_v1','jobposting_microdata_v1']));
  for (const { resolution } of matched) {
    assert.equal(resolution.deadlineEvidence.format, 'legacy_utc');
    assert.equal(resolution.deadlineEvidence.localDate, '2026-10-30');
    assert.equal(resolution.deadlineEvidence.instant, '2026-10-30T09:00:00.000Z');
  }
  const conflict = resolutions.find(r => r.resolution.reason === 'DEADLINE_CONFLICT').resolution;
  assert.equal(conflict.deadlineEvidence.localDate, '2026-10-31'); assert.equal(conflict.deadlineEvidence.dayShift, true);
  assert.equal(resolutions.filter(r => r.resolution.reason === 'DEADLINE_UNRESOLVED').length, 1);
  assert.equal((await f.rows('worker_candidates')).length, 2); assert.equal((await f.rows('worker_decisions')).length, 2);
  assert.equal(value(await f.worker.ref('model_budgets', hash(`${f.sourceId}:2026-10-29`)).get()).calls, 4);
  for (const decision of await f.rows('worker_decisions')) {
    assert.equal(value(await f.worker.ref('drafts', decision.recordId).get()).publication.approved, false);
    assert.equal((await f.worker.ref('public', decision.recordId).get()).exists, false);
  }
});
test('legacy validation lane does not inherit Microdata support without the shadow original resolver', async () => {
  const f = await fixture(['microdata_a']);
  const legacy = JSON.parse(JSON.stringify(f.source)); legacy.revision = 2;
  delete legacy.automation.originalVerification;
  await f.catalogue.registerSource('authored-token', legacy, 1, 'Authored legacy format boundary regression');
  const result = await f.worker.run(f.sourceId);
  assert.equal(result.results.filter(r => r.recordId).length, 0);
  assert.equal(f.state.extracted.length, 1); assert.equal(f.state.validated.length, 0);
  assert.equal((await f.rows('worker_original_resolutions')).length, 0);
  assert.equal((await f.rows('worker_decisions')).length, 0);
  assert.equal((await f.rows('worker_exceptions'))[0].reason, 'PRIMARY_NOTICE_UNSUPPORTED');
});
test('restart fetches fresh original evidence before reusing cached AI; later closure cannot reuse a prior match', async () => {
  const f = await fixture(['matched_a']); await f.worker.run(f.sourceId);
  const first = await f.rows('worker_original_resolutions'); assert.equal(first[0].resolution.outcome, 'matched');
  const c = f.cases[0]; c.primaryHtml = originalHtml({ ...c.posting, validThrough: '2026-10-20' });
  f.advance(3_600_000);
  const id = hash(randomUUID());
  await f.worker.ref('worker_jobs', id).set(payload({ id, sourceId: f.sourceId, kind: 'detail', url: c.detailUrl,
    state: 'pending', attempts: 0, lease: null, nextAt: '2026-10-29T10:00:00.000Z' }));
  assert.deepEqual(await f.restart().runJob(f.sourceId, id), { state: 'exception', reason: 'ORIGINAL_NOTICE_CLOSED' });
  const rows = await f.rows('worker_original_resolutions'); assert.equal(rows.length, 2);
  assert.deepEqual(rows.find(r => r.id === first[0].id), first[0]);
  assert.equal(f.state.extracted.length, 1); assert.equal(f.state.validated.length, 1);
  assert.equal((await f.rows('worker_decisions')).length, 1);
});
test('crawl-off records an unsupported acquisition without employer requests or AI work', async () => {
  const f = await fixture(['matched_a']); f.source.automation.employerCrawl = false;
  await f.worker.ref('sources', f.sourceId).set(payload(f.source));
  await f.worker.run(f.sourceId);
  assert.equal((await f.rows('worker_original_resolutions'))[0].resolution.reason, 'ACQUISITION_DISABLED');
  assert.ok(f.state.requests.every(url => url.startsWith('https://recentjobs.co.za/')));
  assert.deepEqual(f.state.extracted, []); assert.deepEqual(f.state.validated, []);
});
test('expiry during validation rejects drafting even after an affirmative model answer', async () => {
  const f = await fixture(['matched_a']);
  f.advance(43_170_000); // 23:59:30 SAST; the ten-minute job lease remains valid across midnight.
  f.cases[0].primaryHtml = originalHtml({ ...f.cases[0].posting, validThrough: '2026-10-30T00:00:00+02:00' });
  f.state.afterValidation = async () => f.advance(30_000);
  const result = await f.worker.run(f.sourceId);
  assert.ok(result.results.some(r => r.reason === 'ORIGINAL_NOTICE_CLOSED'));
  assert.equal((await f.rows('worker_decisions')).length, 0);
  assert.equal((await f.rows('worker_original_resolutions'))[0].resolution.outcome, 'matched');
  assert.equal(f.state.extracted.length, 1); assert.equal(f.state.validated.length, 1);
});
test('legacy UTC expiry during validation blocks drafting and retains admitted usage and original evidence', async () => {
  const f = await fixture(['matched_a']);
  f.advance(43_170_000);
  const raw = 'Thu Oct 29 22:00:00 UTC 2026';
  f.cases[0].primaryHtml = originalMicrodataHtml({ ...f.cases[0].posting, validThrough: raw });
  f.state.afterValidation = async () => f.advance(30_000);
  const result = await f.worker.run(f.sourceId);
  assert.ok(result.results.some(r => r.reason === 'ORIGINAL_NOTICE_CLOSED'));
  assert.equal((await f.rows('worker_decisions')).length, 0);
  const receipt = (await f.rows('worker_original_resolutions'))[0].resolution;
  assert.equal(receipt.outcome, 'matched'); assert.equal(receipt.identity.validThrough, raw);
  assert.equal(receipt.deadlineEvidence.instant, '2026-10-29T22:00:00.000Z');
  assert.equal(receipt.deadlineEvidence.localDate, '2026-10-30');
  assert.equal(f.state.extracted.length, 1); assert.equal(f.state.validated.length, 1);
  assert.equal(value(await f.worker.ref('model_budgets', hash(`${f.sourceId}:2026-10-29`)).get()).calls, 2);
});
test('revocation during original acquisition propagates the authority fence without an unavailable receipt', async () => {
  const f = await fixture(['matched_a']);
  f.state.afterRobots = async url => {
    if (url.startsWith('https://careers.example/')) await f.worker.ref('workers', f.worker.actor).set({ ...f.grant, active: false });
  };
  await assert.rejects(f.worker.run(f.sourceId), { code: 'WORKER_FORBIDDEN' });
  assert.equal((await f.rows('worker_original_resolutions')).length, 0);
  assert.deepEqual(f.state.extracted, []); assert.ok(!f.state.requests.includes(f.cases[0].url));
});
test('resolver results remain private, role-checked and forbidden from automatic/programme activation', async () => {
  const f = await fixture(['matched_a']);
  assert.equal(Source.safeParse({ ...f.source, automation: { ...f.source.automation, mode: 'automatic' } }).success, false);
  const disabled = Source.parse({ ...f.source, automation: { ...f.source.automation, mode: 'disabled' } });
  await f.worker.ref('sources', f.sourceId).set(payload(disabled));
  await assert.rejects(f.worker.run(f.sourceId), { code: 'SOURCE_PAUSED' });
  await f.worker.ref('sources', f.sourceId).set(payload(f.source));
  await assert.rejects(f.restart({ programmeExtraction: true }).run(f.sourceId), { code: 'ORIGINAL_VERIFICATION_SINGLE_NOTICE_ONLY' });
  assert.deepEqual(f.state.requests, []);
  await f.worker.run(f.sourceId);
  const row = (await f.rows('worker_original_resolutions'))[0];
  assert.equal((await f.catalogue.inspect('authored-token', 'worker_original_resolutions', row.id)).resolution.outcome, 'matched');
  assert.ok((await f.catalogue.queue('authored-token', 'worker_original_resolutions')).items.some(r => r.id === row.id));
  await assert.rejects(f.catalogue.inspect('invalid', 'worker_original_resolutions', row.id), { code: 'UNAUTHORIZED' });
  await f.worker.ref('operators', f.uid).set({ active: false, roles: ['reviewer'] });
  await assert.rejects(f.catalogue.queue('authored-token', 'worker_original_resolutions'), { code: 'FORBIDDEN' });
});
