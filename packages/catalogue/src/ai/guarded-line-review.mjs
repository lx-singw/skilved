import {createHash} from 'node:crypto';
import {zodToJsonSchema} from 'zod-to-json-schema';
import {DomainError} from '../config.mjs';
import {generateStructured} from './groq.mjs';
import {guardedReviewEvidence} from './guarded-review-policy.mjs';
import {compiledReviewPayloadWithEvidence,decodeCompiledSegments} from './compiled-requirement-review.mjs';
import {lineInventorySchema,projectLineValues,LINE_REVIEW_INSTRUCTION} from './line-requirement-review.mjs';
import {compareReviewedRequirements} from './structured-requirement-review.mjs';
import {requirementValidationPayload} from './requirement-validation.mjs';

export const GUARDED_LINE_REVIEW_VERSION='recentjobs_requirement_review_v6';
export const GUARDED_LINE_INSTRUCTION=LINE_REVIEW_INSTRUCTION+`
Decision order for EACH residual line: applicability first, then kind, then strength, then grouping. Read the full notice before classifying. Apply cues from that line and its bounded list introduction only; a preferred condition never changes adjacent conditions.
A document-list introduction ending with a colon is context. Each listed CV, ID copy, qualification/results copy and reference/submission obligation is independent: start a new condition object for each, never attach them to the introduction or use a continuation across documents. A current instruction to be prepared to undergo selection/medical/placement tests is an applicant obligation, not previous-intake preparation. Delivery and marking instructions are current submission obligations; enquiry contacts alone are context.
Multiple separate qualifications without an explicit relationship retain one entire uncertain scope. Never infer ALL because they appear in Minimum Requirements. Explicit complete alternatives and a qualification with embedded subjects remain intact. Do not echo code-owned uncertain lists or documents.
Kind comes from what the statement asks about: recently qualified with limited/no work experience concerns experience, willing/able to travel concerns availability, interests/communication/reliability/teamwork concern other. A qualification in an adjacent line never turns an experience preference into education.
Strength is local. 'Ideally' and 'advantageous but not essential' indicate advantage only for that condition. A plain interest, attitude, communication skill, reliability or teamwork profile has unstated strength; do not infer advantage from a preceding 'ideally' line or mandatory from a Minimum Requirements heading alone. A direct willingness/ability-to-travel condition in current requirements is mandatory availability. 'Must be prepared to undergo' is mandatory, distinct from advice to prepare for a previous intake.
Recruitment questions and statements that the opportunity is suitable for a profile are context when they explain the pitch rather than state a separate selection gate. Repetition is not by itself permission to discard a condition: keep explicit independent obligations outside the main section.
Before returning JSON verify every required key, each condition's own kind/strength, document independence, all code-owned exclusions, and every unresolved scope. Do not output this checklist or explanations.
`;
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function guardedLinePayload(candidate) {
  const payload=compiledReviewPayloadWithEvidence(candidate,guardedReviewEvidence(candidate));
  return {...payload,requiredOutputKeys:Object.values(payload.remainingSegments).flatMap(([first,last])=>
    Array.from({length:last-first+1},(_,index)=>`L${first+index}`))};
}
export function guardedLineContract(candidate) {
  return {version:GUARDED_LINE_REVIEW_VERSION,thinking:'low',outputMode:'json_object',instruction:GUARDED_LINE_INSTRUCTION,
    schema:zodToJsonSchema(lineInventorySchema(guardedLinePayload(candidate)),{$refStrategy:'root'})};
}
const binding=candidate=>({sourceSha256:hash(guardedLinePayload(candidate)),contractSha256:hash(guardedLineContract(candidate))});
export function bindGuardedInventory(candidate,inventory,provenance=null) {
  return {version:GUARDED_LINE_REVIEW_VERSION,...binding(candidate),inventory,provenance};
}
function projection(candidate,review) {
  const expected=binding(candidate);
  if(review?.version!==GUARDED_LINE_REVIEW_VERSION||review.sourceSha256!==expected.sourceSha256||review.contractSha256!==expected.contractSha256)
    throw new DomainError('AI_REVIEW_BINDING_MISMATCH');
  return projectLineValues(guardedLinePayload(candidate),review.inventory);
}
export function decodeGuardedInventory(candidate,review) {
  return decodeCompiledSegments(candidate,projection(candidate,review),guardedReviewEvidence(candidate));
}
export function compareGuardedInventory({candidate,requirements,review}) {
  const inventory=projection(candidate,review),expected=decodeCompiledSegments(candidate,inventory,guardedReviewEvidence(candidate));
  const result=compareReviewedRequirements(candidate,requirements,expected,GUARDED_LINE_REVIEW_VERSION,review.provenance),payload=guardedLinePayload(candidate);
  return {...result,ownership:{codePassages:payload.fixedPassages.length,modelLines:payload.requiredOutputKeys.length,
    modelPassages:Object.values(inventory.segments).reduce((sum,rows)=>sum+rows.length,0)}};
}
export async function reviewGuardedSource(candidate,options={}) {
  const payload=guardedLinePayload(candidate),contract=guardedLineContract(candidate);
  const response=payload.requiredOutputKeys.length?await generateStructured(payload,contract,
    {...options,env:{...(options.env??process.env),SKILVED_AI_THINKING:contract.thinking}}):null;
  const review=bindGuardedInventory(candidate,response?.extraction??{lines:{}},response?.provenance??null);
  try{decodeGuardedInventory(candidate,review);return review;}catch(error){error.usage=review.provenance?.usage??null;throw error;}
}
export async function reviewGuardedRequirements({candidate,requirements},options={}) {
  requirementValidationPayload(candidate,requirements);
  const review=options.review??await reviewGuardedSource(candidate,options);
  return {qualification:false,review,assessment:compareGuardedInventory({candidate,requirements,review})};
}
