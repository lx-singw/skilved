import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Source } from '../src/schemas.mjs';
import { makeUndatedOrigin, undatedTimingEvidence } from '../src/undated-policy.mjs';
import { preflightCandidate, draftGate, publicationGate } from '../src/worker-policy.mjs';
import { parseRecentJobsDetail } from '../src/adapters/recentjobs.mjs';
import { makeRecord } from '../../types/tests/fixtures/opportunities.mjs';

const now = '2026-10-22T14:00:00.000Z', acquired = '2026-10-22T13:00:00.000Z';
function fixture(wording = '') {
  const record = makeRecord(); record.deadline = { ...record.deadline, state: 'not_stated', value: null, originalText: null };
  const source = { id: 'authored_v2', revision: 1, name: 'Synthetic only', urls: ['https://recentjobs.co.za/category/apprenticeships/'],
    permission: { reference: 'Synthetic', method: 'recentjobs_html', reuse: 'Synthetic', reviewedAt: now },
    categories: ['apprenticeship'], owner: 'fixture', paused: false, cadenceHours: 6, maxBytes: 500000,
    automation: { mode: 'shadow', undatedNotices: 'shadow_recent_v2', employerCrawl: false, qualificationRef: 'Synthetic',
      maxArticles: 1, maxModelCallsPerDay: 10, minRequestIntervalMs: 2000, checkTtlHours: 6,
      issuers: [{ name: record.issuer.value, host: 'issuer.example', pathPrefix: '/apply', evidence: 'Synthetic' }] } };
  const url = 'https://recentjobs.co.za/2026/10/22/authored-apprentice/';
  const candidate = parseRecentJobsDetail({ url, html: `<article class="type-post"><time class="published" datetime="2026-10-22T08:00:00Z">Synthetic</time><h1 class="entry-title">Authored apprenticeship</h1><div class="entry-content"><p>Fictional apprentice requires Grade 12.</p><p>${wording}</p><a href="https://issuer.example/apply">Apply now</a></div></article>` });
  const origin = makeUndatedOrigin(source, candidate, record.issuer.value, acquired, now), assessment = { supported: true, issues: [] };
  return { source, candidate, record, origin, assessment, gate: (at = now, retrieved = acquired, bound = origin) =>
    draftGate(source, candidate, record, null, assessment, at, retrieved, bound) };
}

test('V2 is an explicit shadow-only opt-in with cadence and TTL bounded by six hours', () => {
  const f = fixture(); assert.ok(Source.safeParse(f.source).success);
  for (const change of [s => { s.automation.mode = 'automatic'; }, s => { s.automation.mode = 'disabled'; },
    s => { s.automation.checkTtlHours = 7; }, s => { s.cadenceHours = 7; }]) {
    const s = structuredClone(f.source); change(s); assert.equal(Source.safeParse(s).success, false);
  }
  assert.throws(() => preflightCandidate(f.source, f.candidate, now, acquired), /UNDATED_NOTICE_ORIGIN_REQUIRED/);
  assert.throws(() => publicationGate(f.source, f.candidate, f.record, null, f.assessment, now), /NOTICE_PRECISION_UNSUPPORTED/);
});

test('missing and narrowly explicit unknown dates retain evidence without inventing a deadline', () => {
  for (const text of ['', 'Closing date: not specified', 'CLOSING DATE — NOT STATED.', 'Application deadline: Not specified!',
    'Closing: not stated', 'Closing date:<br>not specified']) {
    const f = fixture(text), before = structuredClone(f.record), w = f.gate();
    assert.equal(w.deadlinePolicy, 'undated_shadow_v2'); assert.equal(w.reviewExpiresAt, '2026-10-22T19:00:00.000Z');
    assert.equal(w.availability, 'unverified'); assert.equal(w.firstSeenAt, acquired);
    assert.equal(w.timingEvidence.state, text ? 'explicitly_unspecified' : 'absent');
    assert.ok(!text || w.timingEvidence.sourceQuote); assert.deepEqual(f.record, before);
  }
});

test('whole-source timing checks reject competing, relative, malformed, rolling and misleading unknown wording', () => {
  for (const text of ['Closing date: not specified yet', 'Closing date: not stated (apply soon)', 'Closing date: not stated, until filled',
    'Closing date: not stated<br>Closing date: 31 February 2026', 'Closing date: not stated<br>Apply by tomorrow',
    'Closing date: not specified<br>Applications close next Friday', 'Closing date: not stated<br>Closing: not stated',
    'Deadline: TBC', 'Deadline: 2026-02-30', 'Open until filled', 'Applications accepted on a rolling basis',
    'Closing date:<br>not specified<br>Deadline: TBC', 'Closing date: not specified<br>Applications are open until next month',
    'Closing date: not specified<br>Applications will close next Friday', 'Apply before tomorrow',
    'Recruitment ends on Friday', 'Cut-off: not stated', 'Submit no later than Friday']) {
    const f = fixture(text); assert.throws(() => f.gate(), /NOTICE_PRECISION_UNSUPPORTED/, text);
  }
  for (const text of ['Applications are closed', 'Position has been filled', 'No longer accepting applications'])
    assert.throws(() => fixture(text).gate(), /NOTICE_NOT_OPEN/, text);
  const f = fixture(); f.candidate.deadlineCandidates = [{ localDate: null, originalText: 'Unrecognized deadline' }];
  assert.throws(() => undatedTimingEvidence(f.candidate), /NOTICE_PRECISION_UNSUPPORTED/);
});

