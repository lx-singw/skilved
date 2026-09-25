import { z } from 'zod';

export const LIMITS = { text: 4000, list: 100, depth: 12, nodes: 300, bytes: 500_000 } as const;
export const IdSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,95}$/);
export const TextSchema = z.string().trim().min(1).max(LIMITS.text);
export const RevisionSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const CategorySchema = z.enum(['bursary', 'learnership', 'apprenticeship', 'internship', 'graduate_programme', 'job']);
export type Category = z.infer<typeof CategorySchema>;
export const CATEGORY_LABELS: Record<Category, string> = {
  bursary: 'Bursary', learnership: 'Learnership', apprenticeship: 'Apprenticeship',
  internship: 'Internship', graduate_programme: 'Graduate programme', job: 'Job',
};
export const ProvinceSchema = z.enum(['gauteng', 'western_cape', 'kwazulu_natal', 'eastern_cape',
  'limpopo', 'mpumalanga', 'north_west', 'free_state', 'northern_cape']);
export const InternshipSchema = z.object({
  subtype: z.enum(['student_wil', 'graduate', 'other_stated', 'unknown']),
  originalText: TextSchema.nullable(),
}).strict().refine(x => x.subtype !== 'other_stated' || x.originalText !== null, 'Other subtype needs stated wording');

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.slice(0, 4) === '0000') return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export const DateSchema = z.string().refine(isCalendarDate, 'Invalid calendar date');
export const InstantSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  .refine(value => isCalendarDate(value.slice(0, 10)) && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value, 'Expected a canonical UTC instant');
export const HttpsSchema = z.string().max(2048).url().refine(value => {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && !u.hash; }
  catch { return false; }
}, 'Expected HTTPS without credentials or fragment');

/** Bounds arbitrary input before recursive schemas run. Reject cycles and non-JSON values. */
export function boundedJson(value: unknown): boolean {
  const seen = new Set<object>();
  let nodes = 0;
  function visit(item: unknown, depth: number): boolean {
    if (++nodes > 20_000 || depth > 40) return false;
    if (item === null || typeof item === 'boolean') return true;
    if (typeof item === 'string') return item.length <= 20_000;
    if (typeof item === 'number') return Number.isFinite(item);
    if (typeof item !== 'object' || seen.has(item)) return false;
    if (!Array.isArray(item) && Object.getPrototypeOf(item) !== Object.prototype) return false;
    seen.add(item);
    const result = Object.values(item).every(child => visit(child, depth + 1));
    seen.delete(item);
    return result;
  }
  try { return visit(value, 0) && new TextEncoder().encode(JSON.stringify(value)).length <= LIMITS.bytes; }
  catch { return false; }
}
export const JsonBoundarySchema = z.unknown().refine(boundedJson, 'Invalid or oversized JSON');

export function factSchema<T extends z.ZodTypeAny>(value: T) {
  return z.object({
    id: IdSchema,
    state: z.enum(['stated', 'not_stated', 'ambiguous', 'conflicting']),
    value: value.nullable(), originalText: TextSchema.nullable(),
    sourceSnapshotIds: z.array(IdSchema).max(20), evidenceRefs: z.array(IdSchema).max(20),
    method: z.enum(['human', 'structured_source', 'rule', 'model']),
    review: z.enum(['pending', 'approved', 'rejected']), reviewedBy: IdSchema.nullable(),
    alternatives: z.array(z.object({ value, sourceSnapshotId: IdSchema, evidenceRef: IdSchema }).strict()).max(10).optional(),
  }).strict().superRefine((fact, ctx) => {
    if (fact.state === 'stated' && (fact.value === null || !fact.originalText ||
        !fact.sourceSnapshotIds.length || !fact.evidenceRefs.length)) {
      ctx.addIssue({ code: 'custom', message: 'Stated facts require value, wording and evidence' });
    }
    if (fact.state !== 'stated' && fact.value !== null) ctx.addIssue({ code: 'custom', message: 'Uncertain facts cannot assert a value' });
    if (fact.review === 'approved' && !fact.reviewedBy) ctx.addIssue({ code: 'custom', message: 'Approval requires a reviewer' });
    if (fact.alternatives?.length && fact.state !== 'conflicting' && fact.state !== 'ambiguous')
      ctx.addIssue({ code: 'custom', message: 'Alternatives require an uncertain fact' });
    if (fact.alternatives?.some(a => !fact.sourceSnapshotIds.includes(a.sourceSnapshotId) || !fact.evidenceRefs.includes(a.evidenceRef)))
      ctx.addIssue({ code: 'custom', message: 'Alternative has unresolved evidence' });
  });
}
export type Fact<T> = {
  id: string; state: 'stated' | 'not_stated' | 'ambiguous' | 'conflicting'; value: T | null;
  originalText: string | null; sourceSnapshotIds: string[]; evidenceRefs: string[];
  method: 'human' | 'structured_source' | 'rule' | 'model'; review: 'pending' | 'approved' | 'rejected'; reviewedBy: string | null;
  alternatives?: { value: T; sourceSnapshotId: string; evidenceRef: string }[];
};

export function publicFactSchema<T extends z.ZodTypeAny>(value: T) {
  return z.object({ state: z.enum(['stated', 'not_stated', 'ambiguous', 'conflicting']),
    value: value.nullable(), originalText: TextSchema.nullable(), citations: z.array(IdSchema).max(20),
  }).strict().superRefine((fact, ctx) => {
    if (fact.state === 'stated' && (fact.value === null || !fact.originalText || !fact.citations.length))
      ctx.addIssue({ code: 'custom', message: 'Public assertion needs reviewed citation' });
    if (fact.state !== 'stated' && fact.value !== null)
      ctx.addIssue({ code: 'custom', message: 'Uncertain public fact cannot assert a value' });
  });
}
