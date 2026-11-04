import {createHash,randomUUID} from 'node:crypto';
import {z} from 'zod';
import {IdSchema,InstantSchema} from '@skilved/types/opportunities';
import {Source} from './schemas.mjs';
import {DomainError} from './config.mjs';
import {assertSourceTarget} from './worker-policy.mjs';

const hash=s=>createHash('sha256').update(s).digest('hex');
const payload=value=>({json:JSON.stringify(value)});
const jobPayload=row=>({...payload(row),sourceId:row.sourceId,state:row.state,nextAt:row.nextAt,firstSeenAt:row.firstSeenAt});
const ownedPayload=(claim,row)=>claim.kind==='notice'?jobPayload(row):payload(row);
const value=row=>row.exists?JSON.parse(row.data().json):null;
const fail=code=>{throw new DomainError(code);};
const Reservation=z.object({token:z.string().uuid(),at:InstantSchema,consumed:z.boolean()}).strict();
const History=z.object({inventorySha256:z.string().regex(/^[a-f0-9]{64}$/),firstSeenBasis:z.literal('legacy_observation_bound'),sloEligible:z.literal(false)}).strict();
const Owned={id:IdSchema,sourceId:IdSchema,sourceRevision:z.number().int().positive(),updatedAt:InstantSchema,
  lease:z.string().uuid().nullable(),leaseUntil:InstantSchema.nullable(),principal:z.string().email().nullable(),fetchReservation:Reservation.nullable()};
const Poll=z.object({...Owned,createdAt:InstantSchema,bucket:z.number().int().nonnegative(),state:z.enum(['leased','complete'])}).strict()
  .refine(p=>p.state==='leased'?p.lease!==null&&p.leaseUntil!==null&&p.principal!==null:p.lease===null&&p.leaseUntil===null);
const Job=z.object({...Owned,url:z.string().url(),firstSeenAt:InstantSchema,state:z.enum(['queued','leased','held','complete']),
  stage:z.enum(['fetch','extract','validate','complete']),nextAt:InstantSchema,attempts:z.number().int().nonnegative().safe(),
  timeline:z.object({startedAt:InstantSchema.optional(),retrievedAt:InstantSchema.optional(),extractedAt:InstantSchema.optional(),privateReadyAt:InstantSchema.optional()}).strict(),
  blockedBy:z.enum(['source_budget','provider_quota','authority','evidence']).optional(),outcome:z.literal('validated_private').optional(),history:History.optional()}).strict()
  .refine(j=>j.firstSeenAt<=j.updatedAt&&Object.values(j.timeline).every(t=>t>=j.firstSeenAt&&t<=j.updatedAt)&&
    (j.state==='leased'?j.lease!==null&&j.leaseUntil!==null&&j.principal!==null:j.lease===null&&j.leaseUntil===null)&&
    (j.stage==='fetch'||j.timeline.retrievedAt!==undefined)&&
    (!['validate','complete'].includes(j.stage)||j.timeline.extractedAt!==undefined)&&
    (j.stage!=='complete'||j.state==='complete'&&j.timeline.privateReadyAt!==undefined&&j.outcome==='validated_private'));
const Notice=z.object({id:IdSchema,sourceId:IdSchema,url:z.string().url(),firstSeenAt:InstantSchema,firstPollId:IdSchema.nullable(),history:History.optional()}).strict().refine(n=>n.firstPollId!==null||n.history!==undefined);
const Cursor=z.object({sourceId:IdSchema,sourceRevision:z.number().int().positive(),pollId:IdSchema,state:z.enum(['leased','complete'])}).strict();
const Slots=z.object({sourceId:IdSchema,active:z.record(z.object({lease:z.string().uuid(),until:InstantSchema}).strict())}).strict()
  .refine(s=>Object.keys(s.active).length<=20&&Object.keys(s.active).every(k=>IdSchema.safeParse(k).success));
