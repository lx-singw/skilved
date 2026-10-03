import {test} from 'node:test';
import assert from 'node:assert/strict';
import {localReviewEvidence} from '../src/ai/local-review-policy.mjs';
import {localLinePayload,localLineContract,bindLocalInventory,decodeLocalInventory,compareLocalInventory,reviewLocalSource,reviewLocalRequirements} from '../src/ai/local-line-review.mjs';
import {guardedLinePayload,bindGuardedInventory} from '../src/ai/guarded-line-review.mjs';
import {decodeGroqRequirements} from '../src/ai/groq-schema.mjs';

const source=sourceText=>({title:'Fictional apprenticeship',sourceText});
const wire=(candidate,values={})=>({lines:Object.fromEntries(localLinePayload(candidate).requiredOutputKeys.map(key=>[key,values[key]??'context']))});
const condition=(kind='education',strength='mandatory',group=1,relation='all')=>({kind,strength,group,relation});
const env={SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_local_review_key'};
const response=value=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}],usage:{prompt_tokens:1500,completion_tokens:500,total_tokens:2000}});

test('held licence and submitted copy keep distinct kinds, preference and source quotes',()=>{
  const candidate=source('Requirements\nValid driver’s licence advantageous but not essential.\nApplicants must submit a copy of their driving licence.\nHow to apply');
  const payload=localLinePayload(candidate);assert.ok(!payload.requiredOutputKeys.includes('L3'));assert.ok(payload.requiredOutputKeys.includes('L4'));
  const review=bindLocalInventory(candidate,wire(candidate,{L4:condition('document')})),requirements=decodeLocalInventory(candidate,review);
  assert.deepEqual(requirements.items.map(row=>[row.kind,row.level]),[['other','preferred'],['document','required']]);
  assert.equal(requirements.items[0].fact.quote,'Valid driver’s licence advantageous but not essential.');
  const bad=decodeGroqRequirements({items:[{id:'r3',kind:'document',level:'preferred',state:'stated',span:[3,3]},{id:'r4',kind:'document',level:'required',state:'stated',span:[4,4]}],expression:'all(r3,r4)'},candidate);
  assert.ok(compareLocalInventory({candidate,requirements:bad,review}).issues.some(row=>row.code==='REVIEW_KIND_MISMATCH'&&row.span[0]===3));
});

test('current test readiness stays single-line and a standalone disclaimer cannot extend it',()=>{
  const candidate=source('How to apply\nCandidates must be prepared to undergo medical and placement tests .\n(NB: Taking part in the tests does not guarantee placement in the program).\nEnquiries\nContact details');
  const review=bindLocalInventory(candidate,wire(candidate)),requirements=decodeLocalInventory(candidate,review);
  assert.equal(requirements.items.length,1);assert.equal(requirements.items[0].kind,'other');assert.equal(requirements.items[0].level,'required');
  assert.equal(requirements.items[0].fact.quote,'Candidates must be prepared to undergo medical and placement tests .');
  assert.ok(localLinePayload(candidate).fixedPassages.some(row=>row.applicability==='context'&&row.span[0]===4));
  const invalid=wire(candidate);invalid.lines.L4=3;assert.throws(()=>decodeLocalInventory(candidate,bindLocalInventory(candidate,invalid)),/AI_INVALID_REVIEW_INVENTORY/);
  const bad=decodeGroqRequirements({items:[{id:'r3',kind:'other',level:'required',state:'stated',span:[3,4]}],expression:'r3'},candidate);
  assert.equal(compareLocalInventory({candidate,requirements:bad,review}).supported,false);
});

test('bounded current ideal-profile qualifications retain stated applicability with unclear strength',()=>{
  const candidate=source('The ideal candidate should have:\nA National Senior Certificate preferably with Mathematics and Science.\nFour N1 engineering subjects.\nHow to apply');
  const review=bindLocalInventory(candidate,wire(candidate)),requirements=decodeLocalInventory(candidate,review);
  assert.deepEqual(requirements.items.map(row=>[row.kind,row.level,row.fact.state]),[['education','unclear','stated'],['education','unclear','stated']]);
  assert.equal(requirements.expression.op,'all');assert.equal(compareLocalInventory({candidate,requirements,review}).needsReview,false);
  assert.ok(guardedLinePayload(candidate).requiredOutputKeys.includes('L3'));
  assert.doesNotMatch(localLineContract(candidate).instruction,/Multiple separate qualifications without an explicit relationship retain one entire uncertain scope/);
});

