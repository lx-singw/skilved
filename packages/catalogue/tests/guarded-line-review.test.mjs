import {test} from 'node:test';
import assert from 'node:assert/strict';
import {guardedReviewEvidence} from '../src/ai/guarded-review-policy.mjs';
import {guardedLinePayload,guardedLineContract,bindGuardedInventory,decodeGuardedInventory,compareGuardedInventory,
  reviewGuardedSource,reviewGuardedRequirements} from '../src/ai/guarded-line-review.mjs';
import {bindBoundedInventory,boundedLinePayload} from '../src/ai/bounded-line-review.mjs';
import {decodeGroqRequirements} from '../src/ai/groq-schema.mjs';

const condition=(kind='other',strength='mandatory',group=1,relation='all')=>({kind,strength,group,relation});
const source=text=>({title:'Fictional apprenticeship',sourceText:text});
const wire=(candidate,values={})=>({lines:Object.fromEntries(guardedLinePayload(candidate).requiredOutputKeys.map(key=>[key,values[key]??'context']))});
const college=source('Minimum Requirements:\nGrade 12 with Mathematics and Science;\nNC(V) Level 4 Electrical;\nN3 Electrical.\nCommencement Date:\nOctober\nGeneral Instructions:\nCandidates are to submit the following documents:\nA comprehensive CV with three references;\nCertified ID copy;\nCertified copies of qualifications/academic results;\nCandidates must be prepared to undergo medical and placement tests.\nApplications should be hand delivered / couriered to: Fictional College, 1 Fictional Road.\nPlease mark the application with the correct post title and reference number.\nEnquiries\nContact details\nHow to apply');
const collegeWire=()=>wire(college,{L13:condition()});
const unknowns=node=>node.op==='unknown'?[node]:node.children?node.children.flatMap(unknowns):[];
const env={SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_guarded_review_key'};
const response=value=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}],usage:{prompt_tokens:1200,completion_tokens:500,total_tokens:1700}});

test('ambiguous separate qualifications remain one unknown scope and mandatory documents stay independent with exact quotes',()=>{
  const payload=guardedLinePayload(college);
  assert.ok(payload.fixedPassages.some(row=>row.applicability==='uncertain'&&row.span[0]===3&&row.span[1]===5));
  assert.ok(payload.fixedPassages.some(row=>row.applicability==='context'&&row.span[0]===9));
  assert.deepEqual(payload.fixedPassages.filter(row=>row.applicability==='current').map(row=>row.span),[[10,10],[11,11],[12,12],[14,14],[15,15]]);
  const review=bindGuardedInventory(college,collegeWire()),requirements=decodeGuardedInventory(college,review);
  assert.equal(requirements.items.length,6);assert.ok(requirements.items.every(row=>row.fact.quote.split('\n').length===1));
  assert.equal(unknowns(requirements.expression)[0].originalText,'Grade 12 with Mathematics and Science;\nNC(V) Level 4 Electrical;\nN3 Electrical.');
  const result=compareGuardedInventory({candidate:college,requirements,review});assert.equal(result.supported,true);assert.equal(result.needsReview,true);assert.equal(result.qualification,false);
  const bad=decodeGroqRequirements({items:[{id:'r10',kind:'document',level:'required',state:'stated',span:[10,10]}],expression:'r10'},college);
  const challenge=compareGuardedInventory({candidate:college,requirements:bad,review});assert.equal(challenge.supported,false);
  assert.ok(challenge.issues.some(row=>row.code==='REVIEW_UNCERTAINTY_LOST'));assert.ok(challenge.issues.some(row=>row.code==='REVIEW_MISSING_CONDITION'&&row.span[0]===11));
  assert.ok(boundedLinePayload(college).requiredOutputKeys.includes('L11'));assert.ok(!payload.requiredOutputKeys.includes('L11'));
});

