// Fixed labels only: error messages and arbitrary codes can contain credentials.
const CODES = new Set([
  'EAI_AGAIN', 'ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ENETUNREACH',
  'EHOSTUNREACH', 'ETIMEDOUT', 'EPIPE', 'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'UND_ERR_SOCKET',
  'CERT_HAS_EXPIRED', 'ERR_TLS_CERT_ALTNAME_INVALID',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN', 'ABORT_ERR', 'CLIENT_DEADLINE',
]);
const own = (object, key) => Object.getOwnPropertyDescriptor(object, key)?.value;

/** Inspect at most eight error objects without invoking accessors or serializing
 * causes. Node fetch commonly wraps DNS/socket errors in cause or AggregateError. */
export function transportCodeOf(error) {
  const queue = [error], seen = new Set();
  while (queue.length && seen.size < 8) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || seen.has(current)) continue;
    seen.add(current);
    try {
      for (const key of ['transportCode', 'code']) {
        const code = own(current, key);
        if (typeof code === 'string' && CODES.has(code)) return code;
      }
      const cause = own(current, 'cause');
      if (cause && typeof cause === 'object') queue.push(cause);
      const errors = own(current, 'errors');
      if (Array.isArray(errors)) {
        for (let i = 0; i < Math.min(own(errors, 'length'), 8) && queue.length < 8; i++) {
          const child = own(errors, String(i));
          if (child && typeof child === 'object') queue.push(child);
        }
      }
    } catch { /* Diagnostics must not replace the original failure. */ }
  }
  return null;
}
