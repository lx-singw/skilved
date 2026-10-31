import {test} from 'node:test';import assert from 'node:assert/strict';
import {validationPayload,validationContract,validateExtraction,validateAssessment} from '../src/ai/validation.mjs';
import {practicalEvidencePolicyFromText} from '../src/ai/practical-evidence.mjs';
import {mapExtraction} from '../src/ai/extraction.mjs';
import {qualificationCandidate,qualificationExtraction,school,exclusion} from './fixtures/qualification-model.mjs';

// Authored repeated wording in employer instructions and publisher advice.
const required='Required application documents\nUpdated CV',attachment='Attach your qualifications and academic records.';
const preparation='4. Documents to prepare\nUse this checklist before applying.\nUpdated CV\nTraining certificate, if applicable';
const extra=required+'\nHow to apply\n'+attachment+'\n'+preparation+'\n5. How to apply\nUse the employer portal.';
const candidate={...qualificationCandidate,sourceText:qualificationCandidate.sourceText.replace('Closing date:',extra+'\nClosing date:')};
const x=qualificationExtraction();x.requirements.items.push({id:'cv',kind:'document',level:'required',fact:{state:'stated',quote:required,value:{description:required,qualification:null,document:null}}});
x.requirements.expression.children.push({op:'ref',id:'cv'});x.practicalConditions={state:'stated',value:attachment,quote:attachment};
const mapped=mapExtraction(candidate,x,{sourceId:'validation_context_test',now:'2026-10-18T10:00:00.000Z'});
const input={record:mapped.record,recentjobsText:mapped.snapshot.text,applicationCandidates:candidate.applicationCandidates};
const env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_validation_context_key',SKILVED_AI_FALLBACK:'true'};
const negative={supported:false,issues:[{field:'practicalConditions',reason:'Missing preparation documents.'}],evidence:[{source:'recentjobs',quote:preparation}]};

test('validation supplies exact publisher boundaries while retaining repeated genuine document requirements and source',()=>{
  const before=structuredClone(input),payload=validationPayload(input),lines=input.recentjobsText.split('\n'),first=lines.indexOf('4. Documents to prepare')+1;
  assert.deepEqual(payload.sourcePolicyContext,{version:'recentjobs_validation_context_v1',publisherPreparationSections:[{span:[first,first+3],originalText:preparation}]});
  assert.equal(payload.recentjobsText,input.recentjobsText);assert.equal(payload.extracted.practicalConditions.value,attachment);
  assert.equal(payload.extracted.requirements.requirements.at(-1).fact.originalText,required);
  assert.equal(payload.applicationCandidates[0].destination,'https://employer.example/apply');assert.deepEqual(input,before);
  const section=payload.sourcePolicyContext.publisherPreparationSections[0];assert.equal(lines.slice(section.span[0]-1,section.span[1]).join('\n'),section.originalText);
  assert.equal(section.originalText.includes(attachment),false);assert.equal(section.originalText.includes(required),false);
});

test('source-context boundaries use the original corpus, including single-line and unclosed preparation sections',()=>{
  for(const [text,expected] of [
    ['Documents to prepare',[[1,1]]],
    ['Authored\nDocuments to prepare\nOptional notes',[[2,3]]],
    ['Authored\nRequired application documents\nUpdated CV\nHow to apply',[]],
    ['Authored\nDocuments to prepare\nFirst\nHow to apply\nRequired instruction\n2. Documents to prepare\nSecond\nClosing date: 30 October 2026',[[2,3],[6,7]]],
  ]) {
    const context=validationPayload({...input,recentjobsText:text}).sourcePolicyContext;
    assert.deepEqual(context.publisherPreparationSections.map(s=>s.span),expected);
    assert.deepEqual(practicalEvidencePolicyFromText(text).publisherPreparationSpans,expected);
    for(const s of context.publisherPreparationSections)assert.ok(text.includes(s.originalText));
  }
});

test('a simulated policy-disagreeing negative assessment stays negative with one spent request and no automatic override',async()=>{
  let calls=0;const original=structuredClone(negative);
  const result=await validateExtraction(input,{env,fetchImpl:async(_url,init)=>{
    calls++;const body=JSON.parse(init.body),payload=JSON.parse(body.contents[0].parts[0].text);
    assert.equal(payload.sourcePolicyContext.publisherPreparationSections[0].originalText,preparation);
    assert.match(body.systemInstruction.parts[0].text,/omission from\s+eligibility and practicalConditions is NOT a missing employer instruction/);
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(negative)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
  }});
  assert.equal(calls,1);assert.equal(result.supported,false);assert.deepEqual(result.issues,negative.issues);assert.equal(result.provenance.usage.totalTokens,15);assert.deepEqual(negative,original);
  assert.deepEqual(validateAssessment(negative,input.recentjobsText),negative);
});

test('publisher context preserves independent primary evidence and cannot weaken verdict/evidence integrity',()=>{
  const primary={text:'A different intake is advertised by the employer.'},payload=validationPayload({...input,primary});
  assert.deepEqual(payload.primary,primary);assert.deepEqual(payload.sourcePolicyContext,validationPayload(input).sourcePolicyContext);
  assert.match(validationContract(primary).instruction,/Conflicts or missing corroboration fail/);
  assert.match(validationContract().instruction,/must never broaden a selected programme's source scope/);
  assert.throws(()=>validateAssessment({...negative,supported:true},input.recentjobsText),/AI_INVALID_VALIDATION/);
  assert.throws(()=>validateAssessment({...negative,evidence:[{source:'recentjobs',quote:'Invented publisher boundary'}]},input.recentjobsText),/AI_INVALID_VALIDATION/);
  assert.throws(()=>validateAssessment(negative,input.recentjobsText,primary),/AI_INVALID_VALIDATION/);
});

test('standalone exclusion guidance retains separate source facts and never rewrites a negative verdict',async()=>{
  const extraction=qualificationExtraction(),m=mapExtraction(qualificationCandidate,extraction,{sourceId:'grouping_validation_test',now:'2026-10-18T10:00:00.000Z'}),before=structuredClone(extraction);
  const data={supported:false,issues:[{field:'requirements',reason:'Merge the standalone exclusion.'}],evidence:[{source:'recentjobs',quote:school+'\n'+exclusion}]},original=structuredClone(data);let calls=0;
  const result=await validateExtraction({record:m.record,recentjobsText:m.snapshot.text,applicationCandidates:qualificationCandidate.applicationCandidates},{env,fetchImpl:async(_url,init)=>{
    calls++;const request=JSON.parse(init.body),payload=JSON.parse(request.contents[0].parts[0].text),requirements=payload.extracted.requirements.requirements;
    assert.equal(requirements.find(r=>r.kind==='education').fact.originalText,school);
    assert.equal(requirements.find(r=>r.kind==='subjects').fact.originalText,exclusion);assert.equal(payload.extracted.requirements.expression.op,'all');
    assert.match(request.systemInstruction.parts[0].text,/does not permit\s+detaching an attached affirmative subject list/);
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
  }});
  assert.equal(calls,1);assert.equal(result.provenance.extractionVersion,'recentjobs_validation_v17');assert.equal(result.supported,false);assert.deepEqual(result.issues,data.issues);
  assert.deepEqual(extraction,before);assert.deepEqual(data,original);assert.deepEqual(validateAssessment(data,m.snapshot.text),data);
  assert.throws(()=>validateAssessment({...data,supported:true},m.snapshot.text),/AI_INVALID_VALIDATION/);
});
