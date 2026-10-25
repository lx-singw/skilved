import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { configuration, DomainError } from './config.mjs';
import { Source } from './schemas.mjs';

export const STAGING_MIGRATION_COLLECTIONS = Object.freeze([
  'sources', 'source_versions', 'worker_jobs', 'worker_holds', 'worker_candidates',
  'worker_exceptions', 'worker_decisions', 'model_cache', 'model_calls', 'model_budgets',
  'model_usage', 'model_availability', 'drafts', 'snapshots', 'worker_notice_origins',
  'worker_origin_imports', 'worker_assessments', 'audit',
].map(name => `m0_${name}`).sort());
const PROJECT = 'skilved-staging', RECEIPTS = 'm0_staging_imports';
const FORBIDDEN_TARGET_COLLECTIONS = ['m0_workers', 'm0_worker_queue', 'm0_worker_leases', 'm0_worker_watches', 'm0_public', 'm0_operators', 'm0_model_authorities'];
const MAX_DOCUMENTS = 450, MAX_BYTES = 8 * 1024 * 1024, MAX_AGE_MS = 24 * 3600000;
const fail = code => { throw new DomainError(code); };
const sha = text => createHash('sha256').update(text).digest('hex');
const hashPattern = /^[a-f0-9]{64}$/;
const integer = value => Number.isSafeInteger(value) && value >= 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));
const keys = (value, expected) => object(value) &&
  isDeepStrictEqual(Object.keys(value).sort(), [...expected].sort());
const instant = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  instant(`${value}T00:00:00.000Z`);

function assertJson(value, depth = 0) {
  if (depth > 64) fail('STAGING_MIGRATION_DATA_INVALID');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (Array.isArray(value)) { for (const row of value) assertJson(row, depth + 1); return; }
  if (!object(value)) fail('STAGING_MIGRATION_DATA_INVALID');
  for (const [key, item] of Object.entries(value)) {
    if (!key || key.includes('\0')) fail('STAGING_MIGRATION_DATA_INVALID');
    assertJson(item, depth + 1);
  }
}
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (object(value)) return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
/** Hash the reviewed manifest, including exact raw JSON strings and document IDs. */
export function stagingMigrationManifestHash(manifest) {
  assertJson(manifest);
  if (!object(manifest)) fail('STAGING_MIGRATION_MANIFEST_INVALID');
  const { sha256, ...body } = manifest;
  return sha(canonical(body));
}

/** Validate an already parsed, bounded manifest without connecting to a database.
 * The independent expected hash must come from the reviewed private manifest.
 * Historical timestamps and spent budgets remain historical; none are refreshed.
 */
