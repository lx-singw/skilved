import { open } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { z } from 'zod';
import { extractRecentJobs } from '../src/adapters/recentjobs-extraction.mjs';
import { extractionConfiguration, GroqError } from '../src/ai/groq.mjs';
import { parseRecentJobsDetail } from '../src/adapters/recentjobs.mjs';
import { extractRequirements } from '../src/ai/requirements.mjs';

const help = `Usage: pnpm --filter @skilved/catalogue extract:recentjobs [--requirements] <manifest.json>
Manifest: {"sourceId":"recentjobs","url":"https://recentjobs.co.za/YYYY/MM/DD/slug/","htmlPath":"notice.html"}
htmlPath is relative to the manifest. Use permitted saved HTML, not applicant documents.
Requires SKILVED_AI_MODE=groq and GROQ_API_KEY in the process environment.
Optional: SKILVED_AI_THINKING=low|medium (default low).
Makes one paid-capable model request; prints a PRIVATE extraction/evidence report.
--requirements runs the experimental requirements-only stage, with no metadata or route assessment.
Does not fetch RecentJobs, save to Firestore, schedule work or publish to the feed.
Build contracts first. Keep output under an ignored private directory such as .artifacts/.`;

async function readBounded(path, maximum) {
  const file = await open(path, 'r');
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > maximum) throw new Error('INPUT_FILE_LIMIT');
    const buffer = Buffer.alloc(maximum + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await file.read(buffer, length, buffer.length - length, null);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length > maximum) throw new Error('INPUT_FILE_LIMIT');
    return buffer.subarray(0, length).toString('utf8');
  } finally { await file.close(); }
}

if (process.argv.includes('--help')) console.log(help);
else {
  try {
    const args = process.argv.slice(2), requirementsOnly = args[0] === '--requirements';
    if (requirementsOnly) args.shift();
    if (args.length !== 1) throw new Error('INVALID_COMMAND');
    extractionConfiguration(); // Check explicit opt-in before reading local content.
    const manifestPath = resolve(args[0]);
    const manifest = z.object({ sourceId: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,95}$/),
      url: z.string().max(2048), htmlPath: z.string().min(1).max(2048) }).strict()
      .parse(JSON.parse(await readBounded(manifestPath, 8000)));
    const html = await readBounded(resolve(dirname(manifestPath), manifest.htmlPath), 500_000);
    const result = requirementsOnly
      ? {scope:'requirements_only',qualification:false,...await extractRequirements(parseRecentJobsDetail({html,url:manifest.url}))}
      : await extractRecentJobs({ ...manifest, html, now: new Date().toISOString() });
    console.log(JSON.stringify(result, null, 2));
    if (result.state === 'exception') process.exitCode = 2;
  } catch (error) {
    const known = typeof error?.code === 'string' && /^(?:AI_|RECENTJOBS_)[A-Z_]+$/.test(error.code);
    console.error(JSON.stringify({ error: known ? error.code : 'EXTRACTION_FAILED',
      retryable: error?.retryable === true, usage: error?.usage ?? null, providerStatus: error?.providerStatus ?? null,
      outputDiagnostic: error instanceof GroqError ? error.outputDiagnostic : null }));
    process.exitCode = 1;
  }
}
