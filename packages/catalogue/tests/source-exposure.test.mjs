import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSourceExposureInventory, classifySourceExposure, verifySourceExposureInventory } from '../src/ai/source-exposure.mjs';
import { inventorySourceExposureCli } from '../tools/inventory-source-exposure.mjs';

const a = 'https://recentjobs.co.za/2026/09/01/authored-apprentice-a/';
const b = 'https://recentjobs.co.za/2026/09/02/authored-apprentice-b/';
const c = 'https://recentjobs.co.za/2026/09/03/authored-apprentice-c/';
async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'skilved-exposure-'));
  try { await run(root); } finally { assert.match(root, /skilved-exposure-/); await rm(root, { recursive: true }); }
}
const json = (root, name, value) => writeFile(join(root, name), JSON.stringify(value));

test('archive inventory includes old root and nested experiments instead of relying on a recent manifest chain', () => fixture(async root => {
  await mkdir(join(root, 'recent')); await mkdir(join(root, 'older'));
  await json(root, 'recent/manifest.json', { sources: [{ sourceUrl: a, title: 'Discovered link only' }] });
  await json(root, 'older/candidate.json', { sourceUrl: a, sourceText: 'Synthetic source body' });
  await json(root, 'root-candidate.json', { sourceUrl: b, contentHash: 'authored hash' });
  const inventory = await buildSourceExposureInventory(root);
  assert.equal(inventory.complete, true); assert.equal(inventory.filesRead, 3);
  assert.equal(classifySourceExposure(inventory, a), 'source_seen'); assert.equal(classifySourceExposure(inventory, b), 'source_seen');
  assert.ok(inventory.sources.find(s => s.url === a).evidence.some(e => e.path === 'older/candidate.json'));
  assert.equal(await verifySourceExposureInventory(inventory), true);
}));

test('listing-only exposure stays distinct from an archived body and from a URL absent from a complete archive', () => fixture(async root => {
  await json(root, 'listing.json', { articles: [{ sourceUrl: a, title: 'Authored link' }] });
  const inventory = await buildSourceExposureInventory(root);
  assert.equal(classifySourceExposure(inventory, a), 'link_only'); assert.equal(classifySourceExposure(inventory, b), 'not_recorded');
  assert.equal(classifySourceExposure({ ...inventory, complete: false }, a), 'unknown');
  assert.equal(classifySourceExposure({ ...inventory, complete: false }, b), 'unknown');
  assert.throws(() => classifySourceExposure(inventory, 'https://other.example/article'), /SOURCE_EXPOSURE_INVENTORY_INVALID/);
}));

test('nested snapshots, successful retrievals and canonical detail HTML retain hashed evidence without source text', () => fixture(async root => {
  await json(root, 'history.json', { records: { snapshots: [{ url: a, text: 'PRIVATE_SOURCE_SENTINEL' }] }, requests: [{ url: b, status: 200 }] });
  await writeFile(join(root, 'detail.html'), `<html><head><link href="${c}" rel="canonical"></head><body><div class="entry-content">Synthetic</div></body></html>`);
  const inventory = await buildSourceExposureInventory(root);
  for (const url of [a, b, c]) assert.equal(classifySourceExposure(inventory, url), 'source_seen');
  assert.ok(inventory.sources.every(s => s.evidence.some(e => /^[a-f0-9]{64}$/.test(e.sha256))));
  assert.doesNotMatch(JSON.stringify(inventory), /PRIVATE_SOURCE_SENTINEL/);
}));

test('source evidence remains traceable even after many earlier discovery records fill the evidence sample', () => fixture(async root => {
  for (let i = 0; i < 5; i++) await json(root, `0-link-${i}.json`, { sourceUrl: a });
  await json(root, 'z-body.json', { sourceUrl: a, sourceText: 'Authored source' });
  const inventory = await buildSourceExposureInventory(root), row = inventory.sources.find(s => s.url === a);
  assert.equal(classifySourceExposure(inventory, a), 'source_seen'); assert.equal(row.evidence.length, 4);
  assert.ok(row.evidence.some(e => e.path === 'z-body.json' && e.kind === 'source_content_or_retrieval'));
}));

