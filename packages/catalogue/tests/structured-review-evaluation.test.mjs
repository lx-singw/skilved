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
import {bindLineInventory,LINE_REQUIREMENT_REVIEW_VERSION} from '../src/ai/line-requirement-review.mjs';
import {bindBoundedInventory,BOUNDED_LINE_REVIEW_VERSION} from '../src/ai/bounded-line-review.mjs';
import {bindGuardedInventory,GUARDED_LINE_REVIEW_VERSION} from '../src/ai/guarded-line-review.mjs';
import {bindLocalInventory,LOCAL_LINE_REVIEW_VERSION} from '../src/ai/local-line-review.mjs';
import {bindCompactInventory,COMPACT_LINE_REVIEW_VERSION} from '../src/ai/compact-line-review.mjs';
import {bindAnchoredInventory,ANCHORED_LINE_REVIEW_VERSION} from '../src/ai/anchored-line-review.mjs';
import {bindMixedInventory,MIXED_LINE_REVIEW_VERSION} from '../src/ai/mixed-line-review.mjs';
import {bindProfileInventory,PROFILE_LINE_REVIEW_VERSION} from '../src/ai/profile-line-review.mjs';
import {bindCompleteInventory,COMPLETE_LINE_REVIEW_VERSION} from '../src/ai/complete-line-review.mjs';

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

test('offline replay dispatches V4 line inventories without credentials and distinguishes a missing source key',async()=>fixture(async({input,inventory,save,evaluate})=>{
  const lines={L1:'context',L2:'context',L3:{kind:'education',strength:'mandatory',group:1,relation:'all'},
    L4:{kind:'document',strength:'mandatory',group:1,relation:'all'},L5:'context'};
  Object.assign(inventory,bindLineInventory(input.candidate,{lines}));await save();
  const result=evaluate();assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);
  assert.equal(report.cases[0].inventoryVersion,LINE_REQUIREMENT_REVIEW_VERSION);assert.equal(report.counts.decision_match,1);
  assert.deepEqual(report.cases[0].ownership,{codePassages:0,modelLines:5,modelPassages:4});assert.doesNotMatch(result.stdout,/Grade 12|CV required/);
  delete inventory.inventory.lines.L2;await save();assert.equal(JSON.parse(evaluate().stdout).cases[0].code,'AI_INVALID_REVIEW_INVENTORY');
}));

test('offline replay dispatches V5 bounded-policy inventories without a model call or source text',async()=>fixture(async({input,inventory,save,evaluate})=>{
  const lines={L1:'context',L2:'context',L3:{kind:'education',strength:'mandatory',group:1,relation:'all'},L4:{kind:'document',strength:'mandatory',group:1,relation:'all'},L5:'context'};
  Object.assign(inventory,bindBoundedInventory(input.candidate,{lines}));await save();
  const result=evaluate();assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);
  assert.equal(report.cases[0].inventoryVersion,BOUNDED_LINE_REVIEW_VERSION);assert.equal(report.newModelCalls,0);assert.equal(report.counts.decision_match,1);
  assert.doesNotMatch(result.stdout,/Grade 12|CV required/);
}));

test('offline replay dispatches V6 guarded-policy inventories while preserving old versions and private source text',async()=>fixture(async({input,inventory,save,evaluate})=>{
  const lines={L1:'context',L2:'context',L3:{kind:'education',strength:'mandatory',group:1,relation:'all'},L4:{kind:'document',strength:'mandatory',group:1,relation:'all'},L5:'context'};
  Object.assign(inventory,bindGuardedInventory(input.candidate,{lines}));await save();
  const result=evaluate();assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);
  assert.equal(report.cases[0].inventoryVersion,GUARDED_LINE_REVIEW_VERSION);assert.equal(report.counts.decision_match,1);assert.equal(report.newModelCalls,0);
  assert.doesNotMatch(result.stdout,/Grade 12|CV required/);
}));

test('offline replay dispatches V7 local-policy inventories without exposing source text',async()=>fixture(async({input,inventory,save,evaluate})=>{
  const lines={L1:'context',L2:'context',L3:{kind:'education',strength:'mandatory',group:1,relation:'all'},L4:{kind:'document',strength:'mandatory',group:1,relation:'all'},L5:'context'};
  Object.assign(inventory,bindLocalInventory(input.candidate,{lines}));await save();
  const result=evaluate();assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);
  assert.equal(report.cases[0].inventoryVersion,LOCAL_LINE_REVIEW_VERSION);assert.equal(report.counts.decision_match,1);assert.equal(report.newModelCalls,0);
  assert.doesNotMatch(result.stdout,/Grade 12|CV required/);
}));

