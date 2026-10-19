import {test} from 'node:test';import assert from 'node:assert/strict';
import {requirementSourcePolicy,assertRequirementSourcePolicy,REQUIREMENT_SOURCE_POLICY_VERSION} from '../src/ai/requirement-source-policy.mjs';
import {decodeGroqExtraction,groqExtractionPayload} from '../src/ai/groq-schema.mjs';
import {mapExtraction} from '../src/ai/extraction.mjs';import {extractWithProvider} from '../src/ai/provider.mjs';import {extractMetadata} from '../src/ai/metadata.mjs';
import {assertMaterialFacts} from '../src/worker-policy.mjs';
import {submissionCandidate as candidate,submissionWire,submissionSpan as span,acceptance,introduction,documents,submission,education,knowledge,experience,competencies,competencyGroups,excluded} from './fixtures/submission-competency.mjs';
const options={sourceId:'authored_submission',now:'2026-10-19T10:00:00.000Z'},decode=()=>decodeGroqExtraction(submissionWire(),candidate);
const item=(id,quote,kind='other',level='required')=>({id,kind,level,fact:{state:'stated',value:{description:quote,qualification:null,document:null},quote}});
const sync=x=>{x.requirements.expression={op:'all',children:x.requirements.items.map(i=>({op:'ref',id:i.id}))};return x;};
const env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_submission_key',SKILVED_AI_FALLBACK:'true'};
const answer=data=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});

test('bounded submission prose and inherent/required-competency sections retain scope and exclude headings, duties and advice',()=>{
 const p=requirementSourcePolicy(candidate);assert.equal(REQUIREMENT_SOURCE_POLICY_VERSION,'bounded_extraction_requirements_v8');
 assert.deepEqual(p.submissionInstructions.map(i=>i.originalText),[acceptance,introduction,documents[0]]);
 assert.ok(p.submissionInstructions.every(i=>i.unconditional));
 assert.deepEqual(p.conditionalDocumentInstructions.map(i=>i.originalText),documents.slice(1));
 assert.deepEqual(p.requiredLineNumbers,[...education,knowledge,experience,...competencies].map(q=>span(q)[0]));
 assert.deepEqual(p.layoutContextLineNumbers,competencyGroups.map(g=>span(g[0])[0]));
 assert.ok([...excluded,...competencyGroups.map(g=>g[0])].every(q=>!p.requiredLineNumbers.includes(span(q)[0])));
 assert.equal(p.lineHints.find(h=>h.line===span(knowledge)[0]).kind,'other');assert.equal(p.lineHints.find(h=>h.line===span(experience)[0]).level,'preferred');
});

