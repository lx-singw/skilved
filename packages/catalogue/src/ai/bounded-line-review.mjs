import {createHash} from 'node:crypto';
import {zodToJsonSchema} from 'zod-to-json-schema';
import {DomainError} from '../config.mjs';
import {generateStructured} from './groq.mjs';
import {boundedReviewEvidence} from './bounded-review-policy.mjs';
import {compiledReviewPayloadWithEvidence,decodeCompiledSegments} from './compiled-requirement-review.mjs';
import {lineInventorySchema,projectLineValues,LINE_REVIEW_INSTRUCTION} from './line-requirement-review.mjs';
import {compareReviewedRequirements} from './structured-requirement-review.mjs';
import {requirementValidationPayload} from './requirement-validation.mjs';

export const BOUNDED_LINE_REVIEW_VERSION='recentjobs_requirement_review_v5';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function boundedLinePayload(candidate) {
  const payload=compiledReviewPayloadWithEvidence(candidate,boundedReviewEvidence(candidate));
  return {...payload,requiredOutputKeys:Object.values(payload.remainingSegments).flatMap(([first,last])=>
    Array.from({length:last-first+1},(_,index)=>`L${first+index}`))};
}
export function boundedLineContract(candidate) {
  return {version:BOUNDED_LINE_REVIEW_VERSION,thinking:'low',outputMode:'json_object',instruction:LINE_REVIEW_INSTRUCTION,
    schema:zodToJsonSchema(lineInventorySchema(boundedLinePayload(candidate)),{$refStrategy:'root'})};
}
const binding=candidate=>({sourceSha256:hash(boundedLinePayload(candidate)),contractSha256:hash(boundedLineContract(candidate))});
export function bindBoundedInventory(candidate,inventory,provenance=null) {
  return {version:BOUNDED_LINE_REVIEW_VERSION,...binding(candidate),inventory,provenance};
}
function projection(candidate,review) {
  const expected=binding(candidate);
  if(review?.version!==BOUNDED_LINE_REVIEW_VERSION||review.sourceSha256!==expected.sourceSha256||review.contractSha256!==expected.contractSha256)
    throw new DomainError('AI_REVIEW_BINDING_MISMATCH');
  return projectLineValues(boundedLinePayload(candidate),review.inventory);
}
export function decodeBoundedInventory(candidate,review) {
  return decodeCompiledSegments(candidate,projection(candidate,review),boundedReviewEvidence(candidate));
}
export function compareBoundedInventory({candidate,requirements,review}) {
  const inventory=projection(candidate,review),expected=decodeCompiledSegments(candidate,inventory,boundedReviewEvidence(candidate));
  const result=compareReviewedRequirements(candidate,requirements,expected,BOUNDED_LINE_REVIEW_VERSION,review.provenance),payload=boundedLinePayload(candidate);
  return {...result,ownership:{codePassages:payload.fixedPassages.length,modelLines:payload.requiredOutputKeys.length,
    modelPassages:Object.values(inventory.segments).reduce((sum,rows)=>sum+rows.length,0)}};
}
export async function reviewBoundedSource(candidate,options={}) {
  const payload=boundedLinePayload(candidate),contract=boundedLineContract(candidate);
  const response=payload.requiredOutputKeys.length?await generateStructured(payload,contract,
    {...options,env:{...(options.env??process.env),SKILVED_AI_THINKING:contract.thinking}}):null;
  const review=bindBoundedInventory(candidate,response?.extraction??{lines:{}},response?.provenance??null);
  try{decodeBoundedInventory(candidate,review);return review;}catch(error){error.usage=review.provenance?.usage??null;throw error;}
}
export async function reviewBoundedRequirements({candidate,requirements},options={}) {
  requirementValidationPayload(candidate,requirements);
  const review=options.review??await reviewBoundedSource(candidate,options);
  return {qualification:false,review,assessment:compareBoundedInventory({candidate,requirements,review})};
}
