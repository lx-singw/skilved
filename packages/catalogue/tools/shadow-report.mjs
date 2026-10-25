import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

export async function writeShadowReport(report) {
  const directory = fileURLToPath(new URL('../../../.artifacts/shadow/', import.meta.url));
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const path = resolve(directory, `${new Date().toISOString().replaceAll(':', '-')}-${randomUUID()}.json`);
  await writeFile(path, JSON.stringify(report, null, 2), { flag: 'wx', mode: 0o600 });
  return path;
}
