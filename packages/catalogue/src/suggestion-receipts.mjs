import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { IdSchema, InstantSchema } from '@skilved/types/opportunities';
import { SuggestionAccessSchema, SuggestionReceiptIdSchema, SuggestionSecretSchema,
  SuggestionStatusResponseSchema, SuggestionStatusSchema, SuggestionUrlSchema } from '@skilved/types/opportunities/suggestions';
import { DomainError } from './config.mjs';

const fail = code => { throw new DomainError(code); };
const hash = (domain, value) => createHash('sha256').update(JSON.stringify([domain, value])).digest('hex');
const equal = (a, b) => timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
const KeyId = z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/).refine(v => v.trim() === v);
const KeyRing = z.object({ activeKeyId: KeyId,
  keys: z.array(z.object({ id: KeyId, secret: SuggestionSecretSchema }).strict()).min(1).max(4),
}).strict().refine(v => new Set(v.keys.map(k => k.id)).size === v.keys.length &&
  v.keys.some(k => k.id === v.activeKeyId), 'Invalid key ring');

export const ReceiptRecord = z.object({
  schemaVersion: z.literal(1), id: SuggestionReceiptIdSchema,
  keyId: KeyId, nonce: SuggestionSecretSchema, capabilityHash: SuggestionSecretSchema,
  workId: SuggestionSecretSchema, status: SuggestionStatusSchema,
  revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  createdAt: InstantSchema, updatedAt: InstantSchema, expiresAt: InstantSchema,
  revokedAt: InstantSchema.nullable(), publicResultIds: z.array(IdSchema).max(20),
}).strict().refine(v => v.createdAt <= v.updatedAt && v.updatedAt < v.expiresAt &&
  (v.revokedAt === null || (v.createdAt <= v.revokedAt && v.revokedAt <= v.updatedAt)) &&
  (v.status !== 'withdrawn' || v.revokedAt !== null) &&
  ((v.status === 'resolved_to_listing') === (v.publicResultIds.length > 0)) &&
  new Set(v.publicResultIds).size === v.publicResultIds.length, 'Invalid private receipt');
