import { z } from 'zod';
import { InstantSchema } from '@skilved/types/opportunities';
import { SuggestionRequestSchema, SuggestionSecretSchema, SuggestionCreateResponseSchema, SuggestionWithdrawResponseSchema } from '@skilved/types/opportunities/suggestions';
import { classifySuggestion } from './suggestion-policy.mjs';
import { Source } from './schemas.mjs';
import { ReceiptRecord } from './suggestion-receipts.mjs';
import { DomainError } from './config.mjs';
import { Catalogue } from './store.mjs';
import { SuggestionReplayTickets } from './suggestion-replay-tickets.mjs';
import { approvedSuggestionResults } from './suggestion-approved.mjs';
import { AdmissionState, SuggestionWork, suggestionHash as hash, suggestionPayload as payload,
  decodeSuggestion as decode } from './suggestion-records.mjs';
export { AdmissionState, SuggestionWork } from './suggestion-records.mjs';

const fail = code => { throw new DomainError(code); };
export const AdmissionPolicy = z.object({ intakeEnabled: z.boolean(),
  maxWork: z.number().int().min(1).max(100), maxReceipts: z.number().int().min(1).max(500),
  createAttemptsPerHour: z.number().int().min(1).max(50), statusReadsPerHour: z.number().int().min(1).max(600),
  receiptTtlMs: z.number().int().min(1).max(30 * 86400000),
}).strict();
const Counter = z.object({ schemaVersion: z.literal(1), kind: z.enum(['create', 'status']),
  windowStart: InstantSchema, count: z.number().int().min(1).max(600),
}).strict();
const PublicReplay = z.object({ schemaVersion: z.literal(1), workId: SuggestionSecretSchema,
  createdAt: InstantSchema, expiresAt: InstantSchema, retainUntil: InstantSchema.optional(),
}).strict().refine(v => v.createdAt < v.expiresAt && (v.retainUntil === undefined ||
  (v.retainUntil >= v.expiresAt && Date.parse(v.retainUntil) - Date.parse(v.createdAt) <= 30 * 86400000)));
const TicketOptions = z.object({ replayTickets: z.instanceof(SuggestionReplayTickets) }).strict();

