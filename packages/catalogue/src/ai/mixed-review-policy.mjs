import {completeReviewEvidence,isCompleteReviewBoundary,isCompleteReviewStart} from './complete-review-policy.mjs';
import {profileReviewEvidence} from './profile-review-policy.mjs';

export const MIXED_REVIEW_POLICY_VERSION='entry_applicability_v8';
const label=text=>text.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200B-\u200D\s·•*–—-]+/u,'');
const programme=/^(?:about the (?:role|program(?:me)?)|successful candidates|employment equity)\s*:?$/i;
const documents=/^ensure your application includes? the following\s*:\s*$/i;
const administrative=text=>/^(?:queries|enquiries)\s*:/i.test(text)||
  /^ready to .+\?\s*submit your application\b/i.test(text)||
  /^if you are\b.+\bwe encourage you to apply\s*[.!]?$/i.test(text);
const caveat=/\b(?:prepare for|preparation for)\b.*\b(?:requirements|eligibility)\b.*\b(?:previous|past|prior)\b.*\bintake\b|^(?:if selected|if appointed|after appointment|after selection|previous intake|past intake|future intake)\b/i;

// Recompute selection at explicit section transitions. Current application
// instructions can restart selection after a successful-candidate section;
// arbitrary or caveated document prose is not treated as a new current list.
export function mixedReviewEvidence(candidate,{standaloneMustSpanPolicy='exact'}={}) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n'),guardedDocuments=new Set();let guarded=false;
  for(const value of lines){const text=label(value);
    if(caveat.test(text))guarded=true;
    else if(isCompleteReviewBoundary(text)||programme.test(text))guarded=false;
    if(documents.test(text)&&guarded)guardedDocuments.add(text.toLowerCase());
  }
  // Repeated indistinguishable headings abstain together if one is caveated.
  const currentDocuments=text=>documents.test(label(text))&&!guardedDocuments.has(label(text).toLowerCase());
  const boundary=text=>isCompleteReviewBoundary(label(text))||programme.test(label(text))||currentDocuments(text)||administrative(label(text));
  const evidence=profileReviewEvidence(candidate,completeReviewEvidence(candidate,{sectionEnd:boundary,
    sectionStart:text=>isCompleteReviewStart(text)||currentDocuments(text),standaloneMustSpanPolicy}));
  evidence.reviewPolicy.version=MIXED_REVIEW_POLICY_VERSION;
  const occupied=line=>evidence.reviewPolicy.scopes.some(({span:[first,last]})=>first<=line&&line<=last)||
    evidence.reviewPolicy.conditions.some(row=>row.line===line)||evidence.evidenceHints.some(row=>row.line===line)||
    evidence.alternativeGroups.some(group=>group.spans.some(([first,last])=>first<=line&&line<=last));
  for(let index=0;index<lines.length;index++)if((programme.test(label(lines[index]))||currentDocuments(lines[index]))&&!occupied(index+1))
    evidence.reviewPolicy.scopes.push({span:[index+1,index+1],applicability:'context'});
  evidence.reviewPolicy.scopes.sort((a,b)=>a.span[0]-b.span[0]);
  // Only the explicit must-pass TVET / OR vocational rule is code-owned.
  // Other alternatives and unknown qualification relationships stay reviewed.
  evidence.compiledQualificationGroups=evidence.alternativeGroups.filter(group=>group.spans.length===2&&
    group.markerLine===group.spans[0][0]&&
    /^(?:candidate|applicant)s? must have passed (?:the )?following subjects at (?:a )?TVET college\b/i.test(label(lines[group.spans[0][0]-1]))&&
    /^or (?:a )?national certificate\s*\(vocational\)\s*(?:level\s*)?[1-6]\s*:?$/i.test(label(lines[group.spans[1][0]-1])))
    .map(group=>({spans:group.spans.map(span=>[...span])}));
  return evidence;
}
