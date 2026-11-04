import{AsyncLocalStorage}from'node:async_hooks';
import{createHash,randomUUID}from'node:crypto';
import{RecentJobsWorker}from'./recentjobs-worker.mjs';
import{FastIngestionStore}from'./fast-ingestion-store.mjs';
import{DomainError}from'./config.mjs';
import{assertGeminiQuotaAuthority}from'./ai/gemini-authority.mjs';
import{RECENTJOBS_INDEX}from'./worker-policy.mjs';

const hash=s=>createHash('sha256').update(s).digest('hex'),payload=x=>({json:JSON.stringify(x)});
const value=s=>s.exists?JSON.parse(s.data().json):null,fail=code=>{throw new DomainError(code);};
const isolated=new Set(['worker_jobs','worker_leases','worker_queue','worker_holds','worker_exceptions','worker_health']);
const authorityFailure=code=>/ISSUER.*(?:UNQUALIFIED|CHANGED)|ORIGIN.*UNQUALIFIED|AUTHORITY|ORIGINAL_NOTICE_UNSUPPORTED|FAST_LEGACY|FAST_NOTICE_HISTORY/.test(code??'');

/** Default-off single-notice shadow bridge. The existing parser, extraction,
 * validation, model reservations, caches and canonical writer remain unchanged. */
export class FastRecentJobsWorker extends RecentJobsWorker {
  constructor(db,principal,{enabled=false,sourceId,sourceRevision,...options}={}) {
    if(enabled!==true)fail('FAST_INGESTION_DISABLED');
    if(options.programmeExtraction||options.extractionMode&&options.extractionMode!=='single')fail('FAST_BRIDGE_SINGLE_ONLY');
    super(db,principal,options);
    this.execution=new AsyncLocalStorage();
    this.fast=new FastIngestionStore(db,principal,{enabled:true,sourceId,sourceRevision,now:this.now,assertAdmission:options.assertAdmission});
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
    return this.fast.transaction(async(tx,source,at)=>{
      if(this.provider==='gemini')await assertGeminiQuotaAuthority(tx,this.db,this.quotaAuthority,at);
      if(!source.urls.includes(RECENTJOBS_INDEX))fail('SOURCE_POLICY_REQUIRED');
      const {row:ownership}=await this.fast.asserted(tx,context.fastClaim,at);
      const settling=['worker.complete','worker.failure'].includes(action)?await this.fast.prepareSettlement(tx,context.fastClaim,at):null;
      let writtenJob;
      const executionRef=this.ref('worker_jobs',context.id);
      const wrapped=settling?new Proxy(tx,{get:(target,key)=>key==='set'?(ref,data,...args)=>{
        if(ref.path===executionRef.path)writtenJob=JSON.parse(data.json);return target.set(ref,data,...args);
      }:typeof target[key]==='function'?target[key].bind(target):target[key]}):tx;
      const result=await work(wrapped,source);
      if(ownership.leaseUntil<=this.now())fail('STALE_LEASE');
      if(settling) {
        if(!writtenJob)fail('FAST_BRIDGE_LEDGER_INVALID');
        const outcome=action==='worker.complete'&&result.recordId&&result.published===false?'validated_private':
          writtenJob.state==='pending'?writtenJob.sourceBudgetResetAt===writtenJob.nextAt?'source_budget':
            writtenJob.error==='AI_RATE_LIMITED'||(writtenJob.modelWindowRetries??0)>context.priorModelWindows?'provider_quota':'retry':
          authorityFailure(writtenJob.error??result.reason)?'authority':'evidence';
        settling.commit({outcome,until:writtenJob.state==='pending'?writtenJob.nextAt:null});
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
      const legacyQueue=await tx.get(this.db.collection('m0_worker_queue').where('sourceId','==',source.id).limit(1));
      const [legacyLease,draft,hold,projection]=await Promise.all([
        tx.get(super.ref('worker_leases',source.id)),tx.get(super.ref('drafts',hash(source.id+':'+hash(fastJob.url)))),
        tx.get(super.ref('worker_holds',hash(source.id+':'+fastJob.url))),tx.get(super.ref('public',hash(source.id+':'+hash(fastJob.url))))]);
      if(!legacyQueue.empty||value(legacyLease)?.until>this.now())fail('FAST_LEGACY_WORK_PENDING');
      if(draft.exists||hold.exists||projection.exists)fail('FAST_NOTICE_HISTORY_REQUIRES_MIGRATION');
      const previous=value(await tx.get(this.ref('worker_jobs',context.id)));
      if(previous&&(previous.sourceId!==source.id||previous.sourceRevision!==source.revision||previous.url!==fastJob.url||
        previous.fastNoticeId!==fastJob.id||previous.state==='done'||previous.nextAt>this.now()))fail('FAST_BRIDGE_LEDGER_INVALID');
      if(previous&&previous.attempts-(previous.sourceBudgetWaits??0)-(previous.modelWindowRetries??0)>=3)fail('ATTEMPTS_EXHAUSTED');
      const job={...(previous??{}),id:context.id,sourceId:source.id,sourceRevision:source.revision,url:fastJob.url,
        kind:'detail',bucket:0,state:'running',attempts:fastJob.attempts,lease:fastJob.lease,leaseUntil:fastJob.leaseUntil,
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
  async capture(claim,candidate,retrievedAt) {
    const captured=await super.capture(claim,candidate,retrievedAt);
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
  async runNotice(id) {
    const fastClaim=await this.fast.claimNotice(id);if(!fastClaim)return{state:'unavailable'};
    return this.execution.run({id:hash('fast-single:'+id+':'+this.fast.sourceRevision),fastClaim,priorModelWindows:0},async()=>{
      let claim;
      try{claim=await this.prepareExecution();return await super.detail(claim);}
      catch(error){
        if(!claim){await this.fast.defer(fastClaim,{reason:authorityFailure(error.code)?'authority':'evidence'});return{state:'held',reason:error.code??'FAST_BRIDGE_PREPARATION_FAILED'};}
        return this.failed(claim,error);
      }
    });
  }
  async schedule(){fail('FAST_BRIDGE_ENTRYPOINT_REQUIRED');}
  async claim(){fail('FAST_BRIDGE_ENTRYPOINT_REQUIRED');}
  async runJob(){fail('FAST_BRIDGE_ENTRYPOINT_REQUIRED');}
  async run(){fail('FAST_BRIDGE_ENTRYPOINT_REQUIRED');}
  async discover(){fail('FAST_BRIDGE_ENTRYPOINT_REQUIRED');}
}
