import { z } from 'zod';
import {FastSourcePolicy} from './fast-source-policy.mjs';
import { CategorySchema, IdSchema, InstantSchema } from '@skilved/types/opportunities';
export const IssuerRoute = z.object({ name: z.string().trim().min(1).max(200),
  aliases: z.array(z.string().trim().min(1).max(200)).max(10).default([]),
  host: z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,}$/),
  pathPrefix: z.string().regex(/^\/[^?#]*$/).max(500),
  emailAddresses: z.array(z.string().max(254).email()).max(30).default([]),
  evidence: z.string().min(1).max(2000),
}).strict();
export const EmployerRelationship = z.object({ id: IdSchema, revision: z.number().int().positive(),
  state: z.enum(['qualified','revoked']), categories: z.array(CategorySchema).min(1).max(6),
  reviewedAt: InstantSchema, expiresAt: InstantSchema, route: IssuerRoute,
  delegationPage: z.string().url().max(2048).optional(),
}).strict().refine(r => r.expiresAt > r.reviewedAt, 'Relationship expiry must follow review').refine(r => {
  if (!r.delegationPage) return true;
  try { const url = new URL(r.delegationPage), prefix = r.route.pathPrefix;
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.search && !url.hash &&
      url.hostname === r.route.host && (url.pathname === prefix || url.pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`));
  } catch { return false; }
}, 'Delegation evidence must be a fixed page within the reviewed corporate route');
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
    fastIngestion: FastSourcePolicy.optional(),
    applicationLayouts: z.literal('shadow_v1').optional(),
    originalVerification: z.literal('shadow_v1').optional(),
    missingDateEvidence: z.enum(['shadow_v1','shadow_v2']).optional(),
    issuerRegistry: z.literal('shadow_v1').optional(),
    originDiscovery: z.literal('shadow_v1').optional(),
    maxModelCallsPerDay: z.number().int().min(1).max(100),
    minRequestIntervalMs: z.number().int().min(2000).max(60000), checkTtlHours: z.number().int().min(1).max(24),
    issuers: z.array(IssuerRoute).max(30),
  }).strict().optional(),
}).strict().refine(source => source.automation?.mode !== 'automatic' ||
  (source.permission.method === 'recentjobs_html' && source.cadenceHours <= source.automation.checkTtlHours),
  'Automatic source cadence must fit the freshness window').refine(source =>
  !['shadow_recent', 'shadow_recent_v2'].includes(source.automation?.undatedNotices) || source.automation.mode === 'shadow',
  'Undated notices require shadow mode').refine(source => source.automation?.undatedNotices !== 'shadow_recent_v2' ||
  (source.automation.checkTtlHours <= 6 && source.cadenceHours <= source.automation.checkTtlHours),
  'V2 undated shadow cadence and TTL must fit six hours').refine(source =>
  !source.automation?.originalVerification || source.automation.mode !== 'automatic',
  'Original notice resolver cannot use automatic mode').refine(source =>
  !source.automation?.missingDateEvidence || (source.automation.mode === 'shadow' &&
    source.automation.originalVerification === 'shadow_v1' && source.automation.employerCrawl &&
    source.automation.undatedNotices === 'reject'),
  'Missing-date evidence requires shadow original verification, explicit crawling and rejected undated admission').refine(source =>
  source.automation?.missingDateEvidence !== 'shadow_v2' || source.automation.originDiscovery === 'shadow_v1',
  'V2 missing-date probes require explicit shadow origin discovery').refine(source =>
  !source.automation?.issuerRegistry || (source.automation.originalVerification === 'shadow_v1' &&
    source.automation.issuers.length === 0 && source.automation.undatedNotices === 'reject'),
  'Registry sources require original verification, no inline issuers and dated notices').refine(source =>
  !source.automation?.originDiscovery || source.automation.issuerRegistry === 'shadow_v1',
  'Origin discovery requires the shadow issuer registry').refine(source =>
  !source.automation?.applicationLayouts || (source.automation.mode === 'shadow' && source.permission.method === 'recentjobs_html'),
  'Application layouts require explicit shadow mode').refine(source =>
  !source.automation?.fastIngestion || (source.automation.mode === 'shadow' && source.permission.method === 'recentjobs_html'),
  'Fast ingestion requires shadow RecentJobs mode');
export const Report = z.object({ opportunityId: IdSchema,
  kind: z.enum(['incorrect', 'closed', 'unsafe_destination', 'other']), text: z.string().trim().min(1).max(1500),
}).strict();
export const Reason = z.string().trim().min(3).max(1000);
export const JobInput = z.object({ sourceId: IdSchema, url: z.string().url().max(2048),
  key: z.string().min(1).max(120) }).strict();
