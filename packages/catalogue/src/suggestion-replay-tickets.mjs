import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { InstantSchema } from '@skilved/types/opportunities';
import { SuggestionSecretSchema, SuggestionUrlSchema, SuggestionReplayTicketSchema } from '@skilved/types/opportunities/suggestions';
import { DomainError } from './config.mjs';

const fail = code => { throw new DomainError(code); };
const MAX_TTL = 30 * 86400000;
const Configuration = z.object({ epoch: SuggestionSecretSchema, secret: SuggestionSecretSchema,
  notBefore: InstantSchema, ttlMs: z.number().int().min(1).max(MAX_TTL),
  recoveryEpoch: SuggestionSecretSchema.optional(),
}).strict().refine(value => value.epoch !== value.secret && value.recoveryEpoch !== value.secret,
  'Public epochs must not expose the signing key');
export { Configuration as ReplayTicketConfigurationSchema };
const Issue = z.object({ url: SuggestionUrlSchema }).strict();
const Verify = z.object({ url: SuggestionUrlSchema, ticket: SuggestionReplayTicketSchema }).strict();
const domain = 'skilved.suggestion.replay-ticket.v1';

/** Stateless foundation only. Intake must retain replay history until the verified expiry.
 * A restore must retire the epoch in configuration outside the restored database.
 * This does not replace receipt revocation, admission budgets or worker generation fences.
 */
export class SuggestionReplayTickets {
  #epoch; #key; #notBefore; #ttlMs; #now; #recoveryEpoch;
  constructor(options = {}) {
    const { now, ...configuration } = options ?? {};
    const parsed = Configuration.safeParse(configuration);
    if (!parsed.success || typeof now !== 'function') fail('SUGGESTION_UNAVAILABLE');
    this.#epoch = parsed.data.epoch; this.#key = Buffer.from(parsed.data.secret, 'hex');
    this.#notBefore = Date.parse(parsed.data.notBefore); this.#ttlMs = parsed.data.ttlMs; this.#now = now;
    this.#recoveryEpoch = parsed.data.recoveryEpoch;
  }
  get recoveryEpoch() { return this.#recoveryEpoch; }
  #instant() {
    let value;
    try { value = InstantSchema.safeParse(this.#now()); } catch { fail('SUGGESTION_UNAVAILABLE'); }
    if (!value.success || Date.parse(value.data) < this.#notBefore) fail('SUGGESTION_UNAVAILABLE');
    return Date.parse(value.data);
  }
  #mac(epoch, issued, expires, nonce, url) {
    const fields = [domain, epoch, issued, expires, nonce, url];
    if (this.#recoveryEpoch !== undefined) {
      fields[0] = 'skilved.suggestion.replay-ticket.v2'; fields.push(this.#recoveryEpoch);
    }
    return createHmac('sha256', this.#key).update(JSON.stringify(fields)).digest('hex');
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
    const [, epoch, issuedText, expiresText, nonce, mac] = parsed.data.ticket.split('.');
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
