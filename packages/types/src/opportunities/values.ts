import { z } from 'zod';
import { DateSchema, HttpsSchema, InstantSchema, ProvinceSchema, TextSchema } from './primitives';

export const PlaceSchema = z.object({ country: z.string().regex(/^[A-Z]{2}$/), province: ProvinceSchema.nullable(), city: TextSchema.nullable() }).strict();
export const LocationSchema = z.object({ places: z.array(PlaceSchema).max(20),
  coverage: z.enum(['local', 'national', 'international', 'not_stated']),
  attendance: z.enum(['in_person', 'hybrid', 'remote', 'not_stated']),
  relocation: TextSchema.nullable(),
}).strict();
export const CompensationSchema = z.object({ kind: z.enum(['salary', 'stipend', 'tuition', 'books', 'accommodation', 'transport', 'allowance', 'other']),
  amount: z.number().finite().nonnegative().nullable(), maximum: z.number().finite().nonnegative().nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable(), period: z.enum(['hour', 'day', 'week', 'month', 'year', 'once', 'programme', 'not_stated']),
  coverage: TextSchema.nullable(),
}).strict().refine(c => c.maximum === null || (c.amount !== null && c.maximum >= c.amount), 'Invalid compensation range');
export const DeadlineSchema = z.object({ kind: z.enum(['date', 'open_until_filled']), originalText: TextSchema,
  localDate: DateSchema.nullable(), localTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable(),
  timezone: z.string().max(80).refine(zone => { try { new Intl.DateTimeFormat('en', { timeZone: zone }); return true; } catch { return false; } }, 'Invalid timezone').nullable(),
  utcInstant: InstantSchema.nullable(),
}).strict().superRefine((d, ctx) => {
  const error = () => ctx.addIssue({ code: 'custom', message: 'Inconsistent deadline precision' });
  if (d.kind === 'open_until_filled') { if (d.localDate || d.localTime || d.timezone || d.utcInstant) error(); return; }
  if (!d.localDate || (!d.localTime && d.utcInstant) || (!d.timezone && d.utcInstant)) { error(); return; }
  if (d.utcInstant && d.timezone) {
    if (!InstantSchema.safeParse(d.utcInstant).success) { error(); return; }
    try {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: d.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(d.utcInstant));
    const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
    if (`${p.year}-${p.month}-${p.day}` !== d.localDate || `${p.hour}:${p.minute}` !== d.localTime || d.utcInstant.slice(17) !== '00.000Z') error();
    } catch { error(); }
  }
});
export type Deadline = z.infer<typeof DeadlineSchema>;
export function deadlineTiming(input: unknown, now: string): 'past_instant' | 'future_instant' | 'no_exact_instant' {
  const deadline = DeadlineSchema.parse(input); InstantSchema.parse(now);
  if (!deadline.utcInstant) return 'no_exact_instant';
  return deadline.utcInstant <= now ? 'past_instant' : 'future_instant';
}
export const ApplicationRouteSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('portal'), destination: HttpsSchema }).strict(),
  z.object({ method: z.literal('email'), destination: z.string().max(254).email() }).strict(),
  z.object({ method: z.literal('in_person'), destination: TextSchema }).strict(),
  z.object({ method: z.literal('post'), destination: TextSchema }).strict(),
]);
export const OrganisationSchema = z.object({ name: TextSchema,
  role: z.enum(['issuer', 'employer_host', 'training_provider', 'qualification_issuer', 'oversight']),
}).strict();
