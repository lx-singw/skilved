import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseRecentJobsDetail} from '../src/adapters/recentjobs.mjs';
import {planRecentJobsProgrammes} from '../src/adapters/recentjobs-programmes.mjs';
import {decodeGroqExtraction} from '../src/ai/groq-schema.mjs';
import {programmeCandidate,programmeExtractionPayload,mapProgrammeExtraction,extractProgramme,validateProgramme,validateProgrammeAssessment,PROGRAMME_EXTRACTION_VERSION} from '../src/ai/programme-extraction.mjs';
import {generateStructured} from '../src/ai/provider.mjs';
import {programmeWire,subjectProgrammeWire} from './fixtures/programme-model.mjs';

const html=await readFile(new URL('./fixtures/recentjobs-programmes.html',import.meta.url),'utf8');
const candidate=parseRecentJobsDetail({html,url:'https://recentjobs.co.za/2026/09/26/fictional-programmes/'}),plan=planRecentJobsProgrammes(candidate);
const options={sourceId:'programme_test',now:'2026-10-04T10:00:00.000Z'};
const canonical=(intake,wire=programmeWire(candidate,intake))=>decodeGroqExtraction({...wire,applicationCandidateIndex:0},programmeCandidate(candidate,intake.id));
const map=(intake,input=canonical(intake))=>mapProgrammeExtraction(candidate,intake.id,input,options);

test('programme extraction retains the full numbered source, one original recipient and a separate bound local view',()=>{
  const payload=programmeExtractionPayload(candidate,plan.intakes[0].id),view=programmeCandidate(candidate,plan.intakes[0].id);
  assert.match(payload.sourceLines,/N2 Plumbing/);assert.match(payload.sourceLines,/relevant diploma/);
  assert.equal(payload.applicationCandidates.length,1);assert.equal(payload.applicationCandidates[0].destination,'electrical@employer.example');
  assert.doesNotMatch(view.sourceText,/N2 Plumbing|relevant diploma/);
  assert.equal(view.sourceText.split('\n').length,candidate.sourceText.split('\n').length);
  assert.notEqual(view.contentHash,programmeCandidate(candidate,plan.intakes[1].id).contentHash);
});

test('canonical child records have distinct titles, references and original emails, with evidence pointing to the complete parent snapshot',()=>{
  const records=plan.intakes.map(intake=>map(intake));
  assert.notEqual(records[0].record.id,records[1].record.id);assert.equal(records[0].snapshot.id,records[1].snapshot.id);
  assert.equal(records[0].snapshot.text,`${candidate.title}\n${candidate.sourceText}`);
  for(const [index,mapped] of records.entries()){
    assert.equal(mapped.record.title.value,plan.intakes[index].heading.originalText);
    assert.equal(mapped.record.intake.value,plan.intakes[index].reference.value);
    assert.equal(mapped.record.applicationRoute.value.destination,plan.intakes[index].application.destination);
    assert.equal(mapped.record.publication.approved,false);
    assert.ok(mapped.record.citations.every(c=>c.snapshotId===mapped.snapshot.id));
    for(const e of mapped.evidence){assert.equal(e.snapshotId,mapped.snapshot.id);assert.equal(mapped.snapshot.text.slice(e.start,e.end),e.quote);}
    assert.equal(mapped.evidence.find(e=>e.applicationCandidate).applicationCandidate.index,index);
  }
});

test('another trade and fabricated quotes spanning masked lines cannot become child evidence',()=>{
  const intake=plan.intakes[0],input=canonical(intake);input.requirements.items[0].fact.quote='Applicants require N2 Plumbing.';
  assert.throws(()=>map(intake,input),/OUTSIDE_SCOPE/);
  const joined=canonical(intake);joined.summary.quote='Apply: electrical@employer.example\n\nDOCUMENTS REQUIRED';
  assert.throws(()=>map(intake,joined),/OUTSIDE_SCOPE/);
});

