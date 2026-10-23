import {test} from 'node:test';import assert from 'node:assert/strict';
import {issuerAttributionPolicy,assertIssuerAttribution,ISSUER_ATTRIBUTION_INSTRUCTION} from '../src/ai/issuer-attribution.mjs';
import {mapExtraction,EXTRACTION_INSTRUCTION} from '../src/ai/extraction.mjs';
import {groqExtractionPayload,decodeGroqExtraction,decodeGroqMetadata,GROQ_EXTRACTION_INSTRUCTION} from '../src/ai/groq-schema.mjs';
import {extractWithProvider} from '../src/ai/provider.mjs';import {extractMetadata,METADATA_INSTRUCTION} from '../src/ai/metadata.mjs';import {extractWithGemini} from '../src/ai/gemini.mjs';
import {qualificationCandidate,qualificationExtraction,qualificationWire} from './fixtures/qualification-model.mjs';
const label='Company : Fictional Group Recruitment',name='Fictional Group Recruitment';
const candidate={...qualificationCandidate,title:'Authored Brand electrical apprentice',sourceText:label+'\n'+qualificationCandidate.sourceText};
const fact=(value,quote=label)=>({state:'stated',value,quote}),absent=()=>({state:'not_stated',value:null,quote:null});
const source=sourceText=>({title:'Authored Brand apprentice',sourceText});
const span=text=>{const lines=(candidate.title+'\n'+candidate.sourceText).split('\n'),first=lines.indexOf(text.split('\n')[0])+1;assert.ok(first);return [first,first+text.split('\n').length-1];};
const rich=()=>({...qualificationExtraction(),categoryQuote:candidate.title,issuer:fact(name)});
function wire(){const x=qualificationWire(),lines=(qualificationCandidate.title+'\n'+qualificationCandidate.sourceText).split('\n');for(const f of [x.summary,x.deadline,...x.requirements.items])f.span=span(lines.slice(f.span[0]-1,f.span[1]).join('\n'));x.issuer={state:'stated',value:name,span:span(label)};x.categorySpan=[1,1];return x;}
const map=(c,x)=>mapExtraction(c,x,{sourceId:'issuer_test',now:'2026-10-18T10:00:00.000Z'});
const answer=data=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
const env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_issuer_key',SKILVED_AI_FALLBACK:'true'};

test('labelled advertising issuer keeps its full evidence and does not alias the branded title',()=>{
 const before=structuredClone(candidate),p=issuerAttributionPolicy(candidate);assert.equal(p.status,'supported');assert.equal(p.supportedName,name);assert.deepEqual(p.labels,[{label:'company',value:name,span:[2,2],originalText:label}]);
 assert.deepEqual(groqExtractionPayload(candidate).issuerAttributionPolicy,p);for(const x of [rich(),decodeGroqExtraction(wire(),candidate)]){const mapped=map(candidate,x);assert.equal(mapped.record.issuer.value,name);assert.equal(mapped.record.title.value,candidate.title);assert.equal(mapped.record.publication.approved,false);}
 assert.deepEqual(candidate,before);
});

test('brand substitution, omitted issuer and clipped label evidence reject without rewriting facts',()=>{
 for(const f of [fact('Authored Brand',candidate.title),fact(name,name),absent(),{state:'ambiguous',value:null,quote:label}]){
  const x=rich();x.issuer=f;const before=structuredClone(x);assert.throws(()=>map(candidate,x),/AI_ISSUER_ATTRIBUTION_UNRESOLVED/);assert.deepEqual(x,before);
 }
 const x=wire();x.issuer={state:'stated',value:'Authored Brand',span:[1,1]};assert.throws(()=>decodeGroqExtraction(x,candidate),/AI_ISSUER_ATTRIBUTION_UNRESOLVED/);const {requirements,...meta}=x;assert.throws(()=>decodeGroqMetadata(meta,candidate),/AI_ISSUER_ATTRIBUTION_UNRESOLVED/);
});

