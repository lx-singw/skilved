import { DateSchema, InstantSchema } from '@skilved/types/opportunities';
import { DomainError } from './config.mjs';
import { usesUndatedV2, undatedV2Window } from './undated-policy.mjs';

export const RECENTJOBS_INDEX = 'https://recentjobs.co.za/category/apprenticeships/';
export const dayInSA = now => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg',
  year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
export const allFacts = o => [o.title, o.issuer, o.summary, o.intake, ...o.organisations, o.location,
  o.residence, o.experience, ...(o.entryStage ? [o.entryStage] : []), o.deadline, ...o.compensation, o.practicalConditions, o.applicationRoute,
  ...o.requirements.requirements.map(r => r.fact)];
const fail = code => { throw new DomainError(code); };
const nameKey = text => text.trim().replace(/\s+/g, ' ').toLowerCase();
const issuerNames = issuer => [issuer.name,...(issuer.aliases ?? [])].map(nameKey);

export function assertSourceTarget(url, kind = 'detail') {
  let parsed; try { parsed = new URL(url); } catch { fail('UNSAFE_URL'); }
  if (parsed.origin !== 'https://recentjobs.co.za' || parsed.username || parsed.password || parsed.search || parsed.hash ||
      (kind === 'index' ? parsed.href !== RECENTJOBS_INDEX : !/^\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+\/$/i.test(parsed.pathname))) fail('UNSAFE_URL');
  return parsed.href;
}

