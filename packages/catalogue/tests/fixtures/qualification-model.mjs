import {syntheticExtraction} from './recentjobs-model.mjs';

// Authored source and simulated answers only; no employer snapshot or response.
export const school='Grade 12 with Mathematics and Physical Science';
export const exclusion='Mathematical Literacy not accepted.';
export const technical='Minimum N2 Electrical Engineering studies.';
export const document='CV with certificates or Statement of Results will be considered.';
export const qualificationPassage=[school,exclusion,technical].join('\n');
export const qualificationCandidate={title:'Fictional electrical apprentice',
 sourceText:['Fictional Workshop seeks an electrical apprentice.','2. Minimum requirements',
  school,exclusion,technical,document,'3. Duties and responsibilities','Maintain tools.',
  'Closing date: 30 October 2026','Apply now'].join('\n'),
 sourceUrl:'https://recentjobs.co.za/2026/09/26/fictional-apprentice/',
 sourceRecordId:'authored_qualification',contentHash:'authored_qualification',issues:[],
 deadlineCandidates:[{localDate:'2026-10-30'}],
 applicationCandidates:[{method:'portal',destination:'https://employer.example/apply',originalText:'Apply now'}]};
export const qualificationHtml='<article class="type-post"><h1 class="entry-title">'+qualificationCandidate.title+
 '</h1><div class="entry-content"><p>'+qualificationCandidate.sourceText.split('\n').join('</p><p>')+
 '</p><a href="https://employer.example/apply">Apply now</a></div></article>';
const item=(id,quote,kind)=>({id,kind,level:'required',fact:{state:'stated',quote,
 value:{description:quote,qualification:null,document:null}}});
export function qualificationExtraction() {
 return {...syntheticExtraction(),requirements:{items:[item('q1',school,'education'),item('s',exclusion,'subjects'),
  item('q2',technical,'education'),item('d',document,'document')],
  expression:{op:'all',children:['q1','s','q2','d'].map(id=>({op:'ref',id}))}}};
}
export function qualificationSpan(quote) {
 const lines=(qualificationCandidate.title+'\n'+qualificationCandidate.sourceText).split('\n');
 const first=lines.indexOf(quote.split('\n')[0])+1;
 if(!first)throw Error('Unknown authored passage');
 return [first,first+quote.split('\n').length-1];
}
export function qualificationWire() {
 const stated=(value,quote=value)=>({state:'stated',value,span:qualificationSpan(quote)});
 return {category:'apprenticeship',categorySpan:[1,1],
  issuer:stated('Fictional Workshop','Fictional Workshop seeks an electrical apprentice.'),
  summary:stated('Fictional Workshop seeks an electrical apprentice.'),intake:null,location:null,
  residence:null,experience:null,compensation:[],practicalConditions:null,applicationCandidateIndex:0,
  deadline:stated({kind:'date',localDate:'2026-10-30',localTime:null,timezone:null,utcInstant:null},'Closing date: 30 October 2026'),
  requirements:{items:qualificationExtraction().requirements.items.map(i=>({id:i.id,kind:i.kind,level:i.level,state:'stated',span:qualificationSpan(i.fact.quote)})),
   expression:'all(q1,s,q2,d)'}};
}
