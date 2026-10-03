import {createHash} from 'node:crypto';
import {z} from 'zod';
import {zodToJsonSchema} from 'zod-to-json-schema';
import {DomainError} from '../config.mjs';
import {ExtractionSchema} from './extraction.mjs';
import {generateStructured} from './gemini.mjs';
import {submissionLinePayload,submissionLineContract,submissionReviewEvidence,SUBMISSION_LINE_INSTRUCTION} from './submission-line-review.mjs';
import {decodeMixedValues} from './mixed-line-review.mjs';
import {compareReviewedRequirements} from './structured-requirement-review.mjs';

// Development only: a homogeneous native schema, with V13 semantics retained.
export const RECORD_LINE_REVIEW_VERSION='recentjobs_requirement_review_v15';
export const recordLinePayload=submissionLinePayload;
const kinds=ExtractionSchema.shape.requirements.shape.items.element.shape.kind.options;
const nonCurrent=['context','post_selection','employer','promotion','preparation','conditional','uncertain'];
const record=z.object({line:z.number().int().min(1).max(160),role:z.enum(['current',...nonCurrent,'continuation']),
  kind:z.enum([...kinds,'none']),strength:z.enum(['mandatory','advantage','unstated','none']),
  anchor:z.number().int().min(0).max(159),alternative:z.number().int().min(0).max(160)}).strict();
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail=code=>{throw new DomainError(code);};
const thinkingOf=value=>{if(!['low','medium'].includes(value))fail('AI_INVALID_REVIEW_THINKING');return value;};
const paragraphs=SUBMISSION_LINE_INSTRUCTION.split('\n');
paragraphs[0]=paragraphs[0].replace('Return every requiredOutputKeys key for the remaining source lines.','Return one record for every requiredOutputKeys line in the remaining source.');
paragraphs[1]='Return only {"lines":[...]}, with exactly one record per requiredOutputKeys entry, in source order. L8 means line:8. Include sourceConstraints and all remaining titles, headings, metadata, blank lines and application labels. Omit only compiledQualificationGroups branch lines. sourceConstraints are checks on your answer, not lines to omit. Never change, merge or extend protected conditions; keep protected unknown scopes intact. Review every other line too; hints are minima, not the complete inventory.';
paragraphs[2]='Every record has exactly line,role,kind,strength,anchor,alternative. role is current, context, post_selection, employer, promotion, preparation, conditional, uncertain or continuation. For current, use a supported kind and mandatory/advantage/unstated strength; anchor must be 0. For context, post_selection, employer, promotion, preparation, conditional and uncertain, kind and strength must be none, anchor and alternative must be 0. For continuation, kind and strength must be none, alternative must be 0, and anchor must name the FIRST line of the immediately preceding current condition or unknown scope. Never reference another continuation, a future line, a code-owned line, another segment or another condition. Example: a condition starts at line 8; continuation records for lines 9 and 10 both have anchor:8. Independent conditions start separate current records. Headings stay context.';
paragraphs[3]='For current records, alternative:0 means an independent coexisting condition. Complete explicit OR branches all use the FIRST branch starting line as alternative, including that branch itself: current line 8 has alternative:8 and current line 12 is its complete alternative with alternative:8. Keep nested subjects with their branch using continuations. The alternative anchor must be a current record referencing itself, with at least two complete same-strength branches; never anchor context, a continuation or a protected independent condition. One-line alternatives stay verbatim with alternative:0. Unresolved qualification relationships retain their full uncertain scope rather than inventing ALL/ANY.';
export const RECORD_LINE_INSTRUCTION=paragraphs.join('\n')
  .replaceAll('Use continuation integers','Use continuation records')
  .replaceAll('Check all line keys','Check all line records')
  .replaceAll('full source-key output','full source-line output')
  .replaceAll('Those keys are absent','Those lines are absent');
