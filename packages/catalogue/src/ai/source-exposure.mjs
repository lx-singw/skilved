import { readFile, readdir, lstat, realpath } from 'node:fs/promises';
import { resolve, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const article = /^https:\/\/recentjobs\.co\.za\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+\/$/i;
const defaults = { maxFiles: 10000, maxFileBytes: 2_000_000, maxTotalBytes: 256_000_000, maxNodesPerFile: 100000 };
const fail = code => { throw Object.assign(new Error(code), { code }); };

/** Development evidence only: enumerate the actual archive, including root-level experiments. */
export async function buildSourceExposureInventory(root, { exclude = [], ...limits } = {}) {
  root = await realpath(resolve(root));
  if (!(await lstat(root)).isDirectory()) fail('SOURCE_EXPOSURE_ROOT_REQUIRED');
  const bounds = { ...defaults, ...limits };
  if (Object.keys(bounds).some(k => !(k in defaults)) || Object.values(bounds).some(v => !Number.isSafeInteger(v) || v < 1))
    fail('SOURCE_EXPOSURE_LIMIT_INVALID');
  if (!Array.isArray(exclude) || exclude.some(p => typeof p !== 'string' || !p || isAbsolute(p) ||
      p.includes('\\') || p.split('/').some(part => !part || part === '.' || part === '..')))
    fail('SOURCE_EXPOSURE_EXCLUSION_INVALID');
  exclude = [...new Set(exclude)].sort();
  const artifacts = {}, sources = new Map(), warnings = [];
  let files = 0, bytes = 0;
  const warn = (path, code) => warnings.push({ path, code });
  function note(url, path, sha256, inspected, uncertain = false) {
    if (!article.test(url ?? '')) return;
    const row = sources.get(url) ?? { url, inspected: false, uncertain: false, evidence: [] };
    row.inspected ||= inspected; row.uncertain ||= uncertain;
    const evidence = { path, sha256, kind: uncertain ? 'unreadable_evidence' : inspected ? 'source_content_or_retrieval' : 'discovered_link' };
    if (row.evidence.length < 4) row.evidence.push(evidence);
    else if (inspected && !row.evidence.some(e => e.kind === 'source_content_or_retrieval')) row.evidence[3] = evidence;
    sources.set(url, row);
  }
  function jsonEvidence(parsed, path, sha256) {
    const queue = [parsed]; let nodes = 0;
    while (queue.length) {
      if (++nodes > bounds.maxNodesPerFile) { warn(path, 'SOURCE_EXPOSURE_NODE_LIMIT'); return; }
      const obj = queue.pop();
      if (typeof obj === 'string') { note(obj, path, sha256, false); continue; }
      if (!obj || typeof obj !== 'object') continue;
      if (!Array.isArray(obj)) {
        const inspected = typeof obj.sourceText === 'string' || typeof obj.text === 'string' ||
          typeof obj.contentHash === 'string' || typeof obj.sourceHash === 'string' || obj.status === 200 ||
          typeof obj.sourceRetrievedAt === 'string' || Array.isArray(obj.deadlineCandidates) || obj.passed === true;
        for (const k of ['sourceUrl', 'url', 'requestedUrl', 'finalUrl']) note(obj[k], path, sha256, inspected);
      }
      queue.push(...Object.values(obj));
    }
  }
  async function scan(folder, prefix = '') {
    let entries;
    try { entries = await readdir(folder, { withFileTypes: true }); }
    catch { warn(prefix, 'SOURCE_EXPOSURE_DIRECTORY_UNREADABLE'); return; }
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const path = prefix + e.name;
      if (exclude.some(p => path === p || path.startsWith(p + '/'))) continue;
      const file = resolve(folder, e.name);
      if (e.isSymbolicLink()) { warn(path, 'SOURCE_EXPOSURE_SYMLINK'); continue; }
      if (e.isDirectory()) { await scan(file, path + '/'); continue; }
      if (!e.isFile() || !/\.(?:json|html)$/i.test(e.name)) continue;
      if (++files > bounds.maxFiles) { warn(path, 'SOURCE_EXPOSURE_FILE_LIMIT'); return; }
      try {
        const stat = await lstat(file);
        if (!stat.isFile()) { warn(path, 'SOURCE_EXPOSURE_FILE_CHANGED'); continue; }
        if (stat.size > bounds.maxFileBytes || bytes + stat.size > bounds.maxTotalBytes) { warn(path, 'SOURCE_EXPOSURE_BYTE_LIMIT'); continue; }
        const raw = await readFile(file); bytes += raw.length;
        if (raw.length !== stat.size || raw.length > bounds.maxFileBytes || bytes > bounds.maxTotalBytes) { warn(path, 'SOURCE_EXPOSURE_FILE_CHANGED'); continue; }
        const sha256 = hash(raw), text = raw.toString('utf8'); artifacts[path] = sha256;
        if (/\.json$/i.test(e.name)) {
          try { jsonEvidence(JSON.parse(text), path, sha256); }
          catch { warn(path, 'SOURCE_EXPOSURE_JSON_INVALID'); for (const m of text.matchAll(/https:\/\/recentjobs\.co\.za\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+\//gi)) note(m[0], path, sha256, false, true); }
        } else if (/entry-content/.test(text)) {
          for (const tag of text.match(/<link\b[^>]*>/gi) ?? []) if (/\brel\s*=\s*["']canonical["']/i.test(tag))
            note(/\bhref\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1], path, sha256, true);
        }
      } catch { warn(path, 'SOURCE_EXPOSURE_FILE_UNREADABLE'); }
    }
  }
  await scan(root);
  const scope = { root, exclude, limits: bounds }, complete = warnings.length === 0;
  return { schemaVersion: 1, createdAt: new Date().toISOString(), scope, complete, filesRead: Object.keys(artifacts).length,
    bytesRead: bytes, artifactHashes: artifacts, sources: [...sources.values()].sort((a, b) => a.url.localeCompare(b.url)), warnings,
    fingerprint: hash(JSON.stringify({ scope, complete, artifacts })) };
}

export function classifySourceExposure(inventory, url) {
  if (inventory?.schemaVersion !== 1 || !Array.isArray(inventory.sources) || typeof inventory.complete !== 'boolean' || !article.test(url))
    fail('SOURCE_EXPOSURE_INVENTORY_INVALID');
  const row = inventory.sources.find(r => r.url === url);
  if (row?.inspected) return 'source_seen';
  if (!inventory.complete || row?.uncertain) return 'unknown';
  return row ? 'link_only' : 'not_recorded';
}

/** Re-enumeration catches added/removed legacy files as well as changed content. */
export async function verifySourceExposureInventory(inventory) {
  if (inventory?.schemaVersion !== 1 || !inventory.complete || !inventory.scope) fail('SOURCE_EXPOSURE_INCOMPLETE');
  const current = await buildSourceExposureInventory(inventory.scope.root, { exclude: inventory.scope.exclude, ...inventory.scope.limits });
  if (!current.complete || current.fingerprint !== inventory.fingerprint) fail('SOURCE_EXPOSURE_ARCHIVE_CHANGED');
  return true;
}
