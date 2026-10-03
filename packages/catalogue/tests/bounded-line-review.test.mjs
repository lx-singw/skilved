import {test} from 'node:test';
import assert from 'node:assert/strict';
import {boundedReviewEvidence,isReviewSectionBoundary} from '../src/ai/bounded-review-policy.mjs';
import {boundedLinePayload,boundedLineContract,bindBoundedInventory,decodeBoundedInventory,compareBoundedInventory,
  reviewBoundedSource,reviewBoundedRequirements} from '../src/ai/bounded-line-review.mjs';
import {lineReviewPayload,bindLineInventory,decodeLineInventory} from '../src/ai/line-requirement-review.mjs';
import {decodeGroqRequirements} from '../src/ai/groq-schema.mjs';
const condition=(kind='education',strength='mandatory',group=1,relation='all')=>({kind,strength,group,relation});
const college={title:'Fictional college apprenticeship',sourceText:'Minimum Requirements:\nGrade 12\nNCV Level 4 Electrical\nN3 Electrical\nCommencement Date:\n01 October 2026\nDuration of Program:\n3 years\nGeneral Instructions:\nApplicants must submit a certified ID copy.\nHow to apply'};
const collegeWire=()=>({lines:{L1:'context',L2:'context',L3:'uncertain',L4:3,L5:3,L6:'context',L7:'context',L8:'context',L9:'context',L10:'context',L11:condition('document'),L12:'context'}});
const env={SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_bounded_review_key'};
const response=value=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}],usage:{prompt_tokens:1200,completion_tokens:500,total_tokens:1700}});

test('versioned policy stops qualification coverage before timing/instructions and preserves independent current documents and ambiguous qualification logic',()=>{
  assert.deepEqual(boundedLinePayload(college).requiredLineNumbers,[3,4,5]);assert.ok(lineReviewPayload(college).requiredLineNumbers.includes(10));
  assert.throws(()=>decodeLineInventory(college,bindLineInventory(college,collegeWire())),/AI_REQUIREMENT_COVERAGE/);
  const review=bindBoundedInventory(college,collegeWire()),requirements=decodeBoundedInventory(college,review);
  assert.equal(requirements.items.length,1);assert.equal(requirements.items[0].kind,'document');
  assert.ok(requirements.expression.children.some(node=>node.op==='unknown'&&node.originalText==='Grade 12\nNCV Level 4 Electrical\nN3 Electrical'));
  const control=compareBoundedInventory({candidate:college,requirements,review});assert.equal(control.supported,true);assert.equal(control.needsReview,true);assert.equal(control.qualification,false);
  const bad=decodeGroqRequirements({items:[{id:'r3',kind:'education',level:'required',state:'stated',span:[3,3]}],expression:'r3'},college);
  const challenge=compareBoundedInventory({candidate:college,requirements:bad,review});assert.equal(challenge.supported,false);
  for(const code of ['REVIEW_MISSING_CONDITION','REVIEW_UNCERTAINTY_LOST','REVIEW_LOGIC_MISMATCH'])assert.ok(challenge.issues.some(issue=>issue.code===code));
});

test('Key Responsibilities ends applicant requirements without dropping a preferred licence or travel condition',()=>{
  const candidate={title:'Fictional apprenticeship',sourceText:'Minimum Requirements\nN6 Engineering\nValid driver’s licence advantageous but not essential.\nWilling and able to travel.\nKey Responsibilities\nAssist technicians with installations.\nLearn to use diagnostic equipment.\nWorking Hours: 08:00 to 17:00\nHow to apply'};
  const wire={lines:{L1:'context',L2:'context',L3:condition(),L4:condition('other','advantage'),L5:condition('availability'),L6:'context',L7:'post_selection',L8:'post_selection',L9:'context',L10:'context'}};
  assert.deepEqual(boundedLinePayload(candidate).requiredLineNumbers,[3,4,5]);assert.ok(lineReviewPayload(candidate).requiredLineNumbers.includes(8));
  const requirements=decodeBoundedInventory(candidate,bindBoundedInventory(candidate,wire));assert.equal(requirements.items.length,3);
  assert.equal(requirements.items[1].level,'preferred');assert.equal(requirements.items[2].kind,'availability');
});

test('section boundaries recognize headings/labelled metadata without treating eligibility prose as a heading',()=>{
  for(const text of ['Commencement Date:','Start Date: 1 October','Duration of Programme: 3 years','• Key Responsibilities','General Instructions:','Duties & Responsibilities','Working Hours: 08:00','Package and Remuneration','Enquiries'])assert.equal(isReviewSectionBoundary(text),true,text);
  for(const text of ['Candidates must be available on the commencement date.','Willing to work these working hours.','General instructions must be followed.','Key responsibilities include working safely.','Start Date must be confirmed before applying.'])assert.equal(isReviewSectionBoundary(text),false,text);
  const candidate={title:'Fictional apprenticeship',sourceText:'Requirements\nGrade 12\nCandidates must be available on the commencement date.\nHow to apply'};
  assert.deepEqual(boundedLinePayload(candidate).requiredLineNumbers,[3,4]);
});

test('new boundaries also bound skills, attributes and ideal profiles while retaining their applicable evidence',()=>{
  for(const [heading,value] of [['Required Skills','Read technical plans'],['Attributes','Integrity'],['The ideal candidate should have:','Grade 12']]){
    const candidate={title:'Fictional apprenticeship',sourceText:heading+'\n'+value+'\nKey Responsibilities\nMaintain machines\nHow to apply'};
    const payload=boundedLinePayload(candidate);assert.ok(payload.requiredLineNumbers.includes(3)||payload.fixedPassages.some(row=>row.span[0]===3&&row.applicability==='current'));
    assert.ok(!payload.requiredLineNumbers.includes(4));assert.ok(!payload.requiredLineNumbers.includes(5));
    assert.ok(!payload.evidenceHints.some(hint=>hint.line===4||hint.line===5));
  }
});

