// Authored source and simulated answers. No employer snapshot or provider output.
export const acceptance='Incomplete applications will not be considered!';
export const introduction='To complete your application, you must submit the following standard documentation:';
export const documents=[
 '• An updated CV.',
 '• Copies of certificates (if you hold foreign qualifications, include an evaluation).',
 '• A copy of your identity document (use a passport for foreign nationals).',
 '• Confirmation of employment from your last employer (applicable to external applicants only).',
];
export const submission=[acceptance,introduction,...documents].join('\n');
export const education=['• Grade 12 or N3 Engineering (attach a copy).','• A qualification in a technical field.'];
export const knowledge='• Basic knowledge of workshop tools.';
export const experience='• Experience in a workshop, although not essential.';
export const competencyGroups=[
 ['• Working with others:','– Communicate task progress clearly.','– Listen carefully to instructions.','– Share tools responsibly.'],
 ['• Completing tasks:','– Check measurements accurately.','– Keep the work area tidy.','– Report equipment damage promptly.'],
 ['• Learning skills:','– Ask for help when uncertain.','– Practise unfamiliar techniques safely.','– Keep training notes up to date.'],
];
export const competencies=competencyGroups.flatMap(group=>group.slice(1));
export const excluded=['• Repair equipment as assigned.','As soon as possible.','Updated CV for your personal checklist.'];
export const sourceLines=[
 'Fictional Workshop seeks an electrical apprentice.','Location: Durban',submission,
 'Duties and responsibilities:',excluded[0],'Inherent Job Requirements:',...education,knowledge,
 'Recommendations:',experience,'Competencies','Key Competencies Required:',...competencyGroups.flat(),
 'Assumption of duties:',excluded[1],'Documents to prepare:',excluded[2],
 'Closing date: 30 October 2026','Apply now',
];
export const submissionCandidate={title:'Fictional electrical apprentice',sourceText:sourceLines.join('\n'),
 sourceUrl:'https://recentjobs.co.za/2026/09/26/fictional-apprentice/',sourceRecordId:'authored_submission',contentHash:'authored_submission',issues:[],
 deadlineCandidates:[{localDate:'2026-10-30'}],applicationCandidates:[{method:'portal',destination:'https://employer.example/apply',originalText:'Apply now'}]};
export const submissionHtml='<article class="type-post"><h1 class="entry-title">'+submissionCandidate.title+'</h1><div class="entry-content"><p>'+submissionCandidate.sourceText.split('\n').join('</p><p>')+'</p><a href="https://employer.example/apply">Apply now</a></div></article>';
export function submissionSpan(quote,candidate=submissionCandidate){
 const lines=(candidate.title+'\n'+candidate.sourceText).split('\n'),first=lines.indexOf(quote.split('\n')[0])+1;
 if(!first||lines.slice(first-1,first-1+quote.split('\n').length).join('\n')!==quote)throw Error('Unknown authored passage');
 return [first,first+quote.split('\n').length-1];
}
export function submissionWire(){
 const stated=(value,quote=value)=>({state:'stated',value,span:submissionSpan(quote)}),rows=[
  ...education.map((q,i)=>({id:'e'+i,quote:q,kind:'education',level:'required'})),
  {id:'k',quote:knowledge,kind:'other',level:'required'},
  ...competencies.map((q,i)=>({id:'c'+i,quote:q,kind:'other',level:'required'})),
  {id:'p',quote:experience,kind:'experience',level:'preferred'},
 ];
 return {category:'apprenticeship',categorySpan:[1,1],issuer:stated('Fictional Workshop',sourceLines[0]),summary:stated(sourceLines[0]),intake:null,
  location:stated({places:[{country:null,province:null,city:'Durban'}],coverage:'not_stated',attendance:'not_stated',relocation:null},'Location: Durban'),
  residence:null,experience:stated(experience),compensation:[],practicalConditions:{state:'stated',span:submissionSpan(submission)},applicationCandidateIndex:0,
  deadline:stated({kind:'date',localDate:'2026-10-30',localTime:null,timezone:null,utcInstant:null},'Closing date: 30 October 2026'),
  requirements:{items:rows.map(({id,quote,kind,level})=>({id,kind,level,state:'stated',span:submissionSpan(quote)})),expression:'all('+rows.map(r=>r.id).join(',')+')'}};
}
