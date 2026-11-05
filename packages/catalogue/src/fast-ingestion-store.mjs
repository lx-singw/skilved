import {createHash,randomUUID} from 'node:crypto';
import {AsyncLocalStorage} from 'node:async_hooks';
import {z} from 'zod';
import {IdSchema,InstantSchema} from '@skilved/types/opportunities';
import {Source} from './schemas.mjs';
import {DomainError} from './config.mjs';
import {assertSourceTarget} from './worker-policy.mjs';
import {FastLeaseGuard} from './fast-lease-guard.mjs';
import {FastSourcePolicy} from './fast-source-policy.mjs';
import {RefreshTicket,RefreshWatch,RefreshFeature,DispatchCounter,dispatchKind,fastExecutionId,refreshHash} from './fast-refresh-records.mjs';
export {FastSourcePolicy} from './fast-source-policy.mjs';

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
  blockedBy:z.enum(['source_budget','provider_quota','authority','evidence']).optional(),outcome:z.literal('validated_private').optional(),history:History.optional(),
  refresh:RefreshTicket.optional(),cycleAttempts:z.number().int().nonnegative().safe().optional()}).strict()
  .refine(j=>j.firstSeenAt<=j.updatedAt&&Object.values(j.timeline).every(t=>t>=j.firstSeenAt&&t<=j.updatedAt)&&
    (j.state==='leased'?j.lease!==null&&j.leaseUntil!==null&&j.principal!==null:j.lease===null&&j.leaseUntil===null)&&
    (!j.refresh||!j.history&&j.cycleAttempts!==undefined&&j.cycleAttempts<=j.attempts&&j.refresh.requestedAt>=j.firstSeenAt&&j.refresh.requestedAt<=j.updatedAt)&&
    (j.stage==='fetch'||j.timeline.retrievedAt!==undefined)&&
    (!['validate','complete'].includes(j.stage)||j.timeline.extractedAt!==undefined)&&
    (j.stage!=='complete'||j.state==='complete'&&j.timeline.privateReadyAt!==undefined&&j.outcome==='validated_private'));
const Notice=z.object({id:IdSchema,sourceId:IdSchema,url:z.string().url(),firstSeenAt:InstantSchema,firstPollId:IdSchema.nullable(),history:History.optional()}).strict().refine(n=>n.firstPollId!==null||n.history!==undefined);
const Cursor=z.object({sourceId:IdSchema,sourceRevision:z.number().int().positive(),pollId:IdSchema,state:z.enum(['leased','complete'])}).strict();
const Slots=z.object({sourceId:IdSchema,active:z.record(z.object({lease:z.string().uuid(),until:InstantSchema}).strict())}).strict()
  .refine(s=>Object.keys(s.active).length<=20&&Object.keys(s.active).every(k=>IdSchema.safeParse(k).success));
const Pacing=z.object({sourceId:IdSchema,nextAt:InstantSchema,lastAdmittedAt:InstantSchema.nullable()}).strict();
const DiscoveryList=z.object({adapter:z.literal('recentjobs_html_v1'),sourceUrl:z.string().url(),
  articles:z.array(z.object({sourceUrl:z.string().url(),title:z.string().min(1).max(500)}).strict()).min(1).max(50),nextPage:z.string().url().nullable()}).strict();
const DiscoveryPage=z.object({id:IdSchema,sourceId:IdSchema,sourceRevision:z.number().int().positive(),pollId:IdSchema,
  url:z.string().url(),hash:z.string().regex(/^[a-f0-9]{64}$/),list:DiscoveryList,retrievedAt:InstantSchema}).strict();
const discoveryPageId=(pollId,url)=>hash(pollId+':page:'+url);
const record=(snap,schema)=>{if(!snap.exists)return null;try{const row=schema.parse(value(snap));
  if(schema===Job&&['sourceId','state','nextAt','firstSeenAt'].some(k=>snap.data()[k]!==row[k]))fail('FAST_INGESTION_STATE_INVALID');
  return row;}catch{fail('FAST_INGESTION_STATE_INVALID');}};