test('exact selected reference and recipient selection are enforced independently of a validator',()=>{
  const intake=plan.intakes[0];
  for(const change of [input=>input.intake.value='Plumbing TEST/02',input=>input.applicationCandidateIndex=1]){
    const input=canonical(intake);change(input);assert.throws(()=>map(intake,input),/INTAKE_MISMATCH/);
  }
});

test('omitted explicit CV obligations and WIL-only conditions cannot pass the local child mapper',()=>{
  const intake=plan.intakes[0],missing=canonical(intake);missing.requirements.items.pop();missing.requirements.expression={op:'ref',id:'r1'};
  assert.throws(()=>map(intake,missing),/REQUIREMENT_COVERAGE/);
  const wil=canonical(intake);wil.requirements.items[1].fact.quote='Institutional release letter for WIL applicants where required.';
  assert.throws(()=>map(intake,wil),/SHARED_CONDITION_UNRESOLVED/);
});

test('supported validation evidence must stay in scope while rejected assessments can explain another programme',()=>{
  const evidence=[{source:'recentjobs',quote:'Graduates require a relevant diploma and workplace experience.'}];
  assert.throws(()=>validateProgrammeAssessment({supported:true,issues:[],evidence},candidate,plan.intakes[0].id),/OUTSIDE_SCOPE/);
  assert.equal(validateProgrammeAssessment({supported:false,issues:[{field:'requirements',reason:'Another programme'}],evidence},candidate,plan.intakes[0].id).supported,false);
});

test('raw provider spans from another trade are rejected before canonical conversion without semantic fallback',async()=>{
  let calls=0;const intake=plan.intakes[0],wire=programmeWire(candidate,plan.intakes[1]);wire.intake=programmeWire(candidate,intake).intake;
  await assert.rejects(extractProgramme(candidate,intake.id,{env:{SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_programme_key_12345'},fetchImpl:async()=>{
    calls++;return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(wire)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
  }}),/OUTSIDE_SCOPE/);assert.equal(calls,1);
});

test('schema keywords returned as data fail once with bounded diagnostics and preserved usage',async()=>{
  const intake=plan.intakes[0],wire={...programmeWire(candidate,intake),type:'object',provider_secret_field:'private value'};let calls=0;
  await assert.rejects(extractProgramme(candidate,intake.id,{env:{SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_programme_key_12345'},fetchImpl:async()=>{
    calls++;return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(wire)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
  }}),error=>{
    assert.equal(error.code,'AI_INVALID_EXTRACTION');assert.equal(error.usage.totalTokens,15);
    assert.deepEqual(error.outputDiagnostic.unknownPropertyCounts,[{path:'',count:2}]);
    assert.doesNotMatch(JSON.stringify(error.outputDiagnostic),/provider_secret_field|private value/);return true;
  });assert.equal(calls,1);
});

test('single-line OR remains one verbatim condition while duplicate alternative passages are rejected',async()=>{
  const intake=plan.intakes[0],wire=programmeWire(candidate,intake),env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_programme_key_12345'};let calls=0;
  const fetchImpl=async(_url,init)=>{
    calls++;const body=JSON.parse(init.body);
    assert.match(body.systemInstruction.parts[0].text,/root data keys are exactly:/);
    assert.match(body.systemInstruction.parts[0].text,/single-line OR condition/);
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(wire)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
  };
  const result=await extractProgramme(candidate,intake.id,{env,fetchImpl});
  assert.equal(result.provenance.extractionVersion,PROGRAMME_EXTRACTION_VERSION);
  const mapped=map(intake,result.extraction);
  assert.equal(mapped.record.requirements.requirements[0].fact.originalText,'Applicants require Grade 12 with Mathematics OR N3 Electrical.');
  wire.requirements.items.push({...wire.requirements.items[0],id:'r3'});wire.requirements.expression='all(any(r1,r3),r2)';
  await assert.rejects(extractProgramme(candidate,intake.id,{env,fetchImpl}),/AI_DUPLICATE_REQUIREMENT_PASSAGE/);assert.equal(calls,2);
});

