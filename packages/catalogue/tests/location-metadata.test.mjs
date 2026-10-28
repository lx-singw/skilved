import {test} from 'node:test';import assert from 'node:assert/strict';
import {decodeGroqExtraction,decodeGroqMetadata} from '../src/ai/groq-schema.mjs';
import {mapExtraction} from '../src/ai/extraction.mjs';import {extractWithProvider} from '../src/ai/provider.mjs';import {extractMetadata} from '../src/ai/metadata.mjs';
import {locationCandidate as candidate,locationWire,locationExtraction,worksite,province} from './fixtures/location-metadata.mjs';
const map=x=>mapExtraction(candidate,x,{sourceId:'location_metadata_test',now:'2026-10-18T10:00:00.000Z'});

test('a stated province elsewhere cannot support a city-only span in ordinary, split or canonical metadata',()=>{
  const wire=locationWire(false),{requirements,...metadata}=wire,original=structuredClone(wire),x=locationExtraction(false);
  assert.throws(()=>decodeGroqExtraction(wire,candidate),/AI_LOCATION_EVIDENCE_UNRESOLVED/);
  assert.throws(()=>decodeGroqMetadata(metadata,candidate),/AI_LOCATION_EVIDENCE_UNRESOLVED/);
  assert.throws(()=>map(x),/AI_LOCATION_EVIDENCE_UNRESOLVED/);assert.deepEqual(wire,original);
  assert.equal(x.location.quote,worksite);assert.equal(x.location.value.places[0].province,'gauteng');
});

test('one complete source span retains both places, upper-bound summary, separate documents and original route',()=>{
  for(const x of [decodeGroqExtraction(locationWire(),candidate),locationExtraction()]) {
    const mapped=map(x);assert.equal(mapped.record.location.originalText,worksite+'\n'+province);
    assert.equal(mapped.record.location.value.places[0].country,null);assert.equal(mapped.record.location.value.attendance,'not_stated');
    assert.match(mapped.record.summary.value,/up to three years/);assert.notEqual(mapped.record.practicalConditions.value,mapped.record.summary.value);
    assert.equal(mapped.record.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(mapped.record.publication.approved,false);
  }
});

test('short location spans fail after one simulated ordinary/split call without semantic retry or evidence repair',async()=>{
  for(const split of [false,true]) {
    const wire=locationWire(false),{requirements,...metadata}=wire,data=split?metadata:wire,original=structuredClone(data);let calls=0;
    await assert.rejects((split?extractMetadata:extractWithProvider)(candidate,{env:{SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_location_metadata_key',SKILVED_AI_FALLBACK:'true'},fetchImpl:async()=>{
      calls++;return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
    }}),error=>{
      assert.equal(error.code,'AI_LOCATION_EVIDENCE_UNRESOLVED');assert.equal(error.usage.totalTokens,15);
      assert.deepEqual(error.locationDiagnostic,{version:1,field:'province',reason:'place_not_in_span',placeIndex:0});return true;
    });
    assert.equal(calls,1);assert.deepEqual(data,original);
  }
});
