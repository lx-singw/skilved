import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { allFixtures, makeRecord, NOW } from './fixtures/opportunities.mjs';
const require = createRequire(import.meta.url);
const { OpportunityRecordSchema, projectOpportunity } = require('../dist/opportunities/internal.js');
const { PublicOpportunitySchema, EntryStageSchema, EntryStagesSchema, DetailResponseSchema, ListResponseSchema } = require('../dist/opportunities/index.js');
const { serializeRecord, deserializeRecord } = require('../dist/opportunities/storage.js');
const unknown = { state: 'not_stated', value: null, originalText: null, citations: [] };
const stage = (record, values = ['student', 'graduate']) => ({
  ...structuredClone(record.title), id: 'stage_assertion', value: values,
  originalText: 'Synthetic notice: students and graduates may apply.',
});
const publicRecord = record => {
  const result = projectOpportunity(record); assert.equal(result.kind, 'opportunity'); return result.opportunity;
};

test('legacy internal records stay lossless and omitted public stage becomes explicit unknown', () => {
  for (const record of allFixtures()) {
    const roundtrip = deserializeRecord(serializeRecord(record));
    assert.deepEqual(roundtrip, record); assert.equal('entryStage' in roundtrip, false);
    const output = publicRecord(record);
    assert.deepEqual(output.entryStage, unknown);
    delete output.entryStage;
    assert.deepEqual(PublicOpportunitySchema.parse(output).entryStage, unknown);
    assert.deepEqual(DetailResponseSchema.parse({ kind: 'opportunity', opportunity: output }).opportunity.entryStage, unknown);
    assert.deepEqual(ListResponseSchema.parse({ schemaVersion: 1, catalogueRevision: 1, asOf: NOW, items: [output], nextCursor: null }).items[0].entryStage, unknown);
  }
});

test('source-stated overlapping discovery labels retain wording, citation and independent requirement logic', () => {
  for (const record of allFixtures()) {
    for (const label of EntryStageSchema.options) {
      record.entryStage = stage(record, [label]);
      assert.deepEqual(deserializeRecord(serializeRecord(record)), record);
      const output = publicRecord(record);
      assert.deepEqual(output.entryStage, { state: 'stated', value: [label], originalText: record.entryStage.originalText, citations: ['citation_fixture'] });
      assert.deepEqual(output.requirements.expression, record.requirements.expression);
      assert.equal(output.experience.value, record.experience.value);
    }
    record.entryStage = stage(record);
    assert.deepEqual(publicRecord(record).entryStage.value, ['student', 'graduate']);
  }
  for (const input of [[], ['graduate', 'graduate'], ['unknown'], ['no_experience'], ['student','graduate','school_leaver','entry_level','experienced','student']])
    assert.equal(EntryStagesSchema.safeParse(input).success, false);
});

test('entry-stage assertions participate in identity, provenance and public-reference validation', () => {
  for (const change of [
    r => { r.entryStage.id = r.title.id; },
    r => { r.entryStage.originalText = null; },
    r => { r.entryStage.evidenceRefs = []; },
    r => { r.entryStage.sourceSnapshotIds = []; },
    r => { r.entryStage.sourceSnapshotIds = ['unresolved_snapshot']; },
    r => { r.entryStage.reviewedBy = null; },
    r => { r.entryStage.extra = 'PRIVATE_EXTRA'; },
  ]) {
    const record = makeRecord(); record.entryStage = stage(record); change(record);
    assert.equal(OpportunityRecordSchema.safeParse(record).success, false);
    assert.deepEqual(projectOpportunity(record), { kind: 'invalid', code: 'INVALID_RECORD' });
  }
  const output = publicRecord(makeRecord());
  output.entryStage = { state: 'stated', value: ['student'], originalText: 'Students', citations: ['missing'] };
  assert.equal(PublicOpportunitySchema.safeParse(output).success, false);
});

test('unreviewed, rejected and uncited stage assertions never become public labels or explanations', () => {
  for (const review of ['pending', 'rejected']) {
    const record = makeRecord(); record.entryStage = stage(record); record.entryStage.review = review;
    record.explanation = { text: 'PRIVATE_UNREVIEWED_STAGE_EXPLANATION', assertionIds: ['stage_assertion'], requirementRevision: 1, method: 'human', reviewedBy: 'reviewer_fixture', review: 'approved' };
    const output = publicRecord(record);
    assert.deepEqual(output.entryStage, unknown); assert.equal(output.explanation, null);
    assert.doesNotMatch(JSON.stringify(output), /PRIVATE_|stage_assertion|snapshot_fixture|reviewer_fixture|evidence_fixture/);
  }
  const record = makeRecord(); record.entryStage = stage(record); record.citations[0].approved = false;
  assert.deepEqual(publicRecord(record).entryStage, unknown);
});

