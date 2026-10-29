import {test} from 'node:test';import assert from 'node:assert/strict';
import {requirementSourcePolicy,assertRequirementSourcePolicy} from '../src/ai/requirement-source-policy.mjs';
import {decodeGroqExtraction} from '../src/ai/groq-schema.mjs';
import {mapExtraction} from '../src/ai/extraction.mjs';
import {assertMaterialFacts} from '../src/worker-policy.mjs';
import {extractWithProvider} from '../src/ai/provider.mjs';
import {parseRecentJobsDetail} from '../src/adapters/recentjobs.mjs';
import {extractMetadata} from '../src/ai/metadata.mjs';

const intro='You must meet the age and citizenship requirements and have completed one of the following educational pathways.';
const routes=['N2–N6\nRelevant Electrical Trade Theory, Engineering Science, Mathematics and another relevant subject','NCV Level 4\nRelevant trade theory, Mathematics and vocational subjects','Technical Grade 12\nMathematics, Physical Science and relevant trade theory'];
const shared=['Mathematics must have been passed with at least 50%.','You must be between 18 and 30 years old.','You must be a South African citizen.','You must not already hold a trade certificate (Red Seal).'];
const attachment='Attach your qualifications and relevant academic records.';
const text=['Fictional Workshop invites electrical apprentices.','2. Minimum requirements',intro,'Qualification route','Required subjects',...routes.flatMap(r=>r.split('\n')),'Important conditions:',...shared,attachment,'3. Duties and responsibilities','Maintain equipment.','4. Documents to prepare','Use this checklist before applying.','Certified ID, if applicable','5. Why you should apply','Publisher career advice.','Closing date: 30 October 2026'].join('\n');
const candidate=parseRecentJobsDetail({url:'https://recentjobs.co.za/2026/10/15/fictional-electrical-apprentice/',html:'<article class="type-post"><h1 class="entry-title">Fictional electrical apprentice</h1><div class="entry-content"><p>'+text.split('\n').join('</p><p>')+'</p><a href="https://employer.example/apply">Apply now</a></div></article>'});
const lines=(candidate.title+'\n'+candidate.sourceText).split('\n'),span=quote=>{const first=lines.indexOf(quote.split('\n')[0])+1;assert.ok(first>0);return [first,first+quote.split('\n').length-1];};
const item=(id,quote,kind='other',level='required')=>({id,kind,level,fact:{state:'stated',quote,value:{description:quote,qualification:null,document:null}}});
function extraction(){
 const items=[...routes.map((r,i)=>item('r'+(i+1),r,'education')),...shared.map((q,i)=>item('s'+i,q,i===0?'subjects':'other')),item('d1',attachment,'document')];
 return {practicalConditions:{state:'not_stated',value:null,quote:null},requirements:{items,expression:{op:'all',children:[{op:'any',children:routes.map((_,i)=>({op:'ref',id:'r'+(i+1)}))},...shared.map((_,i)=>({op:'ref',id:'s'+i})),{op:'ref',id:'d1'}]}}};
}
function wire(){
 const state=(value,quote=value)=>({state:'stated',value,span:span(quote)}),e=extraction();
 return {category:'apprenticeship',categorySpan:[1,1],issuer:state('Fictional Workshop','Fictional Workshop invites electrical apprentices.'),summary:state('Fictional Workshop invites electrical apprentices.'),intake:null,location:null,residence:null,experience:null,compensation:[],practicalConditions:null,applicationCandidateIndex:0,
 deadline:state({kind:'date',localDate:'2026-10-30',localTime:null,timezone:null,utcInstant:null},'Closing date: 30 October 2026'),
 requirements:{items:e.requirements.items.map(i=>({id:i.id,kind:i.kind,level:i.level,state:'stated',span:span(i.fact.quote)})),expression:'all(any(r1,r2,r3),s0,s1,s2,s3,d1)'}};
}
const env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_numbered_key',SKILVED_AI_FALLBACK:'true'};
const answer=data=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});

test('numbered headings retain exact evidence while table context, duties and publisher advice are excluded',()=>{
 const p=requirementSourcePolicy(candidate);
 assert.deepEqual(p.submissionInstructions,[{originalText:attachment,span:span(attachment),level:'required'}]);
 assert.deepEqual(p.layoutContextLineNumbers,[span(intro)[0],span('Qualification route')[0],span('Required subjects')[0]]);
 assert.deepEqual(p.qualificationAlternatives,[{spans:routes.map(span),relation:'any'}]);
 assert.deepEqual(p.completeRequirementSpans,routes.map(r=>({span:span(r),kind:'education'})));
 assert.deepEqual(p.requiredLineNumbers,[...routes.flatMap(q=>{const [first,last]=span(q);return [first,last];}),...shared.map(q=>span(q)[0])]);
 assert.doesNotThrow(()=>assertRequirementSourcePolicy(candidate,extraction()));
});

test('explicit attachment rules may remain required documents or complete practical instructions',()=>{
 const doc=extraction();assert.doesNotThrow(()=>assertRequirementSourcePolicy(candidate,doc));
 const practical=extraction();practical.requirements.items.pop();practical.requirements.expression.children.pop();
 practical.practicalConditions={state:'stated',value:attachment,quote:attachment};assert.doesNotThrow(()=>assertRequirementSourcePolicy(candidate,practical));
 const both=extraction();both.practicalConditions={state:'stated',value:attachment,quote:attachment};assert.doesNotThrow(()=>assertRequirementSourcePolicy(candidate,both));
});

