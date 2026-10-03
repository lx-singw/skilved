import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recordLinePayload,recordLineContract,recordInventorySchema,projectRecordInventory,bindRecordInventory,decodeRecordInventory,compareRecordInventory,reviewRecordSource} from '../src/ai/record-line-review.mjs';
import {submissionLinePayload,bindSubmissionInventory,decodeSubmissionInventory} from '../src/ai/submission-line-review.mjs';
const source=sourceText=>({title:'Fictional apprenticeship',sourceText});
const candidate=source('Requirements\nGrade 12\nMust select training trades in order of priority\nMake selection in the application question.\nHow to apply');
const context=(line,role='context')=>({line,role,kind:'none',strength:'none',anchor:0,alternative:0});
const current=(line,kind='document',alternative=0)=>({line,role:'current',kind,strength:'mandatory',anchor:0,alternative});
const continuation=(line,anchor)=>({...context(line,'continuation'),anchor});
const wire=(candidate,values={})=>({lines:recordLinePayload(candidate).requiredOutputKeys.map(key=>values[key]??context(Number(key.slice(1))))});
const faithful=()=>wire(candidate,{L3:current(3,'education'),L4:current(4),L5:continuation(5,4)});
const decode=(candidate,inventory)=>decodeRecordInventory(candidate,bindRecordInventory(candidate,inventory));

test('uniform records retain the same source policy, complete quotes and deterministic claim comparison',()=>{
  assert.deepEqual(recordLinePayload(candidate),submissionLinePayload(candidate));
  const inventory=faithful(),requirements=decode(candidate,inventory);
  assert.equal(requirements.items.length,2);
  assert.equal(requirements.items[1].fact.quote,'Must select training trades in order of priority\nMake selection in the application question.');
  assert.equal(requirements.items[1].kind,'document');assert.equal(requirements.items[1].level,'required');
  const original={lines:{L1:'context',L2:'context',L3:{kind:'education',strength:'mandatory',alternative:null},L4:{kind:'document',strength:'mandatory',alternative:null},L5:4,L6:'context'}};
  assert.deepEqual(projectRecordInventory(recordLinePayload(candidate),inventory),original);
  assert.deepEqual(requirements,decodeSubmissionInventory(candidate,bindSubmissionInventory(candidate,original)));
  assert.equal(compareRecordInventory({candidate,requirements,review:bindRecordInventory(candidate,inventory)}).supported,true);
  assert.deepEqual(decode(candidate,{lines:[...inventory.lines].reverse()}),requirements);
});

test('native schema is homogeneous and shallow, with exact row count still enforced locally',()=>{
  const contract=recordLineContract(candidate),schema=contract.schema;
  assert.equal(contract.outputMode,'json_schema');
  assert.ok(Buffer.byteLength(JSON.stringify(schema))<2000);
  assert.doesNotMatch(JSON.stringify(schema),/"anyOf"|"\$ref"|"\$schema"/);
  assert.equal(schema.properties.lines.minItems,undefined);assert.equal(schema.properties.lines.maxItems,undefined);
  assert.notEqual(contract.localRecordSchemaSha256,contract.recordSchemaSha256);
  assert.ok(!recordInventorySchema(recordLinePayload(candidate)).safeParse({lines:[]}).success);
  assert.deepEqual(schema.properties.lines.items.required,['line','role','kind','strength','anchor','alternative']);
  assert.equal(schema.properties.lines.items.additionalProperties,false);assert.equal(schema.additionalProperties,false);
  assert.doesNotMatch(contract.instruction,/alternative:null|continuation integers|current OBJECT|non-current STRING/);
});

test('omitted, duplicate, foreign and extra line records are rejected without filling coverage gaps',()=>{
  const missing=faithful();missing.lines.pop();
  const duplicate=faithful();duplicate.lines[5]=context(1);
  const foreign=faithful();foreign.lines[5]=context(7);
  const extra=faithful();extra.lines.push(context(7));
  for(const inventory of [missing,duplicate,foreign,extra,{...faithful(),extra:true}])
    assert.throws(()=>decode(candidate,inventory),/AI_INVALID_REVIEW_INVENTORY|AI_REVIEW_LINE_COVERAGE/);
});

test('contradictory role fields are rejected rather than discarded or interpreted as requirements',()=>{
  for(const row of [{...current(4),kind:'none'},{...current(4),strength:'none'},{...current(4),anchor:3},
    {...context(4),kind:'document'},{...context(4),strength:'mandatory'},{...context(4),anchor:3},
    {...context(4),alternative:4},{...continuation(4,3),alternative:3},continuation(4,0)]){
    const inventory=faithful();inventory.lines[3]=row;
    assert.ok(recordInventorySchema(recordLinePayload(candidate)).safeParse(inventory).success);
    assert.throws(()=>decode(candidate,inventory),/AI_REVIEW_RECORD_ROLE_CONFLICT/);
  }
});

