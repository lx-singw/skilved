import {test} from 'node:test';import assert from 'node:assert/strict';
import {locationSpanHints,LOCATION_SPAN_INSTRUCTION} from '../src/ai/location-span-hints.mjs';
import {decodeGroqExtraction,groqExtractionPayload,GROQ_EXTRACTION_VERSION} from '../src/ai/groq-schema.mjs';
import {mapExtraction,EXTRACTION_VERSION} from '../src/ai/extraction.mjs';import {extractWithProvider} from '../src/ai/provider.mjs';import {extractWithGemini} from '../src/ai/gemini.mjs';
import {extractMetadata,METADATA_VERSION} from '../src/ai/metadata.mjs';
import {spanCandidate as candidate,spanWire,spanExtraction,workBase,locationLabel} from './fixtures/location-span-hints.mjs';
const source=sourceText=>({title:'Authored apprenticeship',sourceText});
const env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_location_spans_key',SKILVED_AI_FALLBACK:'true'};
const answer=data=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
const map=x=>mapExtraction(candidate,x,{sourceId:'location_span_test',now:'2026-10-18T10:00:00.000Z'});

test('separated prose and table hints retain exact source ranges with no supplied place values',()=>{
  const c=source(workBase+'\nTraining context.\n'+locationLabel),original=structuredClone(c),h=locationSpanHints(c);
  assert.deepEqual(h,{version:'source_location_spans_v1',passages:[{span:[2,2],originalText:workBase},{span:[4,5],originalText:locationLabel}],enclosingSpan:[2,5]});
  for(const p of h.passages)assert.deepEqual(Object.keys(p).sort(),['originalText','span']);
  assert.deepEqual(c,original);assert.deepEqual(groqExtractionPayload(candidate).locationSpanHints,locationSpanHints(candidate));
  const wire=spanWire(),decoded=decodeGroqExtraction(wire,candidate),mapped=map(decoded);
  assert.deepEqual(wire.location.span,locationSpanHints(candidate).enclosingSpan);assert.equal(mapped.record.location.originalText,workBase+'\n'+locationLabel);
  assert.equal(mapped.record.location.value.places[0].country,null);assert.equal(mapped.record.applicationRoute.value.destination,'https://employer.example/apply');
});

test('labels, scope and recognised source context constrain hints without guessing location meaning',()=>{
  for(const text of ['Location: Exampletown','Job location\nGauteng','Worksite: North End','Locations: North End, Salt River']){
    const h=locationSpanHints(source(text));assert.equal(h.passages.length,1);assert.ok(h.enclosingSpan);
  }
  for(const text of ['Location\n\nGauteng','Locations\nNorth End\nSalt River','Location\nNorth End\nSalt River',
    'Location: Exampletown or North End','Location: Unknown','Location: All provinces','Location: Remote',
    'Contact address\nLocation: Exampletown','Residence requirements\nLocation\nExampletown',
    'Applicants must reside in Exampletown.\nLocation: Gauteng','Documents to prepare\nWorksite: Exampletown',
    'Join our WhatsApp group. Location: Exampletown'])assert.deepEqual(locationSpanHints(source(text)).passages,[],text);
  assert.equal(locationSpanHints(source('Contact address\nLocation: North End\nJob details\nLocation: Exampletown')).passages.length,1);
  assert.equal(locationSpanHints(source('Residence requirements\nWork location: Exampletown')).passages.length,1);
});

test('no candidate range crosses excluded evidence, scope gaps, conflicting labels or the quote limit',()=>{
  for(const gap of ['Join our WhatsApp group.','Documents to prepare\nUpdated CV','x'.repeat(4001)]){
    const h=locationSpanHints(source(workBase+'\n'+gap+'\n'+locationLabel));assert.equal(h.passages.length,2);assert.equal(h.enclosingSpan,null);
  }
  const conflict=locationSpanHints(source('Location: Gauteng\nLocation: KwaZulu-Natal'));assert.equal(conflict.passages.length,2);assert.equal(conflict.enclosingSpan,null);
  const c={...source(workBase+'\nForeign intake\n'+locationLabel),programmeScope:{includedSpans:[[2,2],[4,5]]}};
  const h=locationSpanHints(c);assert.equal(h.passages.length,2);assert.equal(h.enclosingSpan,null);
  const masked={...source(workBase+'\n\nLocation\n\nGauteng'),programmeScope:{includedSpans:[[2,4],[6,6]]}};
  assert.deepEqual(locationSpanHints(masked).passages,[{span:[2,2],originalText:workBase}]);
});

test('ordinary, split metadata and native Gemini receive the same source-bound guidance with versioned contracts',async()=>{
  for(const mode of ['ordinary','split','native']){
    let calls=0;const wire=spanWire(),{requirements,...metadata}=wire;
    const result=await (mode==='split'?extractMetadata:mode==='native'?extractWithGemini:extractWithProvider)(candidate,{env,fetchImpl:async(_url,init)=>{
      calls++;const body=JSON.parse(init.body),payload=JSON.parse(body.contents[0].parts[0].text);
      assert.deepEqual(payload.locationSpanHints,locationSpanHints(candidate));assert.ok(body.systemInstruction.parts[0].text.includes(LOCATION_SPAN_INSTRUCTION));
      return answer(mode==='split'?metadata:mode==='native'?spanExtraction():wire);
    }});
    assert.equal(calls,1);assert.equal(result.provenance.extractionVersion,mode==='split'?METADATA_VERSION:mode==='native'?EXTRACTION_VERSION:GROQ_EXTRACTION_VERSION);
    assert.equal(map(mode==='split'?{...result.metadata,requirements:spanExtraction().requirements}:result.extraction).record.location.value.places[0].city,'Exampletown');
  }
});

test('advisory hints do not repair a short returned span or trigger semantic fallback',async()=>{
  for(const split of [false,true]){
    const wire=spanWire(false),{requirements,...metadata}=wire,data=split?metadata:wire,original=structuredClone(data);let calls=0;
    await assert.rejects((split?extractMetadata:extractWithProvider)(candidate,{env,fetchImpl:async(_url,init)=>{
      calls++;assert.ok(JSON.parse(JSON.parse(init.body).contents[0].parts[0].text).locationSpanHints.enclosingSpan);return answer(data);
    }}),e=>e.code==='AI_LOCATION_EVIDENCE_UNRESOLVED'&&e.usage.totalTokens===15);
    assert.equal(calls,1);assert.deepEqual(data,original);
  }
  const x=spanExtraction(false),original=structuredClone(x);assert.throws(()=>map(x),/AI_LOCATION_EVIDENCE_UNRESOLVED/);assert.deepEqual(x,original);
});
