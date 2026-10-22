import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {requirementSourcePolicy,assertRequirementSourcePolicy,SUBMISSION_BLOCK_INSTRUCTION} from '../src/ai/requirement-source-policy.mjs';
import {attendanceEvidencePolicy,ATTENDANCE_EVIDENCE_INSTRUCTION} from '../src/ai/attendance-evidence-hints.mjs';import {assertLocationEvidence} from '../src/ai/location-evidence.mjs';
import {decodeGroqExtraction,groqExtractionPayload,GROQ_EXTRACTION_INSTRUCTION} from '../src/ai/groq-schema.mjs';import {mapExtraction,EXTRACTION_INSTRUCTION} from '../src/ai/extraction.mjs';
import {extractWithProvider} from '../src/ai/provider.mjs';import {extractMetadata,METADATA_INSTRUCTION} from '../src/ai/metadata.mjs';
import {extractProgramme} from '../src/ai/programme-extraction.mjs';import {parseRecentJobsDetail} from '../src/adapters/recentjobs.mjs';import {planRecentJobsProgrammes} from '../src/adapters/recentjobs-programmes.mjs';import {programmeWire} from './fixtures/programme-model.mjs';
import {submissionCandidate as candidate,submissionWire,submissionSpan as span,submission,acceptance,introduction,documents} from './fixtures/submission-competency.mjs';
const options={sourceId:'metadata_guidance',now:'2026-10-19T10:00:00.000Z'},env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_metadata_span_key',SKILVED_AI_FALLBACK:'true'};
const answer=data=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
const source=text=>({title:'Authored opportunity',sourceText:text});

test('submission guidance retains one full contiguous block including context and document applicability',()=>{
 const p=requirementSourcePolicy(candidate);assert.deepEqual(p.submissionBlocks,[{span:span(submission),originalText:submission}]);
 assert.ok(p.submissionBlocks[0].originalText.includes(introduction));for(const document of documents)assert.ok(p.submissionBlocks[0].originalText.includes(document));
 assert.equal(p.submissionBlocks[0].originalText.includes('Duties and responsibilities:'),false);
 const withoutAcceptance={...candidate,sourceText:candidate.sourceText.replace(acceptance+'\n','')},block=requirementSourcePolicy(withoutAcceptance).submissionBlocks[0];
 assert.equal(block.originalText,[introduction,...documents].join('\n'));assert.equal(block.span[0],span(introduction)[0]-1);
});

test('block hints abstain on unbounded, oversized, preparation and partial-scope passages without merging separate blocks',()=>{
 const raw=submission+'\nDuties and responsibilities:\nMaintain tools.';
 for(const c of [source(submission),source(introduction+'\n'+'A'.repeat(4100)+'\nClosing date: 30 October 2026'),source('Documents to prepare:\n'+raw),
  {...candidate,programmeScope:{includedSpans:[[1,span(documents[1])[0]-1],[span(documents[1])[0]+1,100]]}},
  {...candidate,programmeScope:{includedSpans:[[1,100]]},sourceText:candidate.sourceText.replace(documents[1],documents[1]+' for WIL applicants')},
  source(introduction+'\n'+documents[0]+'\nRequest an application form from forms@example.test.\n'+documents[1]+'\nClosing date: 30 October 2026')])assert.deepEqual(requirementSourcePolicy(c).submissionBlocks,[]);
 const c=source(raw+'\n'+raw),blocks=requirementSourcePolicy(c).submissionBlocks;assert.equal(blocks.length,2);assert.ok(blocks.every(b=>b.originalText===submission));assert.ok(blocks[0].span[1]<blocks[1].span[0]);
});

test('a campus place is not attendance; affirmative inline labels retain their full supporting evidence',()=>{
 const campus=source('Location: Example Campus, Durban'),before=structuredClone(campus),p=attendanceEvidencePolicy(campus);
 assert.equal(p.status,'no_label');assert.equal(p.supportedValue,null);assert.deepEqual(p.labels,[]);assert.deepEqual(campus,before);
 const value={places:[{country:null,province:null,city:'Durban'}],coverage:'not_stated',attendance:'in_person',relocation:null};assert.throws(()=>assertLocationEvidence({state:'stated',value,quote:campus.sourceText}),/AI_LOCATION_EVIDENCE_UNRESOLVED/);
 for(const [label,mode]of [['Attendance: on-site','in_person'],['Work arrangement: remote','remote'],['Work mode: hybrid','hybrid']]){
  const c=source(campus.sourceText+'\n'+label),p=attendanceEvidencePolicy(c);assert.equal(p.status,'supported');assert.equal(p.supportedValue,mode);assert.deepEqual(p.labels,[{span:[3,3],originalText:label}]);
  assert.doesNotThrow(()=>assertLocationEvidence({state:'stated',value:{...value,attendance:mode},quote:c.sourceText}));
 }
});

