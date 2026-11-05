import {createHash,randomUUID} from 'node:crypto';
import {z} from 'zod';
import {IdSchema,InstantSchema,DateSchema} from '@skilved/types/opportunities';
import {Source,Reason} from './schemas.mjs';
import {DomainError} from './config.mjs';
import {FAST_MIGRATION_COLLECTIONS,canonical} from './fast-ingestion-migration.mjs';
import {parseFastJob,parseFastNotice,parseFastPoll,parseFastCursor,parseFastSlots,parseFastPacing,encodeFastJob} from './fast-ingestion-store.mjs';
import {RefreshFeature,DispatchCounter} from './fast-refresh-records.mjs';
import {RECENTJOBS_CATEGORY_FEED} from './publisher-feed-policy.mjs';
import {RECENTJOBS_INDEX,assertSourceTarget} from './worker-policy.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex'),payload=value=>({json:JSON.stringify(value)});
const fail=code=>{throw new DomainError(code);},digest=z.string().regex(/^[a-f0-9]{64}$/);
const MAX_DOCS=4000,MAX_BYTES=8000000,MAX_JOBS=100,MAX_AGE=900000;
export const RSS_TRANSITION_COLLECTIONS=Object.freeze([...new Set([...FAST_MIGRATION_COLLECTIONS,
 ...['ingestion_notices','ingestion_jobs','ingestion_cursors','ingestion_polls','ingestion_slots','ingestion_pacing','ingestion_discovery_pages','ingestion_events',
 'ingestion_refresh_features','ingestion_refresh_watches','ingestion_refresh_versions','ingestion_dispatch','ingestion_migrations','ingestion_migration_notices','ingestion_adoptions',
 'ingestion_rss_adoptions','ingestion_revision_archives','fast_worker_jobs','fast_worker_leases','fast_worker_queue','fast_worker_holds','fast_worker_exceptions','fast_worker_health'].map(name=>'m0_'+name)])].sort());
const Doc=z.object({id:IdSchema,data:z.record(z.unknown())}).strict();
const Snapshot=z.object({version:z.literal(1),capturedAt:InstantSchema,collections:z.record(z.array(Doc))}).strict();
const Input=z.object({version:z.literal(1),sourceId:IdSchema,snapshot:Snapshot,
 evidence:z.object({feedUrl:z.literal(RECENTJOBS_CATEGORY_FEED),feedHash:digest,retrievedAt:InstantSchema,qualificationRef:z.string().min(3).max(2000)}).strict(),
 externalRuns:z.array(z.object({id:IdSchema,sourceId:IdSchema,sourceRevision:z.number().int().positive(),state:z.enum(['scheduled','running','complete']),plannedAt:InstantSchema}).strict()).max(20)}).strict();
const decode=row=>{try{const data=JSON.parse(row.data.json);if(data&&typeof data==='object'&&!Array.isArray(data))return data;}catch{}fail('RSS_TRANSITION_DATA_INVALID');};
const snap=row=>({exists:true,data:()=>row.data});
function inventory(snapshot){
 if(Object.keys(snapshot.collections).sort().join('|')!==RSS_TRANSITION_COLLECTIONS.join('|'))fail('RSS_TRANSITION_INVENTORY_INCOMPLETE');
 const collections={};let count=0;
 for(const name of RSS_TRANSITION_COLLECTIONS){const rows=snapshot.collections[name];count+=rows.length;
  if(new Set(rows.map(row=>row.id)).size!==rows.length)fail('RSS_TRANSITION_DUPLICATE_DOCUMENT');collections[name]=[...rows].sort((a,b)=>a.id.localeCompare(b.id));}
 if(count>MAX_DOCS||Buffer.byteLength(canonical(snapshot))>MAX_BYTES)fail('RSS_TRANSITION_LIMIT');
 return{sha256:hash(canonical(collections)),count};
}
async function collect(tx,db,capturedAt){
 const collections={};let count=0;
 for(const name of RSS_TRANSITION_COLLECTIONS){const rows=await tx.get(db.collection(name).limit(MAX_DOCS+1));count+=rows.size;if(count>MAX_DOCS)fail('RSS_TRANSITION_LIMIT');collections[name]=rows.docs.map(doc=>({id:doc.id,data:doc.data()}));}
 const snapshot={version:1,capturedAt,collections};inventory(snapshot);return snapshot;
}
/** Read-only private retained-state inventory. Does not pause, revoke or apply. */
export async function collectRssTransitionSnapshot(db,{now=()=>new Date().toISOString()}={}){
 const at=InstantSchema.parse(now());return db.runTransaction(tx=>collect(tx,db,at),{readOnly:true});
}
/** Initial HTML-to-RSS transition only. Held jobs keep their exact ages,
 * attempts, evidence and holds. Unfinished/completed/refresh work refuses. */
