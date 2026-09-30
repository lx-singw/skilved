import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { DomainError } from './config.mjs';

/** ADC supplies the workload token; the token is verified rather than trusting an env email. */
export async function workerPrincipal(config, env = process.env) {
  if (config.mode === 'emulator') {
    if (env.NODE_ENV === 'production' || !config.projectId.startsWith('demo-') ||
        env.SKILVED_WORKER_EMULATOR_IDENTITY !== 'synthetic-worker@example.test') throw new DomainError('WORKER_UNAUTHORIZED');
    return 'synthetic-worker@example.test';
  }
  if (env.SKILVED_WORKER_EMULATOR_IDENTITY !== undefined) throw new DomainError('WORKER_UNAUTHORIZED');
  const audience = `https://skilved.invalid/worker/${config.projectId}`;
  try {
    const client = await new GoogleAuth().getIdTokenClient(audience);
    const headers = await client.getRequestHeaders();
    const token = headers.get('authorization')?.replace(/^Bearer /, '');
    if (!token) throw new Error();
    const ticket = await new OAuth2Client().verifyIdToken({ idToken: token, audience });
    const p = ticket.getPayload();
    if (!p?.email_verified || !/^[a-z0-9-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com$/.test(p.email ?? '')) throw new Error();
    return p.email;
  } catch { throw new DomainError('WORKER_UNAUTHORIZED'); }
}
