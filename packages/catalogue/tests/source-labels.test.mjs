import {test} from 'node:test';import assert from 'node:assert/strict';
import {requirementSourcePolicy} from '../src/ai/requirement-source-policy.mjs';
import {attendanceEvidencePolicy} from '../src/ai/attendance-evidence-hints.mjs';
import {assertLocationEvidence,locationEvidenceHints} from '../src/ai/location-evidence.mjs';
import {decodeGroqExtraction,groqExtractionPayload} from '../src/ai/groq-schema.mjs';
import {mapExtraction} from '../src/ai/extraction.mjs';import {extractWithProvider} from '../src/ai/provider.mjs';
import {labelCandidate as c,labelWire,labelLines,labelSpan,preferredLabelEducation} from './fixtures/source-labels.mjs';
const map=x=>mapExtraction(c,x,{sourceId:'authored_labels',now:'2026-09-26T10:00:00.000Z'});

test('bounded Skills Required supplies cumulative competencies and What We Offer ends preference hints',()=>{
  const p=requirementSourcePolicy(c),required=labelLines.slice(6,8).map(s=>labelSpan(s)[0]),preferred=labelLines.slice(9,12).map(s=>labelSpan(s)[0]);
  assert.deepEqual(p.requiredLineNumbers,[...required,...preferred]);
  assert.deepEqual(p.lineHints.filter(h=>h.level==='required').map(({line,kind,unconditional})=>({line,kind,unconditional})),required.map(line=>({line,kind:'other',unconditional:true})));
  assert.ok(p.lineHints.filter(h=>h.level==='preferred').every(h=>preferred.includes(h.line)));
  for(const text of [labelLines[4],...labelLines.slice(12,15)])assert.equal(p.requiredLineNumbers.includes(labelSpan(text)[0]),false);
  const record=map(decodeGroqExtraction(labelWire(),c)).record;assert.equal(record.requirements.requirements.length,3);
  assert.equal(record.requirements.requirements[2].level,'preferred');assert.equal(record.requirements.requirements[2].fact.originalText,preferredLabelEducation);
  assert.equal(record.compensation.length,2);assert.equal(record.publication.approved,false);
});

test('missing, optional, misclassified or alternative required skills fail before a draft can be accepted',()=>{
  for(const [scenario,mutate,error]of [
    ['missing',x=>{x.requirements.items.shift();x.requirements.expression.children.shift();},'AI_REQUIREMENT_COVERAGE'],
    ['optional',x=>{x.requirements.items[0].level='preferred';},'AI_REQUIREMENT_LEVEL_UNRESOLVED'],
    ['wrong_kind',x=>{x.requirements.items[0].kind='education';},'AI_REQUIREMENT_KIND_UNRESOLVED'],
    ['alternative',x=>{x.requirements.expression.op='any';},'AI_REQUIREMENT_CONJUNCTION_UNRESOLVED']]) {
    const x=decodeGroqExtraction(labelWire(),c);mutate(x);assert.throws(()=>map(x),e=>e.code===error,scenario);
  }
});

test('working-mode hints retain their full labelled evidence and never widen an incomplete returned span',()=>{
  const policy=attendanceEvidencePolicy(c);assert.equal(policy.version,'source_attendance_labels_v2');assert.equal(policy.status,'supported');assert.equal(policy.supportedValue,'in_person');
  assert.deepEqual(policy.labels,[{span:labelSpan(labelLines[2]),originalText:labelLines[2]}]);
  assert.deepEqual(locationEvidenceHints(c),[{field:'attendance',span:labelSpan(labelLines[2]),value:'in_person'}]);
  const good=decodeGroqExtraction(labelWire(),c).location;assert.doesNotThrow(()=>assertLocationEvidence(good));
  const bad=labelWire();bad.location.span=labelSpan(labelLines[1]);const before=structuredClone(bad);
  assert.throws(()=>decodeGroqExtraction(bad,c),e=>e.code==='AI_LOCATION_EVIDENCE_UNRESOLVED');assert.deepEqual(bad,before);
});

