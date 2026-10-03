import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindRequirementInventory,compareRequirementInventory,decodeRequirementInventory,reviewRequirementSource,reviewStructuredRequirements,
  structuredRequirementReviewContract,structuredRequirementReviewPayload,STRUCTURED_REQUIREMENT_REVIEW_VERSION} from '../src/ai/structured-requirement-review.mjs';

const candidate={title:'Fictional apprenticeship',sourceText:'Applicant qualifications\nGrade 12\nWe provide training and equipment\nCertified copies required\nCurrent eligibility is unconfirmed\nHow to apply'};
const passage=(first,last,role,kind=null,level='required',group=1,relation='all')=>({span:[first,last],role,
  condition:role==='condition'?{kind,level,group,relation}:null});
const inventory=()=>({passages:[passage(1,2,'context'),passage(3,3,'condition','education'),passage(4,4,'context'),
  passage(5,5,'condition','document'),passage(6,6,'unresolved'),passage(7,7,'context')]});
const setup=()=>{const review=bindRequirementInventory(candidate,inventory());return {candidate,review,requirements:decodeRequirementInventory(candidate,review)};};
const codes=result=>result.issues.map(issue=>issue.code);
const env={SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_structured_review_key'};
const response=value=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}],usage:{prompt_tokens:1100,completion_tokens:600,total_tokens:1700}});

test('blind inventory receives the whole source and no claims, gold, routes or approval fields',async()=>{
  let calls=0;const review=await reviewRequirementSource({...candidate,requirements:'secret-claims',gold:'secret-gold',applicationCandidates:['secret-route']},
    {env,fetchImpl:async(_url,init)=>{calls++;const request=JSON.parse(init.body),payload=JSON.parse(request.messages[1].content);
      assert.equal(request.reasoning_effort,'medium');assert.equal(request.max_completion_tokens,3072);
      assert.equal(request.response_format.json_schema.name,STRUCTURED_REQUIREMENT_REVIEW_VERSION);
      assert.deepEqual(payload,structuredRequirementReviewPayload(candidate));
      assert.doesNotMatch(JSON.stringify(payload),/secret-|extracted|approved|supported/);
      assert.match(request.messages[0].content,/Employer obligations/);return response(inventory());}});
  assert.equal(calls,1);assert.equal(review.provenance.usage.totalTokens,1700);
  const result=compareRequirementInventory({...setup(),review});assert.equal(result.supported,true);
  assert.equal(result.needsReview,true);assert.equal(result.qualification,false);assert.equal(result.checks.length,2);
  assert.equal(result.sourceChecks.length,3);assert.ok(result.sourceChecks.every(check=>check.matched));
});

test('comparison catches employer context as eligibility, wrong strength/kind, omitted documents and lost uncertainty independently',()=>{
  const data=setup(),extra=structuredClone(data.requirements.items[0]);extra.id='extra';extra.kind='other';
  extra.fact.quote='We provide training and equipment';extra.fact.value.description=extra.fact.quote;
  data.requirements.items.push(extra);data.requirements.expression.children.push({op:'ref',id:'extra'});
  data.requirements.items[0].kind='subjects';data.requirements.items[0].level='preferred';
  data.requirements.items=data.requirements.items.filter(item=>item.kind!=='document');
  data.requirements.expression.children=data.requirements.expression.children.filter(node=>node.op==='ref'&&node.id!=='r_5_5');
  const result=compareRequirementInventory(data);assert.equal(result.supported,false);
  for(const code of ['REVIEW_UNEXPECTED_CLAIM','REVIEW_KIND_MISMATCH','REVIEW_LEVEL_MISMATCH','REVIEW_MISSING_CONDITION','REVIEW_UNCERTAINTY_LOST','REVIEW_LOGIC_MISMATCH'])assert.ok(codes(result).includes(code),code);
  assert.ok(result.issues.some(issue=>issue.code==='REVIEW_MISSING_CONDITION'&&issue.span[0]===5));
  assert.ok(result.sourceChecks.every(check=>!check.matched));
});

test('logic comparison tolerates IDs, ordering and nested same operators, but retains ANY/ALL distinctions',()=>{
  const data=setup();data.requirements.items[0].id='changed';
  data.requirements.expression.children[0].id='changed';
  data.requirements.expression={op:'all',children:[data.requirements.expression.children[2],{op:'all',children:data.requirements.expression.children.slice(0,2).reverse()}]};
  assert.equal(compareRequirementInventory(data).supported,true);
  data.requirements.expression.children[1].op='any';assert.ok(codes(compareRequirementInventory(data)).includes('REVIEW_LOGIC_MISMATCH'));
});