test('explicit alternatives, explicit ALL, embedded subjects and inline connectors do not acquire an invented unknown list',()=>{
  for(const text of ['Requirements\nOne of the following:\nGrade 12\nN3 Engineering\nHow to apply',
    'Requirements\nAll of the following:\nGrade 12\nN3 Engineering\nHow to apply',
    'Requirements\nGrade 12 OR\nN3 Engineering\nHow to apply',
    'Requirements\nGrade 12 with Mathematics and Science\nHow to apply',
    'Requirements\nGrade 12\nN3 with:\nMathematics\nEngineering Science\nHow to apply']) {
    assert.ok(!guardedReviewEvidence(source(text)).reviewPolicy.scopes.some(row=>row.applicability==='uncertain'),text);
  }
  const candidate=source('Requirements\nOne of the following:\nGrade 12\nN3 with:\nMathematics\nEngineering Science\nHow to apply\nApplicants must submit the following documents:\nCertified ID copy;');
  const review=bindGuardedInventory(candidate,wire(candidate,{L4:condition('education','mandatory',1,'any'),L5:condition('education','mandatory',1,'any'),L6:5,L7:5}));
  const requirements=decodeGuardedInventory(candidate,review);assert.equal(requirements.expression.op,'all');
  assert.ok(requirements.expression.children.some(row=>row.op==='any'&&row.children.length===2));assert.ok(requirements.items.some(row=>row.kind==='document'));
  const both=source('Requirements\nAll of the following:\nGrade 12\nN3 Engineering\nHow to apply');
  const combined=decodeGuardedInventory(both,bindGuardedInventory(both,wire(both,{L4:condition('education'),L5:condition('education')})));
  assert.equal(combined.items.length,2);assert.equal(combined.expression.op,'all');assert.equal(unknowns(combined.expression).length,0);
  assert.ok(!guardedLinePayload(both).requiredOutputKeys.includes('L3'));
});

test('optional, conditional, alternative, past and future documents never become code-owned current obligations',()=>{
  for(const text of ['Applicants may submit the following documents:\nCertified ID copy;',
    'Applicants must submit the following documents:\nCertified ID copy if requested;',
    'Applicants must submit the following documents:\nCertified copies of qualifications or certificates;',
    'Successful candidates\nCandidates are to submit the following documents:\nCertified ID copy;',
    'Previous intake guidance\nApplicants must submit the following documents:\nCertified ID copy;',
    'Requirements\nPreference may be given to candidates where policy allows.\nApplications should be posted to: Fictional College.',
    'How to apply\nApplications should be posted to: Fictional College, if requested.',
    'How to apply\nPlease mark the application with the reference number if selected.']) {
    assert.ok(!guardedLinePayload(source(text+'\nHow to apply')).fixedPassages.some(row=>row.applicability==='current'&&row.kind==='document'),text);
  }
  const past=source('Preparation\nPrepare for requirements based on the previous intake.\nApplicants must submit the following documents:\nCertified ID copy;\nHow to apply');
  assert.ok(!guardedLinePayload(past).fixedPassages.some(row=>row.applicability==='current'));
  assert.ok(guardedLinePayload(past).fixedPassages.some(row=>row.applicability==='preparation'&&row.span[1]===5));
});

test('empty, unknown and overlong document lists abstain while a later bounded current list remains independently current',()=>{
  for(const text of ['Applicants must submit the following documents:\nUnknown document name',
    'Applicants must submit the following documents:\n'+Array(11).fill('Certified ID copy;').join('\n')])
    assert.ok(!guardedLinePayload(source(text+'\nHow to apply')).fixedPassages.some(row=>row.applicability==='current'&&row.kind==='document'));
  const candidate=source('Previous intake guidance\nApplicants must submit the following documents:\nCertified ID copy;\nHow to apply\nApplicants must submit the following documents:\nCertified copies of qualifications;');
  const rows=guardedLinePayload(candidate).fixedPassages.filter(row=>row.applicability==='current');assert.deepEqual(rows.map(row=>row.span),[[7,7]]);
});

