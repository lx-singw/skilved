import {z} from 'zod';
import {IdSchema,InstantSchema} from '@skilved/types/opportunities';
import {DomainError} from './config.mjs';

// Production engineering targets, not fetch permission, quota or publication
// authority. Current worker/controller entry points do not import this planner.
export const FAST_INGESTION_TARGETS=Object.freeze({version:1,pollIntervalMs:120000,
  publishTargetMs:180000,backlogAlertMs:300000,maxNewBeforeRefresh:3});
const integer=(min,max)=>z.number().int().min(min).max(max);
export const FastIngestionPolicy=z.object({version:z.literal(1),pollIntervalMs:integer(120000,300000),
  publishTargetMs:integer(60000,180000),backlogAlertMs:integer(180000,600000),
  maxNewBeforeRefresh:integer(1,10)}).strict().refine(p=>p.backlogAlertMs>=p.publishTargetMs);
const Job=z.object({id:IdSchema,sourceId:IdSchema,kind:z.enum(['new','refresh']),enqueuedAt:InstantSchema,
  nextAt:InstantSchema,leaseUntil:InstantSchema.nullable().default(null),
  freshnessDeadline:InstantSchema.nullable().default(null),
  blockedBy:z.enum(['source_budget','provider_quota','authority','evidence']).nullable().default(null),
  resumeAt:InstantSchema.nullable().default(null)}).strict();
const QueueInput=z.object({at:InstantSchema,policy:FastIngestionPolicy,
  jobs:z.array(Job).max(500),newSinceRefresh:integer(0,10).default(0)}).strict();
const stamp=s=>Date.parse(s);

/** Pure next-dispatch plan. Actual transactional claims and spend admission
 * remain mandatory; no plan result grants a lease or authorizes publication. */
export function planFastIngestion(raw) {
  const {at,policy,jobs,newSinceRefresh}=QueueInput.parse(raw),now=stamp(at),ids=new Set();
  for(const j of jobs) {
    if(ids.has(j.id)||stamp(j.enqueuedAt)>now||j.kind==='new'&&j.freshnessDeadline!==null||
      j.blockedBy===null&&j.resumeAt!==null||['source_budget','provider_quota'].includes(j.blockedBy)&&j.resumeAt===null)
      throw new DomainError('FAST_INGESTION_STATE_INVALID');
    ids.add(j.id);
  }
  const available=j=>Math.max(stamp(j.nextAt),j.leaseUntil===null?now:stamp(j.leaseUntil));
  const oldest=(a,b)=>stamp(a.enqueuedAt)-stamp(b.enqueuedAt)||a.id.localeCompare(b.id);
  // A quota reset is a wake for renewed admission, never permission to silently
  // clear a block. Evidence/authority holds cannot become ready merely by aging.
  const ready=jobs.filter(j=>j.blockedBy===null&&available(j)<=now);
  const fresh=ready.filter(j=>j.kind==='new').sort(oldest),refresh=ready.filter(j=>j.kind==='refresh').sort(oldest);
  const urgent=refresh.filter(j=>j.freshnessDeadline!==null&&stamp(j.freshnessDeadline)<=now+policy.publishTargetMs)
    .sort((a,b)=>stamp(a.freshnessDeadline)-stamp(b.freshnessDeadline)||oldest(a,b));
  const selected=urgent[0]??(newSinceRefresh>=policy.maxNewBeforeRefresh?refresh[0]:null)??fresh[0]??refresh[0]??null;
  const reason=selected===null?'no_admitted_work':urgent.includes(selected)?'freshness_deadline':
    selected.kind==='refresh'&&fresh.length?'refresh_fairness':selected.kind==='new'?'new_notice':'refresh';
  const incidents=[];
  for(const j of jobs) {
    const ageMs=now-stamp(j.enqueuedAt),target=stamp(j.enqueuedAt)+policy.publishTargetMs;
    if(j.blockedBy==='authority'||j.blockedBy==='evidence')continue;
    if(j.kind==='refresh'&&j.freshnessDeadline!==null&&stamp(j.freshnessDeadline)<=now)
      incidents.push({jobId:j.id,code:'FRESHNESS_RECHECK_OVERDUE',ageMs});
    else if(j.blockedBy!==null&&stamp(j.resumeAt)>target)
      incidents.push({jobId:j.id,code:j.blockedBy==='source_budget'?'SOURCE_CAPACITY_BLOCKS_TARGET':'PROVIDER_CAPACITY_BLOCKS_TARGET',ageMs});
    else if(ageMs>=policy.backlogAlertMs)incidents.push({jobId:j.id,code:'INGESTION_BACKLOG',ageMs});
  }
  // A stale quota reset should prompt a bounded admission recheck, never spin.
  const wakes=jobs.flatMap(j=>j.blockedBy===null?[Math.max(now,available(j))]:
    ['source_budget','provider_quota'].includes(j.blockedBy)?[Math.max(now+60000,stamp(j.resumeAt))]:[]);
  const nextWakeAt=selected?at:wakes.length?new Date(Math.min(...wakes)).toISOString():null;
  const timed=jobs.filter(j=>j.blockedBy!=='authority'&&j.blockedBy!=='evidence');
  return{version:'fast_ingestion_dispatch_v1',at,selectedJobId:selected?.id??null,reason,
    nextNewSinceRefresh:selected?selected.kind==='new'?Math.min(policy.maxNewBeforeRefresh,newSinceRefresh+1):0:newSinceRefresh,
    queued:jobs.length,ready:ready.length,blocked:jobs.length-ready.length,
    evidenceOrAuthorityHeld:jobs.length-timed.length,
    overTarget:timed.filter(j=>now-stamp(j.enqueuedAt)>=policy.publishTargetMs).length,
    oldestTimedAgeMs:timed.length?Math.max(...timed.map(j=>now-stamp(j.enqueuedAt))):null,nextWakeAt,incidents,
    dispatchAdmissionRequired:true,publicationAuthorized:false};
}

