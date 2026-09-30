import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {parseRecentJobsDetail} from '../src/adapters/recentjobs.mjs';
import {syntheticExtraction} from './fixtures/recentjobs-model.mjs';
import {digest, evaluateExtraction} from '../src/ai/evaluation.mjs';
import {requirementsSchema, REQUIREMENTS_INSTRUCTION, REQUIREMENTS_V1_INSTRUCTION, REQUIREMENTS_V1_SCHEMA,
  REQUIREMENTS_V2_INSTRUCTION, REQUIREMENTS_V2_SCHEMA, requirementsSchemaV3, REQUIREMENTS_V3_INSTRUCTION,
  requirementsSchemaV4,requirementsInstructionV4,requirementsSchemaV5,requirementsInstructionV5,
  requirementsSchemaV6,requirementsInstructionV6} from '../src/ai/requirements.mjs';

const now = '2026-09-27T10:00:00.000Z';
const candidate = parseRecentJobsDetail({html:await readFile(new URL('./fixtures/recentjobs-synthetic.html', import.meta.url), 'utf8'),
  url:'https://recentjobs.co.za/2026/09/26/fictional-apprentice/'});
const expected = () => ({facts:[{path:'issuer.value',value:'Fictional Workshop'},{path:'deadline.value.localDate',value:'2026-10-30'}],
  application:{method:'portal',destination:'https://employer.example/apply'},
  requirements:[{id:'matric',passage:'Grade 12 with Mathematics',level:'required'}, {id:'n3',passage:'N3 Electrical',level:'required'}],
  expression:{op:'any',children:[{op:'ref',id:'matric'},{op:'ref',id:'n3'}]}});

test('offline expectations recognise equivalent reordered alternatives independently of model ids', () => {
  const extraction = syntheticExtraction(); extraction.requirements.expression.children.reverse();
  assert.deepEqual(evaluateExtraction(candidate, extraction, expected(), now), {matched:true,issues:[]});
  assert.deepEqual(evaluateExtraction(candidate, extraction, expected(), '2026-09-27T10:00:00Z'), {matched:true,issues:[]});
});
test('offline expectations expose changed ALL/ANY logic, omitted requirements and downgraded mandatory levels', () => {
  const extraction = syntheticExtraction(); extraction.requirements.expression.op = 'all';
  assert.ok(evaluateExtraction(candidate, extraction, expected(), now).issues.some(i => i.code === 'REQUIREMENT_LOGIC_MISMATCH'));
  extraction.requirements.items[0].level = 'preferred';
  assert.ok(evaluateExtraction(candidate, extraction, expected(), now).issues.some(i => i.requirement === 'matric'));
  extraction.requirements.items.pop(); extraction.requirements.expression = {op:'ref',id:'req_0'};
  assert.ok(evaluateExtraction(candidate, extraction, expected(), now).issues.some(i => i.requirement === 'n3'));
});
test('offline expectations compare the exact original destination, not only its host', () => {
  const wanted = expected(); wanted.application.destination += '?different-job';
  assert.ok(evaluateExtraction(candidate, syntheticExtraction(), wanted, now).issues.some(i => i.code === 'APPLICATION_MISMATCH'));
  wanted.facts[1].value = '2026-10-31';
  assert.ok(evaluateExtraction(candidate, syntheticExtraction(), wanted, now).issues.some(i => i.path === 'deadline.value.localDate'));
});
test('unsupported expectation passages and unknown requirement labels reject the evaluation', () => {
  const wanted = expected(); wanted.requirements[0].passage = 'invented qualification';
  assert.throws(() => evaluateExtraction(candidate, syntheticExtraction(), wanted, now), /EVALUATION_EXPECTATION_NOT_IN_SOURCE/);
  const other = expected(); other.expression.children[0].id = 'unknown';
  assert.throws(() => evaluateExtraction(candidate, syntheticExtraction(), other, now), /EVALUATION_EXPECTATION_INVALID/);
});
test('offline CLI distinguishes unrun cases and changed frozen inputs without credentials', async () => {
  const dir = await mkdtemp(join(tmpdir(),'skilved-eval-'));
  try {
    const bytes = JSON.stringify(candidate);
    await writeFile(join(dir,'candidate.json'), bytes);
    const manifest = {version:1,purpose:'development_regression',observedAt:now,cases:[{id:'synthetic',candidate:'candidate.json',
      candidateSha256:digest(bytes),response:null,expected:expected()}]};
    const file = join(dir,'manifest.json'); await writeFile(file, JSON.stringify(manifest));
    const run = () => spawnSync(process.execPath,['tools/evaluate-recentjobs.mjs',file],{cwd:new URL('..',import.meta.url),env:{},encoding:'utf8',timeout:10000});
    const first = run(); assert.equal(first.status,1);
    const report = JSON.parse(first.stdout); assert.equal(report.qualification,false); assert.equal(report.newModelCalls,0);
    assert.equal(report.counts.not_run,1);
    await writeFile(join(dir,'candidate.json'), bytes + ' ');
    const changed = JSON.parse(run().stdout); assert.equal(changed.cases[0].issues[0].code,'EVALUATION_SOURCE_CHANGED');
    assert.doesNotMatch(JSON.stringify(changed), /Fictional Workshop/);
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test('requirements replay preserves earlier versions and fingerprints the candidate-specific current schema',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'skilved-eval-versions-'));
  try {
    const input={...candidate,sourceText:'Requirements\nGrade 12 with Mathematics\nHow to apply'};
    const bytes=JSON.stringify(input),condition={kind:'education',level:'required',state:'stated',span:[3,3]};
    const wanted={...expected(),requirements:[{id:'matric',passage:'Grade 12 with Mathematics',level:'required'}],expression:{op:'ref',id:'matric'}};
    const variants=[
      ['v1',{items:[{...condition,id:'r1'}],expression:'r1'},REQUIREMENTS_V1_INSTRUCTION,REQUIREMENTS_V1_SCHEMA],
      ['v2',{groups:[{relation:'all',items:[condition]}],unresolvedSpan:null},REQUIREMENTS_V2_INSTRUCTION,REQUIREMENTS_V2_SCHEMA],
      ['v3',{coverage:{L3:{...condition,group:1,relation:'all'}},additional:[],unresolvedSpan:null},REQUIREMENTS_V3_INSTRUCTION,requirementsSchemaV3(input)],
      ['v4',{coverage:{L3:{...condition,group:1,relation:'all'}},additional:[],unresolvedSpan:null},requirementsInstructionV4(input),requirementsSchemaV4(input)],
      ['v5',{coverage:{L3:{...condition,group:1,relation:'all'}},additional:[],unresolvedSpan:null},requirementsInstructionV5(input),requirementsSchemaV5(input)],
      ['v6',{coverage:{L3:{...condition,group:1,relation:'all'}},additional:[],unresolvedSpan:null},requirementsInstructionV6(input),requirementsSchemaV6(input)],
      ['v7',{coverage:{L3:{...condition,group:1,relation:'all'}},additional:[],unresolvedSpan:null},REQUIREMENTS_INSTRUCTION,requirementsSchema(input)],
    ];
    await writeFile(join(dir,'candidate.json'),bytes);
    for(const [version,extraction] of variants) await writeFile(join(dir,version+'.json'),JSON.stringify({
      extraction,provenance:{extractionVersion:'recentjobs_requirements_'+version},
    }));
    await writeFile(join(dir,'manifest.json'),JSON.stringify({version:1,purpose:'development_regression',observedAt:now,
      cases:variants.map(([id])=>({id,candidate:'candidate.json',candidateSha256:digest(bytes),response:id+'.json',expected:wanted})),
    }));
    const run=spawnSync(process.execPath,['tools/evaluate-recentjobs.mjs','--requirements',join(dir,'manifest.json')],
      {cwd:new URL('..',import.meta.url),env:{},encoding:'utf8',timeout:10000});
    assert.equal(run.status,0,run.stderr);const report=JSON.parse(run.stdout);
    assert.equal(report.counts.matched,7);assert.equal(report.newModelCalls,0);
    assert.deepEqual(report.cases.map(c=>c.currentExtractionVersion),[false,false,false,false,false,false,true]);
    assert.deepEqual(report.cases.map(c=>c.promptSchemaHash),variants.map(([, ,instruction,schema])=>digest(JSON.stringify([instruction,schema]))));
  } finally {await rm(dir,{recursive:true,force:true});}
});