const ReplayRecord = z.object({ schemaVersion: z.literal(1), receiptId: SuggestionReceiptIdSchema,
  inputHash: SuggestionSecretSchema, expiresAt: InstantSchema,
}).strict();
export const ReceiptCreateCommand = z.object({ url: SuggestionUrlSchema,
  workId: SuggestionSecretSchema, idempotencyKey: SuggestionSecretSchema, expiresAt: InstantSchema,
}).strict();
const AccessCommand = z.object({ receiptId: SuggestionReceiptIdSchema, capability: SuggestionSecretSchema }).strict();
const payload = value => ({ json: JSON.stringify(value) });
function stored(snapshot, schema) {
  if (!snapshot.exists) return null;
  try {
    const data = snapshot.data();
    if (Object.keys(data).length !== 1 || typeof data.json !== 'string' || Buffer.byteLength(data.json) > 8192) return null;
    const parsed = schema.safeParse(JSON.parse(data.json));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

/** Backend-only primitives. No route, source access, queue admission or worker authority. */
export class SuggestionReceipts {
  #keys; #activeKeyId;
  constructor(db, { keyRing, maxTtlMs, now } = {}) {
    const parsed = KeyRing.safeParse(keyRing);
    if (!parsed.success || !Number.isSafeInteger(maxTtlMs) || maxTtlMs < 1 ||
        maxTtlMs > 30 * 86400000 || typeof now !== 'function') fail('SUGGESTION_UNAVAILABLE');
    this.db = db; this.now = now; this.maxTtlMs = maxTtlMs;
    this.#keys = new Map(parsed.data.keys.map(k => [k.id, Buffer.from(k.secret, 'hex')]));
    this.#activeKeyId = parsed.data.activeKeyId;
  }
  instant() {
    const result = InstantSchema.safeParse(this.now());
    if (!result.success) fail('SUGGESTION_UNAVAILABLE');
    return result.data;
  }
  receiptRef(id) { return this.db.collection('m0_suggestion_receipts').doc(id); }
  replayRef(key) { return this.db.collection('m0_suggestion_replays').doc(hash('skilved.suggestion.replay.v1', key)); }
  derive(record) {
    const key = this.#keys.get(record.keyId);
    if (!key) return null;
    return createHmac('sha256', key).update(JSON.stringify([
      'skilved.suggestion.receipt.status-withdraw.v1', record.keyId, record.id, record.nonce,
    ])).digest('hex');
  }
  authorized(record, id, capability, now) {
    if (!record || record.id !== id || record.revokedAt !== null || record.expiresAt <= now || record.createdAt > now) return false;
    const derived = this.derive(record);
    return derived !== null && equal(record.capabilityHash, hash('skilved.suggestion.capability.v1', derived)) &&
      equal(record.capabilityHash, hash('skilved.suggestion.capability.v1', capability));
  }
  access(record, now) {
    const capability = this.derive(record);
    if (!capability || !this.authorized(record, record.id, capability, now)) fail('SUGGESTION_NOT_FOUND');
    return SuggestionAccessSchema.parse({ receiptId: record.id, capability, expiresAt: record.expiresAt });
  }
  /** Authorized recovery only: no source, queue or receipt mutation. */
  async readReplay(tx, input) {
    const parsed = ReceiptCreateCommand.safeParse(input);
    if (!parsed.success) fail('INVALID_COMMAND');
    const command = parsed.data, now = this.instant();
    const mapRef = this.replayRef(command.idempotencyKey), mapSnap = await tx.get(mapRef);
    const inputHash = hash('skilved.suggestion.input.v1', [command.url, command.workId]);
    if (mapSnap.exists) {
      const mapping = stored(mapSnap, ReplayRecord);
      if (!mapping || mapping.expiresAt <= now) fail('SUGGESTION_NOT_FOUND');
      if (!equal(mapping.inputHash, inputHash)) fail('SUGGESTION_CONFLICT');
      const record = stored(await tx.get(this.receiptRef(mapping.receiptId)), ReceiptRecord);
      if (!record || record.expiresAt !== mapping.expiresAt || record.workId !== command.workId) fail('SUGGESTION_NOT_FOUND');
      return { access: this.access(record, now), created: false };
    }
    return null;
  }
  /** Compose ONLY inside admitted intake after all admission reads; never a public create API. */
  async createOrReplay(tx, input) {
    const parsed = ReceiptCreateCommand.safeParse(input);
    if (!parsed.success) fail('INVALID_COMMAND');
    const command = parsed.data, replay = await this.readReplay(tx, command);
    if (replay) return replay;
    const now = this.instant(), mapRef = this.replayRef(command.idempotencyKey);
    const inputHash = hash('skilved.suggestion.input.v1', [command.url, command.workId]);
    const ttl = Date.parse(command.expiresAt) - Date.parse(now);
    if (ttl <= 0 || ttl > this.maxTtlMs) fail('INVALID_COMMAND');
    const record = { schemaVersion: 1, id: randomBytes(32).toString('hex'), keyId: this.#activeKeyId,
      nonce: randomBytes(32).toString('hex'), workId: command.workId, status: 'received', revision: 1,
      createdAt: now, updatedAt: now, expiresAt: command.expiresAt, revokedAt: null, publicResultIds: [],
    };
    record.capabilityHash = hash('skilved.suggestion.capability.v1', this.derive(record));
    ReceiptRecord.parse(record);
    tx.create(this.receiptRef(record.id), payload(record));
    tx.create(mapRef, payload({ schemaVersion: 1, receiptId: record.id, inputHash, expiresAt: record.expiresAt }));
    return { access: this.access(record, now), created: true };
  }
  async status(input) {
    const parsed = AccessCommand.safeParse(input);
    if (!parsed.success) fail('SUGGESTION_NOT_FOUND');
    return this.db.runTransaction(async tx => {
      const now = this.instant(), command = parsed.data;
      const record = stored(await tx.get(this.receiptRef(command.receiptId)), ReceiptRecord);
      if (!this.authorized(record, command.receiptId, command.capability, now)) fail('SUGGESTION_NOT_FOUND');
      // Resolution requires the current-public-result guard in B06-5, never stored IDs alone.
      if (record.status === 'resolved_to_listing') fail('SUGGESTION_UNAVAILABLE');
      return SuggestionStatusResponseSchema.parse({ schemaVersion: 1, receiptId: record.id,
        status: record.status, revision: record.revision, createdAt: record.createdAt,
        updatedAt: record.updatedAt, expiresAt: record.expiresAt, publicResultIds: [],
      });
    });
  }
}