/** Explicit source-schema extension for this separate shadow coordinator.
 * Source policy adoption is separately fenced by the reviewed history receipt. */
export function parseFastIngestionSource(raw) {
  const input=structuredClone(raw),policy=FastSourcePolicy.parse(input?.automation?.fastIngestion);
  delete input.automation.fastIngestion;
  const source=Source.parse(input);
  if(source.automation?.mode!=='shadow'||source.permission.method!=='recentjobs_html')fail('FAST_INGESTION_SHADOW_ONLY');
  return{...source,automation:{...source.automation,fastIngestion:policy}};
}
export const parseFastJob=recordSnapshot=>record(recordSnapshot,Job);
export const encodeFastJob=job=>{Job.parse(job);return jobPayload(job);};

/** Default-off backend coordinator. It owns no fetch/model/publish capability.
 * Job ownership is independent of the source's atomic fetch pacing clock. */
export class FastIngestionStore {
  constructor(db,principal,{enabled=false,sourceId,sourceRevision,privateRefresh=false,now=()=>new Date().toISOString(),assertAdmission,assertTransaction}={}) {
    if(enabled!==true)fail('FAST_INGESTION_DISABLED');
    if(!/^[^\s@]+@[^\s@]+$/.test(principal??'')||!IdSchema.safeParse(sourceId).success||
      !Number.isSafeInteger(sourceRevision)||sourceRevision<1||typeof privateRefresh!=='boolean'||typeof now!=='function'||
      assertAdmission!==undefined&&typeof assertAdmission!=='function'||assertTransaction!==undefined&&typeof assertTransaction!=='function')fail('WORKER_CONFIGURATION_REQUIRED');
    Object.assign(this,{db,principal,sourceId,sourceRevision,privateRefresh,now,assertAdmission,assertTransaction});
    this.actor='worker_'+hash(principal).slice(0,40);
    this.leaseContext=new AsyncLocalStorage();
  }
  ref(collection,id){IdSchema.parse(id);return this.db.collection('m0_'+collection).doc(id);}
  async transaction(work,{readOnly=false}={}) {
    this.leaseContext.getStore()?.assertHealthy();
    return this.db.runTransaction(async tx=>{
      this.leaseContext.getStore()?.assertHealthy();
      let at=this.now();InstantSchema.parse(at);
      const [sourceRow,grantRow,featureRow]=await Promise.all([tx.get(this.ref('sources',this.sourceId)),tx.get(this.ref('workers',this.actor)),tx.get(this.ref('ingestion_refresh_features',this.sourceId))]);
      const grant=grantRow.data(),raw=value(sourceRow);
      if(!grant?.active||grant.principal!==this.principal||!grant.sources?.includes(this.sourceId)||
        grant.roles?.length!==1||grant.roles[0]!=='ingest'||grant.expiresAt!==undefined&&
        (!InstantSchema.safeParse(grant.expiresAt).success||grant.expiresAt<=at))fail('WORKER_FORBIDDEN');
      if(!raw||raw.paused)fail('SOURCE_PAUSED');
      const source=parseFastIngestionSource(raw);
      if(source.id!==this.sourceId||source.revision!==this.sourceRevision)fail('SOURCE_CHANGED');
      if(featureRow.exists){const feature=RefreshFeature.parse(value(featureRow));if(feature.sourceId!==source.id||feature.sourceRevision!==source.revision||feature.activatedAt>at)fail('SOURCE_CHANGED');if(!this.privateRefresh)fail('FAST_REFRESH_OPT_IN_REQUIRED');}
      if(!source.categories.includes('apprenticeship'))fail('SOURCE_POLICY_REQUIRED');
      await this.assertAdmission?.(source,grant,this.principal);
      await this.assertTransaction?.(tx,source,at);
      const checkClock=()=>{const current=this.now();InstantSchema.parse(current);if(current<at)fail('FAST_INGESTION_STATE_INVALID');if(grant.expiresAt!==undefined&&grant.expiresAt<=current)fail('WORKER_FORBIDDEN');return current;};
      at=checkClock();const result=await work(tx,source,at);checkClock();this.leaseContext.getStore()?.assertHealthy();return result;
    },readOnly?{readOnly:true}:undefined);
  }
  event(tx,at,action,subject){tx.create(this.ref('ingestion_events',randomUUID()),{...payload({version:1,at,action,subject,sourceId:this.sourceId,actor:this.actor}),sourceId:this.sourceId,at,action});}
  async activatePrivateRefresh(){
    if(!this.privateRefresh)fail('FAST_REFRESH_OPT_IN_REQUIRED');
    return this.transaction(async(tx,source,at)=>{
      const ref=this.ref('ingestion_refresh_features',source.id),saved=await tx.get(ref);
      if(saved.exists)return{state:'verified'};
      const completed=await tx.get(this.db.collection('m0_ingestion_jobs').where('sourceId','==',source.id).where('state','==','complete').limit(1));
      if(!completed.empty)fail('FAST_REFRESH_HISTORY_ADOPTION_REQUIRED');
      const active=await this.activeJobs(tx,source);
      if(active.some(j=>j.state==='leased'&&j.leaseUntil>at))fail('FAST_REFRESH_ACTIVE_WORK');
      const cursor=record(await tx.get(this.ref('ingestion_cursors',source.id)),Cursor);
      if(cursor?.state==='leased'){const poll=record(await tx.get(this.ref('ingestion_polls',cursor.pollId)),Poll);if(poll?.leaseUntil>at)fail('FAST_REFRESH_ACTIVE_WORK');}
      tx.create(ref,payload(RefreshFeature.parse({version:'private_v1',sourceId:source.id,sourceRevision:source.revision,activatedAt:at})));
      this.event(tx,at,'refresh.activate',source.id);return{state:'activated'};
    });
  }
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
  async recordDiscovery(claim,urls,{complete=true,pageReceiptId}={}) {
    if(!Array.isArray(urls)||urls.length>50||typeof complete!=='boolean')fail('FAST_DISCOVERY_INVALID');
    urls=urls.map(url=>assertSourceTarget(url));if(new Set(urls).size!==urls.length)fail('FAST_DISCOVERY_INVALID');
    if(complete)await this.stopLeaseRenewals();
    return this.transaction(async(tx,source,at)=>{
      if(claim.kind!=='poll'||urls.length>source.automation.maxArticles)fail('FAST_DISCOVERY_INVALID');
      const {ref,row}=await this.asserted(tx,claim,at),ids=urls.map(url=>hash(source.id+':'+url));
      let observedAt=at;
      if(pageReceiptId!==undefined){
        if(!IdSchema.safeParse(pageReceiptId).success)fail('FAST_DISCOVERY_RECEIPT_INVALID');
        const saved=record(await tx.get(this.ref('ingestion_discovery_pages',pageReceiptId)),DiscoveryPage);
        if(!saved)fail('FAST_DISCOVERY_RECEIPT_INVALID');this.assertDiscoveryPage(source,row,saved,at);
        if(saved.id!==pageReceiptId||urls.some(url=>!saved.list.articles.some(a=>a.sourceUrl===url)))fail('FAST_DISCOVERY_RECEIPT_INVALID');
        observedAt=saved.retrievedAt;
      }
      const notices=await Promise.all(ids.map(id=>tx.get(this.ref('ingestion_notices',id))));
      const jobs=await Promise.all(ids.map(id=>tx.get(this.ref('ingestion_jobs',id))));
      const active=await this.activeJobs(tx,source);
      if(active.length+notices.filter(s=>!s.exists).length>500)fail('FAST_INGESTION_QUEUE_CAPACITY');
      let queued=0;
      for(let i=0;i<ids.length;i++) {
        const notice=record(notices[i],Notice),job=record(jobs[i],Job),id=ids[i];
        if(notice&&(notice.sourceId!==source.id||notice.url!==urls[i]||notice.firstSeenAt>at)||job&&!notice)fail('FAST_INGESTION_STATE_INVALID');
        if(!notice) {
          tx.create(this.ref('ingestion_notices',id),{...payload({id,sourceId:source.id,url:urls[i],firstSeenAt:observedAt,firstPollId:claim.id}),sourceId:source.id,firstSeenAt:observedAt});
          tx.create(this.ref('ingestion_jobs',id),jobPayload({id,sourceId:source.id,sourceRevision:source.revision,url:urls[i],
            firstSeenAt:observedAt,updatedAt:at,stage:'fetch',state:'queued',nextAt:at,attempts:0,lease:null,leaseUntil:null,
            principal:null,fetchReservation:null,timeline:{}}));queued++;
        } else if(!job)fail('FAST_INGESTION_STATE_INVALID');
      }
      tx.set(ref,payload({...row,state:complete?'complete':'leased',updatedAt:at,...(complete?{lease:null,leaseUntil:null}:{})}));
      if(complete)tx.set(this.ref('ingestion_cursors',source.id),payload({sourceId:source.id,sourceRevision:source.revision,pollId:claim.id,state:'complete'}));
      this.event(tx,at,'poll.record',claim.id);return{observed:urls.length,queued,alreadyKnown:urls.length-queued};
    });
  }
  async recordSourceChallenge(claim){
    return this.transaction(async(tx,_source,at)=>{
      if(claim?.kind!=='poll')fail('FAST_DISCOVERY_INVALID');
      const {row}=await this.asserted(tx,claim,at);
      // Preserve the existing owned lease as a durable retry boundary. Never
      // release/reset it to turn an unavailable source into an immediate loop.
      this.event(tx,at,'poll.source_challenged',claim.id);return{nextPollAt:row.leaseUntil};
    });
  }
  assertDiscoveryPage(source,poll,page,at) {
    const number=Number(new URL(assertSourceTarget(page.url,'index')).pathname.match(/\/page\/(\d+)\/$/)?.[1]??1);
    if(!source.urls.includes('https://recentjobs.co.za/category/apprenticeships/')||!source.automation.discovery||number>source.automation.discovery.maxPages||
      page.id!==discoveryPageId(poll.id,page.url)||page.sourceId!==source.id||page.sourceRevision!==source.revision||page.pollId!==poll.id||
      page.list.sourceUrl!==page.url||page.hash!==hash(JSON.stringify(page.list))||page.retrievedAt<poll.createdAt||page.retrievedAt>at||
      new Set(page.list.articles.map(a=>a.sourceUrl)).size!==page.list.articles.length)fail('FAST_DISCOVERY_RECEIPT_INVALID');
    page.list.articles.forEach(a=>assertSourceTarget(a.sourceUrl));
    if(page.list.nextPage!==null&&page.list.nextPage!==`https://recentjobs.co.za/category/apprenticeships/page/${number+1}/`)fail('FAST_DISCOVERY_RECEIPT_INVALID');
    return number;
  }
  async discoveryPage(claim,url,{capture}={}) {
    assertSourceTarget(url,'index');
    return this.transaction(async(tx,source,at)=>{
      if(claim.kind!=='poll')fail('FAST_DISCOVERY_INVALID');
      const {row:poll}=await this.asserted(tx,claim,at),id=discoveryPageId(claim.id,url),ref=this.ref('ingestion_discovery_pages',id);
      const existing=record(await tx.get(ref),DiscoveryPage);
      const page=capture?DiscoveryPage.parse({id,sourceId:source.id,sourceRevision:source.revision,pollId:claim.id,url,
        hash:hash(JSON.stringify(capture.list)),list:capture.list,retrievedAt:capture.retrievedAt}):existing;
      // Validate policy even before acquiring a page that has not been captured.
      const number=Number(new URL(url).pathname.match(/\/page\/(\d+)\/$/)?.[1]??1);
      if(!source.urls.includes('https://recentjobs.co.za/category/apprenticeships/')||!source.automation.discovery||number>source.automation.discovery.maxPages)fail('FAST_DISCOVERY_POLICY_REQUIRED');
      if(number>1){
        const previousUrl=number===2?'https://recentjobs.co.za/category/apprenticeships/':`https://recentjobs.co.za/category/apprenticeships/page/${number-1}/`;
        const previous=record(await tx.get(this.ref('ingestion_discovery_pages',discoveryPageId(claim.id,previousUrl))),DiscoveryPage);
        if(!previous||previous.list.nextPage!==url)fail('FAST_DISCOVERY_RECEIPT_INVALID');this.assertDiscoveryPage(source,poll,previous,at);
      }
      if(existing)this.assertDiscoveryPage(source,poll,existing,at);
      if(page)this.assertDiscoveryPage(source,poll,page,at);
      if(capture&&existing&&JSON.stringify(existing)!==JSON.stringify(page))fail('FAST_DISCOVERY_RECEIPT_CONFLICT');
      if(capture&&!existing){tx.create(ref,payload(page));this.event(tx,at,'poll.capture',claim.id);}
      return{page:existing??page,source};
    },{readOnly:!capture});
  }
  async claimNotice(id) {
    IdSchema.parse(id);
    return this.transaction(async(tx,source,at)=>{
      const ref=this.ref('ingestion_jobs',id),row=record(await tx.get(ref),Job),slotsRef=this.ref('ingestion_slots',source.id),stored=record(await tx.get(slotsRef),Slots);
      const notice=record(await tx.get(this.ref('ingestion_notices',id)),Notice);
      if(stored&&stored.sourceId!==source.id)fail('FAST_INGESTION_STATE_INVALID');
      const slots=Object.fromEntries(Object.entries(stored?.active??{}).filter(([,v])=>v.until>at));
      if(!row||row.sourceId!==source.id||row.sourceRevision!==source.revision||!['queued','leased'].includes(row.state)||row.nextAt>at||row.leaseUntil>at)return null;
      if(row.refresh&&!this.privateRefresh)return null;
      if(!notice||notice.id!==id||notice.sourceId!==source.id||notice.url!==row.url||notice.firstSeenAt!==row.firstSeenAt||JSON.stringify(notice.history??null)!==JSON.stringify(row.history??null)||row.id!==id||hash(source.id+':'+assertSourceTarget(row.url))!==id)fail('FAST_INGESTION_STATE_INVALID');
      if(row.updatedAt>at||!Number.isSafeInteger(row.attempts)||row.attempts<0||row.attempts>=Number.MAX_SAFE_INTEGER)fail('FAST_INGESTION_STATE_INVALID');
      if(Object.keys(slots).length>=source.automation.fastIngestion.maxConcurrentJobs)return null;
      let counter;
      if(this.privateRefresh){
        counter=await this.dispatchCounter(tx,source);
        const kind=dispatchKind(await this.activeJobs(tx,source),source.revision,at,counter.newSinceRefresh);
        if(kind!==(row.refresh?'refresh':'new'))return null;
      }
      const lease=this.lease(source,at),next={...row,...lease,state:'leased',attempts:row.attempts+1,updatedAt:at,fetchReservation:null,
        ...(row.refresh?{cycleAttempts:row.cycleAttempts+1}:{}),
        timeline:{...row.timeline,startedAt:row.timeline.startedAt??at}};
      slots[id]={lease:lease.lease,until:lease.leaseUntil};tx.set(ref,jobPayload(next));tx.set(slotsRef,payload({sourceId:source.id,active:slots}));this.event(tx,at,'notice.claim',id);
      if(counter)tx.set(this.ref('ingestion_dispatch',source.id),payload({...counter,newSinceRefresh:row.refresh?0:Math.min(3,counter.newSinceRefresh+1)}));
      return{id,kind:'notice',sourceId:source.id,sourceRevision:source.revision,lease:lease.lease,stage:next.stage,firstSeenAt:next.firstSeenAt,modelAdmissionRequired:true,...(row.refresh?{refresh:row.refresh}:{})};
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
  async prepareRenewal(tx,source,claim,at) {
    const {ref,row}=await this.asserted(tx,claim,at),until=new Date(Date.parse(at)+source.automation.fastIngestion.leaseMs).toISOString();
    let slotsRef,slots;
    if(claim.kind==='notice') {
      slotsRef=this.ref('ingestion_slots',source.id);slots=record(await tx.get(slotsRef),Slots);
      if(slots?.sourceId!==source.id||slots?.active?.[claim.id]?.lease!==claim.lease)fail('STALE_LEASE');
    }
    return{leaseUntil:until,commit:()=>{
      const commitAt=this.now();if(!InstantSchema.safeParse(commitAt).success||row.leaseUntil<=commitAt||until<=commitAt)fail('STALE_LEASE');
      if(slots)tx.set(slotsRef,payload({...slots,active:{...slots.active,[claim.id]:{lease:claim.lease,until}}}));
      tx.set(ref,ownedPayload(claim,{...row,leaseUntil:until,updatedAt:at}));this.event(tx,at,'lease.renew',claim.id);
    }};
  }
  async renew(claim) {
    return this.transaction(async(tx,source,at)=>{const renewal=await this.prepareRenewal(tx,source,claim,at);renewal.commit();return{leaseUntil:renewal.leaseUntil};});
  }
  async withLease(claim,work,{renew=()=>this.renew(claim),signal,...options}) {
    if(this.leaseContext.getStore())fail('FAST_LEASE_NESTING_FORBIDDEN');
    const leaseMs=await this.transaction(async(tx,source,at)=>{await this.asserted(tx,claim,at);return source.automation.fastIngestion.leaseMs;},{readOnly:true});
    const guard=new FastLeaseGuard({...options,signal,renew,intervalMs:Math.min(10000,Math.floor(leaseMs/3))});
    return this.leaseContext.run(guard,()=>guard.run(work));
  }
  async stopLeaseRenewals(){await this.leaseContext.getStore()?.stopRenewals();}
  async activeJobs(tx,source) {
    const rows=await tx.get(this.db.collection('m0_ingestion_jobs').where('sourceId','==',source.id).where('state','in',['queued','leased']).limit(501));
    if(rows.size>500)fail('FAST_INGESTION_QUEUE_CAPACITY');
    const jobs=rows.docs.map(row=>record(row,Job));if(jobs.some(j=>j.sourceId!==source.id||!['queued','leased'].includes(j.state)))fail('FAST_INGESTION_STATE_INVALID');return jobs;
  }
  async dispatchSnapshot() {
    return this.transaction(async(tx,source,at)=>({sourceId:source.id,sourceRevision:source.revision,observedAt:at,
      maxConcurrentJobs:source.automation.fastIngestion.maxConcurrentJobs,jobs:await this.activeJobs(tx,source),
      ...(this.privateRefresh?{privateRefresh:true,newSinceRefresh:(await this.dispatchCounter(tx,source)).newSinceRefresh}:{})}),{readOnly:true});
  }
  async dispatchCounter(tx,source){const saved=value(await tx.get(this.ref('ingestion_dispatch',source.id)));const counter=DispatchCounter.parse(saved??{sourceId:source.id,sourceRevision:source.revision,newSinceRefresh:0});if(counter.sourceId!==source.id||counter.sourceRevision!==source.revision)fail('SOURCE_CHANGED');return counter;}
  async prepareRefreshWatch(tx,source,row,at){
    if(!this.privateRefresh)return null;
    const ref=this.ref('ingestion_refresh_watches',row.id),saved=await tx.get(ref);
    if(saved.exists){const watch=RefreshWatch.parse(value(saved));if(['sourceId','state','nextAt'].some(k=>saved.data()[k]!==watch[k])||watch.sourceId!==source.id||watch.sourceRevision!==source.revision||watch.noticeId!==row.id||watch.state!=='scheduled'||watch.generation!==(row.refresh?.generation??0)||watch.executionId!==fastExecutionId(row))fail('FAST_REFRESH_BINDING_CHANGED');}
    else if(row.refresh)fail('FAST_REFRESH_BINDING_CHANGED');
    return(next,recordId,draftJson,executionJson,decisionJson)=>{
      if(row.history||typeof draftJson!=='string'||typeof executionJson!=='string'||typeof decisionJson!=='string')fail('FAST_REFRESH_BINDING_CHANGED');
      const decision=JSON.parse(decisionJson);
      if(decision.sourceId!==source.id||decision.sourceRevision!==source.revision||decision.recordId!==recordId||
        !InstantSchema.safeParse(decision.nextCheckAt).success||decision.nextCheckAt<=at)fail('FAST_REFRESH_BINDING_CHANGED');
      const watch=RefreshWatch.parse({version:'private_v1',sourceId:source.id,sourceRevision:source.revision,noticeId:row.id,
        generation:row.refresh?.generation??0,executionId:fastExecutionId(row),recordId,state:'waiting',
        nextAt:decision.nextCheckAt,updatedAt:at,
        jobSha256:refreshHash(jobPayload(next).json),draftSha256:refreshHash(draftJson),executionSha256:refreshHash(executionJson)});
      tx.set(ref,{...payload(watch),sourceId:source.id,state:watch.state,nextAt:watch.nextAt});
    };
  }
  async snapshot() {
    return this.transaction(async(tx,source,at)=>{
      const rows=await tx.get(this.db.collection('m0_ingestion_jobs').where('sourceId','==',source.id).limit(501));
      if(rows.size>500)fail('FAST_INGESTION_QUEUE_CAPACITY');
      const jobs=rows.docs.map(row=>record(row,Job));
      if(jobs.some(j=>j.sourceId!==source.id))fail('FAST_INGESTION_STATE_INVALID');
      return{sourceId:source.id,sourceRevision:source.revision,observedAt:at,maxConcurrentJobs:source.automation.fastIngestion.maxConcurrentJobs,jobs,summary:summarizeFastIngestion(jobs,at)};
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
      return next;
    }};
  }
}

/** Reports only milestones this coordinator actually stores. A private marker
 * cannot establish public commit/feed visibility or a production publishing SLO. */
export function summarizeFastIngestion(rows,at) {
  InstantSchema.parse(at);if(!Array.isArray(rows)||rows.length>500)fail('FAST_INGESTION_STATE_INVALID');
  const jobs=rows.map(r=>Job.parse(r)),ids=new Set();
  for(const j of jobs){if(ids.has(j.id)||j.updatedAt>at)fail('FAST_INGESTION_STATE_INVALID');ids.add(j.id);}
  const completed=jobs.filter(j=>j.outcome==='validated_private'),unfinished=jobs.filter(j=>!j.refresh&&j.state!=='complete'&&j.state!=='held');
  const refreshWaiting=jobs.filter(j=>j.refresh&&['queued','leased'].includes(j.state));
  const durations=completed.filter(j=>!j.history&&!j.refresh).map(j=>Date.parse(j.timeline.privateReadyAt)-Date.parse(j.firstSeenAt)).sort((a,b)=>a-b);
  return{observed:jobs.length,queued:jobs.filter(j=>j.state==='queued').length,leased:jobs.filter(j=>j.state==='leased').length,
    held:jobs.filter(j=>j.state==='held').length,privateReady:completed.length,historicalAgeBounds:jobs.filter(j=>j.history).length,latencyEligible:jobs.filter(j=>!j.history&&!j.refresh).length,
    unfinishedOverThreeMinutes:unfinished.filter(j=>Date.parse(at)-Date.parse(j.firstSeenAt)>=180000).length,
    oldestUnfinishedAgeMs:unfinished.length?Math.max(...unfinished.map(j=>Date.parse(at)-Date.parse(j.firstSeenAt))):null,
    p95FirstSeenToPrivateReadyMs:durations.length?durations[Math.ceil(durations.length*0.95)-1]:null,
    publicVisibilityMeasured:false,p95FirstSeenToPublicMs:null,livePublishingSloVerified:false,
    ...(jobs.some(j=>j.refresh)?{refreshCycles:jobs.filter(j=>j.refresh).length,refreshedPrivateReady:completed.filter(j=>j.refresh).length,
      refreshHeld:jobs.filter(j=>j.refresh&&j.state==='held').length,
      oldestRefreshWaitMs:refreshWaiting.length?Math.max(...refreshWaiting.map(j=>Date.parse(at)-Date.parse(j.refresh.requestedAt))):null}:{})};
}
