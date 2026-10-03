import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compiledReviewPayload,compiledReviewContract,bindCompiledInventory,decodeCompiledInventory,compareCompiledInventory,
  reviewCompiledSource,reviewCompiledRequirements,COMPILED_REQUIREMENT_REVIEW_VERSION} from '../src/ai/compiled-requirement-review.mjs';
import {groqSchema} from '../src/ai/groq.mjs';

const candidate={title:'Fictional apprenticeship',sourceText:'Role expectations\nThe selected candidate will embody our values.\nLive our principles.\nRequirements\nGrade 12\nCVs with certificates will be considered.\nHow to apply\nApplication is only complete after you click final submission.\nPreference may be given to local candidates where agreements require it.\nJoin our WhatsApp group\nApply now'};
const context=(first,last,applicability='context')=>({span:[first,last],applicability});
const current=(line,kind,group=1,relation='all')=>({span:[line,line],applicability:'current',kind,strength:'mandatory',group,relation});
const inventory=()=>({segments:{s_1_2:[context(1,2)],s_5_6:[context(5,5),current(6,'education')],s_8_8:[context(8,8)],s_12_12:[context(12,12)]}});
const setup=()=>{const review=bindCompiledInventory(candidate,inventory());return {candidate,review,requirements:decodeCompiledInventory(candidate,review)};};
const env={SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_compiled_review_key'};
const response=value=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}],usage:{prompt_tokens:1100,completion_tokens:600,total_tokens:1700}});

test('code supplies scopes, document gates and promotion without a model row, preserving every source line',()=>{
  const payload=compiledReviewPayload(candidate);
  assert.deepEqual(payload.remainingSegments,{s_1_2:[1,2],s_5_6:[5,6],s_8_8:[8,8],s_12_12:[12,12]});
  assert.deepEqual(payload.fixedPassages.map(row=>({span:row.span,applicability:row.applicability})),[
    {span:[3,4],applicability:'post_selection'},{span:[7,7],applicability:'current'},
    {span:[9,9],applicability:'current'},{span:[10,10],applicability:'conditional'},{span:[11,11],applicability:'promotion'}]);
  assert.ok(payload.fixedPassages.filter(row=>row.applicability==='current').every(row=>row.group===20&&row.relation==='all'));
  const data=setup(),result=compareCompiledInventory(data);assert.equal(result.supported,true);assert.equal(result.needsReview,true);assert.equal(result.qualification,false);
  assert.deepEqual(result.ownership,{codePassages:5,modelSegments:4,modelPassages:5});
  assert.deepEqual(data.requirements.items.map(item=>[item.id,item.kind,item.level]),[['r_6_6','education','required'],['r_7_7','document','required'],['r_9_9','document','required']]);
  assert.ok(data.requirements.expression.children.some(node=>node.op==='unknown'&&node.originalText.includes('Preference may be given')));
});

test('provider schema requires current metadata and forbids metadata on all other row branches',()=>{
  const contract=compiledReviewContract(candidate),schema=groqSchema(contract.schema);
  const branches=schema.properties.segments.properties.s_1_2.items.anyOf;
  assert.equal(branches.length,2);assert.ok(branches[0].required.includes('group'));assert.ok(branches[0].required.includes('kind'));
  assert.equal(branches[0].properties.group.maximum,19);assert.equal(branches[0].properties.kind.type,'string');
  assert.deepEqual(branches[1].required,['span','applicability']);assert.equal(branches[1].additionalProperties,false);
  assert.ok(!Object.hasOwn(branches[1].properties,'kind'));
  for(const mutate of [wire=>delete wire.segments.s_5_6[1].group,wire=>wire.segments.s_5_6[1].kind=null,
    wire=>wire.segments.s_5_6[1].group=20,wire=>wire.segments.s_1_2[0].kind=null,
    wire=>wire.segments.s_1_2[0].strength='unstated']) {
    const wire=inventory();mutate(wire);assert.throws(()=>decodeCompiledInventory(candidate,bindCompiledInventory(candidate,wire)),/AI_INVALID_REVIEW_INVENTORY/);
  }
});

test('required named segments prevent omission, overwrite, crossing, gaps, overlap or source reordering',()=>{
  for(const [mutate,code] of [
    [wire=>delete wire.segments.s_8_8,'AI_INVALID_REVIEW_INVENTORY'],
    [wire=>wire.segments.s_3_4=[current(3,'other')],'AI_INVALID_REVIEW_INVENTORY'],
    [wire=>wire.segments.s_1_2[0].span=[1,4],'AI_INVALID_REVIEW_INVENTORY'],
    [wire=>wire.segments.s_1_2=[context(1,1)],'AI_REVIEW_SEGMENT_INCOMPLETE'],
    [wire=>wire.segments.s_1_2=[context(2,2),context(1,1)],'AI_REVIEW_SEGMENT_PARTITION'],
    [wire=>wire.segments.s_1_2=[context(1,2),context(2,2)],'AI_REVIEW_SEGMENT_PARTITION'],
  ]){const wire=inventory();mutate(wire);assert.throws(()=>decodeCompiledInventory(candidate,bindCompiledInventory(candidate,wire)),new RegExp(code));}
});

