import { DateSchema } from '@skilved/types/opportunities';
import { DomainError } from './config.mjs';

export const RECENTJOBS_INDEX = 'https://recentjobs.co.za/category/apprenticeships/';
export const dayInSA = now => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg',
  year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
export const allFacts = o => [o.title, o.issuer, o.summary, o.intake, ...o.organisations, o.location,
  o.residence, o.experience, o.deadline, ...o.compensation, o.practicalConditions, o.applicationRoute,
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
export function preflightCandidate(source, candidate, now) {
  if (candidate.applicationInstructions?.length) fail('NOTICE_APPLICATION_METHOD_REVIEW_REQUIRED');
  if (candidate.issues?.includes('programme_subject_scope_review_required')) fail('NOTICE_PROGRAMME_SCOPE_REVIEW_REQUIRED');
  if (candidate.applicationCandidates.length !== 1) fail('NOTICE_PRECISION_UNSUPPORTED');
  const deadline = candidateDeadline(candidate);
  if (deadline <= dayInSA(now)) fail('NOTICE_NOT_OPEN');
  const route = candidate.applicationCandidates[0];
  approvedRoute(source, route);
  return route;
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
  if (record.category !== 'apprenticeship' || record.title.state !== 'stated' ||
      allFacts(record).some(f => ['ambiguous', 'conflicting'].includes(f.state)) ||
      !record.requirements.requirements.length || JSON.stringify(record.requirements.expression).includes('"unknown"')) fail('MATERIAL_FACTS_UNRESOLVED');
}

export function publicationGate(source, candidate, record, primary, assessment, now) {
  if (candidate.applicationInstructions?.length) fail('NOTICE_APPLICATION_METHOD_REVIEW_REQUIRED');
  if (candidate.issues?.includes('programme_subject_scope_review_required')) fail('NOTICE_PROGRAMME_SCOPE_REVIEW_REQUIRED');
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

/** Read-time safety applies even when the scheduler is down. Legacy human records are unchanged. */
export function enforceAutomaticFreshness(projection, now) {
  if (projection?.kind !== 'opportunity') return projection;
  const o = projection.opportunity, checks = o.checks.filter(c => c.method === 'automatic');
  if (o.lifecycle === 'published' && checks.length && checks.some(c => !c.nextCheckAt || c.nextCheckAt <= now))
    return { kind: 'status', status: { schemaVersion: 1, id: o.id, revision: o.revision, status: 'under_review', application: 'unavailable' } };
  return projection;
}
