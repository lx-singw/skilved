import { createHash } from 'node:crypto';
import { configuration, DomainError } from './config.mjs';

const defaults = { maxCollections: 64, maxDocuments: 10000, maxBytes: 32 * 1024 * 1024 };
const fail = code => { throw new DomainError(code); };
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

// JSON exports must never silently coerce Firestore timestamps, references,
// buffers or non-finite numbers into different values. Current m0 records use
// plain JSON fields, including the exact, unparsed `json` string.
function assertJson(value, depth = 0) {
  if (depth > 64) fail('SHADOW_CHECKPOINT_DATA_UNSUPPORTED');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (Array.isArray(value)) { for (const item of value) assertJson(item, depth + 1); return; }
  if (typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
    fail('SHADOW_CHECKPOINT_DATA_UNSUPPORTED');
  for (const item of Object.values(value)) assertJson(item, depth + 1);
}

/** Read-only export of this demo project's m0 top-level JSON documents.
 * Not an Auth backup, a provider-wide quota ledger, or a restore operation.
 * Stop local workers before capture; collection membership is checked twice.
 */
export async function captureShadowCheckpoint(db, { env = process.env, now = () => new Date().toISOString(), ...limits } = {}) {
  const config = configuration(env);
  if (config?.mode !== 'emulator' || db.projectId !== config.projectId) fail('UNSAFE_CONFIGURATION');
  for (const key of Object.keys(limits)) if (!(key in defaults)) fail('SHADOW_CHECKPOINT_LIMIT_INVALID');
  const bound = { ...defaults, ...limits };
  for (const [key, value] of Object.entries(bound))
    if (!Number.isSafeInteger(value) || value < 1 || value > defaults[key]) fail('SHADOW_CHECKPOINT_LIMIT_INVALID');
  const names = async () => {
    const selected = (await db.listCollections()).map(c => c.id).filter(id => id.startsWith('m0_')).sort();
    if (selected.length > bound.maxCollections) fail('SHADOW_CHECKPOINT_LIMIT');
    if (selected.some(id => !/^m0_[a-z][a-z_]*$/.test(id))) fail('SHADOW_CHECKPOINT_COLLECTION_UNSUPPORTED');
    return selected;
  };
  const before = await names();
  const collections = await db.runTransaction(async tx => {
    const result = {}; let documents = 0, bytes = 0;
    for (const name of before) {
      const rows = await tx.get(db.collection(name).orderBy('__name__').limit(bound.maxDocuments - documents + 1));
      documents += rows.size;
      if (documents > bound.maxDocuments) fail('SHADOW_CHECKPOINT_LIMIT');
      result[name] = rows.docs.map(row => {
        const data = row.data(); assertJson(data);
        const record = { id: row.id, data };
        bytes += Buffer.byteLength(JSON.stringify(record));
        if (bytes > bound.maxBytes) fail('SHADOW_CHECKPOINT_LIMIT');
        return record;
      });
    }
    return result;
  }, { readOnly: true });
  if (JSON.stringify(before) !== JSON.stringify(await names())) fail('SHADOW_CHECKPOINT_COLLECTIONS_CHANGED');
  const capturedAt = now();
  if (typeof capturedAt !== 'string' || !Number.isFinite(Date.parse(capturedAt))) fail('SHADOW_CHECKPOINT_TIME_INVALID');
  const checkpoint = { version: 1, scope: 'm0_top_level_json', projectId: config.projectId, capturedAt,
    consistency: 'read_only_transaction', collections };
  const complete = { ...checkpoint, sha256: digest(checkpoint) };
  if (Buffer.byteLength(JSON.stringify(complete)) > bound.maxBytes) fail('SHADOW_CHECKPOINT_LIMIT');
  return complete;
}

export const shadowCheckpointCounts = checkpoint => Object.fromEntries(
  Object.entries(checkpoint.collections).map(([name, rows]) => [name, rows.length]));
