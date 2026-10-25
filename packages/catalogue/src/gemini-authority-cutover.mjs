import { isDeepStrictEqual } from 'node:util';
import { createHash } from 'node:crypto';
import { configuration, DomainError } from './config.mjs';
import { validateStagingMigrationManifest } from './staging-migration.mjs';
import { geminiAuthorityRoute } from './ai/gemini-authority-routes.mjs';

const fail = code => { throw new DomainError(code); };
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const instant = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const read = snap => {
  if (!snap.exists) return null;
  try {
    const raw = snap.data();
    if (Object.keys(raw).length !== 1 || typeof raw.json !== 'string') throw new Error();
    return JSON.parse(raw.json);
  } catch { fail('GEMINI_CUTOVER_CONFLICT'); }
};
const forbidden = ['workers','operators','worker_queue','worker_leases','worker_watches','public'];

/** Create authority only from an exact, idle staging replica and a fresh local
 * drain receipt. No grants, queue reconstruction, counter resets or publication.
 * The operator must stop external/older callers separately; a Firestore
 * transaction cannot fence arbitrary code or credentials outside this runtime.
 */
export async function activateStagingGeminiAuthority(db, manifest, {
  expectedSha256, expectedQuotaSha256, drain, env = process.env,
  now = () => new Date().toISOString(),
} = {}) {
  const config = configuration(env);
  if (config?.mode !== 'cloud' || config.projectId !== 'skilved-staging' ||
      db.projectId !== config.projectId || db.databaseId !== '(default)') fail('UNSAFE_CONFIGURATION');
  const checked = validateStagingMigrationManifest(manifest, { expectedSha256, now });
  const route = geminiAuthorityRoute(checked.manifest.quotaSummary.scopeHash), at = now();
  if (!route || route.projectId !== db.projectId || !hash(expectedQuotaSha256) ||
      expectedQuotaSha256 !== checked.manifest.provenance.quotaSha256 ||
      !drain || !hash(drain.sha256) || !instant(drain.at) || !instant(at) ||
      drain.at > at || Date.parse(at) - Date.parse(drain.at) > 600_000) fail('GEMINI_CUTOVER_REVIEW_REQUIRED');
  const authorityBody = { version:1,provider:'gemini',scopeHash:route.scopeHash,projectId:route.projectId,
    epoch:route.epoch,status:'active',migrationSha256:expectedSha256,quotaSha256:expectedQuotaSha256 };
  const handoffBody = { version:1,operation:'quota_authority_cutover',scopeHash:route.scopeHash,epoch:route.epoch,
    projectId:route.projectId,databaseId:route.databaseId,manifestSha256:expectedSha256,
    quotaSha256:expectedQuotaSha256,documentCount:checked.documentCount,quotaSummary:checked.manifest.quotaSummary,
    sourceBindings:checked.manifest.sourceBindings,drainSha256:drain.sha256,drainedAt:drain.at,
    localLedgerRetired:true,workerGrantsCreated:false,publication:false };
  const authorityRef = db.collection('m0_model_authorities').doc(route.scopeHash);
  const handoffRef = db.collection('m0_model_authority_handoffs').doc(createHash('sha256').update(`${route.scopeHash}:${route.epoch}`).digest('hex'));

  async function inspect(tx) {
    const authority = read(await tx.get(authorityRef)), handoff = read(await tx.get(handoffRef));
    for (const name of forbidden) if ((await tx.get(db.collection(`m0_${name}`).limit(1))).size) fail('GEMINI_CUTOVER_ACTIVE_TARGET');
    for (const [name, expected] of Object.entries(checked.manifest.collections)) {
      const rows = await tx.get(db.collection(name).orderBy('__name__').limit(451));
      const byId = new Map(expected.map(row => [row.id,row.data]));
      if (rows.size !== byId.size) fail('GEMINI_CUTOVER_CONFLICT');
      for (const row of rows.docs) if (!byId.has(row.id) || !isDeepStrictEqual(row.data(),byId.get(row.id))) fail('GEMINI_CUTOVER_CONFLICT');
    }
    const imports = await tx.get(db.collection('m0_staging_imports').limit(2));
    if (imports.size !== 1 || imports.docs[0].id !== expectedSha256) fail('GEMINI_CUTOVER_CONFLICT');
    const imported = read(imports.docs[0]);
    const expectedImport = {version:1,targetProjectId:route.projectId,manifestSha256:expectedSha256,
      documentCount:checked.documentCount,collectionCounts:checked.collectionCounts,
      sourceBindings:checked.manifest.sourceBindings,quotaSummary:checked.manifest.quotaSummary,
      provenance:checked.manifest.provenance,authorityCreated:false,publication:false,
      operationalState:'inactive_replica',representation:'legacy_semantic_reconstruction',importedAt:imported?.importedAt};
    if (!instant(imported?.importedAt) || imported.importedAt < checked.manifest.createdAt || imported.importedAt > at ||
        !isDeepStrictEqual(imported,expectedImport)) fail('GEMINI_CUTOVER_CONFLICT');
    for (const [name,expectedId,exists] of [['m0_model_authorities',route.scopeHash,authority!==null],
      ['m0_model_authority_handoffs',handoffRef.id,handoff!==null]]) {
      const rows=await tx.get(db.collection(name).limit(2));
      if(rows.size!==(exists?1:0) || rows.docs.some(row=>row.id!==expectedId)) fail('GEMINI_CUTOVER_CONFLICT');
    }
    if (authority === null && handoff === null) return null;
    if (!authority || !handoff || !instant(authority.activatedAt) || authority.activatedAt < drain.at || authority.activatedAt > at ||
        !isDeepStrictEqual(authority,{...authorityBody,activatedAt:authority.activatedAt}) ||
        !isDeepStrictEqual(handoff,{...handoffBody,activatedAt:authority.activatedAt})) fail('GEMINI_CUTOVER_CONFLICT');
    return authority.activatedAt;
  }
  const observed = await db.runTransaction(inspect,{readOnly:true});
  const result = {projectId:route.projectId,scopeHash:route.scopeHash,epoch:route.epoch,documentCount:checked.documentCount};
  if (observed) return {...result,status:'verified',activatedAt:observed};
  return db.runTransaction(async tx => {
    const current = await inspect(tx);
    if (current) return {...result,status:'verified',activatedAt:current};
    const activatedAt = now();
    if (!instant(activatedAt) || activatedAt < at || Date.parse(activatedAt)-Date.parse(drain.at)>600_000)
      fail('GEMINI_CUTOVER_REVIEW_REQUIRED');
    tx.create(authorityRef,{json:JSON.stringify({...authorityBody,activatedAt})});
    tx.create(handoffRef,{json:JSON.stringify({...handoffBody,activatedAt})});
    return {...result,status:'activated',activatedAt};
  });
}
