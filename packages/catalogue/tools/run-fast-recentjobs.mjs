import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {IdSchema} from '@skilved/types/opportunities';
import {getRuntime} from '../src/runtime.mjs';
import {extractionConfiguration} from '../src/ai/provider.mjs';
import {workerPrincipal} from '../src/worker-identity.mjs';
import {FastRecentJobsWorker} from '../src/fast-recentjobs-worker.mjs';
import {runFastIngestion} from '../src/fast-ingestion-runtime.mjs';
import {DomainError} from '../src/config.mjs';

export const usage=`Usage: worker:fast --enable-shadow <source-id> <source-revision> [--refresh-private]
Runs the supervised fast discovery/dispatch runtime for at most 24 ticks per lane
and 45 minutes of new cycles, then drains admitted work. SIGINT/SIGTERM stop admission
and drain before closing the database. Requires an existing fast shadow source policy,
active database index, verified machine identity and source-scoped ingest grant.
No source, migration, credentials, grants, quotas, scheduler or publication are provisioned.
An external service manager must restart this bounded command after a successful run.
--refresh-private enables durable rechecks of validated fast private drafts at the
existing source TTL. Imported historical and failed-evidence holds stay gated.
Historical/cached-stage adoption and source-revision reconciliation remain separate.`;

export async function runFastWorkerCommand(args,{env=process.env,signals=process,
  output=line=>console.log(JSON.stringify(line)),dependencies={}}={}) {
  if(args.length===1&&args[0]==='--help')return{help:usage};
  if(![3,4].includes(args.length)||args.length===4&&args[3]!=='--refresh-private'||args[0]!=='--enable-shadow'||!IdSchema.safeParse(args[1]).success||
      !/^[1-9]\d{0,8}$/.test(args[2]))throw new DomainError('INVALID_COMMAND');
  const deps={getRuntime,extractionConfiguration,workerPrincipal,FastRecentJobsWorker,runFastIngestion,...dependencies};
  const cancel=new AbortController(),stop=()=>cancel.abort();let runtime;
  signals.on('SIGINT',stop);signals.on('SIGTERM',stop);
  try {
    const ai=deps.extractionConfiguration(env);
    runtime=await deps.getRuntime(env);
    const principal=await deps.workerPrincipal(runtime?.config,env,{signal:cancel.signal});
    if(cancel.signal.aborted)throw new DomainError('WORKER_STOP_REQUESTED');
    const worker=new deps.FastRecentJobsWorker(runtime.db,principal,{enabled:true,
      sourceId:args[1],sourceRevision:Number(args[2]),leaseSupervision:{enabled:true},privateRefresh:args[3]==='--refresh-private',
      provider:ai.provider,model:ai.model,thinking:ai.thinking,validationThinking:ai.validationThinking,env});
    // Also verifies current policy/grant/revision and the active query before polling.
    const snapshot=await worker.fast.dispatchSnapshot();
    if(!worker.privateRefresh&&snapshot?.jobs?.some(j=>j.refresh))throw new DomainError('FAST_REFRESH_OPT_IN_REQUIRED');
    if(worker.privateRefresh)await worker.queueRefreshes({limit:1,checkOnly:true});
    const result=await deps.runFastIngestion({worker,enabled:true,signal:cancel.signal,
      onEvent:output});
    output({type:'complete',...result});return result;
  } finally {
    signals.removeListener('SIGINT',stop);signals.removeListener('SIGTERM',stop);
    await runtime?.db.terminate();
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  try { const result=await runFastWorkerCommand(process.argv.slice(2));if(result.help)console.log(result.help); }
  catch(error){console.error(JSON.stringify({error:/^[A-Z][A-Z0-9_]{0,99}$/.test(error?.code??'')?error.code:'FAST_WORKER_FAILED'}));process.exitCode=1;}
}
