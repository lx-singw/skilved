import{createHash,randomUUID}from'node:crypto';
import{z}from'zod';
import{IdSchema,InstantSchema,DateSchema}from'@skilved/types/opportunities';
import{Source,Reason}from'./schemas.mjs';
import{FastSourcePolicy}from'./fast-source-policy.mjs';
import{DomainError}from'./config.mjs';
import{assertSourceTarget}from'./worker-policy.mjs';

export const FAST_MIGRATION_COLLECTIONS=Object.freeze(['sources','source_versions','worker_jobs','worker_queue','worker_leases','workers',
 'worker_holds','worker_candidates','worker_exceptions','worker_decisions','snapshots','drafts','public',
 'model_budgets','model_calls','model_usage','model_availability','model_cache','model_authorities','model_authority_handoffs',
 'worker_notice_origins','worker_origin_imports','worker_assessments','worker_discovery','worker_discovery_pages','worker_original_resolutions','worker_watches'].map(n=>'m0_'+n).sort());
const MAX_DOCS=4000,MAX_BYTES=8000000,MAX_NOTICES=100,MAX_AGE_MS=900000;
const hash=s=>createHash('sha256').update(s).digest('hex'),payload=v=>({json:JSON.stringify(v)});
const fail=code=>{throw new DomainError(code);};
function canonical(v,depth=0){if(depth>40)fail('FAST_MIGRATION_DATA_INVALID');if(v===null||typeof v==='string'||typeof v==='boolean')return JSON.stringify(v);if(typeof v==='number'&&Number.isFinite(v))return JSON.stringify(v);
 if(Array.isArray(v))return'['+v.map(x=>canonical(x,depth+1)).join(',')+']';if(v&&typeof v==='object'&&[Object.prototype,null].includes(Object.getPrototypeOf(v)))return'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k],depth+1)).join(',')+'}';fail('FAST_MIGRATION_DATA_INVALID');}
const Doc=z.object({id:z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),data:z.record(z.unknown())}).strict();
const Snapshot=z.object({version:z.literal(1),capturedAt:InstantSchema,collections:z.record(z.array(Doc))}).strict();
const Input=z.object({version:z.literal(1),sourceId:IdSchema,snapshot:Snapshot,targetPolicy:FastSourcePolicy,
 externalRuns:z.array(z.object({id:IdSchema,sourceId:IdSchema,sourceRevision:z.number().int().positive(),state:z.enum(['scheduled','running','complete']),plannedAt:InstantSchema}).strict()).max(20)}).strict();
const Receipt=z.object({version:z.literal(1),sourceId:IdSchema,sourceRevision:z.number().int().positive(),targetSourceRevision:z.number().int().positive(),
 planSha256:z.string().regex(/^[a-f0-9]{64}$/),inventorySha256:z.string().regex(/^[a-f0-9]{64}$/),notices:z.number().int().min(0).max(MAX_NOTICES),
 importedAt:InstantSchema,actor:IdSchema,sourcePolicyApplied:z.literal(false),quotaWrites:z.literal(false),publication:z.literal(false)}).strict();
const decode=row=>{let record;try{record=typeof row.data.json==='string'?JSON.parse(row.data.json):row.data;}catch{fail('FAST_MIGRATION_JSON_INVALID');}if(!record||typeof record!=='object'||Array.isArray(record))fail('FAST_MIGRATION_DATA_INVALID');return record;};
function inventory(snapshot){
 if(Object.keys(snapshot.collections).sort().join('|')!==FAST_MIGRATION_COLLECTIONS.join('|'))fail('FAST_MIGRATION_INVENTORY_INCOMPLETE');
 const text=canonical(snapshot);if(Buffer.byteLength(text)>MAX_BYTES)fail('FAST_MIGRATION_LIMIT');let count=0;
 for(const rows of Object.values(snapshot.collections)){count+=rows.length;const ids=new Set();for(const row of rows){if(ids.has(row.id))fail('FAST_MIGRATION_DUPLICATE_DOCUMENT');ids.add(row.id);decode(row);}}
 if(count>MAX_DOCS)fail('FAST_MIGRATION_LIMIT');
 const sorted=Object.fromEntries(FAST_MIGRATION_COLLECTIONS.map(c=>[c,[...snapshot.collections[c]].sort((a,b)=>a.id.localeCompare(b.id))]));
 return{sha256:hash(canonical(sorted)),documentCount:count,collections:sorted};
}

