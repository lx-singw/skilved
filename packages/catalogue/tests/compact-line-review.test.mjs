import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compactLinePayload,compactLineContract,bindCompactInventory,decodeCompactInventory,compareCompactInventory,reviewCompactSource,reviewCompactRequirements} from '../src/ai/compact-line-review.mjs';
import {localLinePayload,localLineContract,bindLocalInventory} from '../src/ai/local-line-review.mjs';
import {groqSchema} from '../src/ai/groq.mjs';

const source=sourceText=>({title:'Fictional apprenticeship',sourceText});
const wire=(candidate,values={})=>({lines:Object.fromEntries(compactLinePayload(candidate).requiredOutputKeys.map(key=>[key,values[key]??'context']))});
const condition=(kind='education',strength='mandatory',group=1,relation='all')=>({kind,strength,group,relation});
const env={SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_compact_review_key'};
const response=value=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}],usage:{prompt_tokens:1000,completion_tokens:500,total_tokens:1500}});

test('one compact prompt schema stays constant while exact local coverage is source-bound',()=>{
  const small=source('Requirements\nGrade 12\nHow to apply'),large=source(Array(77).fill('Metadata').join('\n'));
  assert.deepEqual(compactLineContract(small).schema,compactLineContract(large).schema);
  assert.notEqual(compactLineContract(small).localSchemaSha256,compactLineContract(large).localSchemaSha256);
  assert.ok(Buffer.byteLength(JSON.stringify(groqSchema(compactLineContract(large).schema)))<1500);
  assert.ok(Buffer.byteLength(JSON.stringify(groqSchema(localLineContract(large).schema)))>15000);
  const valid=wire(small,{L3:condition()});
  for(const mutate of [value=>delete value.lines.L1,value=>value.lines.L99='context',value=>value.lines.L3.strength='invented',
    value=>value.lines.L3.extra=true,value=>value.extra={},value=>value.lines.L3=null]) {
    const changed=structuredClone(valid);mutate(changed);
    assert.throws(()=>decodeCompactInventory(small,bindCompactInventory(small,changed)),/AI_INVALID_REVIEW_INVENTORY/);
  }
  assert.throws(()=>decodeCompactInventory(small,bindLocalInventory(small,valid)),/AI_REVIEW_BINDING_MISMATCH/);
});

test('mixed duties retain independent applicant conditions before and after future work',()=>{
  const candidate=source('Duties & Responsibilities\nOne year workshop experience preferred.\nHeavy equipment experience is essential.\nMust be medically fit.\nCleaning machines\nPassing tools\nNo criminal record\nGood attitude\nHow to apply');
  const inventory=wire(candidate,{L3:condition('experience','advantage'),L4:condition('experience'),L5:condition('other'),L8:condition('other'),L9:condition('other','unstated')});
  const review=bindCompactInventory(candidate,inventory),requirements=decodeCompactInventory(candidate,review);
  assert.equal(requirements.items.length,5);assert.equal(compactLinePayload(candidate).fixedPassages.length,0);
  assert.equal(compareCompactInventory({candidate,requirements,review}).supported,true);
  const omitted=structuredClone(requirements);omitted.items.splice(1,1);omitted.expression.children.splice(1,1);
  assert.equal(compareCompactInventory({candidate,requirements:omitted,review}).supported,false);
});

test('bounded attributes stop at employer heading and preserve local as-required wording',()=>{
  const candidate=source('What You Bring\nGrade 12\nPersonal attributes:\nGood communication\nTeamwork and providing support as required\nWho is Example Energy?\nWe provide training\nRewards\nMedical cover\nHow to apply');
  const payload=compactLinePayload(candidate);
  assert.ok(payload.fixedPassages.some(row=>row.span[0]===5&&row.kind==='other'&&row.strength==='unstated'));
  assert.ok(payload.fixedPassages.some(row=>row.span[0]===6&&row.kind==='other'&&row.strength==='unstated'));
  for(const line of [7,8,9,10])assert.ok(payload.requiredOutputKeys.includes('L'+line));
  assert.ok(localLinePayload(candidate).fixedPassages.some(row=>row.span[0]===7&&row.applicability==='current'));
  const decoded=decodeCompactInventory(candidate,bindCompactInventory(candidate,wire(candidate,{L3:condition()})));
  assert.equal(decoded.items.length,3);assert.equal(decoded.items[2].fact.quote,'Teamwork and providing support as required');
});

test('decorated profile qualifications and social invitations retain original source characters',()=>{
  const candidate=source('The ideal candidate should have:\n– National Senior Certificate, preferably Maths and Science\n— Minimum of four N1 engineering subjects.\nHow to apply\n\u200cJoin our WhatsApp group');
  const payload=compactLinePayload(candidate),review=bindCompactInventory(candidate,wire(candidate)),requirements=decodeCompactInventory(candidate,review);
  assert.equal(requirements.items.length,2);assert.ok(requirements.items.every(row=>row.kind==='education'&&row.level==='unclear'));
  assert.equal(requirements.items[1].fact.quote,'— Minimum of four N1 engineering subjects.');
  assert.ok(payload.fixedPassages.some(row=>row.span[0]===6&&row.applicability==='promotion'));
  assert.ok(localLinePayload(candidate).requiredOutputKeys.includes('L4'));
});

