import{AsyncLocalStorage}from'node:async_hooks';
import{InstantSchema}from'@skilved/types/opportunities';
import{createHash,randomUUID}from'node:crypto';
import{RecentJobsWorker}from'./recentjobs-worker.mjs';
import{FastIngestionStore}from'./fast-ingestion-store.mjs';
import{DomainError}from'./config.mjs';
import{assertGeminiQuotaAuthority}from'./ai/gemini-authority.mjs';
import{RECENTJOBS_INDEX}from'./worker-policy.mjs';
import{dayInSA}from'./south-african-time.mjs';
import{usesPublisherFeed,RECENTJOBS_CATEGORY_FEED,RSS_SOURCE_PROFILE}from'./publisher-feed-policy.mjs';
import{parseRecentJobsRss,parseWorkerRssItem}from'./adapters/recentjobs-rss.mjs';
import{leaseSupervisionOptions}from'./fast-lease-guard.mjs';
import{fastExecutionId}from'./fast-refresh-records.mjs';
import{queueDuePrivateRefreshes,assertPrivateRefreshBinding}from'./fast-private-refresh.mjs';

const hash=s=>createHash('sha256').update(s).digest('hex'),payload=x=>({json:JSON.stringify(x)});
const value=s=>s.exists?JSON.parse(s.data().json):null,fail=code=>{throw new DomainError(code);};
const isolated=new Set(['worker_jobs','worker_leases','worker_queue','worker_holds','worker_exceptions','worker_health']);
const authorityFailure=code=>/ISSUER.*(?:UNQUALIFIED|CHANGED)|ORIGIN.*UNQUALIFIED|AUTHORITY|ORIGINAL_NOTICE_UNSUPPORTED|FAST_LEGACY|FAST_NOTICE_HISTORY|FAST_REFRESH_BINDING/.test(code??'');

/** Default-off single-notice shadow bridge. The existing parser, extraction,
 * validation, model reservations, caches and canonical writer remain unchanged. */
