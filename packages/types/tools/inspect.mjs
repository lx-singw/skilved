import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { allFixtures, makeRecord } from '../tests/fixtures/opportunities.mjs';
import { renderInspection } from './render-inspection.mjs';
const require = createRequire(import.meta.url);
const { projectOpportunity } = require('../dist/opportunities/internal.js');
const { migrateLegacy } = require('../dist/opportunities/migration.js');
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('pnpm contracts:inspect [--serve] [--port 39202] [--fixture ID]\nGenerates .artifacts/contracts/{index.html,public.json}; optional loopback-only server. /prototype serves the existing B01 harness.');
  process.exit(0);
}
let port = 39202, selected;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--serve') continue;
  if (args[i] === '--port') { port = Number(args[++i]); continue; }
  if (args[i] === '--fixture') { selected = args[++i]; if (!selected) throw new Error('Missing fixture ID'); continue; }
  throw new Error('Unknown inspection argument');
}
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid local port');
const output = fileURLToPath(new URL('../../../.artifacts/contracts/', import.meta.url));
await mkdir(output, { recursive: true });
const unknown = makeRecord(); unknown.id = 'fixture_unknown'; unknown.deadline.state = 'not_stated'; unknown.deadline.value = null; unknown.deadline.originalText = null; unknown.compensation = [];
const withheld = makeRecord(); withheld.id = 'fixture_withheld'; withheld.publication.disposition = 'withheld';
const explained = makeRecord(); explained.id = 'fixture_explanation'; explained.explanation = { text: 'Either stated qualification route may apply; confirm provisional results with the fictional issuer.', assertionIds: explained.requirements.requirements.map(r => r.fact.id), requirementRevision: 1, method: 'human', reviewedBy: 'reviewer_fixture', review: 'approved' };
let records = [...allFixtures(), unknown, withheld, explained];
if (selected) { records = records.filter(r => r.id === selected); if (!records.length) throw new Error('Unknown fixture ID'); }
const migration = migrateLegacy({ id: 'legacy_fixture', title: 'Fictional legacy record', organisation: 'Fictional legacy issuer', opportunityType: 'trade_test', deadline: null, isVerifiedSource: true });
const html = renderInspection(records, migration);
const json = JSON.stringify(records.map(projectOpportunity), null, 2);
await writeFile(`${output}/index.html`, html);
await writeFile(`${output}/public.json`, json);
console.log(`Generated ${records.length} synthetic cases in ${output}`);
if (args.includes('--serve')) {
  const prototype = await readFile(new URL('../../../apps/web/prototype/task-prototype/index.html', import.meta.url));
  const routes = new Map([['/', [html, 'text/html']], ['/public.json', [json, 'application/json']], ['/prototype', [prototype, 'text/html']]]);
  const server = createServer((req, res) => {
    const entry = routes.get((req.url ?? '/').split('?')[0]);
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    if (!entry) { res.writeHead(404); res.end(); return; }
    const [body, type] = entry;
    res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8`, 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  });
  server.listen(port, '127.0.0.1', () => console.log(`Fictional inspection: http://127.0.0.1:${port}/`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.closeAllConnections(); server.close(); });
}
