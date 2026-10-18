import {qualificationCandidate,qualificationExtraction,qualificationWire,document} from './qualification-model.mjs';

// Authored notice/answers only; no source snapshots or provider responses.
export const maximumDuration='Successful candidates will participate in the programme for a maximum period of 3 years.';
export const qualitativePay='Salary\nMarket related';
export const metadataCandidate={...qualificationCandidate,sourceRecordId:'authored_metadata',contentHash:'authored_metadata',
  sourceText:qualificationCandidate.sourceText.replace('Closing date:',maximumDuration+'\n'+qualitativePay+'\nClosing date:')};
export const metadataHtml='<article class="type-post"><h1 class="entry-title">'+metadataCandidate.title+
  '</h1><div class="entry-content"><p>'+metadataCandidate.sourceText.split('\n').join('</p><p>')+
  '</p><a href="https://employer.example/apply">Apply now</a></div></article>';
export function metadataSpan(quote) {
  const lines=(metadataCandidate.title+'\n'+metadataCandidate.sourceText).split('\n');
  const first=lines.indexOf(quote.split('\n')[0])+1;
  if(!first)throw Error('Unknown authored metadata passage');
  return [first,first+quote.split('\n').length-1];
}
const salary=()=>({kind:'salary',amount:null,maximum:null,currency:null,period:'not_stated',coverage:'Market related'});
export function metadataExtraction() {
  const x=qualificationExtraction();
  x.compensation=[{state:'stated',value:salary(),quote:qualitativePay}];
  x.summary={state:'stated',value:'The programme runs for up to three years.',quote:maximumDuration};
  x.practicalConditions={state:'stated',value:document,quote:document};
  return x;
}
export function metadataWire() {
  const x=qualificationWire(),oldLines=(qualificationCandidate.title+'\n'+qualificationCandidate.sourceText).split('\n');
  for(const fact of [x.issuer,x.summary,x.deadline])fact.span=metadataSpan(oldLines.slice(fact.span[0]-1,fact.span[1]).join('\n'));
  x.compensation=[{state:'stated',value:salary(),span:metadataSpan(qualitativePay)}];
  x.summary={state:'stated',value:'The programme runs for up to three years.',span:metadataSpan(maximumDuration)};
  x.practicalConditions={state:'stated',value:document,span:metadataSpan(document)};
  return x;
}
