import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertPracticalEvidence,practicalEvidencePolicy} from '../src/ai/practical-evidence.mjs';
import {assertRequirementSourcePolicy,requirementSourcePolicy} from '../src/ai/requirement-source-policy.mjs';
import {decodeGroqMetadata,decodeGroqExtraction,groqExtractionPayload} from '../src/ai/groq-schema.mjs';
import {extractMetadata} from '../src/ai/metadata.mjs';
import {extractWithProvider} from '../src/ai/provider.mjs';
import {mapExtraction} from '../src/ai/extraction.mjs';
import {syntheticExtraction} from './fixtures/recentjobs-model.mjs';

const attachment='Attach your qualifications and relevant academic records.';
const threshold='Mathematics must have been passed with at least 50%.';
const candidate={title:'Fictional electrical apprentice',sourceText:[
 'Fictional Workshop seeks an electrical apprentice.','2. Minimum requirements','Grade 12',threshold,attachment,
 '3. Duties and responsibilities','Maintain tools.','4. Documents to prepare','Use this checklist before applying.',
 'Updated CV','Certified ID, if applicable','5. Why you should apply','Publisher advice.',
 '6. How to apply','Email subject: Electrical','Include other certificates, if applicable.',
 'Closing date: 30 October 2026','Apply now'].join('\n'),sourceUrl:'https://recentjobs.co.za/2026/10/15/fictional/',
 sourceRecordId:'fictional',contentHash:'authored',issues:[],deadlineCandidates:[{localDate:'2026-10-30'}],
 applicationCandidates:[{method:'portal',destination:'https://employer.example/apply',originalText:'Apply now'}]};
const stated=(value,quote=value)=>({state:'stated',value,quote});
const item=(id,quote,kind='education',level='required')=>({id,kind,level,fact:stated({description:quote,qualification:null,document:null},quote)});
const requirements=()=>({items:[item('q','Grade 12'),item('s',threshold,'subjects')],expression:{op:'all',children:[{op:'ref',id:'q'},{op:'ref',id:'s'}]}});
const extraction=()=>({...syntheticExtraction(),requirements:requirements(),practicalConditions:stated(attachment)});
const map=input=>mapExtraction(candidate,input,{sourceId:'practical_test',now:'2026-10-15T10:00:00.000Z'});
const partial=()=>({category:'apprenticeship',categorySpan:[1,1],issuer:null,summary:null,intake:null,location:null,residence:null,
 experience:null,deadline:null,compensation:[],practicalConditions:null,applicationCandidateIndex:0});
const lines=(candidate.title+'\n'+candidate.sourceText).split('\n'),span=q=>{const first=lines.indexOf(q.split('\n')[0])+1;return [first,first+q.split('\n').length-1];};

test('practical values cannot add text from elsewhere, paraphrase or drop conditional/negative context',()=>{
 for(const fact of [stated(attachment+' Updated CV',attachment),stated('Attach certificates.',attachment),
   stated('Include other certificates.','Include other certificates, if applicable.'),
   stated('overnight travel required','No overnight travel required')])
  assert.throws(()=>assertPracticalEvidence(candidate,fact),/AI_PRACTICAL_EVIDENCE_UNRESOLVED/);
 assert.throws(()=>assertPracticalEvidence(candidate,stated('Fabricated instruction')),/AI_UNSUPPORTED_EVIDENCE/);
});

test('one complete source passage retains subjects, conditions, newlines and ordinary unknown states',()=>{
 const passage='Email subject: Electrical\nInclude other certificates, if applicable.';
 assert.doesNotThrow(()=>assertPracticalEvidence(candidate,stated(passage)));
 for(const state of ['not_stated','ambiguous','conflicting'])assert.doesNotThrow(()=>assertPracticalEvidence(candidate,{state,value:null,quote:state==='not_stated'?null:passage}));
 assert.throws(()=>assertPracticalEvidence(candidate,stated(attachment+'\n'+passage)),/AI_UNSUPPORTED_EVIDENCE/);
});

