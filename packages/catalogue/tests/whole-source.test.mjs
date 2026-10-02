import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeRequirementsV9 as decodeRequirements,requirementsPayload,requirementsSchemaV9 as requirementsSchema,
  decodeRequirementsV10 as decodePassages,extractRequirements} from '../src/ai/requirements.mjs';
import {evaluateSourceAudit} from '../src/ai/source-audit.mjs';
import {assertMaterialFacts} from '../src/worker-policy.mjs';

const candidate={title:'Fictional apprenticeship',sourceText:'Job description\nMust not study full time\nBehavioral\nIntegrity\nPreparation for next intake\nPrevious intake required N3; current eligibility is unconfirmed\nApplicants must submit certified results\nKey Skills\nRead technical plans\nHow to apply\nJoin our WhatsApp group\nApply now',applicationCandidates:[]};
const wire=()=>({lineRoles:['context','context','condition','context','condition','context','unresolved','condition','context','condition','context','promotion','context'],
  groups:[{relation:'all',items:[{span:[3,3],kind:'availability',level:'required'},
    {span:[5,5],kind:'other',level:'unclear'},{span:[8,8],kind:'document',level:'required'},
    {span:[10,10],kind:'other',level:'unclear'}]}],unresolvedSpans:[[7,7]]});
const passageWire=()=>{
  const {lineRoles,...data}=wire();
  return {...data,passages:lineRoles.map((role,index)=>({span:[index+1,index+1],role}))};
};

test('whole-source contract retains off-heading restrictions/documents and local uncertainty beside clear conditions',()=>{
  const schema=requirementsSchema(candidate),payload=requirementsPayload(candidate),result=decodeRequirements(wire(),candidate);
  assert.equal(schema.properties.lineRoles.minItems,13);assert.equal(schema.properties.lineRoles.maxItems,13);
  assert.equal(payload.lineCount,13);assert.doesNotMatch(JSON.stringify(payload),/applicationCandidates|destination/);
  assert.equal(result.items.length,4);assert.ok(result.items.every(item=>item.fact.state==='stated'));
  assert.equal(result.items.find(item=>item.id==='r_5_5').level,'unclear');
  assert.equal(result.expression.children.find(node=>node.op==='unknown').originalText,'Previous intake required N3; current eligibility is unconfirmed');
});

test('short/long role arrays, missing conditions, missing unknown passages and overlapping spans reject',()=>{
  for(const mutate of [data=>data.lineRoles.pop(),data=>data.lineRoles.push('context'),
    data=>data.groups[0].items.splice(0,1),data=>data.unresolvedSpans=[],
    data=>data.groups[0].items.push({...data.groups[0].items[0]})]) {
    const data=wire();mutate(data);assert.throws(()=>decodeRequirements(data,candidate),/AI_/);
  }
});

test('conditions cannot cite context/duties/promotions and known evidence cannot disappear into context',()=>{
  for(const mutate of [data=>data.groups[0].items[0].span=[2,3],data=>data.unresolvedSpans=[[6,7]],
    data=>{data.lineRoles[11]='context';},data=>{data.lineRoles[9]='context';data.groups[0].items.pop();}]) {
    const data=wire();mutate(data);assert.throws(()=>decodeRequirements(data,candidate),/AI_/);
  }
});

test('known complete alternatives remain ANY with complete nested subjects',()=>{
  const input={...candidate,sourceText:'Requirements\nOne of the following:\nGrade 12 with Mathematics\nN3 with:\nMathematics\nEngineering Science\nMain responsibilities\nMaintain machines'};
  const data={lineRoles:['context','context','context','condition','condition','condition','condition','context','duties'],
    groups:[{relation:'any',items:[{kind:'education',level:'required',span:[4,4]},{kind:'education',level:'required',span:[5,7]}]}],unresolvedSpans:[]};
  const result=decodeRequirements(data,input);assert.equal(result.expression.op,'any');assert.equal(result.items[1].fact.quote,'N3 with:\nMathematics\nEngineering Science');
  data.groups[0].relation='all';assert.throws(()=>decodeRequirements(data,input),/AI_ALTERNATIVE_REQUIREMENT_SPAN/);
  data.groups[0].relation='any';data.groups[0].items[1].level='preferred';assert.throws(()=>decodeRequirements(data,input),/AI_MIXED_REQUIREMENT_LEVELS/);
});

