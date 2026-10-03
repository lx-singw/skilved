import {createHash} from 'node:crypto';
import {zodToJsonSchema} from 'zod-to-json-schema';
import {DomainError} from '../config.mjs';
import {generateStructured} from './groq.mjs';
import {profileReviewEvidence} from './profile-review-policy.mjs';
import {COMPLETE_LINE_INSTRUCTION,completeLineContract,completeLinePayloadWithEvidence,projectCompleteValues,decodeCompleteValues} from './complete-line-review.mjs';
import {anchoredInventorySchema} from './anchored-line-review.mjs';
import {compareReviewedRequirements} from './structured-requirement-review.mjs';
import {requirementValidationPayload} from './requirement-validation.mjs';

export const PROFILE_LINE_REVIEW_VERSION='recentjobs_requirement_review_v11';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const thinkingOf=value=>{if(!['low','medium'].includes(value))throw new DomainError('AI_INVALID_REVIEW_THINKING');return value;};
export const profileLinePayload=candidate=>completeLinePayloadWithEvidence(candidate,profileReviewEvidence(candidate));
export function profileLineContract(candidate,{thinking='low'}={}) {
  return {version:PROFILE_LINE_REVIEW_VERSION,thinking:thinkingOf(thinking),outputMode:'json_object',instruction:COMPLETE_LINE_INSTRUCTION,
    schema:completeLineContract(candidate).schema,localSchemaSha256:hash(zodToJsonSchema(anchoredInventorySchema(profileLinePayload(candidate)),{$refStrategy:'root'}))};
}
const binding=(candidate,thinking)=>({sourceSha256:hash(profileLinePayload(candidate)),contractSha256:hash(profileLineContract(candidate,{thinking}))});
export function bindProfileInventory(candidate,inventory,provenance=null,{thinking='low'}={}) {
  return {version:PROFILE_LINE_REVIEW_VERSION,thinking:thinkingOf(thinking),...binding(candidate,thinking),inventory,provenance};
}
export function decodeProfileInventory(candidate,review) {
  if(review?.version!==PROFILE_LINE_REVIEW_VERSION)throw new DomainError('AI_REVIEW_BINDING_MISMATCH');
  const expected=binding(candidate,thinkingOf(review.thinking));
  if(review.sourceSha256!==expected.sourceSha256||review.contractSha256!==expected.contractSha256)throw new DomainError('AI_REVIEW_BINDING_MISMATCH');
  return decodeCompleteValues(candidate,projectCompleteValues(profileLinePayload(candidate),review.inventory),profileReviewEvidence(candidate));
}
export function compareProfileInventory({candidate,requirements,review}) {
  const result=compareReviewedRequirements(candidate,requirements,decodeProfileInventory(candidate,review),PROFILE_LINE_REVIEW_VERSION,review.provenance);
  const payload=profileLinePayload(candidate);
  return {...result,ownership:{sourceConstraints:payload.sourceConstraints.length,modelLines:payload.lineCount}};
}
export async function reviewProfileSource(candidate,options={}) {
  const contract=profileLineContract(candidate,{thinking:options.thinking??'low'});
  const response=await generateStructured(profileLinePayload(candidate),contract,{...options,env:{...(options.env??process.env),SKILVED_AI_THINKING:contract.thinking}});
  const review=bindProfileInventory(candidate,response.extraction,response.provenance,{thinking:contract.thinking});
  try{decodeProfileInventory(candidate,review);return review;}catch(error){error.usage=review.provenance?.usage??null;throw error;}
}
export async function reviewProfileRequirements({candidate,requirements},options={}) {
  requirementValidationPayload(candidate,requirements);
  if(options.review&&options.review.thinking!==(options.thinking??'low'))throw new DomainError('AI_REVIEW_BINDING_MISMATCH');
  const review=options.review??await reviewProfileSource(candidate,options);
  return {qualification:false,review,assessment:compareProfileInventory({candidate,requirements,review})};
}
