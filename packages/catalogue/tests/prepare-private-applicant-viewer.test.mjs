import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,symlink,access,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {preparePrivateApplicantViewer} from '../tools/prepare-private-applicant-viewer.mjs';

const root=fileURLToPath(new URL('../../../',import.meta.url));
test('viewer preparation stays private, copies no local environment and refuses overwrite or escaped destinations',async()=>{
 const task=await mkdtemp(resolve(root,'.artifacts/private-viewer-test-')),outside=await mkdtemp(resolve(tmpdir(),'skilved-viewer-test-'));
 try{
  const output=resolve(task,'web'),manifest=await preparePrivateApplicantViewer({outputDir:output});
  assert.equal(manifest.publication,false);assert.equal(manifest.credentialsCopied,false);
  assert.equal((await readdir(output)).some(name=>name.startsWith('.env')),false);
  const before=await readFile(resolve(output,'private-viewer.json'),'utf8');
  await assert.rejects(preparePrivateApplicantViewer({outputDir:output}),/PRIVATE_VIEWER_ALREADY_EXISTS/);
  assert.equal(await readFile(resolve(output,'private-viewer.json'),'utf8'),before);
  await assert.rejects(preparePrivateApplicantViewer({outputDir:resolve(outside,'direct')}),/PRIVATE_VIEWER_OUTPUT_REQUIRED/);
  await assert.rejects(access(resolve(outside,'direct')),{code:'ENOENT'});
  await symlink(outside,resolve(task,'escape'),'dir');
  await assert.rejects(preparePrivateApplicantViewer({outputDir:resolve(task,'escape','must-not-create','web')}),/PRIVATE_VIEWER_OUTPUT_REQUIRED/);
  await assert.rejects(access(resolve(outside,'must-not-create')),{code:'ENOENT'});
 }finally{await rm(task,{recursive:true,force:true});await rm(outside,{recursive:true,force:true});}
});