test('audience and secondary uncertainty stays unknown while exact skills remain stated',()=>{
  const input={...candidate,sourceText:'Workshop invites unemployed youth to apply.\nKey Skills\nRead plans\nHow to apply'};
  const data={lineRoles:['context','unresolved','context','condition','context'],groups:[{relation:'all',items:[{kind:'other',level:'unclear',span:[4,4]}]}],unresolvedSpans:[[2,2]]};
  const result=decodeRequirements(data,input);assert.equal(result.items[0].fact.state,'stated');
  assert.ok(result.expression.children.some(node=>node.op==='unknown'));
  data.lineRoles[1]='condition';data.unresolvedSpans=[];data.groups[0].items.push({kind:'other',level:'unclear',span:[2,2]});
  assert.throws(()=>decodeRequirements(data,input),/AI_INVALID_EXTRACTION/);
});

test('unknown evidence blocks publication even alongside otherwise resolved conditions',()=>{
  const result=decodeRequirements(wire(),candidate),stated={state:'stated'};
  const record={category:'apprenticeship',...Object.fromEntries(['title','issuer','summary','intake','location','residence','experience','deadline','practicalConditions','applicationRoute'].map(key=>[key,stated])),organisations:[],compensation:[],requirements:{requirements:result.items,expression:result.expression}};
  assert.throws(()=>assertMaterialFacts(record),/MATERIAL_FACTS_UNRESOLVED/);
});

test('complete bookkeeping is not semantic proof: independent inventory detects a condition mislabeled context',()=>{
  const data=wire();data.lineRoles[2]='context';data.groups[0].items.shift();const result=decodeRequirements(data,candidate);
  const audit={version:1,reviewer:'agent',reviewedAt:'2026-10-02T12:00:00.000Z',entries:[
    {id:'before',span:[1,2],treatment:'context',reason:'Title and heading.'},
    {id:'restriction',span:[3,3],treatment:'preserve',kind:'availability',level:'required',reason:'Explicit negative restriction.'},
    {id:'after',span:[4,13],treatment:'context',reason:'Other evidence assessed separately for this assertion.'}]};
  assert.ok(evaluateSourceAudit(candidate,result,audit).issues.some(issue=>issue.code==='SOURCE_AUDIT_PASSAGE_MISSING'));
});

test('long notices fail before model spending, while a complete response uses one bounded call',async()=>{
  let calls=0;const env={SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_whole_source_test_key'};
  await assert.rejects(extractRequirements({...candidate,sourceText:Array(160).fill('line').join('\n')},{env,fetchImpl:async()=>{calls++;}}),/AI_INPUT_LIMIT/);
  assert.equal(calls,0);
  const attached={passages:wire().lineRoles.map((role,index)=>({span:[index+1,index+1],role,
    condition:role==='condition'?{...wire().groups[0].items.find(item=>item.span[0]===index+1),span:undefined,group:1,relation:'all'}:null}))};
  const result=await extractRequirements(candidate,{env,fetchImpl:async()=>{calls++;return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(attached)}}]});}});
  assert.equal(calls,1);assert.equal(result.requirements.items.length,4);
});

test('passage partition and positional replay compile identical conditions and local unknown evidence',()=>{
  assert.deepEqual(decodePassages(passageWire(),candidate),decodeRequirements(wire(),candidate));
  const data=passageWire();data.passages.splice(0,2,{span:[1,2],role:'context'});
  assert.deepEqual(decodePassages(data,candidate),decodeRequirements(wire(),candidate));
});

test('passage gaps, duplicates, reordered ranges, missing tail and out-of-source ranges reject',()=>{
  for(const mutate of [data=>data.passages.splice(1,1),data=>data.passages[1].span=[1,2],
    data=>data.passages.reverse(),data=>data.passages.pop(),data=>data.passages[12].span=[13,14]]) {
    const data=passageWire();mutate(data);assert.throws(()=>decodePassages(data,candidate),/AI_SOURCE_PARTITION_/);
  }
});

test('a complete partition cannot conceal a marked condition, invent resolved advice or capture promotion as evidence',()=>{
  for(const mutate of [data=>data.groups[0].items.shift(),data=>data.unresolvedSpans=[],
    data=>data.groups[0].items[0].span=[2,3],data=>data.unresolvedSpans=[[7,12]]]) {
    const data=passageWire();mutate(data);assert.throws(()=>decodePassages(data,candidate),/AI_/);
  }
});
