import{open}from'node:fs/promises';import{resolve}from'node:path';import{pathToFileURL}from'node:url';
import{planFastIngestionMigration}from'../src/fast-ingestion-migration.mjs';import{writeShadowReport}from'./shadow-report.mjs';
export async function planFastHistoryMigrationCli(args,output=console.log,options={}){
 if(args.length!==1)throw Error('FAST_MIGRATION_ARGUMENT_INVALID');const file=await open(resolve(args[0]),'r');let input;
 try{const stat=await file.stat();if(!stat.isFile()||stat.size>8000000)throw Error('FAST_MIGRATION_FILE_LIMIT');const bytes=Buffer.alloc(8000001);let size=0;while(size<bytes.length){const r=await file.read(bytes,size,bytes.length-size,null);if(!r.bytesRead)break;size+=r.bytesRead;}if(size>8000000)throw Error('FAST_MIGRATION_FILE_LIMIT');input=JSON.parse(bytes.subarray(0,size).toString('utf8'));}finally{await file.close();}
 const plan=planFastIngestionMigration(input,options),report=await writeShadowReport(plan);output(JSON.stringify({report,sha256:plan.sha256,noticeCount:plan.noticeCount,blockers:plan.blockers,readyForHistoryImport:plan.readyForHistoryImport,sourcePolicyApplied:false,providerCalls:0,cloudWrites:0}));return plan;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv.length===3&&process.argv[2]==='--help')console.log('Usage: node packages/catalogue/tools/plan-fast-history-migration.mjs <private-input.json>\nPlans held history metadata from a complete bounded inventory and explicit scheduled-run list. Does not connect to a database, import data, enable a source, copy caches, reset quotas or publish.');
 else try{await planFastHistoryMigrationCli(process.argv.slice(2));}catch(error){console.error(JSON.stringify({error:/^FAST_MIGRATION_[A-Z_]+$/.test(error.code??error.message??'')?error.code??error.message:'FAST_MIGRATION_PLAN_FAILED'}));process.exitCode=1;}
}