export function approvedRoute(source, route) {
  if (route?.method === 'email') {
    const matches = source.automation.issuers.filter(i => (i.emailAddresses ?? []).includes(route.destination));
    if (!matches.length) fail('ISSUER_RELATIONSHIP_UNQUALIFIED');
    return matches;
  }
  if (route?.method !== 'portal') fail('APPLICATION_UNRESOLVED');
  let url; try { url = new URL(route.destination); } catch { fail('APPLICATION_UNRESOLVED'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) fail('APPLICATION_UNRESOLVED');
  if (/(?:^|\.)(?:recentjobs\.co\.za|studentroom\.co\.za|lnkd\.in|bit\.ly)$/.test(url.hostname)) fail('APPLICATION_UNRESOLVED');
  const matches = source.automation.issuers.filter(i => i.host === url.hostname &&
    (url.pathname === i.pathPrefix || url.pathname.startsWith(i.pathPrefix.endsWith('/') ? i.pathPrefix : `${i.pathPrefix}/`)));
  if (!matches.length) fail('ISSUER_RELATIONSHIP_UNQUALIFIED');
  return matches;
}

/** Cheap source checks before model work; route scope alone does not establish the issuer. */
export function preflightCandidate(source, candidate, now, sourceRetrievedAt, undatedOrigin) {
  if (candidate.applicationInstructions?.length) fail('NOTICE_APPLICATION_METHOD_REVIEW_REQUIRED');
  if (candidate.issues?.includes('programme_subject_scope_review_required')) fail('NOTICE_PROGRAMME_SCOPE_REVIEW_REQUIRED');
  assertApprenticeshipSource(candidate);
  if (candidate.applicationCandidates.length !== 1) fail('NOTICE_PRECISION_UNSUPPORTED');
  if (usesUndatedV2(source, candidate)) undatedV2Window(source, candidate, now, sourceRetrievedAt, undatedOrigin);
  else if (!candidate.deadlineCandidates.length) undatedReviewWindow(source, candidate, now, sourceRetrievedAt);
  else if (candidateDeadline(candidate) <= dayInSA(now)) fail('NOTICE_NOT_OPEN');
  const route = candidate.applicationCandidates[0];
  const issuers = approvedRoute(source, route);
  if (usesUndatedV2(source, candidate) && (issuers.length !== 1 ||
      nameKey(issuers[0].name) !== undatedOrigin.issuer)) fail('UNDATED_NOTICE_ORIGIN_CONFLICT');
  return route;
}

/** Source recency permits private assessment, never a claim that applications are open. */
function undatedReviewWindow(source, candidate, now, sourceRetrievedAt) {
  const notice = `${candidate.title ?? ''}\n${candidate.sourceText ?? ''}`;
  if (source.automation?.mode !== 'shadow' || source.automation.undatedNotices !== 'shadow_recent' ||
      candidate.deadlineCandidates.length ||
      /\b(?:closing\s*(?:date\b|:)|(?:application\s+)?deadline\b|apply\s+by\b|applications?\s+clos(?:e|es|ing)\b|until\s+filled\b|rolling\s+(?:basis|applications?)\b)/i.test(notice))
    fail('NOTICE_PRECISION_UNSUPPORTED');
  if (/\b(?:applications?\s+(?:are\s+)?closed|(?:position|vacancy)\s+(?:is\s+|has\s+been\s+)?filled|no\s+longer\s+accepting\s+applications)\b/i.test(notice))
    fail('NOTICE_NOT_OPEN');
  const published = candidate.sourcePublishedAtRaw;
  if (!InstantSchema.safeParse(now).success || !InstantSchema.safeParse(sourceRetrievedAt).success ||
      typeof published !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(published) ||
      !DateSchema.safeParse(published.slice(0, 10)).success || !Number.isFinite(Date.parse(published)))
    fail('UNDATED_NOTICE_FRESHNESS_REQUIRED');
  const publishedAt = Date.parse(published), retrievedAt = Date.parse(sourceRetrievedAt), current = Date.parse(now);
  const reviewExpiresAt = Math.min(publishedAt + 7 * 86_400_000, retrievedAt + source.automation.checkTtlHours * 3_600_000);
  if (!Number.isFinite(reviewExpiresAt) || publishedAt > retrievedAt || retrievedAt > current || current >= reviewExpiresAt)
    fail('UNDATED_NOTICE_FRESHNESS_REQUIRED');
  return { deadlinePolicy: 'undated_shadow_v1', sourcePublishedAt: new Date(publishedAt).toISOString(),
    sourceRetrievedAt, reviewExpiresAt: new Date(reviewExpiresAt).toISOString(),
    nextCheckAt: new Date(reviewExpiresAt).toISOString(), availability: 'unverified' };
}

function assertApprenticeshipSource(candidate) {
  if (!/\bapprentice(?:ship)?s?\b/i.test(`${candidate.title ?? ''}\n${candidate.sourceText ?? ''}`))
    fail('NOTICE_CATEGORY_REVIEW_REQUIRED');
  // A headline cannot resolve a competing current intake invitation. Background
  // experience and qualifications alone do not establish a conflicting category.
  for (const line of (candidate.sourceText ?? '').split('\n')) {
    const invitations = line.matchAll(/\b(?:join|apply\s+(?:for|to))\s+(?:(?:our|the|an?)\s+)?internship\s+program(?:me)?\b/gi);
    for (const match of invitations) {
      const before = line.slice(0, match.index).split(/[.!?]/).at(-1);
      if (/\b(?:not|never|don't)\s*$/i.test(before) ||
          /\b(?:previously|formerly|last year|previous intake|prior intake)\b/i.test(before) &&
          !/\b(?:now|currently|today|this year|this intake)\b/i.test(before)) continue;
      fail('NOTICE_CATEGORY_CONFLICT');
    }
  }
}

function candidateDeadline(candidate) {
  const dates = candidate.deadlineCandidates.map(c => c.localDate);
  // Repeated wording of the same date is corroboration, not a conflicting deadline.
  if (!dates.length || dates.some(d => !DateSchema.safeParse(d).success) || new Set(dates).size !== 1)
    fail('NOTICE_PRECISION_UNSUPPORTED');
  return dates[0];
}

export function approvedIssuer(source, record) {
  if (record.issuer.state !== 'stated' || record.applicationRoute.state !== 'stated') fail('APPLICATION_UNRESOLVED');
  const matches = approvedRoute(source, record.applicationRoute.value).filter(i => issuerNames(i).includes(nameKey(record.issuer.value)));
  if (matches.length !== 1) fail('ISSUER_RELATIONSHIP_UNQUALIFIED');
  return matches[0];
}

export function assertMaterialFacts(record) {
  // The current extraction/qualification path does not establish normalized stage labels.
  if (record.entryStage?.state === 'stated') fail('ENTRY_STAGE_REVIEW_REQUIRED');
  if (record.category !== 'apprenticeship' || record.title.state !== 'stated' ||
      allFacts(record).some(f => ['ambiguous', 'conflicting'].includes(f.state)) ||
      !record.requirements.requirements.length || JSON.stringify(record.requirements.expression).includes('"unknown"')) fail('MATERIAL_FACTS_UNRESOLVED');
}

export function publicationGate(source, candidate, record, primary, assessment, now) {
  if (candidate.applicationInstructions?.length) fail('NOTICE_APPLICATION_METHOD_REVIEW_REQUIRED');
  if (candidate.issues?.includes('programme_subject_scope_review_required')) fail('NOTICE_PROGRAMME_SCOPE_REVIEW_REQUIRED');
  assertApprenticeshipSource(candidate);
  const issuer = approvedIssuer(source, record);
  if (primary && !issuerNames(issuer).includes(nameKey(primary.issuer))) fail('PRIMARY_ISSUER_MISMATCH');
  assertMaterialFacts(record);
  const deadline = record.deadline.value;
  if (record.deadline.state !== 'stated' || deadline.kind !== 'date' || deadline.localTime || deadline.timezone || deadline.utcInstant ||
      candidateDeadline(candidate) !== deadline.localDate ||
      candidate.applicationCandidates.length !== 1) fail('NOTICE_PRECISION_UNSUPPORTED');
  if (source.automation.employerCrawl && record.applicationRoute.value.method === 'portal' && !primary) fail('PRIMARY_NOTICE_REQUIRED');
  if (primary && (!primary.validThrough || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(primary.validThrough) ||
      !DateSchema.safeParse(primary.validThrough.slice(0, 10)).success || primary.validThrough.slice(0, 10) !== deadline.localDate)) fail('PRIMARY_DEADLINE_UNRESOLVED');
  if (deadline.localDate <= dayInSA(now)) fail('NOTICE_NOT_OPEN');
  if (!assessment.supported || assessment.issues.length) fail('SEMANTIC_VALIDATION_FAILED');
  const deadlineBoundary = Date.parse(`${deadline.localDate}T00:00:00.000+02:00`);
  return { nextCheckAt: new Date(Math.min(Date.parse(now) + source.automation.checkTtlHours * 3_600_000, deadlineBoundary)).toISOString() };
}

/** The undated exception is limited to a private, unapproved single-notice draft. */
export function draftGate(source, candidate, record, primary, assessment, now, sourceRetrievedAt, undatedOrigin) {
  const v2 = usesUndatedV2(source, candidate);
  if (!v2 && (candidate.deadlineCandidates.length || source.automation?.undatedNotices !== 'shadow_recent'))
    return publicationGate(source, candidate, record, primary, assessment, now);
  preflightCandidate(source, candidate, now, sourceRetrievedAt, undatedOrigin);
  const window = v2 ? undatedV2Window(source, candidate, now, sourceRetrievedAt, undatedOrigin)
    : undatedReviewWindow(source, candidate, now, sourceRetrievedAt);
  const issuer = approvedIssuer(source, record);
  assertMaterialFacts(record);
  if (record.deadline.state !== 'not_stated' || record.deadline.value !== null) fail('NOTICE_PRECISION_UNSUPPORTED');
  const originalRoute = candidate.applicationCandidates[0], route = record.applicationRoute.value;
  if (originalRoute.method !== route.method || originalRoute.destination !== route.destination) fail('APPLICATION_UNRESOLVED');
  if (primary && !issuerNames(issuer).includes(nameKey(primary.issuer))) fail('PRIMARY_ISSUER_MISMATCH');
  if (source.automation.employerCrawl && route.method === 'portal' && !primary) fail('PRIMARY_NOTICE_REQUIRED');
  if (primary?.validThrough) fail('PRIMARY_DEADLINE_UNRESOLVED');
  if (!assessment.supported || assessment.issues.length) fail('SEMANTIC_VALIDATION_FAILED');
  return window;
}

/** Read-time safety applies even when the scheduler is down. Legacy human records are unchanged. */
export function enforceAutomaticFreshness(projection, now) {
  if (projection?.kind !== 'opportunity') return projection;
  const o = projection.opportunity, checks = o.checks.filter(c => c.method === 'automatic');
  if (o.lifecycle === 'published' && checks.length && checks.some(c => !c.nextCheckAt || c.nextCheckAt <= now))
    return { kind: 'status', status: { schemaVersion: 1, id: o.id, revision: o.revision, status: 'under_review', application: 'unavailable' } };
  return projection;
}
