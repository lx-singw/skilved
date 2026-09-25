import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { makeRecord, allFixtures, NOW } from './fixtures/opportunities.mjs';
const require = createRequire(import.meta.url);
const { OpportunityRecordSchema, projectOpportunity } = require('../dist/opportunities/internal.js');
const { PublicOpportunitySchema, ProjectionSchema, CategorySchema, formatRequirements, DeadlineSchema, deadlineTiming,
  parseReadQuery, encodeCursor, decodeCursor, matchesQuery, ListResponseSchema, ErrorResponseSchema } = require('../dist/opportunities/index.js');
const { serializeRecord, deserializeRecord, resolveAlias } = require('../dist/opportunities/storage.js');
const { migrateLegacy } = require('../dist/opportunities/migration.js');
const projected = (record = makeRecord()) => {
  const result = projectOpportunity(record); assert.equal(result.kind, 'opportunity'); return result.opportunity;
};
const invalid = value => assert.equal(OpportunityRecordSchema.safeParse(value).success, false);

test('CT-01: all six categories and both internship routes round-trip without a trade requirement', () => {
  for (const record of allFixtures()) {
    const output = projected(deserializeRecord(serializeRecord(record)));
    assert.equal(output.category, record.category); assert.deepEqual(output.internship, record.internship);
    assert.ok(PublicOpportunitySchema.safeParse(output).success);
  }
  assert.match(projected(makeRecord('job')).experience.value, /Five years/);
});
test('CT-02: subtype and taxonomy boundaries reject invalid and unsupported combinations', () => {
  assert.ok(OpportunityRecordSchema.safeParse(makeRecord('internship', 'unknown')).success);
  assert.ok(OpportunityRecordSchema.safeParse(makeRecord('internship', 'other_stated')).success);
  const x = makeRecord(); x.internship = { subtype: 'graduate', originalText: null }; invalid(x);
  const i = makeRecord('internship'); i.internship = null; invalid(i);
  for (const category of ['trade_test', 'short_course', 'trade-test', 'short-course', 'graduate-programme']) assert.equal(CategorySchema.safeParse(category).success, false);
});
test('CT-03: facts require evidence and uncertainty never turns into a definite value', () => {
  for (const state of ['not_stated', 'ambiguous', 'conflicting']) {
    const x = makeRecord(); x.deadline = { ...x.deadline, state, value: null };
    assert.equal(projected(x).deadline.state, state); assert.equal(projected(x).deadline.value, null);
    x.deadline.value = makeRecord().deadline.value; invalid(x);
  }
  const x = makeRecord(); x.title.evidenceRefs = []; invalid(x);
  const y = makeRecord(); y.title.review = 'pending'; y.title.originalText = 'PRIVATE_UNREVIEWED';
  assert.equal(projected(y).title.originalText, null);
  y.citations[0].approved = false; assert.equal(projected(y).application.state, 'unavailable');
  const conflict = makeRecord(); conflict.title.state = 'conflicting'; conflict.title.value = null;
  conflict.title.alternatives = [{ value: 'Private interpretation A', sourceSnapshotId: 'snapshot_fixture_1', evidenceRef: 'evidence_fixture_1' }, { value: 'Private interpretation B', sourceSnapshotId: 'snapshot_fixture_1', evidenceRef: 'evidence_fixture_1' }];
  assert.equal(deserializeRecord(serializeRecord(conflict)).title.alternatives.length, 2);
  assert.ok(!JSON.stringify(projected(conflict)).includes('Private interpretation'));
});
test('CT-04: national/remote widening is distinct from residence requirements', () => {
  const q = parseReadQuery(new URLSearchParams('province=western_cape')).query;
  const x = makeRecord(); assert.equal(matchesQuery(projected(x), q), false);
  x.location.value.coverage = 'national'; assert.equal(matchesQuery(projected(x), q), true);
  x.location.value.coverage = 'local'; x.location.value.attendance = 'remote'; assert.equal(matchesQuery(projected(x), q), true);
  x.location.state = 'not_stated'; x.location.value = null; assert.equal(matchesQuery(projected(x), q), false);
  assert.equal(matchesQuery(projected(x), parseReadQuery(new URLSearchParams()).query), true);
});
test('CT-05: nested alternatives and conditional branches remain explicit', () => {
  const x = makeRecord(); let text = formatRequirements(projected(x).requirements);
  assert.match(text, /ANY of/); assert.match(text, / OR /);
  x.requirements.expression = { op: 'if', condition: 'matric', then: { op: 'ref', id: 'n2' }, otherwise: null };
  text = formatRequirements(projected(x).requirements); assert.match(text, /IF .* THEN/); assert.match(text, /other cases not stated/);
  x.requirements.expression = { op: 'all', children: [makeRecord().requirements.expression] };
  assert.match(formatRequirements(projected(x).requirements), /ALL of \(ANY of/);
});
test('CT-06: missing refs, cycles, omitted atoms, empty groups and excessive depth fail safely', () => {
  const x = makeRecord(); x.requirements.expression = { op: 'ref', id: 'absent' }; invalid(x);
  x.requirements.expression = { op: 'ref', id: 'matric' }; invalid(x);
  x.requirements.expression = { op: 'all', children: [] }; invalid(x);
  x.requirements.expression.children.push(x.requirements.expression);
  assert.deepEqual(projectOpportunity(x), { kind: 'invalid', code: 'INVALID_RECORD' });
  const y = makeRecord(); for (let i = 0; i < 15; i++) y.requirements.expression = { op: 'all', children: [y.requirements.expression] }; invalid(y);
});
test('CT-07: date-only and unknown zones retain precision; instants must match source-local time', () => {
  const d = makeRecord().deadline.value;
  assert.equal(deadlineTiming(d, NOW), 'no_exact_instant');
  assert.equal(DeadlineSchema.safeParse({ ...d, localDate: '2026-02-29' }).success, false);
  assert.equal(DeadlineSchema.safeParse({ ...d, localDate: '2028-02-29' }).success, true);
  assert.equal(DeadlineSchema.safeParse({ ...d, localDate: '2026-04-31' }).success, false);
  const exact = { ...d, localTime: '17:00', timezone: 'Africa/Johannesburg', utcInstant: '2026-10-30T15:00:00.000Z' };
  assert.equal(deadlineTiming(exact, NOW), 'future_instant');
  assert.equal(deadlineTiming(exact, '2026-10-30T15:00:00.000Z'), 'past_instant');
  assert.equal(DeadlineSchema.safeParse({ ...exact, timezone: null }).success, false);
  assert.equal(DeadlineSchema.safeParse({ ...exact, timezone: 'Invalid/Timezone' }).success, false);
  assert.equal(DeadlineSchema.safeParse({ ...exact, utcInstant: 'bad-date' }).success, false);
  assert.equal(DeadlineSchema.safeParse({ ...exact, utcInstant: '2026-10-30T16:00:00.000Z' }).success, false);
  assert.equal(DeadlineSchema.safeParse({ ...d, kind: 'open_until_filled', localDate: null }).success, true);
});
test('CT-08: mixed compensation, unknown currency/amount and stated zero are preserved', () => {
  const x = makeRecord(); x.compensation[0].value.amount = 0;
  x.compensation[1].value.currency = 'USD'; x.compensation[1].value.period = 'year';
  const output = projected(x); assert.equal(output.compensation[0].value.amount, 0);
  assert.equal(output.compensation[1].value.amount, null); assert.equal(output.compensation[1].value.period, 'year');
  x.compensation[0].value.maximum = -1; invalid(x);
});
test('CT-09: unstated document constraints stay null', () => {
  const x = makeRecord(); const r = x.requirements.requirements[0]; r.kind = 'document';
  r.fact.value.document = { kind: 'Academic record', stage: null, certification: null, format: null, maxBytes: null };
  assert.deepEqual(projected(x).requirements.requirements[0].fact.value.document, r.fact.value.document);
});
test('CT-10: check failures do not close listings or overwrite check history', () => {
  const x = makeRecord(); x.checks.push({ ...x.checks[0], id: 'check_failed', scope: 'destination_reachability', outcome: 'failed', checkedAt: '2026-09-26T10:00:00.000Z' });
  const result = projected(x); assert.equal(result.lifecycle, 'published'); assert.equal(result.checks.length, 2);
  assert.equal(result.checks[0].checkedAt, NOW);
  assert.equal(result.application.state, 'unavailable');
});
test('CT-11: lifecycle and withholding return safe public or non-enumerating outcomes', () => {
  for (const lifecycle of ['draft', 'review']) { const x = makeRecord(); x.lifecycle = lifecycle; assert.equal(projectOpportunity(x).kind, 'not_public'); }
  const closed = makeRecord(); closed.lifecycle = 'closed'; assert.equal(projected(closed).application.state, 'unavailable');
  for (const lifecycle of ['withdrawn', 'archived']) { const x = makeRecord(); x.lifecycle = lifecycle;
    const result = projectOpportunity(x); assert.equal(result.kind, 'status'); assert.ok(!JSON.stringify(result).includes('issuer.example')); }
  const x = makeRecord(); x.publication.disposition = 'withheld'; assert.equal(projectOpportunity(x).kind, 'status');
  x.publication.previouslyPublic = false; assert.equal(projectOpportunity(x).kind, 'not_public');
});
test('CT-12: private fields and unknown nested/root keys never reach public output or safe errors', () => {
  const x = makeRecord(); const output = JSON.stringify(projectOpportunity(x));
  for (const needle of ['PRIVATE_', 'private.example', 'reviewer_fixture', 'snapshot_fixture_1', 'evidence_fixture_1', 'reviewedBy']) assert.ok(!output.includes(needle), needle);
  x.title.secret = 'SECRET_NESTED'; assert.deepEqual(projectOpportunity(x), { kind: 'invalid', code: 'INVALID_RECORD' });
  const y = makeRecord(); y.extra = 'SECRET_ROOT'; invalid(y);
  const p = projected(); p.extra = 'SECRET_PUBLIC'; assert.equal(PublicOpportunitySchema.safeParse(p).success, false);
});
test('CT-13: route methods require relationship support for the exact revision and destination', () => {
  for (const [method, destination] of [['portal', 'https://ats.example/intake'], ['email', 'apply@issuer.example'], ['in_person', 'Fictional reception'], ['post', 'Fictional postal address']]) {
    const x = makeRecord(); x.applicationRoute.value = { method, destination }; x.checks[0].destination = destination;
    assert.equal(projected(x).application.route.method, method);
    x.checks[0].recordRevision = 2; assert.equal(projected(x).application.state, 'unavailable');
  }
  const x = makeRecord(); x.applicationRoute.value.destination = 'https://other.example/apply'; assert.equal(projected(x).application.state, 'unavailable');
  for (const destination of ['javascript:alert(1)', 'http://issuer.example', 'https://user:pass@issuer.example']) {
    x.applicationRoute.value.destination = destination; invalid(x);
  }
});
test('CT-14: stale, unsupported and unreviewed explanations are not public guidance', () => {
  const x = makeRecord(); x.explanation = { text: 'Fictional reviewed explanation', assertionIds: [x.title.id], requirementRevision: 1, method: 'human', reviewedBy: 'reviewer_fixture', review: 'approved' };
  assert.ok(projected(x).explanation);
  x.requirements.revision = 2; assert.equal(projected(x).explanation, null);
  x.requirements.revision = 1; x.title.review = 'pending'; assert.equal(projected(x).explanation, null);
  x.explanation.assertionIds = ['absent']; invalid(x);
});
test('CT-15: separate intakes retain identity and unresolved/cyclic aliases do not redirect', () => {
  const a = makeRecord(), b = makeRecord(); b.id = 'intake_b'; assert.notEqual(projected(a).id, projected(b).id);
  const alias = { schemaVersion: 1, fromId: 'a', toId: 'b', revision: 1, decision: 'confirmed' };
  assert.equal(resolveAlias('a', [alias]), 'b');
  assert.equal(resolveAlias('a', [{ ...alias, decision: 'proposed' }]), null);
  assert.equal(resolveAlias('a', [alias, { ...alias, fromId: 'b', toId: 'a' }]), null);
});
test('CT-16: bounded queries and filter/revision-bound cursors have explicit safe errors', () => {
  for (const raw of ['limit=0', 'limit=51', 'limit=1e1', 'limit=2&limit=3', 'userId=secret', 'remote=yes', 'category=trade_test', '__proto__=x'])
    assert.equal(parseReadQuery(new URLSearchParams(raw)).ok, false, raw);
  const query = parseReadQuery(new URLSearchParams('category=job&q=été&limit=50')).query;
  const cursor = encodeCursor(query, 1, { updatedAt: NOW, id: 'last_item' });
  assert.equal(decodeCursor(cursor, query, 1).ok, true);
  assert.equal(decodeCursor(cursor, { ...query, category: 'bursary' }, 1).error.code, 'INVALID_CURSOR');
  assert.equal(decodeCursor(cursor, query, 2).error.code, 'STALE_CURSOR');
  assert.equal(decodeCursor('private-data!!', query, 1).error.code, 'INVALID_CURSOR');
});
test('CT-17: serialization is bounded JSON, versioned and lossless', () => {
  const x = makeRecord(); assert.deepEqual(deserializeRecord(serializeRecord(x)), x);
  x.schemaVersion = 2; invalid(x);
  const y = makeRecord(); y.private.rawSource = undefined; invalid(y);
  const z = makeRecord(); z.compensation[0].value.amount = Infinity; invalid(z);
  assert.throws(() => deserializeRecord('{private-secret'), /^Error: INVALID_RECORD$/);
});
test('CT-18: legacy conversion is repeatable review work, never automatic publication', () => {
  const legacy = { id: 'old_1', title: 'Fictional legacy', organisation: 'Fictional legacy issuer', opportunityType: 'trade_test', deadline: null, salaryAmount: 0, salaryCurrency: 'ZAR', isVerifiedSource: true };
  const result = migrateLegacy(legacy); assert.equal(result.kind, 'manual_review'); assert.equal(result.candidateCategory, null);
  assert.deepEqual(result.legacy, legacy); assert.deepEqual(migrateLegacy(result), result);
  assert.equal(projectOpportunity(result).kind, 'invalid');
  assert.equal(migrateLegacy(makeRecord()).kind, 'current');
  assert.equal(migrateLegacy({ ...makeRecord(), schemaVersion: 999 }).kind, 'invalid');
});
test('CT-20: read response examples parse with no external configuration or services', () => {
  assert.ok(ListResponseSchema.safeParse({ schemaVersion: 1, catalogueRevision: 1, asOf: NOW, items: [projected()], nextCursor: null }).success);
  const closed = makeRecord(); closed.lifecycle = 'closed';
  assert.equal(ListResponseSchema.safeParse({ schemaVersion: 1, catalogueRevision: 1, asOf: NOW, items: [projected(closed)], nextCursor: null }).success, false);
  assert.ok(ErrorResponseSchema.safeParse({ error: { code: 'NOT_FOUND' } }).success);
  assert.equal(ErrorResponseSchema.safeParse({ error: { code: 'NOT_FOUND', private: 'secret' } }).success, false);
});
test('newer negative relationship checks and equal-time contradictions disable handoff', () => {
  const x = makeRecord(); x.checks.push({ ...x.checks[0], id: 'new_check', outcome: 'contradicted' });
  assert.equal(projected(x).application.state, 'unavailable');
  x.checks[1].checkedAt = '2026-09-26T10:00:00.000Z'; assert.equal(projected(x).application.state, 'unavailable');
  x.checks[1].public = false; assert.equal(projected(x).application.state, 'unavailable');
  assert.equal(projected(x).checks.length, 1);
});
test('public projection accepts no inconsistent state/value, missing citations or closed action', () => {
  const p = projected(); p.title.citations = []; assert.equal(PublicOpportunitySchema.safeParse(p).success, false);
  const q = projected(); q.lifecycle = 'closed'; assert.equal(PublicOpportunitySchema.safeParse(q).success, false);
  assert.equal(ProjectionSchema.safeParse({ kind: 'not_public', secret: 'x' }).success, false);
});
