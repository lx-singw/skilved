import {test} from 'node:test';
import assert from 'node:assert/strict';
import {profileReviewEvidence} from '../src/ai/profile-review-policy.mjs';
import {profileLinePayload,profileLineContract,bindProfileInventory,decodeProfileInventory,compareProfileInventory,reviewProfileSource,reviewProfileRequirements} from '../src/ai/profile-line-review.mjs';
import {completeLinePayload,bindCompleteInventory} from '../src/ai/complete-line-review.mjs';

const source=sourceText=>({title:'Fictional apprenticeship',sourceText});
const condition=(strength='unstated',kind='other')=>({kind,strength,alternative:null});
const wire=(candidate,values={})=>({lines:Object.fromEntries(profileLinePayload(candidate).requiredOutputKeys.map(key=>[key,values[key]??'context']))});
const typed=candidate=>profileReviewEvidence(candidate).evidenceHints.filter(row=>row.kind==='other').map(({line,level})=>({line,level}));

test('bounded competencies constrain applicability and their own strength without preference spillover',()=>{
  const candidate=source('KEY COMPETENCIES:\nAttention to detail\nGood written and verbal communication skills\nA technical foundation would be beneficial to the incumbent\nBasic computer skills\nHow to apply');
  assert.deepEqual(typed(candidate),[{line:3,level:'unclear'},{line:4,level:'unclear'},{line:5,level:'preferred'},{line:6,level:'unclear'}]);
  assert.equal(completeLinePayload(candidate).sourceConstraints.length,0);
  const valid=wire(candidate,{L3:condition(),L4:condition(),L5:condition('advantage'),L6:condition()});
  const review=bindProfileInventory(candidate,valid),requirements=decodeProfileInventory(candidate,review);
  assert.equal(requirements.items.length,4);assert.equal(requirements.items[2].fact.quote,'A technical foundation would be beneficial to the incumbent');
  assert.equal(compareProfileInventory({candidate,requirements,review}).supported,true);
  for(const L4 of ['context','post_selection',condition('mandatory'),condition('unstated','document')])
    assert.throws(()=>decodeProfileInventory(candidate,bindProfileInventory(candidate,{lines:{...valid.lines,L4}})),/AI_REVIEW_SOURCE_CONSTRAINT/);
  assert.throws(()=>decodeProfileInventory(candidate,bindProfileInventory(candidate,{lines:{...valid.lines,L5:condition()}})),/AI_REVIEW_SOURCE_CONSTRAINT/);
});

test('current profile traits retain unstated strength while standalone must clauses remain mandatory',()=>{
  const candidate=source('What You Bring\nHard-working, driven, able to work under pressure\nMust have attention to detail\nEagerness to learn and grow\nAbility to follow instructions and work well in a team\nHow to apply');
  assert.deepEqual(typed(candidate),[{line:3,level:'unclear'},{line:4,level:'required'},{line:5,level:'unclear'},{line:6,level:'unclear'}]);
  assert.equal(decodeProfileInventory(candidate,bindProfileInventory(candidate,wire(candidate,{L3:condition(),L4:condition('mandatory'),L5:condition(),L6:condition()}))).items.length,4);
});

test('held South African driving licence remains other, separate from an independent copy submission',()=>{
  const candidate=source('Qualifications and requirements\n– Valid South African driver’s license\nStrong communication and interpersonal skills\nPlease submit a copy of your driving licence\nHow to apply');
  const valid=wire(candidate,{L3:condition(),L4:condition(),L5:condition('mandatory','document')});
  assert.equal(decodeProfileInventory(candidate,bindProfileInventory(candidate,valid)).items.length,3);
  assert.deepEqual(typed(candidate),[{line:3,level:'unclear'},{line:4,level:'unclear'}]);
  assert.throws(()=>decodeProfileInventory(candidate,bindProfileInventory(candidate,{lines:{...valid.lines,L3:condition('mandatory','document')}})),/AI_REVIEW_SOURCE_CONSTRAINT/);
  assert.throws(()=>decodeProfileInventory(candidate,bindProfileInventory(candidate,{lines:{...valid.lines,L4:3}})),/AI_REVIEW_SOURCE_CONSTRAINT/);
});

