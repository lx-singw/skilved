import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { RecentJobsWorker } from '../src/recentjobs-worker.mjs';
import { discoveryChunk } from '../src/recentjobs-discovery.mjs';
import { Source } from '../src/schemas.mjs';
import { Catalogue } from '../src/store.mjs';
import { RECENTJOBS_INDEX, assertSourceTarget } from '../src/worker-policy.mjs';
import { getRuntime } from '../src/runtime.mjs';
import { syntheticExtraction } from './fixtures/recentjobs-model.mjs';

const hash = s => createHash('sha256').update(s).digest('hex');
const payload = s => ({ json: JSON.stringify(s) });
const value = s => s.exists ? JSON.parse(s.data().json) : null;
const pageUrl = page => page === 1 ? RECENTJOBS_INDEX : `${RECENTJOBS_INDEX}page/${page}/`;
const notice = n => `https://recentjobs.co.za/2026/10/01/authored-apprentice-${n}/`;
const html = await readFile(new URL('./fixtures/recentjobs-synthetic.html', import.meta.url), 'utf8');
const listing = (numbers, next = null) => `<div class="articles-wrap">${numbers.map(n =>
  `<article class="type-post"><h2 class="entry-title"><a href="${notice(n)}">Authored apprentice ${n}</a></h2></article>`).join('')}</div>` +
  (next ? `<nav class="posts-navigation"><a href="${pageUrl(next)}">Older posts</a></nav>` : '');
let db;
before(async () => {
  process.env.SKILVED_CATALOGUE_MODE = 'emulator';
  process.env.SKILVED_CATALOGUE_PROJECT = 'demo-skilved-discovery';
  db = (await getRuntime()).db;
});
after(async () => { await db?.terminate(); });

async function fixture({ maxPages = 2, chunkSize = 1 } = {}) {
  let now = '2026-10-01T10:00:00.000Z';
  const sourceId = `publisher_${randomUUID()}`, principal = `${randomUUID()}@example.test`;
  const pages = new Map([[RECENTJOBS_INDEX, listing([1, 2], 2)], [pageUrl(2), listing([1, 3])]]);
  const employers = ['Fictional Workshop', 'Imaginary Works', 'Unqualified Works'];
  const requests = [], extracted = [];
  const options = { now: () => now, sleep: async () => {},
    fetcher: async (_source, url) => {
      requests.push(url);
      if (url.endsWith('/robots.txt')) return { url, text: 'User-agent: *\nAllow: /' };
      if (pages.has(url)) return { url, text: pages.get(url) };
      const index = [1, 2, 3].findIndex(n => url === notice(n));
      assert.ok(index >= 0, `Unexpected acquisition: ${url}`);
      return { url, text: html.replaceAll('Fictional Workshop', employers[index])
        .replaceAll('https://employer.example/apply', `https://employer-${index}.example/apply`) };
    },
    extractor: async candidate => {
      extracted.push(candidate.sourceUrl);
      const index = [1, 2, 3].findIndex(n => candidate.sourceUrl === notice(n));
      const extraction = JSON.parse(JSON.stringify(syntheticExtraction()).replaceAll('Fictional Workshop', employers[index]));
      return { extraction, provenance: { usage: { totalTokens: 20 } } };
    },
    validator: async () => ({ supported: true, issues: [], evidence: [{ source: 'recentjobs',
      quote: 'Grade 12 with Mathematics OR N3 Electrical' }], provenance: { usage: { totalTokens: 20 } } }),
  };
  const source = Source.parse({ id: sourceId, revision: 1, name: 'Authored publisher batch', urls: [RECENTJOBS_INDEX],
    permission: { reference: 'Authored publisher policy', method: 'recentjobs_html', reuse: 'Synthetic evidence only', reviewedAt: now },
    categories: ['apprenticeship'], owner: 'fixture_owner', paused: false, cadenceHours: 24, maxBytes: 500000,
    automation: { mode: 'shadow', employerCrawl: false, qualificationRef: 'Authored tests only', maxArticles: chunkSize,
      discovery: { maxPages }, maxModelCallsPerDay: 20, minRequestIntervalMs: 2000, checkTtlHours: 24,
      issuers: employers.slice(0, 2).map((name, i) => ({ name, host: `employer-${i}.example`, pathPrefix: '/apply', evidence: 'Authored trust evidence' })) } });
  const worker = new RecentJobsWorker(db, principal, options);
  const uid = `operator_${randomUUID()}`;
  const catalogue = new Catalogue(db, { verifyIdToken: async token => {
    if (token !== 'authored-token') throw new Error('Invalid authored token');
    return { uid };
  } }, options.now);
  await worker.ref('operators', uid).set({ active: true, roles: ['source', 'reviewer'] });
  await catalogue.registerSource('authored-token', source, null, 'Register one authored publisher');
  const grant = { principal, active: true, sources: [sourceId], roles: ['ingest'] };
  await worker.ref('workers', worker.actor).set(grant);
  return { worker, source, sourceId, grant, requests, extracted, pages, catalogue, uid,
    restart: (overrides = {}) => new RecentJobsWorker(db, principal, { ...options, ...overrides }),
    advance: ms => { now = new Date(Date.parse(now) + ms).toISOString(); },
    cursor: async () => value(await worker.ref('worker_discovery', sourceId).get()),
    jobs: async () => (await db.collection('m0_worker_jobs').get()).docs.map(value).filter(j => j.sourceId === sourceId) };
}

