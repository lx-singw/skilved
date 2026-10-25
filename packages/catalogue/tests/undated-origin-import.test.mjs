import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { getRuntime } from '../src/runtime.mjs';
import { Catalogue } from '../src/store.mjs';
import { parseRecentJobsDetail } from '../src/adapters/recentjobs.mjs';
import { undatedOriginKeys, undatedV2Window } from '../src/undated-policy.mjs';
import { undatedHistoryHash, capturedNoticeJobs } from '../src/undated-origin-import.mjs';

const hash = s => createHash('sha256').update(s).digest('hex'), payload = r => ({ json: JSON.stringify(r) });
let runtime, store;
const now = '2026-10-25T09:00:00.000Z', firstAt = '2026-10-22T10:00:00.000Z';
before(async () => {
  Object.assign(process.env, { SKILVED_CATALOGUE_MODE: 'emulator', SKILVED_CATALOGUE_PROJECT: 'demo-skilved-origin-import' });
  runtime = await getRuntime();
  store = new Catalogue(runtime.db, { verifyIdToken: async token => {
    if (token === 'forged') throw new Error('invalid'); return { uid: token };
  } }, () => now);
  await store.ref('operators', 'source_operator').set({ active: true, roles: ['source', 'reviewer'] });
  await store.ref('operators', 'reviewer_only').set({ active: true, roles: ['reviewer'] });
});
after(async () => { await runtime?.db.terminate(); });
async function fixture() {
  const id = randomUUID(), sourceId = 'source_' + id, url = `https://recentjobs.co.za/2026/10/22/authored-${id}/`;
  const destination = `https://employer.example/apply/${id}`;
  const html = `<article class="type-post"><time class="published" datetime="2026-10-22T08:00:00Z">Original</time><h1 class="entry-title">Fictional apprenticeship</h1><div class="entry-content"><p>Fictional Workshop requires Grade 12.</p><a href="${destination}">Apply now</a></div></article>`;
  const candidate = parseRecentJobsDetail({ html, url });
  const source = { id: sourceId, revision: 2, name: 'Synthetic import', urls: ['https://recentjobs.co.za/category/apprenticeships/'],
    permission: { reference: 'Synthetic', method: 'recentjobs_html', reuse: 'Test', reviewedAt: now }, categories: ['apprenticeship'],
    owner: 'fixture', paused: false, cadenceHours: 6, maxBytes: 500000,
    automation: { mode: 'shadow', employerCrawl: false, undatedNotices: 'shadow_recent_v2', qualificationRef: 'Synthetic',
      maxArticles: 1, maxModelCallsPerDay: 12, minRequestIntervalMs: 2000, checkTtlHours: 6,
      issuers: [{ name: 'Fictional Workshop', host: 'employer.example', pathPrefix: '/apply/', evidence: 'Synthetic' }] } };
  const snapshotId = hash(sourceId + url + candidate.contentHash), recordId = hash(sourceId + candidate.sourceRecordId);
  const jobs = [{ id: 'first_' + id, sourceId, url, sourceRetrievedAt: firstAt, snapshotId, recordId,
    contentHash: candidate.contentHash, state: 'exception' },
  { id: 'accepted_' + id, sourceId, url, sourceRetrievedAt: '2026-10-23T09:00:00.000Z', snapshotId, recordId,
    contentHash: candidate.contentHash, state: 'done' }];
  const text = candidate.title + '\n' + candidate.sourceText;
  const snapshot = { id: snapshotId, sourceId, url, contentHash: candidate.contentHash, text, hash: hash(text) };
  const decision = { sourceId, recordId, decision: 'undated_shadow_pass', deadlinePolicy: 'undated_shadow_v1',
    sourcePublishedAt: new Date(candidate.sourcePublishedAtRaw).toISOString(), sourceRetrievedAt: jobs[1].sourceRetrievedAt,
    reviewExpiresAt: '2026-10-24T09:00:00.000Z' };
  await store.ref('sources', sourceId).set(payload(source));
  for (const job of jobs) await store.ref('worker_jobs', job.id).set(payload(job));
  await store.ref('snapshots', snapshotId).set(payload(snapshot));
  await store.ref('worker_decisions', jobs[1].id).set(payload(decision));
  await store.ref('drafts', recordId).set(payload({ id: recordId, revision: 7, expires: decision.reviewExpiresAt }));
  await store.ref('model_budgets', sourceId).set(payload({ sourceId, calls: 7 }));
  const review = { sourceId, sourceRevision: 2, url, html, expectedFirstJobId: jobs[0].id,
    decisionJobId: jobs[1].id, expectedHistoryHash: undatedHistoryHash(jobs) };
  return { source, candidate, jobs, snapshot, decision, review, keys: undatedOriginKeys(candidate),
    run: input => store.importUndatedOrigin('source_operator', input ?? review, 'Reviewed synthetic persisted history') };
}
const read = async (c, id) => JSON.parse((await store.ref(c, id).get()).data().json);

test('authenticated current source role required; malformed review and stale revisions cannot import', async () => {
  const f = await fixture();
  for (const token of ['', 'forged', 'guest', 'reviewer_only'])
    await assert.rejects(store.importUndatedOrigin(token, f.review, 'Synthetic review'), /UNAUTHORIZED|FORBIDDEN/);
  await assert.rejects(f.run({ ...f.review, sourceRevision: 1 }), /SOURCE_CHANGED/);
  await assert.rejects(f.run({ ...f.review, firstSeenAt: now }), /unrecognized_keys/);
  assert.equal((await store.ref('worker_notice_origins', f.keys[0]).get()).exists, false);
});

