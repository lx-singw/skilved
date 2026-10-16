import { z } from 'zod';
import { SuggestionRequestSchema, SuggestionCreateResponseSchema, SuggestionStatusResponseSchema } from '@skilved/types/opportunities/suggestions';

export const SuggestionHttpConfig = z.object({ enabled: z.boolean(), intakeEnabled: z.boolean(), origin: z.string().max(200),
  emulator: z.boolean().default(false), readDeadlineMs: z.number().int().min(1).max(5000).default(5000),
  serviceDeadlineMs: z.number().int().min(1).max(10000).default(10000),
}).strict().refine(config => {
  try {
    const url = new URL(config.origin);
    return url.origin === config.origin && !url.username && !url.password && (url.protocol === 'https:' ||
      (config.emulator && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)));
  } catch { return false; }
});
const responseHeaders = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store',
  Pragma: 'no-cache', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow' };
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: responseHeaders });
class Rejection extends Error { constructor(code, status) { super(code); this.code = code; this.status = status; } }
const reject = (code = 'INVALID_REQUEST', status = 400) => { throw new Rejection(code, status); };
const errorReply = (code, status) => reply({ error: { code } }, status);
async function deadline(work, ms, code, status) {
  let timer;
  try { return await Promise.race([work, new Promise((_, fail) => { timer = setTimeout(() => fail(new Rejection(code, status)), ms); })]); }
  finally { clearTimeout(timer); }
}
async function body(request, ms) {
  const reader = request.body?.getReader();
  if (!reader) reject();
  const chunks = []; let bytes = 0, abort;
  const aborted = new Promise((_, fail) => { abort = () => fail(new Rejection('REQUEST_ABORTED', 408)); });
  request.signal.addEventListener('abort', abort, { once: true });
  if (request.signal.aborted) abort();
  const read = async () => {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 4096) reject('BODY_TOO_LARGE', 413);
      chunks.push(value);
    }
  };
  try {
    await deadline(Promise.race([read(), aborted]), ms, 'BODY_TIMEOUT', 408);
    const length = request.headers.get('content-length');
    if (length !== null && Number(length) !== bytes) reject();
    const buffer = new Uint8Array(bytes); let offset = 0;
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
    let parsed;
    try { parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer)); } catch { reject(); }
    const requestBody = SuggestionRequestSchema.safeParse(parsed);
    if (!requestBody.success) reject();
    return requestBody.data;
  } finally {
    request.signal.removeEventListener('abort', abort);
    // Do not await a client-controlled cancel promise or claim cancellation of backend work.
    try { reader.cancel().catch(() => {}); } catch {}
    try { reader.releaseLock(); } catch {}
  }
}

/** Pure transport adapter. No default provider, SDK import, runtime flag or app route. */
export async function handleSuggestion(request, { config, provider } = {}) {
  try {
    const parsed = SuggestionHttpConfig.safeParse(config);
    if (!parsed.success || !parsed.data.enabled) return errorReply('SERVICE_UNAVAILABLE', 503);
    const settings = parsed.data, url = new URL(request.url), path = url.pathname;
    const create = request.method === 'POST' && path === '/api/v1/opportunity-suggestions';
    const status = request.method === 'GET' && /^\/api\/v1\/opportunity-suggestions\/([a-f0-9]{64})\/status$/.exec(path);
    const withdraw = request.method === 'DELETE' && /^\/api\/v1\/opportunity-suggestions\/([a-f0-9]{64})$/.test(path);
    if (!create && !status && !withdraw) return errorReply('NOT_FOUND', 404);
    // Withdrawal has no lifecycle implementation yet; never return a false acknowledgement.
    if (withdraw || (create && !settings.intakeEnabled)) return errorReply('SERVICE_UNAVAILABLE', 503);
    if (url.origin !== settings.origin || (request.headers.has('origin') && request.headers.get('origin') !== settings.origin) ||
        (request.headers.has('sec-fetch-site') && !['same-origin', 'none'].includes(request.headers.get('sec-fetch-site')))) reject('FORBIDDEN_ORIGIN', 403);
    if (request.url.includes('?') || request.url.includes('#') || url.username || url.password || request.headers.has('cookie') || request.headers.has('content-encoding')) reject();
    let headerBytes = 0, count = 0;
    for (const [name, value] of request.headers) { headerBytes += new TextEncoder().encode(name + value).byteLength; count++; }
    if (count > 32 || headerBytes > 8192) reject('HEADERS_TOO_LARGE', 431);
    const length = request.headers.get('content-length');
    if (length !== null && !/^\d{1,8}$/.test(length)) reject();
    if (length !== null && Number(length) > 4096) reject('BODY_TOO_LARGE', 413);
    let input, credential;
    if (create) {
      credential = request.headers.get('idempotency-key');
      if (!credential || credential.length !== 64 || !/^[a-f0-9]{64}$/.test(credential) || request.headers.has('authorization')) reject();
      if (!/^application\/json(?:;\s*charset=utf-8)?$/i.test(request.headers.get('content-type') ?? '')) reject('UNSUPPORTED_MEDIA_TYPE', 415);
      input = await body(request, settings.readDeadlineMs);
    } else {
      const auth = request.headers.get('authorization');
      if (!auth || auth.length !== 71 || !/^Bearer [a-f0-9]{64}$/.test(auth) || request.headers.has('idempotency-key')) reject('NOT_FOUND', 404);
      if (request.body !== null || (length !== null && Number(length) !== 0)) reject();
      credential = auth.slice(7); input = { receiptId: status[1], capability: credential };
    }
    if (typeof provider !== 'function') return errorReply('SERVICE_UNAVAILABLE', 503);
    const work = async () => {
      const service = await provider();
      return create ? service.create(input, credential) : service.status(input);
    };
    const result = await deadline(work(), settings.serviceDeadlineMs, 'SERVICE_UNAVAILABLE', 503);
    const output = (create ? SuggestionCreateResponseSchema : SuggestionStatusResponseSchema).safeParse(result);
    if (!output.success || (!create && output.data.receiptId !== input.receiptId)) return errorReply('SERVICE_UNAVAILABLE', 503);
    return reply(output.data, create && output.data.kind === 'received' ? 202 : 200);
  } catch (error) {
    if (error instanceof Rejection) return errorReply(error.code, error.status);
    const mappings = { SUGGESTION_NOT_FOUND: ['NOT_FOUND', 404], SUGGESTION_CONFLICT: ['CONFLICT', 409],
      SUGGESTION_RATE_LIMITED: ['RATE_LIMITED', 429], SUGGESTION_UNSUPPORTED: ['UNSUPPORTED_SOURCE', 422],
      SUGGESTION_PAUSED: ['SOURCE_PAUSED', 503], SUGGESTION_SOURCE_CHANGED: ['SOURCE_CHANGED', 503],
      SUGGESTION_CAPACITY: ['CAPACITY_UNAVAILABLE', 503], INVALID_COMMAND: ['INVALID_REQUEST', 400] };
    const mapped = typeof error?.code === 'string' && Object.hasOwn(mappings, error.code) ? mappings[error.code] : null;
    return mapped ? errorReply(...mapped) : errorReply('SERVICE_UNAVAILABLE', 503);
  }
}
