import {DomainError} from '../config.mjs';
import {practicalEvidencePolicy} from './practical-evidence.mjs';
import {isPromotionalLine} from './source-lines.mjs';
import {noticeMetadataPolicy,assertNoticeMetadata} from './notice-metadata.mjs';

export const METADATA_COMPLETENESS_INSTRUCTION = `
Retain explicitly labelled qualitative salary/stipend in compensation even without a number.
For market related, competitive or negotiable pay, keep its wording in coverage and leave
unstated amount, maximum and currency null and period not_stated. Cite the label and value.
Retain a stated maximum programme duration with its upper bound, quantity and unit together.
When metadataCompletenessPolicy.maximumDurations lists a passage, prioritise it in summary:
copy its complete originalText into summary.value and cite its full span (or exact supporting quote).
A generic programme-purpose summary is insufficient when it drops that maximum duration.
Keep separate application/document instructions in practicalConditions with their own exact passage.
Never turn up to four years into a fixed four years. Use a supported summary when a separate
application instruction occupies practicalConditions; never join distant practical passages.
metadataCompletenessPolicy lists narrow recognised source forms that must not disappear.
Its references include explicit Requisition ID/number and Reference labels: copy the exact
identifier into intake and cite the complete label/value passage, including next-line values.
Its audiences identify an explicit invitation to unemployed youth. Retain that audience in
summary.value with the entire invitation in summary evidence; do not infer a numeric age,
mandatory eligibility, citizenship or residence from that invitation.
Its regionalBenefits retain the regional comprehensive benefits scope and each listed benefit
in compensation coverage. Use kind other, null amount/maximum/currency and period not_stated.
Cite the entire scope-and-list originalText. Do not turn corporate regional benefits into a
guaranteed vacancy entitlement. Other benefit wording still needs semantic review.
Every summary claim must be supported by summary's OWN contiguous evidence, not just another
field's quote or facts elsewhere in the source. Include a wider complete span when needed,
or keep the summary focused on its supporting passage while retaining other metadata fields.
These hints do not fill fields, resolve conflicts or replace semantic validation.`;

const normalise = text => text.toLowerCase().replace(/[-\s]+/g,' ').replace(/[.!]$/,'').trim();
const qualitative = /^(market[ -]related|competitive|negotiable)[.!]?$/i;
const number = '(?:10|[1-9]|one|two|three|four|five|six|seven|eight|nine|ten)';
const bounded = new RegExp('\\b(?:a maximum (?:period|duration) of|maximum (?:period|duration) of|a maximum of|maximum of|up to|at most|no more than|not more than)\\s+('+number+')\\s+(years?|months?|weeks?)\\b','i');
const quantities = new RegExp('\\b'+number+'\\s+(?:years?|months?|weeks?)\\b','gi');
const words = ['zero','one','two','three','four','five','six','seven','eight','nine','ten'];
const duration = text => {
  const match=text.match(bounded);
  if(!match || [...text.matchAll(quantities)].length!==1)return null;
  return {amount:/^\d+$/.test(match[1])?Number(match[1]):words.indexOf(match[1].toLowerCase()),unit:match[2].toLowerCase().replace(/s$/,'')};
};
const uncertain = /\b(?:if|unless|may|might|could|subject to|depending|minimum|at least|experience|either|or|extend(?:ed|s)?|never|cannot)\b|\b(?:not|no)\b(?!\s+more\s+than\b)|\b(?:won't|can't)\b/i;

