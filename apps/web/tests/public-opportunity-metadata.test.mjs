import assert from 'node:assert/strict'
import {test} from 'node:test'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {makeRecord,allFixtures} from '../../../packages/types/tests/fixtures/opportunities.mjs'
const require=createRequire(import.meta.url),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{projectOpportunity}=require('@skilved/types/opportunities/internal')
async function load(path,overrides={}){const out={},compiled=ts.transpileModule(await readFile(new URL('../src/'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}});new Function('require','exports',compiled.outputText)(id=>overrides[id]??require(id),out);return out}
const metadataModule=await load('lib/public-opportunity-metadata.ts'),build=metadataModule.publicOpportunityMetadata,origin='https://skilved.example',time='2026-10-24T10:00:00.000Z'
function current(revision=1,id='public_job'){const r=makeRecord('job');r.id=id;r.revision=revision;r.checks=r.checks.map(c=>({...c,recordRevision:revision}));r.title.value='Public rôle '+revision;return projectOpportunity(r)}
function generic(result){assert.equal(result.title.absolute,'Opportunity details | Skilved');assert.doesNotMatch(JSON.stringify(result),/Public rôle|Fictional|issuer\.example|PRIVATE_|eligib|applied|verified/);assert.deepEqual(result.robots,{index:false,follow:false});assert.deepEqual(result.openGraph.images,[]);assert.deepEqual(result.twitter.images,[])}
test('all categories and internship routes receive modest current titles and source reminders without eligibility claims',()=>{
  for(const r of allFixtures()){const p=projectOpportunity(r),out=build(p,origin,time);assert.equal(out.title.absolute,r.title.value+' | Skilved');assert.match(out.description,/Read the current listing and original source/);assert.match(out.description,/Shared previews may be out of date/);assert.deepEqual(out.robots,{index:false,follow:false});assert.equal(out.openGraph.type,'website');assert.equal(out.twitter.card,'summary');assert.deepEqual(out.openGraph.images,[]);assert.deepEqual(out.twitter.images,[]);assert.ok(out.description.length<=240);assert.doesNotMatch(JSON.stringify(out),/PRIVATE_|application destination|Grade 12|Five years|4000|rawSource|reviewer_fixture/)}
})
test('canonical and social URL use only the current returned public ID and explicit strict origin',()=>{
  const out=build(current(7,'canonical_job'),origin,time);assert.equal(out.alternates.canonical,origin+'/opportunities/canonical_job');assert.equal(out.openGraph.url,out.alternates.canonical);assert.equal(out.openGraph.title,out.title.absolute);assert.equal(out.twitter.title,out.title.absolute);assert.equal(out.openGraph.description,out.description);assert.equal(out.twitter.description,out.description);assert.doesNotMatch(JSON.stringify(out),/from=|old_reference|localhost|wa\.me/)
})
test('closed, held and application-unavailable current results omit former facts while preserving only known canonical identity',()=>{
  const r=makeRecord('job');r.id='public_job';r.lifecycle='closed';const closed=projectOpportunity(r)
  const unavailable=current();unavailable.opportunity.application={state:'unavailable',reason:'needs_review'}
  for(const value of [closed,{kind:'status',status:{schemaVersion:1,id:'canonical_job',revision:3,status:'under_review',application:'unavailable'}},unavailable]){const out=build(value,origin,time);generic(out);assert.match(out.alternates.canonical,/\/opportunities\/(public_job|canonical_job)$/)}
})
test('failed, missing, private-extra or malformed reads yield generic metadata without guessing a canonical URL',()=>{
  for(const value of [null,undefined,{kind:'unavailable'},{kind:'opportunity',opportunity:{}},{...current(),PRIVATE_TOKEN:'SECRET'},'PRIVATE_FAILURE']){const out=build(value,origin,time);generic(out);assert.equal(out.alternates.canonical,null);assert.equal(out.openGraph.url,undefined)}
})
test('absent or unsafe origin and invalid clock fail closed before public metadata is exposed',()=>{
  for(const bad of [null,'https://skilved.example/','http://skilved.example','https://u:PRIVATE@skilved.example','https://skilved.example?PRIVATE=x','https://skilved.example/path']){const out=build(current(),bad,time);generic(out);assert.equal(out.openGraph.url,undefined);assert.equal(out.alternates.canonical,null)}
  for(const bad of ['PRIVATE_CLOCK','2026-02-30T10:00:00.000Z']){const out=build(current(),origin,bad);generic(out);assert.equal(out.openGraph.url,undefined)}
})
test('source title/issuer are whole bounded fields with controls/bidi normalized; overlong names are not truncated',()=>{
  const p=current();p.opportunity.title.value='Rôle\n<&>\u202e café\u0000';p.opportunity.issuer.value='Issuer\t\u2066Co';let out=build(p,origin,time);assert.equal(out.title.absolute,'Rôle <&> café | Skilved');assert.match(out.description,/from Issuer Co/);assert.doesNotMatch(JSON.stringify(out),/\u202e|\u2066|\\u0000|\\n/)
  p.opportunity.title.value='é'.repeat(120);assert.equal(build(p,origin,time).title.absolute,'é'.repeat(120)+' | Skilved');p.opportunity.title.value='é'.repeat(121);p.opportunity.issuer.value='Z'.repeat(81);out=build(p,origin,time);assert.equal(out.title.absolute,'Job opportunity | Skilved');assert.doesNotMatch(out.description,/Z/)
})
test('unstated title/issuer values do not become source facts; summary and source destinations never enter metadata',()=>{
  const p=current();p.opportunity.title={state:'not_stated',value:null,originalText:null,citations:[]};p.opportunity.issuer={state:'not_stated',value:null,originalText:null,citations:[]};p.opportunity.summary.value='PUBLIC_SUMMARY_NOT_FOR_METADATA';const out=build(p,origin,time);assert.equal(out.title.absolute,'Job opportunity | Skilved');assert.doesNotMatch(JSON.stringify(out),/PUBLIC_SUMMARY|issuer\.example|\/apply|No recorded check/)
})
test('exact expired instructions use generic metadata, while a date without time/zone does not invent expiry',()=>{
  const p=current();p.opportunity.deadline.value={kind:'date',originalText:'23 October 2026; time/zone not stated',localDate:'2026-10-23',localTime:null,timezone:null,utcInstant:null};assert.match(build(p,origin,time).title.absolute,/Public rôle 1/)
  p.opportunity.deadline.value={kind:'date',originalText:'23 October 2026 at 12:00 SAST',localDate:'2026-10-23',localTime:'12:00',timezone:'Africa/Johannesburg',utcInstant:'2026-10-23T10:00:00.000Z'};generic(build(p,origin,time))
})
test('successive calls do not mutate or cache a prior public projection and never touch browser persistence',()=>{
  const originals=Object.fromEntries(['localStorage','sessionStorage','indexedDB'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));const p=current(),before=JSON.stringify(p)
  try{for(const k of Object.keys(originals))Object.defineProperty(globalThis,k,{configurable:true,get:()=>assert.fail('private storage read')});assert.match(build(p,origin,time).title.absolute,/rôle 1/);assert.equal(JSON.stringify(p),before);assert.match(build(current(2),origin,time).title.absolute,/rôle 2/);generic(build(null,origin,time))}finally{for(const [k,d] of Object.entries(originals)){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k]}}
})
test('page metadata and body share the same request read; a new request can observe a held record without old facts',async()=>{
  let calls=0,cacheFactories=0,result=current(4,'canonical_job')
  const requestCache=fn=>{cacheFactories++;const memo=new Map();return id=>{if(!memo.has(id))memo.set(id,fn(id));return memo.get(id)}}
  const overrides={'react':{...React,cache:requestCache},'next/link':{__esModule:true,default:({children,href})=>React.createElement('a',{href},children)},'@/components/layout/Header':{Header:()=>null},'@/components/catalogue/PublicCatalogue':{placeLabel:()=>''},'@/lib/public-catalogue':{readOpportunity:async()=>{calls++;return result}},'@/lib/public-opportunity-metadata':metadataModule,'@/lib/public-export-config':{publicExportSettings:()=>({origin})},'@/components/catalogue/PreparationChecklist':{PreparationChecklist:()=>null},'@/components/catalogue/OpportunityReport':{OpportunityReport:()=>null},'@/components/catalogue/SourceEvidence':{RequirementExplanation:()=>null,SourceEvidence:()=>null},'@/components/catalogue/EntryStage':{EntryStage:()=>null},'@/components/catalogue/OpportunityConditions':{OpportunityContext:()=>null,OpportunityConditions:()=>null},'@/components/catalogue/SavedProgress':{ApplicationRouteLink:()=>null,SaveOpportunity:()=>null},'@/components/catalogue/PublicChecklistExport':{PublicChecklistExport:()=>null},'@/lib/catalogue-query':{catalogueReturnHref:()=>null}}
  const page=await load('app/opportunities/[id]/page.tsx',overrides),params=Promise.resolve({id:'old_reference'});const [meta,body]=await Promise.all([page.generateMetadata({params}),page.default({params,searchParams:Promise.resolve({from:'/?PRIVATE_QUERY=x'})})]);assert.equal(calls,1);assert.equal(cacheFactories,1);assert.match(meta.title.absolute,/rôle 4/);assert.equal(meta.alternates.canonical,origin+'/opportunities/canonical_job');assert.match(renderToStaticMarkup(body),/Public rôle 4/);assert.doesNotMatch(JSON.stringify(meta),/old_reference|PRIVATE_QUERY/)
  result={kind:'status',status:{schemaVersion:1,id:'canonical_job',revision:5,status:'under_review',application:'unavailable'}};const next=await load('app/opportunities/[id]/page.tsx',overrides);const [held,heldBody]=await Promise.all([next.generateMetadata({params}),next.default({params})]);assert.equal(calls,2);generic(held);assert.match(renderToStaticMarkup(heldBody),/needs a fresh check/);assert.doesNotMatch(renderToStaticMarkup(heldBody),/Public rôle/)
})