test('new mode labels still reject negation, alternatives, conflicting labels and duties',()=>{
  for(const text of ['Working Mode: not fully on-site','Working Mode: Fully On-Site or Remote','Working Mode: Fully On-Site\nWork mode: hybrid','Working Mode: Fully On-Site\nAttendance: not remote']) {
    const source={title:'Authored',sourceText:text};assert.equal(attendanceEvidencePolicy(source).status,'unresolved');assert.deepEqual(locationEvidenceHints(source),[]);
    assert.throws(()=>assertLocationEvidence({state:'stated',quote:text,value:{places:[],coverage:'not_stated',attendance:'in_person',relocation:null}}),e=>e.code==='AI_LOCATION_EVIDENCE_UNRESOLVED');
  }
  for(const text of ['Repair fully on-site machinery','Location: Fictional Workshop','Working mode may be fully on-site'])assert.equal(attendanceEvidencePolicy({title:'Authored',sourceText:text}).status,'no_label');
  const excluded={...c,programmeScope:{includedSpans:[[1,3]]}};assert.equal(attendanceEvidencePolicy(excluded).status,'no_label');
});

test('unbounded or conditional skill headings abstain and do not turn duties into required competencies',()=>{
  for(const sourceText of ['Skills Required\nTechnical aptitude','Skills Required if appointed\nTechnical aptitude\nWhat We Offer','Duties\nSkills required include workshop practice\nWhat We Offer'])
    assert.deepEqual(requirementSourcePolicy({title:'Authored',sourceText}).requiredLineNumbers,[]);
});

test('provider payload carries scoped skill and attendance hints while keeping original evidence unchanged',async()=>{
  const before=structuredClone(c),raw=labelWire();let calls=0;
  const result=await extractWithProvider(c,{env:{SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_labels_key'},fetchImpl:async(_url,init)=>{
    calls++;const body=JSON.parse(init.body),input=JSON.parse(body.contents[0].parts[0].text);
    assert.deepEqual(input,groqExtractionPayload(c));assert.equal(input.attendanceEvidencePolicy.supportedValue,'in_person');
    assert.equal(input.requirementSourcePolicy.lineHints.filter(h=>h.level==='required').length,2);
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(raw)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});
  }});
  assert.equal(calls,1);assert.equal(result.provenance.extractionVersion,'recentjobs_extraction_v27_groq_v7');map(result.extraction);assert.deepEqual(c,before);
});

test('explicit qualification and subject labels retain the slash wording and attached exclusion in one preferred passage',()=>{
  const p=requirementSourcePolicy(c);assert.deepEqual(p.completeRequirementSpans,[{span:labelSpan(preferredLabelEducation),kind:'education'}]);
  const raw=labelWire(),before=structuredClone(raw),record=map(decodeGroqExtraction(raw,c)).record;
  assert.equal(record.requirements.requirements[2].fact.originalText,preferredLabelEducation);assert.equal(record.requirements.requirements[2].level,'preferred');assert.deepEqual(raw,before);
});

test('split or overlapping labelled qualification subjects fail even under ALL without rewriting their evidence',()=>{
  for(const overlap of [false,true]){
    const raw=labelWire(),q=raw.requirements.items.pop();
    raw.requirements.items.push(...(overlap?[q,{...q,id:'english',kind:'subjects',span:labelSpan('English')}]:preferredLabelEducation.split('\n').map((text,index)=>({...q,id:'split'+index,kind:index?'subjects':'education',span:labelSpan(text)}))));
    raw.requirements.expression='all('+raw.requirements.items.map(i=>i.id).join(',')+')';const before=structuredClone(raw);
    assert.throws(()=>map(decodeGroqExtraction(raw,c)),e=>e.code==='AI_REQUIREMENT_GROUP_UNRESOLVED');assert.deepEqual(raw,before);
  }
});

test('labelled qualification grouping abstains on unbounded, conditional, repeated or unfamiliar lists',()=>{
  for(const text of [
    'Preferred Qualifications\n'+preferredLabelEducation,
    'Preferred Qualifications\nN2/Matric: Subjects:\nMathematics\nWhat We Offer',
    'Preferred Qualifications\nN2/Matric: Subjects:\nMathematics\n\nEnglish\nWhat We Offer',
    'Preferred Qualifications\nN2/Matric: Subjects:\nMathematics\nMathematics (Maths Literacy will not apply)\nEnglish\nWhat We Offer',
    'Preferred Qualifications\nN2/Matric: Subjects:\nMathematics\nTechnical drawing\nEnglish\nWhat We Offer',
    'Preferred Qualifications\nN2/Matric if applicable: Subjects:\nMathematics\nEnglish\nWhat We Offer',
    'Preferred Qualifications\nOne of the following:\n'+preferredLabelEducation+'\nWhat We Offer',
    'Preferred Qualifications\n'+preferredLabelEducation+'\nWhat We Offer\nEnglish',
    'Required documents\n'+preferredLabelEducation+'\nWhat We Offer',
  ])assert.deepEqual(requirementSourcePolicy({title:'Authored',sourceText:text}).completeRequirementSpans,[],text);
});
