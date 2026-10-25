import { configuration, DomainError } from '../src/config.mjs';
import { getRuntime } from '../src/runtime.mjs';
import { captureShadowCheckpoint, shadowCheckpointCounts } from '../src/shadow-checkpoint.mjs';
import { writeShadowReport } from './shadow-report.mjs';

const help = `Usage: node packages/catalogue/tools/export-shadow-checkpoint.mjs
Set SKILVED_CATALOGUE_MODE=emulator, a demo SKILVED_CATALOGUE_PROJECT and both local emulator endpoints.
Stop local workers first. Reads all m0 top-level JSON documents in one read-only transaction.
Saves a versioned private checkpoint under ignored .artifacts/shadow/ with exact document IDs and raw fields.
Includes source versions, origins/imports, assessments, budgets, availability, leases and queues when present.
Does not fetch sources, call AI, restore data, resume jobs, or change grants/budgets/drafts.
This is not an Auth backup or the shared provider-wide quota ledger; preserve that ledger separately.
Older unversioned flattened shadow reports are not lossless checkpoints.`;

if (process.argv.length === 3 && process.argv[2] === '--help') console.log(help);
else {
  let runtime;
  try {
    if (process.argv.length !== 2) throw new DomainError('INVALID_COMMAND');
    if (configuration()?.mode !== 'emulator') throw new DomainError('UNSAFE_CONFIGURATION');
    runtime = await getRuntime();
    const checkpoint = await captureShadowCheckpoint(runtime.db);
    const report = await writeShadowReport({ mode: 'local_emulator_checkpoint', checkpoint });
    console.log(JSON.stringify({ report, version: checkpoint.version, sha256: checkpoint.sha256,
      counts: shadowCheckpointCounts(checkpoint) }));
  } catch (error) {
    console.error(JSON.stringify({ error: /^[A-Z_]+$/.test(error?.code ?? '') ? error.code : 'SHADOW_CHECKPOINT_FAILED' }));
    process.exitCode = 1;
  } finally { await runtime?.db.terminate(); }
}
