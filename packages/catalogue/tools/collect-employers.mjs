import {open} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {z} from 'zod';
import {retrieve} from '../src/fetch.mjs';
import {OnboardingPlan,evaluateOnboarding} from '../src/employer-onboarding.mjs';
import {collectEmployerOnboarding} from '../src/employer-onboarding-collector.mjs';
import {writeShadowReport} from './shadow-report.mjs';

export async function readOnboardingFile(path,max=3000000){const file=await open(path,'r');try{const s=await file.stat();if(!s.isFile()||s.size>max)throw Error('ONBOARDING_FILE_LIMIT');
 const buffer=Buffer.alloc(max+1);let length=0;while(length<buffer.length){const r=await file.read(buffer,length,buffer.length-length,null);if(!r.bytesRead)break;length+=r.bytesRead;}
 if(length>max)throw Error('ONBOARDING_FILE_LIMIT');return JSON.parse(buffer.subarray(0,length).toString('utf8'));}finally{await file.close();}}
/** Follow at most one unique, explicitly observed same-origin careers candidate.
 * Reuse prior bodies/errors with original timestamps; never retry a blocked identity.
 */
export async function collectEmployerWorkflow(plan,options={}){
 const sleep=options.sleep??(ms=>new Promise(r=>setTimeout(r,ms))),now=options.now??(()=>new Date().toISOString());let nextAt=0;
 const fetcher=async(...a)=>{await sleep(Math.max(0,nextAt-Date.parse(now())));nextAt=Date.parse(now())+3000;return(options.fetcher??retrieve)(...a);};
 const first=await collectEmployerOnboarding(plan,{...options,fetcher,sleep,now}),evaluation=evaluateOnboarding(first.bundle);
 if(evaluation.careersCandidates.length!==1||evaluation.careersCandidates[0]===first.bundle.plan.careersUrl)return first;
 const revised={...first.bundle.plan,careersUrl:evaluation.careersCandidates[0]},reuse=first.bundle.observations.filter(o=>o.url!==first.bundle.plan.careersUrl);
 const next=await collectEmployerOnboarding(revised,{...options,fetcher,sleep,now,reuse});
 return{...next,initialBundle:first.bundle,requests:[...first.requests,...next.requests]};
}
export async function collectEmployersCli(args,output=console.log,options={}){
 if(args.length!==1)throw Error('ONBOARDING_ARGUMENT_INVALID');
 const input=z.object({version:z.literal(1),employers:z.array(OnboardingPlan).min(1).max(10)}).strict().parse(await readOnboardingFile(args[0],64000));
 const reports=[],sleep=options.sleep??(ms=>new Promise(r=>setTimeout(r,ms))),now=options.now??(()=>new Date().toISOString());let nextAt=0;
 const fetcher=async(...a)=>{await sleep(Math.max(0,nextAt-Date.parse(now())));nextAt=Date.parse(now())+3000;return(options.fetcher??retrieve)(...a);};
 for(const plan of input.employers){const collected=await collectEmployerWorkflow(plan,{fetcher,sleep,now}),initialBundleFile=collected.initialBundle?await writeShadowReport(collected.initialBundle):null,
  bundleFile=await writeShadowReport(collected.bundle),evaluation=evaluateOnboarding(collected.bundle);
  const report={issuer:plan.issuer,bundleFile,...(initialBundleFile?{initialBundleFile}:{}),evaluation,requests:collected.requests.length,providerCalls:0,authorityCreated:false};reports.push(report);output(JSON.stringify(report));}
 return reports;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.argv.includes('--help'))console.log('Usage: collect-employers.mjs <private-plan.json>\nPlan: {version:1,employers:[{issuer,aliases?,corporateUrl,careersUrl,identityUrl,identityFormat?:"pdf",needId?}]}; 1-10 employers.\nPDF identity evidence requires Poppler and prlimit; <=400000 bytes, <=20 pages, <=120000 text bytes.\nPublic HTTPS reads only; robots, pacing, DNS/TLS and exact URLs enforced. At most one observed careers-path correction; at most seven bounded retrieval attempts per employer. Saves private bundles. No AI, database access, authority approval or publication.');
 else try{await collectEmployersCli(process.argv.slice(2));}catch(e){console.error(JSON.stringify({error:e.code??(/^ONBOARDING_[A-Z_]+$/.test(e.message??'')?e.message:'ONBOARDING_COLLECTION_FAILED')}));process.exitCode=1;}
}
