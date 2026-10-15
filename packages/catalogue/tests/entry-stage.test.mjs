import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeRecord } from '../../types/tests/fixtures/opportunities.mjs';
import { allFacts, assertMaterialFacts } from '../src/worker-policy.mjs';
import { validationPayload } from '../src/ai/validation.mjs';

test('optional entry stage participates in complete fact traversal and semantic payload without storage metadata', () => {
  const record = makeRecord();
  assert.equal('entryStage' in validationPayload({ record, recentjobsText: 'Synthetic notice' }).extracted, false);
  record.entryStage = { ...record.title, id: 'stage_assertion', value: ['entry_level'], originalText: 'Synthetic entry-level role' };
  assert.equal(allFacts(record).includes(record.entryStage), true);
  const payload = validationPayload({ record, recentjobsText: 'Synthetic entry-level role' }).extracted.entryStage;
  assert.deepEqual(payload, { state: 'stated', value: ['entry_level'], originalText: 'Synthetic entry-level role' });
  assert.doesNotMatch(JSON.stringify(payload), /reviewedBy|sourceSnapshotIds|evidenceRefs|stage_assertion/);
});

test('automatic publication holds stated stage until qualification while legacy and unknown behavior stay unchanged', () => {
  const record = makeRecord();
  assert.doesNotThrow(() => assertMaterialFacts(record));
  record.entryStage = { ...record.title, id: 'stage_assertion', value: ['entry_level'], originalText: 'Synthetic entry-level role' };
  assert.throws(() => assertMaterialFacts(record), /ENTRY_STAGE_REVIEW_REQUIRED/);
  record.entryStage.value = null; record.entryStage.state = 'not_stated';
  assert.doesNotThrow(() => assertMaterialFacts(record));
  for (const state of ['ambiguous','conflicting']) {
    record.entryStage.state = state;
    assert.throws(() => assertMaterialFacts(record), /MATERIAL_FACTS_UNRESOLVED/);
  }
});
