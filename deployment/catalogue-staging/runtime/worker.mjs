import {createHash} from 'node:crypto';
import {stagingEnvironment, stagingWorkerAdmission} from './guards.mjs';
let runtime;
try {
  const settings = stagingEnvironment('worker');
  const [{getRuntime}, {workerPrincipal}, {RecentJobsWorker}, {extractionConfiguration}, {RecentJobsController}] = await Promise.all([
    import('../../../packages/catalogue/src/runtime.mjs'), import('../../../packages/catalogue/src/worker-identity.mjs'),
    import('../../../packages/catalogue/src/recentjobs-worker.mjs'), import('../../../packages/catalogue/src/ai/provider.mjs'),
    import('../../../packages/catalogue/src/recentjobs-controller.mjs'),
  ]);
  const ai = extractionConfiguration();
  runtime = await getRuntime();
  const principal = await workerPrincipal(runtime.config);
  const actor = `worker_${createHash('sha256').update(principal).digest('hex').slice(0,40)}`;
  const [sourceRow, grantRow] = await Promise.all([
    runtime.db.collection('m0_sources').doc(settings.sourceId).get(), runtime.db.collection('m0_workers').doc(actor).get(),
  ]);
  stagingWorkerAdmission(settings, sourceRow.exists ? JSON.parse(sourceRow.data().json) : null, grantRow.data(), principal);
  const options = {provider:ai.provider, model:ai.model, thinking:ai.thinking, validationThinking:ai.validationThinking,
    assertAdmission:(source,grant,caller) => stagingWorkerAdmission(settings,source,grant,caller)};
  const result = settings.controller
    ? await new RecentJobsController(runtime.db,principal,{...options,sourceId:settings.sourceId,sourceRevision:settings.sourceRevision}).tick()
    : await new RecentJobsWorker(runtime.db,principal,options).run(settings.sourceId);
  // Detailed evidence remains in restricted Firestore records, not Cloud Logging.
  console.log(JSON.stringify({sourceId:settings.sourceId, results:result.results.map(row => ({state:row.state})),
    ...(settings.controller ? {state:result.state,nextWakeAt:result.nextWakeAt,reason:result.reason,queued:result.queued,outcomes:result.outcomes} : {})}));
  // Isolated notice holds are successful controller outcomes, not infrastructure failures.
  if (!settings.controller && result.results.some(row => row.state === 'exception')) process.exitCode = 2;
} catch (error) {
  console.error(JSON.stringify({error:/^[A-Z_]+$/.test(error?.code ?? '') ? error.code : 'STAGING_WORKER_FAILED'}));
  process.exitCode = 1;
} finally { await runtime?.db.terminate(); }
