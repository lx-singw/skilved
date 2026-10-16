import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { SuggestionSecretSchema } from '@skilved/types/opportunities/suggestions';
import { Catalogue } from './store.mjs';
import { SuggestionAdmission } from './suggestion-admission.mjs';
import { SuggestionWork, readSuggestionSource, suggestionHash, suggestionPayload } from './suggestion-records.mjs';
import { writeSuggestionOutcome } from './suggestion-review.mjs';
import { DomainError } from './config.mjs';

const fail = code => { throw new DomainError(code); };
const Revision = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const Acquire = z.object({ workId: SuggestionSecretSchema, expectedRevision: Revision }).strict();
const Complete = z.object({ workId: SuggestionSecretSchema, leaseId: SuggestionSecretSchema,
  generation: Revision, outcome: z.enum(['reviewing', 'unresolved']),
}).strict();
async function currentSource(tx, db, work) {
  const { source, selected } = await readSuggestionSource(tx, db, work);
  if (source.revision !== work.sourceRevision || suggestionHash('skilved.suggestion.permission.v1', source.permission) !== work.permissionHash)
    fail('SUGGESTION_SOURCE_CHANGED');
  if (selected.kind !== 'eligible' || selected.sourceId !== work.sourceId)
    fail(selected.kind === 'paused' ? 'SUGGESTION_PAUSED' : 'SUGGESTION_SOURCE_CHANGED');
}
function needed(work, receipts, now) {
  const active = [...receipts.values()].filter(receipt => receipt.workId === work.id && receipt.revokedAt === null && receipt.expiresAt > now);
  if (active.some(receipt => receipt.createdAt > now || receipt.updatedAt > now)) fail('SUGGESTION_UNAVAILABLE');
  if (!active.length) fail('CONFLICT');
}

/** Backend-only persistence fence. No scheduler, fetch, model, publication or public lease endpoint. */
export class SuggestionLeases {
  constructor(admission, catalogue, { leaseMs } = {}) {
    if (!(admission instanceof SuggestionAdmission) || !(catalogue instanceof Catalogue) || admission.db !== catalogue.db ||
        !Number.isSafeInteger(leaseMs) || leaseMs < 1 || leaseMs > 30000) fail('SUGGESTION_UNAVAILABLE');
    this.admission = admission; this.catalogue = catalogue; this.db = admission.db; this.leaseMs = leaseMs;
  }
  async acquire(token, input) {
    const parsed = Acquire.safeParse(input); if (!parsed.success) fail('INVALID_COMMAND');
    const command = parsed.data;
    return this.catalogue.mutate(token, 'source', 'suggestions.lease.acquire', command.workId, 'Suggestion work leased', async (tx, uid) => {
      const now = this.admission.receipts.instant(), { works, receipts } = await this.admission.inventory(tx), old = works.get(command.workId);
      if (!old || old.revision !== command.expectedRevision || old.state !== 'pending') fail('CONFLICT');
      if (old.updatedAt > now) fail('SUGGESTION_UNAVAILABLE');
      for (const work of works.values()) if (work.lease) {
        if (work.lease.startedAt > now) fail('SUGGESTION_UNAVAILABLE');
        if (work.lease.expiresAt > now) fail('CONFLICT');
      }
      needed(old, receipts, now); await currentSource(tx, this.db, old);
      const generation = old.generation + 1, lease = { id: randomBytes(32).toString('hex'), ownerId: uid,
        generation, startedAt: now, expiresAt: new Date(Date.parse(now) + this.leaseMs).toISOString() };
      const next = { ...old, generation, lease, revision: old.revision + 1, updatedAt: now };
      if (!SuggestionWork.safeParse(next).success) fail('SUGGESTION_UNAVAILABLE');
      tx.set(this.admission.workRef(old.id), suggestionPayload(next));
      return { workId: old.id, leaseId: lease.id, generation, expiresAt: lease.expiresAt };
    });
  }
  async complete(token, input) {
    const parsed = Complete.safeParse(input); if (!parsed.success) fail('INVALID_COMMAND');
    const command = parsed.data;
    return this.catalogue.mutate(token, 'source', 'suggestions.lease.complete', command.workId, 'Suggestion lease returned to review', async (tx, uid) => {
      const now = this.admission.receipts.instant(), { works, receipts } = await this.admission.inventory(tx), old = works.get(command.workId);
      if (!old || old.state !== 'pending' || !old.lease || old.lease.id !== command.leaseId || old.generation !== command.generation ||
          old.lease.startedAt > now || old.lease.expiresAt <= now) fail('CONFLICT');
      if (old.lease.ownerId !== uid) fail('FORBIDDEN');
      if (old.updatedAt > now) fail('SUGGESTION_UNAVAILABLE');
      needed(old, receipts, now); await currentSource(tx, this.db, old);
      return writeSuggestionOutcome(tx, this.admission, old, receipts, command.outcome, [], now);
    });
  }
}