test('blank form requests must remain preparation instructions and cannot become requirement items',()=>{
  const intake=plan.intakes[0],payload=programmeExtractionPayload(candidate,intake.id),instruction='Request an application form from forms@employer.example.';
  assert.deepEqual(payload.formRequestInstructions,[{originalText:instruction,span:[19,19]}]);
  const good=map(intake);assert.ok(good.record.practicalConditions.value.includes(instruction));
  assert.equal(good.record.applicationRoute.value.destination,'electrical@employer.example');
  const missing=programmeWire(candidate,intake);missing.practicalConditions=null;
  assert.throws(()=>map(intake,canonical(intake,missing)),/PROGRAMME_FORM_REQUEST_COVERAGE/);
  const bad=programmeWire(candidate,intake);bad.requirements.items.push({id:'r3',kind:'document',level:'required',state:'stated',span:[19,19]});bad.requirements.expression='all(r1,r2,r3)';
  assert.throws(()=>map(intake,canonical(intake,bad)),/PROGRAMME_FORM_REQUEST_MISCLASSIFIED/);
});

test('an explicit completed-form submission remains a required document independently of requesting a blank form',()=>{
  const submission='Applicants must submit a completed application form.',changed=parseRecentJobsDetail({url:candidate.sourceUrl,
    html:html.replace('<p>Applicants must submit an updated CV.</p>',`<p>Applicants must submit an updated CV.</p><p>${submission}</p>`)}),intake=planRecentJobsProgrammes(changed).intakes[0];
  const wire=programmeWire(changed,intake),line=`${changed.title}\n${changed.sourceText}`.split('\n').indexOf(submission)+1;
  wire.requirements.items.push({id:'r3',kind:'document',level:'required',state:'stated',span:[line,line]});wire.requirements.expression='all(r1,r2,r3)';
  const mapped=mapProgrammeExtraction(changed,intake.id,decodeGroqExtraction({...wire,applicationCandidateIndex:0},programmeCandidate(changed,intake.id)),options);
  assert.ok(mapped.record.requirements.requirements.some(r=>r.level==='required'&&r.fact.originalText===submission));
  assert.ok(mapped.record.practicalConditions.value.includes('Request an application form from forms@employer.example.'));
});

test('programme validation allows bounded reasoning space but truncated validation still fails without fallback',async()=>{
  const intake=plan.intakes[0],mapped=map(intake);let calls=0;
  await assert.rejects(validateProgramme({record:mapped.record,recentjobsText:mapped.snapshot.text,applicationCandidates:programmeCandidate(candidate,intake.id).applicationCandidates},candidate,intake.id,
    {env:{SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_programme_key_12345'},fetchImpl:async(_url,init)=>{
      calls++;const body=JSON.parse(init.body);assert.equal(body.generationConfig.maxOutputTokens,6144);
      return Response.json({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'{"supported":true'}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:6154}});
    }}),error=>{assert.equal(error.code,'AI_INCOMPLETE_RESPONSE');assert.equal(error.usage.totalTokens,6154);return true;});
  assert.equal(calls,1);
});

test('an explicit provider output allowance cannot exceed the Gemini adapter limit',async()=>{
  let calls=0;await assert.rejects(generateStructured({}, {instruction:'Synthetic control',schema:{type:'object'},version:'synthetic_control'},
    {maxOutputTokens:8193,env:{SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_programme_key_12345'},fetchImpl:async()=>{calls++;assert.fail('Invalid token cap reached transport');}}),/AI_CONFIGURATION_REQUIRED/);
  assert.equal(calls,0);
});

test('AI programme output has no route selector and code binds each original scoped recipient',async()=>{
  for(const intake of plan.intakes){
    let calls=0;
    const result=await extractProgramme(candidate,intake.id,{env:{SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_programme_key_12345'},fetchImpl:async(_url,init)=>{
      calls++;const body=JSON.parse(init.body),instruction=body.systemInstruction.parts[0].text,
        payload=JSON.parse(body.contents[0].parts[0].text);
      assert.doesNotMatch(instruction,/Select only an existing applicationCandidateIndex|Select applicationCandidateIndex=0/);
      assert.equal(Object.hasOwn(payload.selectedIntake.application,'index'),false);
      assert.equal(payload.selectedIntake.application.destination,intake.application.destination);
      const schemaText=instruction.slice(instruction.indexOf('The root data keys are exactly:'));
      assert.doesNotMatch(schemaText,/applicationCandidateIndex/);
      return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(programmeWire(candidate,intake))}]}}]});
    }});
    const mapped=map(intake,result.extraction);
    assert.equal(result.extraction.applicationCandidateIndex,0);
    assert.equal(mapped.record.applicationRoute.value.destination,intake.application.destination);
    assert.equal(mapped.evidence.find(e=>e.applicationCandidate).applicationCandidate.index,intake.application.index);
    assert.equal(calls,1);
  }
});

