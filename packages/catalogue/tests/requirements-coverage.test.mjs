import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeRequirementsV3 as decodeRequirements,requirementsSchemaV3 as requirementsSchema,extractRequirements} from '../src/ai/requirements.mjs';

const candidate = {title:'Fictional apprenticeship',sourceText:[
  'Requirements','One of the following','Grade 12 with:', 'Mathematics and Science',
  'N3 with Engineering Science','CV and certificates are required.','Experience is advantageous.',
  'How to apply','Join our WhatsApp group','Must have a driving licence.',
].join('\n')};
const item = (span,kind='education',level='required',group=1,relation='any')=>({span,kind,level,group,relation,state:'stated'});
const wire = ()=>({coverage:{
  L4:item([4,5]),L5:item([4,5]),L6:item([6,6]),
  L7:item([7,7],'document','required',2,'all'),L8:item([8,8],'experience','preferred',2,'all'),
},additional:[item([11,11],'other','required',2,'all')],unresolvedSpan:null});

test('mandatory coverage fields preserve multi-line OR branches and conditions elsewhere in the notice',()=>{
  const schema=requirementsSchema(candidate);
  assert.deepEqual(schema.properties.coverage.required,['L4','L5','L6','L7','L8']);
  assert.equal(schema.properties.coverage.additionalProperties,false);
  const decoded=decodeRequirements(wire(),candidate);
  assert.deepEqual(decoded.items.map(i=>i.id),['r_4_5','r_6_6','r_7_7','r_8_8','r_11_11']);
  assert.equal(decoded.items[0].fact.quote,'Grade 12 with:\nMathematics and Science');
  assert.equal(decoded.items[3].level,'preferred');
  assert.deepEqual(decoded.expression,{op:'all',children:[
    {op:'any',children:[{op:'ref',id:'r_4_5'},{op:'ref',id:'r_6_6'}]},
    {op:'ref',id:'r_7_7'},{op:'ref',id:'r_8_8'},{op:'ref',id:'r_11_11'},
  ]});
});

test('missing, null or misdirected coverage cannot silently become an additional ALL condition',()=>{
  const missing=wire();delete missing.coverage.L6;
  assert.throws(()=>decodeRequirements(missing,candidate),/AI_INVALID_EXTRACTION/);
  const nulled=wire();nulled.coverage.L6=null;
  assert.throws(()=>decodeRequirements(nulled,candidate),/AI_REQUIREMENT_COVERAGE/);
  const redirected=wire();redirected.coverage.L6=item([4,5]);
  assert.throws(()=>decodeRequirements(redirected,candidate),/AI_REQUIREMENT_COVERAGE/);
  const added=wire();added.coverage.L99=item([6,6]);
  assert.throws(()=>decodeRequirements(added,candidate),/AI_INVALID_EXTRACTION/);
});

test('repeated span descriptors must agree and distinct spans cannot overlap',()=>{
  for (const changed of [{level:'preferred'},{group:2},{relation:'all'},{kind:'other'},{state:'ambiguous'}]) {
    const data=wire();Object.assign(data.coverage.L5,changed);
    assert.throws(()=>decodeRequirements(data,candidate),/AI_CONFLICTING_REQUIREMENT_PASSAGE/);
  }
  const overlap=wire();overlap.coverage.L6.span=[5,6];
  assert.throws(()=>decodeRequirements(overlap,candidate),/AI_OVERLAPPING_REQUIREMENT_PASSAGE/);
  const duplicate=wire();duplicate.additional.push(item([4,5]));
  assert.throws(()=>decodeRequirements(duplicate,candidate),/AI_DUPLICATE_REQUIREMENT_PASSAGE/);
  const conflict=wire();conflict.coverage.L6.relation='all';
  assert.throws(()=>decodeRequirements(conflict,candidate),/AI_CONFLICTING_REQUIREMENT_GROUP/);
  const mixed=wire();mixed.coverage.L6.level='preferred';
  assert.throws(()=>decodeRequirements(mixed,candidate),/AI_MIXED_REQUIREMENT_LEVELS/);
});

test('unresolved logic is explicit, must cover the section, and cannot coexist with resolved conditions',()=>{
  const unresolved={coverage:Object.fromEntries(Object.keys(wire().coverage).map(key=>[key,null])),additional:[],unresolvedSpan:[4,8]};
  const result=decodeRequirements(unresolved,candidate);
  assert.deepEqual(result.items,[]);assert.equal(result.expression.op,'unknown');
  assert.throws(()=>decodeRequirements({...unresolved,unresolvedSpan:[4,6]},candidate),/AI_REQUIREMENT_COVERAGE/);
  assert.throws(()=>decodeRequirements({...wire(),unresolvedSpan:[4,8]},candidate),/AI_INVALID_EXTRACTION/);
});

test('unbounded notices still use additional conditions and promotions remain rejected',()=>{
  const unbounded={title:'Fictional apprenticeship',sourceText:'Grade 12 or N3\nExperience is advantageous.'};
  const result=decodeRequirements({coverage:{},additional:[item([2,2]),item([3,3],'experience','preferred',2,'all')],unresolvedSpan:null},unbounded);
  assert.equal(result.items.length,2);assert.equal(result.items[0].fact.quote,'Grade 12 or N3');
  const promo=wire();promo.additional.push(item([10,10],'other','required',2,'all'));
  assert.throws(()=>decodeRequirements(promo,candidate),/AI_PROMOTIONAL_CONTENT/);
});

test('coverage and compiled item limits apply before any unbounded work',async()=>{
  const oversized={title:'Notice',applicationCandidates:[],sourceText:['Requirements',...Array.from({length:41},(_,i)=>`Condition ${i}`),'How to apply'].join('\n')};
  await assert.rejects(extractRequirements(oversized,{fetchImpl:()=>assert.fail('provider called')}),/AI_INPUT_LIMIT/);
});
