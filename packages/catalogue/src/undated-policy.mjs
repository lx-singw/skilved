import { createHash } from 'node:crypto';
import { DateSchema, InstantSchema } from '@skilved/types/opportunities';
import { DomainError } from './config.mjs';

const fail = code => { throw new DomainError(code); };
const hash = text => createHash('sha256').update(text).digest('hex');

export function undatedOriginKeys(candidate) {
  const route = candidate.applicationCandidates[0];
  // Ignore tracking queries for identity, while retaining the full action URL.
  const identity = route.method === 'portal' ? new URL(route.destination).origin + new URL(route.destination).pathname
    : route.destination.toLowerCase();
  return [hash(`undated_shadow_v2:notice:${candidate.sourceUrl}`),
    hash(`undated_shadow_v2:route:${route.method}:${identity}`)];
}
const timing = /\b(?:closing\b|deadlines?\b|apply\s+(?:by|before)\b|applications?\s+(?:will\s+)?clos(?:e|es|ing)\b|until\s+filled\b|rolling\b|valid\s+through\b|cut[\s-]?off\b|no\s+later\s+than\b|recruitment\s+(?:ends?|closes?)\b|applications?\s+(?:are\s+)?(?:due|open\s+until|accepted\s+until)\b)/i;
const closed = /\b(?:applications?\s+(?:are\s+)?closed|(?:position|vacancy)\s+(?:is\s+|has\s+been\s+)?filled|no\s+longer\s+accepting\s+applications)\b/i;
const label = '(?:(?:application\\s+)?(?:closing\\s+date|deadline)|closing)';
const unspecified = new RegExp(`^${label}(?:\\s*[:;–—-]\\s*|\\s+)not\\s+(?:specified|stated)\\s*[.!]?\\s*$`, 'i');
const fieldLabel = new RegExp(`^${label}\\s*[:;–—-]\\s*$`, 'i');

export const usesUndatedV2 = (source, candidate) => source.automation?.undatedNotices === 'shadow_recent_v2' &&
  !candidate.deadlineCandidates.some(d => d.localDate != null);

/** Only a whole, unambiguous source field qualifies as explicitly unspecified. */
export function undatedTimingEvidence(candidate) {
  const title = candidate.title ?? '', body = candidate.sourceText ?? '';
  if (closed.test(`${title}\n${body}`)) fail('NOTICE_NOT_OPEN');
  const lines = body.split('\n'), evidence = [], remainder = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (unspecified.test(line)) evidence.push(line);
    else if (fieldLabel.test(line) && /^not\s+(?:specified|stated)\s*[.!]?\s*$/i.test(lines[i + 1]?.trim() ?? ''))
      evidence.push(`${line}\n${lines[++i].trim()}`);
    else remainder.push(line);
  }
  if (evidence.length > 1 || timing.test(`${title}\n${remainder.join('\n')}`) ||
      candidate.deadlineCandidates.length > evidence.length || candidate.deadlineCandidates.some(d =>
        d.localDate !== null || typeof d.originalText !== 'string' || !unspecified.test(d.originalText.replace(/\s+/g, ' ').trim()))) fail('NOTICE_PRECISION_UNSUPPORTED');
  return { state: evidence.length ? 'explicitly_unspecified' : 'absent', sourceQuote: evidence[0] ?? null };
}

function publishedInstant(raw) {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(raw) ||
      !DateSchema.safeParse(raw.slice(0, 10)).success || !Number.isFinite(Date.parse(raw))) fail('UNDATED_NOTICE_FRESHNESS_REQUIRED');
  return new Date(raw).toISOString();
}

/** Stored under both global notice-URL and exact-route keys, independent of job/source revision. */
export function makeUndatedOrigin(source, candidate, issuer, sourceRetrievedAt, now) {
  const route = candidate.applicationCandidates[0];
  if (!route || candidate.applicationCandidates.length !== 1 || typeof issuer !== 'string' || !issuer.trim() ||
      typeof candidate.title !== 'string' || !candidate.title.trim() || typeof candidate.sourceUrl !== 'string' ||
      !/^[a-f0-9]{64}$/.test(candidate.contentHash ?? '')) fail('UNDATED_NOTICE_ORIGIN_REQUIRED');
  if (!InstantSchema.safeParse(sourceRetrievedAt).success || !InstantSchema.safeParse(now).success)
    fail('UNDATED_NOTICE_FRESHNESS_REQUIRED');
  const sourcePublishedAt = publishedInstant(candidate.sourcePublishedAtRaw);
  if (sourcePublishedAt > sourceRetrievedAt || sourceRetrievedAt > now) fail('UNDATED_NOTICE_FRESHNESS_REQUIRED');
  return { version: 2, sourceId: source.id, sourceUrl: candidate.sourceUrl, sourceTitle: candidate.title,
    issuer: issuer.trim().replace(/\s+/g, ' ').toLowerCase(), method: route.method, destination: route.destination,
    sourcePublishedAt, firstSeenAt: sourceRetrievedAt, firstContentHash: candidate.contentHash };
}

export function undatedV2Window(source, candidate, now, sourceRetrievedAt, origin) {
  if (source.automation?.mode !== 'shadow' || source.automation.undatedNotices !== 'shadow_recent_v2' ||
      !Number.isInteger(source.automation.checkTtlHours) || source.automation.checkTtlHours < 1 || source.automation.checkTtlHours > 6)
    fail('NOTICE_PRECISION_UNSUPPORTED');
  const timingEvidence = undatedTimingEvidence(candidate);
  if (!origin) fail('UNDATED_NOTICE_ORIGIN_REQUIRED');
  const expected = makeUndatedOrigin(source, candidate, origin.issuer, sourceRetrievedAt, now);
  for (const k of ['version', 'sourceId', 'sourceUrl', 'sourceTitle', 'issuer', 'method', 'destination', 'sourcePublishedAt'])
    if (expected[k] !== origin[k]) fail('UNDATED_NOTICE_ORIGIN_CONFLICT');
  if (!InstantSchema.safeParse(origin.firstSeenAt).success || !/^[a-f0-9]{64}$/.test(origin.firstContentHash ?? '') ||
      origin.sourcePublishedAt > origin.firstSeenAt || origin.firstSeenAt > sourceRetrievedAt) fail('UNDATED_NOTICE_ORIGIN_CONFLICT');
  const reviewExpiresAt = Math.min(Date.parse(origin.sourcePublishedAt) + 7 * 86_400_000,
    Date.parse(sourceRetrievedAt) + source.automation.checkTtlHours * 3_600_000);
  if (Date.parse(now) >= reviewExpiresAt) fail('UNDATED_NOTICE_FRESHNESS_REQUIRED');
  return { deadlinePolicy: 'undated_shadow_v2', sourcePublishedAt: origin.sourcePublishedAt,
    firstSeenAt: origin.firstSeenAt, sourceRetrievedAt, reviewExpiresAt: new Date(reviewExpiresAt).toISOString(),
    nextCheckAt: new Date(reviewExpiresAt).toISOString(), availability: 'unverified', timingEvidence };
}
