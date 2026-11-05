import {parseFastJob,encodeFastJob} from './fast-ingestion-store.mjs';
import {RefreshWatch,RefreshTicket,fastExecutionId,refreshHash} from './fast-refresh-records.mjs';
import {DomainError} from './config.mjs';
const fail=code=>{throw new DomainError(code);},payload=x=>({json:JSON.stringify(x)});
const value=s=>s.exists?JSON.parse(s.data().json):null;

/** Bounded, default-off renewal of already validated FAST private notices.
 * Imported history and failed evidence are never released by aging. */
export async function queueDuePrivateRefreshes(store,{limit=20,checkOnly=false}={}) {
 if(!Number.isSafeInteger(limit)||limit<1||limit>20||typeof checkOnly!=='boolean')fail('FAST_REFRESH_CONFIGURATION_REQUIRED');
 if(!store.privateRefresh)return{state:'disabled',scheduled:0,blocked:0};
 if(!checkOnly)await store.activatePrivateRefresh();
 return store.transaction(async(tx,source,at)=>{
  const due=await tx.get(store.db.collection('m0_ingestion_refresh_watches').where('sourceId','==',source.id).where('state','==','waiting').where('nextAt','<=',at).orderBy('nextAt').limit(limit));
  if(checkOnly)return{state:'ready',scheduled:0,blocked:0};
  const active=await store.activeJobs(tx,source),slots=value(await tx.get(store.ref('ingestion_slots',source.id)));
  const plans=[];let available=500-active.length;
  for(const snapshot of due.docs){
   const watch=RefreshWatch.parse(value(snapshot));
   if(watch.sourceId!==source.id||watch.noticeId!==snapshot.id||['sourceId','state','nextAt'].some(k=>snapshot.data()[k]!==watch[k])||watch.updatedAt>at)fail('FAST_REFRESH_STATE_INVALID');
   const jobRef=store.ref('ingestion_jobs',watch.noticeId),jobRow=await tx.get(jobRef),job=parseFastJob(jobRow);
   const [noticeRow,executionRow,draftRow,publicRow]=await Promise.all([
    tx.get(store.ref('ingestion_notices',watch.noticeId)),tx.get(store.ref('fast_worker_jobs',watch.executionId)),
    tx.get(store.ref('drafts',watch.recordId)),tx.get(store.ref('public',watch.recordId))]);
   const draft=value(draftRow),execution=value(executionRow),notice=value(noticeRow);
   let reason;
   if(watch.sourceRevision!==source.revision)reason='source_revision';
   else if(!job||job.history||job.sourceId!==source.id||job.sourceRevision!==source.revision||job.id!==watch.noticeId||job.state!=='complete'||job.stage!=='complete'||job.outcome!=='validated_private'||
    !notice||notice.history||notice.sourceId!==source.id||notice.url!==job.url||notice.firstSeenAt!==job.firstSeenAt||
    job.updatedAt>at||refreshHash(jobRow.data().json)!==watch.jobSha256||fastExecutionId(job)!==watch.executionId||
    (job.refresh?.generation??0)!==watch.generation||slots?.active?.[job.id]?.until>at)reason='binding_changed';
   else if(!draft||publicRow.exists||draft.publication?.approved!==false||draft.publication?.previouslyPublic!==false||
    ['withdrawn','closed','archived'].includes(draft.lifecycle)||draft.publication?.disposition==='withheld')reason='public_or_reviewed';
   else if(draft.id!==watch.recordId||refreshHash(draftRow.data().json)!==watch.draftSha256)reason='binding_changed';
   else if(!execution||execution.state!=='done'||execution.fastNoticeId!==job.id||execution.sourceId!==source.id||execution.sourceRevision!==source.revision||
    execution.recordId!==watch.recordId||refreshHash(executionRow.data().json)!==watch.executionSha256)reason='execution_changed';
   if(reason){plans.push({ref:snapshot.ref,watch,reason});continue;}
   if(available===0)continue;
   if(watch.generation>=1000000)fail('FAST_REFRESH_GENERATIONS_EXHAUSTED');
   const archiveId=refreshHash(source.id+':'+job.id+':'+source.revision+':'+watch.generation),archiveRef=store.ref('ingestion_refresh_versions',archiveId);
   if((await tx.get(archiveRef)).exists){plans.push({ref:snapshot.ref,watch,reason:'archive_conflict'});continue;}
   const refresh=RefreshTicket.parse({version:'private_v1',generation:watch.generation+1,requestedAt:at,archiveId,
    previousExecutionId:watch.executionId,previousJobSha256:watch.jobSha256,previousDraftSha256:watch.draftSha256,previousExecutionSha256:watch.executionSha256});
   const next={...job,refresh,cycleAttempts:0,state:'queued',stage:'fetch',nextAt:at,updatedAt:at,
    lease:null,leaseUntil:null,principal:null,fetchReservation:null,timeline:{}};
   delete next.outcome;delete next.blockedBy;
   const data=encodeFastJob(next);
   plans.push({ref:snapshot.ref,watch,jobRef,data,archiveRef,archive:{version:'private_v1',sourceId:source.id,sourceRevision:source.revision,
    noticeId:job.id,generation:watch.generation,archivedAt:at,jobData:jobRow.data(),watchData:snapshot.data(),recordRevision:draft.revision},
    nextWatch:{...watch,state:'scheduled',generation:refresh.generation,executionId:fastExecutionId(next),updatedAt:at}});available--;
  }
  let scheduled=0,blocked=0;
  for(const p of plans){
   const watch=p.reason?{...p.watch,state:'blocked',reason:p.reason,updatedAt:at}:p.nextWatch;
   tx.set(p.ref,{...payload(RefreshWatch.parse(watch)),sourceId:source.id,state:watch.state,nextAt:watch.nextAt});
   if(p.reason){blocked++;store.event(tx,at,'refresh.blocked',p.watch.noticeId);}
   else{tx.create(p.archiveRef,{...payload(p.archive),sourceId:source.id,noticeId:p.watch.noticeId,generation:p.watch.generation});tx.set(p.jobRef,p.data);scheduled++;store.event(tx,at,'refresh.queued',p.watch.noticeId);}
  }
  return{state:available===0?'backpressure':'settled',scheduled,blocked};
 },{readOnly:checkOnly});
}