test('recognition is limited to eligible metadata labels, not titles, history, preparation or other programmes',()=>{
 for(const text of ['Company: Fictional Group','  Employer : Fictional Group  ','3. Recruiter: Fictional Group'])assert.equal(issuerAttributionPolicy(source(text)).supportedName,'Fictional Group');
 for(const text of ['Fictional Brand seeks apprentices.','Previous employer: Fictional Group','Company address: Fictional Group',
  'Job Summary:\nCompany: Previous Group','Employment history\nEmployer: Previous Group','References\nEmployer: Referee Group',
  'Documents to prepare\nCompany: Preparation Group','Join our WhatsApp group\nHow to apply\nRecruiter: Publisher Group'])assert.equal(issuerAttributionPolicy(source(text)).status,'no_label',text);
 assert.equal(issuerAttributionPolicy({title:'Company: Title Brand',sourceText:'An apprenticeship.'}).status,'no_label');
 assert.equal(issuerAttributionPolicy({...source('Company: Other Programme'),programmeScope:{includedSpans:[[1,1]]}}).status,'no_label');
 assert.doesNotThrow(()=>assertIssuerAttribution(source('Unlabelled employer seeks apprentices.'),fact('Unlabelled employer','Unlabelled employer seeks apprentices.')));
});

test('conflicting or unsafe labels require complete uncertainty rather than picking a company',()=>{
 for(const text of ['Company: Fictional A\nEmployer: Fictional B','Company: Fictional A or Fictional B','Company: Unknown','Company: RecentJobs','Company: https://example.test']){
  const c=source(text),p=issuerAttributionPolicy(c);assert.equal(p.status,'unresolved');assert.equal(p.supportedName,null);assert.throws(()=>assertIssuerAttribution(c,fact('Fictional A',text)),/AI_ISSUER_ATTRIBUTION_UNRESOLVED/);assert.throws(()=>assertIssuerAttribution(c,absent()),/AI_ISSUER_ATTRIBUTION_UNRESOLVED/);
  assert.doesNotThrow(()=>assertIssuerAttribution(c,{state:'conflicting',value:null,quote:text}));
 }
 const c=source('Company: Fictional A\nEmployer: Fictional B');assert.throws(()=>assertIssuerAttribution(c,{state:'ambiguous',value:null,quote:'Company: Fictional A'}),/AI_ISSUER_ATTRIBUTION_UNRESOLVED/);
 assert.equal(issuerAttributionPolicy(source('Company: Fictional A\nEmployer: fictional a')).status,'supported');
});

test('ordinary and split provider paths retain usage and stop after one attribution failure',async()=>{
 for(const split of [false,true]){const x=wire();x.issuer={state:'stated',value:'Authored Brand',span:[1,1]};const {requirements,...metadata}=x;let calls=0;
  await assert.rejects((split?extractMetadata:extractWithProvider)(candidate,{env,fetchImpl:async(_url,init)=>{calls++;const body=JSON.parse(init.body),payload=JSON.parse(body.contents[0].parts[0].text);assert.deepEqual(payload.issuerAttributionPolicy,issuerAttributionPolicy(candidate));assert.ok(body.systemInstruction.parts[0].text.includes(ISSUER_ATTRIBUTION_INSTRUCTION));return answer(split?metadata:x);}}),e=>e.code==='AI_ISSUER_ATTRIBUTION_UNRESOLVED'&&e.usage.totalTokens===15);assert.equal(calls,1);
 }
});

test('native rich requests carry the same attribution policy and canonical mapping enforces it',async()=>{
 let calls=0;const x=rich();x.issuer=fact('Authored Brand',candidate.title);const result=await extractWithGemini(candidate,{env,fetchImpl:async(_url,init)=>{calls++;const payload=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);assert.deepEqual(payload.issuerAttributionPolicy,issuerAttributionPolicy(candidate));return answer(x);}});assert.equal(calls,1);assert.throws(()=>map(candidate,result.extraction),/AI_ISSUER_ATTRIBUTION_UNRESOLVED/);
 for(const instruction of [EXTRACTION_INSTRUCTION,GROQ_EXTRACTION_INSTRUCTION,METADATA_INSTRUCTION])assert.ok(instruction.includes(ISSUER_ATTRIBUTION_INSTRUCTION));
});