test('one publisher and machine grant discover unseen notices across employers, deduplicate and isolate an unqualified route', async () => {
  const f = await fixture();
  const result = await f.worker.run(f.sourceId);
  assert.equal(result.results.filter(r => r.recordId).length, 2);
  assert.ok(result.results.some(r => r.reason === 'ISSUER_RELATIONSHIP_UNQUALIFIED'));
  assert.deepEqual(new Set(f.extracted), new Set([notice(1), notice(2)]));
  const jobs = await f.jobs();
  assert.equal(jobs.filter(j => j.kind === 'detail').length, 3);
  assert.equal(jobs.filter(j => j.kind === 'discover').length, 4);
  const cursor = await f.cursor();
  assert.equal(cursor.state, 'complete'); assert.equal(cursor.stop, 'end');
  assert.deepEqual([cursor.listed, cursor.queued, cursor.alreadyQueued], [4, 3, 1]);
  assert.equal(f.requests.filter(url => url === RECENTJOBS_INDEX).length, 1);
  assert.equal(f.requests.filter(url => url === pageUrl(2)).length, 1);
  assert.ok(f.requests.every(url => url.startsWith('https://recentjobs.co.za/')));
  const calls = f.requests.length;
  assert.deepEqual(await f.restart().run(f.sourceId), { results: [] });
  assert.equal(f.requests.length, calls); assert.equal(f.extracted.length, 2);
  assert.deepEqual(value(await f.worker.ref('sources', f.sourceId).get()), f.source);
  assert.deepEqual(value(await f.worker.ref('source_versions', hash(`${f.sourceId}:1`)).get()), f.source);
  assert.deepEqual((await f.worker.ref('workers', f.worker.actor).get()).data(), f.grant);
  for (const resultRow of result.results.filter(r => r.recordId)) {
    const draft = value(await f.worker.ref('drafts', resultRow.recordId).get());
    assert.equal(draft.publication.approved, false); assert.equal(resultRow.published, false);
    assert.ok(draft.applicationRoute.value.destination.startsWith('https://employer-'));
    assert.equal((await f.worker.ref('public', resultRow.recordId).get()).exists, false);
  }
  const spentRef = f.worker.ref('model_budgets', hash(`${f.sourceId}:2026-10-01`));
  const spent = value(await spentRef.get()); assert.equal(spent.calls, 4);
  f.advance(24 * 3_600_000);
  const nextCycle = await f.restart().run(f.sourceId);
  assert.deepEqual(new Set(nextCycle.results.filter(r => r.recordId).map(r => r.recordId)),
    new Set(result.results.filter(r => r.recordId).map(r => r.recordId)));
  assert.equal(f.extracted.length, 2, 'Unchanged observations reuse the versioned extraction cache');
  assert.deepEqual(value(await spentRef.get()), spent, 'Discovery cannot reset earlier source spending');
  assert.equal((await f.worker.ref('model_budgets', hash(`${f.sourceId}:2026-10-02`)).get()).exists, false);
});

test('captured page and cursor survive lease expiry, restart and a moving listing without skipping remaining cards', async () => {
  const f = await fixture();
  const id = await f.worker.schedule(f.sourceId), claim = await f.worker.claim(f.sourceId, id);
  const captured = await f.worker.discoveryPage(claim);
  f.pages.set(RECENTJOBS_INDEX, listing([99]));
  f.advance(11 * 60_000);
  const restarted = f.restart();
  const first = await restarted.runJob(f.sourceId, id);
  assert.equal(first.discoverySnapshotId, captured.id);
  assert.equal(first.discovered, 1);
  await restarted.run(f.sourceId);
  assert.deepEqual(new Set((await f.jobs()).filter(j => j.kind === 'detail').map(j => j.url)), new Set([notice(1), notice(2), notice(3)]));
  assert.equal(f.requests.filter(url => url === RECENTJOBS_INDEX).length, 1);
  assert.deepEqual(value(await f.worker.ref('worker_discovery_pages', captured.id).get()), captured);
  assert.equal((await f.cursor()).state, 'complete');
});

