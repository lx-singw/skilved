import { open } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { z } from 'zod';
import { parseRecentJobsDetail } from '../src/adapters/recentjobs.mjs';
import { planRecentJobsProgrammes } from '../src/adapters/recentjobs-programmes.mjs';

const help = `Usage: pnpm --filter @skilved/catalogue plan:recentjobs <manifest.json>
Manifest: {"url":"https://recentjobs.co.za/YYYY/MM/DD/slug/","htmlPath":"notice.html"}
htmlPath is relative to the manifest. Use permitted saved notice HTML.
Prints a PRIVATE programme-boundary plan, never canonical drafts or approvals.
No AI key is needed. Makes no model, source, employer, mailbox or database calls.
Keep the output under the ignored .artifacts/ directory.`;

async function readBounded(path, maximum) {
  const file = await open(path,'r');
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > maximum) throw new Error('INPUT_FILE_LIMIT');
    const buffer = Buffer.alloc(maximum+1);
    let length = 0;
    while (length < buffer.length) {
      const {bytesRead} = await file.read(buffer,length,buffer.length-length,null);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length > maximum) throw new Error('INPUT_FILE_LIMIT');
    return buffer.subarray(0,length).toString('utf8');
  } finally { await file.close(); }
}

if (process.argv.includes('--help')) console.log(help);
else {
  try {
    if (process.argv.length !== 3) throw new Error('INVALID_COMMAND');
    const path = resolve(process.argv[2]);
    const manifest = z.object({url:z.string().max(2048),htmlPath:z.string().min(1).max(2048)}).strict()
      .parse(JSON.parse(await readBounded(path,8000)));
    const html = await readBounded(resolve(dirname(path),manifest.htmlPath),500_000);
    const plan = planRecentJobsProgrammes(parseRecentJobsDetail({html,url:manifest.url}));
    console.log(JSON.stringify(plan,null,2));
    if (plan.state === 'unsupported') process.exitCode = 2;
  } catch (error) {
    const code = error?.code ?? error?.message;
    console.error(JSON.stringify({error:/^(?:(?:PROGRAMME|RECENTJOBS)_[A-Z_]+|INPUT_FILE_LIMIT|INVALID_COMMAND)$/.test(code ?? '') ? code : 'PROGRAMME_PLAN_FAILED'}));
    process.exitCode = 1;
  }
}
