import { createHash } from 'node:crypto';
import { z } from 'zod';
import { IdSchema, InstantSchema } from '@skilved/types/opportunities';
import { SuggestionRequestSchema, SuggestionSecretSchema, SuggestionUrlSchema, SuggestionCreateResponseSchema } from '@skilved/types/opportunities/suggestions';
import { classifySuggestion } from './suggestion-policy.mjs';
import { Source } from './schemas.mjs';
import { ReceiptRecord } from './suggestion-receipts.mjs';
import { DomainError } from './config.mjs';
import { Catalogue } from './store.mjs';
import { approvedSuggestionResults } from './suggestion-approved.mjs';

const fail = code => { throw new DomainError(code); };
const hash = (domain, input) => createHash('sha256').update(JSON.stringify([domain, input])).digest('hex');
const Integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const AdmissionPolicy = z.object({ intakeEnabled: z.boolean(),
  maxWork: z.number().int().min(1).max(100), maxReceipts: z.number().int().min(1).max(500),
  createAttemptsPerHour: z.number().int().min(1).max(50), statusReadsPerHour: z.number().int().min(1).max(600),
  receiptTtlMs: z.number().int().min(1).max(30 * 86400000),
}).strict();
export const AdmissionState = z.object({ schemaVersion: z.literal(1), revision: Integer.refine(v => v > 0),
  workCount: Integer.refine(v => v <= 100), receiptCount: Integer.refine(v => v <= 500),
}).strict();
export const SuggestionWork = z.object({ schemaVersion: z.literal(1), id: SuggestionSecretSchema,
  url: SuggestionUrlSchema, sourceId: IdSchema, sourceRevision: Integer.refine(v => v > 0),
  permissionHash: SuggestionSecretSchema, mode: z.literal('review_only'), state: z.literal('pending'),
  revision: Integer.refine(v => v > 0), receiptCount: z.number().int().min(1).max(500),
  createdAt: InstantSchema, updatedAt: InstantSchema,
}).strict().refine(v => v.createdAt <= v.updatedAt);
const Counter = z.object({ schemaVersion: z.literal(1), kind: z.enum(['create', 'status']),
  windowStart: InstantSchema, count: z.number().int().min(1).max(600),
}).strict();
const PublicReplay = z.object({ schemaVersion: z.literal(1), workId: SuggestionSecretSchema,
  createdAt: InstantSchema, expiresAt: InstantSchema,
}).strict().refine(v => v.createdAt < v.expiresAt);
const payload = value => ({ json: JSON.stringify(value) });
function decode(snapshot, schema) {
  try {
    const data = snapshot.data();
    if (!snapshot.exists || !data || Object.keys(data).length !== 1 || typeof data.json !== 'string' || Buffer.byteLength(data.json) > 32768) fail('SUGGESTION_UNAVAILABLE');
    const parsed = schema.safeParse(JSON.parse(data.json));
    if (!parsed.success) fail('SUGGESTION_UNAVAILABLE');
    return parsed.data;
  } catch { fail('SUGGESTION_UNAVAILABLE'); }
}

