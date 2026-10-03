import {createHash} from 'node:crypto';
import {z} from 'zod';
import {zodToJsonSchema} from 'zod-to-json-schema';
import {DomainError} from '../config.mjs';
import {ExtractionSchema} from './extraction.mjs';
import {generateStructured} from './gemini.mjs';
import {submissionLinePayload,submissionLineContract,submissionReviewEvidence} from './submission-line-review.mjs';
import {RECORD_LINE_INSTRUCTION} from './record-line-review.mjs';
import {decodeMixedValues} from './mixed-line-review.mjs';
import {compareReviewedRequirements} from './structured-requirement-review.mjs';

// Development only: a single tag owns role or current kind/local strength.
export const TAG_LINE_REVIEW_VERSION='recentjobs_requirement_review_v16';
export const tagLinePayload=submissionLinePayload;
const kinds=ExtractionSchema.shape.requirements.shape.items.element.shape.kind.options;
const currentTags=new Map(kinds.flatMap(kind=>['mandatory','advantage','unstated'].map(strength=>[`${kind}:${strength}`,{kind,strength}])));
const nonCurrent=['context','post_selection','employer','promotion','preparation','conditional','uncertain'];
const record=z.object({line:z.number().int().min(1).max(160),tag:z.enum([...nonCurrent,'continuation',...currentTags.keys()]),
  anchor:z.number().int().min(0).max(159),alternative:z.number().int().min(0).max(160)}).strict();
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail=code=>{throw new DomainError(code);};
const thinkingOf=value=>{if(!['low','medium'].includes(value))fail('AI_INVALID_REVIEW_THINKING');return value;};
const paragraphs=RECORD_LINE_INSTRUCTION.split('\n');
paragraphs[2]='Every record has exactly line,tag,anchor,alternative. Choose applicability first, then kind and LOCAL strength. A current condition uses one tag of the form kind:strength, such as education:mandatory, document:mandatory or experience:advantage. Supported kinds and strengths are listed in the schema; a tag represents both, not just one. For current condition tags, anchor must be 0. Other tags are context, post_selection, employer, promotion, preparation, conditional, uncertain and continuation. Ordinary non-current tags require anchor:0 and alternative:0. Continuation requires alternative:0 and an anchor naming the FIRST line of the immediately preceding current condition or unknown scope. Never reference another continuation, a future line, a code-owned line, another segment or another condition. Example: line 8 starts document:mandatory; lines 9 and 10 both use tag:continuation,anchor:8,alternative:0. Independent conditions start separate condition-tag records. Headings stay context. Do not return separate role, kind or strength fields.';
export const TAG_LINE_INSTRUCTION=paragraphs.join('\n');
export function tagInventorySchema(payload) {
  return z.object({lines:z.array(record).length(payload.requiredOutputKeys.length)}).strict();
}
export function tagLineContract(candidate,{thinking='low'}={}) {
  const previous=submissionLineContract(candidate,{thinking});
  const {$schema,...localSchema}=zodToJsonSchema(tagInventorySchema(tagLinePayload(candidate)),{$refStrategy:'none'});
  const schema=structuredClone(localSchema);
  // Provider array bounds failed in V15; exact length/coverage stays local.
  delete schema.properties.lines.minItems;delete schema.properties.lines.maxItems;
  return {...previous,version:TAG_LINE_REVIEW_VERSION,outputMode:'json_schema',instruction:TAG_LINE_INSTRUCTION,schema,
    tagSchemaSha256:hash(schema),localTagSchemaSha256:hash(localSchema)};
}
export function projectTagInventory(payload,inventory) {
  let data;
  try{if(Buffer.byteLength(JSON.stringify(inventory))>96000)fail('AI_OUTPUT_LIMIT');data=tagInventorySchema(payload).parse(inventory);}
  catch(error){if(error instanceof DomainError)throw error;fail('AI_INVALID_REVIEW_INVENTORY');}
  const required=new Set(payload.requiredOutputKeys),lines={};
  for(const row of data.lines) {
    const key=`L${row.line}`;
    if(!required.has(key)||Object.hasOwn(lines,key))fail('AI_REVIEW_LINE_COVERAGE');
    const condition=currentTags.get(row.tag);
    if(condition) {
      if(row.anchor!==0)fail('AI_REVIEW_TAG_ANCHOR_CONFLICT');
      lines[key]={...condition,alternative:row.alternative===0?null:row.alternative};
    }else{
      if(row.alternative!==0)fail('AI_REVIEW_TAG_ANCHOR_CONFLICT');
      if(row.tag==='continuation') {
        if(row.anchor===0)fail('AI_REVIEW_TAG_ANCHOR_CONFLICT');
        lines[key]=row.anchor;
      }else{
        if(row.anchor!==0)fail('AI_REVIEW_TAG_ANCHOR_CONFLICT');
        lines[key]=row.tag;
      }
    }
  }
  if(Object.keys(lines).length!==required.size)fail('AI_REVIEW_LINE_COVERAGE');
  return {lines};
}
const binding=(candidate,thinking)=>({sourceSha256:hash(tagLinePayload(candidate)),contractSha256:hash(tagLineContract(candidate,{thinking}))});
export function bindTagInventory(candidate,inventory,provenance=null,{thinking='low'}={}) {
  return {version:TAG_LINE_REVIEW_VERSION,thinking:thinkingOf(thinking),...binding(candidate,thinking),inventory,provenance};
}
export function decodeTagInventory(candidate,review) {
  if(review?.version!==TAG_LINE_REVIEW_VERSION)fail('AI_REVIEW_BINDING_MISMATCH');
  const expected=binding(candidate,thinkingOf(review.thinking));
  if(review.sourceSha256!==expected.sourceSha256||review.contractSha256!==expected.contractSha256)fail('AI_REVIEW_BINDING_MISMATCH');
  const payload=tagLinePayload(candidate);
  return decodeMixedValues(candidate,payload,projectTagInventory(payload,review.inventory),submissionReviewEvidence(candidate));
}
export function compareTagInventory({candidate,requirements,review}) {
  return compareReviewedRequirements(candidate,requirements,decodeTagInventory(candidate,review),TAG_LINE_REVIEW_VERSION,review.provenance);
}
export async function reviewTagSource(candidate,options={}) {
  const contract=tagLineContract(candidate,{thinking:options.thinking??'low'});
  const response=await generateStructured(tagLinePayload(candidate),contract,{...options,
    env:{...(options.env??process.env),SKILVED_AI_THINKING:contract.thinking},maxOutputTokens:3072});
  const review=bindTagInventory(candidate,response.extraction,response.provenance,{thinking:contract.thinking});
  try{decodeTagInventory(candidate,review);return review;}catch(error){error.usage=review.provenance?.usage??null;throw error;}
}
