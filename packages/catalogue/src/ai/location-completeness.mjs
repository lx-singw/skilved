import {DomainError} from '../config.mjs';
import {practicalEvidencePolicy} from './practical-evidence.mjs';
import {isPromotionalLine} from './source-lines.mjs';

const normalise=text=>text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const uncertain=/\b(?:if|unless|may|might|could|should|would|either|or|depending|subject to|not|never|no|cannot|unknown|unspecified|tba|tbc|relocat\w*|residen\w*)\b|\b(?:won't|can't)\b/i;
const generic=/\b(?:office|offices|branch|branches|plant|factory|centre|center|campus|site|sites|warehouse|workshop|headquarters|facility|facilities|premises|academy|region|country|province|location|town|city|home|remote|online|nationwide|nationally|locally|street|road|avenue|drive)\b/i;
const name=text=>text.length<=100&&/^[\p{L}][\p{L}\p{M} .’'_-]*$/u.test(text)&&!uncertain.test(text)&&!generic.test(text)&&
  !/\b(?:at|in|of|to|near|between|within|from|on|for|and|with|the|our|their)\b/i.test(text);
const base=/^(?:the )?(?:(?:successful|selected) (?:candidates?|applicants?|apprentices?)|apprentices|learners|trainees|interns|you) (?:will|shall) be based (?:at|in) (.+)$/i;

/** Narrow source obligations, not a place-name classifier or geographical lookup.
 * A work-base name can include an employer prefix; only its terminal place must
 * be represented. Unrecognised prose remains subject to semantic validation. */
export function locationCompletenessPolicy(candidate) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
  const excluded=practicalEvidencePolicy(candidate).publisherPreparationSpans;
  const permitted=i=>i<lines.length&&!excluded.some(([first,last])=>i+1>=first&&i+1<=last)&&!isPromotionalLine(lines[i]);
  const obligations=[];let workLocationStart=null;
  for(let i=0;i<lines.length;i++) {
    if(!permitted(i)){workLocationStart=null;continue;}
    const text=lines[i].trim();
    if(/^(?:Work|Job|Training) locations?\s*:?$/i.test(text)){workLocationStart=i;continue;}
    const label=text.match(/^(?:(Work|Job|Training) )?(City|Town|Province|Country)\s*(?::\s*(.*)|\s*)$/i);
    let first=i,last=i,field,values;
    if(label&&(label[1]||workLocationStart!==null)) {
      first=label[1]?i:workLocationStart;
      last=label[3]?i:i+1;
      if(!permitted(last))continue;
      const value=(label[3]||lines[last]).trim().replace(/[.]$/,'');
      values=value.split(/\s*,\s*|\s+and\s+/i);
      if(!values.every(name))continue;
      field={city:'city',town:'city',province:'province',country:'country'}[label[2].toLowerCase()];
    } else {
      workLocationStart=null;
      const match=text.match(base);
      if(!match||uncertain.test(text)||text.length>4000)continue;
      // Accept a simple affirmative base followed by a separate future action.
      // Addresses, alternatives, unnamed facilities and complex clauses abstain.
      values=match[1].split(/\s+and\s+(?:will|shall)\s+/i)[0].replace(/[.]$/,'').split(/\s*,\s*|\s+and\s+/i);
      if(!values.every(value=>name(value)&&/\p{Lu}/u.test(value)))continue;
      field='work_base';
    }
    obligations.push({field,values,span:[first+1,last+1],originalText:lines.slice(first,last+1).join('\n')});
    i=last;
  }
  return {version:'source_location_completeness_v1',obligations};
}

// This is an enforcement-only check. Advisory spans and model requests stay
// unchanged; a province or city never supplies an unwritten country.
function compoundCountryObligations(candidate) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
  const excluded=practicalEvidencePolicy(candidate).publisherPreparationSpans;
  return lines.flatMap((line,index)=>{
    if(excluded.some(([first,last])=>index+1>=first&&index+1<=last)||isPromotionalLine(line)||
      candidate.programmeScope&&!candidate.programmeScope.includedSpans?.some(([first,last])=>index+1>=first&&index+1<=last))return [];
    const match=line.trim().match(/^(?:Work|Job|Training) location\s*:\s*(.+)$/i);
    if(!match)return [];
    const parts=match[1].replace(/[.]$/,'').split(/\s+[–—-]\s+/u);
    if(parts.length!==3||!parts.every(name)||!/^(?:South Africa|ZA)$/i.test(parts[2]))return [];
    return [{field:'country',values:[parts[2]],span:[index+1,index+1],originalText:line}];
  });
}

/** Reject omissions without filling values, widening quotes or changing answers. */
export function assertLocationCompleteness(candidate,fact) {
  const fail=()=>{throw new DomainError('AI_LOCATION_COMPLETENESS_UNRESOLVED');};
  for(const hint of [...locationCompletenessPolicy(candidate).obligations,...compoundCountryObligations(candidate)]) {
    if(fact.state!=='stated'||!fact.quote?.includes(hint.originalText))fail();
    for(const expected of hint.values) {
      const target=normalise(expected),fields=hint.field==='work_base'?['city','province','country']:[hint.field];
      const retained=fact.value.places.some(place=>fields.some(field=>{
        const value=place[field];
        if(!value)return false;
        const names=field==='country'&&value==='ZA'?['ZA','South Africa']:[value];
        return names.some(name=>{
          const actual=normalise(name);
          return hint.field==='work_base'?target===actual||target.endsWith(' '+actual):target===actual;
        });
      }));
      if(!retained)fail();
    }
  }
}
