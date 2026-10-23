import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { InstantSchema } from '@skilved/types/opportunities';
import { SuggestionSecretSchema, SuggestionUrlSchema } from '@skilved/types/opportunities/suggestions';
import { DomainError } from './config.mjs';

const fail = code => { throw new DomainError(code); };
const MAX_TTL = 30 * 86400000;
const Configuration = z.object({ epoch: SuggestionSecretSchema, secret: SuggestionSecretSchema,
  notBefore: InstantSchema, ttlMs: z.number().int().min(1).max(MAX_TTL),
}).strict().refine(value => value.epoch !== value.secret, 'Public epoch must not expose the signing key');
const Issue = z.object({ url: SuggestionUrlSchema }).strict();
// Canonical decimal milliseconds, without signs, exponents or leading zeros.
const Millis = '(0|[1-9][0-9]{0,14})';
// An absolute end assertion also rejects the final newline accepted by JavaScript's $.
const Token = new RegExp(`^s1\\.([a-f0-9]{64})\\.${Millis}\\.${Millis}\\.([a-f0-9]{64})\\.([a-f0-9]{64})(?![\\s\\S])`);
const Verify = z.object({ url: SuggestionUrlSchema, ticket: z.string().max(230).regex(Token) }).strict();
const domain = 'skilved.suggestion.replay-ticket.v1';

/** Stateless foundation only. Intake must retain replay history until the verified expiry.
 * A restore must retire the epoch in configuration outside the restored database.
 * This does not replace receipt revocation, admission budgets or worker generation fences.
 */
export class SuggestionReplayTickets {
  #epoch; #key; #notBefore; #ttlMs; #now;
  constructor(options = {}) {
    const { now, ...configuration } = options ?? {};
    const parsed = Configuration.safeParse(configuration);
    if (!parsed.success || typeof now !== 'function') fail('SUGGESTION_UNAVAILABLE');
    this.#epoch = parsed.data.epoch; this.#key = Buffer.from(parsed.data.secret, 'hex');
    this.#notBefore = Date.parse(parsed.data.notBefore); this.#ttlMs = parsed.data.ttlMs; this.#now = now;
  }
  #instant() {
    let value;
    try { value = InstantSchema.safeParse(this.#now()); } catch { fail('SUGGESTION_UNAVAILABLE'); }
    if (!value.success || Date.parse(value.data) < this.#notBefore) fail('SUGGESTION_UNAVAILABLE');
    return Date.parse(value.data);
  }
  #mac(epoch, issued, expires, nonce, url) {
    return createHmac('sha256', this.#key).update(JSON.stringify([domain, epoch, issued, expires, nonce, url])).digest('hex');
  }
  issue(input) {
    const parsed = Issue.safeParse(input);
    if (!parsed.success) fail('INVALID_COMMAND');
    const issued = this.#instant(), expires = issued + this.#ttlMs, nonce = randomBytes(32).toString('hex');
    // Canonical Instant/decimal bounds also guard a clock near the end of the supported calendar.
    if (!Number.isSafeInteger(expires) || expires > 253402300799999) fail('SUGGESTION_UNAVAILABLE');
    const ticket = ['s1', this.#epoch, issued, expires, nonce,
      this.#mac(this.#epoch, issued, expires, nonce, parsed.data.url)].join('.');
    if (!Verify.safeParse({ url: parsed.data.url, ticket }).success) fail('SUGGESTION_UNAVAILABLE');
    return { ticket, expiresAt: new Date(expires).toISOString() };
  }
  verify(input) {
    const parsed = Verify.safeParse(input);
    if (!parsed.success) fail('SUGGESTION_NOT_FOUND');
    const [, epoch, issuedText, expiresText, nonce, mac] = Token.exec(parsed.data.ticket);
    const issued = Number(issuedText), expires = Number(expiresText), now = this.#instant();
    if (epoch !== this.#epoch || !Number.isSafeInteger(issued) || !Number.isSafeInteger(expires) ||
        issued < this.#notBefore || issued > now || expires <= now || expires <= issued ||
        expires > 253402300799999 || expires - issued > this.#ttlMs) fail('SUGGESTION_NOT_FOUND');
    const expected = this.#mac(epoch, issued, expires, nonce, parsed.data.url);
    if (!timingSafeEqual(Buffer.from(mac, 'hex'), Buffer.from(expected, 'hex'))) fail('SUGGESTION_NOT_FOUND');
    return { epoch, issuedAt: new Date(issued).toISOString(), expiresAt: new Date(expires).toISOString(),
      replayKey: createHash('sha256').update(JSON.stringify([domain, parsed.data.ticket])).digest('hex') };
  }
}
