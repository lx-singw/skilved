import { configuration, DomainError } from './config.mjs';
import { Catalogue } from './store.mjs';
let runtime;
export async function getRuntime() {
  const config = configuration(); // Always guard before importing/initializing SDKs.
  if (!config) throw new DomainError('SERVICE_UNAVAILABLE');
  if (!runtime) runtime = (async () => {
    const [{ initializeApp, getApps, applicationDefault }, { getFirestore }, { getAuth }] = await Promise.all([
      import('firebase-admin/app'), import('firebase-admin/firestore'), import('firebase-admin/auth'),
    ]);
    const name = `m0-${config.projectId}`;
    const app = getApps().find(a => a.name === name) ?? initializeApp({ projectId: config.projectId,
      ...(config.mode === 'cloud' ? { credential: applicationDefault() } : {}) }, name);
    const db = getFirestore(app), auth = getAuth(app);
    return { config, db, auth, catalogue: new Catalogue(db, auth) };
  })();
  return runtime;
}
