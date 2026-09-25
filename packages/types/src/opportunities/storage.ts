import { z } from 'zod';
import { IdSchema, JsonBoundarySchema, RevisionSchema } from './primitives';
import { OpportunityRecord, OpportunityRecordSchema } from './internal';
import { Projection } from './public';
import { ReadQuery } from './api';

/** JSON-safe wire document; UTC events stay canonical strings, dates retain precision. */
export function serializeRecord(input: unknown): string {
  return JSON.stringify(OpportunityRecordSchema.parse(input));
}
export function deserializeRecord(text: string): OpportunityRecord {
  if (new TextEncoder().encode(text).length > 500_000) throw new Error('INVALID_RECORD');
  try { return OpportunityRecordSchema.parse(JSON.parse(text)); } catch { throw new Error('INVALID_RECORD'); }
}
export const AliasSchema = JsonBoundarySchema.pipe(z.object({ schemaVersion: z.literal(1), fromId: IdSchema,
  toId: IdSchema, revision: RevisionSchema, decision: z.enum(['proposed', 'confirmed', 'reversed']),
}).strict().refine(a => a.fromId !== a.toId, 'Self alias is invalid'));
/** No redirect if a decision is unresolved, reversed, cyclic or too long. */
export function resolveAlias(id: string, inputs: unknown[]): string | null {
  IdSchema.parse(id);
  if (inputs.length > 100) return null;
  const parsed = inputs.map(a => AliasSchema.safeParse(a));
  if (parsed.some(a => !a.success)) return null;
  const aliases = parsed.flatMap(a => a.success ? [a.data] : []);
  const visited = new Set<string>();
  let current = id;
  for (let i = 0; i < 10; i++) {
    if (visited.has(current)) return null;
    visited.add(current);
    const matches = aliases.filter(a => a.fromId === current);
    if (!matches.length) return current;
    if (matches.length !== 1 || matches[0].decision !== 'confirmed') return null;
    current = matches[0].toId;
  }
  return null;
}
// Interface only. Implement transactions, identity authorization and cache invalidation in B03.
export interface OpportunityRepository {
  readPublic(id: string): Promise<Projection>;
  listPublic(query: ReadQuery): Promise<{ items: Projection[]; catalogueRevision: number }>;
  readDraft(id: string, operatorId: string): Promise<OpportunityRecord | null>;
  saveDraft(record: OpportunityRecord, expectedRevision: number | null, operatorId: string): Promise<'saved' | 'conflict'>;
  publish(id: string, expectedRevision: number, operatorId: string): Promise<'published' | 'conflict' | 'not_approved'>;
}
