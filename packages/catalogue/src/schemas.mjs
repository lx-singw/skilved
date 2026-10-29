import { z } from 'zod';
import { CategorySchema, IdSchema, InstantSchema } from '@skilved/types/opportunities';
export const Source = z.object({ id: IdSchema, revision: z.number().int().positive(),
  name: z.string().min(1).max(200), urls: z.array(z.string().url().max(2048)).min(1).max(20),
  permission: z.object({ reference: z.string().min(1).max(2000), method: z.enum(['structured_json', 'recentjobs_html']),
    reuse: z.string().min(1).max(2000), reviewedAt: InstantSchema }).strict(),
  categories: z.array(CategorySchema).min(1).max(6), owner: IdSchema,
  paused: z.boolean(), cadenceHours: z.number().int().min(1).max(720),
  maxBytes: z.number().int().min(100).max(500000),
  automation: z.object({ mode: z.enum(['disabled', 'shadow', 'automatic']),
    employerCrawl: z.boolean().default(false),
    undatedNotices: z.enum(['reject', 'shadow_recent', 'shadow_recent_v2']).default('reject'),
    qualificationRef: z.string().min(1).max(2000), maxArticles: z.number().int().min(1).max(10),
    // Opt-in publisher discovery: maxArticles is the chunk size, not a page truncation.
    discovery: z.object({ maxPages: z.number().int().min(1).max(5) }).strict().optional(),
    maxModelCallsPerDay: z.number().int().min(1).max(100),
    minRequestIntervalMs: z.number().int().min(2000).max(60000), checkTtlHours: z.number().int().min(1).max(24),
    issuers: z.array(z.object({ name: z.string().trim().min(1).max(200),
      aliases: z.array(z.string().trim().min(1).max(200)).max(10).default([]),
      host: z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,}$/),
      pathPrefix: z.string().regex(/^\/[^?#]*$/).max(500),
      emailAddresses: z.array(z.string().max(254).email()).max(30).default([]),
      evidence: z.string().min(1).max(2000),
    }).strict()).max(30),
  }).strict().optional(),
}).strict().refine(source => source.automation?.mode !== 'automatic' ||
  (source.permission.method === 'recentjobs_html' && source.cadenceHours <= source.automation.checkTtlHours),
  'Automatic source cadence must fit the freshness window').refine(source =>
  !['shadow_recent', 'shadow_recent_v2'].includes(source.automation?.undatedNotices) || source.automation.mode === 'shadow',
  'Undated notices require shadow mode').refine(source => source.automation?.undatedNotices !== 'shadow_recent_v2' ||
  (source.automation.checkTtlHours <= 6 && source.cadenceHours <= source.automation.checkTtlHours),
  'V2 undated shadow cadence and TTL must fit six hours');
export const Report = z.object({ opportunityId: IdSchema,
  kind: z.enum(['incorrect', 'closed', 'unsafe_destination', 'other']), text: z.string().trim().min(1).max(1500),
}).strict();
export const Reason = z.string().trim().min(3).max(1000);
export const JobInput = z.object({ sourceId: IdSchema, url: z.string().url().max(2048),
  key: z.string().min(1).max(120) }).strict();
