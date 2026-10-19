import {DomainError} from '../config.mjs';
import {practicalEvidencePolicy} from './practical-evidence.mjs';
import {isPromotionalLine} from './source-lines.mjs';

export const EXPERIENCE_COMPLETENESS_INSTRUCTION=`
Retain explicit experience rules in the separate experience field even when requirements also contain them.
experienceCompletenessPolicy.passages lists narrow recognised rules, including preferences and no-experience waivers.
For a stated experience fact, copy its complete contiguous evidence verbatim into value and cite that full passage.
Keep although not essential, preferred, required and no experience required wording intact. Do not promote a preference.
Multiple passages need one actual contiguous supporting range, never a concatenation of distant lines.
Preserve genuine ambiguity/conflict with null value and complete evidence; never invent certainty or fill a missing fact.
Unlisted wording still needs source review. These hints do not classify all experience, verify eligibility or replace validation.`;

const strip=text=>text.trim().replace(/^(?:[•·*–—-]\s*|\d{1,2}[.)]\s+)/,'');
const strength='(?:required|essential|preferred|desirable|advantageous|an advantage|a recommendation)';
const prefix='(?:(?:prior|previous|relevant|work|practical|industry|hands-on)\\s+)?';
const direct=new RegExp('^'+prefix+'experience(?:\\s+is)?\\s+'+strength+'[.]?$','i');
const field=new RegExp('^'+prefix+'experience (?:with|in|of) .{1,240}?(?:,\\s*although not essential|(?: is)? '+strength+')[.]?$','i');
const quantity=new RegExp('^(?:(?:minimum of|at least) )?(?:[1-9][0-9]?|one|two|three|four|five|six|seven|eight|nine|ten) years?\u0027? (?:of )?(?:[A-Za-z -]{1,60} )?experience (?:is )?'+strength+'[.]?$','i');
const waiver=/^No (?:(?:prior|previous|work) )?experience (?:is )?(?:required|necessary|needed)[.]?$/i;
const conditional=/\b(?:if|unless|either|or|subject to|depending on|for other|for WIL applicants)\b/i;

// Standalone conclusive rules only. Education, duty prose, conditional routes,
// unfamiliar formats and publisher preparation remain for semantic review.
function recognised(line){
 const text=strip(line),label=text.match(/^Experience\s*:\s*(.+)$/i),value=label?label[1]:text;
 if(text.length>500||conditional.test(value))return false;
 return waiver.test(value)||direct.test(value)||field.test(value)||quantity.test(value)||
  Boolean(label&&/^(?:not required|none required|required|preferred)[.]?$/i.test(value));
}

export function experienceCompletenessPolicy(candidate){
 const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n'),excluded=practicalEvidencePolicy(candidate).publisherPreparationSpans;
 const eligible=index=>(!candidate.programmeScope||candidate.programmeScope.includedSpans?.some(([first,last])=>first<=index+1&&index+1<=last))&&
  !excluded.some(([first,last])=>first<=index+1&&index+1<=last)&&!isPromotionalLine(lines[index]);
 return {version:'source_experience_completeness_v1',passages:lines.flatMap((line,index)=>
  eligible(index)&&recognised(line)?[{span:[index+1,index+1],originalText:line}]:[])};
}

export function assertExperienceCompleteness(candidate,fact){
 const {passages}=experienceCompletenessPolicy(candidate);
 if(!passages.length)return;
 const corpus=`${candidate.title}\n${candidate.sourceText}`;
 if(!['stated','ambiguous','conflicting'].includes(fact?.state)||typeof fact.quote!=='string'||!corpus.includes(fact.quote)||
  passages.some(h=>!fact.quote.includes(h.originalText.trim()))||
  (fact.state==='stated'?fact.value!==fact.quote:fact.value!==null))
  throw new DomainError('AI_EXPERIENCE_COMPLETENESS_UNRESOLVED');
}
