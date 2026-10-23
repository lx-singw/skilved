import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { projectOpportunity } from '@skilved/types/opportunities/internal';
import { allFixtures, makeRecord } from '../../types/tests/fixtures/opportunities.mjs';
import { SuggestionReceipts } from '../src/suggestion-receipts.mjs';
import { SuggestionAdmission } from '../src/suggestion-admission.mjs';
import { Catalogue } from '../src/store.mjs';

const start = '2026-10-16T12:00:00.000Z', url = 'https://source.example/notice', other = 'https://source.example/other';
const source = { id: 'test_source', revision: 1, name: 'Synthetic source', urls: [url,other],
  permission: { reference: 'Synthetic permission fixture only', method: 'structured_json', reuse: 'Test only', reviewedAt: start },
  categories: ['bursary','learnership','apprenticeship','internship','graduate_programme','job'], owner: 'source_operator', paused: false, cadenceHours: 24, maxBytes: 500000 };
const policy = { intakeEnabled: true, maxWork: 3, maxReceipts: 8, createAttemptsPerHour: 50, statusReadsPerHour: 600, receiptTtlMs: 86400000 };
const collections = ['m0_sources','m0_suggestion_state','m0_suggestion_receipts','m0_suggestion_replays','m0_suggestion_public_replays',
  'm0_suggestion_work','m0_suggestion_limits','m0_public','m0_drafts','m0_snapshots','m0_aliases','m0_operators','m0_audit'];
const random = () => randomBytes(32).toString('hex'), json = value => ({ json: JSON.stringify(value) });
let app,db,receipts,service,catalogue,now;
const set = (name,id,value) => db.collection(name).doc(id).set(json(value));
const data = async ref => JSON.parse((await ref.get()).data().json);
const rows = async name => (await db.collection(name).get()).docs;
const expectCode = (promise, code) => assert.rejects(promise, error => error.message === code);
const create = (key = random(), target = service, inputUrl = url) => target.create({ url: inputUrl }, key);
function record(id = 'approved_A', category = 'apprenticeship') {
  const result = makeRecord(category);result.id = id;result.citations[0].url = url;return result;
}
async function publish(input = record()) {
  await set('m0_drafts',input.id,input);await set('m0_public',input.id,projectOpportunity(input));
  await set('m0_snapshots','snapshot_fixture_1',{ id: 'snapshot_fixture_1', sourceId: source.id, sourceRevision: 1,
    url, retrievedAt: start, hash: 'a'.repeat(64), text: 'Synthetic source only' });
  return input;
}
before(() => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST ?? '', /^127\.0\.0\.1:[1-9]\d{3,4}$/);
  assert.equal(process.env.GCLOUD_PROJECT, 'demo-skilved-b03');
  app = initializeApp({ projectId: 'demo-skilved-create' }, 'suggestion-create-test');db = getFirestore(app);
  receipts = new SuggestionReceipts(db,{ keyRing: { activeKeyId: 'test1', keys: [{ id: 'test1', secret: 'a1'.repeat(32) }] },
    maxTtlMs: 86400000, now: () => now });
  // Synthetic identity provider seam; actual current operator roles/audit use Firestore transactions.
  catalogue = new Catalogue(db,{ verifyIdToken: async token => {
    if (token === 'synthetic_source_token') return { uid: 'source_operator' };
    if (token === 'synthetic_guest_token') return { uid: 'guest' };
    throw new Error('Synthetic token denied');
  } },() => now);
});
beforeEach(async () => {
  // Only this fixed isolated demo project's named fixture collections are reset.
  for (const name of collections) {
    const docs = await rows(name), batch = db.batch();for (const doc of docs) batch.delete(doc.ref);if(docs.length)await batch.commit();
  }
  now = start;service = new SuggestionAdmission(db,receipts,policy);
  await set('m0_sources',source.id,source);
  await service.stateRef().set(json({ schemaVersion: 1, revision: 1, workCount: 0, receiptCount: 0 }));
  await db.doc('m0_operators/source_operator').set({ active: true, roles: ['source'] });
});
after(async () => { await db?.terminate();if(app)await deleteApp(app); });

test('all six categories, both internships and multiple intakes return together without receipts or work', async () => {
  const fixtures = allFixtures();fixtures.push(record('additional_intake','job'));
  for (const fixture of fixtures) { fixture.citations[0].url = url;await publish(fixture); }
  assert.deepEqual(await create(),{ kind: 'approved', publicResultIds: fixtures.map(r => r.id).sort() });
  for (const name of ['m0_suggestion_receipts','m0_suggestion_work','m0_suggestion_replays'])assert.equal((await rows(name)).length,0);
  assert.equal((await rows('m0_suggestion_public_replays')).length,1);
  assert.equal((await data(service.stateRef())).receiptCount,0);
});

