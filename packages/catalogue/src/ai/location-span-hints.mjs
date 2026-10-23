import {locationCompletenessPolicy} from './location-completeness.mjs';
import {practicalEvidencePolicy} from './practical-evidence.mjs';
import {isPromotionalLine} from './source-lines.mjs';
import {attendanceEvidencePolicy} from './attendance-evidence-hints.mjs';

export const LOCATION_SPAN_INSTRUCTION = `
locationSpanHints supplies exact recognised source passages, never city/province/country values.
Read the source and retain every supported stated place. When values occur in separate passages,
location evidence must be ONE inclusive contiguous range covering every claimed value.
In particular, a work-base sentence naming a city does not support a province found in a later table.
recommendedSpan is a bounded source candidate, not a completed fact or proof of completeness.
Recognised supported attendance labels are included with place passages in recommendedSpan.
If you return that attendance value, retain its entire labelled passage in location evidence.
A place-only span does not support a working mode found elsewhere. This recommendation neither
fills attendance nor infers it from the place; unsupported/conflicting labels supply no mode hint.
titleAlternatives repeats an exact parenthesised location-label value in the title; replacesSpan
identifies the original label passage. These are alternative supporting passages, not additional
places or geography. Prefer the shorter recommendedSpan only if it supports every returned value,
retains all required work-base/typed-label evidence and stays in the selected programme scope.
Otherwise select other complete supporting evidence
or preserve uncertainty for review; do not drop a stated place just to fit a shorter span.
For numbered output return that complete span. For quote-based output copy its entire source
text, including intervening lines. Never concatenate separate passages or omit intervening text.
Null recommendedSpan does not mean the notice has no location. Hints are not exhaustive and do
not resolve conflicting places, infer geography, establish attendance/coverage or verify an employer.
Code will not widen or repair the returned location evidence.`;

const label=/^((?:(?:Work|Job|Training) )?Locations?|Worksites?)\s*(?::\s*(.*)|\s*)$/i;
const blocked=/^(?:Residence(?: requirements)?|Residential address|Contact(?: details| information| address)?|Postal address|Company address|Employer address|Head office address)\s*:?$/i;
const reset=/^(?:Job|Vacancy|Position) details\s*:?$/i;
const simple=text=>text.length<=200&&/^[\p{Lu}][\p{L}\p{M} ’'.,–—-]*$/u.test(text)&&
  !/\b(?:if|unless|may|might|could|either|or|not|no|unknown|unspecified|tba|tbc|all provinces|nationwide|remote|hybrid|contact|reside|address|office|centre|center|salary|closing|requirements|apply|duties|reference|qualifications|summary|duration|deadline|documents|benefits)\b/i.test(text);

/** Advisory source ranges only. No returned model field or evidence is changed. */
export function locationSpanHints(candidate) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n'),excluded=practicalEvidencePolicy(candidate).publisherPreparationSpans;
  const inScope=i=>!candidate.programmeScope||candidate.programmeScope.includedSpans?.some(([first,last])=>i+1>=first&&i+1<=last);
  const permitted=i=>i>=0&&i<lines.length&&inScope(i)&&!excluded.some(([first,last])=>i+1>=first&&i+1<=last)&&!isPromotionalLine(lines[i]);
  const allowed=([first,last])=>{for(let i=first-1;i<last;i++)if(!permitted(i))return false;return true;};
  const found=new Map(),labels=[],mandatory=new Set();
  const add=span=>{if(allowed(span))found.set(span.join(':'),{span:[...span],originalText:lines.slice(span[0]-1,span[1]).join('\n')});};
  for(const h of locationCompletenessPolicy(candidate).obligations){add(h.span);mandatory.add(h.span.join(':'));}
  const attendance=attendanceEvidencePolicy(candidate);
  if(attendance.status==='supported')for(const h of attendance.labels){add(h.span);mandatory.add(h.span.join(':'));}
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
    const span=[i+1,last+1];add(span);labels.push({value,span});
  }
  const passages=[...found.values()].sort((a,b)=>a.span[0]-b.span[0]||a.span[1]-b.span[1]);
  const range=selected=>{
    if(!selected.length)return null;
    const span=[Math.min(...selected.map(p=>p.span[0])),Math.max(...selected.map(p=>p.span[1]))];
    return allowed(span)&&quoteLength(span)<=4000?span:null;
  };
  const quoteLength=span=>lines.slice(span[0]-1,span[1]).join('\n').length;
  let recommendedSpan=null,titleAlternatives=[];
  if(passages.length&&new Set(labels.map(row=>row.value.normalize('NFKC').toLowerCase())).size<=1) {
    recommendedSpan=range(passages);
    // Only exact, single parenthesised repetitions of recognised labels qualify.
    // Mandatory work-base/typed-label passages may never be replaced by a title.
    const brackets=[...candidate.title.matchAll(/\(([^()]*)\)/g)];
    const eligible=permitted(0)&&!/[\r\n]/.test(candidate.title)&&brackets.length===1&&!/[()]/.test(candidate.title.replace(brackets[0][0],''))&&
      !/\b(?:residen\w*|contact|postal|relocat\w*|no|not|never|without|excluding|except|if|unless|either|or|remote|nationwide)\b/i.test(candidate.title);
    const replaced=eligible?labels.filter(row=>!mandatory.has(row.span.join(':'))&&
      !/,|\band\b/i.test(row.value)&&brackets[0][1].trim().toLowerCase()===row.value.toLowerCase()):[];
    if(replaced.length){
      const keys=new Set(replaced.map(row=>row.span.join(':'))),title={span:[1,1],originalText:lines[0]};
      const shorter=range([...passages.filter(p=>!keys.has(p.span.join(':'))),title]);
      if(shorter&&(!recommendedSpan||quoteLength(shorter)<quoteLength(recommendedSpan))){
        recommendedSpan=shorter;titleAlternatives=replaced.map(row=>({...title,replacesSpan:[...row.span]}));
      }
    }
  }
  return {version:'source_location_spans_v3',passages,titleAlternatives,recommendedSpan};
}