test('kind and strength judgments remain model-owned, with guidance bound to the new version',()=>{
  const candidate=source('Requirements\nN6 Engineering.\nIdeally recently qualified with limited or no work experience.\nGood communication skills.\nValid driving licence advantageous but not essential.\nWilling and able to travel.\nKey Responsibilities\nMaintain machines.\nHow to apply');
  assert.deepEqual(guardedLinePayload(candidate).requiredLineNumbers,[3,4,5,6,7]);
  const review=bindGuardedInventory(candidate,wire(candidate,{L3:condition('education'),L4:condition('experience','advantage'),L5:condition('other','unstated'),L6:condition('other','advantage'),L7:condition('availability')}));
  const requirements=decodeGuardedInventory(candidate,review);assert.deepEqual(requirements.items.map(row=>[row.kind,row.level]),[['education','required'],['experience','preferred'],['other','unclear'],['other','preferred'],['availability','required']]);
  assert.match(guardedLineContract(candidate).instruction,/A preferred|a preferred/);assert.match(guardedLineContract(candidate).instruction,/document independence/);
});

test('fully blind JSON mode keeps limits and usage, rejects missing/fixed keys with no fallback and permits credential-free reuse',async()=>{
  let calls=0;const review=await reviewGuardedSource({...college,gold:'PRIVATE_EXPECTATIONS',requirements:'PRIVATE_CLAIMS',applicationCandidates:['PRIVATE_ROUTE']},{env,fetchImpl:async(_url,init)=>{
    calls++;const request=JSON.parse(init.body);assert.equal(request.reasoning_effort,'low');assert.deepEqual(request.response_format,{type:'json_object'});
    assert.equal(request.max_completion_tokens,3072);assert.deepEqual(JSON.parse(request.messages[1].content),guardedLinePayload(college));assert.doesNotMatch(JSON.stringify(request),/PRIVATE_/);return response(collegeWire());}});
  assert.equal(calls,1);assert.equal(review.provenance.usage.totalTokens,1700);
  const requirements=decodeGuardedInventory(college,review);assert.equal((await reviewGuardedRequirements({candidate:college,requirements},{review,env:{}})).assessment.supported,true);
  for(const mutate of [value=>delete value.lines.L1,value=>value.lines.L11=condition('document')]) {
    const value=collegeWire();mutate(value);await assert.rejects(reviewGuardedSource(college,{env,fetchImpl:async()=>{calls++;return response(value);}}),error=>error.code==='AI_INVALID_REVIEW_INVENTORY'&&error.usage.totalTokens===1700);
  }
  assert.equal(calls,3);assert.throws(()=>decodeGuardedInventory(college,bindBoundedInventory(college,wire(college))),/AI_REVIEW_BINDING_MISMATCH/);
  await assert.rejects(reviewGuardedSource({...college,sourceText:Array(160).fill('line').join('\n')},{env,fetchImpl:async()=>{calls++;}}),/AI_INPUT_LIMIT/);assert.equal(calls,3);
});

test('all-code unknown source requires no credentials while invalid claimed logic fails before any spend',async()=>{
  const candidate=source('Requirements\nGrade 12\nN3 Engineering\nHow to apply');
  // Only context remains model-owned; supplying a cached context inventory
  // makes it possible to inspect the retained uncertainty without credentials.
  const review=bindGuardedInventory(candidate,wire(candidate));const requirements=decodeGuardedInventory(candidate,review);
  assert.equal(requirements.items.length,0);assert.equal(requirements.expression.op,'unknown');
  assert.equal((await reviewGuardedRequirements({candidate,requirements},{review,env:{}})).assessment.needsReview,true);
  let calls=0;const invalid={...requirements,expression:{op:'ref',id:'missing'}};
  await assert.rejects(reviewGuardedRequirements({candidate,requirements:invalid},{env,fetchImpl:async()=>{calls++;}}),/AI_INVALID_REQUIREMENT_AUDIT/);assert.equal(calls,0);
  const fixed={title:'Fictional company invites unemployed youth to apply',sourceText:'Join our WhatsApp group'};
  assert.deepEqual((await reviewGuardedSource(fixed,{env:{},fetchImpl:async()=>{calls++;}})).inventory,{lines:{}});assert.equal(calls,0);
});
