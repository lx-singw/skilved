import {createHash} from 'node:crypto';
import {zodToJsonSchema} from 'zod-to-json-schema';
import {DomainError} from '../config.mjs';
import {generateStructured} from './groq.mjs';
import {localReviewEvidence} from './local-review-policy.mjs';
import {compiledReviewPayloadWithEvidence,decodeCompiledSegments} from './compiled-requirement-review.mjs';
import {lineInventorySchema,projectLineValues,LINE_REVIEW_INSTRUCTION} from './line-requirement-review.mjs';
import {compareReviewedRequirements} from './structured-requirement-review.mjs';
import {requirementValidationPayload} from './requirement-validation.mjs';

export const LOCAL_LINE_REVIEW_VERSION='recentjobs_requirement_review_v7';
export const LOCAL_LINE_INSTRUCTION=LINE_REVIEW_INSTRUCTION+`
Decision order for EACH residual line: applicability first, then kind, then strength, then grouping. Read the full notice before classifying. Apply cues from that line and its bounded list introduction only; a preferred condition never changes adjacent conditions.
A document-list introduction ending with a colon is context. Each listed CV, ID copy, qualification/results copy and reference/submission obligation is independent: start a new condition object for each, never attach them to the introduction or use a continuation across documents. A current instruction to be prepared to undergo selection/medical/placement tests is an applicant obligation, not previous-intake preparation. Delivery and marking instructions are current submission obligations; enquiry contacts alone are context.
Code-owned uncertain qualification lists retain their full scope. Do not invent ALL/ANY for other genuinely unresolved qualification relationships. A bounded current ideal profile introduced with should have/has supplies current conditions: unspecified required/preferred strength remains unstated, not uncertain applicability. Honour those typed hints; do not mark them unknown simply because their strength is unstated. Explicit complete alternatives and a qualification with embedded subjects remain intact. Do not echo code-owned uncertain lists or documents.
Kind comes from what the statement asks about: recently qualified with limited/no work experience concerns experience, willing/able to travel concerns availability, interests/communication/reliability/teamwork concern other. A qualification in an adjacent line never turns an experience preference into education.
Strength is local. 'Ideally' and 'advantageous but not essential' indicate advantage only for that condition. A plain interest, attitude, communication skill, reliability or teamwork profile has unstated strength; do not infer advantage from a preceding 'ideally' line or mandatory from a Minimum Requirements heading alone. A direct willingness/ability-to-travel condition in current requirements is mandatory availability. 'Must be prepared to undergo' is mandatory, distinct from advice to prepare for a previous intake.
Recruitment questions and statements that the opportunity is suitable for a profile are context when they explain the pitch rather than state a separate selection gate. Repetition is not by itself permission to discard a condition: keep explicit independent obligations outside the main section.
A held driving licence is other; an obligation to submit a licence copy is document. Do not infer submission from the word licence alone. Standalone placement/no-guarantee disclaimers are context, never continuations of a preceding selection-test obligation. Code-owned single-line conditions cannot be extended.\nBefore returning JSON verify every required key, each condition's own kind/strength, document independence, all code-owned exclusions, and every unresolved scope. Do not output this checklist or explanations.
`;
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function localLinePayload(candidate) {
  const payload=compiledReviewPayloadWithEvidence(candidate,localReviewEvidence(candidate));
  return {...payload,requiredOutputKeys:Object.values(payload.remainingSegments).flatMap(([first,last])=>
    Array.from({length:last-first+1},(_,index)=>`L${first+index}`))};
}
export function localLineContract(candidate) {
  return {version:LOCAL_LINE_REVIEW_VERSION,thinking:'low',outputMode:'json_object',instruction:LOCAL_LINE_INSTRUCTION,
    schema:zodToJsonSchema(lineInventorySchema(localLinePayload(candidate)),{$refStrategy:'root'})};
}
const binding=candidate=>({sourceSha256:hash(localLinePayload(candidate)),contractSha256:hash(localLineContract(candidate))});
export function bindLocalInventory(candidate,inventory,provenance=null) {
  return {version:LOCAL_LINE_REVIEW_VERSION,...binding(candidate),inventory,provenance};
}
function projection(candidate,review) {
  const expected=binding(candidate);
  if(review?.version!==LOCAL_LINE_REVIEW_VERSION||review.sourceSha256!==expected.sourceSha256||review.contractSha256!==expected.contractSha256)
    throw new DomainError('AI_REVIEW_BINDING_MISMATCH');
  return projectLineValues(localLinePayload(candidate),review.inventory);
}
export function decodeLocalInventory(candidate,review) {
  return decodeCompiledSegments(candidate,projection(candidate,review),localReviewEvidence(candidate));
}
export function compareLocalInventory({candidate,requirements,review}) {
  const inventory=projection(candidate,review),expected=decodeCompiledSegments(candidate,inventory,localReviewEvidence(candidate));
  const result=compareReviewedRequirements(candidate,requirements,expected,LOCAL_LINE_REVIEW_VERSION,review.provenance),payload=localLinePayload(candidate);
  return {...result,ownership:{codePassages:payload.fixedPassages.length,modelLines:payload.requiredOutputKeys.length,
    modelPassages:Object.values(inventory.segments).reduce((sum,rows)=>sum+rows.length,0)}};
}
export async function reviewLocalSource(candidate,options={}) {
  const payload=localLinePayload(candidate),contract=localLineContract(candidate);
  const response=payload.requiredOutputKeys.length?await generateStructured(payload,contract,
    {...options,env:{...(options.env??process.env),SKILVED_AI_THINKING:contract.thinking}}):null;
  const review=bindLocalInventory(candidate,response?.extraction??{lines:{}},response?.provenance??null);
  try{decodeLocalInventory(candidate,review);return review;}catch(error){error.usage=review.provenance?.usage??null;throw error;}
}
export async function reviewLocalRequirements({candidate,requirements},options={}) {
  requirementValidationPayload(candidate,requirements);
  const review=options.review??await reviewLocalSource(candidate,options);
  return {qualification:false,review,assessment:compareLocalInventory({candidate,requirements,review})};
}
