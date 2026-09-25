import { z } from 'zod';
import { CategorySchema, Fact, IdSchema, InstantSchema, InternshipSchema, JsonBoundarySchema, RevisionSchema, TextSchema, factSchema } from './primitives';
import { ApplicationRouteSchema, CompensationSchema, DeadlineSchema, LocationSchema, OrganisationSchema } from './values';
import { RequirementSetSchema } from './requirements';
import { CheckOutcomeSchema, CheckScopeSchema, CitationSchema, Projection, ProjectionSchema } from './public';

const CheckSchema = z.object({ id: IdSchema, scope: CheckScopeSchema, outcome: CheckOutcomeSchema,
  checkedAt: InstantSchema, nextCheckAt: InstantSchema.nullable(), reviewerId: IdSchema,
  citationIds: z.array(IdSchema).min(1).max(20), recordRevision: RevisionSchema,
  // Application checks must be bound to the exact destination, not just the issuer.
  destination: z.string().max(4000).nullable(), public: z.boolean(), notes: TextSchema.nullable(),
}).strict();
const RecordShape = z.object({
  schemaVersion: z.literal(1), id: IdSchema, revision: RevisionSchema, category: CategorySchema,
  internship: InternshipSchema.nullable(), title: factSchema(TextSchema), issuer: factSchema(TextSchema),
  summary: factSchema(TextSchema), fields: z.array(TextSchema).max(20), intake: factSchema(TextSchema),
  organisations: z.array(factSchema(OrganisationSchema)).max(20), location: factSchema(LocationSchema),
  residence: factSchema(TextSchema), experience: factSchema(TextSchema), deadline: factSchema(DeadlineSchema),
  compensation: z.array(factSchema(CompensationSchema)).max(20), practicalConditions: factSchema(TextSchema),
  requirements: RequirementSetSchema, applicationRoute: factSchema(ApplicationRouteSchema),
  lifecycle: z.enum(['draft', 'review', 'published', 'closed', 'withdrawn', 'archived']),
  publication: z.object({ approved: z.boolean(), previouslyPublic: z.boolean(),
    disposition: z.enum(['clear', 'withheld', 'review_required']), reviewedBy: IdSchema.nullable(),
  }).strict(),
  citations: z.array(CitationSchema.extend({ snapshotId: IdSchema, approved: z.boolean() }).strict()).max(100),
  checks: z.array(CheckSchema).max(100),
  explanation: z.object({ text: TextSchema, assertionIds: z.array(IdSchema).min(1).max(100),
    requirementRevision: RevisionSchema, method: z.enum(['human', 'rule', 'model']),
    reviewedBy: IdSchema.nullable(), review: z.enum(['pending', 'approved', 'rejected']),
  }).strict().nullable(),
  private: z.object({ reviewerNotes: TextSchema.nullable(), rawSource: z.string().max(20_000).nullable(),
    submittedUrl: z.string().max(2048).nullable(), queueId: IdSchema.nullable(),
  }).strict(),
  createdAt: InstantSchema, updatedAt: InstantSchema,
}).strict();
export const OpportunityRecordSchema = JsonBoundarySchema.pipe(RecordShape.superRefine((o, ctx) => {
  if ((o.category === 'internship') !== (o.internship !== null)) ctx.addIssue({ code: 'custom', message: 'Invalid internship subtype' });
  if (o.createdAt > o.updatedAt) ctx.addIssue({ code: 'custom', message: 'Invalid event ordering' });
  if (o.publication.approved && !o.publication.reviewedBy) ctx.addIssue({ code: 'custom', message: 'Publication needs review' });
  for (const items of [o.citations, o.checks, allFacts(o)]) {
    if (new Set(items.map(x => x.id)).size !== items.length) ctx.addIssue({ code: 'custom', message: 'Duplicate record reference' });
  }
  const snapshots = new Set(o.citations.map(c => c.snapshotId));
  for (const fact of allFacts(o)) if (fact.sourceSnapshotIds.some(id => !snapshots.has(id)))
    ctx.addIssue({ code: 'custom', message: 'Unresolved source snapshot' });
  const citations = new Set(o.citations.map(c => c.id));
  if (o.checks.some(c => c.citationIds.some(id => !citations.has(id)))) ctx.addIssue({ code: 'custom', message: 'Unresolved check citation' });
  const assertions = new Set(allFacts(o).map(f => f.id));
  if (o.explanation?.assertionIds.some(id => !assertions.has(id))) ctx.addIssue({ code: 'custom', message: 'Unresolved explanation assertion' });
}));
export type OpportunityRecord = z.infer<typeof OpportunityRecordSchema>;
function allFacts(o: z.infer<typeof RecordShape>): Fact<unknown>[] {
  return [o.title, o.issuer, o.summary, o.intake, ...o.organisations, o.location, o.residence, o.experience,
    o.deadline, ...o.compensation, o.practicalConditions, o.applicationRoute, ...o.requirements.requirements.map(r => r.fact)];
}