export function validateStagingMigrationManifest(input, { expectedSha256, now = () => new Date().toISOString() } = {}) {
  if (!hashPattern.test(expectedSha256 ?? '')) fail('STAGING_MIGRATION_REVIEW_REQUIRED');
  assertJson(input);
  if (Buffer.byteLength(JSON.stringify(input)) > MAX_BYTES) fail('STAGING_MIGRATION_LIMIT');
  if (!keys(input, ['version', 'scope', 'targetProjectId', 'createdAt', 'provenance', 'sourceBindings', 'quotaSummary', 'collections', 'sha256']) ||
      input.version !== 1 || input.scope !== 'private_worker_history' || input.targetProjectId !== PROJECT)
    fail('STAGING_MIGRATION_MANIFEST_INVALID');
  if (input.sha256 !== expectedSha256 || stagingMigrationManifestHash(input) !== expectedSha256)
    fail('STAGING_MIGRATION_HASH_MISMATCH');
  const manifest = JSON.parse(JSON.stringify(input)), at = now();
  const provenance = manifest.provenance;
  if (!instant(at) || !instant(manifest.createdAt) || Date.parse(at) < Date.parse(manifest.createdAt) ||
      Date.parse(at) - Date.parse(manifest.createdAt) > MAX_AGE_MS ||
      !keys(provenance, ['pilotSha256', 'quotaSha256', 'pilotObservedAt', 'quotaExportedAt']) ||
      !hashPattern.test(provenance.pilotSha256) || !hashPattern.test(provenance.quotaSha256) ||
      !instant(provenance.pilotObservedAt) || !instant(provenance.quotaExportedAt) ||
      provenance.pilotObservedAt > provenance.quotaExportedAt || provenance.quotaExportedAt > manifest.createdAt ||
      Date.parse(manifest.createdAt) - Date.parse(provenance.pilotObservedAt) > MAX_AGE_MS)
    fail('STAGING_MIGRATION_METADATA_INVALID');
  if (!keys(manifest.collections, STAGING_MIGRATION_COLLECTIONS)) fail('STAGING_MIGRATION_COLLECTION_INVALID');
  const parsed = {}, counts = {}; let documentCount = 0;
  for (const name of STAGING_MIGRATION_COLLECTIONS) {
    const rows = manifest.collections[name];
    if (!Array.isArray(rows)) fail('STAGING_MIGRATION_DATA_INVALID');
    documentCount += rows.length;
    if (documentCount > MAX_DOCUMENTS) fail('STAGING_MIGRATION_LIMIT');
    counts[name] = rows.length; const seen = new Set(); parsed[name] = [];
    for (const row of rows) {
      if (!keys(row, ['id', 'data']) || !/^[A-Za-z0-9_-]{1,128}$/.test(row.id ?? '') || seen.has(row.id) ||
          !object(row.data) || typeof row.data.json !== 'string') fail('STAGING_MIGRATION_DATA_INVALID');
      seen.add(row.id);
      let record; try { record = JSON.parse(row.data.json); } catch { fail('STAGING_MIGRATION_JSON_INVALID'); }
      if (!object(record)) fail('STAGING_MIGRATION_JSON_INVALID');
      assertJson(record); parsed[name].push({ id: row.id, record });
    }
  }
  if (!documentCount) fail('STAGING_MIGRATION_DATA_INVALID');
  const sources = new Map(parsed.m0_sources.map(({ id, record }) => [id, record]));
  if (!sources.size || !Array.isArray(manifest.sourceBindings)) fail('STAGING_MIGRATION_SOURCE_INVALID');
  for (const [id, source] of sources) {
    if (!Source.safeParse(source).success || source.id !== id || source.automation?.mode !== 'shadow' || source.automation.employerCrawl !== false)
      fail('STAGING_MIGRATION_SOURCE_INVALID');
  }
  const bindings = [...sources].map(([id, source]) => ({ id, revision: source.revision,
    maxModelCallsPerDay: source.automation.maxModelCallsPerDay })).sort((a, b) => a.id.localeCompare(b.id));
  if (!isDeepStrictEqual(manifest.sourceBindings, bindings)) fail('STAGING_MIGRATION_SOURCE_INVALID');
  for (const { id, record } of parsed.m0_source_versions) {
    const source = sources.get(record.id);
    if (!source || !Source.safeParse(record).success || record.revision > source.revision ||
        record.automation?.mode !== 'shadow' || record.automation.employerCrawl !== false || id !== sha(`${record.id}:${record.revision}`) ||
        record.revision === source.revision && !isDeepStrictEqual(record, source)) fail('STAGING_MIGRATION_SOURCE_INVALID');
  }
  const spend = new Map();
  for (const { id, record } of parsed.m0_model_budgets) {
    const source = sources.get(record.sourceId);
    if (!source || !date(record.date) || !integer(record.calls) || record.calls > source.automation.maxModelCallsPerDay ||
        id !== sha(`${record.sourceId}:${record.date}`)) fail('STAGING_MIGRATION_BUDGET_INVALID');
    spend.set(record.sourceId, (spend.get(record.sourceId) ?? 0) + record.calls);
  }
  for (const rows of Object.values(parsed)) for (const { record } of rows) {
    if (record.sourceId !== undefined && (!sources.has(record.sourceId) ||
        record.sourceRevision !== undefined && (!Number.isSafeInteger(record.sourceRevision) || record.sourceRevision < 1 ||
          record.sourceRevision > sources.get(record.sourceId).revision))) fail('STAGING_MIGRATION_SOURCE_INVALID');
  }
  const calls = new Map();
  for (const { record } of parsed.m0_model_calls) {
    if (!sources.has(record.sourceId) || !instant(record.at)) fail('STAGING_MIGRATION_BUDGET_INVALID');
    calls.set(record.sourceId, (calls.get(record.sourceId) ?? 0) + 1);
  }
  for (const [id, count] of calls) if (count > (spend.get(id) ?? 0)) fail('STAGING_MIGRATION_BUDGET_INVALID');
  const summary = manifest.quotaSummary;
  if (!keys(summary, ['scopeHash', 'requests', 'knownTotalTokens', 'unknownUsageCalls']) || !hashPattern.test(summary.scopeHash) ||
      ![summary.requests, summary.knownTotalTokens, summary.unknownUsageCalls].every(integer)) fail('STAGING_MIGRATION_QUOTA_INVALID');
  const totals = { requests: 0, knownTotalTokens: 0, unknownUsageCalls: 0 };
  for (const { id, record } of parsed.m0_model_usage) {
    if (record.scopeHash !== summary.scopeHash || record.provider !== 'gemini' || typeof record.model !== 'string' || !date(record.date) ||
        id !== sha(`${summary.scopeHash}:${record.model}:${record.date}`) ||
        ![record.requests, record.knownInputTokens, record.knownTotalTokens, record.unknownUsageCalls].every(integer) ||
        record.knownInputTokens > record.knownTotalTokens || record.unknownUsageCalls > record.requests || !Array.isArray(record.minute))
      fail('STAGING_MIGRATION_QUOTA_INVALID');
    const reservations = new Set();
    for (const row of record.minute) {
      if (!keys(row, ['id', 'at', 'inputTokens']) || !/^[A-Za-z0-9_-]{1,128}$/.test(row.id ?? '') ||
          reservations.has(row.id) || !instant(row.at) || row.at > provenance.quotaExportedAt ||
          row.inputTokens !== null && !integer(row.inputTokens)) fail('STAGING_MIGRATION_QUOTA_INVALID');
      reservations.add(row.id);
    }
    for (const key of Object.keys(totals)) totals[key] += record[key];
  }
  if (!Object.entries(totals).every(([key, count]) => Number.isSafeInteger(count) && count === summary[key]) ||
      parsed.m0_model_calls.filter(row => row.record.provider === 'gemini').length > summary.requests)
    fail('STAGING_MIGRATION_QUOTA_INVALID');
  for (const { id, record } of parsed.m0_model_availability) {
    if (record.scopeHash !== summary.scopeHash || record.provider !== 'gemini' || typeof record.model !== 'string' ||
        id !== sha(`${summary.scopeHash}:${record.model}`) || !instant(record.until)) fail('STAGING_MIGRATION_QUOTA_INVALID');
  }
  for (const { record } of parsed.m0_drafts) if (record.publication?.approved !== false || record.publication?.previouslyPublic !== false ||
      record.lifecycle !== 'review') fail('STAGING_MIGRATION_PUBLICATION_FORBIDDEN');
  return { manifest, documentCount, collectionCounts: counts, validatedAt: at };
}

