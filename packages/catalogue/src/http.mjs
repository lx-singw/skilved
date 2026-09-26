import { getRuntime } from './runtime.mjs';
import { DetailResponseSchema } from '@skilved/types/opportunities';
const headers={ 'Cache-Control':'no-store', 'Content-Type':'application/json; charset=utf-8', 'X-Content-Type-Options':'nosniff' };
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
export async function handle(request,id,provider=getRuntime) {
  try {
    const {config,catalogue}=await provider();
    if (!config.reads) return reply({error:{code:'SERVICE_UNAVAILABLE'}},503);
    if (request.method==='GET') return reply(id ? DetailResponseSchema.parse(await catalogue.detail(id)) : await catalogue.list(new URL(request.url).searchParams));
    if (request.method!=='POST' || id!==undefined || !config.reports) return reply({error:{code:'NOT_FOUND'}},404);
    if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')??'')) return reply({error:{code:'INVALID_REPORT'}},400);
    const reader=request.body?.getReader(); if (!reader) return reply({error:{code:'INVALID_REPORT'}},400);
    const chunks=[];let size=0;
    let timer;
    const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{reader.cancel().catch(()=>{});reject(new Error('BODY_TIMEOUT'));},5000);});
    try { while(true) { const {done,value}=await Promise.race([reader.read(),deadline]);if(done)break;size+=value.length;if(size>8192){await reader.cancel();return reply({error:{code:'INVALID_REPORT'}},413);} chunks.push(value); } }
    finally { clearTimeout(timer);reader.releaseLock(); }
    return reply(await catalogue.report(JSON.parse(Buffer.concat(chunks).toString('utf8'))),202);
  } catch(error) {
    const code=error?.code;
    const status=code==='NOT_FOUND'?404:code==='RATE_LIMITED'?429:['INVALID_QUERY','INVALID_CURSOR','STALE_CURSOR'].includes(code)?400:503;
    if (error?.name==='ZodError' || error instanceof SyntaxError) return reply({error:{code:request.method==='POST'?'INVALID_REPORT':'NOT_FOUND'}},request.method==='POST'?400:404);
    return reply({error:{code:status===503?'SERVICE_UNAVAILABLE':code}},status);
  }
}