const Pacing=z.object({sourceId:IdSchema,nextAt:InstantSchema,lastAdmittedAt:InstantSchema.nullable()}).strict();
const record=(snap,schema)=>{if(!snap.exists)return null;try{const row=schema.parse(value(snap));
  if(schema===Job&&['sourceId','state','nextAt','firstSeenAt'].some(k=>snap.data()[k]!==row[k]))fail('FAST_INGESTION_STATE_INVALID');
  return row;}catch{fail('FAST_INGESTION_STATE_INVALID');}};
export const FastSourcePolicy=z.object({version:z.literal('shadow_v1'),
  discoveryIntervalMs:z.number().int().min(120000).max(300000),
  maxConcurrentJobs:z.number().int().min(1).max(20),leaseMs:z.number().int().min(30000).max(600000)}).strict();

/** Explicit source-schema extension for this separate shadow coordinator.
 * Existing Source APIs/worker do not accept or enable this policy yet. */
export function parseFastIngestionSource(raw) {
  const input=structuredClone(raw),policy=FastSourcePolicy.parse(input?.automation?.fastIngestion);
  delete input.automation.fastIngestion;
  const source=Source.parse(input);
  if(source.automation?.mode!=='shadow'||source.permission.method!=='recentjobs_html')fail('FAST_INGESTION_SHADOW_ONLY');
  return{...source,automation:{...source.automation,fastIngestion:policy}};
}

/** Default-off backend coordinator. It owns no fetch/model/publish capability.
 * Job ownership is independent of the source's atomic fetch pacing clock. */