test('pre-call verification detects added legacy files, changed content and removed files', () => fixture(async root => {
  await json(root, 'candidate.json', { sourceUrl: a, sourceText: 'Synthetic' });
  const initial = await buildSourceExposureInventory(root);
  await json(root, 'old-missed.json', { sourceUrl: b, sourceText: 'Older source' });
  await assert.rejects(() => verifySourceExposureInventory(initial), /SOURCE_EXPOSURE_ARCHIVE_CHANGED/);
  const added = await buildSourceExposureInventory(root); await json(root, 'candidate.json', { sourceUrl: a, sourceText: 'Changed' });
  await assert.rejects(() => verifySourceExposureInventory(added), /SOURCE_EXPOSURE_ARCHIVE_CHANGED/);
  const changed = await buildSourceExposureInventory(root); await rm(join(root, 'old-missed.json'));
  await assert.rejects(() => verifySourceExposureInventory(changed), /SOURCE_EXPOSURE_ARCHIVE_CHANGED/);
}));

test('invalid JSON and symlinks prevent unseen claims rather than silently omitting uncertain history', () => fixture(async root => {
  await writeFile(join(root, 'broken.json'), `{"url":"${a}"`);
  await json(root, 'target.json', { sourceUrl: b, sourceText: 'Synthetic' }); await symlink(join(root, 'target.json'), join(root, 'link.json'));
  await symlink(join(root, 'target.json'), join(root, '.env'));
  const inventory = await buildSourceExposureInventory(root);
  assert.equal(inventory.complete, false); assert.ok(inventory.warnings.some(w => w.code === 'SOURCE_EXPOSURE_JSON_INVALID'));
  assert.equal(inventory.warnings.filter(w => w.code === 'SOURCE_EXPOSURE_SYMLINK').length, 2);
  assert.equal(classifySourceExposure(inventory, a), 'unknown'); assert.equal(classifySourceExposure(inventory, c), 'unknown');
  assert.equal(classifySourceExposure(inventory, b), 'source_seen');
  await assert.rejects(() => verifySourceExposureInventory(inventory), /SOURCE_EXPOSURE_INCOMPLETE/);
}));

test('file, byte and traversal limits leave an incomplete inventory and reject invalid exclusions', () => fixture(async root => {
  await json(root, 'a.json', { sourceUrl: a }); await json(root, 'b.json', { sourceUrl: b });
  for (const options of [{ maxFiles: 1 }, { maxFileBytes: 10 }, { maxTotalBytes: 10 }, { maxNodesPerFile: 1 }]) {
    const inventory = await buildSourceExposureInventory(root, options); assert.equal(inventory.complete, false);
    assert.equal(classifySourceExposure(inventory, c), 'unknown');
  }
  for (const exclude of [['../older'], ['/absolute'], ['older/../source'], ['older\\source']])
    await assert.rejects(() => buildSourceExposureInventory(root, { exclude }), /SOURCE_EXPOSURE_EXCLUSION_INVALID/);
  await assert.rejects(() => buildSourceExposureInventory(root, { maxFiles: 0 }), /SOURCE_EXPOSURE_LIMIT_INVALID/);
}));

test('CLI writes private metadata exclusively into an explicitly excluded output and never overwrites it', () => fixture(async root => {
  await json(root, 'candidate.json', { sourceUrl: a, sourceText: 'PRIVATE_SOURCE_SENTINEL' });
  const out = join(root, 'private-output/inventory.json'), messages = [];
  const args = ['--root', root, '--out', out, '--exclude', 'private-output'];
  assert.equal(await inventorySourceExposureCli(args, s => messages.push(s)), 0);
  const inventory = JSON.parse(await readFile(out, 'utf8')); assert.equal(inventory.filesRead, 1);
  assert.equal((await stat(out)).mode & 0o777, 0o600); assert.doesNotMatch(messages.join(''), /PRIVATE_SOURCE_SENTINEL/);
  assert.equal(await verifySourceExposureInventory(inventory), true);
  await assert.rejects(() => inventorySourceExposureCli(args, () => {}), /EEXIST/);
  await assert.rejects(() => inventorySourceExposureCli(['--root', root, '--out', join(root, 'unsafe.json')]), /SOURCE_EXPOSURE_OUTPUT_MUST_BE_OUTSIDE_SCAN/);
}));