test('recognised publisher preparation is held even when copied verbatim into practical or eligibility facts',()=>{
 for(const quote of ['Updated CV','Certified ID, if applicable','4. Documents to prepare\nUse this checklist before applying.\nUpdated CV'])
  assert.throws(()=>assertPracticalEvidence(candidate,stated(quote)),/AI_PUBLISHER_PREPARATION_UNRESOLVED/);
 const input=extraction();input.requirements.items.push(item('advice','Updated CV','document'));
 assert.throws(()=>assertRequirementSourcePolicy(candidate,input),/AI_PUBLISHER_PREPARATION_UNRESOLVED/);
 assert.doesNotThrow(()=>assertPracticalEvidence(candidate,stated('Email subject: Electrical')));
 const open={title:'Authored',sourceText:'Documents to prepare\nUpdated CV'};
 assert.throws(()=>assertPracticalEvidence(open,stated('Updated CV')),/AI_PUBLISHER_PREPARATION_UNRESOLVED/);
 // Existing numbered-heading boundaries must survive the additional split-line recognition.
 assert.deepEqual(practicalEvidencePolicy({title:'Authored',sourceText:'Documents to prepare\nUpdated CV\n1. Join our WhatsApp group\nOther material\nHow to apply'}).publisherPreparationSpans,[[2,3]]);
 assert.deepEqual(requirementSourcePolicy({title:'Authored',sourceText:'Minimum requirements\nGrade 12\n1. Join our WhatsApp group\nN3\nHow to apply'}).requiredLineNumbers,[3]);
});

test('duplicate preparation wording needs fuller evidence, while actual required documents remain supported',()=>{
 const source={title:'Authored',sourceText:'Required application documents\nCertified ID\nHow to apply\nApply online\nDocuments to prepare\nCertified ID\nClosing date: 30 October 2026'};
 assert.throws(()=>assertPracticalEvidence(source,stated('Certified ID')),/AI_PUBLISHER_PREPARATION_UNRESOLVED/);
 const full='Required application documents\nCertified ID';
 assert.doesNotThrow(()=>assertPracticalEvidence(source,stated(full)));
 assert.doesNotThrow(()=>assertRequirementSourcePolicy(source,{requirements:{items:[item('id',full,'document')],expression:{op:'ref',id:'id'}}}));
 assert.deepEqual(practicalEvidencePolicy(candidate).publisherPreparationSpans,[span('4. Documents to prepare\nUse this checklist before applying.\nUpdated CV\nCertified ID, if applicable')]);
});

test('standalone subject thresholds get subject hints in bounded sections, preserving strength and uncertainty',()=>{
 const hint=requirementSourcePolicy(candidate).lineHints.find(h=>h.line===span(threshold)[0]);assert.equal(hint.kind,'subjects');
 assert.doesNotThrow(()=>assertRequirementSourcePolicy(candidate,extraction()));
 for(const kind of ['education','other','document']){const input=extraction();input.requirements.items[1].kind=kind;assert.throws(()=>assertRequirementSourcePolicy(candidate,input),/AI_REQUIREMENT_KIND_UNRESOLVED/);}
 const preferred={title:'Authored',sourceText:'Preferred requirements\nPhysical Science must have been passed with at least 60%.\nHow to apply'};
 assert.deepEqual(requirementSourcePolicy(preferred).lineHints.map(({kind,level})=>({kind,level})),[{kind:'subjects',level:'preferred'}]);
 const documents={title:'Authored',sourceText:'Required application documents\n'+threshold+'\nHow to apply'};
 assert.equal(requirementSourcePolicy(documents).lineHints[0].kind,'document');
 for(const sourceText of ['Duties\n'+threshold+'\nHow to apply','Requirements\n'+threshold,
   'Requirements\nGrade 12 with Mathematics at 50%.\nHow to apply'])assert.ok(!requirementSourcePolicy({title:'Authored',sourceText}).lineHints.some(h=>h.kind==='subjects'));
 const unknown={practicalConditions:stated(attachment),requirements:{items:[],expression:{op:'unknown',originalText:'Grade 12\n'+threshold}}};
 assert.doesNotThrow(()=>assertRequirementSourcePolicy(candidate,unknown));
});

test('native mapping independently blocks practical expansion and retains exact original destinations on success',()=>{
 const bad=extraction();bad.practicalConditions.value+=' Updated CV';assert.throws(()=>map(bad),/AI_PRACTICAL_EVIDENCE_UNRESOLVED/);
 const preparation=extraction();preparation.practicalConditions=stated('Updated CV');preparation.requirements.items.push(item('d',attachment,'document'));
 assert.throws(()=>map(preparation),/AI_PUBLISHER_PREPARATION_UNRESOLVED/);
 const good=map(extraction());assert.equal(good.record.practicalConditions.value,attachment);assert.equal(good.record.practicalConditions.originalText,attachment);
 assert.equal(good.record.applicationRoute.value.destination,candidate.applicationCandidates[0].destination);assert.equal(good.record.publication.approved,false);
});