test('complete authored extraction keeps conditional document instructions, qualification alternatives and the original route',()=>{
 const x=decode();assert.doesNotThrow(()=>assertRequirementSourcePolicy(candidate,x));
 const m=mapExtraction(candidate,x,options);assertMaterialFacts(m.record);
 assert.equal(m.record.practicalConditions.value,submission);assert.equal(m.record.practicalConditions.originalText,submission);
 assert.equal(m.record.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(m.record.publication.approved,false);
 assert.equal(m.record.requirements.requirements.find(i=>i.id==='p').level,'preferred');assert.equal(m.record.requirements.requirements.find(i=>i.id==='e0').fact.originalText,education[0]);
});

test('all-document context and each unconditional instruction require complete value/evidence or a required document item',()=>{
 for(const omitted of [acceptance,introduction,documents[0]]){
  const x=decode();x.practicalConditions.value=x.practicalConditions.value.replace(omitted,'');
  assert.throws(()=>assertRequirementSourcePolicy(candidate,x),/AI_SUBMISSION_INSTRUCTION_COVERAGE/);
  x.requirements.items.push(item('d',omitted,'document'));sync(x);assert.doesNotThrow(()=>assertRequirementSourcePolicy(candidate,x));
  x.requirements.items.at(-1).level='preferred';assert.throws(()=>assertRequirementSourcePolicy(candidate,x),/AI_SUBMISSION_INSTRUCTION_UNRESOLVED/);
 }
 const x=decode();x.requirements.items.push(item('d',documents[0],'document'));x.requirements.expression={op:'all',children:[x.requirements.expression,{op:'any',children:[{op:'ref',id:'d'},{op:'ref',id:'e0'}]}]};
 assert.throws(()=>assertRequirementSourcePolicy(candidate,x),/AI_SUBMISSION_INSTRUCTION_UNRESOLVED/);
});

test('foreign-qualification, identity alternatives and external-applicant scope cannot be shortened or turned into eligibility',()=>{
 for(const document of documents.slice(1)){
  for(const field of ['value','quote']){const x=decode();x.practicalConditions[field]=x.practicalConditions[field].replace(document,document.split(' (')[0]);assert.throws(()=>assertRequirementSourcePolicy(candidate,x),/AI_CONDITIONAL_DOCUMENT_COVERAGE/);}
  const x=decode();x.requirements.items.push(item('d',document,'document'));sync(x);assert.throws(()=>assertRequirementSourcePolicy(candidate,x),/AI_CONDITIONAL_DOCUMENT_MISCLASSIFIED/);
  const unknown=decode();unknown.requirements.expression.children.push({op:'unknown',originalText:document});assert.throws(()=>assertRequirementSourcePolicy(candidate,unknown),/AI_CONDITIONAL_DOCUMENT_MISCLASSIFIED/);
 }
});

test('every required competency detail must survive, individually or in complete grouped evidence',()=>{
 for(let i=0;i<competencies.length;i++){
  const x=decode();x.requirements.items=x.requirements.items.filter(r=>r.id!=='c'+i);sync(x);
  assert.throws(()=>assertRequirementSourcePolicy(candidate,x),/AI_REQUIREMENT_COVERAGE/);
 }
 const grouped=decode();grouped.requirements.items=grouped.requirements.items.filter(i=>!i.id.startsWith('c'));
 grouped.requirements.items.push(...competencyGroups.map((g,i)=>item('g'+i,g.join('\n'))));sync(grouped);assert.doesNotThrow(()=>assertRequirementSourcePolicy(candidate,grouped));
 grouped.requirements.items.push(item('heading',competencyGroups[0][0]));sync(grouped);assert.throws(()=>assertRequirementSourcePolicy(candidate,grouped),/AI_REQUIREMENT_CONTEXT_UNRESOLVED/);
});

test('inherent/competency facts remain unconditional, knowledge is not education and experience stays preferred',()=>{
 for(const id of ['e0','k','c0'])for(const op of ['any','if']){
  const x=decode();x.requirements.expression.children=x.requirements.expression.children.filter(n=>n.id!==id);
  x.requirements.expression.children.push(op==='any'?{op:'any',children:[{op:'ref',id},{op:'ref',id:'p'}]}:{op:'if',condition:'p',then:{op:'ref',id},otherwise:null});
  assert.throws(()=>assertRequirementSourcePolicy(candidate,x),/AI_REQUIREMENT_CONJUNCTION_UNRESOLVED/);
 }
 const knowledgeWrong=decode();knowledgeWrong.requirements.items.find(i=>i.id==='k').kind='education';assert.throws(()=>assertRequirementSourcePolicy(candidate,knowledgeWrong),/AI_REQUIREMENT_KIND_UNRESOLVED/);
 const preferenceWrong=decode();preferenceWrong.requirements.items.find(i=>i.id==='p').level='required';assert.throws(()=>assertRequirementSourcePolicy(candidate,preferenceWrong),/AI_REQUIREMENT_LEVEL_UNRESOLVED/);
});

test('complete unknown competency logic remains a material hold rather than a repaired acceptance',()=>{
 const x=decode(),passage=competencyGroups.flat().join('\n');x.requirements.items=x.requirements.items.filter(i=>!i.id.startsWith('c'));sync(x);x.requirements.expression.children.push({op:'unknown',originalText:passage});
 assert.doesNotThrow(()=>assertRequirementSourcePolicy(candidate,x));const mapped=mapExtraction(candidate,x,options);assert.throws(()=>assertMaterialFacts(mapped.record),/MATERIAL_FACTS_UNRESOLVED/);
});

test('unbounded and merely descriptive sections do not invent document or required-competency coverage',()=>{
 for(const sourceText of [introduction+'\n'+documents.join('\n'),'Key Competencies Required:\n'+competencies.join('\n')]){
  const p=requirementSourcePolicy({title:'Authored',sourceText});assert.deepEqual(p.requiredLineNumbers,[]);assert.deepEqual(p.submissionInstructions,[]);assert.deepEqual(p.conditionalDocumentInstructions,[]);
 }
 const p=requirementSourcePolicy({title:'Authored',sourceText:'Competencies\n'+competencies.join('\n')+'\nClosing date: 30 October 2026'});assert.deepEqual(p.requiredLineNumbers,[]);
 const preparation=requirementSourcePolicy({title:'Authored',sourceText:'Documents to prepare:\nUpdated CV\nClosing date: 30 October 2026'});assert.deepEqual(preparation.submissionInstructions,[]);
 const prose=requirementSourcePolicy({title:'Authored',sourceText:'Inherent Job Requirements:\nCompetencies in workshop safety are required.\nStipend:\nA monthly allowance.'});assert.deepEqual(prose.requiredLineNumbers,[3]);
 const alternatives={title:'Authored',sourceText:'Inherent Job Requirements:\nOne of the following:\nGrade 12\nN3 Engineering certificate\nClosing date: 30 October 2026'},p2=requirementSourcePolicy(alternatives);
 assert.ok(p2.lineHints.every(h=>!h.unconditional));
 const x={requirements:{items:[item('a','Grade 12','education'),item('b','N3 Engineering certificate','education')],expression:{op:'any',children:[{op:'ref',id:'a'},{op:'ref',id:'b'}]}}};
 assert.doesNotThrow(()=>assertRequirementSourcePolicy(alternatives,x));
});

test('ordinary simulated provider omissions stop mapping after one call without semantic fallback or repair',async()=>{
 const raw=submissionWire();raw.requirements.items=raw.requirements.items.filter(i=>i.id!=='c0');raw.requirements.expression='all('+raw.requirements.items.map(i=>i.id).join(',')+')';const original=structuredClone(raw);let calls=0;
 const result=await extractWithProvider(candidate,{env,fetchImpl:async(_url,init)=>{calls++;const p=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);assert.deepEqual(p.requirementSourcePolicy,requirementSourcePolicy(candidate));return answer(raw);}});
 assert.throws(()=>mapExtraction(candidate,result.extraction,options),/AI_REQUIREMENT_COVERAGE/);assert.equal(calls,1);assert.deepEqual(raw,original);
 const unsupported=submissionWire();unsupported.location.value.attendance='in_person';let heldCalls=0;
 await assert.rejects(extractWithProvider(candidate,{env,fetchImpl:async()=>{heldCalls++;return answer(unsupported);}}),e=>e.code==='AI_LOCATION_EVIDENCE_UNRESOLVED'&&e.usage.totalTokens===15);assert.equal(heldCalls,1);
});

test('split metadata receives each full scoped instruction and does not manufacture applicant predicates',async()=>{
 const {requirements,...metadata}=submissionWire();let calls=0;
 const result=await extractMetadata(candidate,{env,fetchImpl:async(_url,init)=>{calls++;const payload=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text),p=groqExtractionPayload(candidate).requirementSourcePolicy;
  assert.deepEqual(payload.conditionalDocumentInstructions,p.conditionalDocumentInstructions);assert.deepEqual(payload.submissionInstructions,p.submissionInstructions);return answer(metadata);
 }});assert.equal(calls,1);assert.equal(result.metadata.practicalConditions.value,submission);
});
