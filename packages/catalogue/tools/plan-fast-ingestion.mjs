import{open}from'node:fs/promises';import{resolve}from'node:path';import{pathToFileURL}from'node:url';import{z}from'zod';
import{planFastIngestion,assessFastIngestionCapacity}from'../src/fast-ingestion.mjs';
import{writeShadowReport}from'./shadow-report.mjs';
const Input=z.object({version:z.literal(1),capacity:z.unknown(),queue:z.unknown()}).strict();
export async function planFastIngestionCli(args,output=console.log){
 if(args.length!==1)throw Error('FAST_INGESTION_ARGUMENT_INVALID');
 const file=await open(resolve(args[0]),'r');let input;
 try{const stat=await file.stat();if(!stat.isFile()||stat.size>1000000)throw Error('FAST_INGESTION_FILE_LIMIT');
  const bytes=Buffer.alloc(1000001);let size=0;while(size<bytes.length){const row=await file.read(bytes,size,bytes.length-size,null);if(!row.bytesRead)break;size+=row.bytesRead;}
  if(size>1000000)throw Error('FAST_INGESTION_FILE_LIMIT');input=Input.parse(JSON.parse(bytes.subarray(0,size).toString('utf8')));
 }finally{await file.close();}
 const capacity=assessFastIngestionCapacity(input.capacity),dispatch=planFastIngestion(input.queue);
 // Property order is irrelevant; capacity and dispatch must use the same targets.
 if(!Object.keys(capacity.targets).every(k=>capacity.targets[k]===input.queue.policy?.[k]))throw Error('FAST_INGESTION_POLICY_MISMATCH');
 const report={version:'fast_ingestion_plan_v1',scope:'offline_planning_only',capacity,dispatch,networkRequests:0,providerCalls:0,cloudWrites:0,publicationAuthorized:false};
 const saved=await writeShadowReport(report);output(JSON.stringify({report:saved,capacityEstimatePasses:capacity.capacityEstimatePasses,failures:capacity.failures,queued:dispatch.queued,ready:dispatch.ready,incidents:dispatch.incidents.length,overTarget:dispatch.overTarget,liveSloVerified:false,providerCalls:0,cloudWrites:0}));return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv.length===3&&process.argv[2]==='--help')console.log('Usage: node packages/catalogue/tools/plan-fast-ingestion.mjs <private-input.json>\nEvaluates declared capacity and a bounded queue against production freshness targets. Does not fetch, call models, change quotas, dispatch jobs or publish.');
 else try{await planFastIngestionCli(process.argv.slice(2));}catch(error){console.error(JSON.stringify({error:/^FAST_INGESTION_[A-Z_]+$/.test(error.code??error.message??'')?error.code??error.message:'FAST_INGESTION_PLAN_FAILED'}));process.exitCode=1;}
}