export function recordInventorySchema(payload) {
  return z.object({lines:z.array(record).length(payload.requiredOutputKeys.length)}).strict();
}
export function recordLineContract(candidate,{thinking='low'}={}) {
  const previous=submissionLineContract(candidate,{thinking});
  const {$schema,...localSchema}=zodToJsonSchema(recordInventorySchema(recordLinePayload(candidate)),{$refStrategy:'none'});
  const schema=structuredClone(localSchema);
  // Keep exact coverage local rather than expanding a provider array automaton.
  delete schema.properties.lines.minItems;delete schema.properties.lines.maxItems;
  return {...previous,version:RECORD_LINE_REVIEW_VERSION,outputMode:'json_schema',instruction:RECORD_LINE_INSTRUCTION,schema,
    recordSchemaSha256:hash(schema),localRecordSchemaSha256:hash(localSchema)};
}
export function projectRecordInventory(payload,inventory) {
  let data;
  try{if(Buffer.byteLength(JSON.stringify(inventory))>96000)fail('AI_OUTPUT_LIMIT');data=recordInventorySchema(payload).parse(inventory);}
  catch(error){if(error instanceof DomainError)throw error;fail('AI_INVALID_REVIEW_INVENTORY');}
  const required=new Set(payload.requiredOutputKeys),lines={};
  for(const row of data.lines) {
    const key=`L${row.line}`;
    if(!required.has(key)||Object.hasOwn(lines,key))fail('AI_REVIEW_LINE_COVERAGE');
    if(row.role==='current') {
      if(row.kind==='none'||row.strength==='none'||row.anchor!==0)fail('AI_REVIEW_RECORD_ROLE_CONFLICT');
      lines[key]={kind:row.kind,strength:row.strength,alternative:row.alternative===0?null:row.alternative};
    }else{
      if(row.kind!=='none'||row.strength!=='none'||row.alternative!==0)fail('AI_REVIEW_RECORD_ROLE_CONFLICT');
      if(row.role==='continuation') {
        if(row.anchor===0)fail('AI_REVIEW_RECORD_ROLE_CONFLICT');
        lines[key]=row.anchor;
      }else{
        if(row.anchor!==0)fail('AI_REVIEW_RECORD_ROLE_CONFLICT');
        lines[key]=row.role;
      }
    }
  }
  if(Object.keys(lines).length!==required.size)fail('AI_REVIEW_LINE_COVERAGE');
  return {lines};
}
const binding=(candidate,thinking)=>({sourceSha256:hash(recordLinePayload(candidate)),contractSha256:hash(recordLineContract(candidate,{thinking}))});
export function bindRecordInventory(candidate,inventory,provenance=null,{thinking='low'}={}) {
  return {version:RECORD_LINE_REVIEW_VERSION,thinking:thinkingOf(thinking),...binding(candidate,thinking),inventory,provenance};
}
export function decodeRecordInventory(candidate,review) {
  if(review?.version!==RECORD_LINE_REVIEW_VERSION)fail('AI_REVIEW_BINDING_MISMATCH');
  const expected=binding(candidate,thinkingOf(review.thinking));
  if(review.sourceSha256!==expected.sourceSha256||review.contractSha256!==expected.contractSha256)fail('AI_REVIEW_BINDING_MISMATCH');
  const payload=recordLinePayload(candidate);
  return decodeMixedValues(candidate,payload,projectRecordInventory(payload,review.inventory),submissionReviewEvidence(candidate));
}
export function compareRecordInventory({candidate,requirements,review}) {
  return compareReviewedRequirements(candidate,requirements,decodeRecordInventory(candidate,review),RECORD_LINE_REVIEW_VERSION,review.provenance);
}
export async function reviewRecordSource(candidate,options={}) {
  const contract=recordLineContract(candidate,{thinking:options.thinking??'low'});
  const response=await generateStructured(recordLinePayload(candidate),contract,{...options,
    env:{...(options.env??process.env),SKILVED_AI_THINKING:contract.thinking},maxOutputTokens:3072});
  const review=bindRecordInventory(candidate,response.extraction,response.provenance,{thinking:contract.thinking});
  try{decodeRecordInventory(candidate,review);return review;}catch(error){error.usage=review.provenance?.usage??null;throw error;}
}
