import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rejectedOutputDiagnostic} from '../src/ai/rejected-output.mjs';
import {generateStructured} from '../src/ai/groq.mjs';

const descriptor={type:'object',properties:{state:{type:'string'}},required:['state'],additionalProperties:false};
const schema={type:'object',properties:{coverage:{type:'object',properties:{L2:descriptor,L10:{$ref:'#/properties/coverage/properties/L2'}},required:['L2','L10'],additionalProperties:false}},required:['coverage'],additionalProperties:false};

test('array cardinality diagnostics retain only schema-owned paths and counts',()=>{
  const shape={type:'object',properties:{roles:{type:'array',items:{type:'string'},minItems:3,maxItems:3}},required:['roles']};
  const report=rejectedOutputDiagnostic('{"roles":["PRIVATE_VALUE"]}',shape);
  assert.deepEqual(report,{state:'parsed_json',missingRequired:[],arrayLengthErrors:[{path:'/roles',minItems:3,maxItems:3,actualItems:1}],truncated:false});
  assert.doesNotMatch(JSON.stringify(report),/PRIVATE/);
});

test('diagnostics identify missing schema-owned paths through references without input leakage',()=>{
  const report=rejectedOutputDiagnostic(JSON.stringify({coverage:{L10:{PRIVATE_KEY:'PRIVATE_VALUE'}},PRIVATE_ROOT:'PRIVATE_TEXT'}),schema);
  assert.deepEqual(report,{state:'parsed_json',missingRequired:['/coverage/L2','/coverage/L10/state'],truncated:false});
  assert.doesNotMatch(JSON.stringify(report),/PRIVATE/);
  assert.deepEqual(rejectedOutputDiagnostic('{}',schema).missingRequired,['/coverage']);
});

test('invalid, absent, oversized and wrong-type output never yields provider text',()=>{
  assert.deepEqual(rejectedOutputDiagnostic('PRIVATE_BAD_JSON',schema),{state:'invalid_json'});
  assert.deepEqual(rejectedOutputDiagnostic(undefined,schema),{state:'unavailable'});
  assert.deepEqual(rejectedOutputDiagnostic('x'.repeat(96001),schema),{state:'too_large'});
  for(const raw of ['null','[]','{"coverage":null}'])assert.deepEqual(rejectedOutputDiagnostic(raw,schema),{state:'parsed_json',missingRequired:[],truncated:false});
});

test('diagnostics bound traversal and field counts, including recursive schemas',()=>{
  const many={type:'object',properties:{},required:Array.from({length:100},(_,i)=>`L${i}`)};
  assert.equal(rejectedOutputDiagnostic('{}',many).missingRequired.length,40);
  assert.equal(rejectedOutputDiagnostic('{}',many).truncated,true);
  const cyclic={type:'object',properties:{loop:{$ref:'#/properties/loop'}},required:['loop']};
  assert.equal(rejectedOutputDiagnostic('{"loop":{}}',cyclic).truncated,true);
});

test('provider rejection exposes sanitized diagnostics with exactly one call and unchanged retry semantics',async()=>{
  let calls=0;
  await assert.rejects(generateStructured({}, {schema,instruction:'Synthetic test',version:'test'}, {
    env:{SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_key_1234567890'},
    fetchImpl:async()=>{calls++;return Response.json({error:{code:'json_validate_failed',message:'PRIVATE_ERROR',failed_generation:'{"coverage":{"L10":{"state":"PRIVATE_VALUE"}},"PRIVATE_KEY":true}'}},{status:400});},
  }),error=>{
    assert.equal(error.code,'AI_INVALID_PROVIDER_OUTPUT');assert.equal(error.retryable,true);assert.equal(error.providerStatus,400);
    assert.deepEqual(error.outputDiagnostic,{state:'parsed_json',missingRequired:['/coverage/L2'],truncated:false});
    assert.doesNotMatch(JSON.stringify(error),/PRIVATE/);return true;
  });
  assert.equal(calls,1);
});
