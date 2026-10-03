import {boundedReviewEvidence} from './bounded-review-policy.mjs';
import {DomainError} from '../config.mjs';

export const GUARDED_REVIEW_POLICY_VERSION='entry_applicability_v3';
const label=text=>text.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s·•*-]+/u,'');
const qualification=/^(?:a\s+)?(?:national senior certificate\b|grade\s+12\b|matric\b|N[1-6]\b|NC\(?V\)?\s+level\s+[1-6]\b)/i;
const connector=/\b(?:and|or|either|both|all|one of|plus|together with|in addition|alternatively)\b/i;
const introduction=/^(?:applicants|candidates) (?:must|are to|are required to) (?:submit|provide) the following documents\s*:\s*$/i;
const document=/^(?:a\s+)?(?:comprehensive\s+)?(?:CV\b|curriculum vitae\b|certified\s+(?:ID\s+copy\b|copies?\s+of\s+(?:qualifications|academic results|certificates)\b))/i;
const conditional=/\b(?:if|unless|where|when|subject to|may|might|could|optional|preferred|advantageous|previous|past|successful|appointed|selected|after appointment|not required|need not|do not submit|will not|employer provides)\b/i;
const boundary=/^(?:minimum requirements|requirements|qualifications|how to apply|application process|closing date|commencement date|start date|duration(?: of (?:program(?:me)?|apprenticeship))?|general instructions|key responsibilities|responsibilities|duties|enquiries)\s*:?$/i;

// Development-only source constraints. Unknown qualifications are preserved,
// never resolved into an inferred ALL/ANY. Conditional/future wording abstains.
export function guardedReviewEvidence(candidate) {
  const evidence=boundedReviewEvidence(candidate),lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
  evidence.reviewPolicy.version=GUARDED_REVIEW_POLICY_VERSION;
  const required=new Set(evidence.requiredLineNumbers);
  const caveated=number=>{
    for(let at=number-2;at>=0;at--){const text=label(lines[at]);if(boundary.test(text))break;
      if(conditional.test(text)||/\b(?:after selection|future intake)\b/i.test(text))return true;}
    return false;
  };
  const occupied=line=>evidence.reviewPolicy.scopes.some(({span:[first,last]})=>first<=line&&line<=last)||
    evidence.reviewPolicy.conditions.some(row=>row.line===line)||evidence.evidenceHints.some(row=>row.line===line)||
    evidence.alternativeGroups.some(group=>group.spans.some(([first,last])=>first<=line&&line<=last));
  const scope=(first,last,applicability)=>{
    if(Array.from({length:last-first+1},(_,index)=>first+index).some(occupied))throw new DomainError('AI_REVIEW_POLICY_CONFLICT');
    evidence.reviewPolicy.scopes.push({span:[first,last],applicability});
  };
  for(let index=0;index<lines.length;index++) {
    const line=index+1;
    if(required.has(line)&&!occupied(line)&&/^all of the following\s*:?$/i.test(label(lines[index]))) {
      scope(line,line,'context');required.delete(line);delete evidence.fixedRoles[`L${line}`];
    }
  }
  evidence.requiredLineNumbers=[...required];
  for(let index=0;index<lines.length;index++) {
    const first=index+1,text=label(lines[index]);
    if(!required.has(first)||occupied(first)||!qualification.test(text))continue;
    let end=index;
    while(end+1<lines.length&&required.has(end+2)&&!occupied(end+2)&&qualification.test(label(lines[end+1])))end++;
    // Qualifications may contain embedded subject ANDs; only connectors
    // between separate qualifications establish the list's relationship.
    const prior=label(lines[index-1]??'');
    const explicit=/\b(?:one of the following|either|both|all of the following|in addition|alternatively)\b/i.test(prior);
    const values=lines.slice(index,end+1).map(label);
    const linked=values.some(value=>/\b(?:or|either|both|plus|together with|in addition|alternatively)\b|^(?:and|or)\b|\b(?:and|or)\s*[;,.]?$/i.test(value));
    if(end>index&&!explicit&&!linked&&!values.some(value=>conditional.test(value)||/:$/.test(value)))scope(first,end+1,'uncertain');
    index=end;
  }
  for(let index=0;index<lines.length;index++) {
    const first=index+1,text=label(lines[index]);
    if(occupied(first)||caveated(first)||!introduction.test(text))continue;
    const entries=[];let end=index+1;
    while(end<lines.length&&document.test(label(lines[end]))) {
      const value=label(lines[end]);
      if(occupied(end+1)||conditional.test(value)||connector.test(value)||entries.length===10){entries.length=0;break;}
      entries.push(end+1);end++;
    }
    // An explicit current list with independently stated document entries.
    // Empty/conditional/alternative lists are left to the model unchanged.
    if(!entries.length)continue;
    scope(first,first,'context');
    for(const line of entries)evidence.reviewPolicy.conditions.push({line,kind:'document',strength:'mandatory'});
  }
  for(let index=0;index<lines.length;index++) {
    const line=index+1,text=label(lines[index]);if(occupied(line)||conditional.test(text)||caveated(line))continue;
    const delivery=/^applications (?:must|should|are to|are required to) be (?:hand delivered|couriered|posted)\b/i.test(text);
    const reference=/^please mark (?:the|your) application with\b.*\b(?:post title|reference number)\b/i.test(text);
    if(delivery||reference)evidence.reviewPolicy.conditions.push({line,kind:'document',strength:'mandatory'});
  }
  // A submission cue inside unbounded past/future prose must not acquire
  // current status merely because its own line omits the caveat.
  // Existing preparation/post-selection scopes already take precedence;
  // unrecognized headings and wording continue to require model judgment.
  evidence.reviewPolicy.scopes.sort((a,b)=>a.span[0]-b.span[0]);
  evidence.reviewPolicy.conditions.sort((a,b)=>a.line-b.line);
  return evidence;
}
