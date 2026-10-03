import {test} from 'node:test';
import assert from 'node:assert/strict';
import {submissionLinePayload,submissionLineContract,bindSubmissionInventory,decodeSubmissionInventory,reviewSubmissionSource} from '../src/ai/submission-line-review.mjs';
import {bindMixedInventory,decodeMixedInventory} from '../src/ai/mixed-line-review.mjs';

const source=sourceText=>({title:'Fictional apprenticeship',sourceText});
const candidate=source('Requirements\nGrade 12\nMust select training trades in order of priority\nMake selection in the application question.\nHow to apply');
const current=(kind='document',strength='mandatory')=>({kind,strength,alternative:null});
const wire=(candidate,values)=>({lines:Object.fromEntries(submissionLinePayload(candidate).requiredOutputKeys.map(key=>[key,values[key]??'context']))});
const values={L3:current('education'),L4:current(),L5:4};

test('a strength-only obligation anchor retains its complete multi-line submission instruction',()=>{
  const inventory=wire(candidate,values);
  assert.throws(()=>decodeMixedInventory(candidate,bindMixedInventory(candidate,inventory)),/AI_REQUIREMENT_EVIDENCE_SPAN/);
  const result=decodeSubmissionInventory(candidate,bindSubmissionInventory(candidate,inventory));
  assert.equal(result.items.length,2);
  assert.equal(result.items[1].kind,'document');assert.equal(result.items[1].level,'required');
  assert.equal(result.items[1].fact.quote,'Must select training trades in order of priority\nMake selection in the application question.');
  const hint=submissionLinePayload(candidate).evidenceHints.find(row=>row.line===4);
  assert.equal(hint.spanPolicy,'anchor');assert.equal(hint.kind,undefined);
});

test('anchors still reject omitted obligations and weakened strength',()=>{
  for(const change of [{L4:'context',L5:'context'},{L4:current('document','advantage')},{L4:'context',L5:current()}])
    assert.throws(()=>decodeSubmissionInventory(candidate,bindSubmissionInventory(candidate,wire(candidate,{...values,...change}))),/AI_REQUIREMENT_COVERAGE|AI_SOURCE_ROLE_CONFLICT|AI_INVALID_EXTRACTION/);
});

test('independent obligations and typed evidence cannot be merged into an anchored span',()=>{
  const independent=source('Requirements\nGrade 12\nMust select training trades in order of priority\nMake selection in the application question.\nMust be available for travel\nHow to apply');
  assert.throws(()=>decodeSubmissionInventory(independent,bindSubmissionInventory(independent,wire(independent,{...values,L6:4}))),/AI_REQUIREMENT_EVIDENCE_SPAN|AI_REVIEW_SOURCE_CONSTRAINT/);
  assert.throws(()=>decodeSubmissionInventory(candidate,bindSubmissionInventory(candidate,wire(candidate,{L3:current('education'),L4:3,L5:3}))),/AI_REVIEW_SOURCE_CONSTRAINT|AI_REQUIREMENT_EVIDENCE_SPAN/);
});

test('anchored submission spans cannot absorb protected programme context',()=>{
  const programme=source('Requirements\nGrade 12\nMust select training trades in order of priority\nMake selection in the application question.\nABOUT THE PROGRAMME\nSuccessful candidates:\nWill attend training\nHow to apply');
  assert.throws(()=>decodeSubmissionInventory(programme,bindSubmissionInventory(programme,wire(programme,{...values,L6:4}))),/AI_REVIEW_SOURCE_CONSTRAINT/);
});

test('caveated obligations retain uncertainty and typed hints never advertise flexible spans',()=>{
  const caveated=source('Preparation for eligibility requirements from previous intake\nMust provide certified copies of qualifications\nHow to apply');
  assert.ok(!submissionLinePayload(caveated).evidenceHints.some(h=>h.spanPolicy==='anchor'));
  const typed=source('Personal attributes\nMust have attention to detail\nHow to apply');
  assert.ok(submissionLinePayload(typed).evidenceHints.every(h=>h.kind===undefined||h.spanPolicy===undefined));
});

test('submission reviews bind source, policy, version and reasoning without accepting prior reviews',()=>{
  const inventory=wire(candidate,values),review=bindSubmissionInventory(candidate,inventory);
  assert.throws(()=>decodeSubmissionInventory(candidate,bindMixedInventory(candidate,inventory)),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>decodeSubmissionInventory({...candidate,sourceText:candidate.sourceText+'\nContact recruiter'},review),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>decodeSubmissionInventory(candidate,{...review,thinking:'medium'}),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>submissionLineContract(candidate,{thinking:'high'}),/AI_INVALID_REVIEW_THINKING/);
});

test('submission review sends a blind bounded Gemini request and retains usage on an invalid answer',async()=>{
  const env={SKILVED_AI_MODE:'gemini',SKILVED_AI_MODEL:'gemini-3.5-flash-lite',GEMINI_API_KEY:'synthetic_submission_review_key'};
  let calls=0;
  const fetchImpl=async(_url,init)=>{
    calls++;const request=JSON.parse(init.body);
    assert.equal(request.generationConfig.maxOutputTokens,3072);
    assert.doesNotMatch(JSON.stringify(request),/PRIVATE_GOLD|PRIVATE_ROUTE/);
    assert.deepEqual(JSON.parse(request.contents[0].parts[0].text),submissionLinePayload(candidate));
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(wire(candidate,calls===1?values:{L3:current('education')}))}]}}],
      usageMetadata:{promptTokenCount:100,candidatesTokenCount:50,totalTokenCount:150}});
  };
  const review=await reviewSubmissionSource({...candidate,gold:'PRIVATE_GOLD',applicationCandidates:['PRIVATE_ROUTE']},{env,fetchImpl});
  assert.equal(decodeSubmissionInventory(candidate,review).items.length,2);
  await assert.rejects(reviewSubmissionSource(candidate,{env,fetchImpl}),error=>error.code==='AI_REQUIREMENT_COVERAGE'&&error.usage.totalTokens===150);
  assert.equal(calls,2);
});
