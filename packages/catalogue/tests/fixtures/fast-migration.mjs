import{createHash,randomUUID}from'node:crypto';import{FAST_MIGRATION_COLLECTIONS}from'../../src/fast-ingestion-migration.mjs';
export const migrationAt='2026-11-04T10:00:00.000Z';
export const migrationHash=s=>createHash('sha256').update(s).digest('hex');
export const migrationPayload=v=>({json:JSON.stringify(v)});
export function migrationFixture(){
 const sourceId='migration_'+randomUUID(),url='https://recentjobs.co.za/2026/11/01/authored-apprenticeship/',recordId=migrationHash(sourceId+':'+migrationHash(url)),jobId=migrationHash('job:'+sourceId),snapshotId=migrationHash('snapshot:'+sourceId);
 const source={id:sourceId,revision:1,name:'Authored legacy source',urls:['https://recentjobs.co.za/category/apprenticeships/'],permission:{reference:'Authored review',method:'recentjobs_html',reuse:'Synthetic only',reviewedAt:'2026-10-29T10:00:00.000Z'},categories:['apprenticeship'],owner:'authored_owner',paused:true,cadenceHours:24,maxBytes:500000,
  automation:{mode:'shadow',employerCrawl:false,qualificationRef:'Authored migration only',maxArticles:10,maxModelCallsPerDay:2,minRequestIntervalMs:3000,checkTtlHours:24,issuers:[]}};
 const collections=Object.fromEntries(FAST_MIGRATION_COLLECTIONS.map(name=>[name,[]]));const put=(name,id,record,native=false)=>collections['m0_'+name].push({id,data:native?record:migrationPayload(record)});
 put('sources',sourceId,source);put('worker_jobs',jobId,{id:jobId,sourceId,sourceRevision:1,kind:'detail',url,recordId,state:'exception',attempts:1,lease:null,leaseUntil:null,nextAt:'2026-11-05T22:00:00.000Z',sourceRetrievedAt:'2026-11-01T10:00:00.000Z'});
 put('snapshots',snapshotId,{id:snapshotId,sourceId,url,retrievedAt:'2026-10-31T09:00:00.000Z',sourcePublishedAt:'2000-01-01T00:00:00.000Z',text:'AUTHORED_PRIVATE_BODY_DO_NOT_PRINT'});
 put('drafts',recordId,{id:recordId,createdAt:'2026-10-30T10:00:00.000Z',updatedAt:'2026-11-03T10:00:00.000Z',publication:{approved:false,previouslyPublic:false},lifecycle:'review',private:{queueId:snapshotId}});
 put('model_budgets',migrationHash(sourceId+':2026-11-04'),{sourceId,date:'2026-11-04',calls:2});put('model_cache',migrationHash('cache:'+sourceId),{extraction:{authored:'PRIVATE_RESPONSE_DO_NOT_PRINT'},provenance:{model:'authored'}});
 return{sourceId,url,recordId,source,put,input:{version:1,sourceId,snapshot:{version:1,capturedAt:migrationAt,collections},targetPolicy:{version:'shadow_v1',discoveryIntervalMs:120000,maxConcurrentJobs:3,leaseMs:600000},externalRuns:[]}};
}