/** Repeated before every refresh effect; a manual edit/review or modified
 * previous execution fences cached/model/draft writes while charges survive. */
export async function assertPrivateRefreshBinding(tx,store,row,ticket){
 if(!store.privateRefresh||!row.refresh||JSON.stringify(row.refresh)!==JSON.stringify(ticket)||row.history)fail('FAST_REFRESH_BINDING_CHANGED');
 const [archiveRow,priorRow]=await Promise.all([tx.get(store.ref('ingestion_refresh_versions',ticket.archiveId)),tx.get(store.ref('fast_worker_jobs',ticket.previousExecutionId))]);
 const archive=value(archiveRow),prior=value(priorRow);
 if(!archive||archive.version!=='private_v1'||archive.sourceId!==row.sourceId||archive.sourceRevision!==row.sourceRevision||archive.noticeId!==row.id||archive.generation!==ticket.generation-1||
  !archive.jobData?.json||refreshHash(archive.jobData.json)!==ticket.previousJobSha256||!archive.watchData?.json||archive.archivedAt!==ticket.requestedAt)fail('FAST_REFRESH_BINDING_CHANGED');
 const watch=RefreshWatch.parse(JSON.parse(archive.watchData.json)),old=JSON.parse(archive.jobData.json);
 if(watch.noticeId!==row.id||watch.sourceId!==row.sourceId||watch.sourceRevision!==row.sourceRevision||watch.generation!==archive.generation||watch.state!=='waiting'||
  watch.executionId!==ticket.previousExecutionId||watch.jobSha256!==ticket.previousJobSha256||watch.draftSha256!==ticket.previousDraftSha256||watch.executionSha256!==ticket.previousExecutionSha256||
  old.history||old.state!=='complete'||old.outcome!=='validated_private'||old.firstSeenAt!==row.firstSeenAt||old.url!==row.url||
  !prior||prior.state!=='done'||prior.sourceId!==row.sourceId||prior.sourceRevision!==row.sourceRevision||prior.fastNoticeId!==row.id||prior.recordId!==watch.recordId||refreshHash(priorRow.data().json)!==ticket.previousExecutionSha256)fail('FAST_REFRESH_BINDING_CHANGED');
 const [draft,projection]=await Promise.all([tx.get(store.ref('drafts',watch.recordId)),tx.get(store.ref('public',watch.recordId))]);
 if(!draft.exists||projection.exists||refreshHash(draft.data().json)!==ticket.previousDraftSha256)fail('FAST_REFRESH_BINDING_CHANGED');
}