export function planRssTransition(raw,{now=()=>new Date().toISOString()}={}){
 const input=Input.parse(raw),{sourceId,snapshot,evidence}=input,at=InstantSchema.parse(now()),retained=inventory(snapshot),tables=snapshot.collections;
 const sourceRow=tables.m0_sources.find(row=>row.id===sourceId);if(!sourceRow)fail('RSS_TRANSITION_SOURCE_REQUIRED');const source=Source.parse(decode(sourceRow));
 if(source.id!==sourceId||source.paused||source.automation?.mode!=='shadow'||!source.automation.fastIngestion||!source.automation.discovery||
  source.automation.publisherFeed!==undefined||source.permission.method!=='recentjobs_html'||!source.urls.includes(RECENTJOBS_INDEX)||source.revision>=Number.MAX_SAFE_INTEGER)fail('RSS_TRANSITION_SOURCE_UNSUPPORTED');
 const version=tables.m0_source_versions.find(row=>row.id===hash(source.id+':'+source.revision));
 if(!version||canonical(Source.parse(decode(version)))!==canonical(source))fail('RSS_TRANSITION_SOURCE_VERSION_REQUIRED');
 const blockers=new Set(),block=code=>blockers.add(code),changes=[];
 const current=snapshot.capturedAt<=at&&Date.parse(at)-Date.parse(snapshot.capturedAt)<=MAX_AGE;
 if(evidence.retrievedAt>snapshot.capturedAt||Date.parse(snapshot.capturedAt)-Date.parse(evidence.retrievedAt)>86400000)block('FEED_EVIDENCE_NOT_CURRENT');
 if(input.externalRuns.some(run=>run.sourceId===sourceId&&run.state!=='complete'))block('SCHEDULED_OR_RUNNING_WORK');
 for(const row of tables.m0_workers)if(row.data.active===true&&row.data.sources?.includes(sourceId))block('WORKER_GRANT_ACTIVE');
 const rows=name=>tables['m0_'+name].filter(row=>{let record;try{record=JSON.parse(row.data.json);}catch{}return record?.sourceId===sourceId||row.data.sourceId===sourceId;});
 const target=Source.parse({...source,revision:source.revision+1,urls:source.urls.includes(RECENTJOBS_CATEGORY_FEED)?source.urls:[...source.urls,RECENTJOBS_CATEGORY_FEED],
  automation:{...source.automation,publisherFeed:'rss_shadow_v1',discovery:{maxPages:1}}});
 const change=(collection,row,after)=>changes.push({collection:'m0_'+collection,id:row.id,before:row.data,after});
 if(rows('worker_queue').length||rows('fast_worker_queue').length)block('QUEUE_NOT_DRAINED');
 for(const row of [...rows('worker_jobs'),...rows('fast_worker_jobs')])if(['pending','running'].includes(decode(row).state))block('UNFINISHED_EXECUTION');
 for(const row of [...tables.m0_worker_leases,...tables.m0_fast_worker_leases]){
  const record=decode(row);if((row.id===sourceId||record.sourceId===sourceId)&&record.until>snapshot.capturedAt)block('EXECUTION_LEASE_ACTIVE');
 }
 const notices=new Map(rows('ingestion_notices').map(row=>{const notice=parseFastNotice(snap(row));
  if(notice.sourceId!==sourceId||notice.id!==row.id||row.data.sourceId!==sourceId||row.data.firstSeenAt!==notice.firstSeenAt||
    hash(sourceId+':'+assertSourceTarget(notice.url))!==row.id||notice.firstSeenAt>snapshot.capturedAt)fail('RSS_TRANSITION_NOTICE_INVALID');return[row.id,notice];}));
 const jobs=rows('ingestion_jobs');if(jobs.length>MAX_JOBS)block('JOB_CAPACITY');if(jobs.length!==notices.size)block('NOTICE_JOB_MISMATCH');
 for(const row of jobs){const job=parseFastJob(snap(row)),notice=notices.get(row.id);
  if(!notice||job.id!==row.id||job.sourceId!==sourceId||job.url!==notice.url||job.firstSeenAt!==notice.firstSeenAt||canonical(job.history??null)!==canonical(notice.history??null))fail('RSS_TRANSITION_NOTICE_INVALID');
  if(job.sourceRevision!==source.revision)block('HELD_REVISION_MISMATCH');
  if(job.state!=='held'||job.refresh)block('HELD_ONLY_REQUIRED');if(job.updatedAt>snapshot.capturedAt)block('FUTURE_STATE');
  if(job.state==='held'&&!job.refresh&&job.sourceRevision===source.revision)change('ingestion_jobs',row,{...row.data,...encodeFastJob({...job,sourceRevision:target.revision})});
 }
 if(rows('ingestion_refresh_watches').length)block('REFRESH_ADOPTION_REQUIRED');
 for(const row of rows('ingestion_polls')){const poll=parseFastPoll(snap(row));if(poll.id!==row.id||poll.sourceRevision>source.revision||poll.updatedAt>snapshot.capturedAt)fail('RSS_TRANSITION_POLL_INVALID');if(poll.leaseUntil>snapshot.capturedAt)block('POLL_LEASE_ACTIVE');}
 const cursorRow=tables.m0_ingestion_cursors.find(row=>row.id===sourceId);
 if(cursorRow){const cursor=parseFastCursor(snap(cursorRow)),pollRow=tables.m0_ingestion_polls.find(row=>row.id===cursor.pollId),poll=pollRow?parseFastPoll(snap(pollRow)):null;
  if(cursor.sourceId!==sourceId||cursor.sourceRevision!==source.revision||!poll||poll.sourceId!==sourceId||poll.sourceRevision!==source.revision||poll.state!==cursor.state)fail('RSS_TRANSITION_POLL_INVALID');change('ingestion_cursors',cursorRow,null);}
 const slotsRow=tables.m0_ingestion_slots.find(row=>row.id===sourceId);
 if(slotsRow){const slots=parseFastSlots(snap(slotsRow));if(slots.sourceId!==sourceId)fail('RSS_TRANSITION_DATA_INVALID');if(Object.values(slots.active).some(slot=>slot.until>snapshot.capturedAt))block('NOTICE_LEASE_ACTIVE');}
 const pacingRow=tables.m0_ingestion_pacing.find(row=>row.id===sourceId);if(pacingRow&&parseFastPacing(snap(pacingRow)).sourceId!==sourceId)fail('RSS_TRANSITION_DATA_INVALID');
 const featureRow=tables.m0_ingestion_refresh_features.find(row=>row.id===sourceId);
 if(featureRow){const feature=RefreshFeature.parse(decode(featureRow));if(feature.sourceId!==sourceId||feature.sourceRevision!==source.revision||feature.activatedAt>snapshot.capturedAt)fail('RSS_TRANSITION_REFRESH_INVALID');change('ingestion_refresh_features',featureRow,{...featureRow.data,...payload({...feature,sourceRevision:target.revision})});}
 const counterRow=tables.m0_ingestion_dispatch.find(row=>row.id===sourceId);
 if(counterRow){const counter=DispatchCounter.parse(decode(counterRow));if(counter.sourceId!==sourceId||counter.sourceRevision!==source.revision)fail('RSS_TRANSITION_COUNTER_INVALID');change('ingestion_dispatch',counterRow,{...counterRow.data,...payload({...counter,sourceRevision:target.revision})});}
 for(const row of rows('model_budgets')){const budget=decode(row);if(!DateSchema.safeParse(budget.date).success||!Number.isSafeInteger(budget.calls)||budget.calls<0||row.id!==hash(sourceId+':'+budget.date))block('SPEND_HISTORY_INVALID');}
 if(changes.some(row=>Buffer.byteLength(canonical(row))>900000))block('ARCHIVE_CAPACITY');
 const body={version:'rss_held_transition_v1',sourceId,sourceRevision:source.revision,targetSourceRevision:target.revision,capturedAt:snapshot.capturedAt,
  inventorySha256:retained.sha256,retainedDocuments:retained.count,sourceSha256:hash(canonical(source)),targetSource:target,evidence,externalRuns:input.externalRuns,
  heldJobs:jobs.length,changes,staticBlockers:[...blockers].sort(),heldJobsReleased:false,quotaWrites:false,cacheAliases:false,publication:false};
 return{...body,sha256:hash(canonical(body)),blockers:[...blockers,...(current?[]:['SNAPSHOT_NOT_CURRENT'])].sort(),ready:blockers.size===0&&current};
}
const archive=(plan,row)=>({id:hash(plan.sha256+':'+row.collection+':'+row.id),data:payload({version:'rss_held_transition_v1',sourceId:plan.sourceId,planSha256:plan.sha256,...row})});
/** Normal Source-role API. Recollects the complete reviewed inventory and
 * atomically archives/rebinds held state. Grants, quotas and caches are read only. */