test('offline replay dispatches V8 compact-prompt inventories with exact local coverage',async()=>fixture(async({input,inventory,save,evaluate})=>{
  const lines={L1:'context',L2:'context',L3:{kind:'education',strength:'mandatory',group:1,relation:'all'},L4:{kind:'document',strength:'mandatory',group:1,relation:'all'},L5:'context'};
  Object.assign(inventory,bindCompactInventory(input.candidate,{lines}));await save();
  const result=evaluate();assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);
  assert.equal(report.cases[0].inventoryVersion,COMPACT_LINE_REVIEW_VERSION);assert.equal(report.counts.decision_match,1);assert.equal(report.newModelCalls,0);
  assert.doesNotMatch(result.stdout,/Grade 12|CV required/);
  delete inventory.inventory.lines.L2;await save();assert.equal(JSON.parse(evaluate().stdout).cases[0].code,'AI_INVALID_REVIEW_INVENTORY');
}));

test('offline replay dispatches V9 anchored alternatives and retains invalid pointer failures',async()=>fixture(async({input,inventory,save,evaluate})=>{
  const lines={L1:'context',L2:'context',L3:{kind:'education',strength:'mandatory',alternative:null},L4:{kind:'document',strength:'mandatory',alternative:null},L5:'context'};
  Object.assign(inventory,bindAnchoredInventory(input.candidate,{lines}));await save();
  const result=evaluate();assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);
  assert.equal(report.cases[0].inventoryVersion,ANCHORED_LINE_REVIEW_VERSION);assert.equal(report.counts.decision_match,1);assert.equal(report.newModelCalls,0);
  assert.doesNotMatch(result.stdout,/Grade 12|CV required/);
  inventory.inventory.lines.L3.alternative=3;await save();assert.equal(JSON.parse(evaluate().stdout).cases[0].code,'AI_REVIEW_ALTERNATIVE_INVALID');
}));

test('offline replay dispatches full V10 medium inventories with bound reasoning and no model calls',async()=>fixture(async({input,inventory,save,evaluate})=>{
  const lines={L1:'context',L2:'context',L3:{kind:'education',strength:'mandatory',alternative:null},L4:{kind:'document',strength:'mandatory',alternative:null},L5:'context'};
  Object.assign(inventory,bindCompleteInventory(input.candidate,{lines},null,{thinking:'medium'}));await save();
  const result=evaluate();assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);
  assert.equal(report.cases[0].inventoryVersion,COMPLETE_LINE_REVIEW_VERSION);assert.equal(report.counts.decision_match,1);assert.equal(report.newModelCalls,0);
  assert.doesNotMatch(result.stdout,/Grade 12|CV required/);
  inventory.thinking='low';await save();assert.equal(JSON.parse(evaluate().stdout).cases[0].code,'AI_REVIEW_BINDING_MISMATCH');
}));

test('offline replay dispatches V11 source constraints without printing private source text',async()=>fixture(async({input,inventory,save,evaluate})=>{
  const lines={L1:'context',L2:'context',L3:{kind:'education',strength:'mandatory',alternative:null},L4:{kind:'document',strength:'mandatory',alternative:null},L5:'context'};
  Object.assign(inventory,bindProfileInventory(input.candidate,{lines}));await save();
  const result=evaluate();assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);
  assert.equal(report.cases[0].inventoryVersion,PROFILE_LINE_REVIEW_VERSION);assert.equal(report.counts.decision_match,1);assert.equal(report.newModelCalls,0);
  assert.doesNotMatch(result.stdout,/Grade 12|CV required/);
  delete inventory.inventory.lines.L2;await save();assert.equal(JSON.parse(evaluate().stdout).cases[0].code,'AI_INVALID_REVIEW_INVENTORY');
}));
test('offline replay dispatches V12 inventories and retains source-dependent key failures',async()=>fixture(async({input,inventory,save,evaluate})=>{
  const lines={L1:'context',L2:'context',L3:{kind:'education',strength:'mandatory',alternative:null},L4:{kind:'document',strength:'mandatory',alternative:null},L5:'context'};
  Object.assign(inventory,bindMixedInventory(input.candidate,{lines}));await save();
  const result=evaluate();assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);
  assert.equal(report.cases[0].inventoryVersion,MIXED_LINE_REVIEW_VERSION);assert.equal(report.counts.decision_match,1);assert.equal(report.newModelCalls,0);
  assert.deepEqual(report.cases[0].ownership,{compiledQualificationBranches:0,sourceConstraints:0,modelLines:5});assert.doesNotMatch(result.stdout,/Grade 12|CV required/);
  delete inventory.inventory.lines.L2;await save();assert.equal(JSON.parse(evaluate().stdout).cases[0].code,'AI_INVALID_REVIEW_INVENTORY');
}));