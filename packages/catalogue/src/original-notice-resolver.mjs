import { DateSchema, InstantSchema } from '@skilved/types/opportunities';
import { isDeepStrictEqual } from 'node:util';
import { inspectPrimaryJobPosting } from './adapters/primary-jobposting.mjs';
import { approvedRoute, dayInSA } from './worker-policy.mjs';
import { noticeMetadataPolicy } from './ai/notice-metadata.mjs';
import { DomainError } from './config.mjs';
import { parseOriginalDeadline } from './original-deadline.mjs';
import {validRecruitingMarketingBinding} from './adapters/recruiting-marketing-binding.mjs';

export const ORIGINAL_RESOLVER_VERSION = 'original_jobposting_v4';
const nameKey = text => text.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const words = text => text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const platformIdentifier=id=>['rmkid','rmkjobid','rmkspecificid','recruitingmarketingid','recruitingmarketingjobid','recruitingmarketingspecificid']
  .includes((id?.name??'').normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g,''));
const outcome = (state, reason, extra = {}) => ({ version: ORIGINAL_RESOLVER_VERSION,
  outcome: state, reason, adapter: null, checks: [], identity: null, ...extra });

/** Fixed outcomes, never an AI assertion or permission to fetch an arbitrary URL. */
export function originalNoticeTarget(source, candidate) {
  if (candidate.applicationCandidates.length !== 1) return outcome('unsupported', 'METHOD_AMBIGUOUS');
  const route = candidate.applicationCandidates[0];
  if (route.method !== 'portal') return outcome('unsupported', 'METHOD_UNSUPPORTED');
  try { approvedRoute(source, route); }
  catch (error) {
    if (['ISSUER_RELATIONSHIP_UNQUALIFIED','APPLICATION_UNRESOLVED'].includes(error.code))
      return outcome('unsupported', 'ORIGIN_UNQUALIFIED');
    throw error;
  }
  if (!source.automation.employerCrawl) return outcome('unsupported', 'ACQUISITION_DISABLED');
  return { url: route.destination };
}

/** Retrieval failure is not evidence of closure. Authorization/configuration errors propagate. */
export function originalRetrievalFailure(error) {
  const code = error.code;
  if (['ROBOTS_DISALLOWED','ROBOTS_DELAY_EXCEEDS_POLICY'].includes(code)) return outcome('unavailable', 'ROBOTS_RESTRICTED');
  if (['UNSAFE_URL','UNSAFE_ADDRESS','UNSAFE_REDIRECT','UNSAFE_RESPONSE','TOO_MANY_REDIRECTS',
    'ERR_TLS_CERT_ALTNAME_INVALID','CERT_HAS_EXPIRED','UNABLE_TO_VERIFY_LEAF_SIGNATURE','DEPTH_ZERO_SELF_SIGNED_CERT'].includes(code))
    return outcome('unavailable', 'ACQUISITION_RESTRICTED');
  if (['FETCH_TIMEOUT','UNSUPPORTED_RESPONSE','BODY_TOO_LARGE','EAI_AGAIN','ENOTFOUND','ECONNREFUSED',
    'ENETUNREACH','EHOSTUNREACH','ECONNRESET','ETIMEDOUT','ABORT_ERR'].includes(code))
    return outcome('unavailable', 'RETRIEVAL_FAILED');
  return null;
}

function boundUrl(input, target) {
  if (typeof input !== 'string' || !input || input.length > 2048) return false;
  try {
    const url = new URL(input, target);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.hash && url.href === target;
  } catch { return false; }
}

function deadline(value, now) {
  const evidence = parseOriginalDeadline(value); if (!evidence) return null;
  return { evidence, date: evidence.localDate,
    elapsed: evidence.instant === null ? evidence.localDate < dayInSA(now) : Date.parse(evidence.instant) <= Date.parse(now),
    closingDay: evidence.instant === null && evidence.localDate === dayInSA(now) };
}

/** Corroborates an exact linked portal notice under existing issuer trust.
 * Does not discover a corporate domain, authorize a new tenant, or approve publication.
 */