/** Private/server entry only. Safe failure never returns Zod messages or private input. */
export function projectOpportunity(input: unknown): Projection {
  const parsed = OpportunityRecordSchema.safeParse(input);
  if (!parsed.success) return { kind: 'invalid', code: 'INVALID_RECORD' };
  const o = parsed.data;
  if (o.lifecycle === 'draft' || o.lifecycle === 'review') return { kind: 'not_public' };
  if (o.publication.disposition !== 'clear' || !o.publication.approved || o.lifecycle === 'withdrawn' || o.lifecycle === 'archived') {
    if (!o.publication.previouslyPublic) return { kind: 'not_public' };
    return { kind: 'status', status: { schemaVersion: 1, id: o.id, revision: o.revision,
      status: o.lifecycle === 'withdrawn' ? 'withdrawn' : o.lifecycle === 'archived' ? 'archived' : 'under_review', application: 'unavailable' } };
  }
  const citations = o.citations.filter(c => c.approved);
  function publicFact<T>(fact: Fact<T>) {
    const refs = citations.filter(c => fact.sourceSnapshotIds.includes(c.snapshotId)).map(c => c.id);
    if (fact.review !== 'approved' || fact.sourceSnapshotIds.some(id => !citations.some(c => c.snapshotId === id)))
      return { state: 'not_stated' as const, value: null, originalText: null, citations: [] as string[] };
    return { state: fact.state, value: fact.value, originalText: fact.originalText, citations: refs };
  }
  const route = publicFact(o.applicationRoute);
  const visibleChecks = o.checks.filter(c => c.public && c.recordRevision === o.revision &&
    c.citationIds.every(id => citations.some(ref => ref.id === id)));
  // Private safety observations still suppress actions; only their notes stay private.
  const currentChecks = o.checks.filter(c => c.recordRevision === o.revision);
  const relationshipChecks = currentChecks.filter(c => c.scope === 'application_relationship' && c.destination === route.value?.destination)
    .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
  const latest = relationshipChecks[0];
  const sameTimeContradiction = latest && relationshipChecks.some(c => c.checkedAt === latest.checkedAt && c.outcome !== 'supported');
  const reachability = currentChecks.filter(c => c.scope === 'destination_reachability' && c.destination === route.value?.destination)
    .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
  const reachabilityBlocked = reachability[0] && reachability.some(c => c.checkedAt === reachability[0].checkedAt && c.outcome !== 'supported');
  const application = o.lifecycle === 'closed' ? { state: 'unavailable', reason: 'closed' } :
    route.state === 'stated' && route.value && latest?.outcome === 'supported' && visibleChecks.includes(latest) && !sameTimeContradiction && !reachabilityBlocked ?
      { state: 'available', route: route.value, citations: route.citations } :
      { state: 'unavailable', reason: route.state === 'not_stated' ? 'not_stated' : 'needs_review' };
  const assertions = allFacts(o).filter(f => o.explanation?.assertionIds.includes(f.id));
  const explanation = o.explanation?.review === 'approved' && o.explanation.reviewedBy &&
    o.explanation.requirementRevision === o.requirements.revision && assertions.every(f => publicFact(f).state === 'stated') ?
    { text: o.explanation.text, requirementRevision: o.explanation.requirementRevision,
      citations: [...new Set(assertions.flatMap(f => publicFact(f).citations))] } : null;
  const result = ProjectionSchema.safeParse({ kind: 'opportunity', opportunity: {
    schemaVersion: 1, id: o.id, revision: o.revision, category: o.category, internship: o.internship,
    title: publicFact(o.title), issuer: publicFact(o.issuer), summary: publicFact(o.summary), fields: o.fields,
    intake: publicFact(o.intake), organisations: o.organisations.map(publicFact), location: publicFact(o.location),
    residence: publicFact(o.residence), experience: publicFact(o.experience), deadline: publicFact(o.deadline),
    compensation: o.compensation.map(publicFact), practicalConditions: publicFact(o.practicalConditions),
    requirements: { id: o.requirements.id, revision: o.requirements.revision, expression: o.requirements.expression,
      requirements: o.requirements.requirements.map(r => ({ id: r.id, kind: r.kind, level: r.level, fact: publicFact(r.fact) })) },
    explanation, lifecycle: o.lifecycle, application,
    checks: visibleChecks.map(c => ({ scope: c.scope, outcome: c.outcome, checkedAt: c.checkedAt, nextCheckAt: c.nextCheckAt, citations: c.citationIds })),
    citations: citations.map(c => ({ id: c.id, label: c.label, url: c.url })), createdAt: o.createdAt, updatedAt: o.updatedAt,
  } });
  return result.success ? result.data : { kind: 'invalid', code: 'INVALID_RECORD' };
}