/** Backend-only create orchestration; no HTTP/runtime activation or worker authority. */
export class SuggestionAdmission {
  #tickets;
  constructor(db, receipts, policy, options) {
    const parsed = AdmissionPolicy.safeParse(policy);
    if (!parsed.success || parsed.data.receiptTtlMs > receipts.maxTtlMs) fail('SUGGESTION_UNAVAILABLE');
    if (options !== undefined) {
      const selected = TicketOptions.safeParse(options);
      if (!selected.success) fail('SUGGESTION_UNAVAILABLE');
      this.#tickets = selected.data.replayTickets;
    }
    if (this.#tickets?.recoveryEpoch !== receipts.recoveryEpoch) fail('SUGGESTION_UNAVAILABLE');
    this.db = db; this.receipts = receipts; this.policy = parsed.data;
  }
  stateRef() { return this.db.doc('m0_suggestion_state/admission'); }
  workRef(id) { return this.db.collection('m0_suggestion_work').doc(id); }
  publicReplayRef(key) { return this.db.collection('m0_suggestion_public_replays').doc(this.receipts.replayRef(key).id); }
  async #source(tx, url) {
    const rows = await tx.get(this.db.collection('m0_sources').limit(101));
    if (!rows.size || rows.size > 100) fail('SUGGESTION_UNAVAILABLE');
    const sources = rows.docs.map(row => {
      const source = decode(row, Source);
      if (source.id !== row.id) fail('SUGGESTION_UNAVAILABLE');
      return source;
    });
    const selected = classifySuggestion({ url }, sources);
    if (selected.kind !== 'eligible') fail(selected.kind === 'unsupported' ? 'SUGGESTION_UNSUPPORTED' :
      selected.kind === 'paused' ? 'SUGGESTION_PAUSED' : 'SUGGESTION_UNAVAILABLE');
    return sources.find(source => source.id === selected.sourceId);
  }
  #proof(url, ticket) {
    const proof = this.#tickets.verify({ url, ticket }), now = this.receipts.instant();
    if (proof.issuedAt > now || proof.expiresAt <= now) fail('SUGGESTION_UNAVAILABLE');
    return proof;
  }
  /** Backend-only until strict ticket transport/config migration; issuance shares the attempt budget. */
  async issueTicket(input) {
    if (!this.#tickets || !this.policy.intakeEnabled) fail('SUGGESTION_UNAVAILABLE');
    await this.charge('create');
    const parsed = SuggestionRequestSchema.safeParse(input);
    if (!parsed.success) fail('INVALID_COMMAND');
    return this.db.runTransaction(async tx => {
      await this.#source(tx, parsed.data.url);
      const issued = this.#tickets.issue(parsed.data);
      this.#proof(parsed.data.url, issued.ticket);
      return issued;
    });
  }
  /** Bounded physical accounting shared by intake and authenticated lifecycle mutations. */
  async inventory(tx) {
    const state = decode(await tx.get(this.stateRef()), AdmissionState);
    const receiptRows = await tx.get(this.db.collection('m0_suggestion_receipts').limit(501));
    const workRows = await tx.get(this.db.collection('m0_suggestion_work').limit(101));
    if (receiptRows.size > 500 || workRows.size > 100 || state.receiptCount !== receiptRows.size || state.workCount !== workRows.size)
      fail('SUGGESTION_UNAVAILABLE');
    const counts = new Map(), references = new Map(), works = new Map(), receipts = new Map();
    for (const row of receiptRows.docs) {
      const receipt = decode(row, ReceiptRecord);
      if (receipt.id !== row.id) fail('SUGGESTION_UNAVAILABLE');
      counts.set(receipt.workId, (counts.get(receipt.workId) ?? 0) + 1); receipts.set(row.id, receipt);
      if (receipt.revokedAt === null) references.set(receipt.workId, (references.get(receipt.workId) ?? 0) + 1);
    }
    for (const row of workRows.docs) {
      const work = decode(row, SuggestionWork);
      if (work.id !== row.id || work.id !== hash('skilved.suggestion.work.v1', work.url) || work.receiptCount !== counts.get(work.id))
        fail('SUGGESTION_UNAVAILABLE');
      const referenceCount = references.get(work.id) ?? 0;
      if (work.referenceCount !== undefined && work.referenceCount !== referenceCount) fail('SUGGESTION_UNAVAILABLE');
      works.set(work.id, { ...work, referenceCount });
    }
    if ([...counts.keys()].some(id => !works.has(id))) fail('SUGGESTION_UNAVAILABLE');
    return { state, works, receipts };
  }
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
    const parsed = SuggestionRequestSchema.safeParse(input), legacyKey = this.#tickets ? null : SuggestionSecretSchema.safeParse(idempotencyKey);
    if (!parsed.success || (legacyKey && !legacyKey.success)) fail('INVALID_COMMAND');
    const url = parsed.data.url, workId = hash('skilved.suggestion.work.v1', url);
    return this.db.runTransaction(async tx => {
      const now = this.receipts.instant();
      const proof = this.#tickets ? this.#proof(url, idempotencyKey) : null;
      const key = proof ? proof.replayKey : legacyKey.data;
      const finish = result => { if (this.#tickets) this.#proof(url, idempotencyKey); return result; };
      const command = { url, workId, idempotencyKey: key,
        expiresAt: new Date(Math.min(Date.parse(now) + this.policy.receiptTtlMs,
          proof ? Date.parse(proof.expiresAt) : Infinity)).toISOString(),
        ...(proof ? { replayExpiresAt: proof.expiresAt } : {}) };
      const publicRef = this.publicReplayRef(key), publicSnap = await tx.get(publicRef);
      if (publicSnap.exists && (await tx.get(this.receipts.replayRef(key))).exists) fail('SUGGESTION_UNAVAILABLE');
      const publicReplay = publicSnap.exists ? decode(publicSnap, PublicReplay) : null;
      if (publicReplay && (publicReplay.expiresAt <= now || publicReplay.createdAt > now)) fail('SUGGESTION_NOT_FOUND');
      if (publicReplay && publicReplay.workId !== workId) fail('SUGGESTION_CONFLICT');
      if (publicReplay && !includeApproved) fail('SUGGESTION_UNAVAILABLE');
      // Recover already-issued access without source work, even at capacity or after a source pause.
      const replay = await this.receipts.readReplay(tx, command);
      if (replay) return finish({ kind: 'received', access: replay.access });
      const source = await this.#source(tx, url);
      const permissionHash = hash('skilved.suggestion.permission.v1', source.permission);
      const approved = includeApproved ? await approvedSuggestionResults(tx, this.db, url, source, now) : [];
      if (publicReplay) return finish(approved.length ? { kind: 'approved', publicResultIds: approved } : { kind: 'previous_result_unavailable' });
      if (approved.length) {
        const state = decode(await tx.get(this.stateRef()), AdmissionState);
        const bindings = await tx.get(this.db.collection('m0_suggestion_public_replays').limit(501));
        if (bindings.size > 500) fail('SUGGESTION_UNAVAILABLE');
        for (const binding of bindings.docs) decode(binding, PublicReplay);
        if (bindings.size >= this.policy.maxReceipts) fail('SUGGESTION_CAPACITY');
        const next = { ...state, revision: state.revision + 1 };
        if (!AdmissionState.safeParse(next).success) fail('SUGGESTION_UNAVAILABLE');
        tx.create(publicRef, payload({ schemaVersion: 1, workId, createdAt: now, expiresAt: command.expiresAt,
          ...(proof ? { retainUntil: proof.expiresAt } : {}) }));
        tx.set(this.stateRef(), payload(next));
        return finish({ kind: 'approved', publicResultIds: approved });
      }
      // Conservative physical slots include expired records until explicit B06-5 cleanup.
      const { state, works } = await this.inventory(tx);
      const old = works.get(workId);
      if (old && (old.sourceId !== source.id || old.sourceRevision !== source.revision || old.permissionHash !== permissionHash))
        fail('SUGGESTION_SOURCE_CHANGED');
      if (state.receiptCount >= this.policy.maxReceipts || (!old && state.workCount >= this.policy.maxWork)) fail('SUGGESTION_CAPACITY');
      if (old && (old.updatedAt > now || old.state === 'resolved_to_listing')) fail('SUGGESTION_UNAVAILABLE');
      // All admission/source/capacity reads precede the receipt primitive's writes.
      const restarting = old?.state === 'cancelled';
      const issued = await this.receipts.createOrReplay(tx, command, { status: !old || restarting || old.state === 'pending' ? 'received' : old.state,
        publicResultIds: [] });
      if (!issued.created) return finish({ kind: 'received', access: issued.access });
      const work = old ? { ...old, revision: old.revision + 1, receiptCount: old.receiptCount + 1,
        referenceCount: old.referenceCount + 1, generation: old.generation + (restarting ? 1 : 0),
        lease: restarting ? null : old.lease,
        state: restarting ? 'pending' : old.state, publicResultIds: restarting ? [] : old.publicResultIds, updatedAt: now } :
        { schemaVersion: 1, id: workId, url, sourceId: source.id, sourceRevision: source.revision, permissionHash,
          mode: 'review_only', state: 'pending', generation: 1, lease: null, referenceCount: 1, revision: 1, receiptCount: 1, createdAt: now, updatedAt: now };
      const next = { ...state, revision: state.revision + 1, receiptCount: state.receiptCount + 1, workCount: state.workCount + (old ? 0 : 1) };
      if (!SuggestionWork.safeParse(work).success || !AdmissionState.safeParse(next).success) fail('SUGGESTION_UNAVAILABLE');
      tx.set(this.workRef(workId), payload(work)); tx.set(this.stateRef(), payload(next));
      return finish({ kind: 'received', access: issued.access });
    });
  }
  async status(input) {
    await this.charge('status');
    return this.receipts.status(input);
  }
  /** Backend-only until B06-5b2 lease races and DELETE transport are independently checked. */
  async withdraw(input) {
    // Existing bounded credential-operation budget is shared; intake may be off.
    await this.charge('status');
    return this.db.runTransaction(async tx => {
      const now = this.receipts.instant(), receipt = await this.receipts.readAuthorized(tx, input, now);
      const { works, receipts } = await this.inventory(tx), old = works.get(receipt.workId);
      if (!old || old.updatedAt > now || receipt.updatedAt > now || old.referenceCount < 1) fail('SUGGESTION_UNAVAILABLE');
      const needed = [...receipts.values()].some(other => other.workId === old.id && other.id !== receipt.id &&
        this.receipts.inRecoveryEpoch(other) && other.revokedAt === null && other.createdAt <= now && other.expiresAt > now);
      const revoked = { ...receipt, status: 'withdrawn', revokedAt: now, updatedAt: now,
        revision: receipt.revision + 1, publicResultIds: [] };
      const work = { ...old, referenceCount: old.referenceCount - 1, revision: old.revision + 1, updatedAt: now,
        generation: old.generation + (needed ? 0 : 1), state: needed ? old.state : 'cancelled',
        lease: needed ? old.lease : null,
        publicResultIds: needed ? old.publicResultIds : [] };
      if (!ReceiptRecord.safeParse(revoked).success || !SuggestionWork.safeParse(work).success) fail('SUGGESTION_UNAVAILABLE');
      const result = SuggestionWithdrawResponseSchema.parse({ schemaVersion: 1, receiptId: receipt.id, status: 'withdrawn' });
      // All reads and validation precede writes. Keep retained slots and replay evidence unchanged.
      tx.set(this.receipts.receiptRef(receipt.id), payload(revoked)); tx.set(this.workRef(work.id), payload(work));
      return result;
    });
  }
}
