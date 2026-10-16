import { z } from 'zod';
import { IdSchema, InstantSchema, RevisionSchema } from './primitives';

/** Conservative intake syntax, not a permission, publicness or fetch decision. */
function suggestionUrl(value: string): boolean {
  if (/[\s\\%]/.test(value)) return false;
  const match = /^https:\/\/([a-z0-9.-]+)(\/[^?#]*)?$/i.exec(value);
  if (!match || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(match[1])) return false;
  const path = match[2] ?? '/';
  if (/[;=]/.test(path)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.search && !url.hash && url.pathname === path;
  } catch { return false; }
}
export const SuggestionUrlSchema = z.string().min(1).max(2048).refine(suggestionUrl, 'Unsupported suggestion URL syntax')
  .transform(value => new URL(value).href);
export const SuggestionRequestSchema = z.object({ url: SuggestionUrlSchema }).strict();
export type SuggestionRequest = z.infer<typeof SuggestionRequestSchema>;

// Receipt access and replay credentials use 32 random bytes encoded as lowercase hex.
// This entry point is deliberately separate from general public opportunity contracts.
export const SuggestionSecretSchema = z.string().length(64).regex(/^[a-f0-9]{64}$/);
export const SuggestionReceiptIdSchema = z.string().length(64).regex(/^[a-f0-9]{64}$/);
export const SuggestionStatusSchema = z.enum(['received', 'reviewing', 'resolved_to_listing',
  'unresolved', 'unsupported', 'paused', 'withdrawn']);
export const SuggestionAccessSchema = z.object({
  receiptId: SuggestionReceiptIdSchema, capability: SuggestionSecretSchema, expiresAt: InstantSchema,
}).strict();
export const SuggestionStatusResponseSchema = z.object({
  schemaVersion: z.literal(1), receiptId: SuggestionReceiptIdSchema,
  status: SuggestionStatusSchema, revision: RevisionSchema,
  createdAt: InstantSchema, updatedAt: InstantSchema, expiresAt: InstantSchema,
  publicResultIds: z.array(IdSchema).max(20),
}).strict().superRefine((value, ctx) => {
  if (!(value.createdAt <= value.updatedAt && value.updatedAt < value.expiresAt))
    ctx.addIssue({ code: 'custom', message: 'Inconsistent receipt times' });
  if ((value.status === 'resolved_to_listing') !== (value.publicResultIds.length > 0) ||
      new Set(value.publicResultIds).size !== value.publicResultIds.length)
    ctx.addIssue({ code: 'custom', message: 'Inconsistent receipt results' });
});
export type SuggestionAccess = z.infer<typeof SuggestionAccessSchema>;
export type SuggestionStatusResponse = z.infer<typeof SuggestionStatusResponseSchema>;
export const SuggestionWithdrawResponseSchema = z.object({
  schemaVersion: z.literal(1), receiptId: SuggestionReceiptIdSchema, status: z.literal('withdrawn'),
}).strict();
export type SuggestionWithdrawResponse = z.infer<typeof SuggestionWithdrawResponseSchema>;
export const SuggestionCreateResponseSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('received'), access: SuggestionAccessSchema }).strict(),
  z.object({ kind: z.literal('approved'), publicResultIds: z.array(IdSchema).min(1).max(20)
    .refine(ids => new Set(ids).size === ids.length) }).strict(),
  z.object({ kind: z.literal('previous_result_unavailable') }).strict(),
]);
export type SuggestionCreateResponse = z.infer<typeof SuggestionCreateResponseSchema>;
