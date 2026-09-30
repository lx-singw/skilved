import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {parseRecentJobsDetail} from '../src/adapters/recentjobs.mjs';
import {decodeRequirementsV2 as decodeRequirements,extractRequirements,requirementsPayload,REQUIREMENTS_VERSION} from '../src/ai/requirements.mjs';
import {evaluateRequirements} from '../src/ai/evaluation.mjs';

const candidate = parseRecentJobsDetail({url:'https://recentjobs.co.za/2026/09/27/fictional-apprentice/',html:
  '<article class="type-post"><h1 class="entry-title">Fictional apprentice</h1><div class="entry-content">'+
  '<p>Requirements</p><p>Grade 12 with Science</p><p>Technical Mathematics is not accepted.</p>'+
  '<p>CV with results or certificates must be submitted.</p><p>Workshop experience is advantageous.</p>'+
  '<p>How to apply</p><p>Join our WhatsApp group</p><a href="https://employer.example/private-route">Apply now</a></div></article>'});
const wire = () => ({groups:[{relation:'all',items:[
  {kind:'education',level:'required',state:'stated',span:[3,3]},
  {kind:'education',level:'required',state:'stated',span:[4,4]},
  {kind:'document',level:'required',state:'stated',span:[5,5]},
  {kind:'experience',level:'preferred',state:'stated',span:[6,6]},
]}],unresolvedSpan:null});
const currentWire = () => ({coverage:Object.fromEntries(wire().groups[0].items.map(item=>[
  `L${item.span[0]}`,{...item,group:1,relation:'all'},
])),additional:[],unresolvedSpan:null});
const env = {SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_requirements_test_key'};
const response = value => Response.json({model:'openai/gpt-oss-120b',choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}],
  usage:{prompt_tokens:900,completion_tokens:400,total_tokens:1300}});

test('requirement stage sends the complete source with a small schema and no application destinations', async () => {
  let calls = 0;
  const result = await extractRequirements(candidate,{env,fetchImpl:async (_url,init) => {
    calls++; const request = JSON.parse(init.body), payload = JSON.parse(request.messages[1].content);
    assert.deepEqual(Object.keys(request.response_format.json_schema.schema.properties),['coverage','additional','unresolvedSpan']);
    assert.deepEqual(request.response_format.json_schema.schema.properties.coverage.required,['L3','L4','L5','L6']);
    assert.equal(request.response_format.json_schema.name,REQUIREMENTS_VERSION);
    assert.equal(request.max_completion_tokens,3072); assert.equal(request.reasoning_effort,'low');
    assert.match(payload.sourceLines,/Technical Mathematics is not accepted/);
    assert.match(payload.sourceLines,/Join our WhatsApp/); assert.deepEqual(payload.excludedPromotionalLineNumbers,[8]);
    assert.doesNotMatch(JSON.stringify(payload),/private-route|applicationCandidates/);
    return response(currentWire());
  }});
  assert.equal(calls,1); assert.equal(result.requirements.items.length,4);
  assert.equal(result.requirements.items[2].fact.value.description,'CV with results or certificates must be submitted.');
  assert.equal(result.requirements.items[1].fact.state,'stated'); assert.equal(result.requirements.items[3].level,'preferred');
  assert.equal(result.provenance.usage.totalTokens,1300); assert.equal('record' in result,false);
});
test('requirement stage rejects duplicate spans and retains usage without retry', async () => {
  const data = currentWire(); data.additional.push({...data.coverage.L5});
  let calls = 0;
  await assert.rejects(extractRequirements(candidate,{env,fetchImpl:async () => {calls++;return response(data);}}),
    error => error.code === 'AI_DUPLICATE_REQUIREMENT_PASSAGE' && error.usage.totalTokens === 1300);
  assert.equal(calls,1);
});
test('requirement stage keeps coverage, promotion and bounded logic checks', () => {
  const missing = wire(); missing.groups[0].items.splice(1,1);
  assert.throws(() => decodeRequirements(missing,candidate),/AI_REQUIREMENT_COVERAGE/);
  const promo = wire(); promo.groups[0].items.push({kind:'other',level:'required',state:'stated',span:[8,8]});
  assert.throws(() => decodeRequirements(promo,candidate),/AI_PROMOTIONAL_CONTENT/);
  for (const expression of ['all(r1,r2,r3,missing)','all(r1,r2,r3,r4);fetch(1)'])
    assert.throws(() => decodeRequirements({...wire(),expression},candidate),/AI_INVALID_EXTRACTION/);
  assert.throws(() => decodeRequirements({...wire(),publish:true},candidate),/AI_INVALID_EXTRACTION/);
});
test('requirement experiment cannot silently turn ambiguity or exclusions into a passing expectation', () => {
  const data = wire(), decoded = decodeRequirements(data,candidate);
  const expected = {requirements:decoded.items.map(item => ({id:item.id,passage:item.fact.quote,level:item.level})),expression:decoded.expression};
  assert.equal(evaluateRequirements(candidate,decoded,expected).matched,true);
  data.groups[0].items[1].state = 'ambiguous'; data.groups[0].items[2].level = 'preferred';
  const result = evaluateRequirements(candidate,decodeRequirements(data,candidate),expected);
  assert.equal(result.matched,false);
  assert.deepEqual(result.issues.filter(i => i.code === 'REQUIREMENT_MISSING_OR_LEVEL_WRONG').map(i => i.requirement),['r_4_4','r_5_5']);
});

