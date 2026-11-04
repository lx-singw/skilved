import{test}from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';
import{buildApplicationLayoutIntegration,prepareApplicationLayoutIntegration}from'../tools/prepare-application-layout-integration.mjs';
const root=new URL('../../../',import.meta.url),paths=['packages/catalogue/src/recentjobs-worker.mjs','packages/catalogue/src/schemas.mjs'];
const digest=b=>createHash('sha256').update(b).digest('hex');
test('integration preparation produces an applicable unapplied patch without modifying the current worker/schema',async()=>{
  const before=await Promise.all(paths.map(p=>readFile(new URL(p,root)))),manifest=await prepareApplicationLayoutIntegration();
  assert.equal(manifest.applied,false);assert.equal(manifest.activationPending,true);assert.equal(manifest.providerCalls,0);assert.equal(manifest.cloudWrites,0);
  for(let i=0;i<paths.length;i++){assert.equal(digest(await readFile(new URL(paths[i],root))),digest(before[i]));assert.equal(manifest.files[i].before,digest(before[i]));}
  const patch=await readFile(manifest.patchPath,'utf8');assert.equal(digest(patch),manifest.patchSha256);
  assert.doesNotMatch(patch,/b\/home\/|GROQ_API_KEY|GEMINI_API_KEY/);assert.match(patch,/\+\+\+ b\/packages\/catalogue\/src\/recentjobs-worker\.mjs/);
  assert.ok((await readFile(manifest.integrationTests,'utf8')).includes('registerApplicationLayoutWorkerCases'));
});
test('changed or duplicated integration anchors require review instead of producing a partial patch',async()=>{
  const [worker,schema]=await Promise.all(paths.map(p=>readFile(new URL(p,root),'utf8')));
  for(const args of [[worker.replace('const candidate = parseRecentJobsDetail','const changed = parseRecentJobsDetail'),schema],
    [worker,schema.replace("originalVerification: z.literal('shadow_v1')","originalVerification: z.literal('shadow_v2')")],
    [worker+worker,schema]])assert.throws(()=>buildApplicationLayoutIntegration(...args),/APPLICATION_LAYOUT_INTEGRATION_DRIFT/);
});
