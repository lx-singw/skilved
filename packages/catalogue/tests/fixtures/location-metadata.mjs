import {metadataCandidate,metadataWire,metadataExtraction} from './metadata-completeness.mjs';

// Authored separated place evidence, including a complete maximum-duration summary.
export const worksite='Worksite: Exampletown';
export const province='Province: Gauteng';
export const locationCandidate={...metadataCandidate,sourceText:metadataCandidate.sourceText+'\n'+worksite+'\n'+province};
export const locationHtml='<article class="type-post"><h1 class="entry-title">'+locationCandidate.title+
  '</h1><div class="entry-content"><p>'+locationCandidate.sourceText.split('\n').join('</p><p>')+
  '</p><a href="https://employer.example/apply">Apply now</a></div></article>';
const place=()=>({places:[{city:'Exampletown',province:'gauteng',country:null}],coverage:'not_stated',attendance:'not_stated',relocation:null});
export function locationWire(complete=true) {
  const x=metadataWire(),first=(locationCandidate.title+'\n'+locationCandidate.sourceText).split('\n').indexOf(worksite)+1;
  x.location={state:'stated',value:place(),span:[first,complete?first+1:first]};
  return x;
}
export function locationExtraction(complete=true) {
  const x=metadataExtraction();x.location={state:'stated',value:place(),quote:complete?worksite+'\n'+province:worksite};return x;
}
