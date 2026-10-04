import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {formatRequirements} from '@skilved/types/opportunities';
import {parseRecentJobsDetail} from '../src/adapters/recentjobs.mjs';
import {planRecentJobsProgrammes} from '../src/adapters/recentjobs-programmes.mjs';
import {decodeGroqExtraction} from '../src/ai/groq-schema.mjs';
import {mapExtraction,EXTRACTION_INSTRUCTION} from '../src/ai/extraction.mjs';
import {extractWithProvider} from '../src/ai/provider.mjs';
import {extractProgramme} from '../src/ai/programme-extraction.mjs';
import {programmeWire} from './fixtures/programme-model.mjs';
import {validateExtraction} from '../src/ai/validation.mjs';
import {assertMaterialFacts,publicationGate} from '../src/worker-policy.mjs';

// Authored notices and simulated responses only. No network or applicant scoring.
const html='<article class="type-post"><h1 class="entry-title">Fictional Workshop apprenticeship</h1><div class="entry-content"><p>Fictional Workshop invites apprentices.</p><h2>Minimum requirements</h2><p>One of the following:</p><p>Grade 12</p><p>N3 Electrical</p><h2>Added advantages</h2><p>N2 Mechanical</p><p>Basic hand-skills training</p><h2>Required documents</h2><p>Certified ID</p><p>Other supporting certificates, if applicable</p><p>Closing date: 30 October 2026</p><a href="https://employer.example/apply">Apply now</a></div></article>';
const candidate=parseRecentJobsDetail({html,url:'https://recentjobs.co.za/2026/10/04/fictional-preferences/'}),lines=(candidate.title+'\n'+candidate.sourceText).split('\n');
const span=text=>{const line=lines.indexOf(text)+1;assert.ok(line>0);return [line,line];};
const stated=(value,text=value)=>({state:'stated',value,span:span(text)});
function wire(){
 return {category:'apprenticeship',categorySpan:[1,1],issuer:stated('Fictional Workshop','Fictional Workshop invites apprentices.'),summary:stated('Fictional Workshop invites apprentices.'),intake:null,location:null,residence:null,experience:null,compensation:[],
 deadline:stated({kind:'date',localDate:'2026-10-30',localTime:null,timezone:null,utcInstant:null},'Closing date: 30 October 2026'),
 practicalConditions:stated('Other supporting certificates, if applicable'),applicationCandidateIndex:0,
 requirements:{items:[['r1','education','required','Grade 12'],['r2','education','required','N3 Electrical'],['r3','education','preferred','N2 Mechanical'],['r4','other','preferred','Basic hand-skills training'],['r5','document','required','Certified ID']].map(([id,kind,level,text])=>({id,kind,level,state:'stated',span:span(text)})),expression:'all(any(r1,r2),r3,r4,r5)'}};
}
const options={sourceId:'authored_preferences',now:'2026-10-04T10:00:00.000Z'},mapped=()=>mapExtraction(candidate,decodeGroqExtraction(wire(),candidate),options),env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_preference_key',SKILVED_AI_FALLBACK:'true'};
const answer=data=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});

test('mixed-strength ALL inventories keep required alternatives and independently labelled preferences',()=>{
 const result=mapped(),set=result.record.requirements;assertMaterialFacts(result.record);
 assert.deepEqual(set.expression,{op:'all',children:[{op:'any',children:[{op:'ref',id:'r1'},{op:'ref',id:'r2'}]},{op:'ref',id:'r3'},{op:'ref',id:'r4'},{op:'ref',id:'r5'}]});
 assert.deepEqual(set.requirements.map(i=>i.level),['required','required','preferred','preferred','required']);
 const formatted=formatRequirements({...set,requirements:set.requirements.map(i=>({...i,fact:{state:i.fact.state,value:i.fact.value,originalText:i.fact.originalText,citations:['source_notice']}}))});
 assert.match(formatted,/ANY of \(\[required\] Grade 12 OR \[required\] N3 Electrical\)/);
 assert.match(formatted,/\[preferred\] N2 Mechanical/);assert.match(formatted,/\[preferred\] Basic hand-skills training/);
 assert.equal(result.record.practicalConditions.value,'Other supporting certificates, if applicable');
 assert.equal(result.record.applicationRoute.value.destination,'https://employer.example/apply');
 assert.equal(result.record.publication.approved,false);assert.ok(!set.requirements.some(i=>i.fact.originalText.includes('if applicable')));
});

