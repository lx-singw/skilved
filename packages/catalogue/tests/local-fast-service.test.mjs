import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,realpath,rm,chmod,symlink,access,readlink,unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tmpdir,homedir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
import {spawnSync,execFileSync} from 'node:child_process';
import {prepareLocalFastService} from '../tools/prepare-local-fast-service.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const nativeTools=process.platform==='linux'&&spawnSync('which',['gcloud']).status===0&&spawnSync('which',['systemd-analyze']).status===0&&
 ['running','degraded'].includes(spawnSync('systemctl',['--user','is-system-running'],{encoding:'utf8'}).stdout?.trim());
test('prepared service freezes owned contracts, handles bounded restarts and stops on changed code without accessing credentials',
 {skip:nativeTools?false:'requires local Linux gcloud/systemd tools and a running user manager'},async()=>{
 const task=await mkdtemp(resolve(root,'.artifacts/local-service-test-')),outside=await mkdtemp(resolve(tmpdir(),'skilved-service-test-'));
 const envFile=resolve(task,'worker configuration.env');await writeFile(envFile,'NODE_ENV=production\nSKILVED_CATALOGUE_MODE=cloud\nSKILVED_CATALOGUE_PROJECT=skilved-staging\nSKILVED_CATALOGUE_READS=false\nSKILVED_CATALOGUE_REPORTS=false\nSKILVED_SUGGESTIONS_ENABLED=false\nSKILVED_AI_MODE=gemini\n',{mode:0o600});
 const profile={outputDir:resolve(task,'bundle with spaces'),envFile,sourceId:'authored_source_'+randomUUID(),sourceRevision:5,principal:'authored-worker@skilved-staging.iam.gserviceaccount.com',account:'operator@example.test'};
 let linked;
 try{
  const result=await prepareLocalFastService(profile);assert.equal(result.installed,false);assert.equal(result.started,false);assert.equal(result.publication,false);
  const bundle=resolve(result.outputDir,'release'),localTypes=await realpath(resolve(bundle,'packages/catalogue/node_modules/@skilved/types'));assert.equal(localTypes,resolve(bundle,'packages/types'));
  assert.notEqual(localTypes,await realpath(resolve(root,'packages/types')));
  const unit=await readFile(resolve(result.outputDir,result.unitName),'utf8');assert.match(unit,/Restart=always/);assert.match(unit,/RestartPreventExitStatus=78/);assert.match(unit,/KillMode=mixed/);assert.match(unit,/TimeoutStopSec=20min/);
  execFileSync('systemd-analyze',['--user','verify',resolve(result.outputDir,result.unitName)],{stdio:['ignore','pipe','pipe']});
  const help=spawnSync(process.execPath,[resolve(bundle,'bootstrap.mjs'),'--help'],{encoding:'utf8',env:{PATH:process.env.PATH}});assert.equal(help.status,0,help.stderr);assert.match(help.stdout,/Local staging only/);
  const manager=spawnSync('systemctl',['--user','is-system-running'],{encoding:'utf8'});
  if(['running','degraded'].includes(manager.stdout.trim())){
   // Execute the generated unit with an authored configuration and no API key.
   // Correct loading reaches AI_CONFIGURATION_REQUIRED before any credentials,
   // rather than silently ignoring EnvironmentFile and failing local admission.
   const ctl=(...args)=>execFileSync('systemctl',['--user',...args],{stdio:['ignore','pipe','pipe'],encoding:'utf8'});
   ctl('link',resolve(result.outputDir,result.unitName));linked={name:result.unitName,path:resolve(homedir(),'.config/systemd/user',result.unitName),target:resolve(result.outputDir,result.unitName)};
   ctl('daemon-reload');ctl('start',result.unitName);let status;
   for(let i=0;i<100;i++){status=ctl('show',result.unitName,'--property=ActiveState,ExecMainStatus,NRestarts');if(status.includes('ActiveState=failed'))break;await delay(100);}
   assert.match(status,/ExecMainStatus=78/);assert.match(status,/NRestarts=0/);
   const journal=execFileSync('journalctl',['--user','-u',result.unitName,'-o','cat','--no-pager'],{encoding:'utf8'});
   assert.match(journal,/"error":"AI_CONFIGURATION_REQUIRED"/);assert.doesNotMatch(journal,/EnvironmentFile=.*ignoring|LOCAL_FAST_CONFIGURATION_REQUIRED/);
  }
  await writeFile(resolve(bundle,'packages/types/dist/opportunities/index.js'),'// Authored integrity mismatch\n');
  const changed=spawnSync(process.execPath,[resolve(bundle,'bootstrap.mjs'),'--help'],{encoding:'utf8',env:{PATH:process.env.PATH}});assert.equal(changed.status,78);assert.deepEqual(JSON.parse(changed.stderr),{error:'LOCAL_FAST_RELEASE_CHANGED',exitCode:78});
  await assert.rejects(prepareLocalFastService(profile),{code:'LOCAL_SERVICE_ALREADY_EXISTS'});
  await chmod(envFile,0o644);await assert.rejects(prepareLocalFastService({...profile,outputDir:resolve(task,'other')}),{code:'LOCAL_SERVICE_PRIVATE_ENV_REQUIRED'});await chmod(envFile,0o600);
  await assert.rejects(prepareLocalFastService({...profile,outputDir:resolve(outside,'must-not-create')}),{code:'LOCAL_SERVICE_PRIVATE_OUTPUT_REQUIRED'});
  await symlink(outside,resolve(task,'escape'),'dir');await assert.rejects(prepareLocalFastService({...profile,outputDir:resolve(task,'escape/new-parent/bundle')}),{code:'LOCAL_SERVICE_PRIVATE_OUTPUT_REQUIRED'});
  await assert.rejects(access(resolve(outside,'new-parent')),{code:'ENOENT'});
 }finally{
  if(linked){spawnSync('systemctl',['--user','stop',linked.name]);assert.equal(await readlink(linked.path),linked.target);await unlink(linked.path);spawnSync('systemctl',['--user','daemon-reload']);spawnSync('systemctl',['--user','reset-failed',linked.name]);}
  await rm(task,{recursive:true,force:true});await rm(outside,{recursive:true,force:true});
 }
});