test('duplicate claims, partial quotes, changed values and unsupported uncertainty cannot pass',()=>{
  for(const [mutate,expected] of [
    [data=>{const copy=structuredClone(data.items[0]);copy.id='duplicate';data.items.push(copy);data.expression.children.push({op:'ref',id:copy.id});},'REVIEW_DUPLICATE_CLAIM'],
    [data=>{data.items[0].fact.quote='Grade';data.items[0].fact.value.description='Grade';},'REVIEW_NONUNIQUE_OR_PARTIAL_EVIDENCE'],
    [data=>data.items[0].fact.value.description='Doctorate required','REVIEW_VALUE_REQUIRES_SEMANTIC_ASSESSMENT'],
    [data=>data.expression.children.push({op:'unknown',originalText:'How to apply'}),'REVIEW_UNEXPECTED_UNCERTAINTY'],
  ]){const data=setup();mutate(data.requirements);assert.ok(codes(compareRequirementInventory(data)).includes(expected),expected);}
});

test('inventory gaps, overlaps, classifications and source/version/contract bindings are enforced',()=>{
  for(const mutate of [wire=>wire.passages.splice(2,1),wire=>wire.passages[2].span=[3,4],wire=>wire.passages[0].condition={kind:'other',level:'required',group:1,relation:'all'},
    wire=>wire.passages[3].condition.relation='any']) {
    const wire=inventory();mutate(wire);assert.throws(()=>decodeRequirementInventory(candidate,bindRequirementInventory(candidate,wire)));
  }
  for(const key of ['version','sourceSha256','contractSha256']) {
    const data=setup();data.review[key]='changed';assert.throws(()=>compareRequirementInventory(data),/AI_REVIEW_BINDING_MISMATCH/);
  }
  const data=setup();assert.throws(()=>decodeRequirementInventory({...candidate,sourceText:candidate.sourceText+'\nNew line'},data.review),/AI_REVIEW_BINDING_MISMATCH/);
});

test('invalid model inventory retains usage without retry; source limits and disabled mode fail without spend',async()=>{
  let calls=0;await assert.rejects(reviewRequirementSource(candidate,{env,fetchImpl:async()=>{calls++;const wire=inventory();wire.passages.pop();return response(wire);}}),
    error=>error.code==='AI_SOURCE_PARTITION_INCOMPLETE'&&error.usage.totalTokens===1700);assert.equal(calls,1);
  calls=0;const options={env,fetchImpl:async()=>{calls++;}};
  await assert.rejects(reviewRequirementSource({...candidate,sourceText:'x'.repeat(96000)},options),/AI_INPUT_LIMIT/);
  await assert.rejects(reviewRequirementSource(candidate,{...options,env:{...env,SKILVED_AI_MODE:'disabled'}}),/AI_DISABLED/);
  assert.equal(calls,0);
  const contract=structuredRequirementReviewContract(candidate);contract.schema.properties.passages.type='string';
  assert.equal(structuredRequirementReviewContract(candidate).schema.properties.passages.type,'array');
});

test('combined review rejects invalid claims before spending and reuses a bound inventory without credentials',async()=>{
  const data=setup();let calls=0;const options={env,fetchImpl:async()=>{calls++;return response(inventory());}};
  const invalid=structuredClone(data);invalid.requirements.expression.children[0].id='missing';
  await assert.rejects(reviewStructuredRequirements(invalid,options),/AI_INVALID_REQUIREMENT_AUDIT/);assert.equal(calls,0);
  const fresh=await reviewStructuredRequirements(data,options);assert.equal(calls,1);assert.equal(fresh.qualification,false);assert.equal(fresh.assessment.supported,true);
  const cached=await reviewStructuredRequirements(data,{env:{},review:fresh.review,fetchImpl:async()=>{calls++;}});
  assert.equal(cached.assessment.supported,true);assert.equal(calls,1);
  cached.review.sourceSha256='changed';await assert.rejects(reviewStructuredRequirements(data,{review:cached.review}),/AI_REVIEW_BINDING_MISMATCH/);
});
