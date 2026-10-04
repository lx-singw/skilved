// Authored expected extraction for the synthetic programme fixture only.
export function programmeWire(candidate,intake) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
  const span=text=>{const index=lines.indexOf(text);if(index<0)throw Error('SYNTHETIC_PASSAGE_MISSING');return [index+1,index+1];};
  const education=intake.reference.value.startsWith('Electrical')
    ? 'Applicants require Grade 12 with Mathematics OR N3 Electrical.' : 'Applicants require N2 Plumbing.';
  const preparation=span('Request an application form from forms@employer.example.')[0],
    last=span('Posted and hand-delivered applications will not be accepted.')[1];
  return {category:'apprenticeship',categorySpan:span('A. APPRENTICESHIP PROGRAMME'),
    issuer:{state:'stated',value:'Fictional Workshop',span:span('Fictional Workshop invites applicants for its training programmes.')},
    summary:{state:'stated',value:'Fictional Workshop invites applicants for its training programmes.',span:span('Fictional Workshop invites applicants for its training programmes.')},
    intake:{state:'stated',value:intake.reference.value,span:intake.reference.span},location:null,residence:null,experience:null,
    deadline:{state:'stated',value:{kind:'date',localDate:'2026-10-30',localTime:null,timezone:null,utcInstant:null},span:span('Closing date: 30 October 2026')},
    compensation:[],practicalConditions:{state:'stated',value:lines.slice(preparation-1,last).join('\n'),span:[preparation,last]},
    requirements:{items:[{id:'r1',kind:'education',level:'required',state:'stated',span:span(education)},
      {id:'r2',kind:'document',level:'required',state:'stated',span:span('Applicants must submit an updated CV.')}],expression:'all(r1,r2)'}};
}

// Authored expectations for the shared-email synthetic fixture only.
export function subjectProgrammeWire(candidate,intake) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n'),line=text=>lines.indexOf(text)+1;
  const items=intake.mandatoryRequirementSpans.map((span,index)=>({id:`r${index+1}`,
    kind:/^(?:Updated CV|Relevant certificates)$/.test(lines[span[0]-1])?'document':'education',level:'required',
    state:intake.uncertaintySpans.some(s=>s[0]===span[0])?'ambiguous':'stated',span}));
  return {category:'apprenticeship',categorySpan:[1,1],issuer:{state:'stated',value:'Fictional Workshop',span:[2,2]},
    summary:{state:'stated',value:lines[intake.programmeSpan[0]],span:[intake.programmeSpan[0]+1,intake.programmeSpan[1]]},
    intake:null,location:{state:'stated',value:{places:[{country:null,province:null,city:'Test City'}],coverage:'not_stated',attendance:'not_stated',relocation:null},span:[3,3]},
    residence:null,experience:null,compensation:[],deadline:{state:'stated',value:{kind:'date',localDate:'2026-10-13',localTime:null,timezone:null,utcInstant:null},span:[line('Closing date'),line('Tuesday, 13 October 2026')]},
    practicalConditions:{state:'stated',value:intake.subject.originalText,span:intake.subject.span},
    requirements:{items,expression:`all(${items.map(i=>i.id).join(',')})`}};
}