test('omission, wrong strength/kind and incomplete practical wording cannot excuse an attachment rule',()=>{
 const missing=extraction();missing.requirements.items.pop();missing.requirements.expression.children.pop();
 assert.throws(()=>assertRequirementSourcePolicy(candidate,missing),/AI_SUBMISSION_INSTRUCTION_COVERAGE/);
 for(const field of ['value','quote']){const bad=structuredClone(missing);bad.practicalConditions={state:'stated',value:attachment,quote:attachment};bad.practicalConditions[field]='Attach your qualifications';assert.throws(()=>assertRequirementSourcePolicy(candidate,bad),/AI_SUBMISSION_INSTRUCTION_COVERAGE/);}
 for(const [key,value] of [['kind','subjects'],['level','preferred']]){const bad=extraction();bad.requirements.items.at(-1)[key]=value;assert.throws(()=>assertRequirementSourcePolicy(candidate,bad),/AI_SUBMISSION_INSTRUCTION_UNRESOLVED/);}
});

test('table alternatives stay complete education branches under ANY and unknown logic remains a hold',()=>{
 const and=extraction();and.requirements.expression.children[0].op='all';assert.throws(()=>assertRequirementSourcePolicy(candidate,and),/AI_REQUIREMENT_ALTERNATIVE_UNRESOLVED/);
 const split=extraction();split.requirements.items.splice(0,1,...routes[0].split('\n').map((q,i)=>item('split'+i,q,'education')));assert.throws(()=>assertRequirementSourcePolicy(candidate,split),/AI_REQUIREMENT_GROUP_UNRESOLVED/);
 const raw=wire();raw.requirements={items:[],expression:'unknown(1,'+lines.length+')'};
 const decoded=decodeGroqExtraction(raw,candidate),mapped=mapExtraction(candidate,decoded,{sourceId:'numbered_test',now:'2026-10-15T10:00:00.000Z'});
 assert.throws(()=>assertMaterialFacts(mapped.record),/MATERIAL_FACTS_UNRESOLVED/);
});

test('unbounded/unknown table layouts abstain, and numbered condition text is not rewritten',()=>{
 const unbounded={title:'Authored',sourceText:'2. Minimum requirements\nAttach your qualifications and relevant academic records.'};
 assert.deepEqual(requirementSourcePolicy(unbounded).submissionInstructions,[]);
 const changed={...candidate,sourceText:candidate.sourceText.replace('Important conditions:','Unknown extra route\nImportant conditions:')};
 assert.deepEqual(requirementSourcePolicy(changed).qualificationAlternatives,[]);
 for(const sourceText of ['2. Duties and responsibilities\nAttach your qualifications and relevant academic records.\nClosing date: 30 October 2026','4. Documents to prepare\nAttach your qualifications and relevant academic records.\nClosing date: 30 October 2026','2. Minimum requirements\nAttach your qualifications, if applicable\n3. Duties and responsibilities'])
  assert.deepEqual(requirementSourcePolicy({title:'Authored',sourceText}).submissionInstructions,[]);
 const numbered={title:'Authored',sourceText:'2. Minimum requirements\n1. Grade 12\n3. Duties and responsibilities'};
 assert.deepEqual(requirementSourcePolicy(numbered).requiredLineNumbers,[3]);assert.doesNotThrow(()=>assertRequirementSourcePolicy(numbered,{requirements:{items:[item('x','1. Grade 12','education')],expression:{op:'ref',id:'x'}}}));
});

test('ordinary mapping preserves original routes and missing attachment does not trigger semantic fallback',async()=>{
 const mapped=mapExtraction(candidate,decodeGroqExtraction(wire(),candidate),{sourceId:'numbered_test',now:'2026-10-15T10:00:00.000Z'});
 assert.equal(mapped.record.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(mapped.record.publication.approved,false);assertMaterialFacts(mapped.record);
 const raw=wire();raw.requirements.items.pop();raw.requirements.expression='all(any(r1,r2,r3),s0,s1,s2,s3)';let calls=0;
 const result=await extractWithProvider(candidate,{env,fetchImpl:async()=>{calls++;return answer(raw);}});
 assert.throws(()=>mapExtraction(candidate,result.extraction,{sourceId:'numbered_test',now:'2026-10-15T10:00:00.000Z'}),/AI_SUBMISSION_INSTRUCTION_COVERAGE/);assert.equal(calls,1);
});

test('split metadata receives required submission instructions and retains the full source wording',async()=>{
 const {requirements,...metadata}=wire();metadata.practicalConditions={state:'stated',span:span(attachment)};
 const result=await extractMetadata(candidate,{env,fetchImpl:async(_url,init)=>{
  const request=JSON.parse(init.body),payload=JSON.parse(request.contents[0].parts[0].text);
  assert.deepEqual(payload.submissionInstructions,[{originalText:attachment,span:span(attachment),level:'required'}]);
  assert.match(request.systemInstruction.parts[0].text,/do not promote publisher preparation/i);return answer(metadata);
 }});
 assert.equal(result.metadata.practicalConditions.value,attachment);assert.equal(result.metadata.practicalConditions.quote,attachment);
});
