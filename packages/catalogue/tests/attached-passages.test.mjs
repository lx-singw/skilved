import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeRequirements,requirementsSchema,requirementsPayload,extractRequirements} from '../src/ai/requirements.mjs';
import {evaluateSourceAudit} from '../src/ai/source-audit.mjs';
import {assertMaterialFacts} from '../src/worker-policy.mjs';

const candidate={title:'Fictional apprenticeship',sourceText:'Workshop invites unemployed youth to apply.\nKey Skills\nRead plans\nWork accurately\nHow to apply\nSubmit certified results\nJoin our WhatsApp group\nApply now',applicationCandidates:[]};
const context=(first,last=first,role='context')=>({span:[first,last],role,condition:null});
const condition=(first,last=first,kind='other',level='unclear',group=1,relation='all')=>
  ({span:[first,last],role:'condition',condition:{kind,level,group,relation}});
const wire=()=>({passages:[context(1),context(2,2,'unresolved'),context(3),condition(4),condition(5),
  context(6),condition(7,7,'document','required'),context(8,8,'promotion'),context(9)]});

test('one classified record derives the exact condition or unknown passage without a synchronized list',()=>{
  const data=wire(),result=decodeRequirements(data,candidate);
  assert.deepEqual(Object.keys(requirementsSchema(candidate).properties),['passages']);
  assert.deepEqual(result.items.map(item=>[item.id,item.fact.quote]),[
    ['r_4_4','Read plans'],['r_5_5','Work accurately'],['r_7_7','Submit certified results']]);
  assert.ok(result.items.every(item=>item.fact.state==='stated'));
  assert.equal(result.expression.children.find(node=>node.op==='unknown').originalText,candidate.sourceText.split('\n')[0]);
  assert.equal(requirementsPayload(candidate).fixedRoles.L2,'unresolved');
  assert.equal(requirementsPayload(candidate).fixedRoles.L8,'promotion');
  for(const extra of [{groups:[]},{unresolvedSpans:[]},{publish:true}])
    assert.throws(()=>decodeRequirements({...data,...extra},candidate),/AI_INVALID_EXTRACTION/);
});

test('condition metadata is mandatory only for condition roles and cannot carry independent spans or ids',()=>{
  for(const mutate of [data=>data.passages[3].condition=null,
    data=>data.passages[1].condition={...data.passages[3].condition},
    data=>data.passages[0].condition={...data.passages[3].condition},
    data=>delete data.passages[3].condition,
    data=>data.passages[3].condition.span=[4,5],
    data=>data.passages[3].condition.id='model_id',
    data=>data.passages[3].condition.state='stated']) {
    const data=wire();mutate(data);assert.throws(()=>decodeRequirements(data,candidate),/AI_/);
  }
});

test('attached partitions reject gaps, duplicates, reordering, reversed spans and missing tail',()=>{
  for(const mutate of [data=>data.passages.splice(1,1),data=>data.passages[1].span=[1,2],
    data=>data.passages.reverse(),data=>data.passages[3].span=[4,3],
    data=>data.passages.pop(),data=>data.passages[8].span=[9,10]]) {
    const data=wire();mutate(data);assert.throws(()=>decodeRequirements(data,candidate),/AI_SOURCE_PARTITION_/);
  }
});

test('exact hinted conditions cannot merge or change their kind/level; fixed unresolved and promotion roles hold',()=>{
  for(const mutate of [data=>data.passages.splice(3,2,condition(4,5)),
    data=>data.passages[3].condition.level='required',
    data=>data.passages[3]=context(4),
    data=>data.passages[1]=condition(2),data=>data.passages[7]=context(8)]) {
    const data=wire();mutate(data);assert.throws(()=>decodeRequirements(data,candidate),/AI_/);
  }
  const input={...candidate,sourceText:'Requirements\nWilling to work overtime\nHow to apply'};
  const data={passages:[context(1,2),condition(3,3,'availability','required'),context(4)]};
  assert.equal(decodeRequirements(data,input).items[0].kind,'availability');
  data.passages[1].condition.kind='experience';
  assert.throws(()=>decodeRequirements(data,input),/AI_INVALID_EXTRACTION/);
});

