import {test} from 'node:test';import assert from 'node:assert/strict';
import {locationCompletenessPolicy,assertLocationCompleteness} from '../src/ai/location-completeness.mjs';
import {assertLocationEvidence} from '../src/ai/location-evidence.mjs';
import {decodeGroqExtraction,decodeGroqMetadata,groqExtractionPayload} from '../src/ai/groq-schema.mjs';
import {mapExtraction} from '../src/ai/extraction.mjs';import {extractWithProvider} from '../src/ai/provider.mjs';import {extractMetadata} from '../src/ai/metadata.mjs';
import {completenessCandidate as candidate,completenessWire,completenessExtraction,workBase,province} from './fixtures/location-completeness.mjs';
const absent={state:'not_stated',value:null,quote:null},source=sourceText=>({title:'Authored apprenticeship',sourceText});
const fact=(quote,places)=>({state:'stated',quote,value:{places,coverage:'not_stated',attendance:'not_stated',relocation:null}});
const place=(city=null,province=null,country=null)=>({city,province,country});
const rejects=fn=>assert.throws(fn,/AI_LOCATION_COMPLETENESS_UNRESOLVED/);
const map=x=>mapExtraction(candidate,x,{sourceId:'location_completeness_test',now:'2026-10-18T10:00:00.000Z'});

test('work bases and explicit location labels require structured values and complete supporting passages',()=>{
  const s=source(workBase+'\nWork location\nCity: Exampletown\nProvince\nGauteng\nCountry: South Africa');
  const full=fact(s.sourceText,[place('Exampletown','gauteng','ZA')]);
  assert.doesNotThrow(()=>assertLocationCompleteness(s,full));assert.doesNotThrow(()=>assertLocationEvidence(full));
  const policy=locationCompletenessPolicy(s);assert.equal(policy.obligations.length,4);
  assert.deepEqual(policy.obligations[0],{field:'work_base',values:['Aurora Exampletown'],span:[2,2],originalText:workBase});
  for(const change of [x=>{x.value.places[0].city=null;},x=>{x.value.places[0].province=null;},x=>{x.value.places[0].country=null;},x=>{x.quote='Province\nGauteng';}]){
    const x=structuredClone(full);change(x);rejects(()=>assertLocationCompleteness(s,x));
  }
  for(const word of ['South Africa','ZA','za']){
    const s=source('Work country: '+word);assert.equal(locationCompletenessPolicy(s).obligations.length,1);
    assert.doesNotThrow(()=>assertLocationCompleteness(s,fact(s.sourceText,[place(null,null,'ZA')])));
  }
  // A bare City line does not carry the work-location context from its heading.
  rejects(()=>assertLocationCompleteness(source('Work location\nCity: Exampletown'),fact('City: Exampletown',[place('Exampletown')])));
});

test('a source work base cannot hide in summary, broad evidence, unknown location or an employer prefix',()=>{
  const s=source(workBase+'\nProvince\nGauteng');
  for(const x of [absent,{state:'ambiguous',value:null,quote:workBase},fact(s.sourceText,[place(null,'gauteng')]),fact(s.sourceText,[place('Aurora','gauteng')])]){
    const original=structuredClone(x);rejects(()=>assertLocationCompleteness(s,x));assert.deepEqual(x,original);
  }
  // A real place in structured location still needs its own complete evidence.
  rejects(()=>assertLocationCompleteness(s,fact(province,[place('Exampletown','gauteng')])));
  const x=completenessExtraction(false);x.summary={state:'stated',value:workBase,quote:workBase};rejects(()=>assertLocationCompleteness(candidate,x.location));
});

