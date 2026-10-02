import {open} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {z} from 'zod';
import {digest} from '../src/ai/evaluation.mjs';
import {groqSchema} from '../src/ai/groq.mjs';
import {validationPayload,validationContract,validateAssessment} from '../src/ai/validation.mjs';
import {requirementValidationPayload,requirementValidationContract,validateRequirementAssessment} from '../src/ai/requirement-validation.mjs';

const hash=z.string().regex(/^[a-f0-9]{64}$/);
const Manifest=z.object({version:z.literal(1),purpose:z.literal('development_validation_challenges'),qualification:z.literal(false),
  cases:z.array(z.object({id:z.string().regex(/^[a-z][a-z0-9_-]{0,95}$/),scope:z.enum(['full_extraction','requirements_only']),
    expectedSupported:z.boolean(),input:z.string().min(1).max(2048),inputSha256:hash,assessment:z.string().min(1).max(2048),
  }).passthrough()).min(1).max(20),
}).passthrough();
async function boundedFile(path) {
  const file=await open(path,'r');
  try{
    const stat=await file.stat();if(!stat.isFile()||stat.size>1000000)throw Error('EVALUATION_FILE_LIMIT');
    const bytes=Buffer.alloc(1000001);let size=0;
    while(size<bytes.length){const {bytesRead}=await file.read(bytes,size,bytes.length-size,null);if(!bytesRead)break;size+=bytesRead;}
    if(size>1000000)throw Error('EVALUATION_FILE_LIMIT');return bytes.subarray(0,size);
  }finally{await file.close();}
}
const safeCode=error=>/^[A-Z_]+$/.test(error?.code??error?.message??'')?error.code??error.message:'EVALUATION_INPUT_INVALID';
if(process.argv.includes('--help'))console.log('Usage: node packages/catalogue/tools/evaluate-validation.mjs <manifest.json>\nOffline validation challenge replay. No credentials, network, model calls or publication. Scores supported/unsupported decisions and evidence validity; specific defect coverage requires separate review. Missing assessments remain unavailable.');
else{
  try{
    if(process.argv.length!==3)throw Error('EVALUATION_USAGE');
    const path=resolve(process.argv[2]),manifestBytes=await boundedFile(path),manifest=Manifest.parse(JSON.parse(manifestBytes));
    if(new Set(manifest.cases.map(row=>row.id)).size!==manifest.cases.length)throw Error('EVALUATION_DUPLICATE_CASE');
    const cases=[];
    for(const row of manifest.cases){
      let assessmentHash=null,promptSchemaHash=null;
      try{
        const input=JSON.parse(await boundedFile(resolve(dirname(path),row.input)));
        if(digest(JSON.stringify(input))!==row.inputSha256)throw Error('EVALUATION_INPUT_CHANGED');
        const requirementsOnly=row.scope==='requirements_only';
        const payload=requirementsOnly?requirementValidationPayload(input.candidate,input.requirements):validationPayload(input);
        const contract=requirementsOnly?requirementValidationContract():validationContract(input.primary??null);
        promptSchemaHash=digest(JSON.stringify([contract.instruction,groqSchema(contract.schema)]));
        let bytes;try{bytes=await boundedFile(resolve(dirname(path),row.assessment));}
        catch(error){if(error.code!=='ENOENT')throw error;cases.push({id:row.id,scope:row.scope,status:'unavailable',code:'EVALUATION_ASSESSMENT_MISSING',promptSchemaHash});continue;}
        assessmentHash=digest(bytes);const response=JSON.parse(bytes);
        if(response.provenance?.extractionVersion!==contract.version)throw Error('EVALUATION_VERSION_UNSUPPORTED');
        if(requirementsOnly&&(response.scope!=='requirements_only'||response.qualification!==false))throw Error('EVALUATION_SCOPE_INVALID');
        const raw={supported:response.supported,issues:response.issues,evidence:response.evidence};
        const parsed=requirementsOnly?validateRequirementAssessment(raw,payload.recentjobsText):validateAssessment(raw,payload.recentjobsText,input.primary??null);
        cases.push({id:row.id,scope:row.scope,status:!parsed.supported&&!parsed.issues.length?'unreasoned_rejection':parsed.supported===row.expectedSupported?'decision_match':'decision_mismatch',
          expectedSupported:row.expectedSupported,supported:parsed.supported,issueCount:parsed.issues.length,evidenceCount:parsed.evidence.length,assessmentHash,promptSchemaHash});
      }catch(error){cases.push({id:row.id,scope:row.scope,status:'invalid',code:safeCode(error),assessmentHash,promptSchemaHash});}
    }
    console.log(JSON.stringify({purpose:manifest.purpose,qualification:false,newModelCalls:0,manifestHash:digest(manifestBytes),
      scoringScope:'decision_and_evidence_validity',specificDefectCoverage:'requires_separate_review',
      counts:Object.fromEntries(['decision_match','decision_mismatch','invalid','unavailable','unreasoned_rejection'].map(status=>[status,cases.filter(row=>row.status===status).length])),cases},null,2));
    if(cases.some(row=>row.status!=='decision_match'))process.exitCode=1;
  }catch(error){console.error(JSON.stringify({error:safeCode(error)}));process.exitCode=1;}
}