export async function adoptRssTransition(catalogue,token,input,{expectedSha256,reason}={}){
 Reason.parse(reason);if(!digest.safeParse(expectedSha256).success)fail('RSS_TRANSITION_REVIEW_REQUIRED');
 const uid=await catalogue.identity(token),plan=planRssTransition(input,{now:catalogue.now});
 if(plan.sha256!==expectedSha256)fail('RSS_TRANSITION_HASH_MISMATCH');if(plan.staticBlockers.length)fail('RSS_TRANSITION_BLOCKED');
 return catalogue.db.runTransaction(async tx=>{
  await catalogue.operator(tx,uid,'source');const at=InstantSchema.parse(catalogue.now());
  const sourceRef=catalogue.ref('sources',plan.sourceId),versionRef=catalogue.ref('source_versions',hash(plan.sourceId+':'+plan.targetSourceRevision)),receiptRef=catalogue.ref('ingestion_rss_adoptions',plan.sha256);
  const [sourceRow,versionRow,receiptRow]=await Promise.all([tx.get(sourceRef),tx.get(versionRef),tx.get(receiptRef)]);
  const archives=plan.changes.map(row=>archive(plan,row)),archiveRows=await Promise.all(archives.map(row=>tx.get(catalogue.ref('ingestion_revision_archives',row.id))));
  const receiptBody={version:'rss_held_transition_v1',sourceId:plan.sourceId,sourceRevision:plan.sourceRevision,targetSourceRevision:plan.targetSourceRevision,
   planSha256:plan.sha256,inventorySha256:plan.inventorySha256,targetSha256:hash(canonical(plan.targetSource)),heldJobs:plan.heldJobs,archives:archives.length,quotaWrites:false,publication:false};
  if(receiptRow.exists){const saved=decode({data:receiptRow.data()});const {actor,at:appliedAt,...rest}=saved;
   if(canonical(rest)!==canonical(receiptBody)||!IdSchema.safeParse(actor).success||!InstantSchema.safeParse(appliedAt).success||appliedAt<plan.capturedAt||appliedAt>at||
    !sourceRow.exists||!versionRow.exists||canonical(Source.parse(JSON.parse(sourceRow.data().json)))!==canonical(plan.targetSource)||canonical(Source.parse(JSON.parse(versionRow.data().json)))!==canonical(plan.targetSource)||
    archiveRows.some((row,i)=>!row.exists||canonical(row.data())!==canonical(archives[i].data)))fail('RSS_TRANSITION_REPLAY_CONFLICT');
   return{status:'verified',revision:plan.targetSourceRevision,heldJobs:plan.heldJobs,publication:false};
  }
  if(!plan.ready||versionRow.exists||archiveRows.some(row=>row.exists))fail('RSS_TRANSITION_BLOCKED');
  const current=await collect(tx,catalogue.db,input.snapshot.capturedAt);if(inventory(current).sha256!==plan.inventorySha256)fail('RSS_TRANSITION_INVENTORY_CHANGED');
  // Explicit point reads bind targets even if indexed metadata was corrupted.
  for(const row of plan.changes){const existing=await tx.get(catalogue.db.collection(row.collection).doc(row.id));if(!existing.exists||canonical(existing.data())!==canonical(row.before))fail('RSS_TRANSITION_INVENTORY_CHANGED');}
  await catalogue.operator(tx,uid,'source');
  const finalAt=InstantSchema.parse(catalogue.now());if(finalAt<at||finalAt<plan.capturedAt||Date.parse(finalAt)-Date.parse(plan.capturedAt)>MAX_AGE)fail('RSS_TRANSITION_STALE');
  for(let i=0;i<plan.changes.length;i++){const row=plan.changes[i],ref=catalogue.db.collection(row.collection).doc(row.id);if(row.after===null)tx.delete(ref);else tx.set(ref,row.after);tx.create(catalogue.ref('ingestion_revision_archives',archives[i].id),archives[i].data);}
  tx.set(sourceRef,{...sourceRow.data(),...payload(plan.targetSource)});tx.create(versionRef,payload(plan.targetSource));tx.create(receiptRef,payload({...receiptBody,actor:uid,at:finalAt}));
  tx.create(catalogue.ref('audit',randomUUID()),payload({action:'source.rss_held_adopt',subject:plan.sourceId,actor:uid,at:finalAt,reason,planSha256:plan.sha256}));
  return{status:'adopted',revision:plan.targetSourceRevision,heldJobs:plan.heldJobs,publication:false};
 });
}