export class FastRecentJobsWorker extends RecentJobsWorker {
  constructor(db,principal,{enabled=false,sourceId,sourceRevision,leaseSupervision=false,privateRefresh=false,...options}={}) {
    if(enabled!==true)fail('FAST_INGESTION_DISABLED');
    if(options.programmeExtraction||options.extractionMode&&options.extractionMode!=='single')fail('FAST_BRIDGE_SINGLE_ONLY');
    super(db,principal,options);
    if(typeof privateRefresh!=='boolean')fail('FAST_REFRESH_CONFIGURATION_REQUIRED');
    this.privateRefresh=privateRefresh;this.leaseSupervision=leaseSupervisionOptions(leaseSupervision);
    this.execution=new AsyncLocalStorage();
    this.fast=new FastIngestionStore(db,principal,{enabled:true,sourceId,sourceRevision,privateRefresh,now:this.now,assertAdmission:options.assertAdmission,
      assertTransaction:async(tx,_source,at)=>{if(this.provider==='gemini')await assertGeminiQuotaAuthority(tx,this.db,this.quotaAuthority,at);}});
  }
  context(){const context=this.execution.getStore();if(!context)fail('FAST_BRIDGE_SCOPE_REQUIRED');return context;}
  ref(collection,id) {
    if(!isolated.has(collection))return super.ref(collection,id);
    const context=this.context();
    if(collection==='worker_leases'){if(id!==this.fast.sourceId)fail('FAST_BRIDGE_SCOPE_REQUIRED');id=context.id;}
    else if(collection==='worker_jobs'&&id!==context.id)fail('FAST_BRIDGE_SCOPE_REQUIRED');
    return super.ref('fast_'+collection,id);
  }
  async transaction(sourceId,action,work,publishing=false,{readOnly=false}={}) {
    const context=this.context();if(sourceId!==this.fast.sourceId||publishing)fail('FAST_INGESTION_SHADOW_ONLY');
    if(['worker.complete','worker.failure'].includes(action))await this.fast.stopLeaseRenewals();
    return this.fast.transaction(async(tx,source,at)=>{
      if(this.provider==='gemini')await assertGeminiQuotaAuthority(tx,this.db,this.quotaAuthority,at);
      if(!source.urls.includes(RECENTJOBS_INDEX))fail('SOURCE_POLICY_REQUIRED');
      const {row:ownership}=await this.fast.asserted(tx,context.fastClaim,at);
      if(context.fastClaim.refresh)await assertPrivateRefreshBinding(tx,this.fast,ownership,context.fastClaim.refresh);
      const settling=['worker.complete','worker.failure'].includes(action)?await this.fast.prepareSettlement(tx,context.fastClaim,at):null;
      const refreshWatch=action==='worker.complete'?await this.fast.prepareRefreshWatch(tx,source,ownership,at):null;
      let writtenJob,writtenJobJson,writtenDraftJson,writtenDecisionJson;
      const executionRef=this.ref('worker_jobs',context.id);
      const draftRef=super.ref('drafts',hash(source.id+':'+hash(ownership.url)));
      const decisionRef=super.ref('worker_decisions',context.id);
      const wrapped=settling?new Proxy(tx,{get:(target,key)=>key==='set'?(ref,data,...args)=>{
        if(ref.path===executionRef.path){writtenJob=JSON.parse(data.json);writtenJobJson=data.json;}
        if(ref.path===draftRef.path)writtenDraftJson=data.json;
        if(ref.path===decisionRef.path)writtenDecisionJson=data.json;
        return target.set(ref,data,...args);
      }:typeof target[key]==='function'?target[key].bind(target):target[key]}):tx;
      const result=await work(wrapped,source);
      if(ownership.leaseUntil<=this.now())fail('STALE_LEASE');
      if(settling) {
        if(!writtenJob)fail('FAST_BRIDGE_LEDGER_INVALID');
        const outcome=action==='worker.complete'&&result.recordId&&result.published===false?'validated_private':
          writtenJob.state==='pending'?writtenJob.sourceBudgetResetAt===writtenJob.nextAt?'source_budget':
            writtenJob.error==='AI_RATE_LIMITED'||(writtenJob.modelWindowRetries??0)>context.priorModelWindows?'provider_quota':'retry':
          authorityFailure(writtenJob.error??result.reason)?'authority':'evidence';
        const next=settling.commit({outcome,until:writtenJob.state==='pending'?writtenJob.nextAt:null});
        if(refreshWatch&&outcome==='validated_private')refreshWatch(next,result.recordId,writtenDraftJson,writtenJobJson,writtenDecisionJson);
      }
      if(!readOnly)tx.create(super.ref('audit',randomUUID()),payload({action,actor:this.actor,actorType:'worker',subject:sourceId,at,profile:'fast_single_shadow_v1'}));
      return result;
    },{readOnly});
  }
  async assertClaim(tx,source,claim,options) {
    const context=this.context();
    if(claim.id!==context.id||claim.lease!==context.fastClaim.lease)fail('STALE_LEASE');
    await this.fast.asserted(tx,context.fastClaim,this.now());
    return super.assertClaim(tx,source,claim,options);
  }
  async prepareExecution() {
    const context=this.context();
    return this.transaction(this.fast.sourceId,'worker.fast.prepare',async(tx,source)=>{
      const {row:fastJob}=await this.fast.asserted(tx,context.fastClaim,this.now());
      if(fastJob.history)fail('FAST_NOTICE_HISTORY_REQUIRES_MIGRATION');
      const legacyQueue=await tx.get(this.db.collection('m0_worker_queue').where('sourceId','==',source.id).limit(1));
      const [legacyLease,draft,hold,projection]=await Promise.all([
        tx.get(super.ref('worker_leases',source.id)),tx.get(super.ref('drafts',hash(source.id+':'+hash(fastJob.url)))),
        tx.get(super.ref('worker_holds',hash(source.id+':'+fastJob.url))),tx.get(super.ref('public',hash(source.id+':'+hash(fastJob.url))))]);
      if(!legacyQueue.empty||value(legacyLease)?.until>this.now())fail('FAST_LEGACY_WORK_PENDING');
      if(draft.exists&&!fastJob.refresh||hold.exists||projection.exists)fail('FAST_NOTICE_HISTORY_REQUIRES_MIGRATION');
      const previous=value(await tx.get(this.ref('worker_jobs',context.id)));
      if(previous&&(previous.sourceId!==source.id||previous.sourceRevision!==source.revision||previous.url!==fastJob.url||
        previous.fastNoticeId!==fastJob.id||previous.state==='done'||previous.nextAt>this.now()))fail('FAST_BRIDGE_LEDGER_INVALID');
      if(previous&&previous.attempts-(previous.sourceBudgetWaits??0)-(previous.modelWindowRetries??0)>=3)fail('ATTEMPTS_EXHAUSTED');
      const job={...(previous??{}),id:context.id,sourceId:source.id,sourceRevision:source.revision,url:fastJob.url,
        kind:'detail',bucket:0,state:'running',attempts:fastJob.refresh?fastJob.cycleAttempts:fastJob.attempts,lease:fastJob.lease,leaseUntil:fastJob.leaseUntil,
        nextAt:this.now(),fastNoticeId:fastJob.id,sourceBudgetResetAt:null,error:null,
        ...(source.automation.issuerRegistry||previous?.issuerTrust?{issuerTrust:null}:{}),
        ...(source.automation.originDiscovery||previous?.originDiscoveryId?{originDiscoveryId:null}:{})};
      context.priorModelWindows=job.modelWindowRetries??0;
      tx.set(this.ref('worker_jobs',context.id),payload(job));tx.set(this.ref('worker_leases',source.id),payload({lease:job.lease,until:job.leaseUntil,nextRequestAt:this.now()}));
      return{...job,source};
    });
  }
  async request(claim,url,format) {
    const context=this.context();let reservation;
    try{reservation=await this.fast.reserveFetch(context.fastClaim);}catch(error){if(error.code==='FETCH_PACING_RETRY'){error.retryable=true;error.retryAfterMs=Math.max(0,Date.parse(error.retryAt)-Date.parse(this.now()));}throw error;}
    let admitted=false;
    for(let attempt=0;attempt<3&&!admitted;attempt++) {
      await this.sleep(Math.max(0,Date.parse(reservation.at)-Date.parse(this.now())));
      try{await this.fast.admitFetch(context.fastClaim,reservation);admitted=true;}
      catch(error){if(error.code!=='FETCH_PACING_RETRY')throw error;if(attempt===2){error.retryable=true;throw error;}await this.sleep(Math.max(0,Date.parse(error.retryAt)-Date.parse(this.now())));}
    }
    await this.transaction(claim.sourceId,'worker.before_fetch',(tx,source)=>this.assertClaim(tx,source,claim));
    const response=await this.fetcher({...claim.source,urls:[url]},url,undefined,format);
    if(response.url!==url||typeof response.text!=='string'||Buffer.byteLength(response.text)>claim.source.maxBytes)fail('UNSAFE_RESPONSE');
    return response;
  }
  async acquireDetail(claim){
    if(!usesPublisherFeed(claim.source))return super.acquireDetail(claim);
    // A discovery receipt only proves when a link was seen. Obtain current full
    // content under the same fetch pacing, grant and robots checks for each job.
    await this.robots(claim,RECENTJOBS_CATEGORY_FEED);
    const response=await this.request(claim,RECENTJOBS_CATEGORY_FEED,'rss'),sourceRetrievedAt=this.now();
    const feed=parseRecentJobsRss({xml:response.text,url:response.url}),index=feed.items.findIndex(item=>item.sourceUrl===claim.url);
    // Feed-window absence is unavailable evidence, not a closure or deletion.
    if(index<0)fail('RECENTJOBS_RSS_ITEM_UNAVAILABLE');
    const item=feed.items[index],candidate=parseWorkerRssItem(claim.source,feed,index,{observedOn:dayInSA(sourceRetrievedAt)});
    return{candidate,sourceRetrievedAt,acquisition:{profile:RSS_SOURCE_PROFILE,transport:'rss',feedUrl:feed.sourceUrl,feedHash:feed.feedHash,
      itemHash:item.itemHash,guid:item.guid,publishedAtRaw:item.publishedAtRaw,retrievedAt:sourceRetrievedAt,coverage:feed.coverage}};
  }
  async capture(claim,candidate,retrievedAt,acquisition) {
    const captured=await super.capture(claim,candidate,retrievedAt,acquisition);
    const context=this.context(),stage=await this.fast.transaction(async(tx,source,at)=>(await this.fast.asserted(tx,context.fastClaim,at)).row.stage);
    if(stage==='fetch')await this.fast.checkpoint(context.fastClaim,'retrieved');
    return captured;
  }
  async cache(claim,key,produce) {
    const result=await super.cache(claim,key,produce);
    if(result.extraction) {
      const context=this.context(),stage=await this.fast.transaction(async(tx,source,at)=>(await this.fast.asserted(tx,context.fastClaim,at)).row.stage);
      if(stage==='extract')await this.fast.checkpoint(context.fastClaim,'extracted');
    }
    return result;
  }
  async superviseLease(claim,work,renew,{signal}={}) {
    if(!this.leaseSupervision)return work();
    return this.fast.withLease(claim,work,{...this.leaseSupervision,renew,signal});
  }
  async renewExecution(claim) {
    const context=this.context();
    return this.fast.transaction(async(tx,source,at)=>{
      const renewal=await this.fast.prepareRenewal(tx,source,context.fastClaim,at);
      const job=await super.assertClaim(tx,source,claim),leaseRef=this.ref('worker_leases',source.id),lease=value(await tx.get(leaseRef));
      if(job.fastNoticeId!==context.fastClaim.id||job.sourceId!==source.id||job.sourceRevision!==source.revision||job.state!=='running'||!InstantSchema.safeParse(lease?.until).success||lease.until<=at)fail('STALE_LEASE');
      if(job.leaseUntil<=this.now()||lease.until<=this.now())fail('STALE_LEASE');
      tx.set(this.ref('worker_jobs',claim.id),payload({...job,leaseUntil:renewal.leaseUntil}));
      tx.set(leaseRef,payload({...lease,until:renewal.leaseUntil}));renewal.commit();return{leaseUntil:renewal.leaseUntil};
    });
  }
  async runNotice(id,{signal}={}) {
    if(this.privateRefresh)await this.fast.activatePrivateRefresh();
    const fastClaim=await this.fast.claimNotice(id);if(!fastClaim)return{state:'unavailable'};
    return this.execution.run({id:fastExecutionId({id,sourceRevision:this.fast.sourceRevision,refresh:fastClaim.refresh}),fastClaim,priorModelWindows:0},async()=>{
      let claim;
      try{claim=await this.prepareExecution();}
      catch(error){
        await this.fast.defer(fastClaim,{reason:authorityFailure(error.code)?'authority':'evidence'});return{state:'held',reason:error.code??'FAST_BRIDGE_PREPARATION_FAILED'};
      }
      return this.superviseLease(fastClaim,async()=>{try{return await super.detail(claim);}catch(error){
        if(error.code==='FAST_REFRESH_BINDING_CHANGED'){await this.fast.stopLeaseRenewals();await this.fast.defer(fastClaim,{reason:'authority'});return{state:'held',reason:error.code};}
        return this.failed(claim,error);
      }},()=>this.renewExecution(claim),{signal});
    });
  }
  async queueRefreshes(options){return queueDuePrivateRefreshes(this.fast,options);}
  async schedule(){fail('FAST_BRIDGE_ENTRYPOINT_REQUIRED');}
  async claim(){fail('FAST_BRIDGE_ENTRYPOINT_REQUIRED');}
  async runJob(){fail('FAST_BRIDGE_ENTRYPOINT_REQUIRED');}
  async run(){fail('FAST_BRIDGE_ENTRYPOINT_REQUIRED');}
  async discover(){fail('FAST_BRIDGE_ENTRYPOINT_REQUIRED');}
}
