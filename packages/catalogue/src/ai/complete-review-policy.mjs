import {compactReviewEvidence} from './compact-review-policy.mjs';
import {isReviewSectionBoundary} from './bounded-review-policy.mjs';
import {isPromotionalLine} from './source-lines.mjs';

export const COMPLETE_REVIEW_POLICY_VERSION='entry_applicability_v6';
const label=text=>text.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200B-\u200D\s·•*–—-]+/u,'');
const start=/^(?:what you bring|qualifications and requirements|key competencies|personal attributes|attributes|behavio[u]?ral(?: competencies)?)\s*:?$/i;
const admin=/^only shortlisted candidates (?:will|may) be contacted\s*[.!]?$/i;
const boundary=text=>isReviewSectionBoundary(label(text))||start.test(label(text))||admin.test(label(text))||
  /^(?:minimum requirements|requirements|qualifications(?: and experience)?|education|how to apply|application process|closing date|benefits|rewards|duties|responsibilities)\s*:?$/i.test(label(text))||
  /^who (?:is|are) .+\??$/i.test(label(text))||isPromotionalLine(label(text));
const caveat=/\b(?:if|unless|where|when|subject to|may|might|could|previous|past|successful|appointed|selected|after appointment|not required|need not|optional|preferred|advantageous)\b/i;
const courseSubject=/^(?:mathematics|maths|engineering science|mechanotechnology|engineering drawings?|engineering processes|professional engineering practice|applied engineering technology)(?:\s+N[1-6](?:\s*(?:to|[–—-])\s*N?[1-6])?)?\s*[.!]?$/i;
const firstBranch=/^(?:candidate|applicant)s? must have passed (?:the )?following subjects at (?:a )?TVET college\b[^;.!]*:\s*$/i;
const secondBranch=/^or (?:a )?national certificate\s*\(vocational\)\s*(?:level\s*)?[1-6]\s*:?$/i;

// Recompute bounded selection, then add only explicit source constraints.
// Complete OR branches need an obligation, two introductions, contiguous
// subject lists and an explicit end. No employer names or expected answers.
export const isCompleteReviewBoundary=text=>boundary(text);
export const isCompleteReviewStart=text=>start.test(label(text));
export function completeReviewEvidence(candidate,{sectionEnd=boundary,sectionStart=isCompleteReviewStart}={}) {
  const evidence=compactReviewEvidence(candidate,{sectionEnd,layoutOptions:{sectionStart}});
  evidence.reviewPolicy.version=COMPLETE_REVIEW_POLICY_VERSION;
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
  const covered=line=>evidence.reviewPolicy.scopes.some(({span:[first,last]})=>first<=line&&line<=last)||
    evidence.reviewPolicy.conditions.some(row=>row.line===line)||
    evidence.evidenceHints.some(row=>row.line===line)||
    evidence.alternativeGroups.some(group=>group.spans.some(([first,last])=>first<=line&&line<=last));
  const selected=new Set(evidence.requiredLineNumbers);
  const contextual=index=>{
    for(let at=index-1;at>=0;at--){const text=label(lines[at]);if(sectionEnd(text))break;
      if(/\b(?:if|unless|where|when|subject to|previous|past|successful|appointed|selected|after appointment)\b/i.test(text))return true;}
    return false;
  };
  for(let index=0;index<lines.length;index++) {
    if(!selected.has(index+1)||!firstBranch.test(label(lines[index]))||covered(index+1)||caveat.test(lines[index])||contextual(index))continue;
    let next=index+1;
    while(next<lines.length&&courseSubject.test(label(lines[next]))&&!caveat.test(lines[next]))next++;
    if(next===index+1||!secondBranch.test(label(lines[next]??'')))continue;
    const second=next;next++;
    while(next<lines.length&&courseSubject.test(label(lines[next]))&&!caveat.test(lines[next]))next++;
    if(next===second+1||next===lines.length)continue;
    const spans=[[index+1,second],[second+1,next]];
    if(spans.some(([first,last])=>Array.from({length:last-first+1},(_,offset)=>first+offset).some(line=>!selected.has(line)||covered(line))))continue;
    // Following applicant prose is a branch boundary only when it is clearly
    // independent; unrecognized continuation/OR wording makes this rule abstain.
    const after=label(lines[next]);
    if(!sectionEnd(after)&&!/^(?:clear criminal record|no criminal record|hard.?working|must\b)/i.test(after))continue;
    evidence.alternativeGroups.push({group:evidence.alternativeGroups.length+1,markerLine:index+1,spans});
    index=next-1;
  }
  // A selected standalone must-clause constrains strength without guessing
  // its kind. Qualification introductions inside known branches stay intact.
  for(let index=0;index<lines.length;index++) {
    const line=index+1,text=label(lines[index]);
    if(!selected.has(line)||covered(line)||!/^must\b/i.test(text)||caveat.test(text)||contextual(index)||/:$/.test(text))continue;
    evidence.evidenceHints.push({line,level:'required',state:'stated',reason:'Explicit standalone current must-clause; kind remains model-owned.'});
    evidence.fixedRoles[`L${line}`]='condition';
  }
  evidence.evidenceHints.sort((a,b)=>a.line-b.line);
  return evidence;
}
