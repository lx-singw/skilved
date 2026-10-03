import {createHash} from 'node:crypto';
import {zodToJsonSchema} from 'zod-to-json-schema';
import {DomainError} from '../config.mjs';
import {generateStructured} from './gemini.mjs';
import {groqSchema} from './groq.mjs';
import {submissionLinePayload,submissionLineContract,submissionReviewEvidence} from './submission-line-review.mjs';
import {anchoredInventorySchema} from './anchored-line-review.mjs';
import {decodeMixedValues} from './mixed-line-review.mjs';
import {compareReviewedRequirements} from './structured-requirement-review.mjs';

// Development experiment: same V13 source policy and literal system prompt,
// with the existing local wire constraints also sent to Gemini out of band.
export const NATIVE_LINE_REVIEW_VERSION='recentjobs_requirement_review_v14';
export const nativeLinePayload=submissionLinePayload;
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail=code=>{throw new DomainError(code);};
const thinkingOf=value=>{if(!['low','medium'].includes(value))fail('AI_INVALID_REVIEW_THINKING');return value;};
export function nativeLineContract(candidate,{thinking='low'}={}) {
  const previous=submissionLineContract(candidate,{thinking});
  // Share repeated primitive schemas; retain unions and numeric bounds.
  // $schema is dialect metadata, not an output constraint.
  const {$schema,...schema}=zodToJsonSchema(anchoredInventorySchema(nativeLinePayload(candidate)),{$refStrategy:'root'});
  return {...previous,version:NATIVE_LINE_REVIEW_VERSION,outputMode:'json_schema',schema,
    instruction:previous.instruction+'\nReturn valid JSON matching this schema. All required keys must be present:\n'+JSON.stringify(groqSchema(previous.schema))};
}
const binding=(candidate,thinking)=>({sourceSha256:hash(nativeLinePayload(candidate)),contractSha256:hash(nativeLineContract(candidate,{thinking}))});
export function bindNativeInventory(candidate,inventory,provenance=null,{thinking='low'}={}) {
  return {version:NATIVE_LINE_REVIEW_VERSION,thinking:thinkingOf(thinking),...binding(candidate,thinking),inventory,provenance};
}
export function decodeNativeInventory(candidate,review) {
  if(review?.version!==NATIVE_LINE_REVIEW_VERSION)fail('AI_REVIEW_BINDING_MISMATCH');
  const expected=binding(candidate,thinkingOf(review.thinking));
  if(review.sourceSha256!==expected.sourceSha256||review.contractSha256!==expected.contractSha256)fail('AI_REVIEW_BINDING_MISMATCH');
  return decodeMixedValues(candidate,nativeLinePayload(candidate),review.inventory,submissionReviewEvidence(candidate));
}
export function compareNativeInventory({candidate,requirements,review}) {
  return compareReviewedRequirements(candidate,requirements,decodeNativeInventory(candidate,review),NATIVE_LINE_REVIEW_VERSION,review.provenance);
}
export async function reviewNativeSource(candidate,options={}) {
  const contract=nativeLineContract(candidate,{thinking:options.thinking??'low'});
  const response=await generateStructured(nativeLinePayload(candidate),contract,{...options,
    env:{...(options.env??process.env),SKILVED_AI_THINKING:contract.thinking},maxOutputTokens:3072});
  const review=bindNativeInventory(candidate,response.extraction,response.provenance,{thinking:contract.thinking});
  try{decodeNativeInventory(candidate,review);return review;}catch(error){error.usage=review.provenance?.usage??null;throw error;}
}
