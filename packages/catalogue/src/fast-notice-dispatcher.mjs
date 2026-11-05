import {FastRecentJobsWorker} from './fast-recentjobs-worker.mjs';
import {DomainError} from './config.mjs';
import {readyFastJobs,dispatchKind} from './fast-refresh-records.mjs';

const fail=code=>{throw new DomainError(code);};
const safeCode=code=>typeof code==='string'&&/^[A-Z][A-Z0-9_]{0,99}$/.test(code)?code:'FAST_DISPATCH_EXECUTION_FAILED';

/** One bounded shadow batch through the existing worker. Selection is advisory;
 * transactional notice claims remain the sole concurrency/ownership authority.
 * No timer, discovery fetch, history release or publication is enabled here. */
export class FastNoticeDispatcher {
  constructor(worker,{enabled=false}={}) {
    if(enabled!==true)fail('FAST_INGESTION_DISABLED');
    if(!(worker instanceof FastRecentJobsWorker))fail('FAST_DISPATCH_WORKER_REQUIRED');
    this.worker=worker;
  }
  async tick({maxJobs=20,signal}={}) {
    if(!Number.isSafeInteger(maxJobs)||maxJobs<1||maxJobs>20||signal!==undefined&&!(signal instanceof AbortSignal))fail('FAST_DISPATCH_CONFIGURATION_REQUIRED');
    if(signal?.aborted)return{state:'stopped',selected:0,results:[]};
    const snapshot=await this.worker.fast.dispatchSnapshot(),at=snapshot.observedAt;
    if(!snapshot.privateRefresh&&snapshot.jobs.some(j=>j.refresh))fail('FAST_REFRESH_OPT_IN_REQUIRED');
    const active=snapshot.jobs.filter(j=>j.state==='leased'&&j.leaseUntil>at).length;
    const due=readyFastJobs(snapshot.jobs,snapshot.sourceRevision,at)
      .sort((a,b)=>(a.refresh?.requestedAt??a.firstSeenAt).localeCompare(b.refresh?.requestedAt??b.firstSeenAt)||a.id.localeCompare(b.id));
    const kind=snapshot.privateRefresh?dispatchKind(snapshot.jobs,snapshot.sourceRevision,at,snapshot.newSinceRefresh):null;
    const eligible=kind?due.filter(j=>(j.refresh?'refresh':'new')===kind):due;
    const competing=kind&&due.some(j=>(j.refresh?'refresh':'new')!==kind);
    const fairLimit=competing?kind==='refresh'?1:3-snapshot.newSinceRefresh:maxJobs;
    const selected=eligible.slice(0,Math.min(maxJobs,fairLimit,Math.max(0,snapshot.maxConcurrentJobs-active)));
    // Await every admitted execution, including when another one rejects. A
    // rejected batch must not leave unobserved promises running in the background.
    const results=await Promise.all(selected.map(async job=>{
      if(signal?.aborted)return{id:job.id,state:'stopped'};
      try {
        const result=await this.worker.runNotice(job.id,{signal});
        if(!['done','held','pending','exception','unavailable'].includes(result?.state))return{id:job.id,state:'failed',reason:'FAST_DISPATCH_RESULT_INVALID'};
        return{id:job.id,state:result.state,
          ...(result.reason?{reason:safeCode(result.reason)}:{})};
      } catch(error) {return{id:job.id,state:'failed',reason:safeCode(error?.code)};}
    }));
    return{state:results.some(r=>r.state==='failed')?'partial_failure':signal?.aborted?'stopped':'settled',
      sourceId:snapshot.sourceId,sourceRevision:snapshot.sourceRevision,observedAt:at,
      maxConcurrentJobs:snapshot.maxConcurrentJobs,activeAtSelection:active,dueAtSelection:due.length,
      historicalRowsSkipped:snapshot.jobs.filter(j=>j.history).length,
      revisionRowsSkipped:snapshot.jobs.filter(j=>j.sourceRevision!==snapshot.sourceRevision).length,
      selected:selected.length,results,publiclyVisible:false};
  }
}
