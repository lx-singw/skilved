import{open,realpath}from'node:fs/promises';
import{resolve,dirname,relative,isAbsolute}from'node:path';
import{pathToFileURL}from'node:url';
import{z}from'zod';
import{auditSavedRecentJobsHolds}from'./lib/held-notice-audit.mjs';
import{writeShadowReport}from'./shadow-report.mjs';

const Manifest=z.object({version:z.literal(1),observedAt:z.string(),sourcePath:z.string().min(1).max(2048),selectionPath:z.string().min(1).max(2048),outcomesPath:z.string().min(1).max(2048),
 observations:z.array(z.object({url:z.string().url(),retrievedAt:z.string(),htmlPath:z.string().min(1).max(2048).optional(),sha256:z.string().optional(),error:z.string().optional()}).strict()
  .refine(o=>(o.htmlPath!==undefined)!==(o.error!==undefined),'One saved body or error required')).max(200)}).strict();
async function readBounded(path,max){const file=await open(path,'r');try{const s=await file.stat();if(!s.isFile()||s.size>max)throw Error('HOLD_AUDIT_FILE_LIMIT');
 const bytes=Buffer.alloc(max+1);let size=0;while(size<bytes.length){const read=await file.read(bytes,size,bytes.length-size,null);if(!read.bytesRead)break;size+=read.bytesRead;}if(size>max)throw Error('HOLD_AUDIT_FILE_LIMIT');return bytes.subarray(0,size).toString('utf8');}finally{await file.close();}}

export async function auditRecentJobsHoldsCli(args,output=console.log){
 if(args.length!==1)throw Error('HOLD_AUDIT_ARGUMENT_INVALID');
 const manifestPath=await realpath(resolve(args[0])),base=dirname(manifestPath),manifest=Manifest.parse(JSON.parse(await readBounded(manifestPath,1000000)));
 const read=async(name,max=500000)=>{if(isAbsolute(name))throw Error('HOLD_AUDIT_PATH_OUTSIDE_BUNDLE');const target=await realpath(resolve(base,name)),local=relative(base,target);if(local==='..'||local.startsWith('../')||isAbsolute(local))throw Error('HOLD_AUDIT_PATH_OUTSIDE_BUNDLE');return readBounded(target,max);};
 const [source,selection,outcomes]=await Promise.all([manifest.sourcePath,manifest.selectionPath,manifest.outcomesPath].map(async path=>JSON.parse(await read(path,1000000))));
 const observations=await Promise.all(manifest.observations.map(async({htmlPath,...row})=>({...row,...(htmlPath?{html:await read(htmlPath)}:{})})));
 const report=auditSavedRecentJobsHolds({version:1,observedAt:manifest.observedAt,source,selection,outcomes,observations});
 const saved=await writeShadowReport(report);output(JSON.stringify({report:saved,scope:report.scope,qualification:false,inputSha256:report.inputSha256,summary:report.summary,providerCalls:0,cloudWrites:0}));return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv.includes('--help'))console.log('Usage: node packages/catalogue/tools/audit-recentjobs-holds.mjs <private-manifest.json>\nUses a frozen saved cohort, recorded outcomes, source policy and hash-bound HTML. Missing observations stay in the denominator. Paths and symlinks must stay inside the bundle. Writes a private diagnostic report; never fetches, calls AI, grants authority, changes jobs or publishes.');
 else try{await auditRecentJobsHoldsCli(process.argv.slice(2));}catch(error){console.error(JSON.stringify({error:/^HOLD_AUDIT_[A-Z_]+$/.test(error.message??'')?error.message:'HOLD_AUDIT_FAILED'}));process.exitCode=1;}
}
