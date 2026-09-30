import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const run = (args, env) => spawnSync(process.execPath, ['tools/shadow-recentjobs.mjs', ...args], {
  cwd:new URL('..', import.meta.url), env, encoding:'utf8', timeout:10000,
});
test('local shadow command offers help without credentials and refuses absent/unsafe emulator endpoints', () => {
  const help = run(['--help'], {});
  assert.equal(help.status, 0); assert.match(help.stdout, /ingest-only LOCAL grant/);
  assert.match(help.stdout,/--split/);
  for (const env of [{}, {FIRESTORE_EMULATOR_HOST:'remote.example:8080', FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:19099'},
    {NODE_ENV:'production', FIRESTORE_EMULATOR_HOST:'127.0.0.1:18080', FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:19099'}]) {
    for (const args of [['nonexistent.json'],['--split','nonexistent.json']]) {
      const result = run(args, env);
      assert.equal(result.status, 1); assert.equal(JSON.parse(result.stderr).error, 'UNSAFE_CONFIGURATION');
    }
  }
});
