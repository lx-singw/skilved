import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildSourceExposureInventory } from '../src/ai/source-exposure.mjs';

export async function inventorySourceExposureCli(args, output = console.log) {
  const options = { exclude: [] }; let root, out;
  for (let i = 0; i < args.length; i++) {
    const key = args[i], value = args[++i];
    if (!value || value.startsWith('--')) throw new Error('Usage: --root ARCHIVE --out PRIVATE_JSON [--exclude RELATIVE_PATH]');
    if (key === '--root' && !root) root = value;
    else if (key === '--out' && !out) out = value;
    else if (key === '--exclude') options.exclude.push(value);
    else throw new Error('SOURCE_EXPOSURE_ARGUMENT_INVALID');
  }
  if (!root || !out) throw new Error('SOURCE_EXPOSURE_ROOT_AND_OUTPUT_REQUIRED');
  root = resolve(root); out = resolve(out); const localOutput = relative(root, out).replaceAll('\\', '/');
  if (!localOutput.startsWith('../') && !options.exclude.some(p => localOutput === p || localOutput.startsWith(p + '/')))
    throw new Error('SOURCE_EXPOSURE_OUTPUT_MUST_BE_OUTSIDE_SCAN');
  const inventory = await buildSourceExposureInventory(root, options);
  await mkdir(dirname(out), { recursive: true, mode: 0o700 });
  await writeFile(out, JSON.stringify(inventory, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  output(JSON.stringify({ complete: inventory.complete, filesRead: inventory.filesRead,
    sourceBodiesSeen: inventory.sources.filter(s => s.inspected).length, warnings: inventory.warnings.length,
    fingerprint: inventory.fingerprint }));
  return inventory.complete ? 0 : 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { process.exitCode = await inventorySourceExposureCli(process.argv.slice(2)); }
  catch (e) { console.error(e.code ?? e.message); process.exitCode = 1; }
}
