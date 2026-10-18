import {test} from 'node:test';import assert from 'node:assert/strict';
import {assertExperienceEvidence} from '../src/ai/qualification-evidence.mjs';
import {requirementSourcePolicy,assertRequirementSourcePolicy} from '../src/ai/requirement-source-policy.mjs';
import {mapExtraction} from '../src/ai/extraction.mjs';
import {decodeGroqMetadata,groqExtractionPayload} from '../src/ai/groq-schema.mjs';
import {extractWithProvider} from '../src/ai/provider.mjs';
import {extractMetadata} from '../src/ai/metadata.mjs';
import {assertMaterialFacts} from '../src/worker-policy.mjs';
import {qualificationCandidate as candidate,qualificationExtraction,qualificationWire,qualificationSpan as span,
 school,technical,exclusion,document,qualificationPassage} from './fixtures/qualification-model.mjs';
const map=x=>mapExtraction(candidate,x,{sourceId:'qualification_test',now:'2026-10-18T10:00:00.000Z'});
const stated=(value,quote=value)=>({state:'stated',value,quote});
const alternative=()=>({op:'all',children:[{op:'any',children:[{op:'ref',id:'q1'},{op:'ref',id:'q2'}]},
 {op:'ref',id:'s'},{op:'ref',id:'d'}]});
const env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_qualification_key',SKILVED_AI_FALLBACK:'true'};
const answer=data=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],
 usageMetadata:{promptTokenCount:10,totalTokenCount:15}});

test('a closed flat school/minimum N-certificate profile keeps cumulative qualifications and internal document OR',()=>{
 const policy=requirementSourcePolicy(candidate);
 assert.deepEqual(policy.qualificationConjunctions,[{spans:[span(school),span(technical)],relation:'all'}]);
 assert.deepEqual(policy.educationOnlySpans,[span(school),span(exclusion),span(technical)]);
 assert.equal(policy.lineHints.find(h=>h.line===span(exclusion)[0]).kind,'subjects');
 const result=map(qualificationExtraction());assertMaterialFacts(result.record);
 assert.equal(result.record.requirements.expression.op,'all');
 assert.equal(result.record.requirements.requirements.at(-1).fact.originalText,document);
 assert.equal(result.record.applicationRoute.value.destination,'https://employer.example/apply');
 assert.equal(result.record.publication.approved,false);
});

test('cumulative qualification references cannot be weakened by ANY or an IF branch',()=>{
 for(const expression of [alternative(),{op:'any',children:qualificationExtraction().requirements.expression.children},
  {op:'all',children:[{op:'if',condition:'s',then:{op:'ref',id:'q1'},otherwise:{op:'ref',id:'q2'}},{op:'ref',id:'d'}]}]){
  const x=qualificationExtraction();x.requirements.expression=expression;
  assert.throws(()=>map(x),/AI_REQUIREMENT_CONJUNCTION_UNRESOLVED/);
 }
 const nested=qualificationExtraction();nested.requirements.expression={op:'all',children:[
  {op:'all',children:[{op:'ref',id:'q2'},{op:'ref',id:'q1'}]},{op:'ref',id:'s'},{op:'ref',id:'d'}]};
 assert.doesNotThrow(()=>map(nested));
});

test('unknown cumulative evidence is a hold, while a partial confident branch cannot hide inside it',()=>{
 const x=qualificationExtraction();x.requirements.items=x.requirements.items.filter(i=>i.id==='d');
 x.requirements.expression={op:'all',children:[{op:'unknown',originalText:qualificationPassage},{op:'ref',id:'d'}]};
 assert.doesNotThrow(()=>assertRequirementSourcePolicy(candidate,x));
 assert.throws(()=>assertMaterialFacts(map(x).record),/MATERIAL_FACTS_UNRESOLVED/);
 x.requirements.items.unshift(qualificationExtraction().requirements.items[0]);
 assert.throws(()=>assertRequirementSourcePolicy(candidate,x),/AI_REQUIREMENT_CONJUNCTION_UNRESOLVED/);
});

