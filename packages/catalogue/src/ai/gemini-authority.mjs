import { configuration, DomainError } from '../config.mjs';
import { geminiQuotaScope } from './gemini-quota.mjs';

const fail = code => { throw new DomainError(code); };
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const project = value => typeof value === 'string' && /^[a-z][a-z0-9-]{5,40}$/.test(value);
const instant = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;
const fields = ['version', 'provider', 'scopeHash', 'projectId', 'epoch', 'status',
  'migrationSha256', 'quotaSha256', 'activatedAt'].sort();

/** Every cloud worker must name its expected authority epoch. Only explicitly
 * configured demo emulators may run without one, for isolated regression work.
 * The authority database also owns jobs and source budgets: no split stores.
 */
export function geminiAuthorityConfiguration(db, env = process.env) {
  const config = configuration(env);
  if (!config || config.projectId !== db.projectId) fail('GEMINI_QUOTA_AUTHORITY_REQUIRED');
  const projectId = env.SKILVED_GEMINI_AUTHORITY_PROJECT, epoch = env.SKILVED_GEMINI_AUTHORITY_EPOCH;
  if (config.mode === 'emulator' && projectId === undefined && epoch === undefined) return null;
  if (!project(projectId) || projectId !== config.projectId || !hash(epoch))
    fail('GEMINI_QUOTA_AUTHORITY_REQUIRED');
  // Never rebase provider usage to the Firestore project's quota scope.
  if (!env.SKILVED_GEMINI_PROJECT_ID) fail('GEMINI_QUOTA_AUTHORITY_REQUIRED');
  return Object.freeze({ projectId, epoch, scopeHash: geminiQuotaScope(env) });
}

/** Check inside the same transaction as each claim, fetch admission, quota
 * reservation and write. A changed epoch causes transaction retries to fail.
 * This does not cancel an external request already admitted by a committed
 * reservation; cutover/revocation must drain in-flight work before reconciliation.
 */
export async function assertGeminiQuotaAuthority(tx, db, binding, now) {
  if (binding === null) return;
  const row = await tx.get(db.collection('m0_model_authorities').doc(binding.scopeHash));
  let record;
  try {
    const data = row.data();
    if (!row.exists || Object.keys(data).length !== 1 || typeof data.json !== 'string') throw new Error();
    record = JSON.parse(data.json);
    if (!record || typeof record !== 'object' || Array.isArray(record) ||
        Object.keys(record).sort().join('|') !== fields.join('|') || record.version !== 1 ||
        record.provider !== 'gemini' || !hash(record.scopeHash) || !project(record.projectId) ||
        !hash(record.epoch) || !hash(record.migrationSha256) || !hash(record.quotaSha256) ||
        !['active', 'revoked'].includes(record.status) || !instant(record.activatedAt) ||
        !instant(now) || record.activatedAt > now) throw new Error();
  } catch { fail('GEMINI_QUOTA_AUTHORITY_REQUIRED'); }
  if (record.status !== 'active' || record.projectId !== db.projectId ||
      record.projectId !== binding.projectId || record.scopeHash !== binding.scopeHash || record.epoch !== binding.epoch)
    fail('GEMINI_QUOTA_AUTHORITY_STALE');
}
