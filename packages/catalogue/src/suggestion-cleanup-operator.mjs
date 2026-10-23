import { z } from 'zod';
import { DomainError } from './config.mjs';
import { SuggestionCleanup, SuggestionRetirement } from './suggestion-cleanup.mjs';
import { SuggestionReceipts } from './suggestion-receipts.mjs';
import { SuggestionAdmission } from './suggestion-admission.mjs';
import { SuggestionReplayTickets } from './suggestion-replay-tickets.mjs';

const Settings=z.object({mutationsEnabled:z.boolean().default(false),retirement:SuggestionRetirement}).strict();
const Command=z.union([
  z.object({command:z.literal('suggestion-cleanup-preview'),preview:z.unknown()}).strict(),
  ...['receipt','work','public-replay','counter'].map(target=>z.object({command:z.literal('suggestion-cleanup-'+target),cleanup:z.unknown()}).strict()),
]);
const fail=code=>{throw new DomainError(code);};
/** Trusted operator environment only; retirement never comes from a command. */
export function suggestionCleanupConfiguration(env=process.env) {
  const text=env.SKILVED_SUGGESTION_CLEANUP_CONFIG;
  if(text===undefined)return null;
  try {
    if(typeof text!=='string'||Buffer.byteLength(text)>2048)fail('UNSAFE_CONFIGURATION');
    return Settings.parse(JSON.parse(text));
  } catch {fail('UNSAFE_CONFIGURATION');}
}
export async function executeSuggestionCleanup(runtime,token,input,settings,cleanupSettings,now=()=>new Date().toISOString()) {
  const parsed=Command.safeParse(input);if(!parsed.success)fail('INVALID_COMMAND');
  const trusted=Settings.safeParse(cleanupSettings);
  if(!trusted.success||!settings)fail('SUGGESTION_UNAVAILABLE');
  const c=parsed.data,preview=c.command==='suggestion-cleanup-preview';
  if(!preview&&!trusted.data.mutationsEnabled)fail('SUGGESTION_UNAVAILABLE');
  if(settings.catalogue.mode!==runtime.config.mode||settings.catalogue.projectId!==runtime.config.projectId)fail('UNSAFE_CONFIGURATION');
  const receipts=new SuggestionReceipts(runtime.db,{...settings.receipt,now});
  const replayTickets=new SuggestionReplayTickets({...settings.replayTickets,now});
  const admission=new SuggestionAdmission(runtime.db,receipts,settings.policy,{replayTickets});
  const cleanup=new SuggestionCleanup(admission,runtime.catalogue,trusted.data.retirement);
  if(preview)return cleanup.preview(token,c.preview);
  const method={'suggestion-cleanup-receipt':'removeReceipt','suggestion-cleanup-work':'removeWork',
    'suggestion-cleanup-public-replay':'removePublicReplay','suggestion-cleanup-counter':'removeCounter'}[c.command];
  return cleanup[method](token,c.cleanup);
}
