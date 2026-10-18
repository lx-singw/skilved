import {locationCompletenessPolicy} from './location-completeness.mjs';
import {practicalEvidencePolicy} from './practical-evidence.mjs';
import {isPromotionalLine} from './source-lines.mjs';

export const LOCATION_SPAN_INSTRUCTION = `
locationSpanHints supplies exact recognised source passages, never city/province/country values.
Read the source and retain every supported stated place. When values occur in separate passages,
location evidence must be ONE inclusive contiguous range covering every claimed value.
In particular, a work-base sentence naming a city does not support a province found in a later table.
enclosingSpan, when non-null, is a bounded candidate covering the recognised passages, not a
completed fact or proof of completeness. Use it only if it supports all returned location values
and stays in the selected programme scope. Otherwise select other complete supporting evidence
or preserve uncertainty for review; do not drop a stated place just to fit a shorter span.
For numbered output return that complete span. For quote-based output copy its entire source
text, including intervening lines. Never concatenate separate passages or omit intervening text.
Null enclosingSpan does not mean the notice has no location. Hints are not exhaustive and do
not resolve conflicting places, infer geography, establish attendance/coverage or verify an employer.
Code will not widen or repair the returned location evidence.`;

const label=/^((?:(?:Work|Job|Training) )?Locations?|Worksites?)\s*(?::\s*(.*)|\s*)$/i;
const blocked=/^(?:Residence(?: requirements)?|Residential address|Contact(?: details| information| address)?|Postal address|Company address|Employer address|Head office address)\s*:?$/i;
const reset=/^(?:Job|Vacancy|Position) details\s*:?$/i;
const simple=text=>text.length<=200&&/^[\p{Lu}][\p{L}\p{M} ’'.,-]*$/u.test(text)&&
  !/\b(?:if|unless|may|might|could|either|or|not|no|unknown|unspecified|tba|tbc|all provinces|nationwide|remote|hybrid|contact|reside|address|office|centre|center|salary|closing|requirements|apply|duties|reference|qualifications|summary|duration|deadline|documents|benefits)\b/i.test(text);

/** Advisory source ranges only. No returned model field or evidence is changed. */
export function locationSpanHints(candidate) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n'),excluded=practicalEvidencePolicy(candidate).publisherPreparationSpans;
  const inScope=i=>!candidate.programmeScope||candidate.programmeScope.includedSpans?.some(([first,last])=>i+1>=first&&i+1<=last);
  const permitted=i=>i>=0&&i<lines.length&&inScope(i)&&!excluded.some(([first,last])=>i+1>=first&&i+1<=last)&&!isPromotionalLine(lines[i]);
  const allowed=([first,last])=>{for(let i=first-1;i<last;i++)if(!permitted(i))return false;return true;};
  const found=new Map(),labels=[];
  const add=span=>{if(allowed(span))found.set(span.join(':'),{span:[...span],originalText:lines.slice(span[0]-1,span[1]).join('\n')});};
  for(const h of locationCompletenessPolicy(candidate).obligations)add(h.span);
  let otherContext=false;
  for(let i=1;i<lines.length;i++) {
    if(!permitted(i))continue;
    const text=lines[i].trim();
    if(blocked.test(text)||/\b(?:must reside|residential address|contact address)\b/i.test(text)){otherContext=true;continue;}
    if(reset.test(text))otherContext=false;
    const match=text.match(label);
    if(!match)continue;
    const qualified=/^(?:Work|Job|Training)/i.test(match[1]);
    if(otherContext&&!qualified)continue;
    const last=match[2]?i:i+1;
    if(!permitted(last)||!match[2]&&/s$/i.test(match[1]))continue; // Do not hint only the first row of a location list.
    const value=(match[2]||lines[last]).trim();
    if(!simple(value))continue;
    if(!match[2]&&permitted(last+1)&&simple(lines[last+1].trim()))continue;
    add([i+1,last+1]);labels.push(value.normalize('NFKC').toLowerCase());
  }
  const passages=[...found.values()].sort((a,b)=>a.span[0]-b.span[0]||a.span[1]-b.span[1]);
  let enclosingSpan=null;
  if(passages.length&&new Set(labels).size<=1) {
    const span=[passages[0].span[0],Math.max(...passages.map(p=>p.span[1]))];
    if(allowed(span)&&lines.slice(span[0]-1,span[1]).join('\n').length<=4000)enclosingSpan=span;
  }
  return {version:'source_location_spans_v1',passages,enclosingSpan};
}