const CapacityInput=z.object({policy:FastIngestionPolicy,
  forecast:z.object({dailyNotices:integer(1,100000),peakNoticesPerMinute:z.number().positive().max(10000),
    modelCallsPerNotice:integer(2,20),retryHeadroomPercent:integer(0,100)}).strict(),
  limits:z.object({pollIntervalMs:integer(1000,2592000000),minimumPermittedPollMs:integer(1000,2592000000),
    sourceCallsPerDay:integer(1,10000000),providerCallsPerDay:integer(1,10000000).nullable(),
    providerCallsPerMinute:integer(1,1000000).nullable(),processingSlots:integer(1,10000),
    measuredP95ProcessingMs:integer(1,86400000).nullable()}).strict()}).strict();

/** Capacity forecast gate; a passing estimate does not establish live SLOs,
 * permission to poll, model quality, configured authority or publish approval. */
export function assessFastIngestionCapacity(raw) {
  const {policy,forecast,limits}=CapacityInput.parse(raw),factor=1+forecast.retryHeadroomPercent/100;
  const requiredCallsPerDay=Math.ceil(forecast.dailyNotices*forecast.modelCallsPerNotice*factor);
  const requiredCallsPerMinute=Math.ceil(forecast.peakNoticesPerMinute*forecast.modelCallsPerNotice*factor);
  const requiredSlots=limits.measuredP95ProcessingMs===null?null:
    Math.max(1,Math.ceil(forecast.peakNoticesPerMinute*limits.measuredP95ProcessingMs*factor/60000));
  const failures=[];
  if(limits.pollIntervalMs>policy.pollIntervalMs)failures.push('DISCOVERY_TOO_SLOW');
  if(limits.pollIntervalMs<limits.minimumPermittedPollMs)failures.push('POLL_PERMISSION_CONFLICT');
  if(limits.sourceCallsPerDay<requiredCallsPerDay)failures.push('SOURCE_DAILY_CAPACITY_TOO_LOW');
  if(limits.providerCallsPerDay===null)failures.push('PROVIDER_DAILY_CAPACITY_UNMEASURED');
  else if(limits.providerCallsPerDay<requiredCallsPerDay)failures.push('PROVIDER_DAILY_CAPACITY_TOO_LOW');
  if(limits.providerCallsPerMinute===null)failures.push('PROVIDER_MINUTE_CAPACITY_UNMEASURED');
  else if(limits.providerCallsPerMinute<requiredCallsPerMinute)failures.push('PROVIDER_MINUTE_CAPACITY_TOO_LOW');
  if(requiredSlots===null)failures.push('PROCESSING_LATENCY_UNMEASURED');
  else {
    if(limits.processingSlots<requiredSlots)failures.push('PROCESSING_CONCURRENCY_TOO_LOW');
    if(limits.measuredP95ProcessingMs>policy.publishTargetMs)failures.push('PROCESSING_TOO_SLOW');
  }
  return{version:'fast_ingestion_capacity_v1',capacityEstimatePasses:failures.length===0,
    requiredCallsPerDay,requiredCallsPerMinute,requiredSlots,failures,
    forecast,limits,targets:policy,qualification:false,liveSloVerified:false,publicationAuthorized:false};
}
