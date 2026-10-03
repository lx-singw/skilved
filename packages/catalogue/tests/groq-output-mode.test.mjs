import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {generateStructured} from '../src/ai/groq.mjs';
const env={SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_output_mode_key'};
const contract={instruction:'Synthetic JSON test',version:'synthetic_output_mode',schema:{type:'object',properties:{ok:{type:'boolean'}},required:['ok'],additionalProperties:false}};
const response=()=>Response.json({choices:[{finish_reason:'stop',message:{content:'{"ok":true}'}}]});
test('default transport remains strict regardless of environment; explicit JSON mode changes the request hash and retains no tools',async()=>{
  const bodies=[];const fetchImpl=async(_url,init)=>{bodies.push(JSON.parse(init.body));assert.equal(init.redirect,'error');assert.equal('tools' in bodies.at(-1),false);return response();};
  const original=await generateStructured({test:true},contract,{env:{...env,SKILVED_AI_OUTPUT_MODE:'json_object'},fetchImpl});
  const explicit=await generateStructured({test:true},{...contract,outputMode:'json_object'},{env,fetchImpl});
  assert.equal(bodies[0].response_format.json_schema.strict,true);assert.equal(bodies[0].messages[0].content,contract.instruction);
  assert.ok(!Object.hasOwn(original.provenance,'outputMode'));assert.deepEqual(bodies[1].response_format,{type:'json_object'});
  assert.equal(explicit.provenance.outputMode,'json_object');assert.notEqual(original.provenance.requestHash,explicit.provenance.requestHash);
  for(const [index,result] of [original,explicit].entries())assert.equal(result.provenance.requestHash,createHash('sha256').update(JSON.stringify(bodies[index])).digest('hex'));
});
test('unsupported modes and oversized schema prompts fail before spend; malformed JSON never causes a fallback',async()=>{
  let calls=0;const fetchImpl=async()=>{calls++;return Response.json({choices:[{finish_reason:'stop',message:{content:'NOT_JSON'}}]});};
  await assert.rejects(generateStructured({}, {...contract,outputMode:'unknown'},{env,fetchImpl}),/AI_CONFIGURATION_REQUIRED/);
  await assert.rejects(generateStructured({}, {...contract,outputMode:'json_object',instruction:'x'.repeat(96000)},{env,fetchImpl}),/AI_INPUT_LIMIT/);assert.equal(calls,0);
  await assert.rejects(generateStructured({}, {...contract,outputMode:'json_object'},{env,fetchImpl}),/AI_INVALID_JSON/);assert.equal(calls,1);
});
