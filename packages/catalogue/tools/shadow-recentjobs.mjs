import { open, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { configuration, DomainError } from '../src/config.mjs';
import { extractionConfiguration } from '../src/ai/groq.mjs';
import { Source } from '../src/schemas.mjs';
import { RecentJobsWorker } from '../src/recentjobs-worker.mjs';
import { getRuntime } from '../src/runtime.mjs';
import { workerPrincipal } from '../src/worker-identity.mjs';

const help = `Usage: node --env-file=.env.local packages/catalogue/tools/shadow-recentjobs.mjs [--split] <source.json>
Run inside fresh Firebase Auth/Firestore emulators using a demo project.
Source must use automation.mode=shadow and permission.method=recentjobs_html.
This command bootstraps an ingest-only LOCAL grant, runs one bounded worker tick,
and saves a private report under the repository's ignored .artifacts/shadow/ directory.
Requires Groq opt-in. Fetches real RecentJobs pages and may consume model quota.
--split selects experimental metadata, requirements and validation stages, each separately budgeted/cached.
Never connects to cloud Firestore, enables public reads, publishes, or schedules another run.`;

async function readSource(path) {
  const file = await open(path, 'r');
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > 64000) throw new DomainError('SOURCE_FILE_LIMIT');
    const buffer = Buffer.alloc(64001); let length = 0;
    while (length < buffer.length) {
      const {bytesRead} = await file.read(buffer, length, buffer.length - length, null);
      if (!bytesRead) break; length += bytesRead;
    }
    if (length > 64000) throw new DomainError('SOURCE_FILE_LIMIT');
    return Source.parse(JSON.parse(buffer.subarray(0, length).toString('utf8')));
  } finally { await file.close(); }
}

if (process.argv.includes('--help')) console.log(help);
else {
  let runtime;
  try {
    const args=process.argv.slice(2), split=args[0]==='--split'; if(split) args.shift();
    if (args.length !== 1) throw new DomainError('INVALID_COMMAND');
    // Fail before reading inputs, credentials or initializing SDKs unless both
    // emulator endpoints are explicitly local. configuration also rejects NODE_ENV=production.
    Object.assign(process.env, { SKILVED_CATALOGUE_MODE: 'emulator', SKILVED_CATALOGUE_PROJECT: 'demo-skilved-shadow',
      SKILVED_WORKER_EMULATOR_IDENTITY: 'synthetic-worker@example.test' });
    const config = configuration(), source = await readSource(resolve(args[0]));
    if (source.automation?.mode !== 'shadow' || source.permission.method !== 'recentjobs_html') throw new DomainError('SHADOW_SOURCE_REQUIRED');
    const ai = extractionConfiguration(), principal = await workerPrincipal(config);
    runtime = await getRuntime();
    const worker = new RecentJobsWorker(runtime.db, principal, { extractionMode:split?'split':'single', model: ai.model, thinking: ai.thinking, validationThinking: ai.validationThinking });
    if ((await worker.ref('sources', source.id).get()).exists) throw new DomainError('FRESH_EMULATOR_REQUIRED');
    await worker.ref('sources', source.id).set({json:JSON.stringify(source)});
    await worker.ref('workers', worker.actor).set({principal, active:true, sources:[source.id], roles:['ingest']});
    const result = await worker.run(source.id), records = {};
    for (const name of ['sources','worker_jobs','worker_candidates','worker_exceptions','worker_decisions','model_cache','model_calls','model_budgets','drafts','public','snapshots']) {
      const rows = await runtime.db.collection(`m0_${name}`).get();
      records[name] = rows.docs.map(row => ({id:row.id, ...(row.data().json ? JSON.parse(row.data().json) : row.data())}));
    }
    const directory = fileURLToPath(new URL('../../../.artifacts/shadow/', import.meta.url));
    await mkdir(directory, {recursive:true, mode:0o700});
    const path = resolve(directory, `${new Date().toISOString().replaceAll(':','-')}-${randomUUID()}.json`);
    await writeFile(path, JSON.stringify({mode:'local_emulator_shadow', extractionMode:worker.extractionMode, observedAt:new Date().toISOString(), result, records}, null, 2), {flag:'wx', mode:0o600});
    console.log(JSON.stringify({report:path, extractionMode:worker.extractionMode, result, counts:Object.fromEntries(Object.entries(records).map(([key,rows]) => [key,rows.length]))}));
  } catch (error) {
    console.error(JSON.stringify({error:/^[A-Z_]+$/.test(error?.code ?? '') ? error.code : 'SHADOW_RUN_FAILED'}));
    process.exitCode = 1;
  } finally { await runtime?.db.terminate(); }
}
