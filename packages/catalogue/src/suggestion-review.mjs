import { z } from 'zod';
import { IdSchema } from '@skilved/types/opportunities';
import { SuggestionSecretSchema } from '@skilved/types/opportunities/suggestions';
import { Catalogue } from './store.mjs';
import { SuggestionAdmission } from './suggestion-admission.mjs';
import { ReceiptRecord } from './suggestion-receipts.mjs';
import { SuggestionWork, suggestionPayload as payload, suggestionHash as hash, readSuggestionSource } from './suggestion-records.mjs';
import { approvedSuggestionResults } from './suggestion-approved.mjs';
import { DomainError } from './config.mjs';

const fail = code => { throw new DomainError(code); };
const Outcome = z.enum(['reviewing', 'resolved_to_listing', 'unresolved', 'unsupported', 'paused']);
export const SuggestionReviewCommand = z.object({ workId: SuggestionSecretSchema,
  expectedRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), outcome: Outcome,
  publicResultIds: z.array(IdSchema).max(20).default([]),
}).strict().refine(v => ((v.outcome === 'resolved_to_listing') === (v.publicResultIds.length > 0)) &&
  new Set(v.publicResultIds).size === v.publicResultIds.length);
const reasons = Object.freeze({ reviewing: 'Suggestion review started', resolved_to_listing: 'Current approved public results selected',
  unresolved: 'Suggestion review unresolved', unsupported: 'Suggestion notice unsupported', paused: 'Suggestion review paused' });

/** Private transaction composition after the caller's identity/source/concurrency checks. */
export function writeSuggestionOutcome(tx, admission, old, receipts, outcome, publicResultIds, now) {
  const next = { ...old, state: outcome, publicResultIds: [...publicResultIds].sort(), revision: old.revision + 1,
    generation: old.generation + 1, lease: null, updatedAt: now };
  if (old.updatedAt > now || !SuggestionWork.safeParse(next).success) fail('SUGGESTION_UNAVAILABLE');
  const active = [...receipts.values()].filter(receipt => admission.receipts.inRecoveryEpoch(receipt) &&
    receipt.workId === old.id && receipt.revokedAt === null && receipt.expiresAt > now);
  if (active.some(receipt => receipt.updatedAt > now)) fail('SUGGESTION_UNAVAILABLE');
  const updates = active.map(receipt => ({ ...receipt, status: outcome, publicResultIds: next.publicResultIds,
    revision: receipt.revision + 1, updatedAt: now }));
  if (!updates.length) fail('CONFLICT');
  if (updates.some(receipt => receipt.createdAt > now || !ReceiptRecord.safeParse(receipt).success)) fail('SUGGESTION_UNAVAILABLE');
  // Validate everything before writes; no source IO/model work belongs in this transaction.
  for (const receipt of updates) tx.set(admission.receipts.receiptRef(receipt.id), payload(receipt));
  tx.set(admission.workRef(old.id), payload(next));
  return { revision: next.revision, status: next.state };
}

/** Local authenticated operator only. No publication, fetch, model, lease or public mutation route. */
export class SuggestionReview {
  constructor(admission, catalogue) {
    if (!(admission instanceof SuggestionAdmission) || !(catalogue instanceof Catalogue) || admission.db !== catalogue.db)
      fail('SUGGESTION_UNAVAILABLE');
    this.admission = admission; this.catalogue = catalogue; this.db = admission.db;
  }
  async queue(token) {
    const uid = await this.catalogue.identity(token);
    return this.db.runTransaction(async tx => {
      await this.catalogue.operator(tx, uid, 'source');
      const { works } = await this.admission.inventory(tx);
      return { items: [...works.values()].sort((a,b) => a.id.localeCompare(b.id)).map(work => ({ workId: work.id,
        revision: work.revision, status: work.state === 'pending' ? 'received' : work.state, url: work.url,
        sourceId: work.sourceId, sourceRevision: work.sourceRevision, createdAt: work.createdAt, updatedAt: work.updatedAt })) };
    });
  }
  async decide(token, input) {
    const parsed = SuggestionReviewCommand.safeParse(input);
    if (!parsed.success) fail('INVALID_COMMAND');
    const command = parsed.data;
    return this.catalogue.mutate(token, 'source', 'suggestions.review', command.workId, reasons[command.outcome], async tx => {
      const now = this.admission.receipts.instant(), { works, receipts } = await this.admission.inventory(tx);
      const old = works.get(command.workId);
      if (!old || old.revision !== command.expectedRevision || old.state === 'cancelled') fail('CONFLICT');
      if (old.updatedAt > now) fail('SUGGESTION_UNAVAILABLE');
      // A completed/paused outcome requires an explicit new review before another decision.
      if (old.state === command.outcome || (!['pending','reviewing'].includes(old.state) && command.outcome !== 'reviewing'))
        fail('CONFLICT');
      if (['reviewing','resolved_to_listing'].includes(command.outcome)) {
        const { source, selected } = await readSuggestionSource(tx, this.db, old);
        if (source.revision !== old.sourceRevision ||
            hash('skilved.suggestion.permission.v1', source.permission) !== old.permissionHash) fail('SUGGESTION_SOURCE_CHANGED');
        if (selected.kind !== 'eligible' || selected.sourceId !== old.sourceId) fail(selected.kind === 'paused' ? 'SUGGESTION_PAUSED' :
          selected.kind === 'unsupported' ? 'SUGGESTION_UNSUPPORTED' : 'SUGGESTION_UNAVAILABLE');
        if (command.outcome === 'resolved_to_listing') {
          const current = await approvedSuggestionResults(tx, this.db, old.url, source, now);
          if (!current.length || JSON.stringify(current) !== JSON.stringify([...command.publicResultIds].sort())) fail('SUGGESTION_RESULT_CHANGED');
        }
      }
      return writeSuggestionOutcome(tx, this.admission, old, receipts, command.outcome, command.publicResultIds, now);
    });
  }
}