test('same group has one relation and alternatives preserve complete nested qualifications',()=>{
  const input={...candidate,sourceText:'Requirements\nOne of the following:\nGrade 12 with Mathematics\nN3 with:\nMathematics\nEngineering Science\nHow to apply'};
  const data={passages:[context(1,3),condition(4,4,'education','required',1,'any'),
    condition(5,7,'education','required',1,'any'),context(8)]};
  const result=decodeRequirements(data,input);
  assert.equal(result.expression.op,'any');assert.equal(result.items[1].fact.quote,'N3 with:\nMathematics\nEngineering Science');
  const conflict=structuredClone(data);conflict.passages[2].condition.relation='all';
  assert.throws(()=>decodeRequirements(conflict,input),/AI_REQUIREMENT_GROUP_CONFLICT/);
  for(const mutate of [data=>data.passages[2].condition.group=2,
    data=>data.passages.forEach(p=>{if(p.condition)p.condition.relation='all';}),
    data=>data.passages[2].condition.level='preferred',
    data=>data.passages.splice(2,1,condition(5,6,'education','required',1,'any'),condition(7,7,'subjects','required',1,'any'))]) {
    const changed=structuredClone(data);mutate(changed);assert.throws(()=>decodeRequirements(changed,input),/AI_/);
  }
  const unknown={passages:[context(1,3),context(4,7,'unresolved'),context(8)]};
  assert.equal(decodeRequirements(unknown,input).expression.op,'unknown');
});

test('a passage partition can still conceal an unhinted condition; the independent inventory rejects it',()=>{
  const input={...candidate,sourceText:'Job description\nMust not study full time\nApplicants must submit results'};
  const data={passages:[context(1,3),condition(4,4,'document','required')]};
  const result=decodeRequirements(data,input);
  const audit={version:1,reviewer:'agent',reviewedAt:'2026-10-03T12:00:00.000Z',entries:[
    {id:'heading',span:[1,2],treatment:'context',reason:'Title and heading.'},
    {id:'restriction',span:[3,3],treatment:'preserve',kind:'availability',level:'required',reason:'Explicit study restriction.'},
    {id:'document',span:[4,4],treatment:'preserve',kind:'document',level:'required',reason:'Required submission.'}]};
  assert.ok(evaluateSourceAudit(input,result,audit).issues.some(issue=>issue.code==='SOURCE_AUDIT_PASSAGE_MISSING'));
});

test('generated local unknown nodes still block publication while clear hinted skills stay stated',()=>{
  const decoded=decodeRequirements(wire(),candidate),stated={state:'stated'};
  const record={category:'apprenticeship',...Object.fromEntries(['title','issuer','summary','intake','location','residence','experience','deadline','practicalConditions','applicationRoute'].map(key=>[key,stated])),organisations:[],compensation:[],requirements:{requirements:decoded.items,expression:decoded.expression}};
  assert.throws(()=>assertMaterialFacts(record),/MATERIAL_FACTS_UNRESOLVED/);
});

test('group number, item and unknown expression limits cannot be bypassed through the partition',()=>{
  const invalid=wire();invalid.passages[3].condition.group=21;
  assert.throws(()=>decodeRequirements(invalid,candidate),/AI_INVALID_EXTRACTION/);
  const input={...candidate,sourceText:Array(41).fill('Explicit condition').join('\n')};
  const data={passages:[context(1),...Array.from({length:41},(_,index)=>condition(index+2,index+2,'other','required',index<25?1:2))]};
  assert.throws(()=>decodeRequirements(data,input),/AI_INPUT_LIMIT/);
  const unknown={passages:[context(1),...Array.from({length:41},(_,index)=>context(index+2,index+2,'unresolved'))]};
  assert.throws(()=>decodeRequirements(unknown,input),/AI_INVALID_EXTRACTION/);
});

test('source bounds fail before provider spending with no truncation or retry',async()=>{
  let calls=0;const options={env:{SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_attached_test_key'},fetchImpl:async()=>{calls++;}};
  for(const sourceText of [Array(160).fill('line').join('\n'),'x'.repeat(96000)])
    await assert.rejects(extractRequirements({...candidate,sourceText},options),/AI_INPUT_LIMIT/);
  assert.equal(calls,0);
});
