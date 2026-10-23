import {test} from 'node:test';import assert from 'node:assert/strict';
import {locationSpanHints,LOCATION_SPAN_INSTRUCTION} from '../src/ai/location-span-hints.mjs';
import {decodeGroqExtraction,groqExtractionPayload,GROQ_EXTRACTION_VERSION} from '../src/ai/groq-schema.mjs';
import {mapExtraction,EXTRACTION_VERSION} from '../src/ai/extraction.mjs';import {extractWithProvider} from '../src/ai/provider.mjs';import {extractWithGemini} from '../src/ai/gemini.mjs';
import {extractMetadata,METADATA_VERSION} from '../src/ai/metadata.mjs';
import {spanCandidate as candidate,spanWire,spanExtraction,workBase,locationLabel,titleSpanCandidate,titleSpanWire} from './fixtures/location-span-hints.mjs';
const source=sourceText=>({title:'Authored apprenticeship',sourceText});
const env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_location_spans_key',SKILVED_AI_FALLBACK:'true'};
const answer=data=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
const map=x=>mapExtraction(candidate,x,{sourceId:'location_span_test',now:'2026-10-18T10:00:00.000Z'});

test('separated prose and table hints retain exact source ranges with no supplied place values',()=>{
  const c=source(workBase+'\nTraining context.\n'+locationLabel),original=structuredClone(c),h=locationSpanHints(c);
  assert.deepEqual(h,{version:'source_location_spans_v3',passages:[{span:[2,2],originalText:workBase},{span:[4,5],originalText:locationLabel}],titleAlternatives:[],recommendedSpan:[2,5]});
  for(const p of h.passages)assert.deepEqual(Object.keys(p).sort(),['originalText','span']);
  assert.deepEqual(c,original);assert.deepEqual(groqExtractionPayload(candidate).locationSpanHints,locationSpanHints(candidate));
  const wire=spanWire(),decoded=decodeGroqExtraction(wire,candidate),mapped=map(decoded);
  assert.deepEqual(wire.location.span,locationSpanHints(candidate).recommendedSpan);assert.equal(mapped.record.location.originalText,workBase+'\n'+locationLabel);
  assert.equal(mapped.record.location.value.places[0].country,null);assert.equal(mapped.record.applicationRoute.value.destination,'https://employer.example/apply');
});

test('labels, scope and recognised source context constrain hints without guessing location meaning',()=>{
  for(const text of ['Location: Exampletown','Job location\nGauteng','Worksite: North End','Locations: North End, Salt River']){
    const h=locationSpanHints(source(text));assert.equal(h.passages.length,1);assert.ok(h.recommendedSpan);
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
    const h=locationSpanHints(source(workBase+'\n'+gap+'\n'+locationLabel));assert.equal(h.passages.length,2);assert.equal(h.recommendedSpan,null);
  }
  const conflict=locationSpanHints(source('Location: Gauteng\nLocation: KwaZulu-Natal'));assert.equal(conflict.passages.length,2);assert.equal(conflict.recommendedSpan,null);
  const c={...source(workBase+'\nForeign intake\n'+locationLabel),programmeScope:{includedSpans:[[2,2],[4,5]]}};
  const h=locationSpanHints(c);assert.equal(h.passages.length,2);assert.equal(h.recommendedSpan,null);
  const masked={...source(workBase+'\n\nLocation\n\nGauteng'),programmeScope:{includedSpans:[[2,4],[6,6]]}};
  assert.deepEqual(locationSpanHints(masked).passages,[{span:[2,2],originalText:workBase}]);
});