test('model-written route indexes and destinations are rejected once, never stripped or repaired',async()=>{
  const intake=plan.intakes[1];
  for(const extra of [{applicationCandidateIndex:1},{applicationCandidateIndex:0},{applicationRoute:{destination:'electrical@employer.example'}}]){
    let calls=0;
    await assert.rejects(extractProgramme(candidate,intake.id,{env:{SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_programme_key_12345',SKILVED_AI_FALLBACK:'true'},fetchImpl:async()=>{
      calls++;return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({...programmeWire(candidate,intake),...extra})}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
    }}),error=>{assert.equal(error.code,'AI_INVALID_EXTRACTION');assert.equal(error.usage.totalTokens,15);
      assert.deepEqual(error.outputDiagnostic.unknownPropertyCounts,[{path:'',count:1}]);return true;});
    assert.equal(calls,1);
  }
});

const subjectHtml=await readFile(new URL('./fixtures/recentjobs-subject-programmes.html',import.meta.url),'utf8'),
  subjectCandidate=parseRecentJobsDetail({html:subjectHtml,url:candidate.sourceUrl}),subjectPlan=planRecentJobsProgrammes(subjectCandidate);
const subjectCanonical=(intake,wire=subjectProgrammeWire(subjectCandidate,intake),source=subjectCandidate)=>decodeGroqExtraction({...wire,applicationCandidateIndex:0},source);
const subjectMap=(intake,input=subjectCanonical(intake),source=subjectCandidate)=>mapProgrammeExtraction(source,intake.id,input,options);

test('subject-bound records share the original email but keep distinct subjects, IDs and absent reference facts',()=>{
  const records=subjectPlan.intakes.map(i=>subjectMap(i));assert.notEqual(records[0].record.id,records[1].record.id);
  for(const [index,mapped] of records.entries()){
    assert.equal(mapped.record.intake.state,'not_stated');assert.equal(mapped.record.intake.value,null);
    assert.equal(mapped.record.title.value,subjectPlan.intakes[index].heading.originalText);
    assert.equal(mapped.record.applicationRoute.value.destination,'jobs@employer.example');
    assert.equal(mapped.record.practicalConditions.value,subjectPlan.intakes[index].subject.originalText);
    assert.equal(mapped.record.requirements.requirements.length,4);
    for(const e of mapped.evidence)assert.equal(mapped.snapshot.text.slice(e.start,e.end),e.quote);
    assert.equal(mapped.evidence.find(e=>e.applicationCandidate).applicationCandidate.index,0);
  }
});

