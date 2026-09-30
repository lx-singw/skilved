import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateSourceAudit,evaluateSourceAudit} from '../src/ai/source-audit.mjs';
import {evaluateRequirements} from '../src/ai/evaluation.mjs';
import {decodeGroqRequirements} from '../src/ai/groq-schema.mjs';

const candidate={title:'Fictional apprenticeship',sourceText:[
  'Requirements','Grade 12 with Mathematics','Key Skills','Ability to read plans',
  'Education','Grade 12 / National Certificate','Duties','Repair machines','Join our WhatsApp group','How to apply',
].join('\n')};
const entry=(id,span,treatment,extra={})=>({id,span,treatment,reason:'Synthetic review decision.',...extra});
const audit=()=>({version:1,reviewer:'agent',reviewedAt:'2026-09-28T12:00:00Z',entries:[
  entry('title',[1,2],'context'),entry('qualification',[3,3],'preserve',{kind:'education',level:'required'}),
  entry('skills_heading',[4,4],'context'),entry('skills',[5,5],'preserve',{kind:'other',level:'unclear'}),
  entry('education_heading',[6,6],'context'),entry('table_education',[7,7],'unresolved'),
  entry('duties_heading',[8,8],'context'),entry('excluded',[9,10],'exclude'),entry('application',[11,11],'context'),
]});
const condition=(id,line,kind='education',level='required')=>({id,span:[line,line],kind,level,state:'stated'});
const extraction=(items=[condition('r1',3)])=>decodeGroqRequirements({items,expression:items.length===1?items[0].id:`all(${items.map(i=>i.id).join(',')})`},candidate);
const wanted=()=>({requirements:[{id:'qualification',passage:'Grade 12 with Mathematics',level:'required'}],expression:{op:'ref',id:'qualification'}});

test('targeted match no longer hides omitted skills and an unresolved secondary table',()=>{
  assert.equal(evaluateRequirements(candidate,extraction(),wanted()).matched,true);
  const result=evaluateRequirements(candidate,extraction(),{...wanted(),sourceAudit:audit()});
  assert.equal(result.targetedMatched,true);assert.equal(result.matched,false);
  assert.deepEqual(result.sourceAudit.issues.map(i=>[i.code,i.entry]),[
    ['SOURCE_AUDIT_PASSAGE_MISSING','skills'],['SOURCE_AUDIT_REVIEW_REQUIRED','table_education'],['SOURCE_AUDIT_PASSAGE_MISSING','table_education'],
  ]);
});

test('source inventories must cover every line exactly once with valid, distinct entries',()=>{
  assert.equal(validateSourceAudit(candidate,audit()).entries.length,9);
  const missing=audit();missing.entries.splice(3,1);
  assert.throws(()=>validateSourceAudit(candidate,missing),/EVALUATION_AUDIT_INCOMPLETE/);
  const overlap=audit();overlap.entries[0].span=[1,3];
  assert.throws(()=>validateSourceAudit(candidate,overlap),/EVALUATION_AUDIT_OVERLAP/);
  for(const mutate of [a=>a.entries[0].span=[2,1],a=>a.entries[0].span=[1,99],a=>a.entries[0].id='skills',a=>a.entries[0].kind='education']) {
    const bad=audit();mutate(bad);assert.throws(()=>validateSourceAudit(candidate,bad),/EVALUATION_AUDIT_INVALID/);
  }
});

test('exclusion ranges catch an individual duty or promotional line, not just an entire block',()=>{
  for(const line of [9,10]) {
    const result=evaluateSourceAudit(candidate,extraction([condition('r1',3),condition('r2',line,'other')]),audit());
    assert.ok(result.issues.some(i=>i.code==='SOURCE_AUDIT_EXCLUDED_CONTENT'&&i.entry==='excluded'));
  }
});

test('preserving an unresolved table does not silently choose its relationship to the main requirements',()=>{
  const result=evaluateSourceAudit(candidate,extraction([condition('r1',3),condition('r2',5,'other','unclear'),condition('r3',7)]),audit());
  assert.deepEqual(result.issues.map(i=>i.code),['SOURCE_AUDIT_REVIEW_REQUIRED']);
  const resolved=audit();resolved.entries.find(i=>i.id==='table_education').treatment='context';
  assert.equal(evaluateSourceAudit(candidate,extraction([condition('r1',3),condition('r2',5,'other','unclear')]),resolved).matched,true);
});

test('kind and level checks detect document misclassification and invented mandatory eligibility',()=>{
  const wrong=extraction([condition('r1',3,'document'),condition('r2',5,'other','required')]);
  const result=evaluateSourceAudit(candidate,wrong,audit());
  assert.ok(result.issues.some(i=>i.code==='SOURCE_AUDIT_KIND_MISMATCH'));
  assert.ok(result.issues.some(i=>i.code==='SOURCE_AUDIT_LEVEL_MISMATCH'));
  const target=evaluateRequirements(candidate,wrong,{...wanted(),requirements:wanted().requirements.map(i=>({...i,kind:'education'}))});
  assert.ok(target.issues.some(i=>i.code==='REQUIREMENT_KIND_MISMATCH'));
});

test('an unknown expression retains evidence without passing a stated requirement check',()=>{
  const unknown=decodeGroqRequirements({items:[],expression:'unknown(3,7)'},candidate);
  const result=evaluateSourceAudit(candidate,unknown,audit());
  assert.equal(result.issues.filter(i=>i.code==='SOURCE_AUDIT_REQUIREMENT_UNCERTAIN').length,2);
  assert.equal(result.issues.some(i=>i.code==='SOURCE_AUDIT_PASSAGE_MISSING'),false);
  assert.equal(result.matched,false);
});