test('code assigns stable ids, constructs ANY branches and retains every preferred item reference', () => {
  const items = wire().groups[0].items;
  const grouped = {groups:[{relation:'any',items:items.slice(0,2)},{relation:'all',items:items.slice(2)}],unresolvedSpan:null};
  const decoded = decodeRequirements(grouped,candidate);
  assert.deepEqual(decoded.items.map(item=>item.id),['r_3_3','r_4_4','r_5_5','r_6_6']);
  assert.deepEqual(decoded.expression,{op:'all',children:[{op:'any',children:[{op:'ref',id:'r_3_3'},{op:'ref',id:'r_4_4'}]},
    {op:'ref',id:'r_5_5'},{op:'ref',id:'r_6_6'}]});
  grouped.groups.reverse();
  assert.deepEqual(decodeRequirements(grouped,candidate).items.map(item=>item.id).sort(),decoded.items.map(item=>item.id).sort());
});

test('group compiler refuses model ids, overlaps, mixed-level alternatives and contradictory unresolved output', () => {
  const identified = wire(); identified.groups[0].items[0].id = 'model_id';
  assert.throws(()=>decodeRequirements(identified,candidate),/AI_INVALID_EXTRACTION/);
  const overlap = wire(); overlap.groups[0].items[0].span = [3,4];
  assert.throws(()=>decodeRequirements(overlap,candidate),/AI_OVERLAPPING_REQUIREMENT_PASSAGE/);
  const mixed = wire(); mixed.groups[0].relation = 'any';
  assert.throws(()=>decodeRequirements(mixed,candidate),/AI_MIXED_REQUIREMENT_LEVELS/);
  assert.throws(()=>decodeRequirements({...wire(),unresolvedSpan:[3,6]},candidate),/AI_INVALID_EXTRACTION/);
  assert.throws(()=>decodeRequirements({groups:[],unresolvedSpan:null},candidate),/AI_INVALID_EXTRACTION/);
  const unresolved = decodeRequirements({groups:[],unresolvedSpan:[3,6]},candidate);
  assert.equal(unresolved.items.length,0); assert.equal(unresolved.expression.op,'unknown');
});
test('disabled requirement experiment never calls the provider; oversized source is bounded', async () => {
  await assert.rejects(extractRequirements(candidate,{env:{},fetchImpl:() => assert.fail('request attempted')}),/AI_DISABLED/);
  assert.throws(() => requirementsPayload({...candidate,sourceText:'x'.repeat(96001)}),/AI_INPUT_LIMIT/);
  const result = spawnSync(process.execPath,['tools/extract-recentjobs.mjs','--requirements','nonexistent.json'],
    {cwd:new URL('..',import.meta.url),env:{},encoding:'utf8',timeout:10000});
  assert.equal(result.status,1); assert.equal(JSON.parse(result.stderr).error,'AI_DISABLED');
  const help = spawnSync(process.execPath,['tools/extract-recentjobs.mjs','--help'],
    {cwd:new URL('..',import.meta.url),env:{},encoding:'utf8',timeout:10000});
  assert.equal(help.status,0); assert.match(help.stdout,/experimental requirements-only/);
});