/** Bounded source hints only: unrecognised wording is left to semantic review. */
export function metadataCompletenessPolicy(candidate) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
  const excluded=practicalEvidencePolicy(candidate).publisherPreparationSpans;
  const permitted=index=>index>=0&&index<lines.length&&
    (!candidate.programmeScope||candidate.programmeScope.includedSpans?.some(([first,last])=>index+1>=first&&index+1<=last))&&
    !excluded.some(([first,last])=>index+1>=first&&index+1<=last)&&!isPromotionalLine(lines[index]);
  const qualitativePay=[],maximumDurations=[];
  const hint=(first,last)=>({span:[first+1,last+1],originalText:lines.slice(first,last+1).join('\n')});
  for(let i=0;i<lines.length;i++) {
    if(!permitted(i))continue;
    const line=lines[i].trim(),label=line.match(/^(salary|stipend)\b\s*:?\s*(.*)$/i);
    if(label) {
      const last=label[2]?i:i+1,value=label[2]||lines[last]?.trim();
      if(value&&last<lines.length&&permitted(last)&&qualitative.test(value))
        qualitativePay.push({kind:label[1].toLowerCase(),coverage:value,...hint(i,last)});
    }
    // Only explicit participation/programme sentences or a labelled maximum.
    // Experience periods, fixed durations, alternatives and conditions are not inferred.
    const labelDuration=line.match(/^(?:programme |apprenticeship )?duration\b\s*:?\s*(.*)$/i);
    const last=labelDuration&&!labelDuration[1]?i+1:i,value=labelDuration?(labelDuration[1]||lines[last]?.trim()):line;
    if(!value||last>=lines.length||!permitted(last)||uncertain.test(value))continue;
    const explicit=labelDuration||/\bparticipat(?:e|ing) in (?:the|this) programme\b/i.test(value)||
      /^(?:(?:the|this) )?(?:programme|apprenticeship)(?: duration)?\s*(?::|(?:will |shall )?(?:lasts?|runs?|is)\b)/i.test(value);
    const limit=explicit?duration(value):null;
    if(limit)maximumDurations.push({...limit,bound:'maximum',...hint(i,last)});
  }
  return {version:'source_metadata_completeness_v2',qualitativePay,maximumDurations,...noticeMetadataPolicy(candidate)};
}

export function assertQualitativePayCompleteness(candidate,extracted,policy=metadataCompletenessPolicy(candidate)) {
  for(const kind of ['salary','stipend'])if(new Set(policy.qualitativePay.filter(h=>h.kind===kind).map(h=>normalise(h.coverage))).size>1)
    throw new DomainError('AI_QUALITATIVE_PAY_UNRESOLVED');
  for(const hint of policy.qualitativePay) {
    const retained=extracted.compensation?.some(fact=> {
      const value=fact.value;
      return fact.state==='stated'&&fact.quote?.includes(hint.originalText)&&value?.kind===hint.kind&&
        value.amount===null&&value.maximum===null&&value.currency===null&&value.period==='not_stated'&&
        typeof value.coverage==='string'&&normalise(value.coverage)===normalise(hint.coverage);
    });
    if(!retained)throw new DomainError('AI_QUALITATIVE_PAY_UNRESOLVED');
  }
}

export function assertMaximumDurationCompleteness(candidate,extracted,policy=metadataCompletenessPolicy(candidate)) {
  if(new Set(policy.maximumDurations.map(h=>`${h.amount}:${h.unit}`)).size>1)throw new DomainError('AI_MAXIMUM_DURATION_UNRESOLVED');
  for(const hint of policy.maximumDurations) {
    const retained=[extracted.summary,extracted.practicalConditions].some(fact=> {
      if(fact?.state!=='stated'||!fact.quote?.includes(hint.originalText)||typeof fact.value!=='string')return false;
      const limit=duration(fact.value);
      return limit?.amount===hint.amount&&limit.unit===hint.unit&&!uncertain.test(fact.value);
    });
    if(!retained)throw new DomainError('AI_MAXIMUM_DURATION_UNRESOLVED');
  }
}

export function assertMetadataCompleteness(candidate,extracted) {
  const policy=metadataCompletenessPolicy(candidate);
  assertQualitativePayCompleteness(candidate,extracted,policy);
  assertMaximumDurationCompleteness(candidate,extracted,policy);
  assertNoticeMetadata(extracted,policy);
}