test('unbounded, future, caveated, negative, compound and unknown prose receive no new profile facts',()=>{
  for(const text of ['Key competencies\nAttention to detail',
    'Key Responsibilities\nGood communication\nHow to apply',
    'What You Bring\nIf selected\nGood communication\nHow to apply',
    'Key competencies\nPrevious intake required good communication\nAttention to detail\nHow to apply',
    'Key competencies\nGood communication if selected\nHow to apply',
    'Key competencies\nGood communication or a certificate\nHow to apply',
    'Key competencies\nNo computer skills required\nHow to apply',
    'Key competencies\nStrong communication; submit a certificate\nHow to apply',
    'Key competencies\nAn unusual technical phrase\nHow to apply'])
    assert.equal(typed(source(text)).length,0,text);
});

test('qualification uncertainty, complete branches and submission evidence retain precedence',()=>{
  const candidate=source('What You Bring\nGrade 12\nN3 Engineering\nAttention to detail\nHow to apply');
  const payload=profileLinePayload(candidate);
  assert.ok(payload.sourceConstraints.some(row=>row.applicability==='uncertain'&&row.span[0]===3&&row.span[1]===4));
  const decoded=decodeProfileInventory(candidate,bindProfileInventory(candidate,wire(candidate,{L3:'uncertain',L4:3,L5:condition()})));
  assert.equal(decoded.items.length,1);assert.equal(decoded.expression.op,'all');
  assert.throws(()=>decodeProfileInventory(candidate,bindProfileInventory(candidate,wire(candidate,{L3:condition('mandatory','education'),L4:condition('mandatory','education'),L5:condition()}))),/AI_REVIEW_SOURCE_CONSTRAINT/);
});

test('V11 binds policy, source, exact schema and reasoning independently of historical V10',async()=>{
  const candidate=source('Key competencies\nAttention to detail\nHow to apply'),inventory=wire(candidate,{L3:condition()});
  const low=bindProfileInventory(candidate,inventory),medium=bindProfileInventory(candidate,inventory,null,{thinking:'medium'});
  assert.deepEqual(decodeProfileInventory(candidate,low),decodeProfileInventory(candidate,medium));
  assert.throws(()=>decodeProfileInventory(candidate,bindCompleteInventory(candidate,inventory)),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>decodeProfileInventory(candidate,{...low,thinking:'medium'}),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>profileLineContract(candidate,{thinking:'high'}),/AI_INVALID_REVIEW_THINKING/);
  assert.throws(()=>decodeProfileInventory({...candidate,sourceText:candidate.sourceText+'\nChanged'},low),/AI_REVIEW_BINDING_MISMATCH/);
  const requirements=decodeProfileInventory(candidate,low);
  await assert.rejects(reviewProfileRequirements({candidate,requirements},{env:{},review:medium}),/AI_REVIEW_BINDING_MISMATCH/);
  assert.equal((await reviewProfileRequirements({candidate,requirements},{env:{},review:low})).qualification,false);
});

test('blind V11 requests keep cap/no retries, private fields excluded and usage on rejected source answers',async()=>{
  const candidate=source('Key competencies\nAttention to detail\nHow to apply');let calls=0;
  const env={SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_profile_review_key'};
  await assert.rejects(reviewProfileSource({...candidate,requirements:'PRIVATE_CLAIMS',gold:'PRIVATE_AUDIT',applicationCandidates:['PRIVATE_ROUTE']},{env,fetchImpl:async(_url,init)=>{
    calls++;const request=JSON.parse(init.body);assert.equal(request.max_completion_tokens,3072);assert.equal(request.reasoning_effort,'low');
    assert.doesNotMatch(JSON.stringify(request),/PRIVATE_/);assert.deepEqual(JSON.parse(request.messages[1].content),profileLinePayload(candidate));
    return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(wire(candidate))}}],usage:{prompt_tokens:100,completion_tokens:100,total_tokens:200}});
  }}),error=>error.code==='AI_REVIEW_SOURCE_CONSTRAINT'&&error.usage.totalTokens===200);
  assert.equal(calls,1);
});