test('a recommended location range includes separate supported attendance labels without supplying or repairing facts',()=>{
  const place='Job Location: Exampletown – Gauteng – South Africa',mode='Working Mode: Fully On-Site',c=source(place+'\nTraining context.\n'+mode),before=structuredClone(c),h=locationSpanHints(c);
  assert.deepEqual(h.passages,[{span:[2,2],originalText:place},{span:[4,4],originalText:mode}]);assert.deepEqual(h.recommendedSpan,[2,4]);assert.deepEqual(c,before);
  for(const separator of [' - ',' – ',' — '])assert.deepEqual(locationSpanHints(source(place.replaceAll(' – ',separator)+'\n'+mode)).recommendedSpan,[2,3]);
  const onlyMode=locationSpanHints(source(mode));assert.deepEqual(onlyMode.recommendedSpan,[2,2]);assert.deepEqual(Object.keys(onlyMode.passages[0]).sort(),['originalText','span']);
  for(const tail of ['Working Mode: not Fully On-Site','Working Mode: Fully On-Site or Remote','Working Mode: Fully On-Site\nAttendance: hybrid',
    'Repair fully on-site machinery','Documents to prepare\nWorking Mode: Fully On-Site']) {
    const hint=locationSpanHints(source(place+'\n'+tail));assert.deepEqual(hint.passages,[{span:[2,2],originalText:place}]);assert.deepEqual(hint.recommendedSpan,[2,2]);
  }
  for(const gap of ['Join our WhatsApp group.','x'.repeat(4001)])assert.equal(locationSpanHints(source(place+'\n'+gap+'\n'+mode)).recommendedSpan,null);
  assert.equal(locationSpanHints({...c,programmeScope:{includedSpans:[[2,2],[4,4]]}}).recommendedSpan,null);
  const excluded=locationSpanHints({...c,programmeScope:{includedSpans:[[1,3]]}});assert.deepEqual(excluded.recommendedSpan,[2,2]);
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
      calls++;assert.ok(JSON.parse(JSON.parse(init.body).contents[0].parts[0].text).locationSpanHints.recommendedSpan);return answer(data);
    }}),e=>e.code==='AI_LOCATION_EVIDENCE_UNRESOLVED'&&e.usage.totalTokens===15);
    assert.equal(calls,1);assert.deepEqual(data,original);
  }
  const x=spanExtraction(false),original=structuredClone(x);assert.throws(()=>map(x),/AI_LOCATION_EVIDENCE_UNRESOLVED/);assert.deepEqual(x,original);
});

const separated=(title='Authored apprenticeship (Gauteng)')=>({title,sourceText:workBase+'\n'+('Descriptive training context.\n'.repeat(10))+locationLabel});