test('six-hour expiry is exact, can be shorter, and never exceeds original publication plus seven days', () => {
  const f = fixture(); assert.equal(f.gate('2026-10-22T18:59:59.999Z').reviewExpiresAt, '2026-10-22T19:00:00.000Z');
  assert.throws(() => f.gate('2026-10-22T19:00:00.000Z'), /UNDATED_NOTICE_FRESHNESS_REQUIRED/);
  f.source.automation.checkTtlHours = 1;
  assert.throws(() => f.gate(), /UNDATED_NOTICE_FRESHNESS_REQUIRED/);
  f.source.automation.checkTtlHours = 6;
  const last = '2026-10-29T07:00:00.000Z';
  assert.equal(f.gate('2026-10-29T07:59:59.999Z', last).reviewExpiresAt, '2026-10-29T08:00:00.000Z');
  assert.throws(() => f.gate('2026-10-29T08:00:00.000Z', last), /UNDATED_NOTICE_FRESHNESS_REQUIRED/);
});

test('immutable bindings reject new source IDs, routes, titles, repost URLs, issuer changes and retimed publication', () => {
  for (const mutate of [f => { f.source.id = 'replacement_source'; }, f => { f.candidate.sourceUrl += 'repost/'; },
    f => { f.candidate.title += ' new intake'; }, f => { f.candidate.applicationCandidates[0].destination += '/next'; },
    f => { f.candidate.sourcePublishedAtRaw = '2026-10-22T09:00:00Z'; }, f => { f.source.automation.issuers[0].name = 'Other issuer'; }]) {
    const f = fixture(); mutate(f); assert.throws(() => f.gate(), /UNDATED_NOTICE_ORIGIN_CONFLICT/);
  }
  const f = fixture(); f.source.revision++; f.candidate.contentHash = createHash('sha256').update('updated body').digest('hex');
  assert.equal(f.gate().firstSeenAt, acquired); assert.equal(f.origin.firstContentHash === f.candidate.contentHash, false);
});

test('invalid acquisition/publication chronology and corrupted origins cannot create a window', () => {
  for (const at of [undefined, '2026-10-22', '2026-10-22T14:00:00.001Z', '2026-10-22T07:00:00.000Z']) {
    const f = fixture(); assert.throws(() => draftGate(f.source, f.candidate, f.record, null, f.assessment, now, at, f.origin),
      /UNDATED_NOTICE_FRESHNESS_REQUIRED|UNDATED_NOTICE_ORIGIN_CONFLICT/);
  }
  for (const published of [null, '2026-02-30T08:00:00Z', '2026-10-22T25:00:00Z', '2026-10-22T14:00:00Z']) {
    const f = fixture(); f.candidate.sourcePublishedAtRaw = published; assert.throws(() => f.gate(), /UNDATED_NOTICE_FRESHNESS_REQUIRED/);
  }
  for (const mutate of [o => { o.version = 1; }, o => { o.firstSeenAt = '2026-10-22T13:00:00.001Z'; },
    o => { o.firstContentHash = 'bad'; }, o => { o.firstSeenAt = '2026-10-22T07:00:00.000Z'; }]) {
    const f = fixture(); mutate(f.origin); assert.throws(() => f.gate(), /UNDATED_NOTICE_ORIGIN_CONFLICT/);
  }
});

test('existing original-route, material-fact, model and employer-crawl gates remain required', () => {
  for (const mutate of [f => { f.record.deadline = makeRecord().deadline; }, f => { f.assessment.supported = false; },
    f => { f.record.requirements.expression = { op: 'unknown' }; }, f => { f.record.applicationRoute.value.destination += '/other'; },
    f => { f.source.automation.employerCrawl = true; }, f => { f.candidate.applicationInstructions = ['Hand deliver']; },
    f => { f.candidate.issues.push('programme_subject_scope_review_required'); }]) {
    const f = fixture(); mutate(f); assert.throws(() => f.gate());
  }
  const f = fixture(); f.candidate.deadlineCandidates = [{ localDate: '2026-10-30' }]; f.record.deadline = makeRecord().deadline;
  assert.deepEqual(f.gate(), publicationGate(f.source, f.candidate, f.record, null, f.assessment, now));
});
