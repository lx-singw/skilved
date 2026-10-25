import {createHash} from 'node:crypto';
import {stagingEnvironment, stagingWorkerAdmission} from './guards.mjs';
let runtime;
try {
  const settings = stagingEnvironment('worker');
  const [{getRuntime}, {workerPrincipal}, {RecentJobsWorker}, {extractionConfiguration}] = await Promise.all([
    import('../../../packages/catalogue/src/runtime.mjs'), import('../../../packages/catalogue/src/worker-identity.mjs'),
    import('../../../packages/catalogue/src/recentjobs-worker.mjs'), import('../../../packages/catalogue/src/ai/provider.mjs'),
  ]);
  const ai = extractionConfiguration();
  runtime = await getRuntime();
  const principal = await workerPrincipal(runtime.config);
  const actor = `worker_${createHash('sha256').update(principal).digest('hex').slice(0,40)}`;
  const [sourceRow, grantRow] = await Promise.all([
    runtime.db.collection('m0_sources').doc(settings.sourceId).get(), runtime.db.collection('m0_workers').doc(actor).get(),
  ]);
  stagingWorkerAdmission(settings, sourceRow.exists ? JSON.parse(sourceRow.data().json) : null, grantRow.data(), principal);
  const worker = new RecentJobsWorker(runtime.db, principal, {provider:ai.provider, model:ai.model,
    thinking:ai.thinking, validationThinking:ai.validationThinking});
  const result = await worker.run(settings.sourceId);
  // Detailed evidence remains in restricted Firestore records, not Cloud Logging.
  console.log(JSON.stringify({sourceId:settings.sourceId, results:result.results.map(row => ({state:row.state}))}));
  if (result.results.some(row => row.state === 'exception')) process.exitCode = 2;
} catch (error) {
  console.error(JSON.stringify({error:/^[A-Z_]+$/.test(error?.code ?? '') ? error.code : 'STAGING_WORKER_FAILED'}));
  process.exitCode = 1;
} finally { await runtime?.db.terminate(); }
