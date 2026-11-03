import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { projectOpportunity } from '@skilved/types/opportunities/internal';
import { getRuntime } from '../src/runtime.mjs';
import { parseRecentJobsDetail } from '../src/adapters/recentjobs.mjs';
import { mapExtraction } from '../src/ai/extraction.mjs';
import { allFacts } from '../src/worker-policy.mjs';
import { syntheticExtraction } from './fixtures/recentjobs-model.mjs';

// Exercise the actual server-rendered pages and redirect against an isolated emulator.
// Worker publication itself is covered by worker.test.mjs; this fixture seeds its public shape.
test('enabled web catalogue renders checked records and rechecks every application handoff', { timeout: 120000 }, async () => {
  const project = 'demo-skilved-web';
  process.env.SKILVED_CATALOGUE_MODE = 'emulator';
  process.env.SKILVED_CATALOGUE_PROJECT = project;
  const runtime = await getRuntime();
  let child;
  try {
    const now = new Date().toISOString();
    // This scenario checks an open notice. Keep source and model evidence in
    // the future so the real deadline guard does not invalidate it over time.
    const future = new Date(Date.now() + 7 * 86400000);
    const localDate = new Intl.DateTimeFormat('en-CA', {timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'}).format(future);
    const wording = new Intl.DateTimeFormat('en-GB', {timeZone:'Africa/Johannesburg',day:'numeric',month:'long',year:'numeric'}).format(future);
    const html = (await readFile(new URL('./fixtures/recentjobs-synthetic.html', import.meta.url), 'utf8')).replace('30 October 2026', wording);
    const candidate = parseRecentJobsDetail({ html, url: 'https://recentjobs.co.za/2026/09/26/fictional-apprentice/' });
    const extraction = syntheticExtraction(), quote = `Closing date: ${wording}`;
    extraction.deadline = {state:'stated',value:{...extraction.deadline.value,localDate,originalText:quote},quote};
    const { record } = mapExtraction(candidate, extraction, { sourceId: 'synthetic_web', now });
    record.lifecycle = 'published';
    record.publication = { approved: true, previouslyPublic: true, disposition: 'clear', reviewedBy: 'synthetic_worker' };
    allFacts(record).forEach(f => { f.review = 'approved'; f.reviewedBy = 'synthetic_worker'; });
    record.citations.forEach(c => { c.approved = true; });
    record.checks = ['issuer_attribution', 'application_relationship', 'destination_reachability', 'availability', 'requirements'].map((scope, i) => ({
      id: `check_${i}`, scope, outcome: 'supported', method: 'automatic', checkedAt: now,
      nextCheckAt: new Date(Date.now() + 3600000).toISOString(), reviewerId: 'synthetic_worker', citationIds: ['source_notice'],
      recordRevision: 1, destination: record.applicationRoute.value.destination, public: true, notes: null,
    }));
    const projection = projectOpportunity(record);
    assert.equal(projection.kind, 'opportunity');
    const ref = runtime.db.collection('m0_public').doc(record.id);
    await ref.set({ json: JSON.stringify(projection) });
    const reservation = createServer().listen(0, '127.0.0.1');
    await once(reservation, 'listening');
    const port = reservation.address().port;
    await new Promise(resolve => reservation.close(resolve));
    const base = `http://127.0.0.1:${port}`;
    const webRoot = new URL('../../../apps/web/', import.meta.url);
    const require = createRequire(new URL('package.json', webRoot));
    child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', String(port)], {
      cwd: fileURLToPath(webRoot), env: { ...process.env, NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1',
        SKILVED_CATALOGUE_READS: 'true', SKILVED_CATALOGUE_PROJECT: project }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    // Discard server logs: .env.local belongs to the user and is never test output.
    child.stdout.resume(); child.stderr.resume();
    let ready = false;
    for (let n = 0; n < 180; n++) {
      try { ready = (await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1000) })).ok; } catch {}
      if (ready) break;
      if (child.exitCode !== null) throw new Error('Local web test server exited');
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    assert.equal(ready, true);
    const get = path => fetch(`${base}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
    const feed = await (await get('/')).text();
    assert.match(feed, /Fictional electrical apprentice/);
    assert.match(feed, /Location not stated/);
    assert.doesNotMatch(feed, /synthetic_worker|sourceSnapshotIds|reviewedBy/);
    const detail = await (await get(`/opportunities/${record.id}`)).text();
    assert.match(detail, /Grade 12 with Mathematics/);
    assert.match(detail, /N3 Electrical/);
    assert.match(detail, /Sources and checks/);
    for (const label of ['Who issued the opportunity', 'Source announcement', 'Application route linked to the notice',
      'Application destination reachable', 'Opportunity availability', 'Requirement wording and meaning'])
      assert.ok(detail.includes(label));
    assert.match(detail, /Automated check/);
    assert.match(detail, /Supported by the cited evidence/);
    // The fixture has no announcement assessment: rendering must not imply one.
    assert.match(detail, /No recorded check for this question/);
    assert.doesNotMatch(detail, /synthetic_worker|sourceSnapshotIds|reviewedBy/);
    const route = `/opportunities/${record.id}/apply`;
    const injected = await get(`${route}?revision=1&destination=https://attacker.example`);
    assert.equal(injected.status, 409); assert.equal(injected.headers.get('location'), null);
    const valid = await get(`${route}?revision=1`);
    assert.equal(valid.status, 303);
    assert.equal(valid.headers.get('location'), 'https://employer.example/apply');
    assert.equal(valid.headers.get('cache-control'), 'no-store');
    assert.equal((await get(`${route}?revision=2`)).status, 409);
    projection.opportunity.application.route = { method: 'email', destination: 'jobs+apprentice@employer.example' };
    await ref.set({ json: JSON.stringify(projection) });
    const emailDetail = await (await get(`/opportunities/${record.id}`)).text();
    assert.match(emailDetail, /Application email/); assert.ok(emailDetail.includes('jobs+apprentice@employer.example'));
    assert.match(emailDetail, /Open email application/);
    const injectedEmail = await get(`${route}?revision=1&destination=mailto:attacker@example.test`);
    assert.equal(injectedEmail.status, 409); assert.equal(injectedEmail.headers.get('location'), null);
    const email = await get(`${route}?revision=1`);
    assert.equal(email.status, 303); assert.equal(email.headers.get('location'), 'mailto:jobs%2Bapprentice@employer.example');
    projection.opportunity.checks.forEach(c => { c.nextCheckAt = '2020-01-01T00:00:00.000Z'; });
    await ref.set({ json: JSON.stringify(projection) });
    const expired = await get(`${route}?revision=1`);
    assert.equal(expired.status, 409); assert.equal(expired.headers.get('location'), null);
    assert.match(await (await get(`/opportunities/${record.id}`)).text(), /needs a fresh check/);
    assert.doesNotMatch(await (await get('/')).text(), /Fictional electrical apprentice/);
  } finally {
    if (child && child.exitCode === null) {
      const exited = once(child, 'exit'); child.kill('SIGTERM');
      const timer = setTimeout(() => child.kill('SIGKILL'), 5000); timer.unref();
      await exited; clearTimeout(timer);
    }
    await runtime.db.terminate();
  }
});
