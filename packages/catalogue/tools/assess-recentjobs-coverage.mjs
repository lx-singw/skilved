import {open,realpath} from 'node:fs/promises';
import {resolve,dirname,relative,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {z} from 'zod';
import {InstantSchema} from '@skilved/types/opportunities';
import {buildRecentJobsCoverage} from '../src/recentjobs-coverage.mjs';
import {writeShadowReport} from './shadow-report.mjs';

const Saved=z.object({url:z.string().url().max(2048),htmlPath:z.string().min(1).max(2048).optional(),error:z.string().regex(/^[A-Z][A-Z_]{0,79}$/).optional()})
 .strict().refine(o=>(o.htmlPath!==undefined)!==(o.error!==undefined),'One saved body or error required');
const Manifest=z.object({version:z.literal(1),observedAt:InstantSchema,limit:z.number().int().min(1).max(10).optional(),
 listing:z.object({url:z.string().url().max(2048),htmlPath:z.string().min(1).max(2048)}).strict(),notices:z.array(Saved).max(10),portals:z.array(Saved).max(10)}).strict();
async function readBounded(path,max){const f=await open(path,'r');try{const info=await f.stat();if(!info.isFile()||info.size>max)throw Error('COVERAGE_FILE_LIMIT');
 const bytes=Buffer.alloc(max+1);let length=0;while(length<bytes.length){const read=await f.read(bytes,length,bytes.length-length,null);if(!read.bytesRead)break;length+=read.bytesRead;}
 if(length>max)throw Error('COVERAGE_FILE_LIMIT');return bytes.subarray(0,length).toString('utf8');}finally{await f.close();}}
export async function assessCoverageCli(args,output=console.log){
 if(args.length!==1)throw Error('COVERAGE_ARGUMENT_INVALID');
 const path=await realpath(resolve(args[0])),base=dirname(path),manifest=Manifest.parse(JSON.parse(await readBounded(path,80000)));
 const body=async name=>{if(isAbsolute(name))throw Error('COVERAGE_PATH_OUTSIDE_BUNDLE');const target=await realpath(resolve(base,name)),local=relative(base,target);
  if(local==='..'||local.startsWith('../')||isAbsolute(local))throw Error('COVERAGE_PATH_OUTSIDE_BUNDLE');return readBounded(target,500000);};
 const load=async o=>({url:o.url,...(o.htmlPath?{html:await body(o.htmlPath)}:{error:o.error})});
 const report=buildRecentJobsCoverage({observedAt:manifest.observedAt,...(manifest.limit?{limit:manifest.limit}:{}),listing:{url:manifest.listing.url,html:await body(manifest.listing.htmlPath)},
  notices:await Promise.all(manifest.notices.map(load)),portals:await Promise.all(manifest.portals.map(load))});
 const saved=await writeShadowReport(report);output(JSON.stringify({report:saved,scope:report.scope,qualification:false,inputSha256:report.inputSha256,summary:report.summary}));return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv.includes('--help'))console.log(`Usage: node packages/catalogue/tools/assess-recentjobs-coverage.mjs <private-manifest.json>
Manifest: {version:1,observedAt,limit?,listing:{url,htmlPath},notices:[{url,htmlPath|error}],portals:[{url,htmlPath|error}]}.
Selects the first notices in publisher order; missing observations remain in the denominator.
Uses saved public-source HTML only. Paths must stay inside the manifest bundle, including symlinks.
Does not fetch sites, call AI, initialize a database, grant authority or publish. Supported structured formats still require authority and vacancy checks.
Saves a private report under ignored .artifacts/shadow; prints counts, not source bodies. Build contracts first.`);
 else try{await assessCoverageCli(process.argv.slice(2));}catch(e){console.error(JSON.stringify({error:/^COVERAGE_[A-Z_]+$/.test(e.message??'')?e.message:'COVERAGE_ASSESSMENT_FAILED'}));process.exitCode=1;}
}