test('import binds earliest failed capture to both keys atomically and preserves drafts, jobs and budgets', async () => {
  const f = await fixture(), beforeDraft = await read('drafts', f.jobs[0].recordId), result = await f.run();
  assert.equal(result.origin.firstSeenAt, firstAt); assert.equal(result.origin.firstContentHash, f.candidate.contentHash);
  assert.equal(result.freshCheck, false); assert.equal(result.scope, 'earliest_persisted_worker_acquisition');
  for (const key of f.keys) assert.deepEqual(await read('worker_notice_origins', key), result.origin);
  assert.deepEqual(await read('drafts', f.jobs[0].recordId), beforeDraft);
  assert.deepEqual(await read('worker_jobs', f.jobs[0].id), f.jobs[0]);
  assert.equal((await read('model_budgets', f.source.id)).calls, 7);
  const receipt = await read('worker_origin_imports', f.keys[0]); assert.equal(receipt.actor, 'source_operator');
  assert.throws(() => undatedV2Window(f.source, f.candidate, now, firstAt, result.origin), /UNDATED_NOTICE_FRESHNESS_REQUIRED/);
  const fresh = undatedV2Window(f.source, f.candidate, now, now, result.origin);
  assert.equal(fresh.firstSeenAt, firstAt); assert.equal(fresh.reviewExpiresAt, '2026-10-25T15:00:00.000Z');
  assert.equal(fresh.availability, 'unverified');
});

test('omitting the failed capture, forged archive metadata, changed history and missing snapshots fail closed', async () => {
  for (const change of ['omit_failed', 'retime', 'route', 'text', 'snapshot', 'new_capture', 'partial_capture', 'decision']) {
    const f = await fixture(), review = structuredClone(f.review);
    if (change === 'omit_failed') { review.expectedFirstJobId = f.jobs[1].id; review.expectedHistoryHash = undatedHistoryHash([f.jobs[1]]); }
    if (change === 'retime') review.html = review.html.replace('2026-10-22T08:00:00Z', '2026-10-23T08:00:00Z');
    if (change === 'route') review.html = review.html.replace('/apply/', '/replacement/');
    if (change === 'text') review.html = review.html.replace('Grade 12', 'Grade 10');
    if (change === 'snapshot') await store.ref('snapshots', f.snapshot.id).delete();
    if (['new_capture', 'partial_capture'].includes(change)) await store.ref('worker_jobs', 'new_' + f.source.id).set(payload({
      ...f.jobs[0], ...(change === 'partial_capture' ? { snapshotId: null } : {}) }));
    if (change === 'decision') await store.ref('worker_decisions', f.jobs[1].id).set(payload({ ...f.decision, sourcePublishedAt: now }));
    await assert.rejects(f.run(review), /UNDATED_HISTORY_CONFLICT/, change);
    assert.equal((await store.ref('worker_notice_origins', f.keys[0]).get()).exists, false);
  }
});

test('paused, non-V2, unqualified and cross-source histories cannot be imported', async () => {
  for (const change of ['pause', 'v1', 'issuer', 'source']) {
    const f = await fixture(), source = structuredClone(f.source);
    if (change === 'pause') source.paused = true;
    if (change === 'v1') source.automation.undatedNotices = 'shadow_recent';
    if (change === 'issuer') source.automation.issuers = [];
    if (change === 'source') await store.ref('worker_jobs', f.jobs[0].id).set(payload({ ...f.jobs[0], sourceId: 'different_source' }));
    await store.ref('sources', source.id).set(payload(source));
    await assert.rejects(f.run(), /SOURCE_POLICY_REQUIRED|UNDATED_NOTICE_ORIGIN_CONFLICT|UNDATED_HISTORY_CONFLICT|ISSUER_RELATIONSHIP_UNQUALIFIED/);
  }
});

test('existing partial bindings and concurrent or repeated imports never overwrite an origin', async () => {
  const f = await fixture();
  await store.ref('worker_notice_origins', f.keys[0]).set(payload({ sentinel: 'immutable' }));
  await assert.rejects(f.run(), /UNDATED_NOTICE_ORIGIN_CONFLICT/);
  assert.equal((await store.ref('worker_notice_origins', f.keys[1]).get()).exists, false);
  const g = await fixture(), outcomes = await Promise.allSettled([g.run(), g.run()]);
  assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1);
  await assert.rejects(g.run(), /UNDATED_NOTICE_ORIGIN_CONFLICT/);
  assert.deepEqual(await read('worker_notice_origins', g.keys[0]), await read('worker_notice_origins', g.keys[1]));
});

test('history capacity is explicit and refuses a truncated scan', async () => {
  const tx = { get: async query => { assert.equal(query.limitValue, 1001); return { size: 1001, docs: [] }; } };
  const db = { collection: () => ({ limit: limitValue => ({ limitValue }) }) };
  await assert.rejects(capturedNoticeJobs(tx, db, 'https://recentjobs.co.za/'), /UNDATED_HISTORY_CAPACITY/);
});
