import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {experienceCompletenessPolicy,assertExperienceCompleteness,EXPERIENCE_COMPLETENESS_INSTRUCTION} from '../src/ai/experience-completeness.mjs';
import {mapExtraction,EXTRACTION_INSTRUCTION} from '../src/ai/extraction.mjs';
import {decodeGroqExtraction,decodeGroqMetadata,GROQ_EXTRACTION_INSTRUCTION,groqExtractionPayload} from '../src/ai/groq-schema.mjs';
import {extractWithProvider} from '../src/ai/provider.mjs';import {extractMetadata,METADATA_INSTRUCTION} from '../src/ai/metadata.mjs';
import {extractProgramme,programmeCandidate,programmeExtractionPayload,mapProgrammeExtraction} from '../src/ai/programme-extraction.mjs';
import {parseRecentJobsDetail} from '../src/adapters/recentjobs.mjs';import {planRecentJobsProgrammes} from '../src/adapters/recentjobs-programmes.mjs';
import {programmeWire} from './fixtures/programme-model.mjs';
import {submissionCandidate as candidate,submissionWire,submissionSpan as span,experience} from './fixtures/submission-competency.mjs';
import {qualificationCandidate,qualificationWire} from './fixtures/qualification-model.mjs';
const absent=()=>({state:'not_stated',value:null,quote:null}),stated=text=>({state:'stated',value:text,quote:text}),source=sourceText=>({title:'Authored opportunity',sourceText});
const options={sourceId:'authored_experience',now:'2026-10-19T10:00:00.000Z'},env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_experience_key',SKILVED_AI_FALLBACK:'true'};
const answer=data=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
const policy=()=>experienceCompletenessPolicy(candidate),decode=()=>decodeGroqExtraction(submissionWire(),candidate);

test('experience hints retain original numbered preference passages without changing the source or requirement strength',()=>{
 const before=structuredClone(candidate);assert.deepEqual(policy(),{version:'source_experience_completeness_v1',passages:[{span:span(experience),originalText:experience}]});
 assert.deepEqual(groqExtractionPayload(candidate).experienceCompletenessPolicy,policy());assert.deepEqual(candidate,before);
 const mapped=mapExtraction(candidate,decode(),options);assert.equal(mapped.record.experience.value,experience);assert.equal(mapped.record.requirements.requirements.find(r=>r.kind==='experience').level,'preferred');assert.equal(mapped.record.publication.approved,false);
});

test('a retained preferred requirement cannot excuse an absent separate experience fact in canonical or compact paths',()=>{
 const x=decode();x.experience=absent();const original=structuredClone(x);assert.equal(x.requirements.items.find(i=>i.kind==='experience').level,'preferred');
 assert.throws(()=>mapExtraction(candidate,x,options),/AI_EXPERIENCE_COMPLETENESS_UNRESOLVED/);assert.deepEqual(x,original);
 const raw=submissionWire();raw.experience=null;const before=structuredClone(raw),{requirements,...metadata}=raw;
 assert.throws(()=>decodeGroqExtraction(raw,candidate),/AI_EXPERIENCE_COMPLETENESS_UNRESOLVED/);assert.throws(()=>decodeGroqMetadata(metadata,candidate),/AI_EXPERIENCE_COMPLETENESS_UNRESOLVED/);assert.deepEqual(raw,before);
});

test('stated experience cannot drop qualifiers, change strength, paraphrase or add text outside its complete evidence',()=>{
 for(const value of ['Workshop experience required.','Experience in a workshop.','Experience is optional.',experience+' Two years required.']){
  const x=decode();x.experience.value=value;const before=structuredClone(x);assert.throws(()=>mapExtraction(candidate,x,options),/AI_EXPERIENCE_COMPLETENESS_UNRESOLVED/);assert.deepEqual(x,before);
 }
 const short='Experience in a workshop',c=source(experience);assert.throws(()=>assertExperienceCompleteness(c,stated(short)),/AI_EXPERIENCE_COMPLETENESS_UNRESOLVED/);
 assert.throws(()=>assertExperienceCompleteness(c,{state:'stated',value:experience,quote:short}),/AI_EXPERIENCE_COMPLETENESS_UNRESOLVED/);
});

test('narrow recognition includes explicit waivers, labelled rules and quantified prior experience with original wording',()=>{
 for(const text of ['No experience required.','No previous experience is necessary.','Experience: Not required.',
  'Previous experience is preferred.','Experience in a repair shop is required.','Experience with workshop tools, although not essential.',
  "Two years' workshop experience is required.",'At least 2 years of relevant experience required.','1. Experience: Preferred.','  • Experience with machinery, although not essential.  ']){
  const c=source(text),p=experienceCompletenessPolicy(c);assert.deepEqual(p.passages,[{span:[2,2],originalText:text}]);
  assert.doesNotThrow(()=>assertExperienceCompleteness(c,stated(text)));assert.throws(()=>assertExperienceCompleteness(c,absent()),/AI_EXPERIENCE_COMPLETENESS_UNRESOLVED/);
 }
});