function guard(db, env) {
  const config = configuration(env);
  if (config?.mode !== 'cloud' || config.projectId !== PROJECT || db.projectId !== PROJECT)
    fail('UNSAFE_CONFIGURATION');
}
const receiptBody = checked => ({ version: 1, targetProjectId: PROJECT, manifestSha256: checked.manifest.sha256,
  documentCount: checked.documentCount, collectionCounts: checked.collectionCounts, sourceBindings: checked.manifest.sourceBindings,
  quotaSummary: checked.manifest.quotaSummary, provenance: checked.manifest.provenance,
  authorityCreated: false, publication: false, operationalState: 'inactive_replica', representation: 'legacy_semantic_reconstruction' });

async function inspect(tx, db, checked) {
  const receiptRef = db.collection(RECEIPTS).doc(checked.manifest.sha256), receipt = await tx.get(receiptRef);
  for (const name of FORBIDDEN_TARGET_COLLECTIONS) {
    if ((await tx.get(db.collection(name).limit(1))).size) fail('STAGING_MIGRATION_AUTHORITY_PRESENT');
  }
  const receipts = await tx.get(db.collection(RECEIPTS).limit(2));
  if (receipts.size > (receipt.exists ? 1 : 0)) fail('STAGING_MIGRATION_TARGET_CONFLICT');
  let present = 0, mismatch = false;
  for (const name of STAGING_MIGRATION_COLLECTIONS) {
    const rows = await tx.get(db.collection(name).orderBy('__name__').limit(MAX_DOCUMENTS + 1));
    const expected = new Map(checked.manifest.collections[name].map(row => [row.id, row.data]));
    present += rows.size;
    if (rows.size > MAX_DOCUMENTS) mismatch = true;
    for (const row of rows.docs) if (!expected.has(row.id) || !isDeepStrictEqual(expected.get(row.id), row.data())) mismatch = true;
  }
  if (!receipt.exists && present === 0) return { status: 'empty', receiptRef };
  if (!receipt.exists || mismatch || present !== checked.documentCount) fail('STAGING_MIGRATION_TARGET_CONFLICT');
  const data = receipt.data(); let body;
  try { body = JSON.parse(data.json); } catch { fail('STAGING_MIGRATION_TARGET_CONFLICT'); }
  if (!keys(data, ['json']) || !keys(body, [...Object.keys(receiptBody(checked)), 'importedAt']) || !instant(body.importedAt))
    fail('STAGING_MIGRATION_TARGET_CONFLICT');
  const { importedAt, ...immutable } = body;
  if (!isDeepStrictEqual(immutable, receiptBody(checked)) || importedAt < checked.manifest.createdAt || importedAt > checked.validatedAt)
    fail('STAGING_MIGRATION_TARGET_CONFLICT');
  return { status: 'verified', receiptRef, importedAt };
}

