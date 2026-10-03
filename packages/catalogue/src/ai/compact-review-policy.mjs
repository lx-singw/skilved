import {localReviewEvidence} from './local-review-policy.mjs';
import {boundedReviewEvidence,isReviewSectionBoundary} from './bounded-review-policy.mjs';
import {guardedReviewEvidence} from './guarded-review-policy.mjs';
import {isPromotionalLine} from './source-lines.mjs';

export const COMPACT_REVIEW_POLICY_VERSION='entry_applicability_v5';
// Normalize labels for recognition only; numbered source text/quotes stay intact.
const label=text=>text.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200B-\u200D\s·•*–—-]+/u,'');
const profile=/^(?:the|our) ideal candidate (?:will have|should have|has)\s*:?$/i;
const attributes=/^(?:personal attributes|attributes|behavio[u]?ral(?: competencies)?)\s*:?$/i;
const boundary=text=>isReviewSectionBoundary(text)||/^(?:minimum requirements|requirements|qualifications(?: and experience)?|education|what you bring|how to apply|application process|closing date|benefits|rewards|duties|responsibilities)\s*:?$/i.test(text)||/^who (?:is|are) .+\??$/i.test(text)||isPromotionalLine(text);
const caveat=/\b(?:if|unless|where|when|subject to|may|might|could|previous|past|successful|appointed|selected|after appointment|not required|need not)\b/i;
const qualification=/^(?:a\s+)?(?:national senior certificate\b|grade\s+12\b|matric\b|N[1-6]\b|NC\(?V\)?\s+level\s+[1-6]\b)|^(?:minimum of\s+)?(?:[1-6]|one|two|three|four|five|six)\s+N[1-6]\s+(?:engineering\s+)?subjects?\b/i;

export function compactReviewEvidence(candidate,{sectionEnd=boundary,layoutOptions={}}={}) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
  const guarded=index=>{
    for(let at=index-1;at>=0;at--){const text=label(lines[at]);
      if(sectionEnd(text)||profile.test(text)||attributes.test(text))break;
      if(caveat.test(text))return true;}
    return false;
  };
  const base=boundedReviewEvidence(candidate,sectionEnd,(line,text)=>caveat.test(text)||guarded(line-1),layoutOptions);
  const evidence=localReviewEvidence(candidate,guardedReviewEvidence(candidate,base));
  evidence.reviewPolicy.version=COMPACT_REVIEW_POLICY_VERSION;
  const hints=new Map(evidence.evidenceHints.map(row=>[row.line,row]));
  const occupied=line=>evidence.reviewPolicy.scopes.some(({span:[first,last]})=>first<=line&&line<=last)||
    evidence.reviewPolicy.conditions.some(row=>row.line===line)||
    evidence.alternativeGroups.some(group=>group.spans.some(([first,last])=>first<=line&&line<=last))||
    ['ambiguous','conflicting'].includes(hints.get(line)?.state);
  const add=(line,kind,level,reason)=>{
    const prior=hints.get(line);
    if(prior?.kind&&prior.kind!==kind)return;
    hints.set(line,{...prior,line,kind,level,state:'stated',reason});
  };
  let inProfile=false;
  for(let index=0;index<lines.length;index++) {
    const line=index+1,text=label(lines[index]);
    if(profile.test(text)){inProfile=!guarded(index);continue;}
    if(sectionEnd(text))inProfile=false;
    if(!occupied(line)&&inProfile&&!caveat.test(text)&&!guarded(index)&&qualification.test(text)&&
      hints.get(line)?.level==='unclear'&&!/^(?:or|either)\b/i.test(label(lines[index-1]??''))&&
      !/^(?:or|either)\b/i.test(label(lines[index+1]??'')))
      add(line,'education','unclear','Bounded current profile qualification, including engineering course credits; strength stays unstated.');
    if(isPromotionalLine(text)&&!occupied(line)&&!hints.has(line)) {
      evidence.excludedPromotionalLineNumbers.push(line);
      evidence.fixedRoles[`L${line}`]='promotion';
    }
    if(!attributes.test(text)||guarded(index))continue;
    let end=index+1;while(end<lines.length&&!sectionEnd(label(lines[end]))&&!profile.test(label(lines[end]))&&!attributes.test(label(lines[end])))end++;
    if(end===lines.length)continue;
    for(let at=index+1;at<end;at++) {
      const value=label(lines[at]),number=at+1;
      if(!value)continue;
      if(/^(?:none|n\/a|not applicable)\.?$/i.test(value)||/^["“”‘’]/.test(value))break;
      if(/^(?:or|either|preferred|advantageous)\b/i.test(value))break;
      if(occupied(number)||caveat.test(value))continue;
      if(hints.get(number)?.level==='preferred')continue;
      // 'Support as required' describes support, not a mandatory whole trait.
      // Complex mandatory/preference clauses remain model-owned.
      if(/\b(?:must|required|essential|preferred|advantageous)\b/i.test(value)&&!/\bas required\s*[.!]?$/i.test(value))continue;
      add(number,'other','unclear','Bounded applicant attribute; a trailing as-required subclause does not make the whole trait mandatory.');
    }
  }
  evidence.evidenceHints=[...hints.values()].sort((a,b)=>a.line-b.line);
  evidence.requiredLineNumbers=[...new Set([...evidence.requiredLineNumbers,...hints.keys()])].sort((a,b)=>a-b);
  evidence.excludedPromotionalLineNumbers=[...new Set(evidence.excludedPromotionalLineNumbers)].sort((a,b)=>a-b);
  for(const hint of hints.values())if(hint.state==='stated')evidence.fixedRoles[`L${hint.line}`]='condition';
  return evidence;
}