test('education, duties, preparation, conditional routes and foreign programme lines do not invent experience obligations',()=>{
 for(const text of ['Experience: Grade 12 with Mathematics.','Grade 12 or N3 Engineering.',
  'You will gain experience in our workshop.','Experience the world of engineering.','Minimum requirements and experience',
  'Experience in repairs is required if you choose route A.','Experience in repairs or installation is required.',
  'Documents to prepare:\nExperience with machinery, although not essential.\nClosing date: 30 October 2026',
  'Experience: To be confirmed.','Experience in a '+ 'long '.repeat(150)+'workshop is required.'])assert.deepEqual(experienceCompletenessPolicy(source(text)).passages,[]);
 const c={...source('Experience in repairs is required.\nNo experience required.'),programmeScope:{includedSpans:[[1,1],[3,3]]}};
 assert.deepEqual(experienceCompletenessPolicy(c).passages,[{span:[3,3],originalText:'No experience required.'}]);
 assert.doesNotThrow(()=>assertExperienceCompleteness(qualificationCandidate,absent()));assert.doesNotThrow(()=>decodeGroqExtraction(qualificationWire(),qualificationCandidate));
});

test('multiple experience rules retain complete contiguous evidence and preserve real uncertainty rather than selecting one',()=>{
 const text='No experience required.\nAdditional notice context.\nExperience in repairs is required.',c=source(text);
 assert.equal(experienceCompletenessPolicy(c).passages.length,2);assert.throws(()=>assertExperienceCompleteness(c,stated('No experience required.')),/AI_EXPERIENCE_COMPLETENESS_UNRESOLVED/);
 const joined='No experience required.\nExperience in repairs is required.';assert.throws(()=>assertExperienceCompleteness(c,stated(joined)),/AI_EXPERIENCE_COMPLETENESS_UNRESOLVED/);
 for(const state of ['ambiguous','conflicting']){const fact={state,value:null,quote:text},before=structuredClone(fact);assert.doesNotThrow(()=>assertExperienceCompleteness(c,fact));assert.deepEqual(fact,before);}
 // Completeness does not adjudicate conflict. Canonical material-fact checks and
 // semantic validation still decide whether quoted stated wording is faithful.
 assert.doesNotThrow(()=>assertExperienceCompleteness(c,stated(text)));
});

test('ordinary and split requests include the same guidance and reject omitted experience once with usage retained',async()=>{
 for(const instruction of [EXTRACTION_INSTRUCTION,GROQ_EXTRACTION_INSTRUCTION,METADATA_INSTRUCTION])assert.ok(instruction.includes(EXPERIENCE_COMPLETENESS_INSTRUCTION));
 for(const split of [false,true])for(const complete of [false,true]){
  const raw=submissionWire();if(!complete)raw.experience=null;const {requirements,...metadata}=raw,data=split?metadata:raw,before=structuredClone(data);let calls=0;
  const work=()=>(split?extractMetadata:extractWithProvider)(candidate,{env,fetchImpl:async(_url,init)=>{calls++;const request=JSON.parse(init.body),payload=JSON.parse(request.contents[0].parts[0].text);assert.deepEqual(payload.experienceCompletenessPolicy,policy());assert.ok(request.systemInstruction.parts[0].text.includes(EXPERIENCE_COMPLETENESS_INSTRUCTION));return answer(data);}});
  if(complete){const r=await work();assert.equal((split?r.metadata:r.extraction).experience.value,experience);}else await assert.rejects(work(),e=>e.code==='AI_EXPERIENCE_COMPLETENESS_UNRESOLVED'&&e.usage.totalTokens===15);
  assert.equal(calls,1);assert.deepEqual(data,before);
 }
});

test('scoped programme requests and mapping check only the selected trade experience, preserving usage and untouched answers',async()=>{
 const first='Experience in wiring is preferred.',second='No experience required.',html=(await readFile(new URL('./fixtures/recentjobs-programmes.html',import.meta.url),'utf8')).replace('<p>Apply: electrical@employer.example</p>','<p>'+first+'</p><p>Apply: electrical@employer.example</p>').replace('<p>Apply: plumbing@employer.example</p>','<p>'+second+'</p><p>Apply: plumbing@employer.example</p>');
 const c=parseRecentJobsDetail({url:'https://recentjobs.co.za/2026/09/26/fictional-programmes/',html}),intakes=planRecentJobsProgrammes(c).intakes;
 assert.equal(intakes.length,2);
 for(const [index,intake]of intakes.entries()){
  const text=index===0?first:second,view=programmeCandidate(c,intake.id),p=experienceCompletenessPolicy(view),raw=programmeWire(c,intake),before=structuredClone(raw);let calls=0;
  assert.deepEqual(p.passages.map(h=>h.originalText),[text]);assert.deepEqual(programmeExtractionPayload(c,intake.id).experienceCompletenessPolicy,p);
  await assert.rejects(extractProgramme(c,intake.id,{env,fetchImpl:async(_url,init)=>{calls++;assert.deepEqual(JSON.parse(JSON.parse(init.body).contents[0].parts[0].text).experienceCompletenessPolicy,p);return answer(raw);}}),e=>e.code==='AI_EXPERIENCE_COMPLETENESS_UNRESOLVED'&&e.usage.totalTokens===15);assert.equal(calls,1);assert.deepEqual(raw,before);
  const canonical={...before,applicationCandidateIndex:0};
  // Obtain a valid authored extraction before adding the now-required passage.
  const withoutRule={...view,sourceText:view.sourceText.replace(text,'')};const x=decodeGroqExtraction(canonical,withoutRule);
  assert.throws(()=>mapProgrammeExtraction(c,intake.id,x,options),/AI_EXPERIENCE_COMPLETENESS_UNRESOLVED/);
  raw.experience={state:'stated',value:text,span:p.passages[0].span};const accepted=await extractProgramme(c,intake.id,{env,fetchImpl:async()=>answer(raw)});assert.equal(accepted.extraction.experience.value,text);
 }
});