/** Read-only, coherent inventory. It exports private raw data; callers must keep
 * it under ignored storage. Empty collections are explicit, never inferred. */
export async function collectFastMigrationSnapshot(db,{now=()=>new Date().toISOString()}={}){
 return db.runTransaction(async tx=>{
  const capturedAt=now();InstantSchema.parse(capturedAt);const collections={};let count=0;
  for(const name of FAST_MIGRATION_COLLECTIONS){const rows=await tx.get(db.collection(name).limit(MAX_DOCS+1));count+=rows.size;if(count>MAX_DOCS)fail('FAST_MIGRATION_LIMIT');collections[name]=rows.docs.map(d=>({id:d.id,data:d.data()}));}
  const snapshot={version:1,capturedAt,collections};inventory(snapshot);return snapshot;
 },{readOnly:true});
}

/** Plan a create-only import of held historical metadata. No work, source
 * revision, authority, cache alias, public approval or model allowance is moved. */
export function planFastIngestionMigration(raw,{now=()=>new Date().toISOString()}={}){
 const input=Input.parse(raw),{sourceId,snapshot,targetPolicy,externalRuns}=input,at=now();InstantSchema.parse(at);
 const retained=inventory(snapshot),tables=Object.fromEntries(FAST_MIGRATION_COLLECTIONS.map(c=>[c,snapshot.collections[c].map(row=>({id:row.id,record:decode(row)}))]));
 const rawSource=tables.m0_sources.find(r=>r.id===sourceId)?.record;if(!rawSource)fail('FAST_MIGRATION_SOURCE_MISSING');const source=Source.parse(rawSource);
 if(source.id!==sourceId||source.automation?.mode!=='shadow'||source.permission.method!=='recentjobs_html'||source.revision>=Number.MAX_SAFE_INTEGER)fail('FAST_MIGRATION_SOURCE_INVALID');
 if(source.automation.fastIngestion)fail('FAST_MIGRATION_SOURCE_INVALID');
 const blockers=new Set(),block=code=>blockers.add(code);
 const snapshotCurrent=snapshot.capturedAt<=at&&Date.parse(at)-Date.parse(snapshot.capturedAt)<=MAX_AGE_MS;
 if(!source.paused)block('SOURCE_NOT_QUIESCED');
 if(externalRuns.some(r=>r.sourceId===sourceId&&r.state!=='complete'))block('SCHEDULED_OR_RUNNING_WORK');
 if(externalRuns.some(r=>r.sourceId===sourceId&&r.sourceRevision>source.revision))block('EXTERNAL_RUN_REVISION_CONFLICT');
 if(tables.m0_workers.some(r=>r.record.active===true&&r.record.sources?.includes(sourceId)))block('WORKER_GRANT_ACTIVE');
 if(tables.m0_worker_queue.some(r=>r.record.sourceId===sourceId))block('LEGACY_QUEUE_NOT_DRAINED');
 if(tables.m0_worker_leases.some(r=>r.id===sourceId&&r.record.until>snapshot.capturedAt))block('LEGACY_LEASE_ACTIVE');
 for(const{id,record:r}of tables.m0_model_budgets.filter(x=>x.record.sourceId===sourceId))if(!DateSchema.safeParse(r.date).success||!Number.isSafeInteger(r.calls)||r.calls<0||id!==hash(sourceId+':'+r.date))block('SPEND_HISTORY_INVALID');
 const notices=new Map(),recordIds=new Map();
 const add=(url,collection,id,field,time)=>{
  let normalized;try{normalized=assertSourceTarget(url);}catch{return null;}
  const key=hash(sourceId+':'+normalized);let n=notices.get(key);if(!n){n={id:key,url:normalized,evidence:[],legacyJobIds:[],legacyStates:new Set()};notices.set(key,n);recordIds.set(hash(sourceId+':'+hash(normalized)),n);}
  if(time!==undefined&&time!==null){if(!InstantSchema.safeParse(time).success||time>snapshot.capturedAt)fail('FAST_MIGRATION_TIMESTAMP_INVALID');n.evidence.push({collection,id,field,at:time});}
  return n;
 };
 for(const {id,record:r}of tables.m0_worker_jobs.filter(x=>x.record.sourceId===sourceId&&x.record.kind==='detail')){
  const n=add(r.url,'m0_worker_jobs',id,'sourceRetrievedAt',r.sourceRetrievedAt);if(!n){block('LEGACY_URL_UNSUPPORTED');continue;}
  if(r.id!==id||r.recordId!==undefined&&r.recordId!==hash(sourceId+':'+hash(n.url)))block('LEGACY_IDENTITY_CONFLICT');
  if(!['pending','running','done','exception'].includes(r.state))fail('FAST_MIGRATION_JOB_INVALID');n.legacyJobIds.push(id);n.legacyStates.add(r.state);
  for(const field of ['firstSeenAt','createdAt'])if(r[field]!=null)add(r.url,'m0_worker_jobs',id,field,r[field]);
  if(['pending','running'].includes(r.state))block('LEGACY_WORK_UNFINISHED');
 }
 for(const name of ['m0_worker_holds','m0_worker_exceptions','m0_snapshots','m0_worker_notice_origins','m0_worker_assessments']){
  for(const{id,record:r}of tables[name].filter(x=>x.record.sourceId===sourceId)){
   const url=r.url??r.sourceUrl;const n=add(url,name,id);if(!n)continue;
   for(const field of ['retrievedAt','sourceRetrievedAt','firstSeenAt','at'])if(r[field]!=null)add(url,name,id,field,r[field]);
  }
 }
 // A listing capture can establish knowledge earlier than the detail fetch,
 // including links discovered but never queued. Do not make those links new.
 for(const{id,record:r}of tables.m0_worker_discovery_pages.filter(x=>x.record.sourceId===sourceId)){
  let supported=true;try{assertSourceTarget(r.url,'index');}catch{supported=false;}
  if(!supported||r.list?.sourceUrl!==r.url||!Array.isArray(r.list?.articles)||r.list.articles.length>50||r.hash!==hash(JSON.stringify(r.list))){block('DISCOVERY_HISTORY_UNSUPPORTED');continue;}
  for(const article of r.list.articles)if(!add(article.sourceUrl,'m0_worker_discovery_pages',id,'list.articles@retrievedAt',r.retrievedAt))block('LEGACY_URL_UNSUPPORTED');
 }
 for(const {id,record:r}of tables.m0_drafts){const n=recordIds.get(id);if(!n)continue;for(const field of ['createdAt','updatedAt'])if(r[field]!=null)add(n.url,'m0_drafts',id,field,r[field]);if(r.publication?.approved||r.publication?.previouslyPublic||r.lifecycle==='published')block('PUBLIC_HISTORY_REQUIRES_SEPARATE_MIGRATION');}
 if(tables.m0_public.some(r=>recordIds.has(r.id)))block('PUBLIC_HISTORY_REQUIRES_SEPARATE_MIGRATION');
 const targetSource={...source,revision:source.revision+1,paused:false,automation:{...source.automation,fastIngestion:targetPolicy}};
 const proposed=[],noticePlans=[];
 if(notices.size>MAX_NOTICES)block('MIGRATION_NOTICE_CAPACITY');
 for(const n of [...notices.values()].sort((a,b)=>a.url.localeCompare(b.url))){
  const evidence=[...new Map(n.evidence.map(e=>[canonical(e),e])).values()].sort((a,b)=>a.at.localeCompare(b.at)||a.collection.localeCompare(b.collection)||a.id.localeCompare(b.id)||a.field.localeCompare(b.field));
  const firstSeenAt=evidence[0]?.at??null;if(firstSeenAt===null)block('LEGACY_NOTICE_AGE_UNKNOWN');
  noticePlans.push({id:n.id,url:n.url,firstKnownObservationAt:firstSeenAt,firstSeenBasis:'legacy_observation_bound',sloEligible:false,legacyJobIds:n.legacyJobIds.sort(),legacyStates:[...n.legacyStates].sort(),evidence});
  if(!firstSeenAt||notices.size>MAX_NOTICES)continue;
  const history={inventorySha256:retained.sha256,firstSeenBasis:'legacy_observation_bound',sloEligible:false};
  const notice={id:n.id,sourceId,url:n.url,firstSeenAt,firstPollId:null,history};
  const job={id:n.id,sourceId,sourceRevision:targetSource.revision,url:n.url,firstSeenAt,updatedAt:snapshot.capturedAt,stage:'fetch',state:'held',nextAt:snapshot.capturedAt,attempts:0,lease:null,leaseUntil:null,principal:null,fetchReservation:null,timeline:{},blockedBy:'evidence',history};
  proposed.push({collection:'m0_ingestion_notices',id:n.id,data:{...payload(notice),sourceId,firstSeenAt}},
   {collection:'m0_ingestion_jobs',id:n.id,data:{...payload(job),sourceId,state:'held',nextAt:snapshot.capturedAt,firstSeenAt}},
   {collection:'m0_ingestion_migration_notices',id:n.id,data:{...payload({sourceId,inventorySha256:retained.sha256,...noticePlans.at(-1)}),sourceId}});
 }
 if(proposed.some(r=>Buffer.byteLength(canonical(r.data))>900000)||Buffer.byteLength(canonical(proposed))>MAX_BYTES)block('MIGRATION_PROVENANCE_CAPACITY');
 const body={version:'fast_history_migration_v1',sourceId,sourceRevision:source.revision,targetSourceRevision:targetSource.revision,capturedAt:snapshot.capturedAt,
  inventorySha256:retained.sha256,retainedDocumentCount:retained.documentCount,noticeCount:noticePlans.length,noticePlans,proposed,
  proposedTargetSource:targetSource,externalRuns:[...externalRuns].sort((a,b)=>a.id.localeCompare(b.id)),staticBlockers:[...blockers].sort(),
  retainedInPlace:true,sourcePolicyApplied:false,modelAllowanceChanged:false,cacheAliasesCreated:false,publication:false};
 return{...body,sha256:hash(canonical(body)),blockers:[...blockers,...(snapshotCurrent?[]:['SNAPSHOT_NOT_CURRENT'])].sort(),readyForHistoryImport:blockers.size===0&&snapshotCurrent};
}

