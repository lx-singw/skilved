import { readFile } from 'node:fs/promises';
import { getRuntime } from '../src/runtime.mjs';
// Tokens are read from a private file, never command arguments, output, or a public route.
const help=`Usage: pnpm catalogue:operator <command.json>
Set SKILVED_OPERATOR_TOKEN_FILE to a private file containing a current Firebase ID token.
Commands: source, inspect, queue, save, publish, alias, report-triage, enqueue, run-job, schedule.
All mutations require reason; expected revisions are explicit. No role bootstrap command exists.
See docs/current/engineering/15_SOURCE_PUBLICATION_RUNTIME.md for examples.`;
if (process.argv.includes('--help')) { console.log(help); }
else {
  try {
    if (process.argv.length!==3 || !process.env.SKILVED_OPERATOR_TOKEN_FILE) throw new Error('INVALID_COMMAND');
    const text=await readFile(process.argv[2],'utf8'); if(Buffer.byteLength(text)>520000) throw new Error('INVALID_COMMAND');
    const c=JSON.parse(text),token=(await readFile(process.env.SKILVED_OPERATOR_TOKEN_FILE,'utf8')).trim();
    const {catalogue}=await getRuntime();let result;
    switch(c.command) {
      case 'source':result=await catalogue.registerSource(token,c.source,c.expected,c.reason);break;
      case 'inspect':result=await catalogue.inspect(token,c.collection,c.id);break;
      case 'queue':result=await catalogue.queue(token,c.collection,c.after);break;
      case 'save':result=await catalogue.saveDraft(token,c.record,c.expected,c.reason);break;
      case 'publish':result=await catalogue.publish(token,c.id,c.expected,c.action,c.reason);break;
      case 'alias':result=await catalogue.alias(token,c.alias,c.expected,c.reason);break;
      case 'report-triage':result=await catalogue.triage(token,c.id,c.expected,c.decision,c.reason);break;
      case 'enqueue':result=await catalogue.enqueue(token,c.job,c.reason);break;
      case 'run-job':result=await catalogue.runJob(token,c.id);break;
      case 'schedule':result=await catalogue.schedule(token,c.after);break;
      default:throw new Error('INVALID_COMMAND');
    }
    console.log(JSON.stringify(result,null,2));
  } catch(error) { console.error(JSON.stringify({error:error?.code??'INVALID_COMMAND'}));process.exitCode=1; }
}