test('code-owned past-intake scope and audience uncertainty survive without any echoed source-scope rows',()=>{
  const source={title:'Fictional apprenticeship',sourceText:'We invite unemployed youth to apply.\nPreparation\nPrepare for requirements based on the previous intake.\nGrade 12\nCurrent application page specifically says certified copies are required.\nHow to apply'};
  const payload=compiledReviewPayload(source);
  assert.ok(payload.fixedPassages.some(row=>row.span[0]===2&&row.applicability==='uncertain'));
  assert.ok(payload.fixedPassages.some(row=>row.span[0]===4&&row.span[1]===5&&row.applicability==='preparation'));
  assert.ok(payload.fixedPassages.some(row=>row.span[0]===6&&row.kind==='document'&&row.strength==='mandatory'));
  const wire={segments:{s_1_1:[context(1,1)],s_3_3:[context(3,3)],s_7_7:[context(7,7)]}};
  const requirements=decodeCompiledInventory(source,bindCompiledInventory(source,wire));
  assert.equal(requirements.items.length,1);assert.equal(requirements.items[0].id,'r_6_6');
  assert.equal(requirements.expression.children.filter(node=>node.op==='unknown').length,2);
});

test('confirmed-current document compilation does not upgrade optional or past-intake wording',()=>{
  for(const line of ['Previous application page specifically says certified copies are required.',
    'Current application page specifically says certified copies are optional.',
    'Current application page specifically says applicants must have certified copies, if requested.',
    'Current application page specifically says certified copies are not required.']) {
    const source={title:'Fictional apprenticeship',sourceText:line+'\nHow to apply'};
    assert.ok(!compiledReviewPayload(source).fixedPassages.some(row=>row.applicability==='current'&&row.span[0]===2));
  }
});

test('model ANY remains intact alongside independent code-owned submission conditions',()=>{
  const source={title:'Fictional apprenticeship',sourceText:'Requirements\nOne of the following:\nGrade 12\nN3 Engineering\nHow to apply\nApplication is only complete after you click final submission.'};
  const payload=compiledReviewPayload(source);assert.equal(payload.alternativeGroups.length,1);
  const wire={segments:{s_1_6:[context(1,3),current(4,'education',1,'any'),current(5,'education',1,'any'),context(6,6)]}};
  const requirements=decodeCompiledInventory(source,bindCompiledInventory(source,wire));
  assert.equal(requirements.expression.op,'all');assert.ok(requirements.expression.children.some(node=>node.op==='any'&&node.children.length===2));
  assert.ok(requirements.items.some(item=>item.id==='r_7_7'&&item.kind==='document'));
  wire.segments.s_1_6[1].relation='all';wire.segments.s_1_6[2].relation='all';
  assert.throws(()=>decodeCompiledInventory(source,bindCompiledInventory(source,wire)),/AI_ALTERNATIVE_REQUIREMENT_SPAN/);
});

test('blind low-reasoning request uses bounded schema segments, rejects local failures without retry and retains usage',async()=>{
  let calls=0;const review=await reviewCompiledSource({...candidate,requirements:'private-claims',gold:'private-gold',applicationCandidates:['private-route']},{env,fetchImpl:async(_url,init)=>{
    calls++;const request=JSON.parse(init.body),payload=JSON.parse(request.messages[1].content);
    assert.equal(request.reasoning_effort,'low');assert.equal(request.max_completion_tokens,3072);
    assert.equal(request.response_format.json_schema.name,COMPILED_REQUIREMENT_REVIEW_VERSION);
    assert.deepEqual(payload,compiledReviewPayload(candidate));assert.doesNotMatch(JSON.stringify(payload),/private-|extracted/);return response(inventory());}});
  assert.equal(calls,1);assert.equal(review.provenance.usage.totalTokens,1700);
  const wire=inventory();wire.segments.s_1_2=[context(1,1)];
  await assert.rejects(reviewCompiledSource(candidate,{env,fetchImpl:async()=>{calls++;return response(wire);}}),error=>error.code==='AI_REVIEW_SEGMENT_INCOMPLETE'&&error.usage.totalTokens===1700);assert.equal(calls,2);
});

test('invalid claims and stale bindings fail without spend; cached and fully fixed reviews need no credentials',async()=>{
  const data=setup();let calls=0;const options={env,fetchImpl:async()=>{calls++;}};
  const invalid=structuredClone(data);invalid.requirements.expression.children[0].id='missing';
  await assert.rejects(reviewCompiledRequirements(invalid,options),/AI_INVALID_REQUIREMENT_AUDIT/);assert.equal(calls,0);
  assert.equal((await reviewCompiledRequirements(data,{env:{},review:data.review})).assessment.supported,true);
  for(const key of ['version','sourceSha256','contractSha256']){const review=structuredClone(data.review);review[key]='changed';assert.throws(()=>decodeCompiledInventory(candidate,review),/AI_REVIEW_BINDING_MISMATCH/);}
  await assert.rejects(reviewCompiledSource({...candidate,sourceText:'x'.repeat(96000)},options),/AI_INPUT_LIMIT/);assert.equal(calls,0);
  const fixed={title:'Fictional company invites unemployed youth to apply',sourceText:'Join our WhatsApp group'};
  const review=await reviewCompiledSource(fixed,{env:{},fetchImpl:async()=>{calls++;}});
  assert.deepEqual(review.inventory,{segments:{}});assert.equal(review.provenance,null);assert.equal(calls,0);
  assert.equal(decodeCompiledInventory(fixed,review).expression.op,'unknown');
});
