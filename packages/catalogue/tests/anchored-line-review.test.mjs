import {test} from 'node:test';
import assert from 'node:assert/strict';
import {anchoredLinePayload,anchoredLineContract,bindAnchoredInventory,decodeAnchoredInventory,compareAnchoredInventory,reviewAnchoredSource,reviewAnchoredRequirements} from '../src/ai/anchored-line-review.mjs';
import {bindCompactInventory,compactLinePayload} from '../src/ai/compact-line-review.mjs';
import {groqSchema} from '../src/ai/groq.mjs';

const source=sourceText=>({title:'Fictional apprenticeship',sourceText});
const condition=(kind='education',strength='mandatory',alternative=null)=>({kind,strength,alternative});
const wire=(candidate,values={})=>({lines:Object.fromEntries(anchoredLinePayload(candidate).requiredOutputKeys.map(key=>[key,values[key]??'context']))});
const env={SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_anchored_review_key'};
const response=value=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}],usage:{prompt_tokens:1000,completion_tokens:500,total_tokens:1500}});

test('independent and code-owned conditions coexist without model group identifiers',()=>{
  const candidate=source('Requirements\nValid driving licence advantageous but not essential.\nGrade 12\nHow to apply');
  const payload=anchoredLinePayload(candidate),review=bindAnchoredInventory(candidate,wire(candidate,{L4:condition()}));
  assert.doesNotMatch(JSON.stringify(payload),/"group"|"relation"/);
  assert.doesNotMatch(JSON.stringify(anchoredLineContract(candidate).schema),/"group"|"relation"/);
  assert.ok(payload.fixedPassages.some(row=>row.kind==='other'&&row.alternative===null));
  const requirements=decodeAnchoredInventory(candidate,review);
  assert.equal(requirements.items.length,2);assert.equal(requirements.expression.op,'all');
  assert.equal(compareAnchoredInventory({candidate,requirements,review}).supported,true);
  assert.deepEqual(payload.requiredOutputKeys,compactLinePayload(candidate).requiredOutputKeys);
});

test('two distinct OR sets preserve complete nested branches and independent conditions in source order',()=>{
  const candidate=source('What You Bring\nTVET course with:\nMathematics\nEngineering Science\nOr Vocational certificate with:\nEngineering Processes\nAdditional credential:\nGrade 12\nOr N3 Engineering\nGood communication\nHow to apply');
  const values={L3:condition('education','mandatory',3),L4:3,L5:3,L6:condition('education','mandatory',3),L7:6,
    L9:condition('education','mandatory',9),L10:condition('education','mandatory',9),L11:condition('other','unstated')};
  const inventory=wire(candidate,values),reverse={lines:Object.fromEntries(Object.entries(inventory.lines).reverse())};
  const requirements=decodeAnchoredInventory(candidate,bindAnchoredInventory(candidate,inventory));
  assert.deepEqual(decodeAnchoredInventory(candidate,bindAnchoredInventory(candidate,reverse)),requirements);
  assert.equal(requirements.items.length,5);assert.equal(requirements.expression.op,'all');
  assert.equal(requirements.expression.children.filter(row=>row.op==='any').length,2);
  assert.equal(requirements.items[0].fact.quote,'TVET course with:\nMathematics\nEngineering Science');
});

test('dangling, future, non-self and singleton alternative anchors fail rather than becoming independent',()=>{
  const candidate=source('What You Bring\nGrade 12\nOr N3 Engineering\nOr N4 Engineering\nHow to apply');
  const valid=wire(candidate,{L3:condition('education','mandatory',3),L4:condition('education','mandatory',3),L5:condition('education','mandatory',3)});
  assert.equal(decodeAnchoredInventory(candidate,bindAnchoredInventory(candidate,valid)).expression.op,'any');
  for(const values of [{L3:condition('education','mandatory',4)},{L3:condition('education','mandatory',2)},
    {L3:condition(),L4:condition('education','mandatory',3)},{L5:condition('education','mandatory',4)},
    {L4:condition(),L5:condition()}]) {
    assert.throws(()=>decodeAnchoredInventory(candidate,bindAnchoredInventory(candidate,{lines:{...valid.lines,...values}})),/AI_INVALID_REVIEW_INVENTORY|AI_REVIEW_ALTERNATIVE_INVALID/);
  }
});

test('anchors cannot target continuations or code-owned conditions; continuations remain adjacent',()=>{
  const candidate=source('What You Bring\nTVET course:\nMathematics\nOr Vocational qualification\nHow to apply');
  const valid=wire(candidate,{L3:condition('education','mandatory',3),L4:3,L5:condition('education','mandatory',3)});
  for(const values of [{L5:condition('education','mandatory',4)},{L4:2},{L4:4}])
    assert.throws(()=>decodeAnchoredInventory(candidate,bindAnchoredInventory(candidate,{lines:{...valid.lines,...values}})),/AI_INVALID_REVIEW_INVENTORY|AI_REVIEW_ALTERNATIVE_INVALID|AI_REVIEW_CONTINUATION_INVALID/);
  const fixed=source('Requirements\nValid driving licence advantageous but not essential.\nGrade 12\nHow to apply');
  assert.throws(()=>decodeAnchoredInventory(fixed,bindAnchoredInventory(fixed,wire(fixed,{L4:condition('education','mandatory',3)}))),/AI_REVIEW_ALTERNATIVE_INVALID/);
});

