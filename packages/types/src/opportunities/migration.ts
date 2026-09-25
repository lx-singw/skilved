import { z } from 'zod';
import { CategorySchema, IdSchema, JsonBoundarySchema, TextSchema } from './primitives';
import { OpportunityRecordSchema } from './internal';

const LegacySchema = JsonBoundarySchema.pipe(z.object({ id: IdSchema, title: TextSchema,
  opportunityType: z.string().max(80), organisation: TextSchema,
  deadline: z.string().max(4000).nullable().optional(), salaryAmount: z.number().finite().nonnegative().optional(),
  salaryCurrency: z.string().max(10).optional(), salaryType: z.string().max(80).optional(),
  isVerifiedSource: z.boolean().optional(),
}).passthrough());
const ReviewEnvelopeSchema = z.object({ migrationVersion: z.literal(1), kind: z.literal('manual_review'),
  id: IdSchema, candidateCategory: CategorySchema.nullable(), warnings: z.array(z.string()).min(1),
  legacy: LegacySchema,
}).strict();

/** A dry-run review envelope is intentionally NOT an opportunity and cannot be published. */
export function migrateLegacy(input: unknown) {
  const envelope = ReviewEnvelopeSchema.safeParse(input);
  if (envelope.success) return envelope.data;
  if (typeof input === 'object' && input !== null && 'schemaVersion' in input) {
    const record = OpportunityRecordSchema.safeParse(input);
    return record.success ? { kind: 'current' as const, record: record.data } : { kind: 'invalid' as const, code: 'UNSUPPORTED_OR_INVALID_VERSION' };
  }
  const parsed = LegacySchema.safeParse(input);
  if (!parsed.success) return { kind: 'invalid' as const, code: 'INVALID_LEGACY' };
  const legacy = parsed.data;
  const category = CategorySchema.safeParse(legacy.opportunityType);
  return ReviewEnvelopeSchema.parse({ migrationVersion: 1, kind: 'manual_review', id: legacy.id,
    candidateCategory: category.success ? category.data : null,
    warnings: ['Source permission, provenance, requirements and publication need human review',
      'Legacy verification and currency/period defaults are not evidence',
      'Missing or null deadline does not mean open until filled',
      ...(!category.success ? ['Unsupported legacy category; do not map to job'] : [])], legacy });
}