test('mixed and split social invitations reject before drafting without editing source, output or original application route',()=>{
 const extra='Apply now online Join our\nWhatsApp group',notice={...candidate,sourceText:candidate.sourceText+'\n'+extra};
 const data=extraction();data.practicalConditions=stated(extra);
 data.requirements.items.push(item('d',attachment,'document'));data.requirements.expression.children.push({op:'ref',id:'d'});
 const before=structuredClone({notice,data});
 assert.throws(()=>mapExtraction(notice,data,{sourceId:'practical_test',now:'2026-10-15T10:00:00.000Z'}),{code:'AI_PROMOTIONAL_CONTENT'});
 for(const quote of [extra,'Join our','WhatsApp group'])assert.throws(()=>assertPracticalEvidence(notice,stated(quote)),{code:'AI_PROMOTIONAL_CONTENT'});
 const first=notice.sourceText.split('\n').length,raw=partial();raw.practicalConditions={state:'stated',span:[first,first+1]};
 for(const decode of [decodeGroqMetadata,decodeGroqExtraction]){
  const input=decode===decodeGroqExtraction?{...raw,requirements:{items:[],expression:`unknown(${first},${first+1})`}}:raw;
  assert.throws(()=>decode(input,notice),{code:'AI_PROMOTIONAL_CONTENT'});
 }
 assert.deepEqual(groqExtractionPayload(notice).excludedPromotionalLineNumbers,[first,first+1]);
 assert.deepEqual({notice,data},before);
 assert.equal(notice.applicationCandidates[0].destination,'https://employer.example/apply');
 // This authored supported instruction demonstrates the unchanged success path;
 // it is not used to repair the retained rejected provider answer.
 const good=mapExtraction(notice,extraction(),{sourceId:'practical_test',now:'2026-10-15T10:00:00.000Z'});
 assert.equal(good.record.applicationRoute.value.destination,notice.applicationCandidates[0].destination);
 assert.equal(good.record.publication.approved,false);
});

test('ordinary and split providers report one charged rejection without fallback or response repair for split promotions',async()=>{
 const notice={title:'Authored apprenticeship',sourceText:'Apply now online Join our\nWhatsApp group',applicationCandidates:[]};
 for(const provider of ['groq','gemini'])for(const split of [false,true]){
  const raw=partial();raw.practicalConditions={state:'stated',span:[2,3]};raw.applicationCandidateIndex=null;
  if(!split)raw.requirements={items:[],expression:'unknown(2,3)'};
  const before=structuredClone(raw);let calls=0;
  const env={SKILVED_AI_MODE:provider,GROQ_API_KEY:'synthetic_promotion_key',GEMINI_API_KEY:'synthetic_promotion_key',SKILVED_AI_FALLBACK:'true'};
  const fetchImpl=async()=>{calls++;return provider==='gemini'?Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(raw)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}}):Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(raw)}}],usage:{prompt_tokens:10,completion_tokens:5,total_tokens:15}});};
  await assert.rejects((split?extractMetadata:extractWithProvider)(notice,{env,fetchImpl}),e=>e.code==='AI_PROMOTIONAL_CONTENT'&&e.usage.totalTokens===15);
  assert.equal(calls,1);assert.deepEqual(raw,before);
 }
});

test('metadata rejects extra prose and publisher evidence without repairing a response or trying another model',async()=>{
 const env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_practical_test_key',SKILVED_AI_FALLBACK:'true'};
 for(const [value,quote,error] of [[attachment+' Updated CV',attachment,'AI_INVALID_EXTRACTION'],[undefined,'Updated CV','AI_PUBLISHER_PREPARATION_UNRESOLVED']]){
  const wire={...partial(),practicalConditions:{state:'stated',...(value===undefined?{}:{value}),span:span(quote)}};let calls=0;
  await assert.rejects(extractMetadata(candidate,{env,fetchImpl:async(_url,init)=>{
   calls++;const request=JSON.parse(init.body),payload=JSON.parse(request.contents[0].parts[0].text);
   assert.deepEqual(payload.practicalEvidencePolicy,practicalEvidencePolicy(candidate));assert.match(request.systemInstruction.parts[0].text,/value must equal its supporting quote/);
   return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(wire)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
  }}),e=>e.code===error&&e.usage.totalTokens===15);assert.equal(calls,1);
 }
 const wire={...partial(),practicalConditions:{state:'stated',span:span(attachment)}};
 assert.equal(decodeGroqMetadata(wire,candidate).practicalConditions.value,attachment);
 assert.deepEqual(groqExtractionPayload(candidate).practicalEvidencePolicy,practicalEvidencePolicy(candidate));
});
