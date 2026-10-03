import {createHash} from 'node:crypto';
import {zodToJsonSchema} from 'zod-to-json-schema';
import {DomainError} from '../config.mjs';
import {generateStructured} from './gemini.mjs';
import {mixedReviewEvidence} from './mixed-review-policy.mjs';
import {mixedLinePayloadWithEvidence,mixedLineContract,decodeMixedValues,MIXED_LINE_INSTRUCTION} from './mixed-line-review.mjs';
import {anchoredInventorySchema} from './anchored-line-review.mjs';
import {compareReviewedRequirements} from './structured-requirement-review.mjs';

// Development only. Existing worker and V1–V12 contracts keep exact hints.
export const SUBMISSION_LINE_REVIEW_VERSION='recentjobs_requirement_review_v13';
export const SUBMISSION_REVIEW_POLICY_VERSION='entry_applicability_v9';
export const SUBMISSION_LINE_INSTRUCTION=MIXED_LINE_INSTRUCTION.replace(
  'Hinted conditions have exact single-line spans and hinted kind/level (required=mandatory, preferred=advantage, unclear=unstated).',
  'Hinted conditions keep exact single-line spans and hinted kind/level unless spanPolicy is anchor. A strength-only anchor requires a complete current condition STARTING at its line, with the hinted strength; you own its kind and complete ending span. Use continuation integers only for lines belonging to that same obligation. Never merge independent obligations or cross protected passages. required=mandatory, preferred=advantage, unclear=unstated.');
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail=code=>{throw new DomainError(code);};
const thinkingOf=value=>{if(!['low','medium'].includes(value))fail('AI_INVALID_REVIEW_THINKING');return value;};
export function submissionReviewEvidence(candidate) {
  const evidence=mixedReviewEvidence(candidate,{standaloneMustSpanPolicy:'anchor'});
  // A later typed source rule owns an exact span; do not advertise an anchor.
  evidence.evidenceHints=evidence.evidenceHints.map(hint=>{
    if(hint.kind===undefined)return hint;
    const {spanPolicy,...typed}=hint;return typed;
  });
  evidence.reviewPolicy.version=SUBMISSION_REVIEW_POLICY_VERSION;
  return evidence;
}
export const submissionLinePayload=candidate=>mixedLinePayloadWithEvidence(candidate,submissionReviewEvidence(candidate));
export function submissionLineContract(candidate,{thinking='low'}={}) {
  const previous=mixedLineContract(candidate,{thinking});
  return {...previous,version:SUBMISSION_LINE_REVIEW_VERSION,instruction:SUBMISSION_LINE_INSTRUCTION,
    localSchemaSha256:hash(zodToJsonSchema(anchoredInventorySchema(submissionLinePayload(candidate)),{$refStrategy:'root'}))};
}
const binding=(candidate,thinking)=>({sourceSha256:hash(submissionLinePayload(candidate)),contractSha256:hash(submissionLineContract(candidate,{thinking}))});
export function bindSubmissionInventory(candidate,inventory,provenance=null,{thinking='low'}={}) {
  return {version:SUBMISSION_LINE_REVIEW_VERSION,thinking:thinkingOf(thinking),...binding(candidate,thinking),inventory,provenance};
}
export function decodeSubmissionInventory(candidate,review) {
  if(review?.version!==SUBMISSION_LINE_REVIEW_VERSION)fail('AI_REVIEW_BINDING_MISMATCH');
  const expected=binding(candidate,thinkingOf(review.thinking));
  if(review.sourceSha256!==expected.sourceSha256||review.contractSha256!==expected.contractSha256)fail('AI_REVIEW_BINDING_MISMATCH');
  return decodeMixedValues(candidate,submissionLinePayload(candidate),review.inventory,submissionReviewEvidence(candidate));
}
export function compareSubmissionInventory({candidate,requirements,review}) {
  return compareReviewedRequirements(candidate,requirements,decodeSubmissionInventory(candidate,review),SUBMISSION_LINE_REVIEW_VERSION,review.provenance);
}
export async function reviewSubmissionSource(candidate,options={}) {
  const contract=submissionLineContract(candidate,{thinking:options.thinking??'low'});
  const response=await generateStructured(submissionLinePayload(candidate),contract,{...options,
    env:{...(options.env??process.env),SKILVED_AI_THINKING:contract.thinking},maxOutputTokens:3072});
  const review=bindSubmissionInventory(candidate,response.extraction,response.provenance,{thinking:contract.thinking});
  try{decodeSubmissionInventory(candidate,review);return review;}catch(error){error.usage=review.provenance?.usage??null;throw error;}
}