test('native wire validity does not permit singleton alternatives, absent obligations or invalid continuation ownership',()=>{
  for(const [values,code] of [[{L3:current(3,'education',3),L4:current(4),L5:continuation(5,4)},/AI_REVIEW_ALTERNATIVE_INVALID/],
    [{L3:current(3,'education')},/AI_REQUIREMENT_COVERAGE/],
    [{L3:current(3,'education'),L4:current(4),L5:continuation(5,6)},/AI_INVALID_REVIEW_INVENTORY|AI_REVIEW_CONTINUATION/]])
    assert.throws(()=>decode(candidate,wire(candidate,values)),code);
});

test('compiled qualification lines cannot be echoed or used as anchors by record output',()=>{
  const compiled=source('What You Bring\nCandidate must have passed the following subjects at TVET college to join the programme:\nMathematics N3-N6\nEngineering Science N3-N6\nOr National Certificate (Vocational) 4\nEngineering Processes\nProfessional Engineering Practice\nClear criminal record\nHow to apply');
  const inventory=wire(compiled,{L9:current(9,'other')});
  assert.equal(decode(compiled,inventory).items.length,3);
  const echoed=structuredClone(inventory);echoed.lines[1]=context(3);
  assert.throws(()=>decode(compiled,echoed),/AI_REVIEW_LINE_COVERAGE/);
  assert.throws(()=>decode(compiled,wire(compiled,{L9:continuation(9,3)})),/AI_INVALID_REVIEW_INVENTORY/);
  assert.throws(()=>decode(compiled,wire(compiled,{L9:current(9,'other',3)})),/AI_REVIEW_ALTERNATIVE_INVALID/);
});

test('uniform records preserve complete protected uncertainty instead of promoting past intake documents',()=>{
  const preparation=source('Preparation for eligibility requirements from previous intake\nEnsure your application includes the following:\nCV\nHow to apply');
  const decoded=decode(preparation,wire(preparation,{L2:context(2,'preparation'),L3:continuation(3,2),L4:continuation(4,2)}));
  assert.equal(decoded.items.length,0);assert.equal(decoded.expression.op,'unknown');
  assert.throws(()=>decode(preparation,wire(preparation,{L2:context(2,'preparation'),L4:current(4)})),/AI_REVIEW_SOURCE_CONSTRAINT/);
});

test('record reviews reject historical versions, changed source and changed reasoning bindings',()=>{
  const inventory=faithful(),review=bindRecordInventory(candidate,inventory);
  assert.throws(()=>decodeRecordInventory(candidate,bindSubmissionInventory(candidate,projectRecordInventory(recordLinePayload(candidate),inventory))),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>decodeRecordInventory({...candidate,sourceText:candidate.sourceText+'\nContact recruiter'},review),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>decodeRecordInventory(candidate,{...review,thinking:'medium'}),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>recordLineContract(candidate,{thinking:'high'}),/AI_INVALID_REVIEW_THINKING/);
});

test('record source review sends a blind bounded native request, retains invalid usage and never falls back',async()=>{
  const env={SKILVED_AI_MODE:'gemini',SKILVED_AI_MODEL:'gemini-3.5-flash-lite',GEMINI_API_KEY:'synthetic_record_review_key'};
  let calls=0;
  const fetchImpl=async(_url,init)=>{
    calls++;const request=JSON.parse(init.body),contract=recordLineContract(candidate);
    assert.deepEqual(request.generationConfig.responseJsonSchema,contract.schema);
    assert.equal(request.generationConfig.maxOutputTokens,3072);
    assert.equal(request.systemInstruction.parts[0].text,contract.instruction);
    assert.deepEqual(JSON.parse(request.contents[0].parts[0].text),recordLinePayload(candidate));
    assert.doesNotMatch(JSON.stringify(request),/PRIVATE_GOLD|PRIVATE_ROUTE/);
    if(calls===3)return new Response('',{status:400});
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(calls===1?faithful():wire(candidate))}]}}],usageMetadata:{promptTokenCount:100,candidatesTokenCount:50,totalTokenCount:150}});
  };
  const review=await reviewRecordSource({...candidate,gold:'PRIVATE_GOLD',applicationCandidates:['PRIVATE_ROUTE']},{env,fetchImpl});
  assert.equal(decodeRecordInventory(candidate,review).items.length,2);
  await assert.rejects(reviewRecordSource(candidate,{env,fetchImpl}),error=>error.code==='AI_REQUIREMENT_COVERAGE'&&error.usage.totalTokens===150);
  await assert.rejects(reviewRecordSource(candidate,{env,fetchImpl}),error=>error.code==='AI_PROVIDER_REJECTED'&&error.providerStatus===400);
  assert.equal(calls,3);
});
