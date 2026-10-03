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
  assert.deepEqual(report,{state:'parsed_json',missingRequired:['/coverage/L2','/coverage/L10/state'],
    unknownPropertyCounts:[{path:'',count:1},{path:'/coverage/L10',count:1}],truncated:false});
  assert.doesNotMatch(JSON.stringify(report),/PRIVATE/);
  assert.deepEqual(rejectedOutputDiagnostic('{}',schema).missingRequired,['/coverage']);
});

test('invalid, absent, oversized and wrong-type output never yields provider text',()=>{
  assert.deepEqual(rejectedOutputDiagnostic('PRIVATE_BAD_JSON',schema),{state:'invalid_json'});
  assert.deepEqual(rejectedOutputDiagnostic(undefined,schema),{state:'unavailable'});
  assert.deepEqual(rejectedOutputDiagnostic('x'.repeat(96001),schema),{state:'too_large'});
  for(const [raw,path] of [['null',''],['[]',''],['{"coverage":null}','/coverage']])
    assert.deepEqual(rejectedOutputDiagnostic(raw,schema),{state:'parsed_json',missingRequired:[],structuralErrors:[{path,code:'TYPE_MISMATCH'}],truncated:false});
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
    assert.deepEqual(error.outputDiagnostic,{state:'parsed_json',missingRequired:['/coverage/L2'],unknownPropertyCounts:[{path:'',count:1}],truncated:false});
    assert.doesNotMatch(JSON.stringify(error),/PRIVATE/);return true;
  });
  assert.equal(calls,1);
});

test('unique union types report invalid enums, missing condition fields, numeric bounds and extra-property counts without values',()=>{
  const shape={type:'object',properties:{L3:{anyOf:[{type:'string',enum:['context']},{type:'object',properties:{kind:{type:'string',enum:['education']},group:{type:'integer',minimum:1,maximum:19}},required:['kind','group'],additionalProperties:false},{type:'integer',minimum:1,maximum:2}]}},required:['L3'],additionalProperties:false};
  for(const [value,expected] of [['PRIVATE_ROLE',{structuralErrors:[{path:'/L3',code:'ENUM_MISMATCH'}]}],
    [{kind:'PRIVATE_KIND',PRIVATE_KEY:'PRIVATE_VALUE'},{missingRequired:['/L3/group'],structuralErrors:[{path:'/L3/kind',code:'ENUM_MISMATCH'}],unknownPropertyCounts:[{path:'/L3',count:1}]}],
    [3,{structuralErrors:[{path:'/L3',code:'NUMBER_BOUNDS'}]}],
    [{kind:'education',group:'PRIVATE_NUMBER'},{structuralErrors:[{path:'/L3/group',code:'TYPE_MISMATCH'}]}],
    [null,{structuralErrors:[{path:'/L3',code:'UNION_UNRESOLVED'}]}]]) {
    const report=rejectedOutputDiagnostic(JSON.stringify({L3:value}),shape);
    assert.deepEqual(report,{state:'parsed_json',missingRequired:[],...expected,truncated:false});assert.doesNotMatch(JSON.stringify(report),/PRIVATE/);
  }
});

test('object unions use only unique schema discriminators and do not invent missing fields for ambiguous branches',()=>{
  const branches=[{type:'object',properties:{role:{type:'string',const:'current'},kind:{type:'string'}},required:['role','kind'],additionalProperties:false},
    {type:'object',properties:{role:{type:'string',enum:['context','promotion']}},required:['role'],additionalProperties:false}];
  const shape={type:'object',properties:{row:{anyOf:branches}},required:['row'],additionalProperties:false};
  assert.deepEqual(rejectedOutputDiagnostic('{"row":{"role":"current"}}',shape).missingRequired,['/row/kind']);
  assert.deepEqual(rejectedOutputDiagnostic('{"row":{"role":"context"}}',shape),{state:'parsed_json',missingRequired:[],truncated:false});
  for(const raw of ['{"row":{}}','{"row":{"role":"PRIVATE"}}']) {
    const report=rejectedOutputDiagnostic(raw,shape);assert.deepEqual(report.missingRequired,[]);
    assert.deepEqual(report.structuralErrors,[{path:'/row',code:'UNION_UNRESOLVED'}]);assert.doesNotMatch(JSON.stringify(report),/PRIVATE/);
  }
});

test('new structural diagnostics share the existing global bounds and retain only wildcard array paths',()=>{
  const shape={type:'array',items:{type:'object',properties:{group:{type:'integer'}},required:['group'],additionalProperties:false}};
  const report=rejectedOutputDiagnostic(JSON.stringify(Array.from({length:100},()=>({group:'PRIVATE',PRIVATE_KEY:true}))),shape);
  assert.equal(report.truncated,true);assert.ok(report.unknownPropertyCounts.length+report.structuralErrors.length<=40);
  assert.ok(report.structuralErrors.every(row=>row.path==='/*/group'));assert.ok(report.unknownPropertyCounts.every(row=>row.path==='/*'));
  assert.doesNotMatch(JSON.stringify(report),/PRIVATE/);
});