/** Source-role controlled metadata import. The source remains paused and no
 * old document is edited. Exact replay verifies read-only; conflicting targets
 * or changed retained inventory refuse before any create. No CLI enables this. */
export async function importFastIngestionHistory(catalogue,token,input,{expectedSha256,reason}={}){
 Reason.parse(reason);if(!/^[a-f0-9]{64}$/.test(expectedSha256??''))fail('FAST_MIGRATION_REVIEW_REQUIRED');
 const uid=await catalogue.identity(token),plan=planFastIngestionMigration(input,{now:catalogue.now});
 if(plan.sha256!==expectedSha256)fail('FAST_MIGRATION_HASH_MISMATCH');if(plan.staticBlockers.length)fail('FAST_MIGRATION_BLOCKED');
 return catalogue.db.runTransaction(async tx=>{
  await catalogue.operator(tx,uid,'source');
  const current={version:1,capturedAt:input.snapshot.capturedAt,collections:{}};let count=0;
  for(const name of FAST_MIGRATION_COLLECTIONS){const rows=await tx.get(catalogue.db.collection(name).limit(MAX_DOCS+1));count+=rows.size;if(count>MAX_DOCS)fail('FAST_MIGRATION_LIMIT');current.collections[name]=rows.docs.map(d=>({id:d.id,data:d.data()}));}
  if(inventory(current).sha256!==plan.inventorySha256)fail('FAST_MIGRATION_INVENTORY_CHANGED');
  const receiptRef=catalogue.ref('ingestion_migrations',plan.sha256),receipt=await tx.get(receiptRef),existing=new Map();
  for(const name of ['m0_ingestion_notices','m0_ingestion_jobs','m0_ingestion_migration_notices']){
   const rows=await tx.get(catalogue.db.collection(name).where('sourceId','==',plan.sourceId).limit(MAX_NOTICES+1));if(rows.size>MAX_NOTICES)fail('FAST_MIGRATION_TARGET_CONFLICT');for(const row of rows.docs)existing.set(name+'/'+row.id,row.data());
  }
  if(receipt.exists){const checked=Receipt.safeParse(decode({data:receipt.data()})),saved=checked.data;if(!checked.success||receipt.data().sourceId!==plan.sourceId||saved.planSha256!==plan.sha256||saved.sourceId!==plan.sourceId||saved.sourceRevision!==plan.sourceRevision||saved.targetSourceRevision!==plan.targetSourceRevision||saved.inventorySha256!==plan.inventorySha256||saved.notices!==plan.noticeCount||saved.importedAt<plan.capturedAt||saved.importedAt>catalogue.now()||existing.size!==plan.proposed.length||plan.proposed.some(r=>!existing.has(r.collection+'/'+r.id)||canonical(existing.get(r.collection+'/'+r.id))!==canonical(r.data)))fail('FAST_MIGRATION_TARGET_CONFLICT');return{status:'verified',planSha256:plan.sha256,notices:plan.noticeCount,sourcePolicyApplied:false};}
  if(!plan.readyForHistoryImport)fail('FAST_MIGRATION_BLOCKED');
  if(existing.size)fail('FAST_MIGRATION_TARGET_CONFLICT');
  // Point reads also detect an unindexed conflicting document at a target ID.
  const targets=await Promise.all(plan.proposed.map(r=>tx.get(catalogue.db.collection(r.collection).doc(r.id))));if(targets.some(r=>r.exists))fail('FAST_MIGRATION_TARGET_CONFLICT');
  const at=catalogue.now();if(!InstantSchema.safeParse(at).success||at<plan.capturedAt||Date.parse(at)-Date.parse(plan.capturedAt)>MAX_AGE_MS)fail('FAST_MIGRATION_STALE');
  for(const row of plan.proposed)tx.create(catalogue.db.collection(row.collection).doc(row.id),row.data);
  tx.create(receiptRef,{...payload({version:1,sourceId:plan.sourceId,sourceRevision:plan.sourceRevision,targetSourceRevision:plan.targetSourceRevision,planSha256:plan.sha256,inventorySha256:plan.inventorySha256,notices:plan.noticeCount,importedAt:at,actor:uid,sourcePolicyApplied:false,quotaWrites:false,publication:false}),sourceId:plan.sourceId});
  tx.create(catalogue.ref('audit',randomUUID()),payload({action:'source.fast_history_import',subject:plan.sourceId,actor:uid,reason,at,planSha256:plan.sha256}));
  return{status:'imported',planSha256:plan.sha256,notices:plan.noticeCount,sourcePolicyApplied:false};
 });
}

