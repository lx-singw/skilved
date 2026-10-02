import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeRequirementsV8 as decodeRequirements,decodeRequirementsV7,requirementsSchemaV8 as requirementsSchema,requirementsPayloadV8 as requirementsPayload} from '../src/ai/requirements.mjs';
import {assertMaterialFacts} from '../src/worker-policy.mjs';

const candidate={title:'Fictional apprenticeship',sourceText:'Workshop invites unemployed youth to apply.\nThe ideal candidate will have an interest in machinery.\nKey Skills\nRead technical plans\nPhysical stamina\nRequirements\nOne of the following:\nGrade 12 with Mathematics\nN3 with:\nMathematics\nEngineering Science\nMain responsibilities\nMaintain machinery',applicationCandidates:[]};
const condition=(span)=>({span,kind:'education',level:'required',state:'stated',group:1,relation:'any'});
const wire=()=>({evidence:{L2:{kind:'other',level:'unclear',state:'ambiguous'},L3:{kind:'other',level:'unclear',state:'stated'},
  L5:{kind:'other',level:'unclear',state:'stated'},L6:{kind:'other',level:'unclear',state:'stated'}},
  coverage:{L9:condition([9,9]),L10:condition([10,12])},additional:[],unresolvedSpan:null});

test('compact evidence restores exact passages alongside complete ANY qualifications',()=>{
  const schema=requirementsSchema(candidate),payload=requirementsPayload(candidate);
  assert.deepEqual(schema.properties.evidence.required,['L2','L3','L5','L6']);
  assert.deepEqual(Object.keys(schema.properties.evidence.properties.L2.properties),['kind','level','state']);
  assert.deepEqual(Object.keys(payload.coverageTasks),['L9','L10']);
  assert.deepEqual(Object.keys(payload.evidenceTasks),['L2','L3','L5','L6']);
  assert.equal(payload.evidenceTasks.L5.text,'Read technical plans');
  const decoded=decodeRequirements(wire(),candidate);
  assert.equal(decoded.items.length,6);
  assert.equal(decoded.items.find(item=>item.id==='r_10_12').fact.quote,'N3 with:\nMathematics\nEngineering Science');
  assert.equal(decoded.expression.op,'all');assert.equal(decoded.expression.children.find(child=>child.op==='any').children.length,2);
  assert.equal(decoded.items.find(item=>item.id==='r_2_2').fact.state,'ambiguous');
});

test('missing, null, promoted and resolved evidence still fails the compact contract',()=>{
  for(const mutate of [data=>delete data.evidence.L5,data=>data.evidence.L5=null,
    data=>data.evidence.L5.level='required',data=>data.evidence.L2.state='stated',
    data=>data.evidence.L5.span=[5,5],data=>data.evidence.L5.group=1]){
    const data=wire();mutate(data);assert.throws(()=>decodeRequirements(data,candidate),/AI_INVALID_EXTRACTION/);
  }
});

test('evidence cannot duplicate additional passages or join reserved alternatives',()=>{
  const data=wire();data.additional=[{...condition([5,5]),kind:'other',level:'unclear',group:2,relation:'all'}];
  assert.throws(()=>decodeRequirements(data,candidate),/AI_DUPLICATE_REQUIREMENT_PASSAGE/);
  const swallowed=wire();swallowed.coverage.L9.span=[5,9];
  assert.throws(()=>decodeRequirements(swallowed,candidate),/AI_ALTERNATIVE_REQUIREMENT_SPAN/);
});

test('unknown source logic covers every task and never creates a resolved expression',()=>{
  const data=wire();data.unresolvedSpan=[2,12];
  assert.equal(decodeRequirements(data,candidate).expression.op,'unknown');
  data.unresolvedSpan=[9,12];assert.throws(()=>decodeRequirements(data,candidate),/AI_REQUIREMENT_COVERAGE/);
  data.unresolvedSpan=[2,12];data.additional=[{...condition([14,14]),group:2,relation:'all'}];
  assert.throws(()=>decodeRequirements(data,candidate),/AI_INVALID_EXTRACTION/);
});

test('compact audience uncertainty remains blocked by the material-facts gate',()=>{
  const requirements=decodeRequirements(wire(),candidate),stated={state:'stated'};
  const record={category:'apprenticeship',...Object.fromEntries(['title','issuer','summary','intake','location','residence','experience','deadline','practicalConditions','applicationRoute'].map(key=>[key,stated])),
    organisations:[],compensation:[],requirements:{requirements:requirements.items,expression:requirements.expression}};
  assert.throws(()=>assertMaterialFacts(record),/MATERIAL_FACTS_UNRESOLVED/);
});

test('V7 replay and V8 compile the same retained requirements, without rewriting legacy output',()=>{
  const current=wire(),coverage={...current.coverage};
  for(const [key,item] of Object.entries(current.evidence)){const line=Number(key.slice(1));coverage[key]={...item,span:[line,line],group:2,relation:'all'};}
  const legacy={coverage,additional:[],unresolvedSpan:null},bytes=JSON.stringify(legacy);
  assert.deepEqual(decodeRequirements(current,candidate),decodeRequirementsV7(legacy,candidate));
  assert.equal(JSON.stringify(legacy),bytes);
});

test('V8 supplementary-only notices retain an explicit empty coverage object',()=>{
  const input={...candidate,sourceText:'Key Skills\nRead plans\nHow to apply'},data={evidence:{L3:{kind:'other',level:'unclear',state:'stated'}},coverage:{},additional:[],unresolvedSpan:null};
  assert.deepEqual(requirementsSchema(input).properties.coverage.properties,{});
  assert.equal(decodeRequirements(data,input).items[0].fact.quote,'Read plans');
});

test('availability and differing secondary education keep their source constraints in the smaller checklist',()=>{
  const input={...candidate,sourceText:'Requirements\nN3 Mechanical\nWilling to work overtime when required\nMain responsibilities\nMaintain machinery\nImportant details\nEducation\nGrade 12 / National Certificate\nClosing date\n31 October 2026'};
  const data={coverage:{L3:{...condition([3,3]),relation:'all'}},evidence:{L4:{kind:'availability',level:'required',state:'stated'},
    L9:{kind:'education',level:'unclear',state:'ambiguous'}},additional:[],unresolvedSpan:null};
  const decoded=decodeRequirements(data,input);
  assert.equal(decoded.items.find(item=>item.id==='r_4_4').kind,'availability');
  assert.equal(decoded.items.find(item=>item.id==='r_9_9').fact.quote,'Grade 12 / National Certificate');
  data.evidence.L9.state='stated';assert.throws(()=>decodeRequirements(data,input),/AI_INVALID_EXTRACTION/);
});