test('known source alternatives, unresolved scopes and mixed-strength rejection remain enforced',()=>{
  const candidate=source('Requirements\nOne of the following:\nGrade 12\nN3 with:\nMathematics\nEngineering Science\nHow to apply');
  const valid=wire(candidate,{L4:condition('education','mandatory',4),L5:condition('education','mandatory',4),L6:5,L7:5});
  assert.equal(decodeAnchoredInventory(candidate,bindAnchoredInventory(candidate,valid)).expression.op,'any');
  const collapsed=wire(candidate,{L4:condition(),L5:condition(),L6:5,L7:5});
  assert.throws(()=>decodeAnchoredInventory(candidate,bindAnchoredInventory(candidate,collapsed)),/AI_ALTERNATIVE_REQUIREMENT_SPAN/);
  const mixed={lines:{...valid.lines,L5:condition('education','advantage',4)}};
  assert.throws(()=>decodeAnchoredInventory(candidate,bindAnchoredInventory(candidate,mixed)),/AI_MIXED_REQUIREMENT_LEVELS/);
  const unknown=source('Requirements\nGrade 12\nN3 Engineering\nHow to apply');
  assert.equal(decodeAnchoredInventory(unknown,bindAnchoredInventory(unknown,wire(unknown))).expression.op,'unknown');
  assert.throws(()=>decodeAnchoredInventory(unknown,bindAnchoredInventory(unknown,{lines:{...wire(unknown).lines,L3:condition()}})),/AI_INVALID_REVIEW_INVENTORY/);
});

test('compact prompt keeps exact source-dependent keys and rejects legacy grouping or malformed metadata',()=>{
  const small=source('Requirements\nGrade 12\nHow to apply'),large=source(Array(77).fill('Metadata').join('\n'));
  assert.deepEqual(anchoredLineContract(small).schema,anchoredLineContract(large).schema);
  assert.notEqual(anchoredLineContract(small).localSchemaSha256,anchoredLineContract(large).localSchemaSha256);
  assert.ok(Buffer.byteLength(JSON.stringify(groqSchema(anchoredLineContract(large).schema)))<1500);
  const valid=wire(small,{L3:condition()});
  for(const mutate of [value=>delete value.lines.L1,value=>value.lines.L99='context',value=>delete value.lines.L3.alternative,
    value=>value.lines.L3.group=20,value=>value.lines.L3.relation='all',value=>value.lines.L3.strength='invented',value=>value.lines.L3.alternative=0]) {
    const changed=structuredClone(valid);mutate(changed);
    assert.throws(()=>decodeAnchoredInventory(small,bindAnchoredInventory(small,changed)),/AI_INVALID_REVIEW_INVENTORY/);
  }
  assert.throws(()=>decodeAnchoredInventory(small,bindCompactInventory(small,valid)),/AI_REVIEW_BINDING_MISMATCH/);
});

test('blind low JSON request has no compiler identifiers, preserves failed-call usage and performs no retry',async()=>{
  const candidate=source('Requirements\nGrade 12\nHow to apply');let calls=0;
  const review=await reviewAnchoredSource({...candidate,gold:'PRIVATE_GOLD',requirements:'PRIVATE_CLAIMS',applicationCandidates:['PRIVATE_ROUTE']},{env,fetchImpl:async(_url,init)=>{
    calls++;const request=JSON.parse(init.body);assert.equal(request.reasoning_effort,'low');assert.deepEqual(request.response_format,{type:'json_object'});
    assert.equal(request.max_completion_tokens,3072);assert.deepEqual(JSON.parse(request.messages[1].content),anchoredLinePayload(candidate));
    assert.doesNotMatch(JSON.stringify(request),/PRIVATE_|\\"group\\"|\\"relation\\"/);return response(wire(candidate,{L3:condition()}));}});
  const requirements=decodeAnchoredInventory(candidate,review);
  assert.equal((await reviewAnchoredRequirements({candidate,requirements},{env:{},review})).assessment.supported,true);
  await assert.rejects(reviewAnchoredSource(candidate,{env,fetchImpl:async()=>{calls++;return response(wire(candidate,{L3:condition('education','mandatory',3)}));}}),error=>error.code==='AI_REVIEW_ALTERNATIVE_INVALID'&&error.usage.totalTokens===1500);
  await assert.rejects(reviewAnchoredRequirements({candidate,requirements:{...requirements,expression:{op:'ref',id:'missing'}}},{env,fetchImpl:async()=>{calls++;}}),/AI_INVALID_REQUIREMENT_AUDIT/);
  await assert.rejects(reviewAnchoredSource({...candidate,sourceText:Array(160).fill('line').join('\n')},{env,fetchImpl:async()=>{calls++;}}),/AI_INPUT_LIMIT/);
  assert.equal(calls,2);
});

test('fully constrained notice skips the provider without credentials',async()=>{
  const candidate={title:'Fictional company invites unemployed youth to apply',sourceText:'\u200cJoin our WhatsApp group'};let calls=0;
  assert.deepEqual((await reviewAnchoredSource(candidate,{env:{},fetchImpl:async()=>{calls++;}})).inventory,{lines:{}});assert.equal(calls,0);
});
