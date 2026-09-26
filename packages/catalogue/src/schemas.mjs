import { z } from 'zod';
import { CategorySchema, IdSchema, InstantSchema } from '@skilved/types/opportunities';
export const Source = z.object({ id: IdSchema, revision: z.number().int().positive(),
  name: z.string().min(1).max(200), urls: z.array(z.string().url().max(2048)).min(1).max(20),
  permission: z.object({ reference: z.string().min(1).max(2000), method: z.literal('structured_json'),
    reuse: z.string().min(1).max(2000), reviewedAt: InstantSchema }).strict(),
  categories: z.array(CategorySchema).min(1).max(6), owner: IdSchema,
  paused: z.boolean(), cadenceHours: z.number().int().min(1).max(720),
  maxBytes: z.number().int().min(100).max(500000),
}).strict();
export const Report = z.object({ opportunityId: IdSchema,
  kind: z.enum(['incorrect', 'closed', 'unsafe_destination', 'other']), text: z.string().trim().min(1).max(1500),
}).strict();
export const Reason = z.string().trim().min(3).max(1000);
export const JobInput = z.object({ sourceId: IdSchema, url: z.string().url().max(2048),
  key: z.string().min(1).max(120) }).strict();
