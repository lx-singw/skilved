import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {activateStagingGeminiAuthority} from '../src/gemini-authority-cutover.mjs';
import {STAGING_MIGRATION_COLLECTIONS,stagingMigrationManifestHash} from '../src/staging-migration.mjs';
import {GEMINI_AUTHORITY_ROUTES} from '../src/ai/gemini-authority-routes.mjs';
const at='2026-10-25T15:00:00.000Z',clone=v=>JSON.parse(JSON.stringify(v));
const sha=v=>createHash('sha256').update(v).digest('hex');
const scopeHash=GEMINI_AUTHORITY_ROUTES[0].scopeHash,model='gemini-3.5-flash-lite';
const env={SKILVED_CATALOGUE_MODE:'cloud',SKILVED_CATALOGUE_PROJECT:'skilved-staging'};
const payload=(id,record)=>({id,data:{json:JSON.stringify(record)}});
function fixture(){
 const source={id:'fixture_source',revision:1,name:'Synthetic cutover source',urls:['https://recentjobs.co.za/category/apprenticeships/'],
  permission:{reference:'Synthetic test',method:'recentjobs_html',reuse:'Private test only',reviewedAt:at},
  categories:['apprenticeship'],owner:'fixture_owner',paused:false,cadenceHours:6,maxBytes:500000,
  automation:{mode:'shadow',employerCrawl:false,qualificationRef:'Synthetic',maxArticles:1,maxModelCallsPerDay:12,
   minRequestIntervalMs:3000,checkTtlHours:6,issuers:[]}};
 const collections=Object.fromEntries(STAGING_MIGRATION_COLLECTIONS.map(k=>[k,[]]));
 collections.m0_sources=[payload(source.id,source)];
 collections.m0_model_budgets=[payload(sha(`${source.id}:2026-10-25`),{sourceId:source.id,date:'2026-10-25',calls:1})];
 collections.m0_model_usage=[payload(sha(`${scopeHash}:${model}:2026-10-25`),{scopeHash,provider:'gemini',model,date:'2026-10-25',
  requests:2,knownInputTokens:1,knownTotalTokens:3,unknownUsageCalls:1,minute:[]})];
 collections.m0_model_calls=[payload('spent_call',{sourceId:source.id,at,provider:'gemini'})];
 const manifest={version:1,scope:'private_worker_history',targetProjectId:'skilved-staging',createdAt:at,
  provenance:{pilotSha256:'b'.repeat(64),quotaSha256:'c'.repeat(64),pilotObservedAt:at,quotaExportedAt:at},
  sourceBindings:[{id:source.id,revision:1,maxModelCallsPerDay:12}],
  quotaSummary:{scopeHash,requests:2,knownTotalTokens:3,unknownUsageCalls:1},collections};
 manifest.sha256=stagingMigrationManifestHash(manifest);
 const data=new Map();for(const [name,rows]of Object.entries(collections))for(const row of rows)data.set(`${name}/${row.id}`,row.data);
 const counts=Object.fromEntries(Object.entries(collections).map(([name,rows])=>[name,rows.length]));
 data.set(`m0_staging_imports/${manifest.sha256}`,{json:JSON.stringify({version:1,targetProjectId:'skilved-staging',
  manifestSha256:manifest.sha256,documentCount:4,collectionCounts:counts,sourceBindings:manifest.sourceBindings,
  quotaSummary:manifest.quotaSummary,provenance:manifest.provenance,authorityCreated:false,publication:false,
  operationalState:'inactive_replica',representation:'legacy_semantic_reconstruction',importedAt:at})});
 const runs=[];let abort=false,beforeCommit;
 const snap=(key,value)=>({id:key.split('/')[1],exists:value!==undefined,data:()=>clone(value)});
 const db={projectId:'skilved-staging',databaseId:'(default)',data,runs,
  collection:name=>({doc:id=>({name,id}),limit:limit=>({name,limit}),orderBy:()=>({limit:limit=>({name,limit})})}),
  async runTransaction(work,options={}){
   const pending=[],run={readOnly:options.readOnly===true,writes:0};runs.push(run);
   if(!run.readOnly&&beforeCommit)beforeCommit();
   const result=await work({get:async ref=>{
    assert.equal(pending.length,0,'reads before writes');
    if(ref.id!==undefined)return snap(`${ref.name}/${ref.id}`,data.get(`${ref.name}/${ref.id}`));
    const docs=[...data].filter(([key])=>key.startsWith(ref.name+'/')).sort(([a],[b])=>a.localeCompare(b))
     .slice(0,ref.limit).map(([key,value])=>snap(key,value));return {docs,size:docs.length};
   },create:(ref,value)=>{
    assert.equal(run.readOnly,false);assert.equal(data.has(`${ref.name}/${ref.id}`),false);
    pending.push([`${ref.name}/${ref.id}`,clone(value)]);run.writes++;
   }});
   if(abort&&pending.length)throw Error('COMMIT_INTERRUPTED');
   for(const [key,value]of pending)data.set(key,value);return result;
  },interrupt:()=>{abort=true;},beforeWrite:work=>{beforeCommit=work;}};
 return {db,manifest,options:{expectedSha256:manifest.sha256,expectedQuotaSha256:'c'.repeat(64),
  drain:{at,sha256:'d'.repeat(64)},env,now:()=>at}};
}
test('cutover creates only authority and receipt, leaving complete history unchanged; replay is read-only',async()=>{
 const {db,manifest,options}=fixture(),before=clone([...db.data]);
 const result=await activateStagingGeminiAuthority(db,manifest,options);assert.equal(result.status,'activated');
 assert.equal(result.documentCount,4);assert.equal(db.data.size,before.length+2);
 for(const [key,value]of before)assert.deepEqual(db.data.get(key),value);
 assert.equal(db.runs.at(-1).writes,2);
 const beforeRetry=db.runs.length,retry=await activateStagingGeminiAuthority(db,manifest,options);
 assert.equal(retry.status,'verified');assert.equal(retry.activatedAt,result.activatedAt);
 assert.ok(db.runs.slice(beforeRetry).every(run=>run.readOnly&&run.writes===0));
});
test('interrupted commit leaves no partial authority or handoff',async()=>{
 const {db,manifest,options}=fixture(),before=clone([...db.data]);db.interrupt();
 await assert.rejects(activateStagingGeminiAuthority(db,manifest,options),/COMMIT_INTERRUPTED/);
 assert.deepEqual([...db.data],before);
});
test('changed counters, source history or receipt and pre-existing authority reject without writes',async()=>{
 for(const change of [db=>db.data.delete([...db.data.keys()].find(k=>k.startsWith('m0_model_usage/'))),
  db=>db.data.set('m0_model_usage/extra',{json:'{}'}),
  db=>db.data.set([...db.data.keys()].find(k=>k.startsWith('m0_sources/')),{json:'{}'}),
  db=>db.data.set([...db.data.keys()].find(k=>k.startsWith('m0_staging_imports/')),{json:'{}'}),
  db=>db.data.set(`m0_model_authorities/${scopeHash}`,{json:'{}'})]){
  const {db,manifest,options}=fixture();change(db);const before=clone([...db.data]);
  await assert.rejects(activateStagingGeminiAuthority(db,manifest,options),{code:'GEMINI_CUTOVER_CONFLICT'});
  assert.deepEqual([...db.data],before);assert.ok(db.runs.every(r=>r.writes===0));
 }
});
test('operational grants, queues, leases, watches and public rows prevent activation',async()=>{
 for(const name of ['workers','operators','worker_queue','worker_leases','worker_watches','public']){
  const {db,manifest,options}=fixture();db.data.set(`m0_${name}/active`,{active:true});
  await assert.rejects(activateStagingGeminiAuthority(db,manifest,options),{code:'GEMINI_CUTOVER_ACTIVE_TARGET'});
  assert.ok(db.runs.every(r=>r.writes===0));
 }
});
test('cutover requires the default staging database, reviewed ledger and fresh drain evidence',async()=>{
 for(const change of [{env:{}},{env:{...env,SKILVED_CATALOGUE_PROJECT:'skilved-dev'}},
  {expectedQuotaSha256:'e'.repeat(64)},{drain:{at:'2026-10-25T14:49:59.999Z',sha256:'d'.repeat(64)}},
  {drain:{at:'2026-10-25T15:00:00.001Z',sha256:'d'.repeat(64)}}]){
  const {db,manifest,options}=fixture();await assert.rejects(activateStagingGeminiAuthority(db,manifest,{...options,...change}));
  assert.equal(db.runs.length,0);
 }
 const {db,manifest,options}=fixture();db.databaseId='another';
 await assert.rejects(activateStagingGeminiAuthority(db,manifest,options),{code:'UNSAFE_CONFIGURATION'});
});
test('transaction recheck prevents activation when history changes after read-only preflight',async()=>{
 const {db,manifest,options}=fixture();db.beforeWrite(()=>db.data.set('m0_model_usage/late_call',{json:'{}'}));
 await assert.rejects(activateStagingGeminiAuthority(db,manifest,options),{code:'GEMINI_CUTOVER_CONFLICT'});
 assert.ok(db.runs.every(r=>r.writes===0));
});
