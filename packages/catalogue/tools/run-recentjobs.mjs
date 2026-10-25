import { getRuntime } from '../src/runtime.mjs';
import { extractionConfiguration } from '../src/ai/provider.mjs';
import { workerPrincipal } from '../src/worker-identity.mjs';
import { RecentJobsWorker } from '../src/recentjobs-worker.mjs';

if (process.argv.includes('--help')) {
  console.log(`Usage: pnpm --filter @skilved/catalogue worker:recentjobs <source-id>
Runs one bounded worker tick (up to 11 discovery/detail jobs), suitable for a backend scheduler.
Requires explicit catalogue/AI configuration, a registered recentjobs_html source and a
server-owned m0_workers grant for the verified service-account principal. No role bootstrap.
Cloud uses ADC workload ID tokens. Emulator requires SKILVED_WORKER_EMULATOR_IDENTITY=synthetic-worker@example.test.
The source's automation.mode selects shadow or automatic publication. Source pause wins.
Gemini quota tracking shares project/model reservations via SKILVED_GEMINI_PROJECT_ID;
SKILVED_GEMINI_MODEL_LIMITS optionally supplies JSON rpm/tpm/rpd limits.
Cloud Gemini workers also require SKILVED_GEMINI_AUTHORITY_PROJECT and
SKILVED_GEMINI_AUTHORITY_EPOCH matching an active m0_model_authorities record.
No scheduled cloud resources are provisioned by this command. See the autonomous pipeline document.`);
} else {
  let runtime;
  try {
    if (process.argv.length !== 3) throw new Error('INVALID_COMMAND');
    const ai = extractionConfiguration();
    runtime = await getRuntime();
    const principal = await workerPrincipal(runtime.config);
    const worker = new RecentJobsWorker(runtime.db, principal, { provider:ai.provider, thinking: ai.thinking, validationThinking: ai.validationThinking, model: ai.model });
    const result = await worker.run(process.argv[2]);
    console.log(JSON.stringify(result, null, 2));
    if (result.results.some(r => r.state === 'exception')) process.exitCode = 2;
  } catch (error) {
    const code = /^[A-Z_]+$/.test(error?.code ?? '') ? error.code : 'WORKER_FAILED';
    console.error(JSON.stringify({ error: code })); process.exitCode = 1;
  } finally { await runtime?.db.terminate(); }
}