test('missing subjects, wrong subjects, invented references and requirement classification of a subject fail locally',()=>{
  const intake=subjectPlan.intakes[0],foreign=subjectPlan.intakes[1];
  const absent=subjectCanonical(intake);absent.practicalConditions={state:'not_stated',value:null,quote:null};assert.throws(()=>subjectMap(intake,absent),/SUBJECT_COVERAGE/);
  const wrong=subjectCanonical(intake);wrong.practicalConditions.value+='\n'+foreign.subject.originalText;assert.throws(()=>subjectMap(intake,wrong),/SUBJECT_MISMATCH/);
  const reference=subjectCanonical(intake);reference.intake={state:'stated',value:'Electrical',quote:intake.subject.originalText};assert.throws(()=>subjectMap(intake,reference),/INTAKE_MISMATCH/);
  const bad=subjectProgrammeWire(subjectCandidate,intake);bad.requirements.items.push({id:'r5',kind:'other',level:'required',state:'stated',span:intake.subject.span});bad.requirements.expression='all(r1,r2,r3,r4,r5)';assert.throws(()=>subjectMap(intake,subjectCanonical(intake,bad)),/SUBJECT_MISCLASSIFIED/);
  const omitted=subjectProgrammeWire(subjectCandidate,intake);omitted.requirements.items.pop();omitted.requirements.expression='all(r1,r2,r3)';assert.throws(()=>subjectMap(intake,subjectCanonical(intake,omitted)),/REQUIREMENT_COVERAGE/);
});

test('source-stated unspecified qualifications cannot become a confident complete requirement list',()=>{
  const source=parseRecentJobsDetail({html:subjectHtml.replace('<p>SOR is not accepted.</p>',"<p>SOR is not accepted.</p><p>The advert doesn't specify which qualification subjects are required.</p>"),url:candidate.sourceUrl}),intake=planRecentJobsProgrammes(source).intakes[0];
  const wire=subjectProgrammeWire(source,intake),mapped=subjectMap(intake,subjectCanonical(intake,wire,source),source);
  assert.ok(mapped.record.requirements.requirements.some(i=>i.fact.state==='ambiguous'));
  const confident=structuredClone(wire);confident.requirements.items.forEach(i=>i.state='stated');assert.throws(()=>subjectMap(intake,subjectCanonical(intake,confident,source),source),/REQUIREMENT_UNCERTAINTY/);
});

test('the live programme contract carries a selected subject and null reference without asking AI to bind a destination',async()=>{
  const intake=subjectPlan.intakes[1];let calls=0;
  const result=await extractProgramme(subjectCandidate,intake.id,{env:{SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_programme_key_12345'},fetchImpl:async(_url,init)=>{
    calls++;const request=JSON.parse(init.body),payload=JSON.parse(request.contents[0].parts[0].text);
    assert.equal(payload.selectedIntake.reference,null);assert.equal(payload.selectedIntake.subject.value,'Plumbing');
    assert.match(request.systemInstruction.parts[0].text,/application subject is not a recruitment reference/);
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(subjectProgrammeWire(subjectCandidate,intake))}]}}]});
  }});
  assert.equal(subjectMap(intake,result.extraction).record.practicalConditions.value,intake.subject.originalText);assert.equal(calls,1);
});

test('short subject trade titles cite their bound heading even when repeated in the shared introduction',()=>{
  const source=parseRecentJobsDetail({html:subjectHtml.replace('Fictional Workshop invites applicants for its apprenticeship trades.','Fictional Workshop invites applicants for Electrical and Plumbing apprenticeship trades.'),url:candidate.sourceUrl}),intake=planRecentJobsProgrammes(source).intakes[0],
    wire=subjectProgrammeWire(source,intake),mapped=subjectMap(intake,subjectCanonical(intake,wire,source),source),title=mapped.evidence.find(e=>e.id===mapped.record.title.id),lines=mapped.snapshot.text.split('\n');
  assert.equal(title.start,lines.slice(0,intake.heading.span[0]-1).reduce((n,line)=>n+line.length+1,0));
  assert.equal(mapped.snapshot.text.slice(title.start,title.end),'Electrical');
});

test('programme mapping rejects unsourced location metadata before canonical candidate creation',()=>{
 const intake=subjectPlan.intakes[0];
 for(const patch of [{coverage:'local'},{attendance:'in_person'},{places:[{city:'Test City',province:'gauteng',country:null}]}]){
  const input=subjectCanonical(intake);Object.assign(input.location.value,patch);
  assert.throws(()=>subjectMap(intake,input),/AI_LOCATION_EVIDENCE_UNRESOLVED/);
 }
});
