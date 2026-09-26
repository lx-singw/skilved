const EMULATORS = ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST', 'PUBSUB_EMULATOR_HOST'];
export class DomainError extends Error {
  constructor(code) { super(code); this.code = code; }
}
export function configuration(env = process.env) {
  const mode = env.SKILVED_CATALOGUE_MODE;
  if (env.NODE_ENV === 'production' && EMULATORS.some(k => env[k] !== undefined)) throw new DomainError('UNSAFE_CONFIGURATION');
  if (!mode || mode === 'disabled') return null;
  if (!['emulator', 'cloud'].includes(mode)) throw new DomainError('UNSAFE_CONFIGURATION');
  const projectId = env.SKILVED_CATALOGUE_PROJECT;
  if (!projectId || !/^[a-z][a-z0-9-]{5,40}$/.test(projectId)) throw new DomainError('UNSAFE_CONFIGURATION');
  if (mode === 'emulator') {
    if (env.NODE_ENV === 'production' || !projectId.startsWith('demo-') ||
      !['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST'].every(k => /^127\.0\.0\.1:[1-9]\d{3,4}$/.test(env[k] ?? '') && Number(env[k].split(':')[1]) <= 65535)) throw new DomainError('UNSAFE_CONFIGURATION');
  } else if (projectId.startsWith('demo-') || EMULATORS.some(k => env[k] !== undefined)) throw new DomainError('UNSAFE_CONFIGURATION');
  return { mode, projectId, reads: env.SKILVED_CATALOGUE_READS === 'true', reports: env.SKILVED_CATALOGUE_REPORTS === 'true' };
}
