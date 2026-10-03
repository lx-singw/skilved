import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {digest} from '../src/ai/evaluation.mjs';
import {bindRequirementInventory,decodeRequirementInventory} from '../src/ai/structured-requirement-review.mjs';
import {bindApplicabilityInventory,APPLICABILITY_REQUIREMENT_REVIEW_VERSION} from '../src/ai/applicability-requirement-review.mjs';
import {bindCompiledInventory,COMPILED_REQUIREMENT_REVIEW_VERSION} from '../src/ai/compiled-requirement-review.mjs';

async function fixture(run){
  const dir=await mkdtemp(join(tmpdir(),'skilved-structured-review-'));
  try{
    const candidate={title:'Fictional apprenticeship',sourceText:'Requirements\nGrade 12\nCV required\nHow to apply'};
    const condition=(kind)=>({kind,level:'required',group:1,relation:'all'});
    const inventory=bindRequirementInventory(candidate,{passages:[{span:[1,2],role:'context',condition:null},
      {span:[3,3],role:'condition',condition:condition('education')},{span:[4,4],role:'condition',condition:condition('document')},
      {span:[5,5],role:'context',condition:null}]});
    const requirements=decodeRequirementInventory(candidate,inventory);requirements.items.pop();requirements.expression.children.pop();
    const input={candidate,requirements},manifest={version:1,purpose:'development_structured_requirement_review',qualification:false,
      cases:[{id:'missing-document',expectedSupported:false,input:'input.json',inputSha256:digest(JSON.stringify(input)),inventory:'inventory.json'}]};
    const save=()=>Promise.all([writeFile(join(dir,'input.json'),JSON.stringify(input)),writeFile(join(dir,'manifest.json'),JSON.stringify(manifest)),writeFile(join(dir,'inventory.json'),JSON.stringify(inventory))]);
    const evaluate=()=>spawnSync(process.execPath,['tools/evaluate-structured-review.mjs',join(dir,'manifest.json')],{cwd:new URL('..',import.meta.url),env:{},encoding:'utf8',timeout:10000});
    await save();await run({dir,input,manifest,inventory,save,evaluate});
  }finally{await rm(dir,{recursive:true,force:true});}
}

test('offline structured review compares every claim and reports omitted evidence without printing source text',async()=>fixture(async({evaluate})=>{
  const result=evaluate();assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);
  assert.equal(report.newModelCalls,0);assert.equal(report.qualification,false);assert.equal(report.counts.decision_match,1);
  assert.equal(report.cases[0].checkedClaims,1);assert.equal(report.cases[0].sourceConditions,2);
  assert.ok(report.cases[0].issues.some(issue=>issue.code==='REVIEW_MISSING_CONDITION'&&issue.span[0]===4));
  assert.doesNotMatch(result.stdout,/Grade 12|CV required|r_3_3/);
}));

test('offline replay distinguishes wrong decisions, changed inputs, source-bound inventories and missing files',async()=>fixture(async({dir,input,manifest,inventory,save,evaluate})=>{
  manifest.cases[0].expectedSupported=true;await save();assert.equal(JSON.parse(evaluate().stdout).counts.decision_mismatch,1);
  manifest.cases[0].expectedSupported=false;input.candidate.sourceText+='\nChanged';await save();assert.equal(JSON.parse(evaluate().stdout).cases[0].code,'EVALUATION_INPUT_CHANGED');
  input.candidate.sourceText=input.candidate.sourceText.replace('\nChanged','');inventory.version='old';await save();assert.equal(JSON.parse(evaluate().stdout).cases[0].code,'AI_REVIEW_BINDING_MISMATCH');
  await rm(join(dir,'inventory.json'));const result=evaluate();assert.equal(result.status,1);assert.equal(JSON.parse(result.stdout).counts.unavailable,1);
}));

test('offline replay dispatches typed V2 inventories while retaining the same frozen input and evidence-only report',async()=>fixture(async({input,inventory,save,evaluate})=>{
  const passages=inventory.inventory.passages.map(passage=>({span:passage.span,applicability:passage.role==='condition'?'current':'context',
    kind:passage.condition?.kind??null,strength:passage.condition?'mandatory':null,group:passage.condition?.group??null,relation:passage.condition?.relation??null}));
  Object.assign(inventory,bindApplicabilityInventory(input.candidate,{passages}));await save();
  const result=evaluate();assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);
  assert.equal(report.cases[0].inventoryVersion,APPLICABILITY_REQUIREMENT_REVIEW_VERSION);assert.equal(report.counts.decision_match,1);
  assert.doesNotMatch(result.stdout,/Grade 12|CV required/);
}));

test('offline replay dispatches compiled V3 segments and reports code/model ownership without source text',async()=>fixture(async({input,inventory,save,evaluate})=>{
  const rows=inventory.inventory.passages.map(passage=>({span:passage.span,applicability:passage.role==='condition'?'current':'context',
    ...(passage.condition?{kind:passage.condition.kind,strength:'mandatory',group:passage.condition.group,relation:passage.condition.relation}:{})}));
  Object.assign(inventory,bindCompiledInventory(input.candidate,{segments:{s_1_5:rows}}));await save();
  const result=evaluate();assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);
  assert.equal(report.cases[0].inventoryVersion,COMPILED_REQUIREMENT_REVIEW_VERSION);assert.equal(report.counts.decision_match,1);
  assert.deepEqual(report.cases[0].ownership,{codePassages:0,modelSegments:1,modelPassages:4});
  assert.doesNotMatch(result.stdout,/Grade 12|CV required/);
}));
