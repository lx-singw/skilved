import {metadataCandidate,metadataWire,metadataExtraction} from './metadata-completeness.mjs';

// Authored analogue of a province-only answer dropping a work base in prose.
export const workBase='Successful candidates will be based at Aurora Exampletown and will learn practical skills.';
export const province='Province\nGauteng';
export const completenessCandidate={...metadataCandidate,sourceText:metadataCandidate.sourceText+'\n'+workBase+'\n'+province};
export const completenessHtml='<article class="type-post"><h1 class="entry-title">'+completenessCandidate.title+
  '</h1><div class="entry-content"><p>'+completenessCandidate.sourceText.split('\n').join('</p><p>')+
  '</p><a href="https://employer.example/apply">Apply now</a></div></article>';
const location=complete=>({places:[{city:complete?'Exampletown':null,province:'gauteng',country:null}],coverage:'not_stated',attendance:'not_stated',relocation:null});
export function completenessWire(complete=true) {
  const x=metadataWire(),lines=(completenessCandidate.title+'\n'+completenessCandidate.sourceText).split('\n'),first=lines.indexOf(workBase)+1;
  x.location={state:'stated',value:location(complete),span:complete?[first,first+2]:[first+1,first+2]};
  return x;
}
export function completenessExtraction(complete=true) {
  const x=metadataExtraction();x.location={state:'stated',value:location(complete),quote:complete?workBase+'\n'+province:province};return x;
}
