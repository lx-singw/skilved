import {open} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {planRecentJobsPublisher} from '../src/publisher-plan.mjs';

export async function planPublisherCli(args,output=console.log){
 if(args.length!==1)throw Error('PUBLISHER_PLAN_ARGUMENT_INVALID');
 const file=await open(resolve(args[0]),'r');let text;
 try{const stat=await file.stat();if(!stat.isFile()||stat.size>2000000)throw Error('PUBLISHER_PLAN_FILE_LIMIT');
  const bytes=Buffer.alloc(2000001);let length=0;while(length<bytes.length){const read=await file.read(bytes,length,bytes.length-length,null);if(!read.bytesRead)break;length+=read.bytesRead;}
  if(length>2000000)throw Error('PUBLISHER_PLAN_FILE_LIMIT');text=bytes.subarray(0,length).toString('utf8');
 }finally{await file.close();}
 let input;try{input=JSON.parse(text);}catch{throw Error('PUBLISHER_PLAN_INVALID');}
 const plan=planRecentJobsPublisher(input);output(JSON.stringify(plan,null,2));return plan;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv.includes('--help'))console.log(`Usage: pnpm --filter @skilved/catalogue plan:publisher <private-input.json>
Input: {source,observedAt,budgets:[{sourceId,date,calls}],discovery:{maxPages,maxArticles}}.
Produces a private source-update proposal, not a new source, budget, grant or job.
Preserves source ID, owner, permissions, existing URLs, issuer trust, crawl choice and daily cap.
The proposed operator command requires a genuine current Source-role identity and expected revision.
No provider/database client is initialized; no policy or accounting is changed. Keep output private.`);
 else try{await planPublisherCli(process.argv.slice(2));}catch(e){console.error(JSON.stringify({error:/^PUBLISHER_PLAN_[A-Z_]+$/.test(e.code??e.message??'')?(e.code??e.message):'PUBLISHER_PLAN_FAILED'}));process.exitCode=1;}
}
