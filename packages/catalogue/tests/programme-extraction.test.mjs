import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseRecentJobsDetail} from '../src/adapters/recentjobs.mjs';
import {planRecentJobsProgrammes} from '../src/adapters/recentjobs-programmes.mjs';
import {decodeGroqExtraction} from '../src/ai/groq-schema.mjs';
import {programmeCandidate,programmeExtractionPayload,mapProgrammeExtraction,extractProgramme,validateProgrammeAssessment} from '../src/ai/programme-extraction.mjs';
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