test('CLI reports a separate inventory mismatch and refuses a gapped inventory even before generation',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'skilved-eval-inventory-'));
  try {
    const input={...candidate,sourceText:'Qualifications\nGrade 12 with Mathematics\nKey Skills\nAbility to read plans\nHow to apply'};
    const bytes=JSON.stringify(input),requirements=[{id:'matric',passage:'Grade 12 with Mathematics',level:'required',kind:'education'}];
    const sourceAudit={version:1,reviewer:'agent',reviewedAt:now,entries:[
      {id:'context',span:[1,2],treatment:'context',reason:'Title and heading.'},
      {id:'matric',span:[3,3],treatment:'preserve',kind:'education',level:'required',reason:'Explicit education requirement.'},
      {id:'skills_header',span:[4,4],treatment:'context',reason:'Heading.'},
      {id:'skills',span:[5,5],treatment:'preserve',level:'unclear',reason:'Skill; hard eligibility is unstated.'},
      {id:'apply',span:[6,6],treatment:'context',reason:'Application heading.'},
    ]};
    const item={id:'synthetic',candidate:'candidate.json',candidateSha256:digest(bytes),response:'response.json',
      expected:{...expected(),requirements,expression:{op:'ref',id:'matric'},sourceAudit}};
    const manifest={version:1,purpose:'development_regression',observedAt:now,cases:[item]};
    await writeFile(join(dir,'candidate.json'),bytes);
    await writeFile(join(dir,'response.json'),JSON.stringify({provenance:{extractionVersion:'recentjobs_requirements_v2'},extraction:{
      groups:[{relation:'all',items:[{kind:'education',level:'required',state:'stated',span:[3,3]}]}],unresolvedSpan:null,
    }}));
    const file=join(dir,'manifest.json');await writeFile(file,JSON.stringify(manifest));
    const run=()=>spawnSync(process.execPath,['tools/evaluate-recentjobs.mjs','--requirements',file],{cwd:new URL('..',import.meta.url),env:{},encoding:'utf8',timeout:10000});
    const result=run();assert.equal(result.status,1);const report=JSON.parse(result.stdout);
    assert.equal(report.evaluationVersion,'recentjobs_evaluation_v2');assert.equal(report.newModelCalls,0);assert.equal(report.qualification,false);
    assert.equal(report.cases[0].targetedMatched,true);assert.equal(report.cases[0].sourceAuditMatched,false);
    assert.equal(report.cases[0].issues[0].code,'SOURCE_AUDIT_PASSAGE_MISSING');
    item.response=null;sourceAudit.entries.splice(3,1);await writeFile(file,JSON.stringify(manifest));
    const incomplete=JSON.parse(run().stdout);assert.equal(incomplete.cases[0].status,'rejected');
    assert.equal(incomplete.cases[0].issues[0].code,'EVALUATION_AUDIT_INCOMPLETE');
  } finally {await rm(dir,{recursive:true,force:true});}
});
