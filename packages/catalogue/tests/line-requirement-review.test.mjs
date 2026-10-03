import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lineReviewPayload,lineReviewContract,lineReviewBudget,bindLineInventory,decodeLineInventory,compareLineInventory,
  reviewLineSource,reviewLineRequirements,LINE_REQUIREMENT_REVIEW_VERSION} from '../src/ai/line-requirement-review.mjs';
import {groqSchema} from '../src/ai/groq.mjs';

const candidate={title:'Fictional apprenticeship',sourceText:'Role expectations\nThe selected candidate will embody our values.\nLive our principles.\nRequirements\nGrade 12\nCVs with certificates will be considered.\nHow to apply\nApplication is only complete after you click final submission.\nPreference may be given to local candidates where agreements require it.\nJoin our WhatsApp group\nApply now'};
const condition=(kind='education',group=1,relation='all')=>({kind,strength:'mandatory',group,relation});
const inventory=()=>({lines:{L1:'context',L2:'context',L5:'context',L6:condition(),L8:'context',L12:'context'}});
const setup=()=>{const review=bindLineInventory(candidate,inventory());return {candidate,review,requirements:decodeLineInventory(candidate,review)};};
const env={SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_line_review_key'};
const response=value=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}],usage:{prompt_tokens:1300,completion_tokens:500,total_tokens:1800}});

test('provider schema requires every residual line including headings and forbids code-owned/extra keys and incomplete metadata',()=>{
  const payload=lineReviewPayload(candidate),schema=groqSchema(lineReviewContract(candidate).schema);
  assert.deepEqual(payload.requiredOutputKeys,['L1','L2','L5','L6','L8','L12']);
  assert.deepEqual(schema.properties.lines.required,payload.requiredOutputKeys);assert.equal(schema.properties.lines.additionalProperties,false);
  assert.equal(schema.properties.lines.properties.L5.anyOf.length,2);assert.equal(schema.properties.lines.properties.L6.anyOf.length,3);
  for(const mutate of [wire=>delete wire.lines.L5,wire=>wire.lines.L7='context',wire=>wire.lines.L13='context',
    wire=>delete wire.lines.L6.group,wire=>wire.lines.L6.kind=null,wire=>wire.lines.L6.group=20,
    wire=>wire.lines.L6.applicability='current',wire=>wire.lines.L8=null]) {
    const wire=inventory();mutate(wire);assert.throws(()=>decodeLineInventory(candidate,bindLineInventory(candidate,wire)),/AI_INVALID_REVIEW_INVENTORY/);
  }
});

test('source-ordered compilation is independent of JSON property order and retains code-owned documents and unknown scopes',()=>{
  const data=setup(),reversed={lines:Object.fromEntries(Object.entries(inventory().lines).reverse())};
  assert.deepEqual(decodeLineInventory(candidate,bindLineInventory(candidate,reversed)),data.requirements);
  assert.deepEqual(data.requirements.items.map(({id,kind,level})=>[id,kind,level]),[
    ['r_6_6','education','required'],['r_7_7','document','required'],['r_9_9','document','required']]);
  const result=compareLineInventory(data);assert.equal(result.supported,true);assert.equal(result.needsReview,true);assert.equal(result.qualification,false);
  assert.deepEqual(result.ownership,{codePassages:5,modelLines:6,modelPassages:5});
});

test('continuations preserve complete nested qualification alternatives and reject changed ANY or mixed strengths',()=>{
  const source={title:'Fictional apprenticeship',sourceText:'Requirements\nOne of the following:\nGrade 12 with Mathematics\nN3 with:\nMathematics\nEngineering Science\nMain responsibilities\nMaintain machines'};
  const wire={lines:{L1:'context',L2:'context',L3:'context',L4:condition('education',1,'any'),L5:condition('education',1,'any'),L6:5,L7:5,L8:'context',L9:'post_selection'}};
  const requirements=decodeLineInventory(source,bindLineInventory(source,wire));
  assert.equal(requirements.expression.op,'any');assert.equal(requirements.items.length,2);
  assert.equal(requirements.items[1].fact.quote,'N3 with:\nMathematics\nEngineering Science');
  wire.lines.L4.relation='all';wire.lines.L5.relation='all';assert.throws(()=>decodeLineInventory(source,bindLineInventory(source,wire)),/AI_ALTERNATIVE_REQUIREMENT_SPAN/);
  wire.lines.L4.relation='any';wire.lines.L5.relation='any';wire.lines.L5.strength='advantage';
  assert.throws(()=>decodeLineInventory(source,bindLineInventory(source,wire)),/AI_MIXED_REQUIREMENT_LEVELS/);
});