test('conjunction recognition abstains on alternatives, conditions, unfamiliar continuations and repeated lines',()=>{
 for(const sourceText of [
  'Requirements\n'+school+'\n'+technical,
  'Requirements\nOne of the following:\n'+school+'\n'+technical+'\nHow to apply',
  'Requirements\n'+school+'\nOR\n'+technical+'\nHow to apply',
  'Requirements\n'+school+' OR equivalent\n'+technical+'\nHow to apply',
  'Requirements\n'+school+'\n'+technical+' if selected\nHow to apply',
  'Requirements\n'+school+'\n'+technical+'\nThese are alternatives.\nHow to apply',
  'Requirements\n'+school+'\nN2 Electrical Engineering studies.\nHow to apply',
  'Requirements\n'+school+'\n\n'+technical+'\nHow to apply',
  'Requirements\n'+school+'\n'+technical+'\nAdditional unfamiliar route\nHow to apply',
  'Preferred requirements\n'+school+'\n'+technical+'\nHow to apply',
  'Required documents\n'+school+'\n'+technical+'\nHow to apply',
  'Requirements\n'+school+'\n'+technical+'\nHow to apply\n'+school,
 ])assert.deepEqual(requirementSourcePolicy({title:'Authored',sourceText}).qualificationConjunctions,[]);
 const explicit={...candidate,sourceText:candidate.sourceText.replace(school,'Either\n'+school+'\nOR')};
 const x=qualificationExtraction();x.requirements.expression=alternative();
 assert.doesNotThrow(()=>assertRequirementSourcePolicy(explicit,x));
});

test('standalone subject exclusions retain their kind without splitting qualification-attached subjects',()=>{
 for(const kind of ['education','other','document']){const x=qualificationExtraction();x.requirements.items[1].kind=kind;
  assert.throws(()=>assertRequirementSourcePolicy(candidate,x),/AI_REQUIREMENT_KIND_UNRESOLVED/);}
 const attached={title:'Authored',sourceText:'Requirements\nGrade 12 with Mathematics, not Mathematical Literacy\nHow to apply'};
 assert.equal(requirementSourcePolicy(attached).lineHints[0].kind,null);
});

test('qualification-only evidence cannot become experience in canonical or compact metadata',()=>{
 for(const quote of [school,qualificationPassage,'2. Minimum requirements\n'+qualificationPassage]){
  const x=qualificationExtraction();x.experience=stated('Grade 12 OR N2 Electrical',quote);
  assert.throws(()=>map(x),/AI_EXPERIENCE_EVIDENCE_UNRESOLVED/);
 }
 const {requirements,...metadata}=qualificationWire();metadata.experience={state:'stated',value:'Grade 12 OR N2 Electrical',span:span(qualificationPassage)};
 assert.throws(()=>decodeGroqMetadata(metadata,candidate),/AI_EXPERIENCE_EVIDENCE_UNRESOLVED/);
});

test('real experience, mixed evidence, unknown states and unfamiliar qualifications remain for semantic validation',()=>{
 for(const quote of ["Two years' workshop experience is required.",school+"\nTwo years' workshop experience is required.",
  'Grade 12 and one year of work experience required.','Grade 12 and a paid internship are required.',
  'N3 candidates must have completed a paid placement.','Bachelor of Engineering']){
  const source={...candidate,sourceText:candidate.sourceText+'\n'+quote};
  assert.doesNotThrow(()=>assertExperienceEvidence(source,stated(quote)));
 }
 for(const state of ['not_stated','ambiguous','conflicting'])assert.doesNotThrow(()=>assertExperienceEvidence(candidate,{state,value:null,quote:state==='not_stated'?null:school}));
});

test('ordinary and split metadata reject semantic experience errors after one simulated call and preserve usage',async()=>{
 for(const split of [false,true]){
  const wire=qualificationWire();wire.experience={state:'stated',value:'Grade 12 OR N2 Electrical',span:span(qualificationPassage)};
  const {requirements,...metadata}=wire,data=split?metadata:wire,original=structuredClone(data);let calls=0;
  await assert.rejects((split?extractMetadata:extractWithProvider)(candidate,{env,fetchImpl:async(_url,init)=>{
   calls++;const body=JSON.parse(init.body),input=JSON.parse(body.contents[0].parts[0].text);
   assert.match(body.systemInstruction.parts[0].text,/Experience means actual prior work/);
   assert.deepEqual(split?input.educationOnlySpans:input.requirementSourcePolicy.educationOnlySpans,[span(school),span(exclusion),span(technical)]);
   return answer(data);
  }}),error=>error.code==='AI_EXPERIENCE_EVIDENCE_UNRESOLVED'&&error.usage.totalTokens===15);
  assert.equal(calls,1);assert.deepEqual(data,original);
 }
 assert.deepEqual(groqExtractionPayload(candidate).requirementSourcePolicy.qualificationConjunctions,
  [{spans:[span(school),span(technical)],relation:'all'}]);
});
