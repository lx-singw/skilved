import {completeReviewEvidence} from './complete-review-policy.mjs';
import {isReviewSectionBoundary} from './bounded-review-policy.mjs';
import {isPromotionalLine} from './source-lines.mjs';

export const PROFILE_REVIEW_POLICY_VERSION='entry_applicability_v7';
const label=text=>text.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200B-\u200D\s·•*–—-]+/u,'');
const start=/^(?:what you bring|qualifications and requirements|key competencies|personal attributes|attributes|behavio[u]?ral(?: competencies)?)\s*:?$/i;
const boundary=text=>start.test(text)||isReviewSectionBoundary(text)||isPromotionalLine(text)||
  /^(?:minimum requirements|requirements|qualifications(?: and experience)?|education|how to apply|application process|closing date|benefits|rewards|duties|responsibilities)\s*:?$/i.test(text)||
  /^who (?:is|are) .+\??$/i.test(text)||/^only shortlisted candidates (?:will|may) be contacted\s*[.!]?$/i.test(text);
const caveat=/\b(?:if|unless|where|when|subject to|may|might|could|previous|past|future|successful|appointed|selected|after appointment|after selection|not required|need not|optional)\b/i;
const complex=/\b(?:or|either|not|no|except|copies?|submit|provide|qualification|certificate|diploma|experience|training|will|shall)\b|[:;?]/i;
const trait=/^(?:(?:must (?:be |have )?)|(?:strong|good|excellent|basic)\s+)?(?:attention to detail|(?:written(?: and|\s*&) verbal|verbal(?: and|\s*&) written|communication|interpersonal|computer)\b|eagerness to learn\b|ability to follow instructions\b|hard[ -]?working\b|driven\b|a technical foundation\b)/i;
const licence=/^(?:a\s+)?valid (?:South African\s+)?(?:driver['’]?s|driving) licen[cs]e\b/i;

// Add facts only in bounded, current profile lists. Existing uncertainty,
// alternatives and document scopes take precedence; source quotes stay intact.
export function profileReviewEvidence(candidate) {
  const evidence=completeReviewEvidence(candidate),lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
  evidence.reviewPolicy.version=PROFILE_REVIEW_POLICY_VERSION;
  const hints=new Map(evidence.evidenceHints.map(row=>[row.line,row])),selected=new Set(evidence.requiredLineNumbers);
  const occupied=line=>evidence.reviewPolicy.scopes.some(({span:[first,last]})=>first<=line&&line<=last)||
    evidence.reviewPolicy.conditions.some(row=>row.line===line)||
    evidence.alternativeGroups.some(group=>group.spans.some(([first,last])=>first<=line&&line<=last))||
    ['ambiguous','conflicting'].includes(hints.get(line)?.state);
  for(let index=0;index<lines.length;index++) {
    if(!start.test(label(lines[index])))continue;
    let end=index+1;while(end<lines.length&&!boundary(label(lines[end])))end++;
    if(end===lines.length)continue;
    let guarded=false;
    for(let at=index+1;at<end;at++) {
      const line=at+1,text=label(lines[at]);
      if(caveat.test(text)){guarded=true;continue;}
      if(guarded||!selected.has(line)||occupied(line)||complex.test(text)||!(trait.test(text)||licence.test(text)))continue;
      // Preference and obligation apply only to this line. Avoid resolving
      // conflicting clauses or changing previously typed source evidence.
      const preferred=/\b(?:preferred|preferably|advantageous|beneficial|added advantage)\b/i.test(text);
      const required=/\b(?:must|required|essential)\b/i.test(text)&&!/\bas required\s*[.!]?$/i.test(text);
      if(preferred&&required)continue;
      const level=preferred?'preferred':required?'required':'unclear',prior=hints.get(line);
      if(prior&&(prior.kind&&prior.kind!=='other'||prior.level&&prior.level!=='unclear'&&prior.level!==level))continue;
      hints.set(line,{...prior,line,kind:'other',level,state:'stated',reason:'Bounded current competency or held licence; source-local strength, separate from submission.'});
      evidence.fixedRoles[`L${line}`]='condition';
    }
    index=end-1;
  }
  evidence.evidenceHints=[...hints.values()].sort((a,b)=>a.line-b.line);
  return evidence;
}
