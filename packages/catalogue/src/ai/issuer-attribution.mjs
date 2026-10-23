import {DomainError} from '../config.mjs';
import {isPromotionalLine} from './source-lines.mjs';
import {practicalEvidencePolicy} from './practical-evidence.mjs';

export const ISSUER_ATTRIBUTION_INSTRUCTION = `
issuerAttributionPolicy concerns the advertising company/recruiter, not proof of the legal employer.
A supported explicit Company/Employer/Recruiter label controls issuer: copy its supportedName and
cite its entire labelled line. Keep the vacancy's branded title; do not replace the labelled issuer
with a brand from that title or infer that two organisations are legal aliases.
unresolved labels require ambiguous/conflicting issuer with null value and all labelled evidence.
no_label supplies no default; continue using source-supported attribution. These source-local
labels do not verify employer identity, application ownership or vacancy availability.`;

const key=text=>text.trim().replace(/\s+/g,' ').toLowerCase();
// Only the notice's metadata prelude; employment-history and application sections
// can name other organisations without identifying the advertising issuer.
const boundary=/^(?:job (?:summary|description)|(?:minimum |entry )?requirements|qualifications(?: and experience)?|responsibilities|(?:main )?duties(?: and responsibilities)?|experience|employment history|previous employment|references|documents to prepare|how to apply|application(?: process| documents)?|about(?: us| the (?:role|company)))(?:\s*:.*)?$/i;
const safeName=text=>text.length<=200&&/\p{L}/u.test(text)&&/^[\p{L}\p{N}\p{M} &.'’(),–-]+$/u.test(text)&&
  !/\b(?:not|no|unknown|unconfirmed|tba|tbc|or|either)\b/i.test(text)&&
  !/^(?:recent\s*jobs|student\s*room)(?:\.co\.za)?$/i.test(text);

export function issuerAttributionPolicy(candidate){
 const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n'),excluded=practicalEvidencePolicy(candidate).publisherPreparationSpans,labels=[];
 for(let i=1;i<lines.length;i++){
  const line=lines[i],text=line.trim().replace(/^\d{1,2}[.)]\s+(?=[A-Za-z])/,'');
  if(boundary.test(text))break;
  if(isPromotionalLine(line)||excluded.some(([a,b])=>a<=i+1&&i+1<=b)||
    candidate.programmeScope&&!candidate.programmeScope.includedSpans?.some(([a,b])=>a<=i+1&&i+1<=b))continue;
  const m=text.match(/^(Company|Employer|Recruiter)\s*:\s*(.*)$/i);if(!m)continue;
  labels.push({label:m[1].toLowerCase(),value:m[2].trim(),span:[i+1,i+1],originalText:line});
 }
 const names=new Set(labels.map(l=>key(l.value))),supported=labels.length>0&&labels.every(l=>safeName(l.value))&&names.size===1;
 return {version:'source_issuer_attribution_v1',status:!labels.length?'no_label':supported?'supported':'unresolved',supportedName:supported?labels[0].value:null,labels};
}

/** Reject unsupported attribution without replacing the answer or aliasing names. */
export function assertIssuerAttribution(candidate,fact){
 const policy=issuerAttributionPolicy(candidate);if(policy.status==='no_label')return;
 const fail=()=>{throw new DomainError('AI_ISSUER_ATTRIBUTION_UNRESOLVED');};
 if(policy.status==='supported'){
  if(fact?.state!=='stated'||typeof fact.value!=='string'||key(fact.value)!==key(policy.supportedName)||
    !policy.labels.some(l=>fact.quote?.includes(l.originalText)))fail();
 }else if(!['ambiguous','conflicting'].includes(fact?.state)||fact.value!==null||
   !policy.labels.every(l=>fact.quote?.includes(l.originalText)))fail();
}
