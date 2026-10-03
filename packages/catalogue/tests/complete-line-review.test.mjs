import {test} from 'node:test';
import assert from 'node:assert/strict';
import {completeReviewEvidence} from '../src/ai/complete-review-policy.mjs';
import {completeLinePayload,completeLineContract,bindCompleteInventory,decodeCompleteInventory,compareCompleteInventory,reviewCompleteSource,reviewCompleteRequirements} from '../src/ai/complete-line-review.mjs';
import {compactLinePayload} from '../src/ai/compact-line-review.mjs';
import {bindAnchoredInventory} from '../src/ai/anchored-line-review.mjs';
import {groqSchema} from '../src/ai/groq.mjs';

const source=sourceText=>({title:'Fictional apprenticeship',sourceText});
const condition=(kind='education',strength='mandatory',alternative=null)=>({kind,strength,alternative});
const wire=(candidate,values={})=>({lines:Object.fromEntries(completeLinePayload(candidate).requiredOutputKeys.map(key=>[key,values[key]??'context']))});
const env={SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_complete_review_key'};
const response=value=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}],usage:{prompt_tokens:1000,completion_tokens:500,total_tokens:1500}});

test('recomputed competency boundaries retain applicants/documents and exclude headings/admin from minima',()=>{
  const candidate=source('Requirements:\nGrade 12\nKEY COMPETENCIES:\nAttention to detail\nGood communication\nPlease submit a CV\nOnly shortlisted candidates will be contacted\nJoin our WhatsApp group');
  const payload=completeLinePayload(candidate);
  assert.deepEqual(payload.requiredLineNumbers,[3,5,6,7]);
  assert.equal(payload.requiredOutputKeys.length,9);assert.ok(!('fixedPassages' in payload));
  assert.ok(compactLinePayload(candidate).requiredLineNumbers.includes(4));
  const review=bindCompleteInventory(candidate,wire(candidate,{L3:condition(),L5:condition('other','unstated'),L6:condition('other','unstated'),L7:condition('document'),L9:'promotion'}));
  assert.equal(decodeCompleteInventory(candidate,review).items.length,4);
});

test('full-line answer includes protected conditions without code overwriting wrong model metadata',()=>{
  const candidate=source('Requirements\nValid driving licence advantageous but not essential.\nGrade 12\nHow to apply');
  const valid=wire(candidate,{L3:condition('other','advantage'),L4:condition()});
  const review=bindCompleteInventory(candidate,valid),requirements=decodeCompleteInventory(candidate,review);
  assert.equal(requirements.items.length,2);assert.equal(compareCompleteInventory({candidate,requirements,review}).supported,true);
  assert.doesNotMatch(JSON.stringify(completeLinePayload(candidate)),/"group"|"relation"/);
  for(const L3 of ['context','uncertain',condition('document','advantage'),condition('other','mandatory')])
    assert.throws(()=>decodeCompleteInventory(candidate,bindCompleteInventory(candidate,{lines:{...valid.lines,L3}})),/AI_REVIEW_SOURCE_CONSTRAINT/);
  const omitted=structuredClone(valid);delete omitted.lines.L3;
  assert.throws(()=>decodeCompleteInventory(candidate,bindCompleteInventory(candidate,omitted)),/AI_INVALID_REVIEW_INVENTORY/);
});

test('protected standalone conditions cannot absorb disclaimers, adjacent attributes or alternative anchors',()=>{
  const candidate=source('Requirements\nCandidates must be prepared to undergo medical tests.\nTaking part in the tests does not guarantee placement.\nGrade 12\nHow to apply');
  const valid=wire(candidate,{L3:condition('other'),L5:condition()});
  assert.equal(decodeCompleteInventory(candidate,bindCompleteInventory(candidate,valid)).items.length,2);
  assert.throws(()=>decodeCompleteInventory(candidate,bindCompleteInventory(candidate,{lines:{...valid.lines,L4:3}})),/AI_REVIEW_SOURCE_CONSTRAINT/);
  assert.throws(()=>decodeCompleteInventory(candidate,bindCompleteInventory(candidate,{lines:{...valid.lines,L3:condition('other','mandatory',3),L5:condition('education','mandatory',3)}})),/AI_REVIEW_SOURCE_CONSTRAINT/);
});

