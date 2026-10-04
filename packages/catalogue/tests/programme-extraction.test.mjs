import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseRecentJobsDetail} from '../src/adapters/recentjobs.mjs';
import {planRecentJobsProgrammes} from '../src/adapters/recentjobs-programmes.mjs';
import {decodeGroqExtraction} from '../src/ai/groq-schema.mjs';
import {programmeCandidate,programmeExtractionPayload,mapProgrammeExtraction,extractProgramme,validateProgramme,validateProgrammeAssessment,PROGRAMME_EXTRACTION_VERSION} from '../src/ai/programme-extraction.mjs';
import {generateStructured} from '../src/ai/provider.mjs';
import {programmeWire} from './fixtures/programme-model.mjs';

const html=await readFile(new URL('./fixtures/recentjobs-programmes.html',import.meta.url),'utf8');
const candidate=parseRecentJobsDetail({html,url:'https://recentjobs.co.za/2026/09/26/fictional-programmes/'}),plan=planRecentJobsProgrammes(candidate);
const options={sourceId:'programme_test',now:'2026-10-04T10:00:00.000Z'};
const canonical=(intake,wire=programmeWire(candidate,intake))=>decodeGroqExtraction(wire,candidate);
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
    calls++;return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(wire)}]}}],usageMetadata:{totalTokenCount:15}});
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
  const mapped=mapProgrammeExtraction(changed,intake.id,decodeGroqExtraction(wire,changed),options);
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
