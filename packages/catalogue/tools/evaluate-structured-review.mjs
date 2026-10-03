import {open} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {z} from 'zod';
import {digest} from '../src/ai/evaluation.mjs';
import {compareRequirementInventory} from '../src/ai/structured-requirement-review.mjs';

const Manifest=z.object({version:z.literal(1),purpose:z.literal('development_structured_requirement_review'),qualification:z.literal(false),
  cases:z.array(z.object({id:z.string().regex(/^[a-z][a-z0-9_-]{0,95}$/),expectedSupported:z.boolean(),
    input:z.string().min(1).max(2048),inputSha256:z.string().regex(/^[a-f0-9]{64}$/),inventory:z.string().min(1).max(2048),
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
if(process.argv.includes('--help'))console.log('Usage: node packages/catalogue/tools/evaluate-structured-review.mjs <manifest.json>\nOffline source-inventory/claim comparison. No credentials, network, model calls or publication. Decision agreement is distinct from inventory accuracy and complete defect coverage.');
else{
  try{
    if(process.argv.length!==3)throw Error('EVALUATION_USAGE');
    const path=resolve(process.argv[2]),manifestBytes=await boundedFile(path),manifest=Manifest.parse(JSON.parse(manifestBytes));
    if(new Set(manifest.cases.map(row=>row.id)).size!==manifest.cases.length)throw Error('EVALUATION_DUPLICATE_CASE');
    const cases=[];
    for(const row of manifest.cases){
      let inventoryHash=null;
      try{
        const input=JSON.parse(await boundedFile(resolve(dirname(path),row.input)));
        if(digest(JSON.stringify(input))!==row.inputSha256)throw Error('EVALUATION_INPUT_CHANGED');
        let bytes;try{bytes=await boundedFile(resolve(dirname(path),row.inventory));}
        catch(error){if(error.code!=='ENOENT')throw error;cases.push({id:row.id,status:'unavailable',code:'EVALUATION_INVENTORY_MISSING'});continue;}
        inventoryHash=digest(bytes);
        const result=compareRequirementInventory({...input,review:JSON.parse(bytes)});
        cases.push({id:row.id,status:result.supported===row.expectedSupported?'decision_match':'decision_mismatch',
          expectedSupported:row.expectedSupported,supported:result.supported,needsReview:result.needsReview,
          checkedClaims:result.checks.length,sourceChecks:result.sourceChecks,sourceConditions:result.sourceConditions,sourceUnresolvedScopes:result.sourceUnresolvedScopes,
          issues:result.issues.map(({code,span})=>({code,span})),inventoryHash});
      }catch(error){cases.push({id:row.id,status:'invalid',code:safeCode(error),inventoryHash});}
    }
    console.log(JSON.stringify({purpose:manifest.purpose,qualification:false,newModelCalls:0,manifestHash:digest(manifestBytes),
      scoringScope:'requirements_evidence_and_structure',inventoryAccuracy:'requires_separate_source_audit',
      counts:Object.fromEntries(['decision_match','decision_mismatch','invalid','unavailable'].map(status=>[status,cases.filter(row=>row.status===status).length])),cases},null,2));
    if(cases.some(row=>row.status!=='decision_match'))process.exitCode=1;
  }catch(error){console.error(JSON.stringify({error:safeCode(error)}));process.exitCode=1;}
}
