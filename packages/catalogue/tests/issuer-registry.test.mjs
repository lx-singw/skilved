import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { Catalogue } from '../src/store.mjs';
import { RecentJobsWorker } from '../src/recentjobs-worker.mjs';
import { EmployerRelationship, Source } from '../src/schemas.mjs';
import { approvedRoute, RECENTJOBS_INDEX } from '../src/worker-policy.mjs';
import { readRelationship, relationshipDocument, lookupIssuerRelationships } from '../src/issuer-registry.mjs';
import { getRuntime } from '../src/runtime.mjs';
import { originalFixture, originalHtml } from './fixtures/original-notices.mjs';
import { syntheticExtraction } from './fixtures/recentjobs-model.mjs';

const hash = v => createHash('sha256').update(v).digest('hex');
const payload = v => ({ json: JSON.stringify(v) });
const value = snap => snap.exists ? JSON.parse(snap.data().json) : null;
let db;
before(async () => {
  process.env.SKILVED_CATALOGUE_MODE = 'emulator'; process.env.SKILVED_CATALOGUE_PROJECT = 'demo-skilved-registry';
  db = (await getRuntime()).db;
});
after(async () => { await db?.terminate(); });

async function fixture({ publisherCount = 1, kinds = ['a','b','unknown'], registry = true } = {}) {
  const key = randomUUID(), host = `careers-${key}.example`, principal = `${key}@example.test`, uid = `operator_${key}`;
  let now = '2026-10-29T10:00:00.000Z';
  const templates = ['a','b','unknown'].map((kind, i) => originalFixture({ host,
    issuer: kind === 'b' ? 'Imaginary Works' : kind === 'unknown' ? 'Unqualified Forge' : 'Fictional Workshop',
    path: `/tenant-${kind}/job/${100 + i}/`, reference: `AP-${100 + i}`, slug: `authored-${key}-${kind}` }));
  const notices = new Map(templates.map((c, i) => [ ['a','b','unknown'][i], c ]));
  const cases = kinds.map(kind => notices.get(kind));
  const relationships = templates.slice(0, 2).map((c, i) => EmployerRelationship.parse({ id: `trust_${key}_${i}`, revision: 1,
    state: 'qualified', reviewedAt: now, expiresAt: '2026-11-01T10:00:00.000Z', categories: ['apprenticeship'],
    route: { ...c.source.automation.issuers[0], pathPrefix: `/tenant-${['a','b'][i]}/job/` } }));
  const state = { requests: [], extracted: [], validated: [], onExtract: null, onValidate: null, onRobots: null };
  const options = { now: () => now, sleep: async () => {}, fetcher: async (_source, url) => {
    state.requests.push(url);
    if (url.endsWith('/robots.txt')) { await state.onRobots?.(url); return { url, text: 'User-agent: *\nAllow: /' }; }
    if (url === RECENTJOBS_INDEX) return { url, text: `<div class="articles-wrap">${cases.map(c =>
      `<article class="type-post"><h2 class="entry-title"><a href="${c.detailUrl}">${c.candidate.title}</a></h2></article>`).join('')}</div>` };
    const detail = cases.find(c => c.detailUrl === url); if (detail) return { url, text: detail.detailHtml };
    const original = cases.find(c => c.url === url); assert.ok(original, `Unexpected acquisition ${url}`);
    return { url, text: originalHtml(original.posting) };
  }, extractor: async candidate => {
    state.extracted.push(candidate.sourceUrl); await state.onExtract?.();
    const c = cases.find(c => c.detailUrl === candidate.sourceUrl);
    const x = JSON.parse(JSON.stringify(syntheticExtraction()).replaceAll('Fictional Workshop', c.posting.hiringOrganization.name));
    const reference = candidate.sourceText.match(/^Reference: (.+)$/m);
    x.intake = { state: 'stated', value: reference[1], quote: reference[0] };
    return { extraction: x, provenance: { usage: { inputTokens: 10, totalTokens: 20 } } };
  }, validator: async ({ primary }) => {
    state.validated.push(primary.issuer); await state.onValidate?.();
    return { supported: true, issues: [], evidence: [{ source: 'recentjobs', quote: 'Grade 12 with Mathematics OR N3 Electrical' },
      { source: 'primary', quote: primary.issuer }], provenance: { usage: { inputTokens: 10, totalTokens: 20 } } };
  } };
  const worker = new RecentJobsWorker(db, principal, options);
  const catalogue = new Catalogue(db, { verifyIdToken: async token => { if (token !== 'authored-token') throw Error(); return { uid }; } }, options.now);
  await worker.ref('operators', uid).set({ active: true, roles: ['source','reviewer'] });
  if (registry) for (const r of relationships) await catalogue.registerEmployerRelationship('authored-token', r, null, 'Authored shared issuer relationship');
  const sources = [];
  for (let i = 0; i < publisherCount; i++) {
    const source = Source.parse({ ...templates[0].source, id: `publisher_${key}_${i}`, automation: {
      ...templates[0].source.automation, issuers: registry ? [] : relationships.map(r => r.route), ...(registry ? { issuerRegistry: 'shadow_v1' } : {}) } });
    await catalogue.registerSource('authored-token', source, null, 'Register authored publisher policy'); sources.push(source);
  }
  const grant = { principal, active: true, sources: sources.map(s => s.id), roles: ['ingest'] };
  await worker.ref('workers', worker.actor).set(grant);
  const rows = async collection => (await db.collection(`m0_${collection}`).get()).docs.map(value).filter(r => sources.some(s => s.id === r.sourceId));
  return { worker, catalogue, relationships, sources, grant, state, cases, uid, rows, now: () => now,
    restart: () => new RecentJobsWorker(db, principal, options), advance: ms => { now = new Date(Date.parse(now) + ms).toISOString(); },
    update: async (index, changes) => {
      const old = relationships[index], next = EmployerRelationship.parse({ ...old, ...changes, revision: old.revision + 1 });
      await catalogue.registerEmployerRelationship('authored-token', next, old.revision, 'Authored issuer policy update'); relationships[index] = next; return next;
    },
    recheck: async (source, c = cases[0]) => {
      const id = hash(randomUUID());
      await worker.ref('worker_jobs', id).set(payload({ id, sourceId: source.id, kind: 'detail', url: c.detailUrl,
        state: 'pending', attempts: 0, lease: null, nextAt: now }));
      return id;
    } };
}

