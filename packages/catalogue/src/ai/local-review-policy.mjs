import {guardedReviewEvidence} from './guarded-review-policy.mjs';
import {isReviewSectionBoundary} from './bounded-review-policy.mjs';
import {DomainError} from '../config.mjs';

export const LOCAL_REVIEW_POLICY_VERSION='entry_applicability_v4';
const label=text=>text.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s·•*-]+/u,'');
const caveat=/\b(?:if|unless|where|when|subject to|may|might|could|previous|past|successful|appointed|selected|after appointment|not required|need not)\b/i;
const profile=/^(?:the|our) ideal candidate (?:will have|should have|has)\s*:?$/i;
const boundary=/^(?:minimum requirements|requirements|qualifications(?: and experience)?|education(?:\s*\/\s*experience)?|key skills|required skills|how to apply|application process|closing date|benefits|duties|responsibilities)\s*:?$/i;
const qualification=/^(?:a\s+)?(?:national senior certificate\b|grade\s+12\b|matric\b|N[1-6]\b|NC\(?V\)?\s+level\s+[1-6]\b)|^(?:[1-6]|one|two|three|four|five|six)\s+N[1-6]\s+(?:engineering\s+)?subjects?\b/i;
const licence=/^(?:a\s+)?valid (?:driver['’]?s|driving) licen[cs]e\b/i;
const readiness=/^(?:candidates|applicants) must be prepared to undergo (?:medical and placement|medical|placement) tests?\s*[.!]?$/i;
const disclaimer=/^\(?(?:NB\s*:\s*)?taking part in (?:the|these) tests does not guarantee (?:placement|appointment)(?: in [^;.!]+)?\s*[.!]?\)?$/i;

// Narrow, versioned source facts; no employer names or expected/model answers.
export function localReviewEvidence(candidate,evidence=guardedReviewEvidence(candidate)) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
  evidence.reviewPolicy.version=LOCAL_REVIEW_POLICY_VERSION;
  const hints=new Map(evidence.evidenceHints.map(row=>[row.line,row]));
  const contextCaveated=line=>{
    for(let index=line-2;index>=0;index--){const text=label(lines[index]);
      if(boundary.test(text)||isReviewSectionBoundary(text)||profile.test(text))break;
      if(caveat.test(text)||/\b(?:after selection|future intake)\b/i.test(text))return true;}
    return false;
  };
  const occupied=line=>evidence.reviewPolicy.scopes.some(({span:[first,last]})=>first<=line&&line<=last)||
    evidence.reviewPolicy.conditions.some(row=>row.line===line)||
    evidence.alternativeGroups.some(group=>group.spans.some(([first,last])=>first<=line&&line<=last))||
    ['ambiguous','conflicting'].includes(hints.get(line)?.state);
  const add=(line,kind,level,reason)=>{
    const prior=hints.get(line);
    if(prior&&(prior.kind&&prior.kind!==kind||prior.level&&prior.level!=='unclear'&&prior.level!==level))
      throw new DomainError('AI_REVIEW_POLICY_CONFLICT');
    hints.set(line,{...prior,line,kind,level,state:'stated',reason});
  };
  let inProfile=false;
  for(let index=0;index<lines.length;index++) {
    const line=index+1,text=label(lines[index]);
    if(profile.test(text)){inProfile=!contextCaveated(line);continue;}
    if(boundary.test(text)||isReviewSectionBoundary(text))inProfile=false;
    if(occupied(line)||caveat.test(text)||contextCaveated(line))continue;
    if(inProfile&&hints.get(line)?.level==='unclear'&&qualification.test(text)&&
      !/^(?:or|either)\b/i.test(label(lines[index-1]??''))&&!/^(?:or|either)\b/i.test(label(lines[index+1]??'')))
      add(line,'education','unclear','Qualification in a bounded current ideal profile; unspecified strength is not unknown applicability.');
    if(evidence.requiredLineNumbers.includes(line)&&licence.test(text)&&!/\b(?:copies?|submit|provide|optional)\b/i.test(text)) {
      const level=/\b(?:advantageous|added advantage|preferred|not essential)\b/i.test(text)?'preferred':
        /\b(?:must|required|essential)\b/i.test(text)?'required':'unclear';
      add(line,'other',level,'Holding a driving licence is an applicant credential, separate from submitting its copy.');
    }
    if(readiness.test(text))
      add(line,'other','required','Explicit current selection-test readiness, on its own source line.');
    if(disclaimer.test(text)&&!hints.has(line)) {
      evidence.reviewPolicy.scopes.push({span:[line,line],applicability:'context'});
      evidence.requiredLineNumbers=evidence.requiredLineNumbers.filter(value=>value!==line);
      delete evidence.fixedRoles[`L${line}`];
    }
  }
  evidence.evidenceHints=[...hints.values()].sort((a,b)=>a.line-b.line);
  evidence.requiredLineNumbers=[...new Set([...evidence.requiredLineNumbers,...hints.keys()])].sort((a,b)=>a-b);
  for(const hint of hints.values())if(hint.state==='stated')evidence.fixedRoles[`L${hint.line}`]='condition';
  evidence.reviewPolicy.scopes.sort((a,b)=>a.span[0]-b.span[0]);
  return evidence;
}
