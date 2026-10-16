import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateExtraction,validationPayload,VALIDATION_VERSION} from '../src/ai/validation.mjs';

const absent=()=>({state:'not_stated',value:null,originalText:null});
const record={...Object.fromEntries(['title','issuer','summary','intake','location','residence','experience','deadline','practicalConditions','applicationRoute'].map(k=>[k,absent()])),
 compensation:[],requirements:{expression:{op:'unknown',originalText:'Fictional notice'},requirements:[]}};
const input={record,recentjobsText:'Fictional notice',applicationCandidates:[]};
const assessment={supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Fictional notice'}]};
const gemini={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_validation_budget_key',SKILVED_AI_FALLBACK:'true'};
const response=(value=assessment,finishReason='STOP')=>Response.json({candidates:[{finishReason,content:{parts:[{text:JSON.stringify(value)}]}}],
 usageMetadata:{promptTokenCount:30,candidatesTokenCount:20,thoughtsTokenCount:2950,totalTokenCount:3000}});

test('ordinary Gemini validation gets its own completion allowance without changing evidence, reasoning or Groq limits',async()=>{
 for(const provider of ['gemini','groq']){
  const env=provider==='gemini'?gemini:{SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_validation_groq_key'};let calls=0;
  const result=await validateExtraction(input,{env,fetchImpl:async(_url,init)=>{
   calls++;const request=JSON.parse(init.body);
   if(provider==='gemini'){
    assert.equal(request.generationConfig.maxOutputTokens,6144);assert.equal(request.generationConfig.thinkingConfig.thinkingLevel,'MEDIUM');
    assert.deepEqual(JSON.parse(request.contents[0].parts[0].text),validationPayload(input));return response();
   }
   assert.equal(request.max_completion_tokens,3072);assert.equal(request.reasoning_effort,'medium');
   assert.deepEqual(JSON.parse(request.messages[1].content),validationPayload(input));
   return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(assessment)}}],usage:{prompt_tokens:30,completion_tokens:20,total_tokens:50}});
  }});assert.equal(calls,1);assert.equal(result.supported,true);assert.equal(result.provenance.extractionVersion,VALIDATION_VERSION);
 }
});

test('a capped Gemini response remains a single failed call with known usage, even if it contains a supported verdict',async()=>{
 let calls=0;
 await assert.rejects(validateExtraction(input,{env:gemini,fetchImpl:async()=>{calls++;return response(assessment,'MAX_TOKENS');}}),
  error=>error.code==='AI_INCOMPLETE_RESPONSE'&&error.usage.totalTokens===3000);
 assert.equal(calls,1);
});

test('explicit diagnostic limits stay bounded and a complete negative assessment stays negative',async()=>{
 let calls=0;const negative={...assessment,supported:false,issues:[{field:'requirements',reason:'Authored mismatch'}]};
 const result=await validateExtraction(input,{env:gemini,maxOutputTokens:4096,fetchImpl:async(_url,init)=>{
  calls++;assert.equal(JSON.parse(init.body).generationConfig.maxOutputTokens,4096);return response(negative);
 }});assert.equal(calls,1);assert.equal(result.supported,false);assert.deepEqual(result.issues,negative.issues);
 await assert.rejects(validateExtraction(input,{env:gemini,maxOutputTokens:8193,fetchImpl:()=>assert.fail('Invalid limit reached transport')}),/AI_CONFIGURATION_REQUIRED/);
});
