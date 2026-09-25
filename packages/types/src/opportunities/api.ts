import { z } from 'zod';
import { CategorySchema, IdSchema, InstantSchema, ProvinceSchema, RevisionSchema } from './primitives';
import { PublicOpportunitySchema, PublicStatusSchema } from './public';

export const ReadQuerySchema = z.object({ category: CategorySchema.optional(), province: ProvinceSchema.optional(),
  coverage: z.enum(['local', 'national', 'international']).optional(), remote: z.boolean().optional(),
  q: z.string().trim().max(120).default(''), limit: z.number().int().min(1).max(50).default(20),
  sort: z.literal('updated_desc').default('updated_desc'), cursor: z.string().min(1).max(4096).optional(),
}).strict();
export type ReadQuery = z.infer<typeof ReadQuerySchema>;
export type ContractError = { code: 'INVALID_QUERY' | 'INVALID_CURSOR' | 'STALE_CURSOR' };
export function parseReadQuery(params: URLSearchParams): { ok: true; query: ReadQuery } | { ok: false; error: ContractError } {
  const values: Record<string, unknown> = {};
  for (const [key, value] of params) {
    if (key in values) return { ok: false, error: { code: 'INVALID_QUERY' } };
    if (key === 'limit') {
      if (!/^\d{1,2}$/.test(value)) return { ok: false, error: { code: 'INVALID_QUERY' } };
      values[key] = Number(value);
    } else if (key === 'remote') {
      if (value !== 'true' && value !== 'false') return { ok: false, error: { code: 'INVALID_QUERY' } };
      values[key] = value === 'true';
    } else values[key] = value;
  }
  const result = ReadQuerySchema.safeParse(values);
  return result.success ? { ok: true, query: result.data } : { ok: false, error: { code: 'INVALID_QUERY' } };
}
const PositionSchema = z.object({ updatedAt: InstantSchema, id: IdSchema }).strict();
const CursorSchema = z.object({ v: z.literal(1), query: z.string().max(1500), catalogueRevision: RevisionSchema,
  after: PositionSchema,
}).strict();
function fingerprint(query: ReadQuery) {
  const q = ReadQuerySchema.parse(query);
  return JSON.stringify([q.category ?? null, q.province ?? null, q.coverage ?? null, q.remote ?? null, q.q, q.limit, q.sort]);
}
/** Opaque continuation, not an authorization token. B03 must enforce publication on every page. */
export function encodeCursor(query: ReadQuery, catalogueRevision: number, after: z.infer<typeof PositionSchema>): string {
  const value = CursorSchema.parse({ v: 1, query: fingerprint(query), catalogueRevision, after });
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodeCursor(token: string, query: ReadQuery, catalogueRevision: number):
  { ok: true; after: z.infer<typeof PositionSchema> } | { ok: false; error: ContractError } {
  try {
    if (token.length > 4096 || !/^[A-Za-z0-9_-]+$/.test(token)) throw new Error();
    const decoded = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
    const value = CursorSchema.parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(decoded, c => c.charCodeAt(0)))));
    if (value.query !== fingerprint(query)) throw new Error();
    if (value.catalogueRevision !== catalogueRevision) return { ok: false, error: { code: 'STALE_CURSOR' } };
    return { ok: true, after: value.after };
  } catch { return { ok: false, error: { code: 'INVALID_CURSOR' } }; }
}
export const ListResponseSchema = z.object({ schemaVersion: z.literal(1), catalogueRevision: RevisionSchema,
  asOf: InstantSchema, items: z.array(PublicOpportunitySchema).max(50), nextCursor: z.string().max(4096).nullable(),
}).strict().refine(page => page.items.every(item => item.lifecycle === 'published'), 'Discovery omits closed records');
export const DetailResponseSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('opportunity'), opportunity: PublicOpportunitySchema }).strict(),
  z.object({ kind: z.literal('status'), status: PublicStatusSchema }).strict(),
]);
export const ErrorResponseSchema = z.object({ error: z.object({
  code: z.enum(['INVALID_QUERY', 'INVALID_CURSOR', 'STALE_CURSOR', 'NOT_FOUND', 'SERVICE_UNAVAILABLE']),
}).strict() }).strict();

/** Reference filter semantics for adapters, not a production search engine. Residence is never a hidden filter. */
export function matchesQuery(input: unknown, queryInput: ReadQuery): boolean {
  const o = PublicOpportunitySchema.parse(input), q = ReadQuerySchema.parse(queryInput);
  if (o.lifecycle !== 'published' || (q.category && q.category !== o.category)) return false;
  const location = o.location.state === 'stated' ? o.location.value : null;
  if (q.coverage && location?.coverage !== q.coverage) return false;
  if (q.remote !== undefined && (!location || location.attendance === 'not_stated' || (location.attendance === 'remote') !== q.remote)) return false;
  if (q.province && !location?.places.some(p => p.province === q.province) && location?.coverage !== 'national' && location?.attendance !== 'remote') return false;
  const haystack = [o.title.value, o.issuer.value, o.summary.value].filter(v => typeof v === 'string').join(' ').toLowerCase();
  return haystack.includes(q.q.toLowerCase());
}
