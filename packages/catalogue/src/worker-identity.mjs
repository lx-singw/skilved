import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { DomainError } from './config.mjs';

/** ADC supplies the workload token; the token is verified rather than trusting an env email. */
export async function workerPrincipal(config, env = process.env, { auth, verifier } = {}) {
  if (!config || !['emulator','cloud'].includes(config.mode) ||
      !/^[a-z][a-z0-9-]{5,40}$/.test(config.projectId ?? '')) throw new DomainError('WORKER_UNAUTHORIZED');
  if (config.mode === 'emulator') {
    if (env.NODE_ENV === 'production' || !config.projectId.startsWith('demo-') ||
        env.SKILVED_WORKER_EMULATOR_IDENTITY !== 'synthetic-worker@example.test') throw new DomainError('WORKER_UNAUTHORIZED');
    return 'synthetic-worker@example.test';
  }
  if (env.SKILVED_WORKER_EMULATOR_IDENTITY !== undefined) throw new DomainError('WORKER_UNAUTHORIZED');
  const audience = `https://skilved.invalid/worker/${config.projectId}`;
  try {
    // Trusted backend injection supports an in-memory delegated client without
    // installing global ADC. Token verification remains mandatory on both paths.
    const client = await (auth ?? new GoogleAuth()).getIdTokenClient(audience);
    const headers = await client.getRequestHeaders();
    const token = headers.get('authorization')?.replace(/^Bearer /, '');
    if (!token) throw new Error();
    const ticket = await (verifier ?? new OAuth2Client()).verifyIdToken({ idToken: token, audience });
    const p = ticket.getPayload();
    if (p?.email_verified !== true || !/^[a-z0-9-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com$/.test(p.email ?? '')) throw new Error();
    return p.email;
  } catch { throw new DomainError('WORKER_UNAUTHORIZED'); }
}
