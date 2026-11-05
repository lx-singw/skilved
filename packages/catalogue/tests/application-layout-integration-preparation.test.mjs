import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildApplicationLayoutIntegration,prepareApplicationLayoutIntegration} from '../tools/prepare-application-layout-integration.mjs';
const root=new URL('../../../',import.meta.url),paths=['packages/catalogue/src/recentjobs-worker.mjs','packages/catalogue/src/schemas.mjs'];
const digest=b=>createHash('sha256').update(b).digest('hex');
test('installed integration readiness verifies current files without preparing or applying another patch',async()=>{
  const before=await Promise.all(paths.map(p=>readFile(new URL(p,root)))),manifest=await prepareApplicationLayoutIntegration();
  assert.equal(manifest.applied,true);assert.equal(manifest.activationPending,false);
  assert.equal(manifest.providerCalls,0);assert.equal(manifest.cloudWrites,0);assert.equal(manifest.patchPath,undefined);
  for(let i=0;i<paths.length;i++){assert.equal(digest(await readFile(new URL(paths[i],root))),digest(before[i]));assert.equal(manifest.files[i].before,manifest.files[i].after);}
});
test('partial or duplicated installed integration is refused',async()=>{
  const [worker,schema]=await Promise.all(paths.map(p=>readFile(new URL(p,root),'utf8')));
  assert.equal(buildApplicationLayoutIntegration(worker,schema).alreadyApplied,true);
  for(const args of [[worker.replace('const candidate = parseWorkerDetail','const changed = parseWorkerDetail'),schema],
    [worker,schema.replace("applicationLayouts: z.literal('shadow_v1')","applicationLayouts: z.literal('shadow_v2')")],
    [worker+worker,schema]])assert.throws(()=>buildApplicationLayoutIntegration(...args),/APPLICATION_LAYOUT_INTEGRATION_DRIFT/);
});
