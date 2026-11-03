import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { DomainError } from './config.mjs';
import { setTimeout as delay } from 'node:timers/promises';

const networkCodes = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN', 'ENETUNREACH', 'EHOSTUNREACH', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_SOCKET']);
const credentialCodes = new Set(['GCLOUD_ACCOUNT_CHANGED', 'GCLOUD_ACCOUNT_REQUIRED', 'GCLOUD_CREDENTIAL_COMMAND_FAILED', 'GCLOUD_CREDENTIAL_METADATA_INVALID', 'GCLOUD_CREDENTIAL_OVERRIDE', 'GCLOUD_CREDENTIAL_ENV_CONFLICT']);
function diagnostic(error, stage, attempt) {
  const candidate = error?.response?.status;
  const status = Number.isInteger(candidate) && candidate >= 100 && candidate <= 599 ? candidate : null;
  const networkCode = [error?.code, error?.cause?.code].find(code => networkCodes.has(code)) ?? null;
  const credentialCode = credentialCodes.has(error?.code) ? error.code : null;
  const transient = stage !== 'principal' && !credentialCode && (status !== null ? [408, 429, 500, 502, 503, 504].includes(status) : networkCode !== null);
  return { stage, attempt, status, networkCode, credentialCode, retrying: transient && attempt < 3 };
}

/** ADC supplies the workload token; the token is verified rather than trusting an env email. */
export async function workerPrincipal(config, env = process.env, { auth, verifier, onDiagnostic = () => {},
  wait = (ms, signal) => delay(ms, undefined, { signal }), signal } = {}) {
  if (typeof onDiagnostic !== 'function' || typeof wait !== 'function' ||
      signal !== undefined && !(signal instanceof AbortSignal)) throw new DomainError('WORKER_UNAUTHORIZED');
  if (!config || !['emulator','cloud'].includes(config.mode) ||
      !/^[a-z][a-z0-9-]{5,40}$/.test(config.projectId ?? '')) throw new DomainError('WORKER_UNAUTHORIZED');
  if (config.mode === 'emulator') {
    if (env.NODE_ENV === 'production' || !config.projectId.startsWith('demo-') ||
        env.SKILVED_WORKER_EMULATOR_IDENTITY !== 'synthetic-worker@example.test') throw new DomainError('WORKER_UNAUTHORIZED');
    return 'synthetic-worker@example.test';
  }
  if (env.SKILVED_WORKER_EMULATOR_IDENTITY !== undefined) throw new DomainError('WORKER_UNAUTHORIZED');
  const audience = `https://skilved.invalid/worker/${config.projectId}`;
  const cancelled = () => { if (signal?.aborted) throw new DomainError('WORKER_STOP_REQUESTED'); };
  for (let attempt = 1; attempt <= 3; attempt++) {
    cancelled();
    let stage = 'credentials';
    try {
      // Trusted backend injection supports an in-memory delegated client without
      // installing global ADC. Token verification remains mandatory on both paths.
      const client = await (auth ?? new GoogleAuth()).getIdTokenClient(audience);
      stage = 'token';
      const headers = await client.getRequestHeaders();
      const token = headers.get('authorization')?.replace(/^Bearer /, '');
      if (!token) throw new Error();
      stage = 'verification';
      const ticket = await (verifier ?? new OAuth2Client()).verifyIdToken({ idToken: token, audience });
      stage = 'principal';
      const p = ticket.getPayload();
      if (p?.email_verified !== true || !/^[a-z0-9-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com$/.test(p.email ?? '')) throw new Error();
      cancelled();
      return p.email;
    } catch (error) {
      cancelled();
      const detail = diagnostic(error, stage, attempt);
      // Diagnostics contain only enums and numbers, never tokens, bodies or raw errors.
      try { await onDiagnostic({ ...detail }); } catch { /* Observability cannot grant access. */ }
      if (!detail.retrying) {
        const failure = new DomainError('WORKER_UNAUTHORIZED');
        failure.identityFailure = detail;
        throw failure;
      }
      // Only credential acquisition/verification is repeated; no source or AI work.
      cancelled();
      try { await wait(attempt * 1000, signal); }
      catch {
        cancelled();
        const failure = new DomainError('WORKER_UNAUTHORIZED');
        failure.identityFailure = detail;
        throw failure;
      }
      cancelled();
    }
  }
}
