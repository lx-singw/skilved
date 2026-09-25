import { z } from 'zod';
import { CategorySchema, HttpsSchema, IdSchema, InstantSchema, InternshipSchema, JsonBoundarySchema, RevisionSchema, TextSchema, publicFactSchema } from './primitives';
import { ApplicationRouteSchema, CompensationSchema, DeadlineSchema, LocationSchema, OrganisationSchema } from './values';
import { PublicRequirementSetSchema } from './requirements';

export const CheckScopeSchema = z.enum(['issuer_attribution', 'announcement', 'application_relationship', 'destination_reachability', 'availability', 'requirements']);
export const CheckOutcomeSchema = z.enum(['supported', 'unresolved', 'failed', 'contradicted']);
export const PublicCheckSchema = z.object({ scope: CheckScopeSchema, outcome: CheckOutcomeSchema,
  checkedAt: InstantSchema, nextCheckAt: InstantSchema.nullable(), citations: z.array(IdSchema).min(1).max(20),
}).strict();
export const CitationSchema = z.object({ id: IdSchema, label: TextSchema, url: HttpsSchema }).strict();
export const PublicOpportunitySchema = JsonBoundarySchema.pipe(z.object({
  schemaVersion: z.literal(1), id: IdSchema, revision: RevisionSchema, category: CategorySchema,
  internship: InternshipSchema.nullable(), title: publicFactSchema(TextSchema), issuer: publicFactSchema(TextSchema),
  summary: publicFactSchema(TextSchema), fields: z.array(TextSchema).max(20),
  intake: publicFactSchema(TextSchema), organisations: z.array(publicFactSchema(OrganisationSchema)).max(20),
  location: publicFactSchema(LocationSchema), residence: publicFactSchema(TextSchema), experience: publicFactSchema(TextSchema),
  deadline: publicFactSchema(DeadlineSchema), compensation: z.array(publicFactSchema(CompensationSchema)).max(20),
  practicalConditions: publicFactSchema(TextSchema), requirements: PublicRequirementSetSchema,
  explanation: z.object({ text: TextSchema, requirementRevision: RevisionSchema, citations: z.array(IdSchema).min(1).max(20) }).strict().nullable(),
  lifecycle: z.enum(['published', 'closed']),
  application: z.discriminatedUnion('state', [
    z.object({ state: z.literal('available'), route: ApplicationRouteSchema, citations: z.array(IdSchema).min(1).max(20) }).strict(),
    z.object({ state: z.literal('unavailable'), reason: z.enum(['closed', 'needs_review', 'not_stated']) }).strict(),
  ]),
  checks: z.array(PublicCheckSchema).max(100), citations: z.array(CitationSchema).max(100),
  createdAt: InstantSchema, updatedAt: InstantSchema,
}).strict().superRefine((o, ctx) => {
  if ((o.category === 'internship') !== (o.internship !== null)) ctx.addIssue({ code: 'custom', message: 'Invalid internship subtype' });
  if (o.lifecycle === 'closed' && o.application.state === 'available') ctx.addIssue({ code: 'custom', message: 'Closed action must be disabled' });
  if (o.explanation && o.explanation.requirementRevision !== o.requirements.revision) ctx.addIssue({ code: 'custom', message: 'Stale explanation' });
  const ids = new Set(o.citations.map(c => c.id));
  if (ids.size !== o.citations.length) ctx.addIssue({ code: 'custom', message: 'Duplicate citation' });
  function check(value: unknown) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(check); return; }
    for (const [key, child] of Object.entries(value)) {
      if (key === 'citations' && Array.isArray(child) && child.some(id => typeof id === 'string' && !ids.has(id)))
        ctx.addIssue({ code: 'custom', message: 'Missing public citation' });
      else check(child);
    }
  }
  check(o);
}));
export type PublicOpportunity = z.infer<typeof PublicOpportunitySchema>;
export const PublicStatusSchema = z.object({ schemaVersion: z.literal(1), id: IdSchema, revision: RevisionSchema,
  status: z.enum(['under_review', 'withdrawn', 'archived']), application: z.literal('unavailable'),
}).strict();
export const ProjectionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('opportunity'), opportunity: PublicOpportunitySchema }).strict(),
  z.object({ kind: z.literal('status'), status: PublicStatusSchema }).strict(),
  z.object({ kind: z.literal('not_public') }).strict(),
  z.object({ kind: z.literal('invalid'), code: z.literal('INVALID_RECORD') }).strict(),
]);
export type Projection = z.infer<typeof ProjectionSchema>;
