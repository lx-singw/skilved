import { z } from 'zod';
import { IdSchema, InstantSchema, RevisionSchema } from './primitives';

/** Personal annotations stay browser-local; these are never a public projection. */
export const LocalProgressStageSchema = z.enum(['interested', 'preparing', 'applied_reported', 'not_pursuing']);
export const LocalProgressItemSchema = z.object({
  opportunityId: IdSchema, lastViewedRevision: RevisionSchema,
  savedAt: InstantSchema, updatedAt: InstantSchema, userStage: LocalProgressStageSchema,
  lastRouteOpenedAt: InstantSchema.nullable(), reportedAppliedAt: InstantSchema.nullable(),
}).strict().superRefine((item, ctx) => {
  if (item.savedAt > item.updatedAt || [item.lastRouteOpenedAt, item.reportedAppliedAt].some(time => time && (time < item.savedAt || time > item.updatedAt)))
    ctx.addIssue({ code: 'custom', message: 'Invalid local event order' });
  if (item.userStage === 'applied_reported' && !item.reportedAppliedAt)
    ctx.addIssue({ code: 'custom', message: 'Applied needs an explicit local report' });
});
export const LocalProgressDocumentSchema = z.object({
  schemaVersion: z.literal(1), writeToken: IdSchema,
  items: z.array(LocalProgressItemSchema).max(100),
}).strict().refine(doc => new Set(doc.items.map(item => item.opportunityId)).size === doc.items.length, 'Duplicate saved ID');
export const LocalProgressCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('save'), id: IdSchema, revision: RevisionSchema }).strict(),
  z.object({ type: z.literal('remove'), id: IdSchema }).strict(),
  z.object({ type: z.literal('stage'), id: IdSchema, stage: LocalProgressStageSchema }).strict(),
  z.object({ type: z.literal('route_opened'), id: IdSchema }).strict(),
  z.object({ type: z.literal('acknowledge_revision'), id: IdSchema, revision: RevisionSchema }).strict(),
]);
export type LocalProgressItem = z.infer<typeof LocalProgressItemSchema>;
export type LocalProgressDocument = z.infer<typeof LocalProgressDocumentSchema>;
export type LocalProgressCommand = z.infer<typeof LocalProgressCommandSchema>;
