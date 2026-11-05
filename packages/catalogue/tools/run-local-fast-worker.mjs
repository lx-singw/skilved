import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {GoogleAuth,Impersonated,OAuth2Client} from 'google-auth-library';
import {IdSchema} from '@skilved/types/opportunities';
import {configuration,DomainError} from '../src/config.mjs';
import {workerPrincipal} from '../src/worker-identity.mjs';
import {gcloudCredentialSource} from './gcloud-credentials.mjs';
import {runFastWorkerCommand} from './run-fast-recentjobs.mjs';

const fail=code=>{throw new DomainError(code);};
const project='skilved-staging';
export const localUsage=`Usage: run-local-fast-worker --enable-shadow <source-id> <revision> --principal <service-account> --account <existing-gcloud-account> [--refresh-private] [--check]
Local staging only. Uses the named existing gcloud account to obtain short-lived
delegated workload credentials; it never creates credentials or grants access.
The verified machine principal, current source, ingest-only grant, model authority
and all normal quality/quota gates remain required. No public publication.
--check reads admission/query state without polling, AI requests or refresh activation.
Exit 78 requires operator repair; transient infrastructure failures exit 1.
Hosted workers continue to use their attached ADC entry point.`;

export function localFastSettings(args,env=process.env){
 const config=configuration(env);
 if(config?.mode!=='cloud'||config.projectId!==project||env.NODE_ENV!=='production'||
  env.SKILVED_CATALOGUE_READS!=='false'||env.SKILVED_CATALOGUE_REPORTS!=='false'||env.SKILVED_SUGGESTIONS_ENABLED!=='false'||env.SKILVED_AI_MODE!=='gemini')fail('LOCAL_FAST_CONFIGURATION_REQUIRED');
 const flags=args.slice(7),principal=args[4],account=args[6];
 if(args.length<7||args.length>9||args[0]!=='--enable-shadow'||!IdSchema.safeParse(args[1]).success||!/^[1-9]\d{0,8}$/.test(args[2]??'')||
  args[3]!=='--principal'||! /^[a-z0-9-]+@skilved-staging\.iam\.gserviceaccount\.com$/.test(principal??'')||
  args[5]!=='--account'||! /^[^\s@]+@[^\s@]+$/.test(account??'')||
  flags.some(flag=>!['--refresh-private','--check'].includes(flag))||new Set(flags).size!==flags.length)fail('INVALID_COMMAND');
 return{config,principal,account,workerArgs:[...args.slice(0,3),...flags]};
}

/** Build local delegated clients with the SDK version used by each consumer.
 * OAuth tokens stay in SDK memory; metadata supplies their actual expiry. */
export async function localDelegatedRuntime(settings,env=process.env){
 const require=createRequire(import.meta.url),{Firestore}=require('firebase-admin/firestore');
 const admin=createRequire(require.resolve('firebase-admin/firestore'));
 const firestore=createRequire(admin.resolve('@google-cloud/firestore'));
 const gax=createRequire(firestore.resolve('google-gax'))('google-auth-library');
 const source=gcloudCredentialSource({env,expectedAccount:settings.account});
 const options={targetPrincipal:settings.principal,targetScopes:['https://www.googleapis.com/auth/cloud-platform'],lifetime:900};
 const db=new Firestore({projectId:settings.config.projectId,auth:new gax.GoogleAuth({authClient:new gax.Impersonated({...options,sourceClient:source.oauth(gax.OAuth2Client)})})});
 try{
  const identityAuth=new GoogleAuth({authClient:new Impersonated({...options,sourceClient:source.oauth(OAuth2Client)})});
  return{config:settings.config,db,identityAuth};
 }catch(error){await db.terminate();throw error;}
}

export async function runLocalFastWorker(args,{env=process.env,dependencies={},...options}={}){
 if(args.length===1&&args[0]==='--help')return{help:localUsage};
 const settings=localFastSettings(args,env),deps={localDelegatedRuntime,workerPrincipal,runFastWorkerCommand,...dependencies};let runtime;
 return deps.runFastWorkerCommand(settings.workerArgs,{...options,env,dependencies:{
  getRuntime:async()=>{runtime=await deps.localDelegatedRuntime(settings,env);return runtime;},
  workerPrincipal:async(config,environment,identityOptions)=>{
   const principal=await deps.workerPrincipal(config,environment,{...identityOptions,auth:runtime.identityAuth});
   if(principal!==settings.principal)fail('WORKER_UNAUTHORIZED');return principal;
  }
 }});
}

export function localWorkerFailure(error){
 const transientNumbers=new Set([4,8,10,13,14]),transientCodes=new Set(['DEADLINE_EXCEEDED','RESOURCE_EXHAUSTED','ABORTED','INTERNAL','UNAVAILABLE','ECONNRESET','ECONNREFUSED','ETIMEDOUT','EAI_AGAIN','ENETUNREACH','EHOSTUNREACH','UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT','UND_ERR_SOCKET']);
 const detail=error?.identityFailure;
 const transient=transientNumbers.has(error?.code)||transientCodes.has(error?.code)||detail&&detail.stage!=='principal'&&!detail.credentialCode&&
  ([408,429,500,502,503,504].includes(detail.status)||transientCodes.has(detail.networkCode));
 const named=/^[A-Z][A-Z0-9_]{0,99}$/.test(error?.code??'');
 const result={error:named?error.code:'LOCAL_FAST_WORKER_FAILED',exitCode:transient?1:78};
 if(!named){result.failureKind=['Error','TypeError','RangeError','ReferenceError','ZodError'].includes(error?.name)?error.name:'unknown';if(Number.isInteger(error?.code)&&error.code>=0&&error.code<=16)result.backendStatus=error.code;}
 return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const result=await runLocalFastWorker(process.argv.slice(2));if(result.help)console.log(result.help);}
 catch(error){const failure=localWorkerFailure(error);console.error(JSON.stringify(failure));process.exitCode=failure.exitCode;}
}
