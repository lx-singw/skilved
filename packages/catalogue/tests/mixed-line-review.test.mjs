import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mixedLinePayload,mixedLineContract,bindMixedInventory,decodeMixedInventory,compareMixedInventory,reviewMixedSource,reviewMixedRequirements} from '../src/ai/mixed-line-review.mjs';
import {mixedReviewEvidence} from '../src/ai/mixed-review-policy.mjs';
import {bindProfileInventory} from '../src/ai/profile-line-review.mjs';

const source=sourceText=>({title:'Fictional apprenticeship',sourceText});
const condition=(kind='other',strength='mandatory',alternative=null)=>({kind,strength,alternative});
const wire=(candidate,values={})=>({lines:Object.fromEntries(mixedLinePayload(candidate).requiredOutputKeys.map(key=>[key,values[key]??'context']))});
const branchText='What You Bring\nCandidate must have passed the following subjects at TVET college to join the programme:\nMathematics N3-N6\nEngineering Science N3-N6\nOr National Certificate (Vocational) 4\nEngineering Processes\nProfessional Engineering Practice\nClear criminal record\nHow to apply';

test('explicit source qualification branches compile before AI and cannot be duplicated, merged or anchored by it',()=>{
  const candidate=source(branchText),payload=mixedLinePayload(candidate);
  assert.deepEqual(payload.compiledQualificationGroups,[{kind:'education',strength:'mandatory',spans:[[3,5],[6,8]]}]);
  assert.deepEqual(payload.requiredOutputKeys,['L1','L2','L9','L10']);
  assert.deepEqual(payload.remainingSegments,{s_1_2:[1,2],s_9_10:[9,10]});
  const inventory=wire(candidate,{L9:condition()}),review=bindMixedInventory(candidate,inventory),requirements=decodeMixedInventory(candidate,review);
  assert.equal(requirements.items.length,3);assert.equal(requirements.expression.children[0].op,'any');
  assert.equal(requirements.items[0].fact.quote,'Candidate must have passed the following subjects at TVET college to join the programme:\nMathematics N3-N6\nEngineering Science N3-N6');
  assert.deepEqual(compareMixedInventory({candidate,requirements,review}).ownership,{compiledQualificationBranches:2,sourceConstraints:0,modelLines:4});
  for(const values of [{L3:condition('education')},{L9:3},{L9:condition('other','mandatory',3)}])
    assert.throws(()=>decodeMixedInventory(candidate,bindMixedInventory(candidate,{lines:{...inventory.lines,...values}})),/AI_INVALID_REVIEW_INVENTORY|AI_REVIEW_ALTERNATIVE_INVALID/);
  const missing=structuredClone(inventory);delete missing.lines.L2;
  assert.throws(()=>decodeMixedInventory(candidate,bindMixedInventory(candidate,missing)),/AI_INVALID_REVIEW_INVENTORY/);
});

test('source-owned and residual model alternatives coexist without group collisions',()=>{
  const candidate=source(branchText.replace('How to apply','Either prior mechanical experience\nOr prior electrical experience\nHow to apply'));
  const review=bindMixedInventory(candidate,wire(candidate,{L9:condition(),L10:condition('experience','mandatory',10),L11:condition('experience','mandatory',10)}));
  const decoded=decodeMixedInventory(candidate,review);
  assert.equal(decoded.items.length,5);assert.deepEqual(decoded.expression.children.map(child=>child.op),['any','ref','any']);
  assert.equal(decoded.expression.children[0].children.length,2);assert.equal(decoded.expression.children[2].children.length,2);
});

test('caveated, incomplete and unfamiliar qualification alternatives remain model-owned',()=>{
  for(const text of [branchText.replace('to join the programme:','if selected:'),
    branchText.replace('Engineering Processes\nProfessional Engineering Practice\n',''),
    branchText.replace('Mathematics N3-N6','An unfamiliar course'),
    'Requirements\nOne of the following:\nGrade 12\nN3 Engineering\nHow to apply'])
    assert.deepEqual(mixedLinePayload(source(text)).compiledQualificationGroups,[],text);
});

