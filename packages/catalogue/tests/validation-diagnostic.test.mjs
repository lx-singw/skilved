import{test}from'node:test';import assert from'node:assert/strict';import{ValidationSchema,validateAssessment,validateExtraction,validationContract,VALIDATION_VERSION}from'../src/ai/validation.mjs';import{validationRejectionDiagnostic,privateValidationDiagnostic}from'../src/ai/validation-diagnostic.mjs';import{makeRecord}from'../../types/tests/fixtures/opportunities.mjs';
const text='Authored source passage',primary={text:'{"issuer":"Authored Forge"}'},good={supported:true,issues:[],evidence:[{source:'recentjobs',quote:text},{source:'primary',quote:'Authored Forge'}]};
test('private diagnostics distinguish missing sources, unmatched quotes and contradictory verdicts without retaining text',()=>{
 for(const [input,expected]of [[{...good,evidence:[good.evidence[0]]},{missingSources:['primary']}],
  [{...good,evidence:[good.evidence[0],{source:'primary',quote:'Invented private quote'}]},{quoteMismatchIndices:[1]}],
  [{...good,issues:[{field:'requirements',reason:'Untrusted private issue'}]},{supportedWithIssues:true}]]){
  assert.throws(()=>validateAssessment(input,text,primary),e=>{const d=privateValidationDiagnostic(e);for(const[k,v]of Object.entries(expected))assert.deepEqual(d[k],v);assert.ok(!JSON.stringify(d).includes('private'));assert.ok(!JSON.stringify(d).includes(text));return true;});
 }
 const malformed=validationRejectionDiagnostic(ValidationSchema.safeParse({supported:true,issues:[],evidence:[{source:'invented',quote:'secret'}]}),text,primary);
 assert.equal(malformed.schemaValid,false);assert.deepEqual(malformed.shapeFields,['evidence']);assert.ok(!JSON.stringify(malformed).includes('secret'));
 assert.deepEqual(validateAssessment(good,text,primary),good);
});
test('arbitrary diagnostic fields and non-validation failures never enter the private exception payload',()=>{
 const d=validationRejectionDiagnostic(ValidationSchema.safeParse(good),text,primary);
 assert.deepEqual(privateValidationDiagnostic({code:'AI_INVALID_VALIDATION',validationDiagnostic:d}),d);
 assert.equal(privateValidationDiagnostic({code:'AI_OTHER',validationDiagnostic:d}),null);
 for(const bad of [{...d,raw:'secret'},{...d,quoteMismatchIndices:[30]},{...d,shapeFields:['invented']},{...d,recentjobsEvidence:31}])assert.equal(privateValidationDiagnostic({code:'AI_INVALID_VALIDATION',validationDiagnostic:bad}),null);
});
test('V17 requires both source groups and distinguishes serialized primary text without relaxing quote validation',()=>{
 const contract=validationContract(primary);assert.equal(VALIDATION_VERSION,'recentjobs_validation_v17');assert.match(contract.instruction,/substring of primary.text/);assert.deepEqual(contract.schema.properties.evidence.required,['recentjobs','primary']);assert.equal(contract.schema.properties.evidence.properties.primary.minItems,1);assert.equal(validationContract().schema.properties.evidence.type,'array');
 assert.throws(()=>validateAssessment({...good,evidence:[good.evidence[0],{source:'primary',quote:'issuer: Authored Forge'}]},text,primary),{code:'AI_INVALID_VALIDATION'});
});
test('real validation decoding retains billed usage and bounded diagnostics for malformed or mismatched simulated responses',async()=>{
 const env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic-validation-diagnostic-key',SKILVED_AI_MODEL:'gemini-3.5-flash-lite',SKILVED_AI_FALLBACK:'false'};
 for(const assessment of [{supported:true,issues:[]},{...good,evidence:{recentjobs:[text],primary:['Wrong literal quote']}}]){
  let calls=0;await assert.rejects(validateExtraction({record:makeRecord(),recentjobsText:text,primary},{env,fetchImpl:async()=>{
   calls++;return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(assessment)}]}}],usageMetadata:{promptTokenCount:12,candidatesTokenCount:8,totalTokenCount:20}});
  }}),e=>{assert.equal(e.code,'AI_INVALID_VALIDATION');assert.equal(e.usage.totalTokens,20);const diagnostic=privateValidationDiagnostic(e);assert.ok(diagnostic);assert.equal(diagnostic.schemaValid,!!assessment.evidence);assert.ok(!JSON.stringify(diagnostic).includes('Wrong literal'));return true;});
  assert.equal(calls,1);
 }
});
test('two-source wire decoding copies model quotes exactly and preserves negative assessments without retries',async()=>{
 const env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic-validation-groups-key',SKILVED_AI_MODEL:'gemini-3.5-flash-lite',SKILVED_AI_FALLBACK:'false'};
 const evidence={recentjobs:[text],primary:['Authored Forge']};
 for(const assessment of [{supported:true,issues:[],evidence},{supported:false,issues:[{field:'requirements',reason:'Missing condition'}],evidence}]){
  let calls=0;const result=await validateExtraction({record:makeRecord(),recentjobsText:text,primary},{env,fetchImpl:async(_url,init)=>{calls++;const body=JSON.parse(init.body),wireSchema=JSON.parse(body.systemInstruction.parts[0].text.split('All required keys must be present:\n')[1]);assert.deepEqual(wireSchema.properties.evidence.required,['recentjobs','primary']);return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(assessment)}]}}],usageMetadata:{promptTokenCount:12,candidatesTokenCount:8,totalTokenCount:20}});}});
  assert.equal(calls,1);assert.equal(result.supported,assessment.supported);assert.deepEqual(result.issues,assessment.issues);assert.deepEqual(result.evidence,good.evidence);
 }
 for(const missing of [{recentjobs:[text]},{recentjobs:[text],primary:[]},[{source:'recentjobs',quote:text}]]){
  let calls=0;await assert.rejects(validateExtraction({record:makeRecord(),recentjobsText:text,primary},{env,fetchImpl:async()=>{calls++;return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({supported:true,issues:[],evidence:missing})}]}}],usageMetadata:{promptTokenCount:12,candidatesTokenCount:8,totalTokenCount:20}});}}),e=>e.code==='AI_INVALID_VALIDATION'&&e.usage.totalTokens===20&&!privateValidationDiagnostic(e).schemaValid);assert.equal(calls,1);
 }
});
