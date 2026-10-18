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

// Move the work base ahead of the other facts; the repeated title is now nearer
// than the final location table. Existing authored evidence remains verbatim.
export const titleSpanCandidate={...spanCandidate,title:spanCandidate.title+' (Gauteng)',
  sourceText:workBase+'\n'+spanCandidate.sourceText.replace(workBase+'\n','')};
export const titleSpanHtml='<article class="type-post"><h1 class="entry-title">'+titleSpanCandidate.title+
  '</h1><div class="entry-content"><p>'+titleSpanCandidate.sourceText.split('\n').join('</p><p>')+
  '</p><a href="https://employer.example/apply">Apply now</a></div></article>';
export function titleSpanWire(complete=true) {
  const x=spanWire(),old=(spanCandidate.title+'\n'+spanCandidate.sourceText).split('\n'),lines=(titleSpanCandidate.title+'\n'+titleSpanCandidate.sourceText).split('\n');
  for(const f of [x.issuer,x.summary,x.intake,x.residence,x.experience,x.deadline,x.practicalConditions,...x.compensation,...x.requirements.items]){
    if(!f)continue;
    const quote=old.slice(f.span[0]-1,f.span[1]).join('\n'),length=f.span[1]-f.span[0]+1;
    const first=lines.findIndex((line,index)=>line===quote.split('\n')[0]&&lines.slice(index,index+length).join('\n')===quote);
    if(first<0)throw Error('Missing authored title-range evidence');f.span=[first+1,first+length];
  }
  x.location.span=complete?[1,2]:[2,2];return x;
}