test('unsupported/conflicting labels stay unresolved and foreign-scope/preparation labels do not become attendance evidence',()=>{
 for(const text of ['Work mode: not remote','Work mode: remote or hybrid','Work mode: remote\nAttendance: hybrid']){
  const p=attendanceEvidencePolicy(source(text));assert.equal(p.status,'unresolved');assert.equal(p.supportedValue,null);assert.ok(p.labels.length);
 }
 for(const c of [source('Documents to prepare:\nWork mode: remote\nClosing date: 30 October 2026'),{...source('Location: Example Campus\nWork mode: remote'),programmeScope:{includedSpans:[[1,2]]}}]){
  const p=attendanceEvidencePolicy(c);assert.equal(p.status,'no_label');assert.equal(p.supportedValue,null);assert.deepEqual(p.labels,[]);
 }
});

test('ordinary and split metadata requests carry full block and attendance guidance without filling returned facts',async()=>{
 for(const instruction of [EXTRACTION_INSTRUCTION,GROQ_EXTRACTION_INSTRUCTION,METADATA_INSTRUCTION]){assert.ok(instruction.includes(SUBMISSION_BLOCK_INSTRUCTION));assert.ok(instruction.includes(ATTENDANCE_EVIDENCE_INSTRUCTION));}
 for(const split of [false,true]){
  const raw=submissionWire(),{requirements,...metadata}=raw,data=split?metadata:raw,before=structuredClone(data);let calls=0;
  const result=await (split?extractMetadata:extractWithProvider)(candidate,{env,fetchImpl:async(_url,init)=>{
   calls++;const payload=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text),blocks=split?payload.submissionBlocks:payload.requirementSourcePolicy.submissionBlocks;
   assert.deepEqual(blocks,[{span:span(submission),originalText:submission}]);assert.equal(payload.attendanceEvidencePolicy.status,'no_label');return answer(data);
  }});assert.equal(calls,1);assert.deepEqual(data,before);assert.equal((split?result.metadata:result.extraction).practicalConditions.value,submission);
 }
});

test('an omitted block still fails the original submission guard; advisory ranges do not widen or repair output',()=>{
 const raw=submissionWire();raw.practicalConditions={state:'stated',value:acceptance,span:span(acceptance)};const before=structuredClone(raw),x=decodeGroqExtraction(raw,candidate),xBefore=structuredClone(x);
 assert.throws(()=>assertRequirementSourcePolicy(candidate,x),/AI_SUBMISSION_INSTRUCTION_COVERAGE/);assert.throws(()=>mapExtraction(candidate,x,options),/AI_SUBMISSION_INSTRUCTION_COVERAGE/);
 assert.deepEqual(raw,before);assert.deepEqual(x,xBefore);assert.equal(x.practicalConditions.quote,acceptance);
 const complete=decodeGroqExtraction(submissionWire(),candidate),mapped=mapExtraction(candidate,complete,options);assert.equal(mapped.record.practicalConditions.originalText,submission);assert.equal(mapped.record.publication.approved,false);
});

test('ordinary and split simulated provider paths reject campus attendance once with usage preserved',async()=>{
 const c={...candidate,sourceText:candidate.sourceText.replace('Location: Durban','Location: Example Campus, Durban')};
 for(const split of [false,true]){
  const raw=submissionWire();raw.location.value.attendance='in_person';const {requirements,...metadata}=raw,data=split?metadata:raw,before=structuredClone(data);let calls=0;
  await assert.rejects((split?extractMetadata:extractWithProvider)(c,{env,fetchImpl:async(_url,init)=>{calls++;assert.equal(JSON.parse(JSON.parse(init.body).contents[0].parts[0].text).attendanceEvidencePolicy.status,'no_label');return answer(data);}}),e=>e.code==='AI_LOCATION_EVIDENCE_UNRESOLVED'&&e.usage.totalTokens===15);
  assert.equal(calls,1);assert.deepEqual(data,before);
 }
});

test('scoped programme extraction inherits both guidance contracts and preserves programme scope',async()=>{
 const html=await readFile(new URL('./fixtures/recentjobs-programmes.html',import.meta.url),'utf8'),c=parseRecentJobsDetail({url:'https://recentjobs.co.za/2026/09/26/fictional-programmes/',html}),intake=planRecentJobsProgrammes(c).intakes[0],raw=programmeWire(c,intake);let calls=0;
 const result=await extractProgramme(c,intake.id,{env,fetchImpl:async(_url,init)=>{
  calls++;const request=JSON.parse(init.body),payload=JSON.parse(request.contents[0].parts[0].text);assert.ok(request.systemInstruction.parts[0].text.includes(SUBMISSION_BLOCK_INSTRUCTION));assert.ok(request.systemInstruction.parts[0].text.includes(ATTENDANCE_EVIDENCE_INSTRUCTION));
  assert.ok(Array.isArray(payload.requirementSourcePolicy.submissionBlocks));assert.equal(payload.attendanceEvidencePolicy.status,'no_label');return answer(raw);
 }});assert.equal(calls,1);assert.equal(result.provenance.extractionVersion,'recentjobs_programme_extraction_v25');assert.equal(result.extraction.intake.value,intake.reference.value);
});
