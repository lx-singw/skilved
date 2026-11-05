import {readFile,writeFile,mkdir,readdir,realpath,symlink,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {localFastSettings} from './run-local-fast-worker.mjs';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const fail=code=>{throw Object.assign(Error(code),{code});};
const hash=text=>createHash('sha256').update(text).digest('hex');
const inside=(parent,child)=>{const p=relative(parent,child);return p!==''&&!p.startsWith('..')&&!p.startsWith('/');};
const unitQuote=value=>{if(/[\x00-\x1f\x7f]/.test(value))fail('LOCAL_SERVICE_CONFIGURATION_REQUIRED');return '"'+value.replaceAll('\\','\\\\').replaceAll('"','\\"').replaceAll('%','%%')+'"';};
const unitPath=value=>{if(/[\x00-\x1f\x7f]/.test(value))fail('LOCAL_SERVICE_CONFIGURATION_REQUIRED');return value.replaceAll('%','%%');};
async function privateOutput(path){
 const artifacts=await realpath(resolve(root,'.artifacts')),output=resolve(root,path);if(!inside(artifacts,output))fail('LOCAL_SERVICE_PRIVATE_OUTPUT_REQUIRED');
 let parent=dirname(output);
 for(;;){try{if(!inside(artifacts,resolve(await realpath(parent),relative(parent,output))))fail('LOCAL_SERVICE_PRIVATE_OUTPUT_REQUIRED');break;}catch(error){if(error.code!=='ENOENT')throw error;parent=dirname(parent);}}
 await mkdir(dirname(output),{recursive:true});if(!inside(artifacts,resolve(await realpath(dirname(output)),output.split('/').at(-1))))fail('LOCAL_SERVICE_PRIVATE_OUTPUT_REQUIRED');
 try{await mkdir(output,{mode:0o700});}catch(error){if(error.code==='EEXIST')fail('LOCAL_SERVICE_ALREADY_EXISTS');throw error;}return output;
}
async function tree(path,extension){
 const result=[];
 for(const entry of await readdir(resolve(root,path),{withFileTypes:true})){
  const child=path+'/'+entry.name;if(entry.isDirectory())result.push(...await tree(child,extension));
  else if(entry.isFile()&&entry.name.endsWith(extension))result.push(child);else if(entry.isSymbolicLink())fail('LOCAL_SERVICE_SOURCE_SYMLINK');
 }return result.sort();
}

/** Freeze owned runtime code and compile its own contracts. Preparation has no
 * identity, database, service installation, provider or permission side effects. */
export async function prepareLocalFastService({outputDir,sourceId,sourceRevision,principal,account,envFile,refreshPrivate=true}={}){
 if(process.platform!=='linux'||typeof outputDir!=='string'||typeof envFile!=='string'||typeof refreshPrivate!=='boolean')fail('LOCAL_SERVICE_CONFIGURATION_REQUIRED');
 const args=['--enable-shadow',sourceId,String(sourceRevision),'--principal',principal,'--account',account,...(refreshPrivate?['--refresh-private']:[])];
 localFastSettings(args,{NODE_ENV:'production',SKILVED_CATALOGUE_MODE:'cloud',SKILVED_CATALOGUE_PROJECT:'skilved-staging',SKILVED_CATALOGUE_READS:'false',SKILVED_CATALOGUE_REPORTS:'false',SKILVED_SUGGESTIONS_ENABLED:'false',SKILVED_AI_MODE:'gemini'});
 const artifacts=await realpath(resolve(root,'.artifacts')),environment=await realpath(resolve(root,envFile)),envStat=await stat(environment);
 if(!inside(artifacts,environment)||!envStat.isFile()||(envStat.mode&0o077)!==0)fail('LOCAL_SERVICE_PRIVATE_ENV_REQUIRED');
 const output=await privateOutput(outputDir),bundle=resolve(output,'release');await mkdir(bundle,{mode:0o700});
 const files=[
  'pnpm-lock.yaml','packages/catalogue/package.json','packages/types/package.json','packages/types/tsconfig.contracts.json',
  ...await tree('packages/catalogue/src','.mjs'),...await tree('packages/types/src/opportunities','.ts'),
  ...['run-local-fast-worker.mjs','run-fast-recentjobs.mjs','gcloud-credentials.mjs'].map(name=>'packages/catalogue/tools/'+name)
 ];
 for(const file of files){const destination=resolve(bundle,file);await mkdir(dirname(destination),{recursive:true});await writeFile(destination,await readFile(resolve(root,file)),{mode:0o600});}
 // Dependency links point to installed immutable-version package locations.
 // Our workspace contracts always resolve to the frozen, separately built copy.
 for(const pkg of ['catalogue','types']){
  const manifest=JSON.parse(await readFile(resolve(bundle,'packages',pkg,'package.json'),'utf8'));
  for(const name of Object.keys(manifest.dependencies??{})){
   const destination=resolve(bundle,'packages',pkg,'node_modules',name);await mkdir(dirname(destination),{recursive:true});
   await symlink(name==='@skilved/types'?resolve(bundle,'packages/types'):await realpath(resolve(root,'packages',pkg,'node_modules',name)),destination,'dir');
  }
 }
 const compiler=await realpath(resolve(root,'packages/types/node_modules/typescript/bin/tsc'));
 execFileSync(process.execPath,[compiler,'-p',resolve(bundle,'packages/types/tsconfig.contracts.json')],{cwd:bundle,stdio:['ignore','pipe','pipe'],timeout:60000});
 const compiled=[];
 async function compiledFiles(path){for(const entry of await readdir(resolve(bundle,path),{withFileTypes:true})){const child=path+'/'+entry.name;if(entry.isDirectory())await compiledFiles(child);else if(entry.isFile())compiled.push(child);}}
 await compiledFiles('packages/types/dist');
 const digests={};for(const file of [...files,...compiled].sort())digests[file]=hash(await readFile(resolve(bundle,file)));
 const release={version:1,baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),files:digests,publication:false};
 const releaseText=JSON.stringify(release,null,2)+'\n',releaseHash=hash(releaseText);await writeFile(resolve(bundle,'release.json'),releaseText,{mode:0o600});
 await writeFile(resolve(bundle,'bootstrap.mjs'),`import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';
const hash=value=>createHash('sha256').update(value).digest('hex');
try{const text=await readFile(new URL('release.json',import.meta.url));if(hash(text)!=='${releaseHash}')throw Error();const release=JSON.parse(text);for(const[path,digest]of Object.entries(release.files)){if(!/^(packages\\/(catalogue|types)\\/|pnpm-lock\\.yaml$)/.test(path)||path.split('/').includes('..')||hash(await readFile(new URL(path,import.meta.url)))!==digest)throw Error();}}
catch{console.error(JSON.stringify({error:'LOCAL_FAST_RELEASE_CHANGED',exitCode:78}));process.exit(78);}
const{runLocalFastWorker,localWorkerFailure}=await import('./packages/catalogue/tools/run-local-fast-worker.mjs');
try{const result=await runLocalFastWorker(process.argv.slice(2));if(result.help)console.log(result.help);}catch(error){const failure=localWorkerFailure(error);console.error(JSON.stringify(failure));process.exitCode=failure.exitCode;}
`,{mode:0o600});
 const unitName='skilved-fast-'+sourceId+'.service';
 const gcloud=await realpath(execFileSync('which',['gcloud'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim());
 const runtimePath=dirname(gcloud)+':/usr/local/bin:/usr/bin:/bin';
 const unit=`[Unit]\nDescription=Skilved local private ingestion\nStartLimitIntervalSec=600\nStartLimitBurst=4\n\n[Service]\nType=simple\nWorkingDirectory=${unitPath(bundle)}\nEnvironment=${unitQuote('PATH='+runtimePath)}\nEnvironmentFile=${unitPath(environment)}\nExecStart=${[process.execPath,resolve(bundle,'bootstrap.mjs'),...args].map(unitQuote).join(' ')}\nRestart=always\nRestartSec=30\nRestartPreventExitStatus=78\nKillSignal=SIGTERM\nKillMode=mixed\nTimeoutStopSec=20min\nUMask=0077\nNoNewPrivileges=true\nStandardOutput=journal\nStandardError=journal\n\n[Install]\nWantedBy=default.target\n`;
 await writeFile(resolve(output,unitName),unit,{mode:0o600});
 const result={version:1,outputDir:output,unitName,releaseHash,baseCommit:release.baseCommit,sourceId,sourceRevision,refreshPrivate,runtimePath,frozenOwnedFiles:Object.keys(digests).length,workspaceContractsCopied:true,environmentCopied:false,credentialsCreated:false,installed:false,started:false,publication:false};
 await writeFile(resolve(output,'service-plan.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{if(process.argv.length!==3)fail('INVALID_COMMAND');const input=JSON.parse(await readFile(process.argv[2],'utf8'));console.log(JSON.stringify(await prepareLocalFastService(input)));}
 catch(error){console.error(JSON.stringify({error:/^[A-Z][A-Z0-9_]{0,99}$/.test(error?.code??'')?error.code:'LOCAL_SERVICE_PREPARATION_FAILED'}));process.exitCode=1;}
}
