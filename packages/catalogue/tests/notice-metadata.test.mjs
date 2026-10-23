import {test} from 'node:test';import assert from 'node:assert/strict';
import {metadataCompletenessPolicy,assertMetadataCompleteness} from '../src/ai/metadata-completeness.mjs';
import {assertSummaryMetadataEvidence} from '../src/ai/notice-metadata.mjs';
import {decodeGroqExtraction,decodeGroqMetadata,groqExtractionPayload} from '../src/ai/groq-schema.mjs';
import {mapExtraction} from '../src/ai/extraction.mjs';
import {extractWithProvider} from '../src/ai/provider.mjs';import {extractMetadata} from '../src/ai/metadata.mjs';
import {noticeCandidate as c,noticeWire,noticeSpan,invitation,reference,regionalBenefits} from './fixtures/notice-metadata.mjs';
const map=x=>mapExtraction(c,x,{sourceId:'authored_metadata',now:'2026-09-26T10:00:00.000Z'});
const source=sourceText=>({title:'Authored apprenticeship',sourceText});
const absent=()=>({state:'not_stated',value:null,quote:null});
const stated=(value,quote=value)=>({state:'stated',value,quote});

test('metadata hints preserve a requisition, invited audience and explicitly regional benefits without completing fields',()=>{
  const p=metadataCompletenessPolicy(c);
  assert.equal(p.version,'source_metadata_completeness_v2');
  assert.deepEqual(p.references,[{value:'APP/TEST-042',span:noticeSpan(reference),originalText:reference}]);
  assert.deepEqual(p.audiences,[{wording:'unemployed youth',span:noticeSpan(invitation),originalText:invitation}]);
  assert.deepEqual(p.regionalBenefits,[{scope:'regional comprehensive benefits',benefits:['Retirement benefits','Medical aid'],span:noticeSpan(regionalBenefits),originalText:regionalBenefits}]);
  assert.deepEqual(groqExtractionPayload(c).metadataCompletenessPolicy,p);
  const mapped=map(decodeGroqExtraction(noticeWire(),c));assert.equal(mapped.record.intake.value,'APP/TEST-042');
  assert.equal(mapped.record.summary.value,invitation);assert.equal(mapped.record.requirements.requirements.some(r=>['age','residence','citizenship'].includes(r.kind)),false);
  assert.ok(mapped.record.compensation.every(f=>f.value.amount===null&&f.value.currency===null&&f.originalText===regionalBenefits));
  assert.equal(mapped.record.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(mapped.record.publication.approved,false);
});

test('reference labels support same/next-line IDs and reject missing, conflicting, partial or unlabelled evidence',()=>{
  for(const text of ['Requisition ID: APP/TEST-042','Requisition number\nAPP/TEST-042','Reference: APP/TEST-042','Reference Number\nAPP/TEST-042','Ref #: APP/TEST-042']) {
    const candidate=source(text),p=metadataCompletenessPolicy(candidate);assert.equal(p.references.length,1);
    assert.doesNotThrow(()=>assertMetadataCompleteness(candidate,{intake:stated('APP/TEST-042',text)}));
    for(const intake of [absent(),stated('APP/TEST-0420',text),stated('APP/TEST-042','APP/TEST-042')])
      assert.throws(()=>assertMetadataCompleteness(candidate,{intake}),/AI_SOURCE_REFERENCE_UNRESOLVED/);
  }
  assert.throws(()=>assertMetadataCompleteness(source('Reference: APP/TEST-042\nRequisition ID: OTHER-043'),{intake:stated('APP/TEST-042',reference)}),/AI_SOURCE_REFERENCE_UNRESOLVED/);
  for(const text of ['Application subject: APP/TEST-042','Requisition ID: unknown code with spaces','Requisition ID:','Job ID might be APP/TEST-042'])
    assert.deepEqual(metadataCompletenessPolicy(source(text)).references,[]);
});

test('audience must survive in its summary value and evidence without source-quote-only or negated retention',()=>{
  for(const change of [x=>{x.summary=absent();},x=>{x.summary.value='An apprenticeship programme.';},
    x=>{x.summary.quote=c.title;},x=>{x.summary.value='Not unemployed youth.';}]) {
    const x=decodeGroqExtraction(noticeWire(),c);change(x);const before=structuredClone(x);
    assert.throws(()=>assertMetadataCompleteness(c,x),/AI_AUDIENCE_UNRESOLVED/);assert.deepEqual(x,before);
  }
});

test('regional benefits cannot disappear, lose their scope, use only the list as evidence or gain an amount/guarantee',()=>{
  for(const change of [x=>{x.compensation=[];},x=>{x.compensation.pop();},x=>{x.compensation[0].value.coverage='Retirement benefits';},
    x=>{x.compensation[0].quote='Retirement benefits\nMedical aid';},x=>{x.compensation[0].value.amount=1000;},
    x=>{x.compensation[0].value.currency='ZAR';},x=>{x.compensation[0].value.period='month';},x=>{x.compensation[0].value.kind='salary';},
    x=>{x.compensation[0].value.coverage+=' guaranteed for every apprentice';}]) {
    const x=decodeGroqExtraction(noticeWire(),c);change(x);const before=structuredClone(x);
    assert.throws(()=>assertMetadataCompleteness(c,x),/AI_REGIONAL_BENEFITS_UNRESOLVED/);assert.deepEqual(x,before);
  }
  const x=decodeGroqExtraction(noticeWire(),c);x.compensation[0].value.coverage+='; Medical aid';x.compensation.pop();
  assert.doesNotThrow(()=>assertMetadataCompleteness(c,x));
});

test('complete verbatim corporate benefit coverage preserves regional context without allowing added promises or repaired wording',()=>{
  const wire=noticeWire();wire.compensation=[{...wire.compensation[0],value:{...wire.compensation[0].value,coverage:regionalBenefits}}];
  const before=structuredClone(wire),x=decodeGroqExtraction(wire,c),mapped=map(x);
  assert.equal(mapped.record.compensation[0].value.coverage,regionalBenefits);assert.equal(mapped.record.compensation[0].originalText,regionalBenefits);assert.deepEqual(wire,before);
  for(const coverage of [regionalBenefits+'\nGuaranteed for this vacancy.',regionalBenefits.replace('regional comprehensive benefits','guaranteed comprehensive benefits'),
    regionalBenefits.replace('regional comprehensive benefits','comprehensive benefits'),regionalBenefits.replace('practical learning','guaranteed placement')]) {
    const bad=structuredClone(x);bad.compensation[0].value.coverage=coverage;const original=structuredClone(bad);
    assert.throws(()=>map(bad),/AI_REGIONAL_BENEFITS_UNRESOLVED/);assert.deepEqual(bad,original);
  }
  const numeric=structuredClone(x);numeric.compensation[0].value.amount=1000;assert.throws(()=>map(numeric),/AI_REGIONAL_BENEFITS_UNRESOLVED/);
});

test('places and references repeated in summaries need their own supporting evidence; unrelated metadata need not be repeated',()=>{
  const p=metadataCompletenessPolicy(c),x=decodeGroqExtraction(noticeWire(),c);
  for(const term of ['Fictional City','Gauteng','APP/TEST-042']) {
    x.summary=stated(invitation+' In '+term+'.',invitation);
    assert.throws(()=>assertSummaryMetadataEvidence(x,p),/AI_SUMMARY_EVIDENCE_UNRESOLVED/);
    const last=term==='APP/TEST-042'?noticeSpan(reference)[1]:noticeSpan('Job Location: Fictional City – Gauteng – South Africa')[1];
    x.summary.quote=(c.title+'\n'+c.sourceText).split('\n').slice(noticeSpan(invitation)[0]-1,last).join('\n');
    assert.doesNotThrow(()=>assertSummaryMetadataEvidence(x,p));
  }
  x.summary=stated(invitation);assert.doesNotThrow(()=>assertSummaryMetadataEvidence(x,p));
  x.summary=stated(invitation+' Fictional Cityscape.',invitation);assert.doesNotThrow(()=>assertSummaryMetadataEvidence(x,p));
});

test('unrecognised, conditional, unbounded, promotional, preparation and other-programme source forms abstain',()=>{
  for(const text of ['We do not invite unemployed youth to apply.','We may invite unemployed youth to apply.','Unemployed youth may be interested.',
    'What We Offer\nRetirement benefits\nMedical aid','What We Offer\nWe offer regional comprehensive benefits, including:\nRetirement benefits\nMedical aid\nAdditional perks',
    'What We Offer\nWe may offer regional comprehensive benefits, including:\nRetirement benefits\nMedical aid\nHow to apply',
    'What We Offer\nWe offer regional comprehensive benefits, including:\nRetirement benefits\nHousing\nHow to apply',
    'Documents to prepare\n'+invitation+'\n'+reference+'\nWhat We Offer\n'+regionalBenefits+'\nHow to apply']) {
    const p=metadataCompletenessPolicy(source(text));assert.deepEqual(p.audiences,[]);assert.deepEqual(p.regionalBenefits,[]);assert.deepEqual(p.references,[]);
  }
  const excluded={...c,programmeScope:{includedSpans:[[1,1]]}},p=metadataCompletenessPolicy(excluded);
  for(const key of ['references','audiences','regionalBenefits','qualitativePay','maximumDurations'])assert.deepEqual(p[key],[]);
});

test('canonical mapping also rejects metadata defects when a caller bypasses compact decoding',()=>{
  for(const[reason,change]of [
    ['AI_SOURCE_REFERENCE_UNRESOLVED',x=>{x.intake=absent();}],
    ['AI_AUDIENCE_UNRESOLVED',x=>{x.summary.value='An apprenticeship programme.';}],
    ['AI_REGIONAL_BENEFITS_UNRESOLVED',x=>{x.compensation=[];}],
    ['AI_SUMMARY_EVIDENCE_UNRESOLVED',x=>{x.summary.value+=' In Gauteng.';}]
  ]) {
    const x=decodeGroqExtraction(noticeWire(),c);change(x);const before=structuredClone(x);
    assert.throws(()=>map(x),e=>e.code===reason);assert.deepEqual(x,before);
  }
});

test('ordinary and split decoders reject each omission after one simulated call, preserving response and usage',async()=>{
  const env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_notice_metadata_key',SKILVED_AI_FALLBACK:'true'};
  for(const split of [false,true])for(const[reason,change]of [
    ['AI_SOURCE_REFERENCE_UNRESOLVED',x=>{x.intake=null;}],['AI_AUDIENCE_UNRESOLVED',x=>{x.summary.value='An apprenticeship programme.';}],
    ['AI_REGIONAL_BENEFITS_UNRESOLVED',x=>{x.compensation=[];}],['AI_SUMMARY_EVIDENCE_UNRESOLVED',x=>{x.summary.value+=' In Gauteng.';}]
  ]) {
    const wire=noticeWire();change(wire);const {requirements,...metadata}=wire,data=split?metadata:wire,before=structuredClone(data);let calls=0;
    await assert.rejects((split?extractMetadata:extractWithProvider)(c,{env,fetchImpl:async(_url,init)=>{
      calls++;const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);
      assert.deepEqual(input.metadataCompletenessPolicy,metadataCompletenessPolicy(c));
      return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
    }}),e=>e.code===reason&&e.usage.totalTokens===15);
    assert.equal(calls,1);assert.deepEqual(data,before);assert.throws(()=>decodeGroqMetadata(metadata,c),new RegExp(reason));
  }
});
