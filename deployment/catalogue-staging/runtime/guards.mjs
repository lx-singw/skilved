// Separate from application policy: these images are deliberately staging-only.
export const STAGING_PROJECT = 'skilved-staging';
const absent = (env, keys) => keys.every(key => env[key] === undefined);
const reject = () => { throw Object.assign(new Error('STAGING_CONFIGURATION_REQUIRED'), {code:'STAGING_CONFIGURATION_REQUIRED'}); };
export function stagingEnvironment(kind, env = process.env) {
  if (!['web', 'worker'].includes(kind) || env.NODE_ENV !== 'production' ||
      env.SKILVED_STAGING_PROJECT !== STAGING_PROJECT || env.SKILVED_CATALOGUE_PROJECT !== STAGING_PROJECT ||
      env.SKILVED_CATALOGUE_MODE !== 'cloud' || env.SKILVED_CATALOGUE_REPORTS !== 'false' ||
      env.SKILVED_SUGGESTIONS_ENABLED !== 'false' ||
      !absent(env, ['GOOGLE_APPLICATION_CREDENTIALS','FIRESTORE_EMULATOR_HOST','FIREBASE_AUTH_EMULATOR_HOST',
        'FIREBASE_STORAGE_EMULATOR_HOST','PUBSUB_EMULATOR_HOST','SKILVED_WORKER_EMULATOR_IDENTITY'])) reject();
  if (kind === 'web') {
    if (env.SKILVED_CATALOGUE_READS !== 'true' || env.SKILVED_AI_MODE !== 'disabled' ||
        !absent(env, ['GEMINI_API_KEY', 'GROQ_API_KEY', 'SKILVED_SUGGESTIONS_CONFIG'])) reject();
    const port = env.PORT ?? '8080';
    if (!/^[1-9]\d{0,4}$/.test(port) || Number(port) > 65535) reject();
    return {projectId:STAGING_PROJECT, port:Number(port)};
  }
  if (env.SKILVED_STAGING_WORKER_ENABLED !== 'true' || env.SKILVED_CATALOGUE_READS !== 'false' || env.SKILVED_AI_MODE !== 'gemini' ||
      env.SKILVED_GEMINI_AUTHORITY_PROJECT !== STAGING_PROJECT ||
      !/^[a-f0-9]{64}$/.test(env.SKILVED_GEMINI_AUTHORITY_EPOCH ?? '') ||
      !/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(env.SKILVED_GEMINI_PROJECT_ID ?? '') ||
      !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,95}$/.test(env.SKILVED_STAGING_SOURCE_ID ?? '') ||
      !/^[1-9]\d{0,8}$/.test(env.SKILVED_STAGING_SOURCE_REVISION ?? '') ||
      !/^[a-z0-9-]+@skilved-staging\.iam\.gserviceaccount\.com$/.test(env.SKILVED_STAGING_WORKER_PRINCIPAL ?? '')) reject();
  return {projectId:STAGING_PROJECT, sourceId:env.SKILVED_STAGING_SOURCE_ID,
    sourceRevision:Number(env.SKILVED_STAGING_SOURCE_REVISION), principal:env.SKILVED_STAGING_WORKER_PRINCIPAL};
}
export function stagingWorkerAdmission(settings, source, grant, principal) {
  if (principal !== settings.principal || source?.id !== settings.sourceId || source?.revision !== settings.sourceRevision ||
      source?.paused !== false || source?.permission?.method !== 'recentjobs_html' || source?.automation?.mode !== 'shadow' ||
      source?.automation?.employerCrawl !== false || grant?.active !== true || grant?.principal !== principal ||
      !Array.isArray(grant?.sources) || !grant.sources.includes(settings.sourceId) ||
      !Array.isArray(grant?.roles) || grant.roles.length !== 1 || grant.roles[0] !== 'ingest') reject();
}