test('conditional, previous-intake and post-selection wording abstains from new current facts',()=>{
  for(const text of ['Requirements\nValid driving licence preferred if requested.\nHow to apply',
    'Requirements\nValid driving licence where required.\nHow to apply',
    'Successful candidates\nCandidates must be prepared to undergo medical tests.\nHow to apply',
    'Previous intake guidance\nCandidates must be prepared to undergo placement tests.\nHow to apply',
    'How to apply\nCandidates must be prepared to undergo medical tests, if selected.',
    'The ideal candidate should have:\nGrade 12 if required.\nHow to apply',
    'Successful candidates\nThe ideal candidate should have:\nGrade 12\nHow to apply']) {
    assert.ok(!localLinePayload(source(text)).fixedPassages.some(row=>row.applicability==='current'),text);
  }
  const candidate=source('Preparation\nPrepare for requirements based on the previous intake.\nCandidates must be prepared to undergo placement tests.\nHow to apply');
  assert.ok(localLinePayload(candidate).fixedPassages.some(row=>row.applicability==='preparation'));
  assert.ok(!localLinePayload(candidate).fixedPassages.some(row=>row.applicability==='current'));
});

test('unknown qualification lists and complete nested alternatives stay intact; conditional/disclaimer compounds are not hidden',()=>{
  const unknown=source('Requirements\nGrade 12\nN3 Engineering\nHow to apply');
  const retained=decodeLocalInventory(unknown,bindLocalInventory(unknown,wire(unknown)));assert.equal(retained.expression.op,'unknown');
  const candidate=source('Requirements\nOne of the following:\nGrade 12\nN3 with:\nMathematics\nEngineering Science\nHow to apply');
  const review=bindLocalInventory(candidate,wire(candidate,{L4:condition('education','mandatory',1,'any'),L5:condition('education','mandatory',1,'any'),L6:5,L7:5}));
  assert.equal(decodeLocalInventory(candidate,review).expression.op,'any');
  const compound=source('Requirements\nGrade 12\nTaking part in the tests does not guarantee placement; applicants must submit certificates.\nHow to apply');
  assert.ok(localLinePayload(compound).requiredOutputKeys.includes('L4'));
});

test('profile OR connectors and unbounded lists do not acquire inferred independent code conditions',()=>{
  const alternative=source('The ideal candidate should have:\nGrade 12\nor\nN3 Engineering\nHow to apply');
  assert.ok(!localLinePayload(alternative).fixedPassages.some(row=>row.applicability==='current'));
  assert.throws(()=>localLinePayload(source('The ideal candidate should have:\nGrade 12\nN3 Engineering')),/AI_REVIEW_POLICY_SCOPE_UNBOUNDED/);
});

test('blind low JSON review retains strict validation, billing and version binding without retry; invalid claims/source fail before spend',async()=>{
  const candidate=source('Requirements\nValid driving licence advantageous but not essential.\nGrade 12\nHow to apply');let calls=0;
  const review=await reviewLocalSource({...candidate,gold:'PRIVATE_EXPECTATIONS',requirements:'PRIVATE_CLAIMS',applicationCandidates:['PRIVATE_ROUTE']},{env,fetchImpl:async(_url,init)=>{
    calls++;const request=JSON.parse(init.body);assert.equal(request.reasoning_effort,'low');assert.deepEqual(request.response_format,{type:'json_object'});assert.equal(request.max_completion_tokens,3072);
    assert.deepEqual(JSON.parse(request.messages[1].content),localLinePayload(candidate));assert.doesNotMatch(JSON.stringify(request),/PRIVATE_/);return response(wire(candidate,{L4:condition()}));}});
  const requirements=decodeLocalInventory(candidate,review);assert.equal((await reviewLocalRequirements({candidate,requirements},{env:{},review})).assessment.supported,true);
  const bad=wire(candidate,{L4:condition()});delete bad.lines.L1;
  await assert.rejects(reviewLocalSource(candidate,{env,fetchImpl:async()=>{calls++;return response(bad);}}),error=>error.code==='AI_INVALID_REVIEW_INVENTORY'&&error.usage.totalTokens===2000);assert.equal(calls,2);
  assert.throws(()=>decodeLocalInventory(candidate,bindGuardedInventory(candidate,wire(candidate,{L4:condition()}))),/AI_REVIEW_BINDING_MISMATCH/);
  await assert.rejects(reviewLocalSource({...candidate,sourceText:Array(160).fill('line').join('\n')},{env,fetchImpl:async()=>{calls++;}}),/AI_INPUT_LIMIT/);
  const invalid={...requirements,expression:{op:'ref',id:'missing'}};await assert.rejects(reviewLocalRequirements({candidate,requirements:invalid},{env,fetchImpl:async()=>{calls++;}}),/AI_INVALID_REQUIREMENT_AUDIT/);assert.equal(calls,2);
});

test('fully constrained source retains zero-call credential-free behavior',async()=>{
  const candidate={title:'Fictional company invites unemployed youth to apply',sourceText:'Join our WhatsApp group'};let calls=0;
  assert.deepEqual((await reviewLocalSource(candidate,{env:{},fetchImpl:async()=>{calls++;}})).inventory,{lines:{}});assert.equal(calls,0);
});