test('recognised work bases preserve multiword names, punctuation and each separate named location',()=>{
  for(const [sentence,places] of [
    ['The selected apprentices shall be based in North End.',[place('North End')]],
    ["You will be based in King's Bay.",[place('King’s Bay')]],
    ['Trainees will be based in KwaZulu-Natal.',[place(null,'kwazulu_natal')]],
    ['Learners will be based in South Africa.',[place(null,null,'ZA')]],
    ['Apprentices will be based in North End and Salt River.',[place('North End'),place('Salt River')]],
    ['Successful applicants will be based in Exampletown, Gauteng.',[place('Exampletown','gauteng')]],
    ['Work town: North End, Salt River',[place('North End'),place('Salt River')]],
    ['Learners will be based in ZA.',[place(null,null,'ZA')]]]) {
    const s=source(sentence);assert.ok(locationCompletenessPolicy(s).obligations.length);assert.doesNotThrow(()=>assertLocationCompleteness(s,fact(sentence,places)));
    rejects(()=>assertLocationCompleteness(s,absent));
  }
  const s=source('Apprentices will be based in North End and Salt River.');rejects(()=>assertLocationCompleteness(s,fact(s.sourceText,[place('Salt River')])));
});

test('conditional, negative, unnamed, complex, promotional and preparation prose creates no location obligations',()=>{
  for(const text of [
    'Applicants must reside in Exampletown.','Applicants must be based in Exampletown.',
    'You may be based in Exampletown.','You will not be based in Exampletown.',
    'You will be based in Exampletown if selected.','You will be based in either Exampletown or North End.',
    'You will be based in Exampletown, subject to approval.','You will be based at our head office.',
    'You will be based at Head Office.','You will be based at Exampletown Plant.',
    'You will be based at 42 Example Road.','You will be based in a location to be confirmed.',
    'You will be based near Exampletown.','Previous employees were based in Exampletown.',
    'The organisation is based in Exampletown.','City: Unknown','Province: not stated','Country: N/A',
    'Work Province\n\nGauteng','Documents to prepare\nWork City: Exampletown\n'+workBase+'\nHow to apply',
    'Residence requirements\nCity: Exampletown\nProvince: Gauteng','Contact address\nCountry: South Africa',
    'Work location\nResidence requirements\nCity: Exampletown','City: Exampletown',
    'Join our WhatsApp group. You will be based in Exampletown.']) {
    assert.deepEqual(locationCompletenessPolicy(source(text)).obligations,[],text);assert.doesNotThrow(()=>assertLocationCompleteness(source(text),absent));
  }
  // Blank lines left by a programme scope do not borrow excluded label values.
  assert.deepEqual(locationCompletenessPolicy(source('Work Province\n\nGauteng')).obligations,[]);
});

test('ordinary/split decoders and canonical mapping reject omissions unchanged, while supported locations still map',()=>{
  const wire=completenessWire(false),{requirements,...metadata}=wire,x=completenessExtraction(false),original=structuredClone(wire);
  rejects(()=>decodeGroqExtraction(wire,candidate));rejects(()=>decodeGroqMetadata(metadata,candidate));rejects(()=>map(x));assert.deepEqual(wire,original);
  for(const value of [completenessExtraction(),decodeGroqExtraction(completenessWire(),candidate)]) {
    const mapped=map(value);assert.equal(mapped.record.location.value.places[0].city,'Exampletown');assert.equal(mapped.record.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(mapped.record.publication.approved,false);
  }
  // Enforcement does not change the frozen provider payload or invent a place hint.
  assert.equal(Object.hasOwn(groqExtractionPayload(candidate),'locationCompletenessPolicy'),false);
});

test('ordinary and split provider calls preserve usage and stop after one semantic failure without retries',async()=>{
  for(const split of [false,true]) {
    const wire=completenessWire(false),{requirements,...metadata}=wire,data=split?metadata:wire,original=structuredClone(data);let calls=0;
    await assert.rejects((split?extractMetadata:extractWithProvider)(candidate,{env:{SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_completeness_key',SKILVED_AI_FALLBACK:'true'},fetchImpl:async()=>{
      calls++;return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
    }}),e=>e.code==='AI_LOCATION_COMPLETENESS_UNRESOLVED'&&e.usage.totalTokens===15);
    assert.equal(calls,1);assert.deepEqual(data,original);
  }
});
