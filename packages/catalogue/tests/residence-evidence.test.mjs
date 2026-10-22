import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {assertResidenceEvidence,RESIDENCE_EVIDENCE_INSTRUCTION} from '../src/ai/residence-evidence.mjs';
import {mapExtraction,EXTRACTION_INSTRUCTION} from '../src/ai/extraction.mjs';
import {decodeGroqExtraction,decodeGroqMetadata,GROQ_EXTRACTION_INSTRUCTION} from '../src/ai/groq-schema.mjs';
import {extractWithProvider} from '../src/ai/provider.mjs';import {extractMetadata,METADATA_INSTRUCTION} from '../src/ai/metadata.mjs';
import {validationContract,validateExtraction,validateAssessment} from '../src/ai/validation.mjs';
import {requirementValidationContract} from '../src/ai/requirement-validation.mjs';
import {extractProgramme,mapProgrammeExtraction,programmeCandidate,PROGRAMME_VALIDATION_VERSION} from '../src/ai/programme-extraction.mjs';
import {parseRecentJobsDetail} from '../src/adapters/recentjobs.mjs';import {planRecentJobsProgrammes} from '../src/adapters/recentjobs-programmes.mjs';
import {programmeWire} from './fixtures/programme-model.mjs';
import {residenceCandidate as candidate,residenceExtraction,residenceWire,residenceSpan as span,citizenship} from './fixtures/residence-model.mjs';
const stated=(value,quote=value)=>({state:'stated',value,quote}),options={sourceId:'residence_test',now:'2026-10-18T10:00:00.000Z'},map=x=>mapExtraction(candidate,x,options);
const env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_residence_key',SKILVED_AI_FALLBACK:'true'};
const answer=data=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});

test('recognised citizenship-only quotes cannot state residence, including neutral headings and list labels',()=>{
 for(const quote of ['You must be a South African citizen.',citizenship,'South African citizens','South African citizenship is required.',
  'Nationality: South African','Citizenship: South African.','Only South African citizens may apply.',
  'Candidates must hold South African citizenship.','Requirements:\n• '+citizenship,'1. Eligibility\n2) '+citizenship,
  'Citizenship\nSouth African citizenship\n\nSouth African citizen.']){
  const source={...candidate,sourceText:quote},fact=stated('South African citizen',quote),before=structuredClone(fact);
  assert.throws(()=>assertResidenceEvidence(source,fact),/AI_RESIDENCE_EVIDENCE_UNRESOLVED/);assert.deepEqual(fact,before);
 }
});

test('genuine residence, mixed clauses, legal status, unfamiliar evidence and uncertainty remain for semantic review',()=>{
 for(const quote of ['Applicants must reside in Gauteng.','Applicants must be South African citizens residing in Gauteng.',
  citizenship+'\nApplicants must live within 50 km of the workplace.','Applicants must be permanent residents.',
  'South African citizenship is not required.','Either citizenship or residence qualifies.','Citizenship will be considered with other evidence.',
  'Successful candidates will be based in Gauteng.'])assert.doesNotThrow(()=>assertResidenceEvidence({...candidate,sourceText:quote},stated(quote)));
 for(const state of ['not_stated','ambiguous','conflicting'])assert.doesNotThrow(()=>assertResidenceEvidence(candidate,{state,value:null,quote:state==='not_stated'?null:citizenship}));
 assert.doesNotThrow(()=>assertResidenceEvidence(candidate,stated('An unsupported quote')));
 const x=residenceExtraction();x.residence=stated('An unsupported quote');assert.throws(()=>map(x),/AI_UNSUPPORTED_EVIDENCE/);
});

test('ordinary, split and canonical mapping reject citizenship residence without repairing the answer',()=>{
 const x=residenceExtraction();x.residence=stated('South African citizens',citizenship);const before=structuredClone(x);
 assert.throws(()=>map(x),/AI_RESIDENCE_EVIDENCE_UNRESOLVED/);assert.deepEqual(x,before);
 const wire=residenceWire();wire.residence={state:'stated',value:'South African citizens',span:span(citizenship)};
 const original=structuredClone(wire),{requirements,...metadata}=wire;
 assert.throws(()=>decodeGroqExtraction(wire,candidate),/AI_RESIDENCE_EVIDENCE_UNRESOLVED/);
 assert.throws(()=>decodeGroqMetadata(metadata,candidate),/AI_RESIDENCE_EVIDENCE_UNRESOLVED/);assert.deepEqual(wire,original);
});

test('unstated residence retains citizenship requirements, original route and pending private review',()=>{
 for(const x of [residenceExtraction(),decodeGroqExtraction(residenceWire(),candidate)]){
  const m=map(x),item=m.record.requirements.requirements.find(r=>r.kind==='citizenship');
  assert.equal(m.record.residence.state,'not_stated');assert.equal(item.level,'required');assert.equal(item.fact.originalText,citizenship);
  assert.equal(m.record.requirements.expression.op,'all');assert.equal(m.record.applicationRoute.value.destination,'https://employer.example/apply');
  assert.equal(m.record.publication.approved,false);assert.equal(m.record.residence.review,'pending');
 }
});

