import https from 'node:https';
import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import { DomainError } from './config.mjs';
export function publicAddress(address) {
  try { const ip = ipaddr.parse(address); return ip.range() === 'unicast' && !(ip.kind() === 'ipv6' && ip.isIPv4MappedAddress()); }
  catch { return false; }
}
export function approvedUrl(input, source) {
  let url;
  try { url = new URL(input); } catch { throw new DomainError('UNSAFE_URL'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash ||
    ipaddr.isValid(url.hostname.replace(/^\[|\]$/g, '')) || !source.urls.includes(url.href)) throw new DomainError('UNSAFE_URL');
  return url;
}
/** Pinned DNS lookup, TLS verification and socket-address check on every hop. No proxy or cookies. */
export async function retrieve(source, initialUrl, io = { lookup, request: https.request }) {
  if (source.paused) throw new DomainError('SOURCE_PAUSED');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    let target = initialUrl;
    for (let hop = 0; hop <= 3; hop++) {
      controller.signal.throwIfAborted();
      const url = approvedUrl(target, source);
      const addresses = await Promise.race([io.lookup(url.hostname, { all: true, verbatim: true }),
        new Promise((_, reject) => controller.signal.addEventListener('abort', () => reject(new DomainError('FETCH_TIMEOUT')), { once: true }))]);
      if (!addresses.length || addresses.some(a => !publicAddress(a.address))) throw new DomainError('UNSAFE_ADDRESS');
      const selected = addresses[0];
      const response = await new Promise((resolve, reject) => {
        const req = io.request(url, { method: 'GET', agent: false, signal: controller.signal,
          servername: url.hostname, rejectUnauthorized: true,
          headers: { Accept: 'application/json', 'Accept-Encoding': 'identity', 'User-Agent': 'SkilvedSourceReview/1.0' },
          lookup: (_host, options, callback) => options.all ? callback(null, [selected]) : callback(null, selected.address, selected.family),
        }, res => {
          const chunks = []; let size = 0;
          res.on('error', reject);
          if ([301,302,303,307,308].includes(res.statusCode)) {
            res.destroy(); resolve({ redirect: res.headers.location }); return;
          }
          if (res.statusCode !== 200 || !/^application\/(?:[a-z0-9.+-]+\+)?json(?:;|$)/i.test(res.headers['content-type'] ?? '') ||
            !['identity', undefined].includes(res.headers['content-encoding']) || Number(res.headers['content-length'] ?? 0) > source.maxBytes) {
            res.destroy(); reject(new DomainError('UNSUPPORTED_RESPONSE')); return;
          }
          res.on('data', chunk => { size += chunk.length; if (size > source.maxBytes) { res.destroy(); reject(new DomainError('BODY_TOO_LARGE')); } else chunks.push(chunk); });
          res.on('end', () => resolve({ text: Buffer.concat(chunks).toString('utf8'), url: url.href }));
        });
        req.on('socket', socket => socket.on('secureConnect', () => {
          if (!publicAddress(socket.remoteAddress ?? '') || ipaddr.parse(socket.remoteAddress).toNormalizedString() !== ipaddr.parse(selected.address).toNormalizedString()) req.destroy(new DomainError('UNSAFE_ADDRESS'));
        }));
        req.on('error', reject); req.end();
      });
      if ('text' in response) return response;
      if (!response.redirect) throw new DomainError('UNSAFE_REDIRECT');
      target = new URL(response.redirect, url).href;
    }
    throw new DomainError('TOO_MANY_REDIRECTS');
  } finally { clearTimeout(timer); }
}