test('unknown continuations retain one exact scope; chained, non-adjacent, context and cross-segment references reject',()=>{
  const source={title:'Fictional apprenticeship',sourceText:'Past conditions cannot be confirmed.\nRequirements might differ for each trade.\nGrade 12 is mandatory.\nHow to apply'};
  const wire={lines:{L1:'context',L2:'uncertain',L3:2,L4:condition(),L5:'context'}};
  const result=decodeLineInventory(source,bindLineInventory(source,wire));
  assert.ok(result.expression.children.some(node=>node.op==='unknown'&&node.originalText==='Past conditions cannot be confirmed.\nRequirements might differ for each trade.'));
  for(const mutate of [data=>data.lines.L2=1,data=>data.lines.L4=3,data=>data.lines.L5=2]){
    const data=structuredClone(wire);mutate(data);assert.throws(()=>decodeLineInventory(source,bindLineInventory(source,data)),/AI_REVIEW_CONTINUATION_INVALID/);
  }
  const data=inventory();data.lines.L8=6;assert.throws(()=>decodeLineInventory(candidate,bindLineInventory(candidate,data)),/AI_INVALID_REVIEW_INVENTORY/);
});

test('blind low-reasoning request retains cap and usage; a missing heading fails without automatic retry',async()=>{
  let calls=0;
  const review=await reviewLineSource({...candidate,requirements:'private-claims',gold:'private-gold',applicationCandidates:['private-route']},{env,fetchImpl:async(_url,init)=>{
    calls++;const request=JSON.parse(init.body),payload=JSON.parse(request.messages[1].content);
    assert.equal(request.reasoning_effort,'low');assert.equal(request.max_completion_tokens,3072);
    assert.equal(request.response_format.json_schema.name,LINE_REQUIREMENT_REVIEW_VERSION);
    assert.deepEqual(payload,lineReviewPayload(candidate));assert.doesNotMatch(JSON.stringify(payload),/private-/);return response(inventory());}});
  assert.equal(calls,1);assert.equal(review.provenance.usage.totalTokens,1800);
  const wire=inventory();delete wire.lines.L5;
  await assert.rejects(reviewLineSource(candidate,{env,fetchImpl:async()=>{calls++;return response(wire);}}),error=>error.code==='AI_INVALID_REVIEW_INVENTORY'&&error.usage.totalTokens===1800);
  assert.equal(calls,2);
});

test('binding, output/input limits and bad claims fail before spend; cached and fully fixed reviews need no credentials',async()=>{
  const data=setup();let calls=0;const options={env,fetchImpl:async()=>{calls++;}};
  const bad=structuredClone(data);bad.requirements.expression.children[0].id='missing';
  await assert.rejects(reviewLineRequirements(bad,options),/AI_INVALID_REQUIREMENT_AUDIT/);assert.equal(calls,0);
  assert.equal((await reviewLineRequirements(data,{env:{},review:data.review})).assessment.supported,true);
  for(const key of ['version','sourceSha256','contractSha256']){const review=structuredClone(data.review);review[key]='changed';assert.throws(()=>decodeLineInventory(candidate,review),/AI_REVIEW_BINDING_MISMATCH/);}
  const circular={};circular.lines=circular;assert.throws(()=>decodeLineInventory(candidate,bindLineInventory(candidate,circular)),/AI_INVALID_REVIEW_INVENTORY/);
  assert.throws(()=>decodeLineInventory(candidate,bindLineInventory(candidate,{lines:{L1:'x'.repeat(96000)}})),/AI_OUTPUT_LIMIT/);
  await assert.rejects(reviewLineSource({...candidate,sourceText:Array(160).fill('line').join('\n')},options),/AI_INPUT_LIMIT/);assert.equal(calls,0);
  const fixed={title:'Fictional company invites unemployed youth to apply',sourceText:'Join our WhatsApp group'};
  const review=await reviewLineSource(fixed,{env:{},fetchImpl:async()=>{calls++;}});
  assert.deepEqual(review.inventory,{lines:{}});assert.equal(review.provenance,null);assert.equal(calls,0);
  assert.equal(decodeLineInventory(fixed,review).expression.op,'unknown');
});

test('serialization budget covers all 160 source keys plus 40 condition objects without claiming a token guarantee',()=>{
  const source={title:'Fictional apprenticeship',sourceText:Array(159).fill('Ordinary explanation.').join('\n')};
  const budget=lineReviewBudget(source);assert.equal(budget.modelLines,160);assert.equal(budget.maxCompletionTokens,3072);
  assert.ok(budget.allContextBytes<3000);assert.ok(budget.fortyConditionBytes<6000);assert.ok(budget.providerSchemaBytes<60000);
  assert.ok(budget.fortyConditionBytes>budget.allContextBytes);
});