test('shared registry resolves tenant-scoped employers for two publisher policies without inline employer lists', async () => {
  const f = await fixture({ publisherCount: 2 });
  for (const source of f.sources) {
    const result = await f.worker.run(source.id); assert.equal(result.results.filter(r => r.recordId).length, 2);
    assert.ok(result.results.some(r => r.reason === 'ORIGINAL_NOTICE_UNSUPPORTED'));
    assert.deepEqual(value(await f.worker.ref('sources', source.id).get()), source); assert.deepEqual(source.automation.issuers, []);
  }
  assert.equal(f.state.extracted.length, 4); assert.ok(!f.state.requests.includes(f.cases[2].url));
  const receipts = await f.rows('worker_issuer_resolutions'); assert.equal(receipts.length, 6);
  assert.equal(receipts.filter(r => r.resolution.outcome === 'qualified').length, 4);
  assert.ok(receipts.filter(r => r.resolution.outcome === 'qualified').every(r => r.resolution.bindings.length === 1));
  for (const decision of await f.rows('worker_decisions')) {
    const issuer = receipts.find(r => r.id === decision.issuerResolutionId); assert.ok(issuer);
    assert.equal((await f.catalogue.inspect('authored-token', 'worker_original_resolutions', decision.originalResolutionId)).issuerResolutionId, issuer.id);
    assert.equal((await f.worker.ref('public', decision.recordId).get()).exists, false);
  }
  assert.deepEqual((await f.worker.ref('workers', f.worker.actor).get()).data(), f.grant);
});
test('registry source configuration cannot mix inline trust, skip original verification, enable undated or publish automatically', async () => {
  const f = await fixture({ kinds: ['a'] }), source = f.sources[0];
  for (const change of [{ issuers: [f.relationships[0].route] }, { originalVerification: undefined },
    { undatedNotices: 'shadow_recent' }, { mode: 'automatic' }])
    assert.equal(Source.safeParse({ ...source, automation: { ...source.automation, ...change } }).success, false);
  assert.throws(() => approvedRoute(source, f.cases[0].candidate.applicationCandidates[0]), { code: 'ISSUER_RELATIONSHIP_UNQUALIFIED' });
  assert.equal(Source.safeParse({ ...source, automation: { ...source.automation, mode: 'disabled' } }).success, true);
});
test('relationship writes require source authority and expected revisions, retain immutable history and allow revocation', async () => {
  const f = await fixture({ kinds: ['a'] }), r = f.relationships[0];
  await f.worker.ref('operators', f.uid).set({ active: true, roles: ['reviewer'] });
  await assert.rejects(f.catalogue.registerEmployerRelationship('authored-token', { ...r, revision: 2 }, 1, 'Unauthorized policy update'), { code: 'FORBIDDEN' });
  await f.worker.ref('operators', f.uid).set({ active: true, roles: ['source','reviewer'] });
  const outcomes = await Promise.allSettled([1, 2].map(() => f.catalogue.registerEmployerRelationship('authored-token', { ...r, revision: 2, state: 'revoked' }, 1, 'Concurrent policy revocation')));
  assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(outcomes.find(r => r.status === 'rejected').reason.code, 'CONFLICT');
  assert.deepEqual(value(await f.worker.ref('employer_relationship_versions', hash(`${r.id}:1`)).get()), r);
  assert.equal(readRelationship(await f.worker.ref('employer_relationships', r.id).get()).state, 'revoked');
  await assert.rejects(f.catalogue.registerEmployerRelationship('authored-token', { ...r, id: `expired_${randomUUID()}`,
    reviewedAt: '2026-10-28T10:00:00.000Z', expiresAt: f.now() }, null, 'Expired qualification'), { code: 'ISSUER_TRUST_EXPIRED' });
  assert.equal((await f.catalogue.inspect('authored-token', 'employer_relationship_versions', hash(`${r.id}:1`))).revision, 1);
  await f.worker.ref('operators', f.uid).set({ active: false, roles: ['reviewer'] });
  await assert.rejects(f.catalogue.queue('authored-token', 'employer_relationships'), { code: 'FORBIDDEN' });
});
test('revocation during original acquisition stops the fetch and persists a trust exception', async () => {
  const f = await fixture({ kinds: ['a'] });
  f.state.onRobots = async url => { if (!url.startsWith('https://recentjobs.co.za/')) await f.update(0, { state: 'revoked' }); };
  const result = await f.worker.run(f.sources[0].id);
  assert.ok(result.results.some(r => r.reason === 'ISSUER_TRUST_CHANGED'));
  assert.ok(!f.state.requests.includes(f.cases[0].url)); assert.deepEqual(f.state.extracted, []);
  const exception = (await f.rows('worker_exceptions'))[0]; assert.ok(exception.issuerResolutionId);
});
test('revocation during AI preserves dispatched-call accounting but blocks cache use, validation and drafting', async () => {
  const f = await fixture({ kinds: ['a'] }); f.state.onExtract = async () => f.update(0, { state: 'revoked' });
  const result = await f.worker.run(f.sources[0].id);
  assert.ok(result.results.some(r => r.reason === 'ISSUER_TRUST_CHANGED'));
  assert.equal(f.state.extracted.length, 1); assert.deepEqual(f.state.validated, []);
  const calls = await f.rows('model_calls'); assert.equal(calls.length, 1); assert.equal(calls[0].state, 'received'); assert.equal(calls[0].usage.totalTokens, 20);
  assert.equal((await f.rows('worker_decisions')).length, 0);
  assert.equal(value(await f.worker.ref('model_budgets', hash(`${f.sources[0].id}:2026-10-29`)).get()).calls, 1);
});
test('relationship expiry during validation is enforced even with an affirmative answer', async () => {
  const f = await fixture({ kinds: ['a'] }); await f.update(0, { expiresAt: '2026-10-29T10:00:30.000Z' });
  f.state.onValidate = async () => f.advance(30_000);
  const result = await f.worker.run(f.sources[0].id); assert.ok(result.results.some(r => r.reason === 'ISSUER_TRUST_EXPIRED'));
  assert.equal((await f.rows('worker_decisions')).length, 0); assert.equal((await f.rows('model_calls')).length, 2);
});
test('new attempts bind current revisions, invalidate stale AI context and honor revocation across publisher policies', async () => {
  const f = await fixture({ publisherCount: 2, kinds: ['a'] });
  for (const s of f.sources) await f.worker.run(s.id);
  const old = await f.rows('worker_issuer_resolutions'); assert.equal(f.state.extracted.length, 2);
  await f.update(0, { expiresAt: '2026-11-02T10:00:00.000Z' });
  const id = await f.recheck(f.sources[0]); const result = await f.restart().runJob(f.sources[0].id, id); assert.ok(result.recordId);
  assert.equal(f.state.extracted.length, 3);
  for (const row of old) assert.deepEqual(value(await f.worker.ref('worker_issuer_resolutions', row.id).get()), row);
  await f.update(0, { state: 'revoked' });
  for (const s of f.sources) {
    assert.equal((await f.restart().runJob(s.id, await f.recheck(s))).reason, 'ORIGINAL_NOTICE_UNSUPPORTED');
    assert.equal(value(await f.worker.ref('sources', s.id).get()).revision, 1);
  }
  assert.equal(f.state.extracted.length, 3);
});
test('a source can migrate in place while retaining its versions, worker grant, record identity and spent allowance', async () => {
  const f = await fixture({ kinds: ['a'], registry: false }), source = f.sources[0];
  const budgetRef = f.worker.ref('model_budgets', hash(`${source.id}:2026-10-29`));
  await budgetRef.set(payload({ sourceId: source.id, date: '2026-10-29', calls: 5 }));
  const first = (await f.worker.run(source.id)).results.find(r => r.recordId); assert.ok(first);
  for (const r of f.relationships) await f.catalogue.registerEmployerRelationship('authored-token', r, null, 'Authored portable trust before migration');
  const migrated = Source.parse({ ...source, revision: 2, automation: { ...source.automation, issuerRegistry: 'shadow_v1', issuers: [] } });
  await f.catalogue.registerSource('authored-token', migrated, 1, 'Migrate existing source in place');
  const second = await f.restart().runJob(source.id, await f.recheck(source)); assert.equal(second.recordId, first.recordId);
  assert.equal(value(await budgetRef.get()).calls, 9);
  assert.deepEqual(value(await f.worker.ref('source_versions', hash(`${source.id}:1`)).get()), source);
  assert.deepEqual((await f.worker.ref('workers', f.worker.actor).get()).data(), f.grant);
});
test('lookup refuses corrupt authority/index data and bounded-capacity overflow before employer fetches or AI', async () => {
  const f = await fixture({ kinds: ['a'] }), r = f.relationships[0];
  await f.worker.ref('employer_relationships', r.id).set({ ...relationshipDocument(r), routeKeys: [`portal:${r.route.host}`],
    json: JSON.stringify({ ...r, route: { ...r.route, host: 'wrong.example' } }) });
  assert.ok((await f.worker.run(f.sources[0].id)).results.some(r => r.reason === 'ISSUER_REGISTRY_INVALID'));
  assert.deepEqual(f.state.extracted, []); assert.ok(f.state.requests.every(url => url.startsWith('https://recentjobs.co.za/')));
  const g = await fixture({ kinds: ['a'] });
  for (let i = 0; i < 29; i++) {
    const extra = { ...g.relationships[0], id: `capacity_${randomUUID()}` };
    await g.catalogue.registerEmployerRelationship('authored-token', extra, null, 'Authored bounded registry capacity');
  }
  await assert.rejects(db.runTransaction(tx => lookupIssuerRelationships(tx, db, g.cases[0].candidate.applicationCandidates[0], 'apprenticeship', g.now())), { code: 'ISSUER_REGISTRY_CAPACITY' });
  assert.ok((await g.worker.run(g.sources[0].id)).results.some(r => r.reason === 'ISSUER_REGISTRY_CAPACITY'));
  assert.deepEqual(g.state.extracted, []);
});

