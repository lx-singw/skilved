import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nativeLinePayload,nativeLineContract,bindNativeInventory,decodeNativeInventory,reviewNativeSource,compareNativeInventory} from '../src/ai/native-line-review.mjs';
import {submissionLinePayload,submissionLineContract,bindSubmissionInventory,decodeSubmissionInventory} from '../src/ai/submission-line-review.mjs';
import {groqSchema} from '../src/ai/groq.mjs';
const candidate={title:'Fictional apprenticeship',sourceText:'Requirements\nGrade 12\nMust select training trades in order of priority\nMake selection in the application question.\nHow to apply'};
const current=(kind='document',alternative=null)=>({kind,strength:'mandatory',alternative});
const wire=(values={})=>({lines:Object.fromEntries(nativeLinePayload(candidate).requiredOutputKeys.map(key=>[key,values[key]??'context']))});
const faithful=()=>wire({L3:current('education'),L4:current(),L5:4});

test('native experiment preserves the V13 payload, literal provider prompt and local constraints',()=>{
  const previous=submissionLineContract(candidate),next=nativeLineContract(candidate);
  assert.deepEqual(nativeLinePayload(candidate),submissionLinePayload(candidate));
  assert.equal(next.instruction,previous.instruction+'\nReturn valid JSON matching this schema. All required keys must be present:\n'+JSON.stringify(groqSchema(previous.schema)));
  assert.equal(next.localSchemaSha256,previous.localSchemaSha256);
  assert.equal(next.outputMode,'json_schema');assert.notEqual(next.version,previous.version);
  const requirements=decodeNativeInventory(candidate,bindNativeInventory(candidate,faithful()));
  assert.deepEqual(requirements,decodeSubmissionInventory(candidate,bindSubmissionInventory(candidate,faithful())));
  assert.equal(compareNativeInventory({candidate,requirements,review:bindNativeInventory(candidate,faithful())}).supported,true);
});

test('native schema requires every residual line and constrains roles, condition keys and continuation bounds',()=>{
  const schema=nativeLineContract(candidate).schema,lines=schema.properties.lines;
  assert.deepEqual(lines.required,nativeLinePayload(candidate).requiredOutputKeys);
  assert.equal(schema.additionalProperties,false);assert.equal(lines.additionalProperties,false);
  assert.doesNotMatch(JSON.stringify(schema),/"\$schema"/);
  const resolve=node=>node.$ref?node.$ref.slice(2).split('/').reduce((value,key)=>value[key],schema):node;
  const [role,condition,continuation]=lines.properties.L5.anyOf.map(resolve);
  assert.ok(role.enum.includes('context'));assert.ok(!role.enum.includes('document'));
  assert.deepEqual(condition.required,['kind','strength','alternative']);assert.equal(condition.additionalProperties,false);
  assert.ok(resolve(condition.properties.kind).enum.includes('document'));
  assert.equal(continuation.type,'integer');assert.equal(continuation.maximum,4);
  assert.deepEqual(condition.properties.alternative.anyOf,[{type:'integer',minimum:1,maximum:5},{type:'null'}]);
});

test('native schema never replaces local rejection of unsupported labels, omissions or extra keys',()=>{
  for(const inventory of [wire({L3:current('education'),L4:'document'}),{lines:{L3:current('education')}},{...faithful(),extra:true}])
    assert.throws(()=>decodeNativeInventory(candidate,bindNativeInventory(candidate,inventory)),/AI_INVALID_REVIEW_INVENTORY/);
});

test('wire-valid alternatives and omissions still require semantic validation',()=>{
  assert.throws(()=>decodeNativeInventory(candidate,bindNativeInventory(candidate,wire({L3:current('education',3),L4:current(),L5:4}))),/AI_REVIEW_ALTERNATIVE_INVALID/);
  assert.throws(()=>decodeNativeInventory(candidate,bindNativeInventory(candidate,wire({L3:current('education')}))),/AI_REQUIREMENT_COVERAGE/);
});

test('native reviews reject old versions, changed source and changed reasoning bindings',()=>{
  const review=bindNativeInventory(candidate,faithful());
  assert.throws(()=>decodeNativeInventory(candidate,bindSubmissionInventory(candidate,faithful())),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>decodeSubmissionInventory(candidate,review),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>decodeNativeInventory({...candidate,sourceText:candidate.sourceText+'\nContact recruiter'},review),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>decodeNativeInventory(candidate,{...review,thinking:'medium'}),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>nativeLineContract(candidate,{thinking:'high'}),/AI_INVALID_REVIEW_THINKING/);
});

test('native Gemini request sends the exact source schema, unchanged prompt and bounded blind payload',async()=>{
  const env={SKILVED_AI_MODE:'gemini',SKILVED_AI_MODEL:'gemini-3.5-flash-lite',GEMINI_API_KEY:'synthetic_native_review_key'};
  let calls=0;
  const fetchImpl=async(url,init)=>{
    calls++;assert.ok(url.endsWith('gemini-3.5-flash-lite:generateContent'));
    const request=JSON.parse(init.body),contract=nativeLineContract(candidate);
    assert.deepEqual(request.generationConfig.responseJsonSchema,contract.schema);
    assert.equal(request.generationConfig.responseMimeType,'application/json');
    assert.equal(request.generationConfig.maxOutputTokens,3072);
    assert.equal(request.systemInstruction.parts[0].text,contract.instruction);
    assert.deepEqual(JSON.parse(request.contents[0].parts[0].text),nativeLinePayload(candidate));
    assert.doesNotMatch(JSON.stringify(request),/PRIVATE_GOLD|PRIVATE_ROUTE/);
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(calls===1?faithful():wire({L3:current('education')}))}]}}],
      usageMetadata:{promptTokenCount:100,candidatesTokenCount:50,totalTokenCount:150}});
  };
  const review=await reviewNativeSource({...candidate,gold:'PRIVATE_GOLD',applicationCandidates:['PRIVATE_ROUTE']},{env,fetchImpl});
  assert.equal(decodeNativeInventory(candidate,review).items.length,2);
  await assert.rejects(reviewNativeSource(candidate,{env,fetchImpl}),error=>error.code==='AI_REQUIREMENT_COVERAGE'&&error.usage.totalTokens===150);
  assert.equal(calls,2);
});

test('native schema rejection stops after one request without a JSON-object fallback',async()=>{
  let calls=0;
  await assert.rejects(reviewNativeSource(candidate,{env:{SKILVED_AI_MODE:'gemini',SKILVED_AI_MODEL:'gemini-3.5-flash-lite',GEMINI_API_KEY:'synthetic_native_review_key'},
    fetchImpl:async()=>{calls++;return new Response('',{status:400});}}),error=>error.code==='AI_PROVIDER_REJECTED'&&error.providerStatus===400);
  assert.equal(calls,1);
});