test('uncertain stage states retain uncertainty without leaking alternatives; lifecycle rules still apply', () => {
  for (const state of ['not_stated', 'ambiguous', 'conflicting']) {
    const record = makeRecord(); record.entryStage = stage(record); record.entryStage.state = state; record.entryStage.value = null;
    if (state !== 'not_stated') record.entryStage.alternatives = [
      { value: ['student'], sourceSnapshotId: 'snapshot_fixture_1', evidenceRef: 'evidence_fixture_1' },
      { value: ['graduate'], sourceSnapshotId: 'snapshot_fixture_1', evidenceRef: 'evidence_fixture_1' },
    ];
    const output = publicRecord(record);
    assert.equal(output.entryStage.state, state); assert.equal(output.entryStage.value, null);
    assert.equal('alternatives' in output.entryStage, false);
    record.entryStage.value = ['entry_level'];
    assert.equal(OpportunityRecordSchema.safeParse(record).success, false);
  }
  for (const [lifecycle,kind] of [['review','not_public'],['draft','not_public'],['withdrawn','status'],['archived','status']]) {
    const record = makeRecord(); record.id = 'restricted_stage_record'; record.entryStage = stage(record); record.lifecycle = lifecycle;
    const result = projectOpportunity(record); assert.equal(result.kind, kind);
    assert.doesNotMatch(JSON.stringify(result), /student|graduate|stage_assertion/);
  }
});

test('stage queries match only reviewed stated labels across every category and both internships', () => {
  const { parseReadQuery, matchesQuery } = require('../dist/opportunities/index.js');
  for (const record of allFixtures()) {
    const selected = parseReadQuery(new URLSearchParams('stage=graduate')).query;
    record.entryStage = stage(record);
    assert.equal(matchesQuery(publicRecord(record), selected), true);
    assert.equal(matchesQuery(publicRecord(record), { ...selected, field: 'unmatched' }), false);
    for (const label of EntryStageSchema.options) {
      record.entryStage.value = [label];
      assert.equal(matchesQuery(publicRecord(record), { ...selected, stage: label }), true);
    }
    for (const state of ['not_stated', 'ambiguous', 'conflicting']) {
      record.entryStage.state = state; record.entryStage.value = null;
      assert.equal(matchesQuery(publicRecord(record), selected), false);
      assert.equal(matchesQuery(publicRecord(record), { ...selected, stage: undefined }), true);
    }
    delete record.entryStage; record.title.value = 'Graduate student entry-level opportunity';
    assert.equal(matchesQuery(publicRecord(record), selected), false);
    record.entryStage = stage(record); record.entryStage.review = 'pending';
    assert.equal(matchesQuery(publicRecord(record), selected), false);
    record.entryStage.review = 'approved'; record.lifecycle = 'closed';
    assert.equal(matchesQuery(publicRecord(record), selected), false);
  }
  for (const raw of ['stage=', 'stage=unknown', 'stage=no_experience', 'stage=Graduate', 'stage=graduate&stage=student'])
    assert.equal(parseReadQuery(new URLSearchParams(raw)).ok, false, raw);
});
test('stage cursor binding preserves existing field-only and unfiltered continuations', () => {
  const { parseReadQuery, encodeCursor, decodeCursor } = require('../dist/opportunities/index.js');
  const after = { updatedAt: NOW, id: 'last_item' };
  for (const field of [null, 'Engineering']) {
    const params = new URLSearchParams('limit=2'); if (field) params.set('field', field);
    const query = parseReadQuery(params).query;
    const fingerprint = [null,null,null,null,'',2,'updated_desc',...(field?[field]:[])];
    const legacy = Buffer.from(JSON.stringify({ v:1, query:JSON.stringify(fingerprint), catalogueRevision:3, after })).toString('base64url');
    assert.equal(decodeCursor(legacy, query, 3).ok, true);
    const selected = { ...query, stage:'graduate' }, token = encodeCursor(selected, 3, after);
    assert.equal(decodeCursor(token, selected, 3).ok, true);
    for (const changed of [query, { ...selected, stage:'student' }, { ...selected, field:'Nursing' }])
      assert.equal(decodeCursor(token, changed, 3).error.code, 'INVALID_CURSOR');
    assert.equal(decodeCursor(legacy, selected, 3).error.code, 'INVALID_CURSOR');
    assert.equal(decodeCursor(token, selected, 4).error.code, 'STALE_CURSOR');
  }
});
