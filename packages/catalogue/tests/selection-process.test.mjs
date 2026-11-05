import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectionProcessPolicy,assertSelectionProcessCompleteness} from '../src/ai/selection-process.mjs';
import {groqExtractionPayload,decodeGroqMetadata} from '../src/ai/groq-schema.mjs';
import {mapExtraction,EXTRACTION_VERSION} from '../src/ai/extraction.mjs';
import {METADATA_VERSION,extractMetadata} from '../src/ai/metadata.mjs';
import {PROGRAMME_EXTRACTION_VERSION} from '../src/ai/programme-extraction.mjs';
import {syntheticExtraction} from './fixtures/recentjobs-model.mjs';
import {assertPracticalEvidence} from '../src/ai/practical-evidence.mjs';

const block='Selection process\n• Shortlisted candidates may attend an interview.\n• A background check follows a conditional offer.';
const warning='Provide truthful information and valid documents.';
const candidate={title:'Fictional electrical apprentice',sourceText:[
 'Fictional Workshop seeks an electrical apprentice.','Minimum requirements','Grade 12','How to apply',block,warning,
 'Closing date: 30 October 2026','Apply online'].join('\n'),sourceUrl:'https://recentjobs.co.za/2026/10/15/fictional/',
 sourceRecordId:'fictional',contentHash:'authored',issues:[],deadlineCandidates:[{localDate:'2026-10-30'}],
 applicationCandidates:[{method:'portal',destination:'https://employer.example/apply',originalText:'Apply online'}]};
const stated=value=>({state:'stated',value,quote:value});
const lines=(candidate.title+'\n'+candidate.sourceText).split('\n');
const span=text=>{const start=lines.indexOf(text.split('\n')[0])+1;return [start,start+text.split('\n').length-1];};
const wire=()=>({category:'apprenticeship',categorySpan:[1,1],issuer:null,summary:null,intake:null,location:null,residence:null,
 experience:null,deadline:null,compensation:[],practicalConditions:{state:'stated',span:span(block+'\n'+warning)},applicationCandidateIndex:0});
const extraction=()=>{const x=syntheticExtraction();x.requirements={items:[{id:'q',kind:'education',level:'required',fact:stated({description:'Grade 12',qualification:null,document:null})}],expression:{op:'ref',id:'q'}};x.requirements.items[0].fact.quote='Grade 12';x.practicalConditions=stated(block+'\n'+warning);return x;};

test('labelled assessment lists retain complete spans and conditional/optional wording',()=>{
 const policy=selectionProcessPolicy(candidate);assert.deepEqual(policy,{version:'source_selection_process_v1',blocks:[{span:span(block),originalText:block}]});
 assert.deepEqual(groqExtractionPayload(candidate).selectionProcessPolicy,policy);
 assert.equal(decodeGroqMetadata(wire(),candidate).practicalConditions.value,block+'\n'+warning);
 const result=mapExtraction(candidate,extraction(),{sourceId:'selection_test',now:'2026-10-15T10:00:00.000Z'});
 assert.equal(result.record.practicalConditions.value,block+'\n'+warning);assert.equal(result.record.requirements.requirements.length,1);
 assert.equal(result.record.publication.approved,false);
 assert.equal(EXTRACTION_VERSION,'recentjobs_extraction_v32');assert.equal(METADATA_VERSION,'recentjobs_metadata_v24');assert.equal(PROGRAMME_EXTRACTION_VERSION,'recentjobs_programme_extraction_v32');
});

test('missing, partial, paraphrased or eligibility-only retention fails without repairing the answer',()=>{
 for(const fact of [{state:'not_stated',value:null,quote:null},stated(warning),stated(block.split('\n').slice(0,2).join('\n')),
  {state:'stated',value:block.replace('may attend','must attend'),quote:block},{state:'ambiguous',value:null,quote:block}]){
  const original=structuredClone(fact);assert.throws(()=>assertSelectionProcessCompleteness(candidate,fact),/AI_SELECTION_PROCESS_UNRESOLVED/);assert.deepEqual(fact,original);
 }
 const w=wire();w.practicalConditions={state:'stated',span:span(warning)};
 assert.throws(()=>decodeGroqMetadata(w,candidate),/AI_SELECTION_PROCESS_UNRESOLVED/);
 const x=extraction();x.practicalConditions=stated(warning);x.requirements.items.push({id:'steps',kind:'other',level:'required',fact:stated({description:block,qualification:null,document:null})});x.requirements.items[1].fact.quote=block;
 assert.throws(()=>mapExtraction(candidate,x,{sourceId:'selection_test',now:'2026-10-15T10:00:00.000Z'}),/AI_SELECTION_PROCESS_UNRESOLVED/);
});

test('bare Process requires assessment language throughout and does not capture ordinary job duties',()=>{
 for(const label of ['Recruitment process:','2. Recruitment and selection process','Selection assessments','Process']){
  const c={...candidate,sourceText:label+'\n1. Practical assessment\n2. Reference check'};
  assert.equal(selectionProcessPolicy(c).blocks.length,1);
 }
 for(const text of ['Process\n• Maintain tools\n• Record completed work','Process\n• Interview\n• Repair machinery',
  'Selection process','Applicants may attend an assessment.'])assert.deepEqual(selectionProcessPolicy({...candidate,sourceText:text}).blocks,[]);
});

test('publisher preparation, promotions and foreign programme spans cannot become recruitment facts',()=>{
 for(const sourceText of ['Documents to prepare\n'+block, 'Selection process\n• Interview\n• Join our WhatsApp group'])
  assert.deepEqual(selectionProcessPolicy({...candidate,sourceText}).blocks,[]);
 const [first,last]=span(block);
 for(const includedSpans of [[[1,first-1]],[[first+1,last]],[[first,last-1]]])
  assert.deepEqual(selectionProcessPolicy({...candidate,programmeScope:{includedSpans}}).blocks,[]);
 assert.equal(selectionProcessPolicy({...candidate,programmeScope:{includedSpans:[[first,last]]}}).blocks.length,1);
});

test('separated recruitment blocks require one faithful passage rather than invented joined evidence',()=>{
 const other='Recruitment process\n• Final interview',source={...candidate,sourceText:block+'\nIntervening source context.\n'+other};
 assert.equal(selectionProcessPolicy(source).blocks.length,2);
 assert.throws(()=>assertSelectionProcessCompleteness(source,stated(block)),/AI_SELECTION_PROCESS_UNRESOLVED/);
 // The ordinary practical-evidence guard independently rejects a non-contiguous join.
 assert.throws(()=>assertPracticalEvidence(source,stated(block+'\n'+other)),/AI_UNSUPPORTED_EVIDENCE/);
 assert.doesNotThrow(()=>assertSelectionProcessCompleteness(source,stated(source.sourceText)));
});

test('split metadata sends the policy to the provider and rejects omissions before another stage',async()=>{
 const missing=wire();missing.practicalConditions=null;let calls=0;
 await assert.rejects(extractMetadata(candidate,{env:{SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_selection_key',SKILVED_AI_FALLBACK:'false'},fetchImpl:async(_url,options)=>{
  calls++;assert.match(options.body,/source_selection_process_v1/);
  return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(missing)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
 }}),error=>{assert.equal(error.code,'AI_SELECTION_PROCESS_UNRESOLVED');assert.ok(error.usage);return true;});
 assert.equal(calls,1);
});