test('recomputed bounded evidence avoids the historical false 40-condition cap and still rejects oversize input before spend',async()=>{
  const candidate={title:'Fictional apprenticeship',sourceText:'Requirements\nGrade 12\nStart Date:\n'+Array(50).fill('Administrative information.').join('\n')+'\nHow to apply'};
  assert.throws(()=>lineReviewPayload(candidate),/AI_INPUT_LIMIT/);assert.deepEqual(boundedLinePayload(candidate).requiredLineNumbers,[3]);
  const lines=Object.fromEntries(boundedLinePayload(candidate).requiredOutputKeys.map(key=>[key,'context']));lines.L3=condition();
  assert.equal(decodeBoundedInventory(candidate,bindBoundedInventory(candidate,{lines})).items.length,1);
  let calls=0;await assert.rejects(reviewBoundedSource({...candidate,sourceText:Array(160).fill('line').join('\n')},{env,fetchImpl:async()=>{calls++;}}),/AI_INPUT_LIMIT/);assert.equal(calls,0);
});

test('new boundaries preserve complete nested ANY branches, independent submission and bounded preparation uncertainty',()=>{
  const candidate={title:'Fictional apprenticeship',sourceText:'Requirements\nOne of the following:\nGrade 12 with Mathematics\nN3 with:\nMathematics\nEngineering Science\nKey Responsibilities\nMaintain machines\nApplication is only complete after you click final submission.\nHow to apply'};
  const wire={lines:{L1:'context',L2:'context',L3:'context',L4:condition('education','mandatory',1,'any'),L5:condition('education','mandatory',1,'any'),L6:5,L7:5,L8:'context',L9:'post_selection',L11:'context'}};
  const requirements=decodeBoundedInventory(candidate,bindBoundedInventory(candidate,wire));assert.equal(requirements.expression.op,'all');assert.ok(requirements.expression.children.some(node=>node.op==='any'));
  assert.ok(requirements.items.some(item=>item.id==='r_10_10'&&item.kind==='document'));
  const preparation={title:'Fictional apprenticeship',sourceText:'Preparation\nPrepare for requirements based on the previous intake.\nGrade 12\nCommencement Date:\nOctober\nHow to apply'};
  const evidence=boundedReviewEvidence(preparation);assert.deepEqual(evidence.unresolvedEvidenceSpans,[[3,4]]);
  assert.ok(evidence.reviewPolicy.scopes.some(row=>row.span[0]===3&&row.span[1]===4&&row.applicability==='preparation'));
});

test('explicit JSON-object transport is blind, bounded and locally strict, with usage retained and no fallback/retry',async()=>{
  let calls=0;const review=await reviewBoundedSource({...college,requirements:'PRIVATE_CLAIMS',gold:'PRIVATE_GOLD',applicationCandidates:['PRIVATE_ROUTE']},{env,fetchImpl:async(_url,init)=>{
    calls++;const request=JSON.parse(init.body);assert.deepEqual(request.response_format,{type:'json_object'});assert.equal(request.reasoning_effort,'low');assert.equal(request.max_completion_tokens,3072);
    assert.match(request.messages[0].content,/Return valid JSON matching this schema/);assert.deepEqual(JSON.parse(request.messages[1].content),boundedLinePayload(college));
    assert.doesNotMatch(JSON.stringify(request),/PRIVATE_/);return response(collegeWire());}});
  assert.equal(review.provenance.outputMode,'json_object');assert.equal(review.provenance.usage.totalTokens,1700);assert.equal(calls,1);
  const wire=collegeWire();delete wire.lines.L6;
  await assert.rejects(reviewBoundedSource(college,{env,fetchImpl:async()=>{calls++;return response(wire);}}),error=>error.code==='AI_INVALID_REVIEW_INVENTORY'&&error.usage.totalTokens===1700);assert.equal(calls,2);
});

test('V5 binding includes its policy/transport; invalid claims fail before spend and cached/fully fixed results need no credentials',async()=>{
  const review=bindBoundedInventory(college,collegeWire()),requirements=decodeBoundedInventory(college,review),input={candidate:college,requirements};let calls=0;
  assert.equal(boundedLineContract(college).outputMode,'json_object');
  assert.equal((await reviewBoundedRequirements(input,{review,env:{}})).assessment.supported,true);
  assert.throws(()=>decodeBoundedInventory(college,bindLineInventory(college,collegeWire())),/AI_REVIEW_BINDING_MISMATCH/);
  const stale={...review,sourceSha256:'changed'};assert.throws(()=>decodeBoundedInventory(college,stale),/AI_REVIEW_BINDING_MISMATCH/);
  const bad=structuredClone(input);bad.requirements.expression.children[0].id='missing';await assert.rejects(reviewBoundedRequirements(bad,{env,fetchImpl:async()=>{calls++;}}),/AI_INVALID_REQUIREMENT_AUDIT/);assert.equal(calls,0);
  const fixed={title:'Fictional company invites unemployed youth to apply',sourceText:'Join our WhatsApp group'};
  assert.deepEqual((await reviewBoundedSource(fixed,{env:{},fetchImpl:async()=>{calls++;}})).inventory,{lines:{}});assert.equal(calls,0);
});
