import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {digest} from '../src/ai/evaluation.mjs';
import {decodeGroqRequirements} from '../src/ai/groq-schema.mjs';
import {REQUIREMENT_VALIDATION_VERSION} from '../src/ai/requirement-validation.mjs';

async function fixture(run){
  const dir=await mkdtemp(join(tmpdir(),'skilved-validation-eval-'));
  try{
    const candidate={title:'Fictional apprenticeship',sourceText:'Requirements\nGrade 12\nCV required\nHow to apply'},
      requirements=decodeGroqRequirements({items:[{id:'r1',kind:'education',level:'required',state:'stated',span:[3,3]}],expression:'r1'},candidate),input={candidate,requirements};
    const manifest={version:1,purpose:'development_validation_challenges',qualification:false,cases:[{id:'omitted-document',scope:'requirements_only',expectedSupported:false,input:'input.json',inputSha256:digest(JSON.stringify(input)),assessment:'assessment.json'}]};
    const response={scope:'requirements_only',qualification:false,supported:false,issues:[{field:'requirements.documents',reason:'PRIVATE_MODEL_REASON'}],evidence:[{source:'recentjobs',quote:'CV required'}],provenance:{extractionVersion:REQUIREMENT_VALIDATION_VERSION}};
    const save=()=>Promise.all([writeFile(join(dir,'input.json'),JSON.stringify(input)),writeFile(join(dir,'manifest.json'),JSON.stringify(manifest)),writeFile(join(dir,'assessment.json'),JSON.stringify(response))]);
    const evaluate=()=>spawnSync(process.execPath,['tools/evaluate-validation.mjs',join(dir,'manifest.json')],{cwd:new URL('..',import.meta.url),env:{},encoding:'utf8',timeout:10000});
    await save();await run({dir,input,manifest,response,save,evaluate});
  }finally{await rm(dir,{recursive:true,force:true});}
}

test('offline challenge replay verifies the rejection decision and quotes without leaking private evidence or claiming defect coverage',async()=>fixture(async({evaluate})=>{
  const result=evaluate();assert.equal(result.status,0,result.stderr);const report=JSON.parse(result.stdout);
  assert.equal(report.counts.decision_match,1);assert.equal(report.newModelCalls,0);assert.equal(report.qualification,false);
  assert.equal(report.specificDefectCoverage,'requires_separate_review');assert.doesNotMatch(result.stdout,/PRIVATE_MODEL_REASON|Grade 12|CV required/);
}));

test('false support, unsupported evidence and wrong scope/version cannot pass offline evaluation',async()=>fixture(async({response,save,evaluate})=>{
  for(const mutate of [data=>{data.supported=true;data.issues=[];},data=>data.evidence[0].quote='Invented evidence',
    data=>data.provenance.extractionVersion='recentjobs_validation_v6',data=>data.qualification=true]) {
    const original=structuredClone(response);mutate(response);await save();const result=evaluate();assert.equal(result.status,1);
    const report=JSON.parse(result.stdout);assert.equal(report.counts.decision_match,0);Object.assign(response,original);
  }
}));

test('changed frozen inputs and missing assessments remain invalid or unavailable rather than passing',async()=>fixture(async({dir,input,save,evaluate})=>{
  input.candidate.sourceText+='\nChanged';await save();let report=JSON.parse(evaluate().stdout);
  assert.equal(report.cases[0].code,'EVALUATION_INPUT_CHANGED');
  input.candidate.sourceText=input.candidate.sourceText.replace('\nChanged','');await save();await rm(join(dir,'assessment.json'));
  report=JSON.parse(evaluate().stdout);assert.equal(report.counts.unavailable,1);assert.equal(report.counts.decision_match,0);
}));
