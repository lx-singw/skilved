import {createHash} from 'node:crypto';
import {zodToJsonSchema} from 'zod-to-json-schema';
import {DomainError} from '../config.mjs';
import {generateStructured} from './groq.mjs';
import {mixedReviewEvidence} from './mixed-review-policy.mjs';
import {COMPLETE_LINE_INSTRUCTION,completeLineContract,completeLinePayloadWithEvidence,projectCompleteValues,decodeCompleteValues} from './complete-line-review.mjs';
import {anchoredInventorySchema} from './anchored-line-review.mjs';
import {compareReviewedRequirements} from './structured-requirement-review.mjs';
import {requirementValidationPayload} from './requirement-validation.mjs';

export const MIXED_LINE_REVIEW_VERSION='recentjobs_requirement_review_v12';
export const MIXED_LINE_INSTRUCTION=COMPLETE_LINE_INSTRUCTION.replace(
  'Review EVERY numbered line of the entire notice blind to extracted claims.',
  'Review the entire numbered notice blind to extracted claims. Code compiles compiledQualificationGroups BEFORE your call: their complete education branches and explicit OR relationship are source-owned. Read them for context, but never return their lines or use them as continuation/alternative anchors. Return every requiredOutputKeys key for the remaining source lines. All other sourceConstraints must still appear in your answer.').replace(
  'This includes ALL sourceConstraints lines, titles, headings, metadata, blank lines and application labels.',
  'Include all sourceConstraints and all remaining titles, headings, metadata, blank lines and application labels. Omit compiledQualificationGroups branch lines, which code already owns.')+
  '\ncompiledQualificationGroups lines are the ONLY exception to full source-key output. Those keys are absent from requiredOutputKeys and remainingSegments. Do not duplicate them or cross their boundaries. Current submission instructions restart applicant evidence after future programme text. Age/youth preferences, prior experience and shift/overtime availability require their own supported schema kind, not automatic other typing.';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail=code=>{throw new DomainError(code);};
const thinkingOf=value=>{if(!['low','medium'].includes(value))fail('AI_INVALID_REVIEW_THINKING');return value;};
export function mixedLinePayload(candidate) {
  return mixedLinePayloadWithEvidence(candidate,mixedReviewEvidence(candidate));
}
export function mixedLinePayloadWithEvidence(candidate,evidence) {
  const base=completeLinePayloadWithEvidence(candidate,evidence);
  const compiledQualificationGroups=evidence.compiledQualificationGroups.map(group=>({kind:'education',strength:'mandatory',spans:group.spans}));
  if(compiledQualificationGroups.length>18)fail('AI_INPUT_LIMIT');
  const covered=new Set(compiledQualificationGroups.flatMap(group=>group.spans.flatMap(([first,last])=>Array.from({length:last-first+1},(_,i)=>first+i))));
  const remainingSegments={};let first=null;
  for(let line=1;line<=base.lineCount+1;line++){
    if(line<=base.lineCount&&!covered.has(line)){first??=line;continue;}
    if(first!==null){remainingSegments[`s_${first}_${line-1}`]=[first,line-1];first=null;}
  }
  return {...base,compiledQualificationGroups,remainingSegments,requiredOutputKeys:base.requiredOutputKeys.filter(key=>!covered.has(Number(key.slice(1)))),
    requiredLineNumbers:base.requiredLineNumbers.filter(line=>!covered.has(line)),
    alternativeGroups:base.alternativeGroups.filter(group=>!group.spans.some(([start])=>covered.has(start)))};
}
export function mixedLineContract(candidate,{thinking='low'}={}) {
  return {version:MIXED_LINE_REVIEW_VERSION,thinking:thinkingOf(thinking),outputMode:'json_object',instruction:MIXED_LINE_INSTRUCTION,
    schema:completeLineContract({title:'Fictional apprenticeship',sourceText:'Requirements\nGrade 12\nHow to apply'}).schema,
    localSchemaSha256:hash(zodToJsonSchema(anchoredInventorySchema(mixedLinePayload(candidate)),{$refStrategy:'root'}))};
}
const binding=(candidate,thinking)=>({sourceSha256:hash(mixedLinePayload(candidate)),contractSha256:hash(mixedLineContract(candidate,{thinking}))});
export function bindMixedInventory(candidate,inventory,provenance=null,{thinking='low'}={}) {
  return {version:MIXED_LINE_REVIEW_VERSION,thinking:thinkingOf(thinking),...binding(candidate,thinking),inventory,provenance};
}
export function decodeMixedInventory(candidate,review) {
  if(review?.version!==MIXED_LINE_REVIEW_VERSION)fail('AI_REVIEW_BINDING_MISMATCH');
  const expected=binding(candidate,thinkingOf(review.thinking));
  if(review.sourceSha256!==expected.sourceSha256||review.contractSha256!==expected.contractSha256)fail('AI_REVIEW_BINDING_MISMATCH');
  return decodeMixedValues(candidate,mixedLinePayload(candidate),review.inventory,mixedReviewEvidence(candidate));
}
export function decodeMixedValues(candidate,payload,inventory,evidence) {
  const projected=projectCompleteValues(payload,inventory),count=payload.compiledQualificationGroups.length;
  const modelRows=Object.values(projected.segments).flat(),groups=new Set(modelRows.filter(row=>row.applicability==='current'&&row.relation==='any').map(row=>row.group));
  if(count+groups.size>18)fail('AI_INPUT_LIMIT');
  const remapped=new Map([...groups].sort((a,b)=>a-b).map((group,index)=>[group,count+index+1]));
  const rows=modelRows.map(row=>row.applicability==='current'&&row.relation==='any'?{...row,group:remapped.get(row.group)}:row);
  payload.compiledQualificationGroups.forEach((group,index)=>group.spans.forEach(span=>rows.push({span,applicability:'current',kind:group.kind,strength:group.strength,group:index+1,relation:'any'})));
  rows.sort((a,b)=>a.span[0]-b.span[0]);
  return decodeCompleteValues(candidate,{segments:{all:rows}},evidence);
}
export function compareMixedInventory({candidate,requirements,review}) {
  const result=compareReviewedRequirements(candidate,requirements,decodeMixedInventory(candidate,review),MIXED_LINE_REVIEW_VERSION,review.provenance),payload=mixedLinePayload(candidate);
  return {...result,ownership:{compiledQualificationBranches:payload.compiledQualificationGroups.reduce((sum,group)=>sum+group.spans.length,0),sourceConstraints:payload.sourceConstraints.length,modelLines:payload.requiredOutputKeys.length}};
}
export async function reviewMixedSource(candidate,options={}) {
  const contract=mixedLineContract(candidate,{thinking:options.thinking??'low'});
  const response=await generateStructured(mixedLinePayload(candidate),contract,{...options,env:{...(options.env??process.env),SKILVED_AI_THINKING:contract.thinking}});
  const review=bindMixedInventory(candidate,response.extraction,response.provenance,{thinking:contract.thinking});
  try{decodeMixedInventory(candidate,review);return review;}catch(error){error.usage=review.provenance?.usage??null;throw error;}
}
export async function reviewMixedRequirements({candidate,requirements},options={}) {
  requirementValidationPayload(candidate,requirements);
  if(options.review&&options.review.thinking!==(options.thinking??'low'))fail('AI_REVIEW_BINDING_MISMATCH');
  const review=options.review??await reviewMixedSource(candidate,options);
  return {qualification:false,review,assessment:compareMixedInventory({candidate,requirements,review})};
}