test('an exact repeated title label gives a shorter complete range while preserving original passages',()=>{
  const c=separated(),before=structuredClone(c),h=locationSpanHints(c);
  assert.deepEqual(h.recommendedSpan,[1,2]);assert.deepEqual(h.passages.map(p=>p.span),[[2,2],[13,14]]);
  assert.deepEqual(h.titleAlternatives,[{span:[1,1],originalText:c.title,replacesSpan:[13,14]}]);assert.deepEqual(c,before);
  assert.deepEqual(locationSpanHints(separated('Authored apprenticeship ( gauteng )')).recommendedSpan,[1,2]);
  const wire=titleSpanWire(),x=decodeGroqExtraction(wire,titleSpanCandidate),record=mapExtraction(titleSpanCandidate,x,{sourceId:'title_hint_test',now:'2026-10-18T10:00:00.000Z'}).record;
  assert.deepEqual(wire.location.span,locationSpanHints(titleSpanCandidate).recommendedSpan);
  assert.equal(record.location.originalText,titleSpanCandidate.title+'\n'+workBase);assert.equal(record.location.value.places[0].country,null);
  assert.equal(record.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(record.publication.approved,false);
});

test('title hints abstain on partial, nested, conflicting, contextual or unsupported repetitions',()=>{
  for(const title of ['Authored Gauteng apprenticeship','Authored apprenticeship (Gauteng East)',
    'Authored apprenticeship (Gauteng or Limpopo)','Authored apprenticeship (Gauteng) (North End)',
    'Authored apprenticeship (Region (Gauteng))','Contact in Gauteng (Gauteng)',
    'Residents only apprenticeship (Gauteng)','No relocation apprenticeship (Gauteng)',
    'No openings in (Gauteng)','Training only if approved (Gauteng)','Authored apprenticeship\n(Gauteng)',
    'Join our WhatsApp group (Gauteng)'])assert.deepEqual(locationSpanHints(separated(title)).titleAlternatives,[],title);
  assert.deepEqual(locationSpanHints({title:'Authored (Gauteng)',sourceText:workBase}).titleAlternatives,[]);
  assert.deepEqual(locationSpanHints({title:'Authored (Gauteng)',sourceText:'Contact address\nLocation\nGauteng'}).passages,[]);
  const conflict={...separated(),sourceText:separated().sourceText+'\nLocation: KwaZulu-Natal'};
  assert.equal(locationSpanHints(conflict).recommendedSpan,null);assert.deepEqual(locationSpanHints(conflict).titleAlternatives,[]);
  const near={title:'Long authored role '.repeat(30)+'(Gauteng)',sourceText:workBase+'\n'+locationLabel};
  assert.deepEqual(locationSpanHints(near).recommendedSpan,[2,4]);assert.deepEqual(locationSpanHints(near).titleAlternatives,[]);
});

test('title alternatives retain mandatory evidence and respect programme, publisher and quote boundaries',()=>{
  const c=separated(),typed={...c,sourceText:c.sourceText+'\nWork province: Gauteng'};
  const h=locationSpanHints(typed);assert.deepEqual(h.recommendedSpan,[2,15]);assert.deepEqual(h.titleAlternatives,[]);
  const scope={...c,programmeScope:{includedSpans:[[2,14]]}};assert.deepEqual(locationSpanHints(scope).titleAlternatives,[]);
  const gap={title:c.title,sourceText:'Foreign intake.\n'+workBase+'\nTraining context.\n'+locationLabel,programmeScope:{includedSpans:[[1,1],[3,6]]}};
  assert.deepEqual(locationSpanHints(gap).recommendedSpan,[3,6]);assert.deepEqual(locationSpanHints(gap).titleAlternatives,[]);
  for(const prefix of ['Join our WhatsApp group.','x'.repeat(4001)]){
    const blocked={title:c.title,sourceText:prefix+'\n'+workBase+'\nTraining context.\n'+locationLabel};
    assert.deepEqual(locationSpanHints(blocked).titleAlternatives,[]);assert.deepEqual(locationSpanHints(blocked).recommendedSpan,[3,6]);
  }
  const after={title:c.title,sourceText:workBase+'\nJoin our WhatsApp group.\n'+locationLabel};
  assert.deepEqual(locationSpanHints(after).recommendedSpan,[1,2]);
});

test('shorter title alternatives retain separate attendance evidence in their recommended range',()=>{
  const c=separated();c.sourceText=c.sourceText.replace(workBase,workBase+'\nWorking Mode: Fully On-Site');
  const h=locationSpanHints(c);assert.deepEqual(h.recommendedSpan,[1,3]);assert.equal(h.titleAlternatives.length,1);
  assert.ok(h.passages.some(p=>p.originalText==='Working Mode: Fully On-Site'));assert.deepEqual(h.titleAlternatives[0].replacesSpan,[14,15]);
});

test('title guidance reaches ordinary and split transports without changing or repairing returned spans',async()=>{
  for(const split of [false,true])for(const complete of [false,true]){
    const wire=titleSpanWire(complete),{requirements,...metadata}=wire,data=split?metadata:wire,original=structuredClone(data);let calls=0;
    const run=(split?extractMetadata:extractWithProvider)(titleSpanCandidate,{env,fetchImpl:async(_url,init)=>{
      calls++;const payload=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);
      assert.deepEqual(payload.locationSpanHints.recommendedSpan,[1,2]);assert.equal(payload.locationSpanHints.titleAlternatives.length,1);return answer(data);
    }});
    if(complete){const result=await run;assert.equal((split?result.metadata:result.extraction).location.quote,titleSpanCandidate.title+'\n'+workBase);}
    else await assert.rejects(run,e=>e.code==='AI_LOCATION_EVIDENCE_UNRESOLVED'&&e.usage.totalTokens===15);
    assert.equal(calls,1);assert.deepEqual(data,original);
  }
});
