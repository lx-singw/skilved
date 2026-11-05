import {mkdir,readFile,writeFile,symlink,realpath} from 'node:fs/promises';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const fail=code=>{throw Error(code);};
const inside=(parent,child)=>{const path=relative(parent,child);return path!==''&&!path.startsWith('..')&&!path.startsWith('/');};
async function checkedParent(artifacts,output){
 let ancestor=dirname(output);
 for(;;){try{const actual=await realpath(ancestor),target=resolve(actual,relative(ancestor,output));if(!inside(artifacts,target))fail('PRIVATE_VIEWER_OUTPUT_REQUIRED');return;}catch(error){if(error.code!=='ENOENT')throw error;const parent=dirname(ancestor);if(parent===ancestor)fail('PRIVATE_VIEWER_OUTPUT_REQUIRED');ancestor=parent;}}
}

/** Prepare a credential-free private UI copy. No server, auth, model request,
 * database write or deployment is performed by this command. Never overwrites. */
export async function preparePrivateApplicantViewer({outputDir,gatewayPort=3000}={}) {
 if(typeof outputDir!=='string'||!Number.isSafeInteger(gatewayPort)||gatewayPort<1024||gatewayPort>65535)fail('PRIVATE_VIEWER_CONFIGURATION_REQUIRED');
 const artifacts=await realpath(resolve(root,'.artifacts')),output=resolve(root,outputDir);
 if(!inside(artifacts,output))fail('PRIVATE_VIEWER_OUTPUT_REQUIRED');
 await checkedParent(artifacts,output);await mkdir(dirname(output),{recursive:true});
 if(!inside(artifacts,resolve(await realpath(dirname(output)),output.split('/').at(-1))))fail('PRIVATE_VIEWER_OUTPUT_REQUIRED');
 try{await mkdir(output);}catch(error){if(error.code==='EEXIST')fail('PRIVATE_VIEWER_ALREADY_EXISTS');throw error;}
 const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const files=['package.json','next.config.js','tsconfig.json','next-env.d.ts','postcss.config.js','tailwind.config.ts','eslint.config.mjs','src','public'].map(p=>'apps/web/'+p);
 const archive=execFileSync('git',['archive','--format=tar',commit,...files],{cwd:root,maxBuffer:20000000});
 execFileSync('tar',['-x','--strip-components=2','-C',output],{input:archive});
 await symlink(resolve(root,'apps/web/node_modules'),resolve(output,'node_modules'),'dir');
 const save=(name,text)=>writeFile(resolve(output,name),text);
 const replace=async(name,from,to)=>{const text=await readFile(resolve(output,name),'utf8');if(!text.includes(from))fail('PRIVATE_VIEWER_BASE_CHANGED');await save(name,text.replaceAll(from,to));};
 await replace('src/app/layout.tsx','<ThemeProvider>','<ThemeProvider><aside role="note" style={{padding:"12px 20px",background:"#f4cd74",color:"#241d12",textAlign:"center",fontSize:14}}>PRIVATE DRAFT FEED · Unapproved records · Browser-local saves · Application actions disabled · Nothing publicly published</aside>');
 await save('src/middleware.ts',`import{NextResponse}from'next/server';import type{NextRequest}from'next/server';
export function middleware(request:NextRequest){const gate=process.env.SKILVED_PRIVATE_PREVIEW_GATE;if(!gate||request.headers.get('x-skilved-preview-gate')!==gate)return new NextResponse('Private authentication required',{status:403,headers:{'Cache-Control':'no-store'}});return NextResponse.next();}
export const config={matcher:['/:path*']};
`);
 await save('src/lib/public-catalogue.ts',`import{headers}from'next/headers';import{DetailResponseSchema,IdSchema,ListResponseSchema,parseReadQuery}from'@skilved/types/opportunities';
export type CatalogueReadResult={kind:'page';page:ReturnType<typeof ListResponseSchema.parse>}|{kind:'error';reason:'invalid_query'|'invalid_cursor'|'stale_cursor'|'unavailable'};
async function current(path:string){const session=(await headers()).get('x-skilved-review-session');if(!session)throw Error('PRIVATE_PREVIEW_AUTH_REQUIRED');const response=await fetch('http://127.0.0.1:${gatewayPort}'+path,{headers:{'x-skilved-preview-gate':process.env.SKILVED_PRIVATE_PREVIEW_GATE??'','x-skilved-review-session':session},cache:'no-store'});if(!response.ok){const error=await response.json().catch(()=>({}));throw Error(error?.error?.code??'PRIVATE_PREVIEW_UNAVAILABLE');}return response.json();}
export async function readCatalogue(query:URLSearchParams):Promise<CatalogueReadResult>{if(!parseReadQuery(query).ok)return{kind:'error',reason:'invalid_query'};try{const result=await current('/__private-feed?'+query.toString());if(result.publication!==false)throw Error('PRIVATE_PREVIEW_UNAVAILABLE');return{kind:'page',page:ListResponseSchema.parse(result.page)};}catch(error){const code=error instanceof Error?error.message:'';return{kind:'error',reason:code==='STALE_CURSOR'?'stale_cursor':code==='INVALID_CURSOR'?'invalid_cursor':'unavailable'};}}
export async function readOpportunity(id:string){if(!IdSchema.safeParse(id).success)return null;try{const result=await current('/__private-detail?id='+encodeURIComponent(id));if(result.publication!==false)throw Error('PRIVATE_PREVIEW_UNAVAILABLE');return DetailResponseSchema.parse(result.projection);}catch(error){return error instanceof Error&&error.message==='NOT_FOUND'?null:{kind:'unavailable' as const};}}
`);
 await save('src/app/api/v1/opportunities/route.ts',`import{readCatalogue}from'@/lib/public-catalogue';export const dynamic='force-dynamic';export async function GET(request:Request){const result=await readCatalogue(new URL(request.url).searchParams);return Response.json(result.kind==='page'?result.page:{error:{code:'SERVICE_UNAVAILABLE'}},{status:result.kind==='page'?200:503,headers:{'Cache-Control':'no-store'}});}`);
 await save('src/app/api/v1/opportunities/[id]/route.ts',`import{readOpportunity}from'@/lib/public-catalogue';export const dynamic='force-dynamic';export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){const result=await readOpportunity((await params).id);return Response.json(result??{error:{code:'NOT_FOUND'}},{status:!result?404:result.kind==='unavailable'?503:200,headers:{'Cache-Control':'no-store'}});}`);
 await save('src/components/catalogue/PrivateFeedRefresh.tsx',`"use client"
import{useCallback,useEffect,useRef,useTransition}from'react';import{useRouter}from'next/navigation';
export function PrivateFeedRefresh({checkedAt}:{checkedAt:string|null}){
 const router=useRouter(),[pending,start]=useTransition(),last=useRef(Date.now());
 const refresh=useCallback(()=>{if(document.visibilityState!=='visible'||pending)return;last.current=Date.now();start(()=>router.refresh());},[router,pending]);
 useEffect(()=>{
  const focus=()=>{if(Date.now()-last.current>=5000)refresh();};
  const timer=window.setInterval(refresh,60000);window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);
  return()=>{window.clearInterval(timer);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus);};
 },[refresh]);
 return <div role="status" style={{padding:'10px 0',fontSize:13}}>
  <p>Private drafts · {checkedAt?<>Last checked <time dateTime={checkedAt}>{new Intl.DateTimeFormat('en-ZA',{hour:'2-digit',minute:'2-digit',timeZone:'Africa/Johannesburg'}).format(new Date(checkedAt))} SAST</time>. Source-check dates are shown separately.</>:'Current results not loaded.'}</p>
  <p>Checks for new drafts every minute while this tab is visible. <button type="button" onClick={refresh} disabled={pending}>{pending?'Checking…':'Check now'}</button></p>
 </div>;
}
`);
 await replace('src/components/catalogue/PublicCatalogue.tsx','import Link from "next/link"','import Link from "next/link"\nimport { PrivateFeedRefresh } from "./PrivateFeedRefresh"');
 await replace('src/components/catalogue/PublicCatalogue.tsx','<FeedHeading /><FeedFilters selected={selected} />','<FeedHeading /><PrivateFeedRefresh checkedAt={page?.asOf ?? null} /><FeedFilters selected={selected} />');
 for(const [file,from,to]of [
  ['src/components/catalogue/FeedDiscovery.tsx','published notice','private preview notice'],
  ['src/components/catalogue/PublicCatalogue.tsx','published notices','private preview notices'],
  ['src/components/catalogue/PublicCatalogue.tsx','No published opportunities yet','No private preview opportunities yet'],
  ['src/components/layout/Header.tsx','Explore at your own pace. Browsing is free, with no sign-in needed.','Your private local feed. Sign-in protects these unapproved drafts.'],
  ['src/components/catalogue/SavedProgress.tsx','Copy public link','Copy local link'],
  ['src/components/catalogue/SavedProgress.tsx','Check current public details for','Check current preview details for']])await replace(file,from,to);
 const manifest={version:1,commit,outputDir:output,gatewayPort,localEnvFilesCopied:false,credentialsCopied:false,autoRefreshMs:60000,publication:false};
 await save('private-viewer.json',JSON.stringify(manifest,null,2)+'\n');return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{if(process.argv.length<3||process.argv.length>4)fail('PRIVATE_VIEWER_CONFIGURATION_REQUIRED');const result=await preparePrivateApplicantViewer({outputDir:process.argv[2],gatewayPort:process.argv[3]===undefined?3000:Number(process.argv[3])});console.log(JSON.stringify(result));}
 catch(error){console.error(JSON.stringify({error:/^PRIVATE_VIEWER_[A-Z_]+$/.test(error.message??'')?error.message:'PRIVATE_VIEWER_PREPARATION_FAILED'}));process.exitCode=1;}
}
