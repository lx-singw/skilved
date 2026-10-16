import { createHash } from 'node:crypto';
import { z } from 'zod';
import { IdSchema, InstantSchema } from '@skilved/types/opportunities';
import { SuggestionSecretSchema, SuggestionUrlSchema } from '@skilved/types/opportunities/suggestions';
import { DomainError } from './config.mjs';
import { Source } from './schemas.mjs';
import { classifySuggestion } from './suggestion-policy.mjs';

export const suggestionHash = (domain, input) => createHash('sha256').update(JSON.stringify([domain, input])).digest('hex');
const Integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const Lease = z.object({ id: SuggestionSecretSchema, ownerId: IdSchema,
  generation: Integer.refine(v => v > 0), startedAt: InstantSchema, expiresAt: InstantSchema,
}).strict().refine(v => v.startedAt < v.expiresAt && Date.parse(v.expiresAt) - Date.parse(v.startedAt) <= 30000);
export const AdmissionState = z.object({ schemaVersion: z.literal(1), revision: Integer.refine(v => v > 0),
  workCount: Integer.refine(v => v <= 100), receiptCount: Integer.refine(v => v <= 500),
}).strict();
export const SuggestionWork = z.object({ schemaVersion: z.literal(1), id: SuggestionSecretSchema,
  url: SuggestionUrlSchema, sourceId: IdSchema, sourceRevision: Integer.refine(v => v > 0),
  permissionHash: SuggestionSecretSchema, mode: z.literal('review_only'),
  state: z.enum(['pending', 'reviewing', 'resolved_to_listing', 'unresolved', 'unsupported', 'paused', 'cancelled']),
  publicResultIds: z.array(IdSchema).max(20).default([]),
  generation: Integer.refine(v => v > 0).default(1),
  lease: Lease.nullable().default(null),
  // Legacy absence is reconciled against actual receipts by inventory, never guessed as zero.
  referenceCount: z.number().int().min(0).max(500).optional(),
  revision: Integer.refine(v => v > 0), receiptCount: z.number().int().min(1).max(500),
  createdAt: InstantSchema, updatedAt: InstantSchema,
}).strict().refine(v => v.createdAt <= v.updatedAt &&
  (v.referenceCount === undefined || v.referenceCount <= v.receiptCount) &&
  (v.lease === null || (v.state === 'pending' && v.lease.generation === v.generation &&
    v.createdAt <= v.lease.startedAt && v.lease.startedAt <= v.updatedAt)) &&
  ((v.state === 'resolved_to_listing') === (v.publicResultIds.length > 0)) &&
  new Set(v.publicResultIds).size === v.publicResultIds.length);
export const suggestionPayload = value => ({ json: JSON.stringify(value) });
export function decodeSuggestion(snapshot, schema) {
  try {
    const data = snapshot.data();
    if (!snapshot.exists || !data || Object.keys(data).length !== 1 || typeof data.json !== 'string' || Buffer.byteLength(data.json) > 32768)
      throw new Error();
    const parsed = schema.safeParse(JSON.parse(data.json));
    if (!parsed.success) throw new Error();
    return parsed.data;
  } catch { throw new DomainError('SUGGESTION_UNAVAILABLE'); }
}
/** Recheck the whole bounded registry so overlapping source registrations fail closed. */
export async function readSuggestionSource(tx, db, work) {
  const rows = await tx.get(db.collection('m0_sources').limit(101));
  if (!rows.size || rows.size > 100) throw new DomainError('SUGGESTION_UNAVAILABLE');
  const sources = rows.docs.map(row => {
    const source = decodeSuggestion(row, Source);
    if (source.id !== row.id) throw new DomainError('SUGGESTION_UNAVAILABLE');
    return source;
  });
  const source = sources.find(source => source.id === work.sourceId);
  if (!source) throw new DomainError('SUGGESTION_UNAVAILABLE');
  return { source, selected: classifySuggestion({ url: work.url }, sources) };
}
