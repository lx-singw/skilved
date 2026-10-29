import { readFile } from 'node:fs/promises';
import { getRuntime } from '../src/runtime.mjs';
import { suggestionConfiguration } from '../src/suggestion-config.mjs';
import { SuggestionReceipts } from '../src/suggestion-receipts.mjs';
import { SuggestionAdmission } from '../src/suggestion-admission.mjs';
import { SuggestionReview } from '../src/suggestion-review.mjs';
import { SuggestionReplayTickets } from '../src/suggestion-replay-tickets.mjs';
import { executeSuggestionCleanup, suggestionCleanupConfiguration } from '../src/suggestion-cleanup-operator.mjs';
// Tokens are read from a private file, never command arguments, output, or a public route.
const help=`Usage: pnpm catalogue:operator <command.json>
Set SKILVED_OPERATOR_TOKEN_FILE to a private file containing a current Firebase ID token.
Commands: source, employer-relationship, undated-origin-import, inspect, queue, save, publish, alias, report-triage, enqueue, run-job, schedule.
publication-preview: read-only preview with id, expected and action; uses the current reviewer role.
Preview never approves or publishes; execution repeats current source/role/revision checks.
Suggestion commands: suggestion-queue; suggestion-review with a strict review object.
Cleanup commands: suggestion-cleanup-preview with preview {target,limit?,after?};
suggestion-cleanup-receipt, suggestion-cleanup-work, suggestion-cleanup-public-replay,
suggestion-cleanup-counter with cleanup containing exact preview preconditions.
Set trusted SKILVED_SUGGESTION_CLEANUP_CONFIG with retirement policy; mutations default off.
Preview lists candidates, not deletion eligibility. Commands recheck current guards.
Suggestions require explicit enabled configuration; intake may remain off. Review uses fixed audit reasons.
Mutations use supplied or fixed audit reasons; expected revisions are explicit. No role bootstrap command exists.
See docs/current/engineering/15_SOURCE_PUBLICATION_RUNTIME.md for examples.`;
if (process.argv.includes('--help')) { console.log(help); }
else {
  try {
    if (process.argv.length!==3 || !process.env.SKILVED_OPERATOR_TOKEN_FILE) throw new Error('INVALID_COMMAND');
    const text=await readFile(process.argv[2],'utf8'); if(Buffer.byteLength(text)>520000) throw new Error('INVALID_COMMAND');
    const c=JSON.parse(text),token=(await readFile(process.env.SKILVED_OPERATOR_TOKEN_FILE,'utf8')).trim();
    const runtime=await getRuntime(),{catalogue}=runtime;let result;
    switch(c.command) {
      case 'source':result=await catalogue.registerSource(token,c.source,c.expected,c.reason);break;
      case 'employer-relationship':result=await catalogue.registerEmployerRelationship(token,c.relationship,c.expected,c.reason);break;
      case 'undated-origin-import':result=await catalogue.importUndatedOrigin(token,c.review,c.reason);break;
      case 'inspect':result=await catalogue.inspect(token,c.collection,c.id);break;
      case 'queue':result=await catalogue.queue(token,c.collection,c.after);break;
      case 'save':result=await catalogue.saveDraft(token,c.record,c.expected,c.reason);break;
      case 'publish':result=await catalogue.publish(token,c.id,c.expected,c.action,c.reason);break;
      case 'publication-preview':result=await catalogue.previewPublication(token,c.id,c.expected,c.action);break;
      case 'alias':result=await catalogue.alias(token,c.alias,c.expected,c.reason);break;
      case 'report-triage':result=await catalogue.triage(token,c.id,c.expected,c.decision,c.reason);break;
      case 'enqueue':result=await catalogue.enqueue(token,c.job,c.reason);break;
      case 'run-job':result=await catalogue.runJob(token,c.id);break;
      case 'schedule':result=await catalogue.schedule(token,c.after);break;
      case 'suggestion-cleanup-preview':
      case 'suggestion-cleanup-receipt':
      case 'suggestion-cleanup-work':
      case 'suggestion-cleanup-public-replay':
      case 'suggestion-cleanup-counter':
        result=await executeSuggestionCleanup(runtime,token,c,suggestionConfiguration(),suggestionCleanupConfiguration());break;
      case 'suggestion-queue':
      case 'suggestion-review': {
        const settings=suggestionConfiguration();
        if (!settings || settings.catalogue.mode!==runtime.config.mode || settings.catalogue.projectId!==runtime.config.projectId)
          throw new Error('INVALID_COMMAND');
        const now=()=>new Date().toISOString();
        const receipts=new SuggestionReceipts(runtime.db,{...settings.receipt,now});
        const replayTickets=new SuggestionReplayTickets({...settings.replayTickets,now});
        const review=new SuggestionReview(new SuggestionAdmission(runtime.db,receipts,settings.policy,{replayTickets}),catalogue);
        result=c.command==='suggestion-queue'?await review.queue(token):await review.decide(token,c.review);break;
      }
      default:throw new Error('INVALID_COMMAND');
    }
    console.log(JSON.stringify(result,null,2));
  } catch(error) { console.error(JSON.stringify({error:error?.code??'INVALID_COMMAND'}));process.exitCode=1; }
}