test('URL equality without current private approval or public presence cannot bypass review', async () => {
  const input = await publish();input.publication.approved = false;await set('m0_drafts',input.id,input);
  assert.equal((await create()).kind,'received');
  await db.doc('m0_public/approved_A').delete();input.publication.approved = true;await set('m0_drafts',input.id,input);
  assert.equal((await create()).kind,'received');
  assert.equal((await rows('m0_suggestion_public_replays')).length,0);
});

test('current projection revision and source snapshot identity/revision/time must match', async () => {
  const input = await publish();
  for (const patch of [{ sourceId: 'other_source' },{ sourceRevision: 2 },{ retrievedAt: '2026-10-17T12:00:00.000Z' }]) {
    await publish(input);const ref = db.doc('m0_snapshots/snapshot_fixture_1');await ref.set(json({ ...await data(ref), ...patch }));
    assert.equal((await create()).kind,'received');
  }
  await publish(input);input.revision++;await set('m0_drafts',input.id,input);
  assert.equal((await create()).kind,'received');
});

test('a public result outside the current source category scope cannot bypass review', async () => {
  await publish(record('approved_bursary','bursary'));
  await set('m0_sources',source.id,{ ...source, categories: ['job'] });
  assert.equal((await create()).kind,'received');
});

test('stale automatic projections return to review; closed approved records remain honest public results', async () => {
  const input = record();input.checks[0].method = 'automatic';input.checks[0].nextCheckAt = '2026-10-16T11:00:00.000Z';
  await publish(input);assert.equal((await create()).kind,'received');
  input.checks[0].method = 'human';input.lifecycle = 'closed';await publish(input);
  assert.deepEqual(await create(),{ kind: 'approved', publicResultIds: [input.id] });
});

test('confirmed aliases omit hidden originals, reversals reinclude them and cycles fail closed', async () => {
  await publish(record('original'));await publish(record('canonical'));
  const alias = { schemaVersion: 1, fromId: 'original', toId: 'canonical', revision: 1, decision: 'confirmed' };
  await set('m0_aliases','original',alias);const key = random();
  assert.deepEqual(await create(key),{ kind: 'approved', publicResultIds: ['canonical'] });
  await set('m0_aliases','original',{ ...alias, revision: 2, decision: 'reversed' });
  assert.deepEqual(await create(key),{ kind: 'approved', publicResultIds: ['canonical','original'] });
  await set('m0_aliases','original',alias);
  await set('m0_aliases','canonical',{ ...alias, fromId: 'canonical', toId: 'original' });
  await expectCode(create(key),'SUGGESTION_UNAVAILABLE');
});

test('approved concurrent/restarted retries bind one decision, recheck removal and never enqueue stale results', async () => {
  await publish();const key = random();const results = await Promise.all(Array.from({length:4},() => create(key)));
  for (const result of results)assert.deepEqual(result,results[0]);
  const bindingRows = await rows('m0_suggestion_public_replays');assert.equal(bindingRows.length,1);
  const before = bindingRows[0].data();assert.ok(!JSON.stringify(before).includes(key));assert.ok(!JSON.stringify(before).includes(url));
  assert.ok(!JSON.stringify(before).includes('approved_A'));
  service = new SuggestionAdmission(db,receipts,policy);assert.deepEqual(await create(key),results[0]);
  await expectCode(create(key,service,other),'SUGGESTION_CONFLICT');
  await db.doc('m0_public/approved_A').delete();
  assert.deepEqual(await create(key),{ kind: 'previous_result_unavailable' });
  assert.deepEqual((await bindingRows[0].ref.get()).data(),before);
  assert.equal((await rows('m0_suggestion_receipts')).length,0);assert.equal((await rows('m0_suggestion_work')).length,0);
  now = '2026-10-17T12:00:00.000Z';await expectCode(create(key),'SUGGESTION_NOT_FOUND');
});

test('receipt outcome remains the same private receipt after publication, while another key gets public results', async () => {
  const key = random(), first = await create(key);assert.equal(first.kind,'received');
  await publish();assert.deepEqual(await create(key),first);
  assert.deepEqual(await create(),{ kind: 'approved', publicResultIds: ['approved_A'] });
  assert.equal((await rows('m0_suggestion_receipts')).length,1);
  assert.equal(JSON.parse((await rows('m0_suggestion_work'))[0].data().json).receiptCount,1);
});