test('active discovery keeps its cycle across cadence boundaries and concurrent scheduling', async () => {
  const f = await fixture();
  const first = await f.worker.schedule(f.sourceId);
  f.advance(24 * 3_600_000);
  assert.deepEqual(await Promise.all([f.worker.schedule(f.sourceId), f.restart().schedule(f.sourceId)]), [first, first]);
  assert.equal((await f.jobs()).length, 1);
  assert.equal((await f.cursor()).cycleId, first);
  await f.worker.run(f.sourceId);
  const next = await f.worker.schedule(f.sourceId);
  assert.notEqual(next, first); assert.equal((await f.cursor()).cycleId, next);
});

test('page cap finishes the selected pages without fetching the next page or silently truncating cards', async () => {
  const f = await fixture({ maxPages: 1 });
  await f.worker.run(f.sourceId);
  assert.equal((await f.jobs()).filter(j => j.kind === 'detail').length, 2);
  assert.equal((await f.cursor()).stop, 'page_limit');
  assert.ok(!f.requests.includes(pageUrl(2)));
});

test('large discovery resumes across bounded invocations even when its cursor is outside the first 50 queued rows', async () => {
  const f = await fixture({ maxPages: 5, chunkSize: 10 });
  for (let page = 1; page <= 5; page++) f.pages.set(pageUrl(page),
    listing(Array.from({ length: 50 }, (_, i) => (page - 1) * 50 + i + 1), page < 5 ? page + 1 : null));
  const worker = f.restart({ fetcher: async (_source, url) => {
    f.requests.push(url);
    if (url.endsWith('/robots.txt')) return { url, text: 'User-agent: *\nAllow: /' };
    if (f.pages.has(url)) return { url, text: f.pages.get(url) };
    assert.match(url, /\/authored-apprentice-\d+\/$/);
    return { url, text: html.replace('30 October 2026', '01 January 2026') };
  } });
  const first = await worker.run(f.sourceId);
  assert.equal(first.results.length, 11); assert.equal((await f.cursor()).state, 'pending');
  // Every row in this saturated query is a detail job. Progress still has to
  // resume by its durable cursor, rather than relying on query document order.
  const cursor = await f.cursor();
  const batch = db.batch();
  for (let i = 0; i < 51; i++) {
    const id = `000_queue_blocker_${randomUUID()}`;
    batch.set(worker.ref('worker_jobs', id), payload({ id, sourceId: f.sourceId, kind: 'detail', url: notice(1),
      bucket: cursor.bucket, state: 'pending', attempts: 0, lease: null, nextAt: '2026-10-02T10:00:00.000Z' }));
    batch.set(worker.ref('worker_queue', id), { sourceId: f.sourceId });
  }
  await batch.commit();
  const firstRows = await db.collection('m0_worker_queue').where('sourceId', '==', f.sourceId).limit(50).get();
  assert.ok(!firstRows.docs.some(d => d.id === cursor.currentJobId));
  assert.equal((await f.restart({ fetcher: worker.fetcher }).run(f.sourceId)).results.length, 11);
  assert.equal((await f.cursor()).state, 'pending');
  await f.restart({ fetcher: worker.fetcher }).run(f.sourceId);
  const completed = await f.cursor();
  assert.equal(completed.state, 'complete'); assert.equal(completed.queued, 250); assert.equal(completed.listed, 250);
  const jobs = await f.jobs();
  assert.equal(jobs.filter(j => j.discoveryCycle).length, 25);
  assert.equal(new Set(jobs.filter(j => j.kind === 'detail').map(j => j.url)).size, 250);
  assert.equal(f.requests.filter(url => !url.endsWith('/robots.txt') && f.pages.has(url)).length, 5);
  assert.deepEqual(f.extracted, []);
});

test('pagination honors robots and terminal discovery failures release the cycle for the next cadence', async () => {
  const f = await fixture({ chunkSize: 10 });
  const root = await f.worker.schedule(f.sourceId);
  await f.worker.runJob(f.sourceId, root);
  const next = (await f.cursor()).currentJobId;
  f.pages.set('https://recentjobs.co.za/robots.txt', 'User-agent: *\nDisallow: /category/apprenticeships/page/');
  const restarted = new RecentJobsWorker(db, f.grant.principal, { now: () => '2026-10-01T10:01:00.000Z', sleep: async () => {},
    fetcher: async (_source, url) => {
      f.requests.push(url); assert.ok(url.endsWith('/robots.txt'));
      return { url, text: f.pages.get(url) };
    } });
  assert.deepEqual(await restarted.runJob(f.sourceId, next), { state: 'exception', reason: 'ROBOTS_DISALLOWED' });
  assert.equal((await f.cursor()).state, 'exception'); assert.ok(!f.requests.includes(pageUrl(2)));
  f.advance(24 * 3_600_000);
  assert.notEqual(await f.worker.schedule(f.sourceId), root);
  assert.equal((await f.cursor()).state, 'pending');
});