test('preferences cannot introduce empty alternatives, none branches or omitted references',()=>{
 for(const expression of ['all(any(r1,r2),any(r3,none),r4,r5)','all(any(r1,r2),r3,any(r4,none),r5)','all(any(r1,r2),r3,r4,r5,none)','all(any(r1,r2),r5)','all(any(r1,r2),optional(r3),r4,r5)']){
  const data=wire();data.requirements.expression=expression;const before=JSON.stringify(data);
  assert.throws(()=>decodeGroqExtraction(data,candidate),/AI_INVALID_EXTRACTION/);assert.equal(JSON.stringify(data),before);
 }
});

test('an available preference-grammar failure stops after availability fallback with no repair or lower-model call',async()=>{
 const data=wire();data.requirements.expression='all(any(r1,r2),any(r3,none),r4,r5)';const before=JSON.stringify(data),models=[];
 await assert.rejects(extractWithProvider(candidate,{env,fetchImpl:async url=>{
  models.push(url.split('/models/')[1].split(':')[0]);return models.length===1?new Response(null,{status:503}):answer(data);
 }}),error=>error.code==='AI_INVALID_EXTRACTION'&&error.usage.totalTokens===15);
 assert.deepEqual(models,['gemini-3.8-flash','gemini-3.7-flash']);assert.equal(JSON.stringify(data),before);
});

test('source strength and independent negative assessment still block a mixed-strength record',async()=>{
 const wrong=wire();wrong.requirements.items[2].level='required';
 assert.throws(()=>mapExtraction(candidate,decodeGroqExtraction(wrong,candidate),options),/AI_REQUIREMENT_LEVEL_UNRESOLVED/);
 const result=mapped(),source={automation:{employerCrawl:false,checkTtlHours:24,issuers:[{name:'Fictional Workshop',host:'employer.example',pathPrefix:'/apply'}]}};
 const assessment=await validateExtraction({record:result.record,recentjobsText:result.snapshot.text,applicationCandidates:candidate.applicationCandidates},{
  env,fetchImpl:async(_url,init)=>{
   const request=JSON.parse(init.body),payload=JSON.parse(request.contents[0].parts[0].text);
   assert.match(request.systemInstruction.parts[0].text,/A preferred-labelled reference under ALL/);
   assert.deepEqual(payload.extracted.requirements.expression,result.record.requirements.expression);
   assert.equal(payload.extracted.requirements.requirements.find(i=>i.id==='r3').level,'preferred');
   return answer({supported:false,issues:[{field:'requirements',reason:'Authored unsupported relationship'}],evidence:[{source:'recentjobs',quote:'N2 Mechanical'}]});
  }});
 assert.throws(()=>publicationGate(source,candidate,result.record,null,assessment,options.now),/SEMANTIC_VALIDATION_FAILED/);
 const unknown=structuredClone(result.record);unknown.requirements.expression={op:'unknown',originalText:'Unclear source relationship'};
 assert.throws(()=>publicationGate(source,candidate,unknown,null,{supported:true,issues:[]},options.now),/MATERIAL_FACTS_UNRESOLVED/);
});

test('ordinary and programme requests give the same preference-strength guidance and valid example',async()=>{
 assert.match(EXTRACTION_INSTRUCTION,/An ALL inventory does not promote/);
 await extractWithProvider(candidate,{env,fetchImpl:async(_url,init)=>{
  const instruction=JSON.parse(init.body).systemInstruction.parts[0].text;
  assert.match(instruction,/all\(any\(r1,r2\),r3,r4\)/);assert.match(instruction,/any\(preferredItem,none\) is invalid/);return answer(wire());
 }});
 const programmeHtml=await readFile(new URL('./fixtures/recentjobs-programmes.html',import.meta.url),'utf8'),programme=parseRecentJobsDetail({html:programmeHtml,url:candidate.sourceUrl}),intake=planRecentJobsProgrammes(programme).intakes[0];
 await extractProgramme(programme,intake.id,{env,fetchImpl:async(_url,init)=>{
  const instruction=JSON.parse(init.body).systemInstruction.parts[0].text;
  assert.match(instruction,/An ALL inventory does not promote/);assert.match(instruction,/any\(preferredItem,none\) is invalid/);
  return answer(programmeWire(programme,intake));
 }});
});