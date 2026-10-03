import {requirementLayout} from './requirement-layout.mjs';
import {isPromotionalLine} from './source-lines.mjs';

const label=line=>line.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u,'');
const skills=/^(?:key skills|required skills|skills and competencies|skills & competencies)\s*:?$/i;
const boundary=/^(?:desired experience\s*(?:&|and)\s*qualifications?|requirements|minimum requirements|duties|responsibilities|how to apply|apply now|closing date|benefits)\s*:?(?:\s+.*)?$/i;
const invitation=/^(?:if you are looking to\b|join our team\b)/i;
const labels=/^(?:education|company|position|positions|location|reference|job type|department|category|closing date|key requirement)\s*:?$/i;

// V6 adds explicit evidence outside the main requirements section. Unclear
// applicability is preserved as uncertainty, never promoted to hard eligibility.
export function requirementEvidence(candidate,layout=requirementLayout(candidate),sectionEnd=null) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
  const hints=new Map(),primary=new Set(layout.requiredLineNumbers);
  const add=(line,reason,constraints)=>{if(!hints.has(line))hints.set(line,{line,reason,...constraints});};
  let start=null,sectionLevel='unclear';
  for(let index=0;index<lines.length;index++) {
    const text=label(lines[index]);
    if(skills.test(text)){start=index+1;sectionLevel=/^required skills/i.test(text)?'required':'unclear';continue;}
    if(start!==null&&(boundary.test(text)||sectionEnd?.(text)||invitation.test(text)||isPromotionalLine(text))) {
      let level=sectionLevel;
      for(let at=start;at<index;at++)if(lines[at].trim()&&!primary.has(at+1)) {
        if(/^(?:preferred|advantageous)\s*:?$/i.test(label(lines[at]))){level='preferred';continue;}
        const explicit=/\b(?:must|required)\b/i.test(lines[at]);
        add(at+1,'Applicant skill; do not invent required/preferred status when unstated.',{level:explicit?'required':level});
      }
      start=null;
    }
  }
  // As with the main layout, an unbounded list does not silently include a footer.
  let details=false;
  for(let index=0;index<lines.length;index++) {
    const text=label(lines[index]),number=index+1;
    if(/^(?:the|our) ideal candidate (?:will have|should have|has)\b/i.test(text)&&!primary.has(number))
      add(number,'Applicant profile without an explicit hard eligibility rule.',{level:'unclear'});
    if(/\binvit(?:e|es|ing)\s+(?:unemployed\s+)?youth\b.*\bapply\b/i.test(text)&&!primary.has(number))
      add(number,'Audience statement; no numeric age or mandatory eligibility may be inferred.',{kind:'other',level:'unclear',state:'ambiguous'});
    if(/^willing to work overtime\b/i.test(text)&&primary.has(number))
      add(number,'Availability condition stated in the requirements.',{kind:'availability'});
    if(/^important details\s*:?$/i.test(text))details=true;
    if(details&&/^education\s*:?$/i.test(text)&&layout.requiredLineNumbers.length) {
      const value=lines[index+1]?.trim();
      if(value&&!labels.test(value)&&!isPromotionalLine(value)&&!boundary.test(value)) {
        const repeated=layout.requiredLineNumbers.some(line=>lines[line-1].trim()===value);
        if(!repeated)add(index+2,'Secondary education wording differs from main requirements; equivalence or ALL/ANY relationship is unverified.',
          {kind:'education',level:'unclear',state:'ambiguous'});
      }
    }
  }
  return {...layout,requiredLineNumbers:[...new Set([...layout.requiredLineNumbers,...hints.keys()])].sort((a,b)=>a-b),
    evidenceHints:[...hints.values()].sort((a,b)=>a.line-b.line)};
}
