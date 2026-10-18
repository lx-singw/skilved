import {qualificationCandidate,qualificationExtraction} from './qualification-model.mjs';

// Authored notice and simulated output only; no employer snapshot or response.
export const citizenship='Applicants must be South African citizens.';
export const residenceCandidate={...qualificationCandidate,sourceRecordId:'authored_residence',contentHash:'authored_residence',
 sourceText:qualificationCandidate.sourceText.replace('3. Duties and responsibilities',citizenship+'\n3. Duties and responsibilities')};
export const residenceHtml='<article class="type-post"><h1 class="entry-title">'+residenceCandidate.title+
 '</h1><div class="entry-content"><p>'+residenceCandidate.sourceText.split('\n').join('</p><p>')+
 '</p><a href="https://employer.example/apply">Apply now</a></div></article>';
export function residenceSpan(quote,candidate=residenceCandidate) {
 const lines=(candidate.title+'\n'+candidate.sourceText).split('\n'),first=lines.indexOf(quote.split('\n')[0])+1;
 if(!first)throw Error('Unknown authored passage');
 return [first,first+quote.split('\n').length-1];
}
export function residenceExtraction() {
 const x=qualificationExtraction();x.requirements.items.push({id:'c',kind:'citizenship',level:'required',
  fact:{state:'stated',value:{description:citizenship,qualification:null,document:null},quote:citizenship}});
 x.requirements.expression.children.push({op:'ref',id:'c'});return x;
}
export function residenceWire() {
 const stated=(value,quote=value)=>({state:'stated',value,span:residenceSpan(quote)});
 return {category:'apprenticeship',categorySpan:[1,1],
  issuer:stated('Fictional Workshop','Fictional Workshop seeks an electrical apprentice.'),
  summary:stated('Fictional Workshop seeks an electrical apprentice.'),intake:null,location:null,
  residence:null,experience:null,compensation:[],practicalConditions:null,applicationCandidateIndex:0,
  deadline:stated({kind:'date',localDate:'2026-10-30',localTime:null,timezone:null,utcInstant:null},'Closing date: 30 October 2026'),
  requirements:{items:residenceExtraction().requirements.items.map(i=>({id:i.id,kind:i.kind,level:i.level,state:'stated',span:residenceSpan(i.fact.quote)})),expression:'all(q1,s,q2,d,c)'}};
}