test('conditional/past/selected profiles, unbounded attributes and OR clauses are not newly fixed',()=>{
  for(const text of ['Personal attributes:\nGood communication',
    'Successful candidates\nPersonal attributes:\nGood communication\nWho is Example?',
    'Previous intake\nPersonal attributes:\nGood communication\nRewards',
    'Personal attributes:\nGood communication if selected\nRewards',
    'The ideal candidate should have:\n– Grade 12\nor\n— N3 Engineering\nHow to apply']) {
    assert.ok(!compactLinePayload(source(text)).fixedPassages.some(row=>row.applicability==='current'),text);
  }
  const preferred=compactLinePayload(source('Personal attributes:\nPreferred:\nGood communication\nRewards'));
  assert.ok(preferred.fixedPassages.some(row=>row.span[0]===4&&row.strength==='advantage'));
});

test('complete course alternatives keep nested subjects and reject illegal continuations',()=>{
  const candidate=source('What You Bring\nMust have passed the following TVET subjects:\nMathematics N3\nEngineering Science N3\nOr National Certificate Vocational Level 4:\nEngineering Processes\nProfessional Engineering Practice\nHow to apply');
  const valid=wire(candidate,{L3:condition('education','mandatory',1,'any'),L4:3,L5:3,L6:condition('education','mandatory',1,'any'),L7:6,L8:6});
  const decoded=decodeCompactInventory(candidate,bindCompactInventory(candidate,valid));
  assert.equal(decoded.expression.op,'any');assert.equal(decoded.items.length,2);
  for(const values of [{L4:4},{L5:4},{L7:3},{L4:1}]) {
    const changed={lines:{...valid.lines,...values}};
    assert.throws(()=>decodeCompactInventory(candidate,bindCompactInventory(candidate,changed)),/AI_INVALID_REVIEW_INVENTORY|AI_REVIEW_CONTINUATION_INVALID/);
  }
  const fixed=source('The ideal candidate should have:\n– Grade 12\nHow to apply\nCV required');
  assert.throws(()=>decodeCompactInventory(fixed,bindCompactInventory(fixed,wire(fixed,{L4:3,L5:condition('document')}))),/AI_INVALID_REVIEW_INVENTORY/);
});

test('blind JSON-object request retains local failure billing, no retry and credential-free cached review',async()=>{
  const candidate=source('Requirements\nGrade 12\nHow to apply');let calls=0;
  const review=await reviewCompactSource({...candidate,gold:'PRIVATE_GOLD',requirements:'PRIVATE_CLAIMS',applicationCandidates:['PRIVATE_ROUTE']},{env,fetchImpl:async(_url,init)=>{
    calls++;const request=JSON.parse(init.body);assert.equal(request.reasoning_effort,'low');assert.deepEqual(request.response_format,{type:'json_object'});
    assert.equal(request.max_completion_tokens,3072);assert.deepEqual(JSON.parse(request.messages[1].content),compactLinePayload(candidate));
    assert.doesNotMatch(JSON.stringify(request),/PRIVATE_/);return response(wire(candidate,{L3:condition()}));}});
  const requirements=decodeCompactInventory(candidate,review);
  assert.equal((await reviewCompactRequirements({candidate,requirements},{env:{},review})).assessment.supported,true);
  const bad=wire(candidate,{L3:condition()});delete bad.lines.L2;
  await assert.rejects(reviewCompactSource(candidate,{env,fetchImpl:async()=>{calls++;return response(bad);}}),error=>error.code==='AI_INVALID_REVIEW_INVENTORY'&&error.usage.totalTokens===1500);
  await assert.rejects(reviewCompactRequirements({candidate,requirements:{...requirements,expression:{op:'ref',id:'missing'}}},{env,fetchImpl:async()=>{calls++;}}),/AI_INVALID_REQUIREMENT_AUDIT/);
  await assert.rejects(reviewCompactSource({...candidate,sourceText:Array(160).fill('line').join('\n')},{env,fetchImpl:async()=>{calls++;}}),/AI_INPUT_LIMIT/);
  assert.equal(calls,2);
});

test('fully constrained notice skips the provider and requires no credentials',async()=>{
  const candidate={title:'Fictional company invites unemployed youth to apply',sourceText:'\u200cJoin our WhatsApp group'};let calls=0;
  assert.deepEqual((await reviewCompactSource(candidate,{env:{},fetchImpl:async()=>{calls++;}})).inventory,{lines:{}});assert.equal(calls,0);
});