test('explicit TVET/vocational alternatives preserve complete introductions and nested subject spans',()=>{
  const candidate=source('What You Bring\nCandidate must have passed the following subjects at TVET college to join the programme:\nMathematics N3-N6\nEngineering Science N3-N6\nOr National Certificate (Vocational) 4\nEngineering Processes\nProfessional Engineering Practice\nClear criminal record\nHow to apply');
  assert.deepEqual(completeLinePayload(candidate).alternativeGroups.map(row=>row.spans),[[[3,5],[6,8]]]);
  const values={L3:condition('education','mandatory',3),L4:3,L5:3,L6:condition('education','mandatory',3),L7:6,L8:6,L9:condition('other')};
  const valid=wire(candidate,values),decoded=decodeCompleteInventory(candidate,bindCompleteInventory(candidate,valid));
  assert.equal(decoded.expression.op,'all');assert.equal(decoded.expression.children[0].op,'any');
  assert.equal(decoded.items[0].fact.quote,'Candidate must have passed the following subjects at TVET college to join the programme:\nMathematics N3-N6\nEngineering Science N3-N6');
  for(const values of [{L3:'context',L4:condition('education','mandatory',4),L5:4,L6:condition('education','mandatory',4)},
    {L6:condition('education','mandatory',3),L7:condition('subjects'),L8:condition('subjects')},
    {L3:condition(),L6:condition()}])
    assert.throws(()=>decodeCompleteInventory(candidate,bindCompleteInventory(candidate,{lines:{...valid.lines,...values}})),/AI_ALTERNATIVE_REQUIREMENT_SPAN|AI_REQUIREMENT_COVERAGE/);
});

test('conditional, future, incomplete and unbounded course lists abstain from inferred complete alternatives',()=>{
  const intro='Candidate must have passed the following subjects at TVET college';
  for(const text of ['What You Bring\n'+intro+' if selected:\nMathematics N3\nOr National Certificate (Vocational) 4\nEngineering Processes\nHow to apply',
    'What You Bring\nIf selected\n'+intro+':\nMathematics N3\nOr National Certificate (Vocational) 4\nEngineering Processes\nHow to apply',
    'What You Bring\n'+intro+':\nMathematics N3\nOr National Certificate (Vocational) 4\nHow to apply',
    'What You Bring\n'+intro+':\nMathematics N3\nOr National Certificate (Vocational) 4\nEngineering Processes',
    'Duties\n'+intro+':\nMathematics N3\nOr National Certificate (Vocational) 4\nEngineering Processes\nHow to apply'])
    assert.deepEqual(completeLinePayload(source(text)).alternativeGroups,[],text);
});

test('standalone current must-clauses constrain strength but do not guess kind or override caveats',()=>{
  const candidate=source('Qualifications and requirements\nMust be medically fit\nMust be willing to work shifts\nGood communication\nHow to apply');
  const hints=completeReviewEvidence(candidate).evidenceHints;
  assert.deepEqual(hints.filter(row=>row.line===3||row.line===4).map(({line,level,kind})=>({line,level,kind})),[{line:3,level:'required',kind:undefined},{line:4,level:'required',kind:undefined}]);
  const valid=wire(candidate,{L3:condition('other'),L4:condition('availability'),L5:condition('other','unstated')});
  assert.equal(decodeCompleteInventory(candidate,bindCompleteInventory(candidate,valid)).items.length,3);
  for(const text of ['Requirements\nMust be medically fit if selected\nHow to apply',
    'Requirements\nPrevious intake\nMust be medically fit\nHow to apply',
    'Key Responsibilities\nMust clean the workshop\nHow to apply'])
    assert.ok(!completeReviewEvidence(source(text)).evidenceHints.some(row=>row.state==='stated'),text);
  assert.throws(()=>decodeCompleteInventory(candidate,bindCompleteInventory(candidate,{lines:{...valid.lines,L3:condition('other','unstated')}})),/AI_INVALID_EXTRACTION/);
});

test('protected qualification uncertainty keeps its complete scope and cannot be silently split or discarded',()=>{
  const candidate=source('Requirements\nGrade 12\nN3 Engineering\nHow to apply');
  const valid=wire(candidate,{L3:'uncertain',L4:3});
  assert.equal(decodeCompleteInventory(candidate,bindCompleteInventory(candidate,valid)).expression.op,'unknown');
  for(const values of [{L3:'context',L4:'context'},{L3:'uncertain',L4:'uncertain'},{L3:condition(),L4:condition()}])
    assert.throws(()=>decodeCompleteInventory(candidate,bindCompleteInventory(candidate,wire(candidate,values))),/AI_REVIEW_SOURCE_CONSTRAINT/);
});

