import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requirementEvidence} from '../src/ai/requirement-evidence.mjs';
import {decodeRequirementsV7 as decodeRequirements,requirementsSchemaV7 as requirementsSchema,requirementsPayloadV7 as requirementsPayload} from '../src/ai/requirements.mjs';
import {assertMaterialFacts} from '../src/worker-policy.mjs';

const candidate=text=>({title:'Fictional apprenticeship',sourceText:text,applicationCandidates:[]});
const condition=(line,extra={})=>({span:[line,line],kind:'other',level:'unclear',state:'stated',group:1,relation:'all',...extra});
const input=candidate('Workshop invites unemployed youth to apply for an apprenticeship.\nThe ideal candidate will have an interest in construction.\nKey Skills:\nAbility to read plans\nPhysical stamina\nIf you are looking to start a career, join us.\nDesired Experience & Qualification\nMatric / N2\nHow to apply');
const wire=()=>({coverage:{L2:condition(2,{state:'ambiguous'}),L3:condition(3),L5:condition(5),L6:condition(6),
  L9:condition(9,{kind:'education',level:'required'})},additional:[],unresolvedSpan:null});

test('skills, applicant profile and audience are selected without absorbing a recruitment invitation',()=>{
  assert.deepEqual(requirementEvidence(input).requiredLineNumbers,[2,3,5,6,9]);
  assert.deepEqual(requirementsSchema(input).properties.coverage.required,['L2','L3','L5','L6','L9']);
  const result=decodeRequirements(wire(),input);
  assert.equal(result.items.length,5);assert.equal(result.items[0].fact.state,'ambiguous');
  assert.equal(result.items[0].fact.value,null);assert.match(result.items[0].fact.quote,/invites unemployed youth/);
  assert.equal(result.items.find(item=>item.id==='r_5_5').level,'unclear');
  assert.equal(result.items.some(item=>item.fact.quote.includes('If you are looking')),false);
});

test('missing evidence, invented mandatory skills, resolved audience and oversized evidence spans are rejected',()=>{
  const missing=wire();delete missing.coverage.L5;
  assert.throws(()=>decodeRequirements(missing,input),/AI_INVALID_EXTRACTION/);
  const mandatory=wire();mandatory.coverage.L5.level='required';
  assert.throws(()=>decodeRequirements(mandatory,input),/AI_INVALID_EXTRACTION/);
  const resolved=wire();resolved.coverage.L2.state='stated';
  assert.throws(()=>decodeRequirements(resolved,input),/AI_INVALID_EXTRACTION/);
  const wide=wire();wide.coverage.L5.span=[5,6];
  assert.throws(()=>decodeRequirements(wide,input),/AI_REQUIREMENT_EVIDENCE_SPAN/);
});

test('uncertain audience evidence cannot pass the material-facts publication check',()=>{
  const requirements=decodeRequirements(wire(),input),stated={state:'stated'};
  const record={category:'apprenticeship',...Object.fromEntries(['title','issuer','summary','intake','location','residence','experience','deadline','practicalConditions','applicationRoute'].map(key=>[key,stated])),
    organisations:[],compensation:[],requirements:{requirements:requirements.items,expression:requirements.expression}};
  assert.throws(()=>assertMaterialFacts(record),/MATERIAL_FACTS_UNRESOLVED/);
});

test('secondary education is preserved as ambiguous unless it repeats the main wording exactly',()=>{
  const secondary=candidate('Requirements\nN3 Mechanical\nWilling to work overtime when required\nMain responsibilities\nMaintain machinery\n📌 Important details\nEducation\nGrade 12 / National Certificate\nClosing date\n31 October 2026');
  const hints=requirementsPayload(secondary).evidenceHints;
  assert.deepEqual(hints.map(h=>[h.line,h.kind,h.level,h.state]),[[4,'availability',undefined,undefined],[9,'education','unclear','ambiguous']]);
  const data={coverage:{L3:condition(3,{kind:'education',level:'required'}),L4:condition(4,{kind:'availability',level:'required'}),
    L9:condition(9,{kind:'education',state:'ambiguous'})},additional:[],unresolvedSpan:null};
  assert.equal(decodeRequirements(data,secondary).items.at(-1).fact.quote,'Grade 12 / National Certificate');
  data.coverage.L9.state='stated';assert.throws(()=>decodeRequirements(data,secondary),/AI_INVALID_EXTRACTION/);
  assert.equal(requirementEvidence({...secondary,sourceText:secondary.sourceText.replace('Grade 12 / National Certificate','N3 Mechanical')}).evidenceHints.some(h=>h.line===9),false);
});

test('skills level markers are retained and unbounded lists do not include a footer',()=>{
  const required=candidate('Required skills\nRead plans\nPreferred:\nWelding knowledge\nHow to apply');
  assert.deepEqual(requirementEvidence(required).evidenceHints.map(h=>[h.line,h.level]),[[3,'required'],[5,'preferred']]);
  assert.deepEqual(requirementEvidence(candidate('Key Skills\nRead plans\nUnknown footer')).requiredLineNumbers,[]);
});

test('coverage cannot escape through null; genuinely unresolved logic still becomes an unknown expression',()=>{
  const data=wire();data.coverage.L5=null;
  assert.throws(()=>decodeRequirements(data,input),/AI_INVALID_EXTRACTION/);
  const unresolved=wire();unresolved.unresolvedSpan=[2,9];
  assert.throws(()=>decodeRequirements(unresolved,input),/AI_INVALID_EXTRACTION/);
  for(const item of Object.values(unresolved.coverage))item.state='ambiguous';
  const decoded=decodeRequirements(unresolved,input);
  assert.equal(decoded.expression.op,'unknown');assert.equal(decoded.items.length,0);
  unresolved.unresolvedSpan=[2,6];assert.throws(()=>decodeRequirements(unresolved,input),/AI_REQUIREMENT_COVERAGE/);
});
