// Authored expected extraction for the synthetic programme fixture only.
export function programmeWire(candidate,intake) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
  const span=text=>{const index=lines.indexOf(text);if(index<0)throw Error('SYNTHETIC_PASSAGE_MISSING');return [index+1,index+1];};
  const education=intake.reference.value.startsWith('Electrical')
    ? 'Applicants require Grade 12 with Mathematics OR N3 Electrical.' : 'Applicants require N2 Plumbing.';
  return {category:'apprenticeship',categorySpan:span('A. APPRENTICESHIP PROGRAMME'),
    issuer:{state:'stated',value:'Fictional Workshop',span:span('Fictional Workshop invites applicants for its training programmes.')},
    summary:{state:'stated',value:'Fictional Workshop invites applicants for its training programmes.',span:span('Fictional Workshop invites applicants for its training programmes.')},
    intake:{state:'stated',value:intake.reference.value,span:intake.reference.span},location:null,residence:null,experience:null,
    deadline:{state:'stated',value:{kind:'date',localDate:'2026-10-30',localTime:null,timezone:null,utcInstant:null},span:span('Closing date: 30 October 2026')},
    compensation:[],practicalConditions:null,applicationCandidateIndex:0,
    requirements:{items:[{id:'r1',kind:'education',level:'required',state:'stated',span:span(education)},
      {id:'r2',kind:'document',level:'required',state:'stated',span:span('Applicants must submit an updated CV.')}],expression:'all(r1,r2)'}};
}