test('explicit low/medium contracts bind separate inventories and cached review cannot cross reasoning settings',async()=>{
  const candidate=source('Requirements\nGrade 12\nHow to apply'),inventory=wire(candidate,{L3:condition()});
  assert.deepEqual(completeLineContract(candidate).schema,completeLineContract(candidate,{thinking:'medium'}).schema);
  assert.notDeepEqual(completeLineContract(candidate),completeLineContract(candidate,{thinking:'medium'}));
  const low=bindCompleteInventory(candidate,inventory),medium=bindCompleteInventory(candidate,inventory,null,{thinking:'medium'});
  const requirements=decodeCompleteInventory(candidate,low);assert.deepEqual(decodeCompleteInventory(candidate,medium),requirements);
  await assert.rejects(reviewCompleteRequirements({candidate,requirements},{env:{},review:medium}),/AI_REVIEW_BINDING_MISMATCH/);
  assert.equal((await reviewCompleteRequirements({candidate,requirements},{env:{},review:medium,thinking:'medium'})).assessment.supported,true);
  assert.throws(()=>decodeCompleteInventory(candidate,{...low,thinking:'medium'}),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>completeLineContract(candidate,{thinking:'high'}),/AI_INVALID_REVIEW_THINKING/);
  assert.throws(()=>decodeCompleteInventory(candidate,bindAnchoredInventory(candidate,inventory)),/AI_REVIEW_BINDING_MISMATCH/);
});

test('blind full-source requests retain the same cap/no retry and preserve usage on source constraint failures',async()=>{
  const candidate=source('Requirements\nValid driving licence advantageous but not essential.\nGrade 12\nHow to apply');let calls=0;
  const valid=wire(candidate,{L3:condition('other','advantage'),L4:condition()});
  const review=await reviewCompleteSource({...candidate,gold:'PRIVATE_GOLD',requirements:'PRIVATE_CLAIMS',applicationCandidates:['PRIVATE_ROUTE']},{env,thinking:'medium',fetchImpl:async(_url,init)=>{
    calls++;const request=JSON.parse(init.body);assert.equal(request.reasoning_effort,'medium');assert.equal(request.max_completion_tokens,3072);
    assert.deepEqual(request.response_format,{type:'json_object'});assert.deepEqual(JSON.parse(request.messages[1].content),completeLinePayload(candidate));
    assert.doesNotMatch(JSON.stringify(request),/PRIVATE_/);return response(valid);}});
  assert.equal(review.thinking,'medium');
  await assert.rejects(reviewCompleteSource(candidate,{env,fetchImpl:async()=>{calls++;return response({...valid,lines:{...valid.lines,L3:'context'}});}}),error=>error.code==='AI_REVIEW_SOURCE_CONSTRAINT'&&error.usage.totalTokens===1500);
  const requirements=decodeCompleteInventory(candidate,review);
  await assert.rejects(reviewCompleteRequirements({candidate,requirements:{...requirements,expression:{op:'ref',id:'missing'}}},{env,fetchImpl:async()=>{calls++;}}),/AI_INVALID_REQUIREMENT_AUDIT/);
  await assert.rejects(reviewCompleteSource({...candidate,sourceText:Array(160).fill('line').join('\n')},{env,fetchImpl:async()=>{calls++;}}),/AI_INPUT_LIMIT/);
  assert.equal(calls,2);
});

test('constant compact prompt schema still requires every full-source key and bounded continuation metadata',()=>{
  const candidate=source('Requirements\nGrade 12\nHow to apply'),large=source(Array(77).fill('Metadata').join('\n'));
  assert.deepEqual(completeLineContract(candidate).schema,completeLineContract(large).schema);
  assert.ok(Buffer.byteLength(JSON.stringify(groqSchema(completeLineContract(large).schema)))<1500);
  const valid=wire(candidate,{L3:condition()});
  for(const mutate of [value=>delete value.lines.L2,value=>value.lines.L99='context',value=>value.lines.L3.group=20,value=>value.lines.L3.alternative=4,value=>value.lines.L3=null]) {
    const changed=structuredClone(valid);mutate(changed);
    assert.throws(()=>decodeCompleteInventory(candidate,bindCompleteInventory(candidate,changed)),/AI_INVALID_REVIEW_INVENTORY/);
  }
});
