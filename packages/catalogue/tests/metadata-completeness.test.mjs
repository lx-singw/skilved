import {test} from 'node:test';
import assert from 'node:assert/strict';
import {metadataCompletenessPolicy,assertMetadataCompleteness,assertMaximumDurationCompleteness} from '../src/ai/metadata-completeness.mjs';
import {mapExtraction,EXTRACTION_VERSION} from '../src/ai/extraction.mjs';
import {decodeGroqMetadata,decodeGroqExtraction,groqExtractionPayload,GROQ_EXTRACTION_VERSION} from '../src/ai/groq-schema.mjs';
import {extractWithProvider} from '../src/ai/provider.mjs';
import {extractMetadata,METADATA_VERSION} from '../src/ai/metadata.mjs';
import {PROGRAMME_EXTRACTION_VERSION} from '../src/ai/programme-extraction.mjs';
import {assertMaterialFacts} from '../src/worker-policy.mjs';
import {metadataCandidate as candidate,metadataExtraction,metadataWire,metadataSpan as span,maximumDuration,qualitativePay} from './fixtures/metadata-completeness.mjs';
import {document} from './fixtures/qualification-model.mjs';
const map=x=>mapExtraction(candidate,x,{sourceId:'metadata_test',now:'2026-10-18T10:00:00.000Z'});
const absent=()=>({state:'not_stated',value:null,quote:null});
const stated=(value,quote=value)=>({state:'stated',value,quote});
const env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_metadata_key',SKILVED_AI_FALLBACK:'true'};
const answer=data=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});

test('pay and maximum duration hints bind complete source passages without changing the compact wire',()=>{
  assert.deepEqual(metadataCompletenessPolicy(candidate),{version:'source_metadata_completeness_v2',references:[],audiences:[],regionalBenefits:[],
    qualitativePay:[{kind:'salary',coverage:'Market related',span:span(qualitativePay),originalText:qualitativePay}],
    maximumDurations:[{amount:3,unit:'year',bound:'maximum',span:span(maximumDuration),originalText:maximumDuration}]});
  assert.deepEqual(groqExtractionPayload(candidate).metadataCompletenessPolicy,metadataCompletenessPolicy(candidate));
  assert.equal(EXTRACTION_VERSION,'recentjobs_extraction_v25');
  assert.equal(GROQ_EXTRACTION_VERSION,'recentjobs_extraction_v25_groq_v7');
  assert.equal(METADATA_VERSION,'recentjobs_metadata_v17');
  assert.equal(PROGRAMME_EXTRACTION_VERSION,'recentjobs_programme_extraction_v25');
});

test('qualitative pay stays non-numeric; maximum duration fits summary beside separate practical evidence',()=>{
  for(const x of [metadataExtraction(),decodeGroqExtraction(metadataWire(),candidate)]) {
    const mapped=map(x);assertMaterialFacts(mapped.record);
    assert.deepEqual(mapped.record.compensation[0].value,{kind:'salary',amount:null,maximum:null,currency:null,period:'not_stated',coverage:'Market related'});
    assert.equal(mapped.record.practicalConditions.value,document);
    assert.equal(mapped.record.summary.value,'The programme runs for up to three years.');
    assert.equal(mapped.record.applicationRoute.value.destination,'https://employer.example/apply');
    assert.equal(mapped.record.publication.approved,false);
  }
  const x=metadataExtraction();x.summary=absent();x.practicalConditions=stated(maximumDuration);
  assert.doesNotThrow(()=>assertMetadataCompleteness(candidate,x));
});

test('pay omissions, wrong kinds, unsupported numbers and missing label evidence reject without repair',()=>{
  for(const change of [x=>{x.compensation=[];},x=>{x.compensation[0].state='ambiguous';x.compensation[0].value=null;},
    x=>{x.compensation[0].value.kind='stipend';},x=>{x.compensation[0].value.coverage='Good pay';},
    x=>{x.compensation[0].value.amount=1000;},x=>{x.compensation[0].value.amount=1000;x.compensation[0].value.maximum=2000;},
    x=>{x.compensation[0].value.currency='ZAR';},x=>{x.compensation[0].value.period='month';},
    x=>{x.compensation[0].quote='Market related';}]) {
    const x=metadataExtraction();change(x);const original=structuredClone(x);
    assert.throws(()=>map(x),/AI_QUALITATIVE_PAY_UNRESOLVED/);assert.deepEqual(x,original);
  }
});

