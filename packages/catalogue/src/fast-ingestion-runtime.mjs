import {setTimeout as delay} from 'node:timers/promises';
import {InstantSchema} from '@skilved/types/opportunities';
import {DomainError} from './config.mjs';
import {FastRecentJobsWorker} from './fast-recentjobs-worker.mjs';
import {FastRecentJobsDiscovery} from './fast-recentjobs-discovery.mjs';
import {FastNoticeDispatcher} from './fast-notice-dispatcher.mjs';

const fail=code=>{throw new DomainError(code);};
const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const safeCode=code=>typeof code==='string'&&/^[A-Z][A-Z0-9_]{0,99}$/.test(code)?code:'FAST_RUNTIME_FAILED';

/** Explicit bounded in-process supervisor. Independent discovery/dispatch lanes
 * drain every admitted task before returning. No provisioning or launcher. */
export async function runFastIngestion({worker,enabled=false,signal,maxTicks=24,maxRunMs=2700000,
  wait=(ms,signal)=>delay(ms,undefined,{signal}),monotonic=()=>performance.now(),onEvent=()=>{}}={}) {
  if(enabled!==true)fail('FAST_INGESTION_DISABLED');
  if(!(worker instanceof FastRecentJobsWorker)||!worker.leaseSupervision||!integer(maxTicks,1,100)||!integer(maxRunMs,1,43200000)||
    typeof wait!=='function'||typeof monotonic!=='function'||typeof onEvent!=='function'||signal!==undefined&&!(signal instanceof AbortSignal))fail('FAST_RUNTIME_CONFIGURATION_REQUIRED');
  if(worker.privateRefresh&&!signal?.aborted){await worker.queueRefreshes({limit:1,checkOnly:true});await worker.fast.activatePrivateRefresh();}
  const discovery=new FastRecentJobsDiscovery(worker,{enabled:true}),dispatcher=new FastNoticeDispatcher(worker,{enabled:true});
  const identity=()=>[worker.fast.sourceId,worker.fast.sourceRevision,worker.principal],expected=identity();
  const started=monotonic(),cancel=new AbortController(),idleWaiters=new Set();let lastElapsed=0,fatal,halt,wakeVersion=0,dispatchWait;
  const ticks={discovery:0,dispatch:0},reasons={};
  const elapsed=()=>{const n=monotonic()-started;if(!Number.isFinite(n)||n<lastElapsed)fail('FAST_RUNTIME_CLOCK_INVALID');lastElapsed=n;return n;};
  const assertIdentity=()=>{if(identity().some((v,i)=>v!==expected[i]))fail('FAST_RUNTIME_IDENTITY_CHANGED');};
  const wall=()=>Date.parse(InstantSchema.parse(worker.now()));
  const externalStop=()=>cancel.abort();signal?.addEventListener('abort',externalStop,{once:true});if(signal?.aborted)cancel.abort();
  const notifyDispatch=()=>{wakeVersion++;dispatchWait?.abort();};
  const stopAdmission=reason=>{halt??=reason;for(const waiter of idleWaiters)waiter.abort();};
  const sleep=async(ms,lane,observedVersion)=>{
    const child=new AbortController(),abort=()=>child.abort();cancel.signal.addEventListener('abort',abort,{once:true});
    if(cancel.signal.aborted)child.abort();if(lane==='dispatch')dispatchWait=child;
    idleWaiters.add(child);
    try{
      if(halt)return;
      if(lane==='dispatch'&&observedVersion!==wakeVersion)return;
      await wait(Math.min(ms,60000,Math.max(1,maxRunMs-elapsed())),child.signal);
    }catch(error){if(!(child.signal.aborted&&error?.name==='AbortError'))throw error;}
    finally{idleWaiters.delete(child);cancel.signal.removeEventListener('abort',abort);if(dispatchWait===child)dispatchWait=undefined;}
  };
  const lane=async name=>{
    let target=wall(),lastWaiting;
    try{
      while(true){
        if(cancel.signal.aborted){reasons[name]='signal';return;}
        if(halt){reasons[name]=halt;return;}
        if(elapsed()>=maxRunMs){stopAdmission('max_runtime');reasons[name]=halt;return;}
        if(ticks[name]>=maxTicks){stopAdmission('max_ticks');reasons[name]=halt;return;}
        assertIdentity();const version=wakeVersion,at=wall();
        if(target>at){
          if(lastWaiting!==target){await onEvent({type:'waiting',lane:name,nextWakeAt:new Date(target).toISOString()});lastWaiting=target;}
          await sleep(target-at,name,version);
          // A discovery commit wakes dispatch early; otherwise bound idle probes
          // to one minute so another process's new work can also be noticed.
          if(name==='dispatch')target=Math.min(target,wall());continue;
        }
        lastWaiting=undefined;
        if(name==='discovery'){
          let result;
          try{result=await discovery.poll({signal:cancel.signal});}
          catch(error){if(error?.code!=='FAST_INGESTION_QUEUE_CAPACITY')throw error;result={state:'backpressure',queued:0,nextPollAt:new Date(wall()+60000).toISOString()};}
          ticks[name]++;if(result.queued>0)notifyDispatch();
          await onEvent({type:'tick',lane:name,ticks:ticks[name],state:result.state,queued:result.queued??0});
          if(cancel.signal.aborted)continue;
          target=Date.parse(InstantSchema.parse(result.nextPollAt));
        }else{
          if(worker.privateRefresh){
            const refresh=await worker.queueRefreshes();
            await onEvent({type:'refresh',lane:name,state:refresh.state,scheduled:refresh.scheduled,blocked:refresh.blocked});
          }
          const result=await dispatcher.tick({signal:cancel.signal});ticks[name]++;
          if(result.state==='partial_failure')fail(result.results.find(r=>r.state==='failed')?.reason??'FAST_RUNTIME_EXECUTION_FAILED');
          await onEvent({type:'tick',lane:name,ticks:ticks[name],state:result.state,selected:result.selected});
          if(cancel.signal.aborted)continue;
          const snapshot=await worker.fast.dispatchSnapshot(),now=wall();
          const active=snapshot.jobs.filter(j=>j.state==='leased'&&Date.parse(j.leaseUntil)>now).length;
          const due=snapshot.jobs.filter(j=>!j.history&&j.sourceRevision===snapshot.sourceRevision&&j.state==='queued'&&Date.parse(j.nextAt)<=now);
          const eligible=snapshot.jobs.filter(j=>!j.history&&j.sourceRevision===snapshot.sourceRevision).map(j=>Date.parse(j.state==='leased'?j.leaseUntil:j.nextAt)).filter(t=>t>now);
          target=due.length&&active<snapshot.maxConcurrentJobs||version!==wakeVersion?now:Math.min(now+60000,...eligible);
        }
      }
    }catch(error){
      if(cancel.signal.aborted&&['FAST_DISCOVERY_STOPPED','FAST_LEASE_STOPPED'].includes(error?.code)){reasons[name]='signal';return;}
      fatal??=error;cancel.abort();reasons[name]='failed';await onEvent({type:'failed',lane:name,error:safeCode(error?.code)});
    }
  };
  try{
    elapsed();const settled=await Promise.allSettled([lane('discovery'),lane('dispatch')]);
    if(fatal)throw fatal;const rejected=settled.find(r=>r.status==='rejected');if(rejected)throw rejected.reason;
    return{ticks,reasons,publiclyVisible:false};
  }finally{cancel.abort();signal?.removeEventListener('abort',externalStop);}
}
