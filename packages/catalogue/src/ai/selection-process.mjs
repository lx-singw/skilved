import {DomainError} from '../config.mjs';
import {practicalEvidencePolicy} from './practical-evidence.mjs';
import {promotionalLineNumbers,containsPromotionalContent} from './source-lines.mjs';

const heading = /^(?:(?:recruitment(?: and selection)?|selection) process|selection assessments|process)\s*:?$/i;
const item = /^(?:[•*\-–]|\d{1,2}[.)])\s+\S/;
const assessment = /\b(?:assessments?|tests?|testing|interviews?|screening|clearance|verification|background checks?|reference checks?)\b/i;

/** Narrow complete-list hints; unrecognised prose still requires semantic review. */
export function selectionProcessPolicy(candidate) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
  const excluded=practicalEvidencePolicy(candidate).publisherPreparationSpans;
  const promotions=new Set(promotionalLineNumbers(candidate));
  const permitted=i=>i>=0&&i<lines.length&&!promotions.has(i+1)&&
    !excluded.some(([a,b])=>i+1>=a&&i+1<=b)&&
    (!candidate.programmeScope||candidate.programmeScope.includedSpans?.some(([a,b])=>i+1>=a&&i+1<=b));
  const blocks=[];
  for(let first=0;first<lines.length;first++) {
    const label=lines[first].trim().replace(/^\d{1,2}[.)]\s+/, '');
    if(!permitted(first)||!heading.test(label))continue;
    let last=first;
    while(last+1<lines.length&&item.test(lines[last+1].trim()))last++;
    if(last===first||last-first>30||!lines.slice(first,last+1).every((_,offset)=>permitted(first+offset)))continue;
    if(containsPromotionalContent(lines.slice(first,last+1).map(line=>line.trim().replace(/^(?:[•*\-–]|\d{1,2}[.)])\s+/,'')).join('\n')))continue;
    // A bare "Process" label also describes work. Require assessment language
    // in every list item before treating that generic label as recruitment.
    if(/^process\s*:?$/i.test(label)&&!lines.slice(first+1,last+1).every(line=>assessment.test(line)))continue;
    const originalText=lines.slice(first,last+1).join('\n');
    if(originalText.length>4000)continue;
    blocks.push({span:[first+1,last+1],originalText});
    first=last;
  }
  return {version:'source_selection_process_v1',blocks};
}

export function assertSelectionProcessCompleteness(candidate,fact) {
  for(const block of selectionProcessPolicy(candidate).blocks) {
    if(fact?.state!=='stated'||typeof fact.value!=='string'||fact.value!==fact.quote||
        !fact.value.includes(block.originalText))throw new DomainError('AI_SELECTION_PROCESS_UNRESOLVED');
  }
}
