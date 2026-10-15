import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requirementValidationPayload,requirementValidationContract,validateRequirementAssessment,validateRequirements,REQUIREMENT_VALIDATION_VERSION} from '../src/ai/requirement-validation.mjs';
import {validationContract,VALIDATION_VERSION} from '../src/ai/validation.mjs';
import {decodeGroqRequirements} from '../src/ai/groq-schema.mjs';

const candidate={title:'Fictional apprenticeship',sourceText:'Requirements\nGrade 12\nCurrent eligibility is unconfirmed\nHow to apply',applicationCandidates:[{method:'portal',destination:'https://employer.example/private-route'}]};
const requirements=()=>decodeGroqRequirements({items:[{id:'r1',kind:'education',level:'required',state:'stated',span:[3,3]}],expression:'all(r1,unknown(4,4))'},candidate);
const env={SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_requirements_validation_key'};
const assessment=(supported=true)=>({supported,issues:supported?[]:[{field:'requirements.documents',reason:'Required document omitted.'}],evidence:[{source:'recentjobs',quote:'Grade 12'}]});
const response=value=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}],usage:{prompt_tokens:1200,completion_tokens:700,total_tokens:1900}});

test('requirements diagnostic retains the entire notice, exact facts and local uncertainty without metadata or routes',async()=>{
  let calls=0;const input=requirements();
  const result=await validateRequirements({candidate,requirements:input},{env,fetchImpl:async(_url,init)=>{
    calls++;const request=JSON.parse(init.body),payload=JSON.parse(request.messages[1].content);
    assert.equal(request.reasoning_effort,'medium');assert.equal(request.max_completion_tokens,3072);
    assert.equal(request.response_format.json_schema.name,REQUIREMENT_VALIDATION_VERSION);
    assert.match(request.messages[0].content,/REQUIREMENTS-ONLY/);
    assert.equal(payload.recentjobsText,candidate.title+'\n'+candidate.sourceText);
    assert.deepEqual(Object.keys(payload.extracted),['requirements']);
    assert.deepEqual(payload.extracted.requirements.expression,input.expression);
    assert.equal(payload.extracted.requirements.requirements[0].fact.originalText,'Grade 12');
    assert.deepEqual(payload.applicationCandidates,[]);assert.equal(payload.primary,null);
    assert.doesNotMatch(JSON.stringify(payload),/private-route|review|sourceSnapshotIds/);
    return response(assessment());
  }});
  assert.equal(calls,1);assert.equal(result.supported,true);assert.equal(result.scope,'requirements_only');assert.equal(result.qualification,false);
  assert.equal(result.provenance.usage.totalTokens,1900);
});

test('invalid scoped assessments retain usage and do not retry or become full-record approval',async()=>{
  for(const data of [{...assessment(),issues:[{field:'requirements',reason:'Mismatch'}]},
    {...assessment(false),issues:[]},{...assessment(false),issues:[{field:'deadline',reason:'Outside scope'}]},
    {...assessment(),evidence:[{source:'recentjobs',quote:'Invented evidence'}]},
    {...assessment(),evidence:[{source:'primary',quote:'Grade 12'}]},{...assessment(),publish:true}]) {
    let calls=0;await assert.rejects(validateRequirements({candidate,requirements:requirements()},{env,fetchImpl:async()=>{calls++;return response(data);}}),
      error=>error.code==='AI_INVALID_VALIDATION'&&error.usage.totalTokens===1900);
    assert.equal(calls,1);
  }
  assert.equal(validateRequirementAssessment(assessment(false),candidate.sourceText).supported,false);
});

test('untrusted requirement quotes, unknown evidence and broken references fail before spending',async()=>{
  for(const mutate of [data=>data.items[0].fact.quote='Invented condition',data=>data.expression.children[1].originalText='Invented uncertainty',
    data=>data.expression.children[0].id='missing',data=>data.expression={op:'unknown',originalText:'Grade 12'},
    data=>data.items.push(structuredClone(data.items[0])),data=>data.approved=true]) {
    const input=requirements();mutate(input);let calls=0;
    await assert.rejects(validateRequirements({candidate,requirements:input},{env,fetchImpl:async()=>{calls++;}}),/AI_INVALID_REQUIREMENT_AUDIT/);
    assert.equal(calls,0);
  }
});

test('oversized notices/trees and disabled mode make no requests',async()=>{
  let calls=0;const options={env,fetchImpl:async()=>{calls++;}};
  for(const sourceText of [Array(160).fill('line').join('\n'),'x'.repeat(96000)])
    await assert.rejects(validateRequirements({candidate:{...candidate,sourceText},requirements:requirements()},options),/AI_INPUT_LIMIT/);
  await assert.rejects(validateRequirements({candidate,requirements:requirements()},{...options,env:{...env,SKILVED_AI_MODE:'disabled'}}),/AI_DISABLED/);
  assert.equal(calls,0);
});

test('diagnostic contracts have a separate version and cannot mutate the full worker contract',()=>{
  const full=validationContract(),diagnostic=requirementValidationContract();
  assert.equal(full.version,VALIDATION_VERSION);assert.equal(VALIDATION_VERSION,'recentjobs_validation_v10');
  assert.notEqual(full.version,diagnostic.version);assert.deepEqual(full.schema,diagnostic.schema);
  assert.doesNotMatch(full.instruction,/REQUIREMENTS-ONLY/);
  diagnostic.schema.properties.supported.type='string';assert.equal(validationContract().schema.properties.supported.type,'boolean');
  assert.equal(requirementValidationPayload(candidate,requirements()).extracted.requirements.requirements.length,1);
});