test('programme boundaries stop minimum coverage and explicit application lists select independent documents',()=>{
  const candidate=source('Requirements\nGrade 12\nABOUT THE PROGRAMME\nSuccessful candidates:\nWill not work overtime unless authorized\nWill attend programme training\nEnsure your application include the following:\nCertified Copy of National ID not older than 3 months\nHighest School qualification certified copy\nFull motivation letter\nContactable phone number plus email\nAll attachments must be uploaded when making application\nIf you are dynamic and proactive, we encourage you to apply.\nQueries: Contact the recruiter\nEmployment Equity\nGeneral equity policy\nHow to apply');
  assert.deepEqual(mixedLinePayload(candidate).requiredLineNumbers,[3,9,10,11,12,13]);
  const values={L3:condition('education'),L5:'context',L6:'post_selection',L7:'post_selection',L9:condition('document'),L10:condition('document'),L11:condition('document'),L12:condition('document'),L13:condition('document')};
  const decoded=decodeMixedInventory(candidate,bindMixedInventory(candidate,wire(candidate,values)));
  assert.equal(decoded.items.length,6);assert.deepEqual(decoded.items.slice(1).map(row=>row.kind),Array(5).fill('document'));
  assert.throws(()=>decodeMixedInventory(candidate,bindMixedInventory(candidate,wire(candidate,{...values,L8:condition('document')}))),/AI_REVIEW_SOURCE_CONSTRAINT/);
});

test('similar heading prose and conditional document introductions do not fabricate section boundaries',()=>{
  const candidate=source('Requirements\nKnowledge about the programme is advantageous\nIf selected, ensure your application includes the following:\nCV\nHow to apply');
  const evidence=mixedReviewEvidence(candidate);
  assert.ok(!evidence.reviewPolicy.scopes.some(row=>row.span[0]===3));
  assert.ok(!evidence.evidenceHints.some(row=>row.line===5&&row.state==='stated'&&row.kind==='document'));
  const unbounded=source('ABOUT THE PROGRAMME\nSuccessful candidates:\nWill attend training\nEnsure your application includes the following:\nCV');
  assert.deepEqual(mixedLinePayload(unbounded).requiredLineNumbers,[]);
});

test('V12 cached reviews bind source, schema, reasoning and version without claiming qualification',async()=>{
  const candidate=source(branchText),inventory=wire(candidate,{L9:condition()}),review=bindMixedInventory(candidate,inventory),requirements=decodeMixedInventory(candidate,review);
  assert.equal((await reviewMixedRequirements({candidate,requirements},{env:{},review})).qualification,false);
  assert.throws(()=>decodeMixedInventory(candidate,bindProfileInventory(candidate,inventory)),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>decodeMixedInventory({...candidate,sourceText:branchText.replace('Mathematics','Maths')},review),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>decodeMixedInventory(candidate,{...review,thinking:'medium'}),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>mixedLineContract(candidate,{thinking:'high'}),/AI_INVALID_REVIEW_THINKING/);
  await assert.rejects(reviewMixedRequirements({candidate,requirements},{review,thinking:'medium'}),/AI_REVIEW_BINDING_MISMATCH/);
});

test('blind source-owned branch requests preserve cap, exclude private claims and retain usage on invalid residuals',async()=>{
  const candidate=source(branchText);let calls=0;
  const env={SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_mixed_review_key'};
  const review=await reviewMixedSource({...candidate,requirements:'PRIVATE_CLAIMS',gold:'PRIVATE_GOLD',applicationCandidates:['PRIVATE_ROUTE']},{env,fetchImpl:async(_url,init)=>{
    calls++;const request=JSON.parse(init.body);assert.equal(request.max_completion_tokens,3072);assert.equal(request.reasoning_effort,'low');
    assert.doesNotMatch(JSON.stringify(request),/PRIVATE_/);assert.deepEqual(JSON.parse(request.messages[1].content),mixedLinePayload(candidate));
    return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(wire(candidate,{L9:condition()}))}}],usage:{prompt_tokens:100,completion_tokens:100,total_tokens:200}});
  }});
  assert.equal(decodeMixedInventory(candidate,review).items.length,3);
  await assert.rejects(reviewMixedSource(candidate,{env,fetchImpl:async()=>{calls++;return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(wire(candidate))}}],usage:{prompt_tokens:100,completion_tokens:100,total_tokens:200}});}}),error=>error.code==='AI_REQUIREMENT_COVERAGE'&&error.usage.totalTokens===200);
  assert.equal(calls,2);
});

test('explicit past-intake preparation keeps its document checklist in one unresolved scope',()=>{
  const candidate=source('Preparation for eligibility requirements from previous intake\nEnsure your application includes the following:\nCV\nHow to apply');
  const payload=mixedLinePayload(candidate);assert.ok(payload.sourceConstraints.some(row=>row.applicability==='preparation'&&row.span[0]===2&&row.span[1]===4));
  const decoded=decodeMixedInventory(candidate,bindMixedInventory(candidate,wire(candidate,{L2:'preparation',L3:2,L4:2})));
  assert.equal(decoded.items.length,0);assert.equal(decoded.expression.op,'unknown');
  assert.throws(()=>decodeMixedInventory(candidate,bindMixedInventory(candidate,wire(candidate,{L2:'preparation',L3:'context',L4:condition('document')}))),/AI_REVIEW_SOURCE_CONSTRAINT/);
});