import {DomainError} from '../config.mjs';
import {isPromotionalLine} from './source-lines.mjs';

export const PRACTICAL_EVIDENCE_INSTRUCTION = `
For stated practicalConditions, copy ONE complete contiguous source passage verbatim into value.
The value must equal its supporting quote (or the text reconstructed from its span), including
line breaks, negations, conditions and context. Do not paraphrase, append advice, concatenate
separated passages or select only part of a conditional instruction. Other fields may still
use supported paraphrases. practicalEvidencePolicy.publisherPreparationSpans identifies
recognised Documents to prepare sections. They are publisher preparation context, not
employer practical conditions; do not use them in practicalConditions or requirement items.
If required instructions cannot fit one faithful passage, retain uncertainty for review instead
of silently dropping instructions or joining evidence. Local checks do not replace semantic review.`;

const heading = text => text.trim().replace(/^\d{1,2}[.)]\s+(?=[A-Za-z])/,'');
const preparation = /^documents to prepare\s*:?$/i;
const boundary = /^(?:minimum requirements|requirements|qualifications and experience required|minimum qualifications|entry requirements|added advantages|preferred(?: qualifications| requirements)?|advantageous|required (?:application )?documents|documents required|application documents|main responsibilities|responsibilities|duties(?: and responsibilities)?|main training\/duties|location|closing date(?: and application advice)?|how to apply|application process|benefits|why you should apply|apply now)\s*:?$/i;

export function practicalEvidencePolicy(candidate) {
  return practicalEvidencePolicyFromText(`${candidate.title}\n${candidate.sourceText}`);
}

export function practicalEvidencePolicyFromText(text) {
  const lines=text.split('\n'),publisherPreparationSpans=[];
  let start=null;
  for(const [index,line] of lines.entries()) {
    const text=heading(line);
    if(start!==null&&(preparation.test(text)||boundary.test(text)||/^Closing(?: date)?\s*:/i.test(text)||isPromotionalLine(text))) {
      publisherPreparationSpans.push([start,index]);start=null;
    }
    if(preparation.test(text))start=index+1;
  }
  // An unclosed recognised preparation section stays excluded through EOF.
  if(start!==null)publisherPreparationSpans.push([start,lines.length]);
  return {version:'source_bound_practical_v1',publisherPreparationSpans};
}

/** Conservative extractive binding, not independent semantic verification. */
export function assertPracticalEvidence(candidate,fact) {
  if(fact?.state!=='stated')return;
  if(typeof fact.value!=='string'||typeof fact.quote!=='string'||!fact.quote)throw new DomainError('AI_PRACTICAL_EVIDENCE_UNRESOLVED');
  if([fact.value,fact.quote].some(text=>text.split('\n').some(isPromotionalLine)))throw new DomainError('AI_PROMOTIONAL_CONTENT');
  if(fact.value!==fact.quote)throw new DomainError('AI_PRACTICAL_EVIDENCE_UNRESOLVED');
  assertNoPreparationEvidence(candidate,fact.quote);
}

export function assertNoPreparationEvidence(candidate,quote) {
  if(typeof quote!=='string'||!quote)throw new DomainError('AI_UNSUPPORTED_EVIDENCE');
  const corpus=`${candidate.title}\n${candidate.sourceText}`,lines=corpus.split('\n');
  let offset=0;const offsets=lines.map(line=>{const start=offset;offset+=line.length+1;return [start,start+line.length];});
  const excluded=practicalEvidencePolicy(candidate).publisherPreparationSpans.map(([first,last])=>[offsets[first-1][0],offsets[last-1][1]]);
  let at=corpus.indexOf(quote);
  if(at===-1)throw new DomainError('AI_UNSUPPORTED_EVIDENCE');
  // Quote-only canonical facts cannot distinguish duplicate occurrences. Require
  // fuller evidence if even one possible occurrence crosses preparation context.
  while(at!==-1) {
    if(excluded.some(([first,last])=>at<last&&at+quote.length>first))throw new DomainError('AI_PUBLISHER_PREPARATION_UNRESOLVED');
    at=corpus.indexOf(quote,at+1);
  }
}