test('lookup enforces category and expiry, and preserves exact recipient scope without inferring email authority', async () => {
  const f = await fixture({ kinds: ['a'] });
  await f.update(0, { route: { ...f.relationships[0].route, emailAddresses: ['apply@authored.example'] } });
  const lookup = (route, category = 'apprenticeship', now = f.now()) => db.runTransaction(tx => lookupIssuerRelationships(tx, db, route, category, now));
  assert.equal((await lookup({ method: 'email', destination: 'apply@authored.example' })).bindings[0].id, f.relationships[0].id);
  assert.equal((await lookup({ method: 'email', destination: 'other@authored.example' })).outcome, 'unqualified');
  const route = f.cases[0].candidate.applicationCandidates[0];
  assert.equal((await lookup(route, 'internship')).outcome, 'unqualified');
  assert.ok((await lookup(route, 'apprenticeship', '2026-11-01T10:00:00.000Z')).excluded.every(r => r.reason === 'expired'));
  const future = { ...f.relationships[0], id: `future_${randomUUID()}`, revision: 1, reviewedAt: '2026-10-30T10:00:00.000Z' };
  await assert.rejects(f.catalogue.registerEmployerRelationship('authored-token', future, null, 'Future qualification'), { code: 'ISSUER_TRUST_EXPIRED' });
  await assert.rejects(f.catalogue.queue('invalid-token', 'employer_relationships'), { code: 'UNAUTHORIZED' });
  assert.deepEqual(f.state.requests, []);
});
