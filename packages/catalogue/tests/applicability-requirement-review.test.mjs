import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requirementReviewPolicy} from '../src/ai/requirement-review-policy.mjs';
import {applicabilityReviewContract,applicabilityReviewPayload,bindApplicabilityInventory,decodeApplicabilityInventory,
  compareApplicabilityInventory,reviewApplicabilitySource,reviewApplicabilityRequirements,APPLICABILITY_REQUIREMENT_REVIEW_VERSION} from '../src/ai/applicability-requirement-review.mjs';
import {structuredRequirementReviewContract} from '../src/ai/structured-requirement-review.mjs';
import {wholeSourcePayload} from '../src/ai/whole-source.mjs';

const candidate={title:'Fictional apprenticeship',sourceText:'Role expectations\nThe successful candidate is expected to embody our values.\nLive our principles.\nRequirements\nGrade 12\nCVs with certificates will be considered.\nHow to apply\nApplication is only complete after you click final submission.\nPreference may be given to local candidates where agreements require it.\nClosing date'};
const passage=(first,last,applicability,kind=null,strength=null,group=null,relation=null)=>({span:[first,last],applicability,kind,strength,group,relation});
const current=(line,kind,strength='mandatory')=>passage(line,line,'current',kind,strength,1,'all');
const inventory=()=>({passages:[passage(1,2,'context'),passage(3,4,'post_selection'),passage(5,5,'context'),current(6,'education'),
  current(7,'document'),passage(8,8,'context'),current(9,'document'),passage(10,10,'conditional'),passage(11,11,'context')]});
const setup=()=>{const review=bindApplicabilityInventory(candidate,inventory());return {candidate,review,requirements:decodeApplicabilityInventory(candidate,review)};};
const env={SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_applicability_review_key',SKILVED_AI_VALIDATION_THINKING:'medium'};
const response=value=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}],usage:{prompt_tokens:1200,completion_tokens:900,total_tokens:2100}});

test('typed entry policy separates post-selection values, current document gates and conditional preferences',()=>{
  const payload=applicabilityReviewPayload(candidate);
  assert.deepEqual(payload.reviewPolicy.scopes,[{span:[3,4],applicability:'post_selection'},{span:[10,10],applicability:'conditional'}]);
  assert.deepEqual(payload.reviewPolicy.conditions,[{line:7,kind:'document',strength:'mandatory'}]);
  const data=setup(),result=compareApplicabilityInventory(data);
  assert.equal(result.supported,true);assert.equal(result.needsReview,true);assert.equal(result.qualification,false);
  assert.equal(data.requirements.items.length,3);assert.equal(result.version,APPLICABILITY_REQUIREMENT_REVIEW_VERSION);
  assert.equal(result.sourceChecks.length,4);assert.ok(result.sourceChecks.every(check=>check.matched));
});

test('explicit applicability/strength constraints reject promoted values, unconditional preferences and weakened documents',()=>{
  for(const [mutate,code] of [
    [wire=>Object.assign(wire.passages[1],current(3,'other')),'AI_REVIEW_APPLICABILITY_SCOPE'],
    [wire=>wire.passages[7].applicability='current','AI_REVIEW_APPLICABILITY_SCOPE'],
    [wire=>wire.passages[4].strength='unstated','AI_REVIEW_STRENGTH_CONFLICT'],
    [wire=>wire.passages[4].kind='education','AI_REVIEW_STRENGTH_CONFLICT'],
    [wire=>wire.passages[1].kind='other','AI_REVIEW_APPLICABILITY_CONFLICT'],
    [wire=>wire.passages[3].group=null,'AI_REVIEW_APPLICABILITY_CONFLICT'],
    [wire=>wire.passages[0].span=[1,3],'AI_SOURCE_PARTITION_INVALID'],
  ]){const wire=inventory();mutate(wire);assert.throws(()=>decodeApplicabilityInventory(candidate,bindApplicabilityInventory(candidate,wire)),new RegExp(code));}
});

test('bounded past-intake guidance stays unresolved while separately confirmed current documents remain conditions',()=>{
  const source={title:'Fictional apprenticeship',sourceText:'Preparation\nPrepare for requirements based on the previous intake.\nGrade 12\nCurrent application page specifically says certified copies are required.\nHow to apply'};
  assert.deepEqual(requirementReviewPolicy(source).reviewPolicy.scopes,[{span:[3,4],applicability:'preparation'}]);
  const wire={passages:[passage(1,2,'context'),passage(3,4,'preparation'),current(5,'document'),passage(6,6,'context')]};
  const requirements=decodeApplicabilityInventory(source,bindApplicabilityInventory(source,wire));
  assert.equal(requirements.items.length,1);assert.equal(requirements.items[0].id,'r_5_5');
  assert.ok(requirements.expression.children.some(node=>node.op==='unknown'&&node.originalText.includes('previous intake')));
});

