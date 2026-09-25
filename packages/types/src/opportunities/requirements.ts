import { z } from 'zod';
import { IdSchema, JsonBoundarySchema, LIMITS, RevisionSchema, TextSchema, factSchema, publicFactSchema } from './primitives';

export const RequirementValueSchema = z.object({
  description: TextSchema,
  qualification: z.object({ designation: TextSchema, level: z.number().int().min(1).max(10).nullable(),
    completion: z.enum(['completed', 'provisional', 'in_progress', 'not_stated']),
    subjects: z.array(z.object({ name: TextSchema, minimumPercent: z.number().min(0).max(100).nullable() }).strict()).max(20),
  }).strict().nullable(),
  document: z.object({ kind: TextSchema, stage: TextSchema.nullable(), certification: TextSchema.nullable(),
    format: TextSchema.nullable(), maxBytes: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable(),
  }).strict().nullable(),
}).strict();
export const RequirementSchema = z.object({ id: IdSchema,
  kind: z.enum(['education', 'subjects', 'age', 'citizenship', 'experience', 'residence', 'availability', 'document', 'funding', 'other']),
  level: z.enum(['required', 'preferred', 'unclear']), fact: factSchema(RequirementValueSchema),
}).strict();
export type Expression = { op: 'ref'; id: string } | { op: 'all' | 'any'; children: Expression[] } |
  { op: 'if'; condition: string; then: Expression; otherwise: Expression | null } |
  { op: 'unknown'; originalText: string };
const ExpressionSchema: z.ZodType<Expression> = z.lazy(() => z.discriminatedUnion('op', [
  z.object({ op: z.literal('ref'), id: IdSchema }).strict(),
  z.object({ op: z.literal('all'), children: z.array(ExpressionSchema).min(1).max(30) }).strict(),
  z.object({ op: z.literal('any'), children: z.array(ExpressionSchema).min(1).max(30) }).strict(),
  z.object({ op: z.literal('if'), condition: IdSchema, then: ExpressionSchema, otherwise: ExpressionSchema.nullable() }).strict(),
  z.object({ op: z.literal('unknown'), originalText: TextSchema }).strict(),
]));

function refineSet(set: { requirements: { id: string }[]; expression: Expression }, ctx: z.RefinementCtx) {
  const ids = new Set(set.requirements.map(r => r.id));
  if (ids.size !== set.requirements.length) ctx.addIssue({ code: 'custom', message: 'Duplicate requirement IDs' });
  const used = new Set<string>();
  let nodes = 0;
  function walk(node: Expression, depth: number) {
    if (++nodes > LIMITS.nodes || depth > LIMITS.depth) { ctx.addIssue({ code: 'custom', message: 'Requirement expression too large' }); return; }
    if (node.op === 'ref') { used.add(node.id); }
    else if (node.op === 'if') { used.add(node.condition); walk(node.then, depth + 1); if (node.otherwise) walk(node.otherwise, depth + 1); }
    else if (node.op === 'all' || node.op === 'any') node.children.forEach(child => walk(child, depth + 1));
  }
  walk(set.expression, 0);
  if ([...used].some(id => !ids.has(id))) ctx.addIssue({ code: 'custom', message: 'Missing requirement reference' });
  if ([...ids].some(id => !used.has(id))) ctx.addIssue({ code: 'custom', message: 'Unreferenced requirement would be omitted' });
}
const SetShape = { id: IdSchema, revision: RevisionSchema, requirements: z.array(RequirementSchema).max(LIMITS.list), expression: ExpressionSchema };
export const RequirementSetSchema = JsonBoundarySchema.pipe(z.object(SetShape).strict().superRefine(refineSet));
export const PublicRequirementSchema = RequirementSchema.omit({ fact: true }).extend({ fact: publicFactSchema(RequirementValueSchema) }).strict();
export const PublicRequirementSetSchema = JsonBoundarySchema.pipe(z.object({ ...SetShape,
  requirements: z.array(PublicRequirementSchema).max(LIMITS.list),
}).strict().superRefine(refineSet));
export type PublicRequirementSet = z.infer<typeof PublicRequirementSetSchema>;

/** Plain text for inspection/preparation. It does not evaluate a person's eligibility. */
export function formatRequirements(input: unknown): string {
  const set = PublicRequirementSetSchema.parse(input);
  const labels = new Map(set.requirements.map(r => [r.id,
    `[${r.level}] ${r.fact.originalText ?? 'Requirement not stated; confirm with the issuer'}${r.fact.state !== 'stated' ? ` (${r.fact.state})` : ''}`]));
  function format(node: Expression): string {
    switch (node.op) {
      case 'ref': return labels.get(node.id)!;
      case 'all': return `ALL of (${node.children.map(format).join(' AND ')})`;
      case 'any': return `ANY of (${node.children.map(format).join(' OR ')})`;
      case 'if': return `IF ${labels.get(node.condition)} THEN ${format(node.then)}${node.otherwise ? ` ELSE ${format(node.otherwise)}` : '; other cases not stated'}`;
      case 'unknown': return `Relationship needs confirmation: ${node.originalText}`;
    }
  }
  return format(set.expression);
}
