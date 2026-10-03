import {requirementEvidence} from './requirement-evidence.mjs';
import {isPromotionalLine} from './source-lines.mjs';
import {DomainError} from '../config.mjs';

const label=line=>line.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s·•*-]+/u,'');
const behavioral=/^(?:behavio[u]?ral(?: competencies)?|personal attributes|attributes)\s*:?$/i;
const boundary=/^(?:attributes|personal attributes|behavio[u]?ral(?: competencies)?|minimum requirements|requirements|qualifications|key skills|required skills|duties|responsibilities|main responsibilities|preparation(?: for .+)?|how to apply|application process|closing date|benefits)\s*:?$/i;
const subject=/^(?:mathematics(?: literacy)?|maths|technical mathematics|physical sciences?|engineering science|science|english|afrikaans)(?:\s+(?:high(?:er)? grade))?\.?$/i;
const qualification=/^(?:national senior certificate\b|grade\s+12\b|matric\b|N[1-6]\b|NCV\s+level\s+[1-6]\b).*:$/i;
const caveat=/\b(?:prepare for|preparation for)\b.*\b(?:requirements|eligibility)\b.*\b(?:previous|past|prior)\b.*\bintake\b/i;
const confirmed=/\bcurrent application(?: page)?\b.*\b(?:specifically says|requires|must)\b/i;
const section=/^(?:\d+[.)]\s*)?(?:trades(?: to prepare for)?|requirements|minimum requirements|how to apply|where to apply|application process|benefits|stipend|closing date)\s*:?$/i;
const completion=/\bapplication is only complete (?:after|once|when)\b.*\b(?:click|press|submit|submission)\b/i;

// Versioned supplements: earlier evidence selectors/replay remain unchanged.
// These are narrow source constraints, not a complete semantic classifier.
export function requirementContext(candidate,base=requirementEvidence(candidate),sectionEnd=null) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
  const hints=new Map(base.evidenceHints.map(hint=>[hint.line,{...hint}])),primary=new Set(base.requiredLineNumbers);
  const add=(line,reason,constraints)=>{
    const previous=hints.get(line);
    if(['ambiguous','conflicting'].includes(previous?.state))return;
    hints.set(line,{...previous,line,reason,...constraints});
  };
  const unresolvedEvidenceSpans=[];
  for(let index=0;index<lines.length;index++) {
    if(!caveat.test(lines[index]))continue;
    // Scope only to an explicit following boundary or confirmed current rule.
    // Unknown scope stops extraction before spending, rather than guessing.
    let end=index+1;
    while(end<lines.length&&!section.test(label(lines[end]))&&!sectionEnd?.(label(lines[end]))&&!confirmed.test(lines[end])&&!isPromotionalLine(lines[end]))end++;
    if(end===lines.length)throw new DomainError('AI_APPLICABILITY_SCOPE_UNBOUNDED');
    unresolvedEvidenceSpans.push([index+1,end]);index=end-1;
  }
  const uncertain=line=>unresolvedEvidenceSpans.some(([first,last])=>first<=line&&line<=last);
  let nested=false;
  for(let index=0;index<lines.length;index++) {
    const number=index+1,text=label(lines[index]);
    if(primary.has(number)&&qualification.test(text)){nested=true;continue;}
    const isSubject=subject.test(text);
    if(primary.has(number)&&isSubject&&!nested&&!uncertain(number)&&
      !base.alternativeGroups.some(group=>group.spans.some(([first,last])=>first<=number&&number<=last)))
      add(number,'Standalone school subject, separate from a qualification or nested subject list.',{kind:'subjects',state:'stated'});
    if(!isSubject||!primary.has(number))nested=false;
    if(!uncertain(number)&&completion.test(lines[index]))
      add(number,'Explicit final submission condition for a complete application.',{kind:'document',level:'required',state:'stated'});
    if(!behavioral.test(text))continue;
    let end=index+1;
    while(end<lines.length&&!boundary.test(label(lines[end]))&&!sectionEnd?.(label(lines[end]))&&!isPromotionalLine(lines[end]))end++;
    if(end===lines.length)continue; // An unbounded list must not absorb a footer.
    let level='unclear';
    for(let at=index+1;at<end;at++) {
      const value=label(lines[at]);
      if(!value)continue;
      if(/^(?:none|n\/a|not applicable)\.?$/i.test(value)||/^["“”‘’]/.test(value))break;
      if(/^(?:preferred|advantageous)\s*:?$/i.test(value)){level='preferred';continue;}
      if(uncertain(at+1))continue;
      add(at+1,'Applicant behavioral attribute; unstated required/preferred status remains unclear.',
        {kind:'other',level:/\b(?:must|required)\b/i.test(value)?'required':level,state:'stated'});
    }
  }
  const requiredLineNumbers=[...new Set([...primary,...hints.keys(),...unresolvedEvidenceSpans.flatMap(([first,last])=>
    Array.from({length:last-first+1},(_,index)=>first+index))])].sort((a,b)=>a-b);
  return {...base,requiredLineNumbers,evidenceHints:[...hints.values()].sort((a,b)=>a.line-b.line),unresolvedEvidenceSpans};
}