test('policy abstains before spending on unbounded post-selection scopes and conflicting requirement headings',async()=>{
  let calls=0;const options={env,fetchImpl:async()=>{calls++;}};
  await assert.rejects(reviewApplicabilitySource({title:'Fictional apprenticeship',sourceText:'The appointed candidate must embody our principles.\nBehave responsibly.'},options),/AI_REVIEW_POLICY_SCOPE_UNBOUNDED/);
  await assert.rejects(reviewApplicabilitySource({title:'Fictional apprenticeship',sourceText:'Requirements\nThe selected candidate will live our culture.\nDemonstrate our values.\nHow to apply'},options),/AI_REVIEW_POLICY_CONFLICT/);
  const source={title:'Fictional apprenticeship',sourceText:'Requirements\nThe successful candidate must have Grade 12.\nHow to apply'};
  assert.deepEqual(requirementReviewPolicy(source).reviewPolicy.scopes,[]);assert.equal(calls,0);
});

test('ideal-profile headings are context while bounded qualification entries retain unstated strength and inline preferences',()=>{
  const source={title:'Fictional apprenticeship',sourceText:'The ideal candidate should have:\nGrade 12, preferably with Mathematics.\nFour N1 subjects.\nApplications for this intake close next month.'};
  const old=wholeSourcePayload({...source,applicationCandidates:[]}),policy=applicabilityReviewPayload(source);
  assert.ok(old.evidenceHints.some(hint=>hint.line===2));assert.ok(!policy.evidenceHints.some(hint=>hint.line===2));
  assert.deepEqual(policy.reviewPolicy.scopes,[{span:[2,2],applicability:'context'}]);
  assert.deepEqual(policy.evidenceHints.map(({line,level})=>({line,level})),[{line:3,level:'unclear'},{line:4,level:'unclear'}]);
  const wire={passages:[passage(1,1,'context'),passage(2,2,'context'),current(3,'education','unstated'),current(4,'education','unstated'),passage(5,5,'context')]};
  const requirements=decodeApplicabilityInventory(source,bindApplicabilityInventory(source,wire));
  assert.equal(requirements.items.length,2);assert.equal(requirements.items[0].fact.quote,'Grade 12, preferably with Mathematics.');
  assert.equal(requirements.items[0].level,'unclear');
  assert.deepEqual(wholeSourcePayload({...source,applicationCandidates:[]}),old);
  assert.throws(()=>applicabilityReviewPayload({...source,sourceText:'The ideal candidate should have:\nGrade 12'}),/AI_REVIEW_POLICY_SCOPE_UNBOUNDED/);
  const prose={...source,sourceText:'The ideal candidate should have Grade 12.\nHow to apply'};
  assert.deepEqual(applicabilityReviewPayload(prose).reviewPolicy.scopes,[]);
});

test('V2 uses low reasoning with the unchanged output limit and does not send claims, gold or destinations',async()=>{
  const data=setup();let calls=0;
  const result=await reviewApplicabilityRequirements({...data,candidate:{...candidate,gold:'private-gold',applicationCandidates:['private-route']}},
    {env,fetchImpl:async(_url,init)=>{calls++;const request=JSON.parse(init.body),payload=JSON.parse(request.messages[1].content);
      assert.equal(request.reasoning_effort,'low');assert.equal(request.max_completion_tokens,3072);
      assert.equal(request.response_format.json_schema.name,APPLICABILITY_REQUIREMENT_REVIEW_VERSION);
      assert.deepEqual(payload,applicabilityReviewPayload(candidate));assert.doesNotMatch(JSON.stringify(payload),/private-|extracted/);
      return response(inventory());}});
  assert.equal(calls,1);assert.equal(result.assessment.supported,true);assert.equal(result.qualification,false);
  assert.equal(result.review.provenance.usage.totalTokens,2100);assert.equal(result.review.provenance.thinking,'low');
  assert.equal(env.SKILVED_AI_VALIDATION_THINKING,'medium');
  assert.equal(structuredRequirementReviewContract(candidate).version,'recentjobs_requirement_review_v1');
});

test('invalid claims, stale inventories and oversized/circular outputs cannot authorize reuse or cause another call',async()=>{
  const data=setup();let calls=0;const options={env,fetchImpl:async()=>{calls++;return response(inventory());}};
  data.requirements.expression.children[0].id='missing';await assert.rejects(reviewApplicabilityRequirements(data,options),/AI_INVALID_REQUIREMENT_AUDIT/);assert.equal(calls,0);
  const good=setup();assert.equal((await reviewApplicabilityRequirements(good,{review:good.review,env:{}})).assessment.supported,true);
  for(const key of ['version','sourceSha256','contractSha256']){const review=structuredClone(good.review);review[key]='changed';assert.throws(()=>decodeApplicabilityInventory(candidate,review),/AI_REVIEW_BINDING_MISMATCH/);}
  const review=structuredClone(good.review);review.inventory.extra='x'.repeat(96000);assert.throws(()=>decodeApplicabilityInventory(candidate,review),/AI_OUTPUT_LIMIT/);
  review.inventory={};review.inventory.self=review.inventory;assert.throws(()=>decodeApplicabilityInventory(candidate,review),/AI_INVALID_REVIEW_INVENTORY/);
  const wire=inventory();wire.passages.pop();await assert.rejects(reviewApplicabilitySource(candidate,{...options,fetchImpl:async()=>{calls++;return response(wire);}}),
    error=>error.code==='AI_SOURCE_PARTITION_INCOMPLETE'&&error.usage.totalTokens===2100);assert.equal(calls,1);
  const contract=applicabilityReviewContract(candidate);contract.schema.properties.passages.type='string';assert.equal(applicabilityReviewContract(candidate).schema.properties.passages.type,'array');
});