test('approved-decision capacity is atomic and an existing retry consumes no additional slot', async () => {
  await publish();const bounded = new SuggestionAdmission(db,receipts,{ ...policy, maxReceipts: 1 });
  const keys = [random(),random()];const results = await Promise.allSettled(keys.map(key => create(key,bounded)));
  const winner = results.findIndex(r => r.status === 'fulfilled');assert.ok(winner >= 0);
  assert.equal(results.filter(r => r.status === 'rejected' && r.reason.code === 'SUGGESTION_CAPACITY').length,1,
    JSON.stringify(results.map(r=>({status:r.status,...(r.status==='rejected'?{code:r.reason?.code??'unavailable'}:{})}))));
  assert.deepEqual(await create(keys[winner],bounded),results[winner].value);
  assert.equal((await rows('m0_suggestion_public_replays')).length,1);assert.equal((await data(service.stateRef())).workCount,0);
});

test('malformed public data, aliases and cross-outcome bindings never produce public IDs or new work', async () => {
  await publish();await db.doc('m0_public/approved_A').set({ json: 'PRIVATE_CORRUPT' });
  await expectCode(create(),'SUGGESTION_UNAVAILABLE');
  await publish();await set('m0_aliases','wrong_identity',{ schemaVersion: 1, fromId: 'a', toId: 'b', revision: 1, decision: 'confirmed' });
  await expectCode(create(),'SUGGESTION_UNAVAILABLE');await db.doc('m0_aliases/wrong_identity').delete();
  await db.doc('m0_public/approved_A').delete();const key = random(), first = await create(key);
  const receipt = await data(receipts.receiptRef(first.access.receiptId));
  await service.publicReplayRef(key).set(json({ schemaVersion: 1, workId: receipt.workId, createdAt: start, expiresAt: first.access.expiresAt }));
  await expectCode(create(key),'SUGGESTION_UNAVAILABLE');
  assert.equal((await rows('m0_suggestion_receipts')).length,1);
});

test('more than20 applicable public intakes fail closed instead of choosing a partial set', async () => {
  for(let i=0;i<21;i++)await publish(record('intake_'+i));
  await expectCode(create(),'SUGGESTION_UNAVAILABLE');
  assert.equal((await rows('m0_suggestion_receipts')).length,0);assert.equal((await rows('m0_suggestion_public_replays')).length,0);
});

test('empty initialization requires verified identity and a current active source role', async () => {
  await service.stateRef().delete();
  await expectCode(service.initialize('invalid',catalogue,'Synthetic initialization'),'UNAUTHORIZED');
  await expectCode(service.initialize('synthetic_guest_token',catalogue,'Synthetic initialization'),'FORBIDDEN');
  await db.doc('m0_operators/source_operator').update({ active: false });
  await expectCode(service.initialize('synthetic_source_token',catalogue,'Synthetic initialization'),'FORBIDDEN');
  await db.doc('m0_operators/source_operator').update({ active: true, roles: ['reviewer'] });
  await expectCode(service.initialize('synthetic_source_token',catalogue,'Synthetic initialization'),'FORBIDDEN');
  assert.equal((await service.stateRef().get()).exists,false);assert.equal((await rows('m0_audit')).length,0);
});

test('concurrent empty initialization commits one audited state and refuses existing/corrupt state', async () => {
  await service.stateRef().delete();
  const results = await Promise.allSettled(Array.from({length:2},() => service.initialize('synthetic_source_token',catalogue,'Synthetic initialization')));
  assert.equal(results.filter(r => r.status === 'fulfilled').length,1);
  assert.equal(results.filter(r => r.status === 'rejected' && r.reason.code === 'CONFLICT').length,1);
  assert.deepEqual(await data(service.stateRef()),{ schemaVersion: 1, revision: 1, workCount: 0, receiptCount: 0 });
  const audit = JSON.parse((await rows('m0_audit'))[0].data().json);assert.equal(audit.action,'suggestions.initialize');assert.equal(audit.actor,'source_operator');
  await service.stateRef().set({ json: 'PRIVATE_CORRUPT' });
  await expectCode(service.initialize('synthetic_source_token',catalogue,'No implicit repair'),'CONFLICT');
  assert.deepEqual((await service.stateRef().get()).data(),{ json: 'PRIVATE_CORRUPT' });
});

test('orphaned receipt, work and either replay collection prevent empty-state reset', async () => {
  await service.stateRef().delete();
  for(const name of ['m0_suggestion_receipts','m0_suggestion_work','m0_suggestion_replays','m0_suggestion_public_replays']) {
    const ref = db.collection(name).doc('orphan');await ref.set({ private: 'SYNTHETIC_ORPHAN' });
    await expectCode(service.initialize('synthetic_source_token',catalogue,'No orphan reset'),'CONFLICT');await ref.delete();
  }
  assert.equal((await rows('m0_audit')).length,0);assert.equal((await service.stateRef().get()).exists,false);
});
