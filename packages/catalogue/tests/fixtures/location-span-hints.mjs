import {completenessCandidate,completenessWire,completenessExtraction,workBase,province} from './location-completeness.mjs';

// Authored separated prose/table evidence. No live notice or provider output.
export {workBase};
export const locationLabel='Location\nGauteng';
export const spanCandidate={...completenessCandidate,sourceText:completenessCandidate.sourceText.replace(province,locationLabel)};
export const spanHtml='<article class="type-post"><h1 class="entry-title">'+spanCandidate.title+
  '</h1><div class="entry-content"><p>'+spanCandidate.sourceText.split('\n').join('</p><p>')+
  '</p><a href="https://employer.example/apply">Apply now</a></div></article>';
export function spanWire(complete=true) {
  const x=completenessWire();x.location.span=complete?x.location.span:[x.location.span[0],x.location.span[0]];return x;
}
export function spanExtraction(complete=true) {
  const x=completenessExtraction();x.location.quote=complete?workBase+'\n'+locationLabel:workBase;return x;
}
