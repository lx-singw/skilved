import {DomainError} from '../config.mjs';
import {practicalEvidencePolicy} from './practical-evidence.mjs';
import {isPromotionalLine} from './source-lines.mjs';

const normalise=text=>text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}/-]+/gu,' ').trim();
const contains=(text,term)=>` ${normalise(text)} `.includes(` ${normalise(term)} `);
const unsafe=/\b(?:not|no|never|without|except|excluding|if|unless|may|might|could|subject to|depending|either|or)\b/i;
const referenceLabel=/^(?:reference(?: number| no\.?)?|ref(?:erence)?\s*#|requisition(?: id| number| no\.?)?)\s*(?::\s*(.*)|\s*)$/i;
const identifier=/^[A-Za-z0-9][A-Za-z0-9/-]{2,79}$/;
const benefit=/^(?:retirement benefits|medical aid)$/i;
const benefitEnd=/^(?:how to apply|apply(?: now)?(?: online)?|closing date|deadline|requirements|qualifications|preferred qualifications|job details)\b/i;

/** Narrow source forms only; no inferred age, eligibility, compensation or identifier. */
export function noticeMetadataPolicy(candidate) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
  const excluded=practicalEvidencePolicy(candidate).publisherPreparationSpans;
  const permitted=i=>i>=1&&i<lines.length&&
    (!candidate.programmeScope||candidate.programmeScope.includedSpans?.some(([first,last])=>i+1>=first&&i+1<=last))&&
    !excluded.some(([first,last])=>i+1>=first&&i+1<=last)&&!isPromotionalLine(lines[i]);
  const hint=(first,last)=>({span:[first+1,last+1],originalText:lines.slice(first,last+1).join('\n')});
  const references=[],audiences=[],regionalBenefits=[];
  for(let i=1;i<lines.length;i++) {
    if(!permitted(i))continue;
    const text=lines[i].trim(),label=text.match(referenceLabel);
    if(label) {
      const last=label[1]?i:i+1,value=label[1]||lines[last]?.trim();
      if(permitted(last)&&identifier.test(value))references.push({value,...hint(i,last)});
    }
    if(text.length<=600&&!unsafe.test(text)&&/\binvites?\s+unemployed youth\s+to apply\b/i.test(text))
      audiences.push({wording:'unemployed youth',...hint(i,i)});
    if(!/^what we offer\s*:?$/i.test(text))continue;
    // An explicit regional qualifier and a short, closed recognised list are
    // required. Corporate context stays in the evidence, never a vacancy guarantee.
    for(let j=i+1;j<Math.min(i+6,lines.length);j++) {
      if(!permitted(j)||benefitEnd.test(lines[j].trim()))break;
      const scope=lines[j].trim().match(/\b(?:we offer )?(regional comprehensive benefits), including:\s*$/i);
      if(!scope||unsafe.test(lines[j]))continue;
      const values=[];let k=j+1;
      for(;k<Math.min(j+4,lines.length)&&permitted(k)&&benefit.test(lines[k].trim());k++)values.push(lines[k].trim());
      const closed=k===lines.length||isPromotionalLine(lines[k])||permitted(k)&&benefitEnd.test(lines[k].trim());
      if(values.length&&closed&&new Set(values.map(normalise)).size===values.length)
        regionalBenefits.push({scope:scope[1],benefits:values,...hint(j,k-1)});
      break;
    }
  }
  return {references,audiences,regionalBenefits};
}

export function assertReferenceCompleteness(extracted,policy) {
  if(new Set(policy.references.map(h=>h.value)).size>1)throw new DomainError('AI_SOURCE_REFERENCE_UNRESOLVED');
  for(const hint of policy.references) {
    const fact=extracted.intake;
    if(fact?.state!=='stated'||!fact.value?.split(/[^A-Za-z0-9/-]+/).includes(hint.value)||!fact.quote?.includes(hint.originalText))
      throw new DomainError('AI_SOURCE_REFERENCE_UNRESOLVED');
  }
}

export function assertAudienceCompleteness(extracted,policy) {
  for(const hint of policy.audiences)if(extracted.summary?.state!=='stated'||
    !contains(extracted.summary.value,hint.wording)||/\b(?:not|no|never|without|except|excluding)\s+unemployed youth\b/i.test(extracted.summary.value)||
    !extracted.summary.quote?.includes(hint.originalText))
    throw new DomainError('AI_AUDIENCE_UNRESOLVED');
}

export function assertRegionalBenefitsCompleteness(extracted,policy) {
  for(const hint of policy.regionalBenefits)for(const name of hint.benefits) {
    const retained=extracted.compensation?.some(fact=>fact.state==='stated'&&fact.quote?.includes(hint.originalText)&&
      fact.value?.kind==='other'&&fact.value.amount===null&&fact.value.maximum===null&&fact.value.currency===null&&
      fact.value.period==='not_stated'&&typeof fact.value.coverage==='string'&&
      contains(fact.value.coverage,hint.scope)&&contains(fact.value.coverage,name)&&
      // Only source scope/list words are permitted here; notably no added guarantee.
      normalise(fact.value.coverage).split(' ').every(word=>normalise(`${hint.scope} including ${hint.benefits.join(' ')}`).split(' ').includes(word)));
    if(!retained)throw new DomainError('AI_REGIONAL_BENEFITS_UNRESOLVED');
  }
}

/** Exact echoed metadata terms only. Arbitrary paraphrases still require semantic review. */
export function assertSummaryMetadataEvidence(extracted,policy) {
  const summary=extracted.summary;
  if(summary?.state!=='stated')return;
  const places=extracted.location?.state==='stated'?extracted.location.value?.places??[]:[];
  const terms=[...places.flatMap(p=>[p.city,p.province]),...policy.references.map(h=>h.value)].filter(Boolean);
  for(const term of terms)if(contains(summary.value,term)&&!contains(summary.quote??'',term))
    throw new DomainError('AI_SUMMARY_EVIDENCE_UNRESOLVED');
}

export function assertNoticeMetadata(extracted,policy) {
  assertReferenceCompleteness(extracted,policy);
  assertAudienceCompleteness(extracted,policy);
  assertRegionalBenefitsCompleteness(extracted,policy);
  assertSummaryMetadataEvidence(extracted,policy);
}