/** Backend-only create orchestration; no HTTP/runtime activation or worker authority. */
export class SuggestionAdmission {
  constructor(db, receipts, policy) {
    const parsed = AdmissionPolicy.safeParse(policy);
    if (!parsed.success || parsed.data.receiptTtlMs > receipts.maxTtlMs) fail('SUGGESTION_UNAVAILABLE');
    this.db = db; this.receipts = receipts; this.policy = parsed.data;
  }
  stateRef() { return this.db.doc('m0_suggestion_state/admission'); }
  workRef(id) { return this.db.collection('m0_suggestion_work').doc(id); }
  publicReplayRef(key) { return this.db.collection('m0_suggestion_public_replays').doc(this.receipts.replayRef(key).id); }
  async initialize(token, catalogue, reason) {
    if (!(catalogue instanceof Catalogue) || catalogue.db !== this.db) fail('SUGGESTION_UNAVAILABLE');
    return catalogue.mutate(token, 'source', 'suggestions.initialize', 'admission', reason, async tx => {
      if ((await tx.get(this.stateRef())).exists) fail('CONFLICT');
      for (const collection of ['m0_suggestion_receipts', 'm0_suggestion_replays', 'm0_suggestion_work', 'm0_suggestion_public_replays'])
        if ((await tx.get(this.db.collection(collection).limit(1))).size) fail('CONFLICT');
      tx.create(this.stateRef(), payload({ schemaVersion: 1, revision: 1, workCount: 0, receiptCount: 0 }));
      return { revision: 1 };
    });
  }
  /** Separate committed charge: semantic failure/transaction rollback cannot refund an attempt. */
  async charge(kind) {
    if (!['create', 'status'].includes(kind)) fail('SUGGESTION_UNAVAILABLE');
    const now = this.receipts.instant(), windowStart = now.slice(0, 13) + ':00:00.000Z';
    const id = `${kind}_${now.slice(0, 13).replace(/[^0-9]/g, '')}`;
    const limit = kind === 'create' ? this.policy.createAttemptsPerHour : this.policy.statusReadsPerHour;
    return this.db.runTransaction(async tx => {
      const ref = this.db.collection('m0_suggestion_limits').doc(id), snapshot = await tx.get(ref);
      const old = snapshot.exists ? decode(snapshot, Counter) : null;
      if (old && (old.kind !== kind || old.windowStart !== windowStart)) fail('SUGGESTION_UNAVAILABLE');
      if ((old?.count ?? 0) >= limit) fail('SUGGESTION_RATE_LIMITED');
      tx.set(ref, payload({ schemaVersion: 1, kind, windowStart, count: (old?.count ?? 0) + 1 }));
    });
  }
  async create(input, idempotencyKey) {
    const result = SuggestionCreateResponseSchema.safeParse(await this.submit(input, idempotencyKey, true));
    if (!result.success) fail('SUGGESTION_UNAVAILABLE');
    return result.data;
  }
  /** Internal composition/testing seam; public adapters must call create. */
  async admitReview(input, idempotencyKey) { return this.submit(input, idempotencyKey, false); }
  async submit(input, idempotencyKey, includeApproved) {
    if (!this.policy.intakeEnabled) fail('SUGGESTION_UNAVAILABLE');
    await this.charge('create');
    const parsed = SuggestionRequestSchema.safeParse(input), key = SuggestionSecretSchema.safeParse(idempotencyKey);
    if (!parsed.success || !key.success) fail('INVALID_COMMAND');
    const url = parsed.data.url, workId = hash('skilved.suggestion.work.v1', url);
    return this.db.runTransaction(async tx => {
      const now = this.receipts.instant();
      const command = { url, workId, idempotencyKey: key.data,
        expiresAt: new Date(Date.parse(now) + this.policy.receiptTtlMs).toISOString() };
      const publicRef = this.publicReplayRef(key.data), publicSnap = await tx.get(publicRef);
      if (publicSnap.exists && (await tx.get(this.receipts.replayRef(key.data))).exists) fail('SUGGESTION_UNAVAILABLE');
      const publicReplay = publicSnap.exists ? decode(publicSnap, PublicReplay) : null;
      if (publicReplay && (publicReplay.expiresAt <= now || publicReplay.createdAt > now)) fail('SUGGESTION_NOT_FOUND');
      if (publicReplay && publicReplay.workId !== workId) fail('SUGGESTION_CONFLICT');
      if (publicReplay && !includeApproved) fail('SUGGESTION_UNAVAILABLE');
      // Recover already-issued access without source work, even at capacity or after a source pause.
      const replay = await this.receipts.readReplay(tx, command);
      if (replay) return { kind: 'received', access: replay.access };
      const sourceRows = await tx.get(this.db.collection('m0_sources').limit(101));
      if (!sourceRows.size || sourceRows.size > 100) fail('SUGGESTION_UNAVAILABLE');
      const sources = sourceRows.docs.map(row => {
        const source = decode(row, Source);
        if (source.id !== row.id) fail('SUGGESTION_UNAVAILABLE');
        return source;
      });
      const selected = classifySuggestion({ url }, sources);
      if (selected.kind !== 'eligible') fail(selected.kind === 'unsupported' ? 'SUGGESTION_UNSUPPORTED' :
        selected.kind === 'paused' ? 'SUGGESTION_PAUSED' : 'SUGGESTION_UNAVAILABLE');
      const source = sources.find(s => s.id === selected.sourceId);
      const permissionHash = hash('skilved.suggestion.permission.v1', source.permission);
      const approved = includeApproved ? await approvedSuggestionResults(tx, this.db, url, source, now) : [];
      if (publicReplay) return approved.length ? { kind: 'approved', publicResultIds: approved } : { kind: 'previous_result_unavailable' };
      const state = decode(await tx.get(this.stateRef()), AdmissionState);
      if (approved.length) {
        const bindings = await tx.get(this.db.collection('m0_suggestion_public_replays').limit(501));
        if (bindings.size > 500) fail('SUGGESTION_UNAVAILABLE');
        for (const binding of bindings.docs) decode(binding, PublicReplay);
        if (bindings.size >= this.policy.maxReceipts) fail('SUGGESTION_CAPACITY');
        const next = { ...state, revision: state.revision + 1 };
        if (!AdmissionState.safeParse(next).success) fail('SUGGESTION_UNAVAILABLE');
        tx.create(publicRef, payload({ schemaVersion: 1, workId, createdAt: now, expiresAt: command.expiresAt }));
        tx.set(this.stateRef(), payload(next));
        return { kind: 'approved', publicResultIds: approved };
      }
      // Conservative physical slots include expired records until explicit B06-5 cleanup.
      const receiptRows = await tx.get(this.db.collection('m0_suggestion_receipts').limit(501));
      const workRows = await tx.get(this.db.collection('m0_suggestion_work').limit(101));
      if (receiptRows.size > 500 || workRows.size > 100 || state.receiptCount !== receiptRows.size || state.workCount !== workRows.size)
        fail('SUGGESTION_UNAVAILABLE');
      const counts = new Map(), works = new Map();
      for (const row of receiptRows.docs) {
        const receipt = decode(row, ReceiptRecord);
        if (receipt.id !== row.id) fail('SUGGESTION_UNAVAILABLE');
        counts.set(receipt.workId, (counts.get(receipt.workId) ?? 0) + 1);
      }
      for (const row of workRows.docs) {
        const work = decode(row, SuggestionWork);
        if (work.id !== row.id || work.id !== hash('skilved.suggestion.work.v1', work.url) || work.receiptCount !== counts.get(work.id))
          fail('SUGGESTION_UNAVAILABLE');
        works.set(work.id, work);
      }
      if ([...counts.keys()].some(id => !works.has(id))) fail('SUGGESTION_UNAVAILABLE');
      const old = works.get(workId);
      if (old && (old.sourceId !== source.id || old.sourceRevision !== source.revision || old.permissionHash !== permissionHash))
        fail('SUGGESTION_SOURCE_CHANGED');
      if (state.receiptCount >= this.policy.maxReceipts || (!old && state.workCount >= this.policy.maxWork)) fail('SUGGESTION_CAPACITY');
      // All admission/source/capacity reads precede the receipt primitive's writes.
      const issued = await this.receipts.createOrReplay(tx, command);
      if (!issued.created) return { kind: 'received', access: issued.access };
      const work = old ? { ...old, revision: old.revision + 1, receiptCount: old.receiptCount + 1, updatedAt: now } :
        { schemaVersion: 1, id: workId, url, sourceId: source.id, sourceRevision: source.revision, permissionHash,
          mode: 'review_only', state: 'pending', revision: 1, receiptCount: 1, createdAt: now, updatedAt: now };
      const next = { ...state, revision: state.revision + 1, receiptCount: state.receiptCount + 1, workCount: state.workCount + (old ? 0 : 1) };
      if (!SuggestionWork.safeParse(work).success || !AdmissionState.safeParse(next).success) fail('SUGGESTION_UNAVAILABLE');
      tx.set(this.workRef(workId), payload(work)); tx.set(this.stateRef(), payload(next));
      return { kind: 'received', access: issued.access };
    });
  }
  async status(input) {
    await this.charge('status');
    return this.receipts.status(input);
  }
}