test('explicit and mixed residence rules survive canonical and compact paths beside citizenship',()=>{
 for(const rule of ['Applicants must reside in Gauteng.','Applicants must be South African citizens residing in Gauteng.']){
  const source={...candidate,sourceText:candidate.sourceText+'\n'+rule},x=residenceExtraction();x.residence=stated(rule);
  x.requirements.items.push({id:'r',kind:'residence',level:'required',fact:stated({description:rule,qualification:null,document:null},rule)});
  x.requirements.expression.children.push({op:'ref',id:'r'});
  const wire=residenceWire();wire.residence={state:'stated',value:rule,span:span(rule,source)};
  wire.requirements.items.push({id:'r',kind:'residence',level:'required',state:'stated',span:span(rule,source)});wire.requirements.expression='all(q1,s,q2,d,c,r)';
  for(const input of [x,decodeGroqExtraction(wire,source)]){
   const m=mapExtraction(source,input,options);assert.equal(m.record.residence.value,rule);
   assert.equal(m.record.requirements.requirements.filter(r=>r.kind==='citizenship').length,1);
   assert.equal(m.record.requirements.requirements.filter(r=>r.kind==='residence').length,1);
  }
 }
});

test('ordinary and split provider paths hold after one simulated call with usage and no fallback',async()=>{
 for(const split of [false,true]){
  const wire=residenceWire();wire.residence={state:'stated',value:'South African citizens',span:span(citizenship)};
  const {requirements,...metadata}=wire,data=split?metadata:wire,before=structuredClone(data);let calls=0;
  await assert.rejects((split?extractMetadata:extractWithProvider)(candidate,{env,fetchImpl:async(_url,init)=>{
   calls++;assert.ok(JSON.parse(init.body).systemInstruction.parts[0].text.includes(RESIDENCE_EVIDENCE_INSTRUCTION));return answer(data);
  }}),e=>e.code==='AI_RESIDENCE_EVIDENCE_UNRESOLVED'&&e.usage.totalTokens===15);
  assert.equal(calls,1);assert.deepEqual(data,before);
 }
});

test('shared guidance reaches all extraction/validation contracts without rewriting a negative assessment',async()=>{
 for(const instruction of [EXTRACTION_INSTRUCTION,GROQ_EXTRACTION_INSTRUCTION,METADATA_INSTRUCTION,validationContract().instruction,requirementValidationContract().instruction])assert.ok(instruction.includes(RESIDENCE_EVIDENCE_INSTRUCTION));
 assert.equal(PROGRAMME_VALIDATION_VERSION,'recentjobs_programme_validation_v15');
 const m=map(residenceExtraction()),negative={supported:false,issues:[{field:'residence',reason:'Citizenship does not state residence.'}],evidence:[{source:'recentjobs',quote:citizenship}]},before=structuredClone(negative);let calls=0;
 const result=await validateExtraction({record:m.record,recentjobsText:m.snapshot.text,applicationCandidates:candidate.applicationCandidates},{env,fetchImpl:async(_url,init)=>{
  calls++;const request=JSON.parse(init.body);assert.equal(request.generationConfig.maxOutputTokens,6144);
  assert.ok(request.systemInstruction.parts[0].text.includes(RESIDENCE_EVIDENCE_INSTRUCTION));return answer(negative);
 }});
 assert.equal(calls,1);assert.equal(result.provenance.extractionVersion,'recentjobs_validation_v15');assert.equal(result.supported,false);
 assert.deepEqual(validateAssessment(negative,m.snapshot.text),negative);assert.deepEqual(negative,before);
 assert.throws(()=>validateAssessment({...negative,supported:true},m.snapshot.text),/AI_INVALID_VALIDATION/);
});

test('scoped programme extraction rejects citizenship residence once, preserving citizenship in the valid path',async()=>{
 const html=await readFile(new URL('./fixtures/recentjobs-programmes.html',import.meta.url),'utf8'),education='Applicants require Grade 12 with Mathematics OR N3 Electrical.';
 const source=parseRecentJobsDetail({url:'https://recentjobs.co.za/2026/09/26/fictional-programmes/',html:html.replace('<p>'+education+'</p>','<p>'+education+'</p><p>'+citizenship+'</p>')});
 const intake=planRecentJobsProgrammes(source).intakes[0],wire=programmeWire(source,intake),s=span(citizenship,source);
 wire.requirements.items.push({id:'c',kind:'citizenship',level:'required',state:'stated',span:s});wire.requirements.expression='all(r1,r2,c)';
 const valid=decodeGroqExtraction({...wire,applicationCandidateIndex:0},programmeCandidate(source,intake.id));
 const m=mapProgrammeExtraction(source,intake.id,valid,options);assert.equal(m.record.residence.state,'not_stated');
 assert.equal(m.record.requirements.requirements.find(r=>r.kind==='citizenship').fact.originalText,citizenship);
 const bad=structuredClone(valid);bad.residence=stated('South African citizens',citizenship);
 assert.throws(()=>mapProgrammeExtraction(source,intake.id,bad,options),/AI_RESIDENCE_EVIDENCE_UNRESOLVED/);
 wire.residence={state:'stated',value:'South African citizens',span:s};const before=structuredClone(wire);let calls=0;
 await assert.rejects(extractProgramme(source,intake.id,{env,fetchImpl:async(_url,init)=>{
  calls++;assert.ok(JSON.parse(init.body).systemInstruction.parts[0].text.includes(RESIDENCE_EVIDENCE_INSTRUCTION));return answer(wire);
 }}),e=>e.code==='AI_RESIDENCE_EVIDENCE_UNRESOLVED'&&e.usage.totalTokens===15);assert.equal(calls,1);assert.deepEqual(wire,before);
});