test('attempt exhaustion updates the discovery checkpoint rather than wedging scheduling', async () => {
  const f = await fixture();
  const id = await f.worker.schedule(f.sourceId), ref = f.worker.ref('worker_jobs', id);
  const job = value(await ref.get()); await ref.set(payload({ ...job, attempts: 3 }));
  assert.deepEqual(await f.worker.runJob(f.sourceId, id), { state: 'exception', reason: 'ATTEMPTS_EXHAUSTED' });
  assert.equal((await f.cursor()).state, 'exception');
  assert.equal(await f.worker.schedule(f.sourceId), id);
});

test('cursor rejects corrupt saved pages, disallowed listing origins, offsets and bounds before queue writes', async () => {
  const f = await fixture();
  const id = await f.worker.schedule(f.sourceId), claim = await f.worker.claim(f.sourceId, id);
  const saved = await f.worker.discoveryPage(claim);
  const changed = { ...saved, list: { ...saved.list, articles: [{ sourceUrl: notice(99), title: 'Changed' }] } };
  await f.worker.ref('worker_discovery_pages', saved.id).set(payload(changed));
  await assert.rejects(f.worker.discoveryPage(claim), { code: 'DISCOVERY_STATE_INVALID' });
  assert.equal((await f.jobs()).length, 1);
  for (const url of [pageUrl(2) + '?x=1', pageUrl(2) + '#x', 'https://evil.example/category/apprenticeships/',
    RECENTJOBS_INDEX + 'page/1/', 'https://recentjobs.co.za/category/learnerships/page/2/'])
    assert.throws(() => assertSourceTarget(url, 'index'), { code: 'UNSAFE_URL' });
  for (const offset of [-1, 0.5, 2]) assert.throws(() => discoveryChunk(f.source, { ...claim, discoveryOffset: offset }, saved.list), { code: 'DISCOVERY_STATE_INVALID' });
  assert.throws(() => discoveryChunk(f.source, { ...claim, url: pageUrl(3) }, { ...saved.list, sourceUrl: pageUrl(3) }), { code: 'DISCOVERY_STATE_INVALID' });
  for (const maxPages of [0, 6, 1.5]) assert.equal(Source.safeParse({ ...f.source,
    automation: { ...f.source.automation, discovery: { maxPages } } }).success, false);
  assert.equal(Source.safeParse(f.source).success, true);
});

test('legacy sources retain first-page bounded behavior until explicitly opted into publisher discovery', async () => {
  const f = await fixture(); delete f.source.automation.discovery;
  await f.worker.ref('sources', f.sourceId).set(payload(f.source));
  await f.worker.run(f.sourceId);
  assert.equal((await f.jobs()).filter(j => j.kind === 'detail').length, 1);
  assert.equal(await f.cursor(), null);
  assert.ok(!f.requests.includes(pageUrl(2)));
});

test('discovery progress and immutable page observations are available only through authenticated operator reads', async () => {
  const f = await fixture(); await f.worker.run(f.sourceId);
  const cursor = await f.catalogue.inspect('authored-token', 'worker_discovery', f.sourceId);
  assert.equal(cursor.queued, 3);
  assert.ok((await f.catalogue.queue('authored-token', 'worker_discovery')).items.some(row => row.sourceId === f.sourceId));
  const completed = value(await f.worker.ref('worker_jobs', cursor.currentJobId).get());
  const page = await f.catalogue.inspect('authored-token', 'worker_discovery_pages', completed.discoverySnapshotId);
  assert.equal(page.sourceId, f.sourceId); assert.equal(page.url, pageUrl(2));
  await assert.rejects(f.catalogue.inspect('invalid-token', 'worker_discovery', f.sourceId), { code: 'UNAUTHORIZED' });
  await f.worker.ref('operators', f.uid).set({ active: false, roles: ['reviewer'] });
  await assert.rejects(f.catalogue.queue('authored-token', 'worker_discovery'), { code: 'FORBIDDEN' });
  await assert.rejects(f.catalogue.inspect('authored-token', 'worker_discovery_pages', completed.discoverySnapshotId), { code: 'FORBIDDEN' });
});
