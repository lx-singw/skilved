import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {IdSchema} from '@skilved/types/opportunities';
import {getRuntime} from '../src/runtime.mjs';
import {extractionConfiguration} from '../src/ai/provider.mjs';
import {workerPrincipal} from '../src/worker-identity.mjs';
import {FastRecentJobsWorker} from '../src/fast-recentjobs-worker.mjs';
import {runFastIngestion} from '../src/fast-ingestion-runtime.mjs';
import {DomainError} from '../src/config.mjs';

export const usage=`Usage: worker:fast --enable-shadow <source-id> <source-revision>
Runs the supervised fast discovery/dispatch runtime for at most 24 ticks per lane
and 45 minutes of new cycles, then drains admitted work. SIGINT/SIGTERM stop admission
and drain before closing the database. Requires an existing fast shadow source policy,
active database index, verified machine identity and source-scoped ingest grant.
No source, migration, credentials, grants, quotas, scheduler or publication are provisioned.
An external service manager must restart this bounded command after a successful run.
Historical/cached-stage adoption and refresh remain separate prerequisites for live cutover.`;

export async function runFastWorkerCommand(args,{env=process.env,signals=process,
  output=line=>console.log(JSON.stringify(line)),dependencies={}}={}) {
  if(args.length===1&&args[0]==='--help')return{help:usage};
  if(args.length!==3||args[0]!=='--enable-shadow'||!IdSchema.safeParse(args[1]).success||
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
      sourceId:args[1],sourceRevision:Number(args[2]),leaseSupervision:{enabled:true},
      provider:ai.provider,model:ai.model,thinking:ai.thinking,validationThinking:ai.validationThinking,env});
    // Also verifies current policy/grant/revision and the active query before polling.
    await worker.fast.dispatchSnapshot();
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
