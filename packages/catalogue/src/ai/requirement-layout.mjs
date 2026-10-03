import {isPromotionalLine} from './source-lines.mjs';

// V4+ layout interpretation. Earlier coverage/replays use source-lines.mjs.
// Normalize heading decoration for recognition; never change retained source text.
const label = line => line.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u,'');
const heading = /^(?:minimum requirements|requirements|qualifications and experience required|minimum qualifications|entry requirements|desired experience\s*(?:&|and)\s*qualifications?)\s*:?$/i;
const ending = /^(?:main responsibilities|responsibilities|duties|main training\/duties|closing date|how to apply|application process|benefits|work level|job type|salary|apply now)\s*:?(?:\s+.*)?$/i;
const marker = /^(?:you need one of the following|one of the following)\s*:?$/i;
const connective = /^(?:you need one of the following|one of the following|either|or|and|you should have|advantageous|preferred)\s*:?$/i;
const qualification = /^(?:national senior certificate\b|grade\s+12\b|matric\b|N[1-6]\b|NCV\s+level\s+[1-6]\b)/i;
// Only plain subject lines after a qualification ending in ':' can be joined.
// Unknown prose, documents, preferences and conditionals make this rule abstain.
const subject = /^(?:mathematics|physical science|science|engineering science|electrical trade theory)(?:\s+and\s+(?:mathematics|physical science|science|engineering science|electrical trade theory))*[.]?$/i;
const uncertain = /\b(?:if|unless|except|otherwise|provided|preferred|advantageous|desirable)\b/i;

export function requirementLayout(candidate,{sectionEnd=null}={}) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n'),sections=[];
  let start=null;
  for(let index=0;index<lines.length;index++) {
    const text=label(lines[index]);
    if(heading.test(text)) {
      if(start!==null) sections.push([start,index]);
      start=index+1;
    } else if(start!==null && (ending.test(text)||sectionEnd?.(text)||isPromotionalLine(lines[index]))) {
      sections.push([start,index]);start=null;
    }
  }
  // Unbounded text does not imply a requirements section ending at the footer.
  const requiredLineNumbers=sections.flatMap(([from,until])=>lines.slice(from,until).flatMap((line,index)=>
    line.trim()&&!connective.test(label(line)) ? [from+index+1] : []));
  const alternativeGroups=[];
  for(const [from,until] of sections) {
    const entries=lines.slice(from,until).flatMap((text,index)=>text.trim()?[{text:text.trim(),line:from+index+1}]:[]);
    if(!entries.length||!marker.test(entries[0].text))continue;
    const branches=[];let branch=null,valid=true;
    for(const entry of entries.slice(1)) {
      if(uncertain.test(entry.text)){valid=false;break;}
      if(qualification.test(entry.text)) {
        if(branch?.nested && branch.span[0]===branch.span[1]){valid=false;break;}
        branch={span:[entry.line,entry.line],nested:/:$/.test(entry.text)};branches.push(branch);
      } else if(branch?.nested && subject.test(entry.text)) branch.span[1]=entry.line;
      else {valid=false;break;}
    }
    if(branch?.nested && branch.span[0]===branch.span[1])valid=false;
    if(valid && branches.length>=2 && branches.length<=30) alternativeGroups.push({
      group:alternativeGroups.length+1,markerLine:entries[0].line,spans:branches.map(branch=>branch.span),
    });
  }
  return {requiredLineNumbers,alternativeGroups};
}
