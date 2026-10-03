import {DomainError} from '../config.mjs';
import {wholeSourcePayload} from './whole-source.mjs';
import {isPromotionalLine} from './source-lines.mjs';

export const REQUIREMENT_REVIEW_POLICY_VERSION='entry_applicability_v1';
const fail=code=>{throw new DomainError(code);};
const label=line=>line.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s·•*-]+/u,'');
const boundary=/^(?:minimum requirements|requirements|qualifications(?: and experience)?|education(?:\s*\/\s*experience)?|key skills|required skills|how to apply|application process|closing date|benefits|duties|responsibilities)\s*:?$/i;
// Narrow source cues implement an explicit entry-versus-employment policy.
// Unrecognized wording is still a model judgment, not silently excluded.
const postSelection=line=>/\b(?:successful|appointed|selected)\s+candidate\b/i.test(line)&&
  /\b(?:expected to|will|must)\b/i.test(line)&&/\b(?:demonstrate|live|embody)\b/i.test(line)&&
  /\b(?:identity|values|principles|culture)\b/i.test(line);
const conditionalPreference=line=>/\bpreference\b/i.test(line)&&/\bmay be given\b/i.test(line)&&
  /\b(?:where|if|subject to|depending on|provided that)\b/i.test(line);
const documentGate=line=>/^(?:CV(?:s|['’]s)?|applications?|curriculum vitae)\b/i.test(line)&&
  /\bwith\b/i.test(line)&&/\b(?:statement of results|certificates?|supporting documents)\b/i.test(line)&&
  /\bwill be considered\b/i.test(line)&&! /\b(?:preferred|advantage|optional|if|may|might|could)\b/i.test(line);
const profileHeading=/^(?:the|our) ideal candidate (?:will have|should have|has)\s*:?$/i;
const profileEnd=line=>boundary.test(line)||/^applications? for .+\bintake\s+close\b/i.test(line)||isPromotionalLine(line);

export function requirementReviewPolicy(candidate) {
  const source={title:candidate?.title,sourceText:candidate?.sourceText,applicationCandidates:[]};
  return requirementReviewPolicyWithEvidence(source,wholeSourcePayload(source),REQUIREMENT_REVIEW_POLICY_VERSION);
}
export function requirementReviewPolicyWithEvidence(source,payload,version,sectionEnd=null) {
  const lines=`${source.title}\n${source.sourceText}`.split('\n');
  const scopes=payload.unresolvedEvidenceSpans.map(span=>({span,applicability:'preparation'})),conditions=[];
  const originalRequired=new Set(payload.requiredLineNumbers);
  const inside=line=>scopes.some(({span:[first,last]})=>first<=line&&line<=last);
  for(let index=0;index<lines.length;index++) {
    const number=index+1,text=label(lines[index]);if(inside(number))continue;
    if(profileHeading.test(text)) {
      let end=index+1;while(end<lines.length&&!profileEnd(label(lines[end]))&&!sectionEnd?.(label(lines[end])))end++;
      if(end===lines.length)fail('AI_REVIEW_POLICY_SCOPE_UNBOUNDED');
      // A list introduction is a heading, not a standalone applicant fact.
      payload.evidenceHints=payload.evidenceHints.filter(hint=>hint.line!==number);
      payload.requiredLineNumbers=payload.requiredLineNumbers.filter(line=>line!==number);
      delete payload.fixedRoles[`L${number}`];scopes.push({span:[number,number],applicability:'context'});
      for(let at=index+1;at<end;at++)if(lines[at].trim()&&!payload.evidenceHints.some(hint=>hint.line===at+1)) {
        const entry=label(lines[at]);
        // An optional subject subclause does not make a whole qualification
        // preferred. Plain ideal-profile wording has unstated strength.
        const level=/\b(?:must|required)\b/i.test(entry)?'required':
          /^(?:preferred|advantageous)\b|\b(?:added advantage|is advantageous)\b/i.test(entry)?'preferred':'unclear';
        payload.evidenceHints.push({line:at+1,reason:'Condition in a bounded ideal-candidate list; strength is not invented.',level});
        payload.requiredLineNumbers.push(at+1);
      }
    } else if(postSelection(text)) {
      let end=index+1;
      while(end<lines.length&&!boundary.test(label(lines[end]))&&!sectionEnd?.(label(lines[end]))&&!isPromotionalLine(lines[end]))end++;
      if(end===lines.length)fail('AI_REVIEW_POLICY_SCOPE_UNBOUNDED');
      const span=[number,end];
      if(scopes.some(({span:[first,last]})=>first<=span[1]&&last>=span[0])||
        payload.requiredLineNumbers.some(line=>number<=line&&line<=end))fail('AI_REVIEW_POLICY_CONFLICT');
      scopes.push({span,applicability:'post_selection'});index=end-1;
    } else if(conditionalPreference(text)) {
      if(payload.fixedRoles[`L${number}`]==='condition')fail('AI_REVIEW_POLICY_CONFLICT');
      scopes.push({span:[number,number],applicability:'conditional'});
    } else if(originalRequired.has(number)&&documentGate(text)) {
      const hint=payload.evidenceHints.find(item=>item.line===number);
      if(hint&&(['ambiguous','conflicting'].includes(hint.state)||hint.kind&&hint.kind!=='document'||hint.level&&hint.level!=='required'))
        fail('AI_REVIEW_POLICY_CONFLICT');
      conditions.push({line:number,kind:'document',strength:'mandatory'});
    }
  }
  scopes.sort((a,b)=>a.span[0]-b.span[0]);
  payload.requiredLineNumbers=[...new Set(payload.requiredLineNumbers)].sort((a,b)=>a-b);
  payload.evidenceHints.sort((a,b)=>a.line-b.line);
  return {...payload,reviewPolicy:{version,scopes,conditions}};
}