export class FastIngestionStore {
  constructor(db,principal,{enabled=false,sourceId,sourceRevision,now=()=>new Date().toISOString(),assertAdmission}={}) {
    if(enabled!==true)fail('FAST_INGESTION_DISABLED');
    if(!/^[^\s@]+@[^\s@]+$/.test(principal??'')||!IdSchema.safeParse(sourceId).success||
      !Number.isSafeInteger(sourceRevision)||sourceRevision<1||typeof now!=='function'||
      assertAdmission!==undefined&&typeof assertAdmission!=='function')fail('WORKER_CONFIGURATION_REQUIRED');
    Object.assign(this,{db,principal,sourceId,sourceRevision,now,assertAdmission});
    this.actor='worker_'+hash(principal).slice(0,40);
  }
  ref(collection,id){IdSchema.parse(id);return this.db.collection('m0_'+collection).doc(id);}
  async transaction(work,{readOnly=false}={}) {
    return this.db.runTransaction(async tx=>{
      let at=this.now();InstantSchema.parse(at);
      const [sourceRow,grantRow]=await Promise.all([tx.get(this.ref('sources',this.sourceId)),tx.get(this.ref('workers',this.actor))]);
      const grant=grantRow.data(),raw=value(sourceRow);
      if(!grant?.active||grant.principal!==this.principal||!grant.sources?.includes(this.sourceId)||
        grant.roles?.length!==1||grant.roles[0]!=='ingest'||grant.expiresAt!==undefined&&
        (!InstantSchema.safeParse(grant.expiresAt).success||grant.expiresAt<=at))fail('WORKER_FORBIDDEN');
      if(!raw||raw.paused)fail('SOURCE_PAUSED');
      const source=parseFastIngestionSource(raw);
      if(source.id!==this.sourceId||source.revision!==this.sourceRevision)fail('SOURCE_CHANGED');
      if(!source.categories.includes('apprenticeship'))fail('SOURCE_POLICY_REQUIRED');
      await this.assertAdmission?.(source,grant,this.principal);
      const checkClock=()=>{const current=this.now();InstantSchema.parse(current);if(current<at)fail('FAST_INGESTION_STATE_INVALID');if(grant.expiresAt!==undefined&&grant.expiresAt<=current)fail('WORKER_FORBIDDEN');return current;};
      at=checkClock();const result=await work(tx,source,at);checkClock();return result;
    },readOnly?{readOnly:true}:undefined);
  }
  event(tx,at,action,subject){tx.create(this.ref('ingestion_events',randomUUID()),{...payload({version:1,at,action,subject,sourceId:this.sourceId,actor:this.actor}),sourceId:this.sourceId,at,action});}
  lease(source,at){return{lease:randomUUID(),leaseUntil:new Date(Date.parse(at)+source.automation.fastIngestion.leaseMs).toISOString(),principal:this.principal};}
  async asserted(tx,claim,at) {
    if(!claim||claim.sourceId!==this.sourceId||claim.sourceRevision!==this.sourceRevision||!z.string().uuid().safeParse(claim.lease).success||!['poll','notice'].includes(claim.kind)||!IdSchema.safeParse(claim.id).success)fail('STALE_LEASE');
    const ref=this.ref(claim.kind==='poll'?'ingestion_polls':'ingestion_jobs',claim.id),row=record(await tx.get(ref),claim.kind==='poll'?Poll:Job);
    if(!row||row.sourceRevision!==this.sourceRevision||row.sourceId!==this.sourceId||row.lease!==claim.lease||
      row.principal!==this.principal||row.state!=='leased'||!InstantSchema.safeParse(row.leaseUntil).success||row.leaseUntil<=at||row.updatedAt>at)fail('STALE_LEASE');
    if(claim.kind==='notice') {
      const notice=record(await tx.get(this.ref('ingestion_notices',claim.id)),Notice);
      if(!notice||notice.id!==claim.id||notice.sourceId!==this.sourceId||notice.firstSeenAt!==row.firstSeenAt||notice.url!==row.url||JSON.stringify(notice.history??null)!==JSON.stringify(row.history??null))fail('FAST_INGESTION_STATE_INVALID');
    }
    return{ref,row};
  }
  async poll() {
    return this.transaction(async(tx,source,at)=>{
      const policy=source.automation.fastIngestion,bucket=Math.floor(Date.parse(at)/policy.discoveryIntervalMs);
      const cursorRef=this.ref('ingestion_cursors',source.id),cursor=record(await tx.get(cursorRef),Cursor);
      if(cursor&&(cursor.sourceId!==source.id||cursor.sourceRevision!==source.revision))fail('SOURCE_CHANGED');
      const id=cursor?.state==='leased'?cursor.pollId:hash(source.id+':fast-poll:'+bucket);
      const ref=this.ref('ingestion_polls',id),previous=record(await tx.get(ref),Poll);
      const nextPollAt=new Date((bucket+1)*policy.discoveryIntervalMs).toISOString();
      if(previous&&(previous.sourceRevision!==source.revision||previous.sourceId!==source.id||previous.id!==id))fail('SOURCE_CHANGED');
      if(cursor?.state==='leased'&&!previous||cursor?.pollId===id&&previous&&cursor.state!==previous.state)fail('FAST_INGESTION_STATE_INVALID');
      if(previous?.updatedAt>at)fail('FAST_INGESTION_STATE_INVALID');
      if(previous?.state==='complete')return{state:'waiting',nextPollAt};
      if(previous?.state==='leased'&&previous.leaseUntil>at)return{state:'waiting',nextPollAt:previous.leaseUntil};
      const poll={...(previous??{id,sourceId:source.id,sourceRevision:source.revision,createdAt:at,bucket}),
        ...this.lease(source,at),state:'leased',updatedAt:at,fetchReservation:null};
      tx.set(ref,payload(poll));tx.set(cursorRef,payload({sourceId:source.id,sourceRevision:source.revision,pollId:id,state:'leased'}));this.event(tx,at,'poll.claim',id);
      return{state:'ready',claim:{id,kind:'poll',sourceId:source.id,sourceRevision:source.revision,lease:poll.lease},nextPollAt};
    });
  }
  async recordDiscovery(claim,urls,{complete=true}={}) {
    if(!Array.isArray(urls)||urls.length>50||typeof complete!=='boolean')fail('FAST_DISCOVERY_INVALID');
    urls=urls.map(url=>assertSourceTarget(url));if(new Set(urls).size!==urls.length)fail('FAST_DISCOVERY_INVALID');
    return this.transaction(async(tx,source,at)=>{
      if(claim.kind!=='poll'||urls.length>source.automation.maxArticles)fail('FAST_DISCOVERY_INVALID');
      const {ref,row}=await this.asserted(tx,claim,at),ids=urls.map(url=>hash(source.id+':'+url));
      const notices=await Promise.all(ids.map(id=>tx.get(this.ref('ingestion_notices',id))));
      const jobs=await Promise.all(ids.map(id=>tx.get(this.ref('ingestion_jobs',id))));
      let queued=0;
      for(let i=0;i<ids.length;i++) {
        const notice=record(notices[i],Notice),job=record(jobs[i],Job),id=ids[i];
        if(notice&&(notice.sourceId!==source.id||notice.url!==urls[i]||notice.firstSeenAt>at)||job&&!notice)fail('FAST_INGESTION_STATE_INVALID');
        if(!notice) {
          tx.create(this.ref('ingestion_notices',id),{...payload({id,sourceId:source.id,url:urls[i],firstSeenAt:at,firstPollId:claim.id}),sourceId:source.id,firstSeenAt:at});
          tx.create(this.ref('ingestion_jobs',id),jobPayload({id,sourceId:source.id,sourceRevision:source.revision,url:urls[i],
            firstSeenAt:at,updatedAt:at,stage:'fetch',state:'queued',nextAt:at,attempts:0,lease:null,leaseUntil:null,
            principal:null,fetchReservation:null,timeline:{}}));queued++;
        } else if(!job)fail('FAST_INGESTION_STATE_INVALID');
      }
      tx.set(ref,payload({...row,state:complete?'complete':'leased',updatedAt:at,...(complete?{lease:null,leaseUntil:null}:{})}));
      if(complete)tx.set(this.ref('ingestion_cursors',source.id),payload({sourceId:source.id,sourceRevision:source.revision,pollId:claim.id,state:'complete'}));
      this.event(tx,at,'poll.record',claim.id);return{observed:urls.length,queued,alreadyKnown:urls.length-queued};
    });
  }
  async claimNotice(id) {
    IdSchema.parse(id);
    return this.transaction(async(tx,source,at)=>{
      const ref=this.ref('ingestion_jobs',id),row=record(await tx.get(ref),Job),slotsRef=this.ref('ingestion_slots',source.id),stored=record(await tx.get(slotsRef),Slots);
      const notice=record(await tx.get(this.ref('ingestion_notices',id)),Notice);
      if(stored&&stored.sourceId!==source.id)fail('FAST_INGESTION_STATE_INVALID');
      const slots=Object.fromEntries(Object.entries(stored?.active??{}).filter(([,v])=>v.until>at));
      if(!row||row.sourceId!==source.id||row.sourceRevision!==source.revision||!['queued','leased'].includes(row.state)||row.nextAt>at||row.leaseUntil>at)return null;
      if(!notice||notice.id!==id||notice.sourceId!==source.id||notice.url!==row.url||notice.firstSeenAt!==row.firstSeenAt||JSON.stringify(notice.history??null)!==JSON.stringify(row.history??null)||row.id!==id||hash(source.id+':'+assertSourceTarget(row.url))!==id)fail('FAST_INGESTION_STATE_INVALID');
      if(row.updatedAt>at||!Number.isSafeInteger(row.attempts)||row.attempts<0||row.attempts>=Number.MAX_SAFE_INTEGER)fail('FAST_INGESTION_STATE_INVALID');
      if(Object.keys(slots).length>=source.automation.fastIngestion.maxConcurrentJobs)return null;
      const lease=this.lease(source,at),next={...row,...lease,state:'leased',attempts:row.attempts+1,updatedAt:at,fetchReservation:null,
        timeline:{...row.timeline,startedAt:row.timeline.startedAt??at}};
      slots[id]={lease:lease.lease,until:lease.leaseUntil};tx.set(ref,jobPayload(next));tx.set(slotsRef,payload({sourceId:source.id,active:slots}));this.event(tx,at,'notice.claim',id);
      return{id,kind:'notice',sourceId:source.id,sourceRevision:source.revision,lease:lease.lease,stage:next.stage,firstSeenAt:next.firstSeenAt,modelAdmissionRequired:true};
    });
  }
  async reserveFetch(claim) {
    return this.transaction(async(tx,source,at)=>{
      const {ref,row}=await this.asserted(tx,claim,at);
      if(row.fetchReservation&&!row.fetchReservation.consumed)return row.fetchReservation;
      const pacingRef=this.ref('ingestion_pacing',source.id),pacing=record(await tx.get(pacingRef),Pacing);
      if(pacing&&pacing.sourceId!==source.id)fail('FAST_INGESTION_STATE_INVALID');
      const reservedAt=new Date(Math.max(Date.parse(at),Date.parse(pacing?.nextAt??at),
        pacing?.lastAdmittedAt?Date.parse(pacing.lastAdmittedAt)+source.automation.minRequestIntervalMs:0)).toISOString();
      if(reservedAt>=row.leaseUntil){const error=new DomainError('FETCH_PACING_RETRY');error.retryAt=reservedAt;throw error;}
      const reservation={token:randomUUID(),at:reservedAt,consumed:false};
      tx.set(pacingRef,payload({sourceId:source.id,nextAt:new Date(Date.parse(reservedAt)+source.automation.minRequestIntervalMs).toISOString(),lastAdmittedAt:pacing?.lastAdmittedAt??null}));
      tx.set(ref,ownedPayload(claim,{...row,fetchReservation:reservation,updatedAt:at}));this.event(tx,at,'fetch.reserve',claim.id);return reservation;
    });
  }
  async admitFetch(claim,reservation) {
    return this.transaction(async(tx,source,at)=>{
      const {ref,row}=await this.asserted(tx,claim,at),saved=row.fetchReservation;
      if(!saved||saved.token!==reservation?.token||saved.at!==reservation.at||saved.consumed||saved.at>at)fail('FETCH_RESERVATION_INVALID');
      const pacingRef=this.ref('ingestion_pacing',source.id),pacing=record(await tx.get(pacingRef),Pacing);
      if(!pacing||pacing.sourceId!==source.id)fail('FAST_INGESTION_STATE_INVALID');
      if(pacing.lastAdmittedAt&&Date.parse(pacing.lastAdmittedAt)+source.automation.minRequestIntervalMs>Date.parse(at)) {
        const error=new DomainError('FETCH_PACING_RETRY');error.retryAt=new Date(Date.parse(pacing.lastAdmittedAt)+source.automation.minRequestIntervalMs).toISOString();throw error;
      }
      tx.set(ref,ownedPayload(claim,{...row,fetchReservation:{...saved,consumed:true},updatedAt:at}));this.event(tx,at,'fetch.admit',claim.id);
      tx.set(pacingRef,payload({...pacing,lastAdmittedAt:at}));
      // This is a paced turn, not robots, destination, model or publish approval.
      return{sourceId:source.id,pacedAt:saved.at,networkPermissionRequired:true};
    });
  }
  async checkpoint(claim,event) {
    const transitions={retrieved:['fetch','extract','retrievedAt'],extracted:['extract','validate','extractedAt'],validated_private:['validate','complete','privateReadyAt']};
    if(!Object.hasOwn(transitions,event)||claim.kind!=='notice')fail('FAST_STAGE_INVALID');
    return this.transaction(async(tx,source,at)=>{
      const {ref,row}=await this.asserted(tx,claim,at),[expected,next,field]=transitions[event];
      if(row.stage!==expected)fail('FAST_STAGE_INVALID');
      const slotsRef=this.ref('ingestion_slots',source.id),slots=record(await tx.get(slotsRef),Slots);
      if(slots?.sourceId!==source.id||slots?.active?.[claim.id]?.lease!==claim.lease)fail('STALE_LEASE');
      const active={...slots.active};if(next==='complete')delete active[claim.id];
      tx.set(ref,jobPayload({...row,stage:next,state:next==='complete'?'complete':'leased',updatedAt:at,
        timeline:{...row.timeline,[field]:at},...(next==='complete'?{lease:null,leaseUntil:null,outcome:'validated_private'}:{})}));
      tx.set(slotsRef,payload({sourceId:source.id,active}));this.event(tx,at,'notice.'+event,claim.id);
      return{firstSeenAt:row.firstSeenAt,timeline:{...row.timeline,[field]:at},outcome:next==='complete'?'validated_private':null,
        firstSeenToPrivateReadyMs:next==='complete'?Date.parse(at)-Date.parse(row.firstSeenAt):null,publiclyVisible:false};
    });
  }
  async defer(claim,{reason,until=null}) {
    if(claim.kind!=='notice'||!['source_budget','provider_quota','evidence','authority'].includes(reason)||
      ['source_budget','provider_quota'].includes(reason)&&!InstantSchema.safeParse(until).success||
      ['evidence','authority'].includes(reason)&&until!==null)fail('FAST_DEFER_INVALID');
    return this.transaction(async(tx,source,at)=>{
      const {ref,row}=await this.asserted(tx,claim,at),slotsRef=this.ref('ingestion_slots',source.id),slots=record(await tx.get(slotsRef),Slots);
      if(slots?.sourceId!==source.id||slots?.active?.[claim.id]?.lease!==claim.lease||until!==null&&until<=at)fail('FAST_DEFER_INVALID');
      const active={...slots.active};delete active[claim.id];
      tx.set(ref,jobPayload({...row,state:until===null?'held':'queued',blockedBy:reason,nextAt:until??row.nextAt,
        lease:null,leaseUntil:null,updatedAt:at,fetchReservation:null}));tx.set(slotsRef,payload({sourceId:source.id,active}));this.event(tx,at,'notice.defer',claim.id);
      return{nextAt:until,firstSeenAt:row.firstSeenAt,modelAdmissionRequired:true};
    });
  }
  async renew(claim) {
    return this.transaction(async(tx,source,at)=>{
      const {ref,row}=await this.asserted(tx,claim,at),until=new Date(Date.parse(at)+source.automation.fastIngestion.leaseMs).toISOString();
      if(claim.kind==='notice') {
        const slotsRef=this.ref('ingestion_slots',source.id),slots=record(await tx.get(slotsRef),Slots);
        if(slots?.sourceId!==source.id||slots?.active?.[claim.id]?.lease!==claim.lease)fail('STALE_LEASE');
        tx.set(slotsRef,payload({...slots,active:{...slots.active,[claim.id]:{lease:claim.lease,until}}}));
      }
      tx.set(ref,ownedPayload(claim,{...row,leaseUntil:until,updatedAt:at}));this.event(tx,at,'lease.renew',claim.id);return{leaseUntil:until};
    });
  }
  async snapshot() {
    return this.transaction(async(tx,source,at)=>{
      const rows=await tx.get(this.db.collection('m0_ingestion_jobs').where('sourceId','==',source.id).limit(501));
      if(rows.size>500)fail('FAST_INGESTION_QUEUE_CAPACITY');
      const jobs=rows.docs.map(row=>record(row,Job));
      if(jobs.some(j=>j.sourceId!==source.id))fail('FAST_INGESTION_STATE_INVALID');
      return{sourceId:source.id,sourceRevision:source.revision,observedAt:at,jobs,summary:summarizeFastIngestion(jobs,at)};
    },{readOnly:true});
  }
  /** Read before a caller's draft/cache writes; invoke commit only afterwards,
   * in this same transaction. This lets a bridge settle ownership atomically
   * with the existing worker's validated draft or failure decision. */
  async prepareSettlement(tx,claim,at) {
    if(claim.kind!=='notice')fail('FAST_STAGE_INVALID');
    const {ref,row}=await this.asserted(tx,claim,at),slotsRef=this.ref('ingestion_slots',this.sourceId),slots=record(await tx.get(slotsRef),Slots);
    if(slots?.sourceId!==this.sourceId||slots?.active?.[claim.id]?.lease!==claim.lease)fail('STALE_LEASE');
    return{commit:({outcome,until=null})=>{
      if(!['validated_private','source_budget','provider_quota','retry','authority','evidence'].includes(outcome)||
        ['source_budget','provider_quota','retry'].includes(outcome)&&(!InstantSchema.safeParse(until).success||until<=at)||
        ['validated_private','authority','evidence'].includes(outcome)&&until!==null)fail('FAST_DEFER_INVALID');
      if(outcome==='validated_private'&&row.stage!=='validate')fail('FAST_STAGE_INVALID');
      const active={...slots.active};delete active[claim.id];
      const next={...row,lease:null,leaseUntil:null,updatedAt:at,fetchReservation:null};
      if(outcome==='validated_private')Object.assign(next,{state:'complete',stage:'complete',outcome,timeline:{...row.timeline,privateReadyAt:at}});
      else{Object.assign(next,{state:until===null?'held':'queued',nextAt:until??row.nextAt});if(outcome==='retry')delete next.blockedBy;else next.blockedBy=outcome;}
      tx.set(ref,jobPayload(next));tx.set(slotsRef,payload({sourceId:this.sourceId,active}));this.event(tx,at,'bridge.'+outcome,claim.id);
    }};
  }
}