/** Import reviewed private history only into the isolated staging project.
 * All reads precede one create-only atomic transaction. Existing target data is
 * never overwritten or merged. Exact replays perform only read-only verification.
 * No workers, grants, queues, scheduler state, public records or credentials move.
 */
export async function importStagingMigration(db, manifest, {
  expectedSha256, env = process.env, now = () => new Date().toISOString(),
} = {}) {
  guard(db, env);
  const checked = validateStagingMigrationManifest(manifest, { expectedSha256, now });
  const observed = await db.runTransaction(tx => inspect(tx, db, checked), { readOnly: true });
  const result = { manifestSha256: checked.manifest.sha256, documentCount: checked.documentCount,
    collectionCounts: checked.collectionCounts };
  if (observed.status === 'verified') return { ...result, status: 'verified', importedAt: observed.importedAt };
  return db.runTransaction(async tx => {
    const current = await inspect(tx, db, checked);
    if (current.status === 'verified') return { ...result, status: 'verified', importedAt: current.importedAt };
    const importedAt = now();
    if (!instant(importedAt)) fail('STAGING_MIGRATION_METADATA_INVALID');
    for (const name of STAGING_MIGRATION_COLLECTIONS) for (const row of checked.manifest.collections[name])
      tx.create(db.collection(name).doc(row.id), row.data);
    tx.create(current.receiptRef, { json: JSON.stringify({ ...receiptBody(checked), importedAt }) });
    return { ...result, status: 'imported', importedAt };
  });
}
