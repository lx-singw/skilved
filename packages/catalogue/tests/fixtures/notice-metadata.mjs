// Authored source and answers only. No employer snapshot or provider response.
import {parseRecentJobsDetail} from '../../src/adapters/recentjobs.mjs';
import {labelCandidate,labelLines,labelWire} from './source-labels.mjs';
export const invitation='Fictional Workshop invites unemployed youth to apply for its apprenticeship.';
export const reference='Requisition ID: APP/TEST-042';
export const regionalBenefits='At Fictional Workshop, we value practical learning. To support our employees, we offer regional comprehensive benefits, including:\nRetirement benefits\nMedical aid';
export const noticeLines=labelLines.flatMap((text,i)=>i===0?[invitation,reference]:text==='What We Offer'?[text,regionalBenefits.split('\n')[0]]:[text]);
export const noticeHtml=`<article class="type-post"><h1 class="entry-title">${labelCandidate.title}</h1><div class="entry-content">${noticeLines.map(s=>`<p>${s}</p>`).join('')}<a href="https://employer.example/apply">Apply now online</a></div></article>`;
export const noticeCandidate=parseRecentJobsDetail({html:noticeHtml,url:labelCandidate.sourceUrl,observedOn:'2026-09-26'});
export const noticeSpan=quote=>{const lines=(noticeCandidate.title+'\n'+noticeCandidate.sourceText).split('\n'),first=lines.indexOf(quote.split('\n')[0])+1;
  if(!first)throw Error('Unknown authored notice passage');return [first,first+quote.split('\n').length-1];};
export function noticeWire() {
  const wire=labelWire(),old=(labelCandidate.title+'\n'+labelCandidate.sourceText).split('\n');
  for(const fact of [wire.issuer,wire.summary,wire.location,wire.deadline,...wire.compensation,...wire.requirements.items]) {
    const quote=old.slice(fact.span[0]-1,fact.span[1]).join('\n');fact.span=noticeSpan(quote===labelLines[0]?invitation:quote);
  }
  wire.summary.value=invitation;
  wire.intake={state:'stated',value:'APP/TEST-042',span:noticeSpan(reference)};
  for(const fact of wire.compensation){fact.value.coverage='Regional comprehensive benefits, including: '+fact.value.coverage;fact.span=noticeSpan(regionalBenefits);}
  return wire;
}