test('duration cannot disappear inside location evidence, lose its upper bound or change quantity/unit',()=>{
  for(const value of [null,'The programme lasts three years.','At least three years.','Up to four years.',
    'Up to three months.','The programme will not run for up to three years.','There is no maximum of three years.','Up to three years or six months.']) {
    const x=metadataExtraction();x.summary=value===null?absent():stated(value,maximumDuration);
    x.location=stated({places:[],coverage:'not_stated',attendance:'not_stated',relocation:null},maximumDuration);
    assert.throws(()=>map(x),/AI_MAXIMUM_DURATION_UNRESOLVED/);
  }
  const x=metadataExtraction();x.summary.quote='Fictional Workshop seeks an electrical apprentice.';
  assert.throws(()=>assertMaximumDurationCompleteness(candidate,x),/AI_MAXIMUM_DURATION_UNRESOLVED/);
  for(const value of ['Up to 3 years.','At most three years.','No more than three years.','Not more than 3 years.']) {
    x.summary=stated(value,maximumDuration);assert.doesNotThrow(()=>assertMaximumDurationCompleteness(candidate,x));
  }
});

test('recognition covers labelled pay and maximums but abstains on experience, fixed, conditional and publisher text',()=>{
  for(const sourceText of ['Salary: Market-related','Stipend\nCompetitive','Salary\nNegotiable']) {
    const policy=metadataCompletenessPolicy({title:'Authored',sourceText});assert.equal(policy.qualitativePay.length,1);
    const h=policy.qualitativePay[0],x={compensation:[stated({kind:h.kind,coverage:h.coverage,amount:null,maximum:null,currency:null,period:'not_stated'},h.originalText)]};
    assert.doesNotThrow(()=>assertMetadataCompleteness({title:'Authored',sourceText},x));
  }
  for(const sourceText of ['Duration\nMaximum period of six months.','Programme duration: up to 2 weeks.','The apprenticeship will last at most one year.'])
    assert.equal(metadataCompletenessPolicy({title:'Authored',sourceText}).maximumDurations.length,1);
  for(const sourceText of ['Four years of experience required.','Maximum period of four years experience required.',
    'The programme lasts four years.','The programme may last up to four years.',
    'The programme runs up to four years if selected.','The programme runs up to four years or six months.',
    'The programme runs up to four years, subject to approval.','The programme is not up to four years.','The programme never runs up to four years.','Salary: R5000 monthly',
    'Salary: Not applicable','Salary: Competitive or negotiable','Salary\nUnknown',
    'Documents to prepare\nSalary: Market related\nThe programme runs up to four years.\nHow to apply']) {
    const policy=metadataCompletenessPolicy({title:'Authored',sourceText});assert.deepEqual(policy.qualitativePay,[]);assert.deepEqual(policy.maximumDurations,[]);
  }
  const conflicting={...candidate,sourceText:candidate.sourceText+'\nSalary: Negotiable'};
  assert.throws(()=>assertMetadataCompleteness(conflicting,metadataExtraction()),/AI_QUALITATIVE_PAY_UNRESOLVED/);
  assert.throws(()=>assertMetadataCompleteness({...candidate,sourceText:candidate.sourceText+'\nDuration: up to two years.'},metadataExtraction()),/AI_MAXIMUM_DURATION_UNRESOLVED/);
});

test('ordinary and split metadata reject each omission after one simulated call, preserving usage and input',async()=>{
  for(const split of [false,true])for(const pay of [false,true]) {
    const wire=metadataWire();if(pay)wire.compensation=[];else wire.summary=null;
    const {requirements,...metadata}=wire,data=split?metadata:wire,original=structuredClone(data);let calls=0;
    const reason=pay?'AI_QUALITATIVE_PAY_UNRESOLVED':'AI_MAXIMUM_DURATION_UNRESOLVED';
    await assert.rejects((split?extractMetadata:extractWithProvider)(candidate,{env,fetchImpl:async(_url,init)=>{
      calls++;const body=JSON.parse(init.body),input=JSON.parse(body.contents[0].parts[0].text);
      assert.deepEqual(input.metadataCompletenessPolicy,metadataCompletenessPolicy(candidate));
      assert.match(body.systemInstruction.parts[0].text,/Retain a stated maximum programme duration/);
      return answer(data);
    }}),error=>error.code===reason&&error.usage.totalTokens===15);
    assert.equal(calls,1);assert.deepEqual(data,original);
    assert.throws(()=>decodeGroqMetadata(metadata,candidate),new RegExp(reason));
  }
});