export function resolveOriginalNotice({ source, candidate, observation, now }) {
  if (!InstantSchema.safeParse(now).success) throw new DomainError('ORIGINAL_RESOLUTION_INPUT_INVALID');
  const target = originalNoticeTarget(source, candidate);
  if (target.outcome) return target;
  if (observation?.url !== target.url || typeof observation.text !== 'string') return outcome('unavailable', 'EVIDENCE_MISSING');
  let inspected;
  try { inspected = inspectPrimaryJobPosting(observation.text); }
  catch (error) {
    if (error.code === 'PRIMARY_NOTICE_UNSUPPORTED') return outcome('unsupported', 'LAYOUT_UNSUPPORTED');
    throw error;
  }
  const { primary, adapter, itemId, mainEntityLinkedUrl, postingUrl, canonicalUrl, mainEntityUrl, identifier, descriptionText, actionBinding } = inspected;
  const basis = { adapter, checks: [], identity: { url: target.url,
    issuer: primary.issuer, title: primary.title, identifier: identifier?.value ?? null, validThrough: primary.validThrough } };
  const result = (state, reason) => outcome(state, reason, basis);
  // Every supplied binding must agree. A canonical alone does not bind embedded
  // JobPosting data; it needs the posting URL/mainEntity or a corroborated reference too.
  const bindings = [postingUrl, canonicalUrl, mainEntityUrl, itemId, mainEntityLinkedUrl].filter(v => v !== null);
  if (bindings.some(url => !boundUrl(url, target.url))) return result('conflicting', 'VACANCY_URL_CONFLICT');
  if(actionBinding?.outcome==='conflicting')return result('conflicting','VACANCY_ACTION_CONFLICT');
  if(actionBinding?.outcome==='unsupported')return result('unsupported','VACANCY_ACTION_UNSUPPORTED');
  const issuers = approvedRoute(source, candidate.applicationCandidates[0]).filter(issuer =>
    [issuer.name, ...(issuer.aliases ?? [])].map(nameKey).includes(nameKey(primary.issuer)));
  if (issuers.length !== 1) return result('conflicting', 'ISSUER_CONFLICT');
  basis.checks.push('issuer');
  if (!words(primary.title) || !` ${words(`${candidate.title}\n${candidate.sourceText}`)} `.includes(` ${words(primary.title)} `))
    return result('conflicting', 'TITLE_CONFLICT');
  basis.checks.push('title');
  const sourceRefs = [...new Set(noticeMetadataPolicy(candidate).references.map(r => r.value))];
  const primaryRefs = [...new Set(noticeMetadataPolicy({ title: primary.title, sourceText: descriptionText }).references.map(r => r.value))];
  if (sourceRefs.length > 1 || primaryRefs.length > 1) return result('unsupported', 'REFERENCE_AMBIGUOUS');
  if (sourceRefs.length) {
    if (primaryRefs.length && primaryRefs[0] !== sourceRefs[0]) return result('conflicting', 'REFERENCE_CONFLICT');
    if (!primaryRefs.length && (identifier?.value !== sourceRefs[0] || platformIdentifier(identifier))) {
      // An ATS URL/RMK ID and a recruitment reference can be different namespaces.
      // A mismatching opaque identifier cannot be relabelled as the employer reference.
      return result('unsupported', 'REFERENCE_UNCORROBORATED');
    }
    basis.checks.push('reference');
  }
  if(postingUrl!==null||mainEntityUrl!==null)basis.vacancyBinding={kind:'structured_url'};
  else if(canonicalUrl!==null&&sourceRefs.length&&basis.checks.includes('reference'))basis.vacancyBinding={kind:'canonical_reference'};
  else if(actionBinding?.outcome==='supported'&&validRecruitingMarketingBinding(actionBinding.binding,target.url))basis.vacancyBinding={kind:'rmk_apply_action',evidence:actionBinding.binding};
  else return result('unsupported', 'VACANCY_BINDING_MISSING');
  basis.checks.push('vacancy_url');
  const expiry = deadline(primary.validThrough, now);
  if (!expiry) return result('unsupported', 'DEADLINE_UNRESOLVED');
  basis.deadlineEvidence = expiry.evidence;
  // Classify closure only after matching this vacancy's identity, not a different
  // expired advert, transport failure, generic careers page or robots denial.
  if (expiry.elapsed) return result('closed', 'ORIGINAL_DEADLINE_ELAPSED');
  const sourceDates = [...new Set(candidate.deadlineCandidates.map(d => d.localDate))];
  if (sourceDates.length !== 1 || !DateSchema.safeParse(sourceDates[0]).success) return result('unsupported', 'SOURCE_DEADLINE_UNRESOLVED');
  if (expiry.date !== sourceDates[0]) return result('conflicting', 'DEADLINE_CONFLICT');
  if (expiry.closingDay) return result('unsupported', 'CLOSING_DAY_HOLD');
  basis.checks.push('deadline', 'application_method');
  return { ...result('matched', 'EXACT_NOTICE_CORROBORATED'), primary };
}

/** Recheck expiry at commit time without fetching or reinterpreting source evidence. */
export function refreshOriginalResolution(resolution, now) {
  if (!InstantSchema.safeParse(now).success) throw new DomainError('ORIGINAL_RESOLUTION_INPUT_INVALID');
  if (resolution.outcome !== 'matched') return resolution;
  const { primary, ...basis } = resolution;
  if (resolution.version !== ORIGINAL_RESOLVER_VERSION) return { ...basis, outcome: 'unsupported', reason: 'RESOLVER_POLICY_CHANGED' };
  if(!['structured_url','canonical_reference','rmk_apply_action'].includes(resolution.vacancyBinding?.kind)||
    resolution.vacancyBinding.kind==='rmk_apply_action'&&!validRecruitingMarketingBinding(resolution.vacancyBinding.evidence,resolution.identity.url))
    return{...basis,outcome:'unsupported',reason:'VACANCY_BINDING_CHANGED'};
  const expiry = deadline(resolution.identity.validThrough, now);
  if (!expiry) return { ...basis, outcome: 'unsupported', reason: 'DEADLINE_UNRESOLVED' };
  if (!isDeepStrictEqual(expiry.evidence, resolution.deadlineEvidence))
    return { ...basis, outcome: 'unsupported', reason: 'DEADLINE_EVIDENCE_CHANGED' };
  if (expiry.elapsed) return { ...basis, outcome: 'closed', reason: 'ORIGINAL_DEADLINE_ELAPSED' };
  if (expiry.closingDay) return { ...basis, outcome: 'unsupported', reason: 'CLOSING_DAY_HOLD' };
  return resolution;
}
