import {IdSchema} from '@skilved/types/opportunities';
import {handle} from './http.mjs';
import {DomainError} from './config.mjs';

const fail=()=>{throw new DomainError('PRIVATE_READ_CHECK_FAILED');};
/** Bounded, read-only acceptance check for a catalogue whose drafts are still private. */
export async function verifyPrivateCatalogueReads(runtime, privateIds) {
  if (runtime?.config?.reads !== true || runtime.config.reports !== false || !runtime.catalogue ||
      !Array.isArray(privateIds) || privateIds.length < 1 || privateIds.length > 20 ||
      new Set(privateIds).size !== privateIds.length || privateIds.some(id=>!IdSchema.safeParse(id).success)) fail();
  const provider=async()=>runtime;
  const get=(id)=>handle(new Request('https://skilved.invalid/api/v1/opportunities'+(id?'/'+id:'')),id,provider);
  const safeHeaders=response=>response.headers.get('cache-control')==='no-store' &&
    response.headers.get('x-content-type-options')==='nosniff' &&
    response.headers.get('content-type')==='application/json; charset=utf-8';
  const feed=await get();
  if(feed.status!==200 || !safeHeaders(feed))fail();
  const list=await feed.json();
  if(list.schemaVersion!==1 || !Number.isSafeInteger(list.catalogueRevision) ||
      !Array.isArray(list.items) || list.items.length!==0 || list.nextCursor!==null)fail();
  for(const id of privateIds){
    const response=await get(id);
    if(response.status!==404 || !safeHeaders(response) ||
        JSON.stringify(await response.json())!==JSON.stringify({error:{code:'NOT_FOUND'}}))fail();
  }
  const report=await handle(new Request('https://skilved.invalid/api/v1/reports',{
    method:'POST',headers:{'Content-Type':'application/json'},body:'{}',
  }),undefined,provider);
  if(report.status!==404 || !safeHeaders(report) ||
      JSON.stringify(await report.json())!==JSON.stringify({error:{code:'NOT_FOUND'}}))fail();
  // Refuse a check overlapping a catalogue mutation; the caller can review and rerun.
  const latest=await get();
  if(latest.status!==200 || !safeHeaders(latest))fail();
  const last=await latest.json();
  if(last.catalogueRevision!==list.catalogueRevision || last.items?.length!==0 || last.nextCursor!==null)fail();
  return {schemaVersion:1,catalogueRevision:list.catalogueRevision,publicItems:0,
    privateDetailsChecked:privateIds.length,privateDetailStatus:404,reportsDisabled:true,noStore:true,
    sourceRequests:0,providerCalls:0,publication:false};
}
