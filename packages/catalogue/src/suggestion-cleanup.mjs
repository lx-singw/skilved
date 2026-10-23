import { z } from 'zod';
import { SuggestionSecretSchema } from '@skilved/types/opportunities/suggestions';
import { Catalogue } from './store.mjs';
import { SuggestionAdmission } from './suggestion-admission.mjs';
import { ReplayRecord } from './suggestion-receipts.mjs';
import { AdmissionState, SuggestionWork, decodeSuggestion, suggestionHash, suggestionPayload } from './suggestion-records.mjs';
import { DomainError } from './config.mjs';

const fail=code=>{throw new DomainError(code);};
const Revision=z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const Command=z.object({receiptId:SuggestionSecretSchema,expectedRevision:Revision,
  expectedWorkRevision:Revision,expectedAdmissionRevision:Revision}).strict();
const Retirement=z.object({retiredRecoveryEpochs:z.array(SuggestionSecretSchema).max(8),retireLegacy:z.boolean()})
  .strict().refine(v=>new Set(v.retiredRecoveryEpochs).size===v.retiredRecoveryEpochs.length);

/** Backend-only single-receipt retention primitive; no route, CLI, timer or live operation.
 * Retirement policy must come from trusted recovery decisions, never a public command.
 * Old processes/configurations must be retired before that policy is used.
 */
export class SuggestionCleanup {
  #retirement;
  constructor(admission,catalogue,retirement) {
    const parsed=Retirement.safeParse(retirement),epoch=admission?.receipts?.recoveryEpoch;
    if(!(admission instanceof SuggestionAdmission)||!(catalogue instanceof Catalogue)||admission.db!==catalogue.db||
      !SuggestionSecretSchema.safeParse(epoch).success||!parsed.success||parsed.data.retiredRecoveryEpochs.includes(epoch))
      fail('SUGGESTION_UNAVAILABLE');
    this.admission=admission;this.catalogue=catalogue;this.db=admission.db;this.#retirement=parsed.data;
  }
  async removeReceipt(token,input) {
    const parsed=Command.safeParse(input);if(!parsed.success)fail('INVALID_COMMAND');
    const command=parsed.data;
    return this.catalogue.mutate(token,'source','suggestions.cleanup.receipt',command.receiptId,
      'Expired or explicitly retired suggestion receipt removed',async tx=>{
        const now=this.admission.receipts.instant(),{state,works,receipts}=await this.admission.inventory(tx);
        const receipt=receipts.get(command.receiptId),old=receipt&&works.get(receipt.workId);
        if(!receipt||!old||receipt.revision!==command.expectedRevision||old.revision!==command.expectedWorkRevision||
          state.revision!==command.expectedAdmissionRevision)fail('CONFLICT');
        if(receipt.updatedAt>now||old.updatedAt>now)fail('SUGGESTION_UNAVAILABLE');
        // Every receipt must have exactly one coherent private replay binding before anything is deleted.
        const rows=await tx.get(this.db.collection('m0_suggestion_replays').limit(501)),bindings=new Map();
        if(rows.size>500||rows.size!==receipts.size)fail('SUGGESTION_UNAVAILABLE');
        for(const row of rows.docs) {
          const data=row.data();
          if(typeof data?.json!=='string'||Buffer.byteLength(data.json)>8192)fail('SUGGESTION_UNAVAILABLE');
          const binding=decodeSuggestion(row,ReplayRecord),owner=receipts.get(binding.receiptId),work=owner&&works.get(owner.workId);
          if(!SuggestionSecretSchema.safeParse(row.id).success||!owner||!work||bindings.has(owner.id)||
            binding.expiresAt!==owner.expiresAt||binding.inputHash!==suggestionHash('skilved.suggestion.input.v1',[work.url,work.id])||
            (binding.retainUntil!==undefined&&Date.parse(binding.retainUntil)-Date.parse(owner.createdAt)>30*86400000))
            fail('SUGGESTION_UNAVAILABLE');
          bindings.set(owner.id,{ref:row.ref,binding});
        }
        const {ref,binding}=bindings.get(receipt.id);
        const retired=receipt.recoveryEpoch===undefined?this.#retirement.retireLegacy:
          this.#retirement.retiredRecoveryEpochs.includes(receipt.recoveryEpoch);
        if(!this.admission.receipts.inRecoveryEpoch(receipt)&&!retired)fail('CONFLICT');
        if(!retired) {
          if(receipt.revokedAt===null&&receipt.expiresAt>now)fail('CONFLICT');
          if(binding.retainUntil===undefined)fail('SUGGESTION_UNAVAILABLE');
          if(binding.retainUntil>now)fail('CONFLICT');
        }
        const remaining=[...receipts.values()].filter(other=>other.workId===old.id&&other.id!==receipt.id);
        if(remaining.some(other=>other.updatedAt>now))fail('SUGGESTION_UNAVAILABLE');
        const needed=remaining.some(other=>this.admission.receipts.inRecoveryEpoch(other)&&other.revokedAt===null&&other.expiresAt>now);
        const work={...old,receiptCount:old.receiptCount-1,
          referenceCount:old.referenceCount-(receipt.revokedAt===null?1:0),revision:old.revision+1,updatedAt:now,
          ...(needed?{}:{state:'cancelled',publicResultIds:[],lease:null,generation:old.generation+1})};
        const next={...state,revision:state.revision+1,receiptCount:state.receiptCount-1};
        if(!SuggestionWork.safeParse(work).success||!AdmissionState.safeParse(next).success)fail('SUGGESTION_UNAVAILABLE');
        // Keep the empty work row and its slot as a generation anchor; no work reclamation yet.
        tx.delete(this.admission.receipts.receiptRef(receipt.id));tx.delete(ref);
        tx.set(this.admission.workRef(work.id),suggestionPayload(work));tx.set(this.admission.stateRef(),suggestionPayload(next));
        if(this.admission.receipts.instant()<now)fail('SUGGESTION_UNAVAILABLE');
        return {revision:next.revision,removedReceipts:1,removedReplayBindings:1,retainedWork:true};
      });
  }
}
