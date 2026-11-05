import {readFile,writeFile,mkdir,mkdtemp,readdir,symlink} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
const paths=['packages/catalogue/src/recentjobs-worker.mjs','packages/catalogue/src/schemas.mjs'];
function once(text,from,to) {
  if(text.split(from).length!==2)throw Error('APPLICATION_LAYOUT_INTEGRATION_DRIFT');
  return text.replace(from,to);
}
export function buildApplicationLayoutIntegration(worker,schema) {
  let next=once(worker,"import { parseRecentJobsList, parseRecentJobsDetail } from './adapters/recentjobs.mjs';","import { parseRecentJobsList } from './adapters/recentjobs.mjs';\nimport {parseWorkerDetail,sourceHoldAdapterFields,sourceHoldAdapterMatches} from './worker-detail-adapter.mjs';");
  next=once(next,'programmeExtraction: this.programmeExtraction, reason: code, jobId: job.id,','programmeExtraction: this.programmeExtraction, ...sourceHoldAdapterFields(source), reason: code, jobId: job.id,');
  next=once(next,'saved.version !== SOURCE_HOLD_VERSION || saved.programmeExtraction !== this.programmeExtraction ||','saved.version !== SOURCE_HOLD_VERSION || saved.programmeExtraction !== this.programmeExtraction || !sourceHoldAdapterMatches(source,saved) ||');
  next=once(next,'const candidate = parseRecentJobsDetail({ html: response.text, url: response.url, observedOn: dayInSA(this.now()) });','const candidate = parseWorkerDetail(claim.source, { html: response.text, url: response.url, observedOn: dayInSA(this.now()) });');
  let nextSchema=once(schema,"    originalVerification: z.literal('shadow_v1').optional(),","    applicationLayouts: z.literal('shadow_v1').optional(),\n    originalVerification: z.literal('shadow_v1').optional(),");
  nextSchema=once(nextSchema,"  'Origin discovery requires the shadow issuer registry').refine(source =>","  'Origin discovery requires the shadow issuer registry').refine(source =>\n  !source.automation?.applicationLayouts || source.automation.mode === 'shadow',\n  'Application layouts require explicit shadow mode').refine(source =>");
  return{worker:next,schema:nextSchema};
}

/** Prepare an unapplied, local-only integration and its emulator entry points. */
export async function prepareApplicationLayoutIntegration() {
  const before=await Promise.all(paths.map(p=>readFile(join(root,p),'utf8')));
  const built=buildApplicationLayoutIntegration(...before),after=[built.worker,built.schema];
  const parent=join(root,'.artifacts/shadow');await mkdir(parent,{recursive:true,mode:0o700});
  const directory=await mkdtemp(join(parent,'application-layout-integration-'));
  for(const folder of ['src','tests'])await mkdir(join(directory,folder),{mode:0o700});
  await symlink(join(root,'packages/catalogue/node_modules'),join(directory,'node_modules'));
  for(const file of await readdir(join(root,'packages/catalogue/src'))) {
    if(['recentjobs-worker.mjs','schemas.mjs'].includes(file))continue;
    await symlink(join(root,'packages/catalogue/src',file),join(directory,'src',file));
  }
  await writeFile(join(directory,'src/recentjobs-worker.mjs'),after[0],{flag:'wx',mode:0o600});
  await writeFile(join(directory,'src/schemas.mjs'),after[1],{flag:'wx',mode:0o600});
  for(const file of await readdir(join(root,'packages/catalogue/tests'))) {
    if(file==='worker.test.mjs')continue;
    await symlink(join(root,'packages/catalogue/tests',file),join(directory,'tests',file));
  }
  await writeFile(join(directory,'tests/worker.test.mjs'),await readFile(join(root,'packages/catalogue/tests/worker.test.mjs')),{flag:'wx',mode:0o600});
  const literal=p=>JSON.stringify(pathToFileURL(join(root,p)).href);
  const entry=`import{test,before,after}from'node:test';
import{RecentJobsWorker}from'./src/recentjobs-worker.mjs';import{Source}from'./src/schemas.mjs';
import{getRuntime}from ${literal('packages/catalogue/src/runtime.mjs')};
import{registerApplicationLayoutWorkerCases}from ${literal('packages/catalogue/tests/fixtures/application-layout-worker-cases.mjs')};
process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-layout-integration';
let db;before(async()=>{db=(await getRuntime()).db;});after(async()=>{await db?.terminate();});
const proxy={collection:(...a)=>db.collection(...a),runTransaction:(...a)=>db.runTransaction(...a)};
registerApplicationLayoutWorkerCases(test,proxy,RecentJobsWorker,Source);
`;
  await writeFile(join(directory,'integration.test.mjs'),entry,{flag:'wx',mode:0o600});
  let patch='';
  for(let i=0;i<paths.length;i++) {
    const target=join(directory,'src',paths[i].split('/').at(-1));
    const diff=spawnSync('git',['diff','--no-index','--',paths[i],target],{cwd:root,encoding:'utf8'});
    if(diff.status!==1)throw Error('APPLICATION_LAYOUT_INTEGRATION_DIFF_FAILED');
    patch+=diff.stdout.replaceAll('b/'+target.replace(/^\//,''),'b/'+paths[i]);
  }
  const patchPath=join(directory,'integration.patch');await writeFile(patchPath,patch,{flag:'wx',mode:0o600});
  const check=spawnSync('git',['apply','--check',patchPath],{cwd:root,encoding:'utf8'});
  if(check.status!==0)throw Error('APPLICATION_LAYOUT_INTEGRATION_PATCH_INVALID');
  for(let i=0;i<paths.length;i++)if(hash(await readFile(join(root,paths[i])))!==hash(before[i]))throw Error('APPLICATION_LAYOUT_INTEGRATION_DRIFT');
  const manifest={version:1,createdAt:new Date().toISOString(),directory,patchPath,patchSha256:hash(patch),files:paths.map((path,i)=>({path,before:hash(before[i]),after:hash(after[i])})),
    integrationTests:join(directory,'integration.test.mjs'),regressionTests:join(directory,'tests/worker.test.mjs'),
    applied:false,activationPending:true,networkRequests:0,providerCalls:0,cloudWrites:0};
  await writeFile(join(directory,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  if(process.argv.length===3&&process.argv[2]==='--help')console.log('Usage: node packages/catalogue/tools/prepare-application-layout-integration.mjs\nPrepares an UNAPPLIED patch and isolated emulator test entry points under ignored .artifacts/shadow/. Never enables a source, changes the live worker or calls a provider.');
  else try{if(process.argv.length!==2)throw Error('APPLICATION_LAYOUT_INTEGRATION_ARGUMENT_INVALID');console.log(JSON.stringify(await prepareApplicationLayoutIntegration()));}
  catch(error){console.error(JSON.stringify({error:/^APPLICATION_LAYOUT_INTEGRATION_[A-Z_]+$/.test(error.message??'')?error.message:'APPLICATION_LAYOUT_INTEGRATION_FAILED'}));process.exitCode=1;}
}