/** Adopt only the exact reviewed target after create-only history import. All
 * retained inventory and imported rows are rechecked atomically with the policy
 * write. No grant, budget, cache or historical job is changed or released. */
export async function adoptFastIngestionSource(catalogue,token,input,{expectedSha256,reason}={}) {
 Reason.parse(reason);
 if(!/^[a-f0-9]{64}$/.test(expectedSha256??''))fail('FAST_MIGRATION_REVIEW_REQUIRED');
 const uid=await catalogue.identity(token),plan=planFastIngestionMigration(input,{now:catalogue.now});
 if(plan.sha256!==expectedSha256)fail('FAST_MIGRATION_HASH_MISMATCH');
 if(plan.staticBlockers.length)fail('FAST_MIGRATION_BLOCKED');
 const target=Source.parse(plan.proposedTargetSource);
 if(!target.automation.discovery)fail('FAST_SOURCE_DISCOVERY_REQUIRED');
 return catalogue.db.runTransaction(async tx=>{
  await catalogue.operator(tx,uid,'source');
  const sourceRef=catalogue.ref('sources',plan.sourceId),versionRef=catalogue.ref('source_versions',hash(`${target.id}:${target.revision}`));
  const adoptionRef=catalogue.ref('ingestion_adoptions',plan.sha256),receiptRef=catalogue.ref('ingestion_migrations',plan.sha256);
  const [sourceRow,versionRow,adoptionRow,receiptRow]=await Promise.all([tx.get(sourceRef),tx.get(versionRef),tx.get(adoptionRef),tx.get(receiptRef)]);
  const at=catalogue.now();InstantSchema.parse(at);
  if(adoptionRow.exists) {
   const adopted=decode({data:adoptionRow.data()});
   const valid=z.object({version:z.literal(1),sourceId:IdSchema,sourceRevision:z.number().int().positive(),planSha256:z.string(),targetSha256:z.string(),actor:IdSchema,at:InstantSchema,quotaWrites:z.literal(false),publication:z.literal(false)}).strict().safeParse(adopted);
   if(!valid.success||adopted.sourceId!==target.id||adopted.sourceRevision!==target.revision||adopted.planSha256!==plan.sha256||adopted.targetSha256!==hash(canonical(target))||adopted.at<plan.capturedAt||adopted.at>at||!sourceRow.exists||!versionRow.exists||canonical(decode({data:sourceRow.data()}))!==canonical(target)||canonical(decode({data:versionRow.data()}))!==canonical(target))fail('FAST_SOURCE_ADOPTION_CONFLICT');
   return{status:'verified',revision:target.revision,publication:false};
  }
  if(!plan.readyForHistoryImport||versionRow.exists)fail('FAST_SOURCE_ADOPTION_CONFLICT');
  const receipt=receiptRow.exists?Receipt.safeParse(decode({data:receiptRow.data()})):null;
  if(!receipt?.success||receiptRow.data().sourceId!==plan.sourceId||receipt.data.sourceId!==plan.sourceId||receipt.data.planSha256!==plan.sha256||receipt.data.inventorySha256!==plan.inventorySha256||receipt.data.sourceRevision!==plan.sourceRevision||receipt.data.targetSourceRevision!==target.revision||receipt.data.notices!==plan.noticeCount||receipt.data.importedAt<plan.capturedAt||receipt.data.importedAt>at)fail('FAST_SOURCE_HISTORY_REQUIRED');
  const current={version:1,capturedAt:input.snapshot.capturedAt,collections:{}};let count=0;
  for(const name of FAST_MIGRATION_COLLECTIONS){const rows=await tx.get(catalogue.db.collection(name).limit(MAX_DOCS+1));count+=rows.size;if(count>MAX_DOCS)fail('FAST_MIGRATION_LIMIT');current.collections[name]=rows.docs.map(d=>({id:d.id,data:d.data()}));}
  if(inventory(current).sha256!==plan.inventorySha256)fail('FAST_MIGRATION_INVENTORY_CHANGED');
  const rows=new Map();
  for(const name of ['m0_ingestion_notices','m0_ingestion_jobs','m0_ingestion_migration_notices']){
   const saved=await tx.get(catalogue.db.collection(name).where('sourceId','==',plan.sourceId).limit(MAX_NOTICES+1));
   if(saved.size>MAX_NOTICES)fail('FAST_MIGRATION_TARGET_CONFLICT');
   for(const row of saved.docs)rows.set(name+'/'+row.id,row.data());
  }
  if(rows.size!==plan.proposed.length)fail('FAST_MIGRATION_TARGET_CONFLICT');
  // Point reads also bind documents whose indexed sourceId was tampered with.
  for(const row of plan.proposed){const saved=await tx.get(catalogue.db.collection(row.collection).doc(row.id));if(!saved.exists||canonical(saved.data())!==canonical(row.data)||!rows.has(row.collection+'/'+row.id))fail('FAST_MIGRATION_TARGET_CONFLICT');}
  const finalAt=catalogue.now();InstantSchema.parse(finalAt);
  if(finalAt<at||Date.parse(finalAt)-Date.parse(plan.capturedAt)>MAX_AGE_MS)fail('FAST_MIGRATION_STALE');
  tx.set(sourceRef,payload(target));tx.create(versionRef,payload(target));
  tx.create(adoptionRef,payload({version:1,sourceId:target.id,sourceRevision:target.revision,planSha256:plan.sha256,targetSha256:hash(canonical(target)),actor:uid,at:finalAt,quotaWrites:false,publication:false}));
  tx.create(catalogue.ref('audit',randomUUID()),payload({action:'source.fast_adopt',subject:target.id,actor:uid,at:finalAt,reason,planSha256:plan.sha256}));
  return{status:'adopted',revision:target.revision,publication:false};
 });
}