/** Reports only milestones this coordinator actually stores. A private marker
 * cannot establish public commit/feed visibility or a production publishing SLO. */
export function summarizeFastIngestion(rows,at) {
  InstantSchema.parse(at);if(!Array.isArray(rows)||rows.length>500)fail('FAST_INGESTION_STATE_INVALID');
  const jobs=rows.map(r=>Job.parse(r)),ids=new Set();
  for(const j of jobs){if(ids.has(j.id)||j.updatedAt>at)fail('FAST_INGESTION_STATE_INVALID');ids.add(j.id);}
  const completed=jobs.filter(j=>j.outcome==='validated_private'),unfinished=jobs.filter(j=>j.state!=='complete'&&j.state!=='held');
  const durations=completed.filter(j=>!j.history).map(j=>Date.parse(j.timeline.privateReadyAt)-Date.parse(j.firstSeenAt)).sort((a,b)=>a-b);
  return{observed:jobs.length,queued:jobs.filter(j=>j.state==='queued').length,leased:jobs.filter(j=>j.state==='leased').length,
    held:jobs.filter(j=>j.state==='held').length,privateReady:completed.length,historicalAgeBounds:jobs.filter(j=>j.history).length,latencyEligible:jobs.filter(j=>!j.history).length,
    unfinishedOverThreeMinutes:unfinished.filter(j=>Date.parse(at)-Date.parse(j.firstSeenAt)>=180000).length,
    oldestUnfinishedAgeMs:unfinished.length?Math.max(...unfinished.map(j=>Date.parse(at)-Date.parse(j.firstSeenAt))):null,
    p95FirstSeenToPrivateReadyMs:durations.length?durations[Math.ceil(durations.length*0.95)-1]:null,
    publicVisibilityMeasured:false,p95FirstSeenToPublicMs:null,livePublishingSloVerified:false};
}
