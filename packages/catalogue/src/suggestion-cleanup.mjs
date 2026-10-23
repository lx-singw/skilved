import { z } from 'zod';
import { SuggestionSecretSchema } from '@skilved/types/opportunities/suggestions';
import { InstantSchema } from '@skilved/types/opportunities';
import { Catalogue } from './store.mjs';
import { SuggestionAdmission, PublicReplay, Counter } from './suggestion-admission.mjs';
import { ReplayRecord } from './suggestion-receipts.mjs';
import { AdmissionState, SuggestionWork, decodeSuggestion, suggestionHash, suggestionPayload } from './suggestion-records.mjs';
import { DomainError } from './config.mjs';

const fail=code=>{throw new DomainError(code);};
const Revision=z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const Command=z.object({receiptId:SuggestionSecretSchema,expectedRevision:Revision,
  expectedWorkRevision:Revision,expectedAdmissionRevision:Revision}).strict();
const WorkCommand=z.object({workId:SuggestionSecretSchema,expectedWorkRevision:Revision,expectedAdmissionRevision:Revision}).strict();
const PublicCommand=z.object({bindingId:SuggestionSecretSchema,expectedCreatedAt:InstantSchema,expectedAdmissionRevision:Revision}).strict();
const CounterCommand=z.object({counterId:z.string().regex(/^(create|status)_[0-9]{10}$/),
  expectedWindowStart:InstantSchema,expectedCount:z.number().int().positive().max(600)}).strict();
export const SuggestionRetirement=z.object({retiredRecoveryEpochs:z.array(SuggestionSecretSchema).max(8),retireLegacy:z.boolean()})
  .strict().refine(v=>new Set(v.retiredRecoveryEpochs).size===v.retiredRecoveryEpochs.length);
const Preview=z.object({target:z.enum(['receipt','work','public-replay','counter']),limit:z.number().int().min(1).max(50).default(25),
  after:z.string().max(64).optional()}).strict().refine(v=>v.after===undefined||
    (v.target==='counter'?/^(create|status)_[0-9]{10}$/.test(v.after):SuggestionSecretSchema.safeParse(v.after).success));

function boundedRecord(row,schema) {
  const data=row.data();
  if(typeof data?.json!=='string'||Buffer.byteLength(data.json)>8192)fail('SUGGESTION_UNAVAILABLE');
  return decodeSuggestion(row,schema);
}
function counterRecord(row) {
  const record=boundedRecord(row,Counter),id=record.kind+'_'+record.windowStart.slice(0,13).replace(/[^0-9]/g,'');
  if(id!==row.id||!record.windowStart.endsWith(':00:00.000Z')||(record.kind==='create'&&record.count>50))fail('SUGGESTION_UNAVAILABLE');
  return record;
}
/** Bounded retention primitives; no public route, timer or automatic operation.
 * Retirement policy must come from trusted recovery decisions, never a public command.
 * Old processes/configurations must be retired before that policy is used.
 */
export class SuggestionCleanup {
  #retirement;
  constructor(admission,catalogue,retirement) {
    const parsed=SuggestionRetirement.safeParse(retirement),epoch=admission?.receipts?.recoveryEpoch;
    if(!(admission instanceof SuggestionAdmission)||!(catalogue instanceof Catalogue)||admission.db!==catalogue.db||
      !SuggestionSecretSchema.safeParse(epoch).success||!parsed.success||parsed.data.retiredRecoveryEpochs.includes(epoch))
      fail('SUGGESTION_UNAVAILABLE');
    this.admission=admission;this.catalogue=catalogue;this.db=admission.db;this.#retirement=parsed.data;
  }
  async #inventory(tx) {
    const inventory=await this.admission.inventory(tx),{works,receipts}=inventory;
    const rows=await tx.get(this.db.collection('m0_suggestion_replays').limit(501)),bindings=new Map();
    if(rows.size>500||rows.size!==receipts.size)fail('SUGGESTION_UNAVAILABLE');
    for(const row of rows.docs) {
      const binding=boundedRecord(row,ReplayRecord),owner=receipts.get(binding.receiptId),work=owner&&works.get(owner.workId);
      if(!SuggestionSecretSchema.safeParse(row.id).success||!owner||!work||bindings.has(owner.id)||
        binding.expiresAt!==owner.expiresAt||binding.inputHash!==suggestionHash('skilved.suggestion.input.v1',[work.url,work.id])||
        (binding.retainUntil!==undefined&&Date.parse(binding.retainUntil)-Date.parse(owner.createdAt)>30*86400000))
        fail('SUGGESTION_UNAVAILABLE');
      bindings.set(owner.id,{ref:row.ref,binding});
    }
    return {...inventory,bindings};
  }
  async #publicInventory(tx,bindings) {
    const rows=await tx.get(this.db.collection('m0_suggestion_public_replays').limit(501)),result=new Map();
    const receiptIds=new Set([...bindings.values()].map(value=>value.ref.id));
    if(rows.size>500)fail('SUGGESTION_UNAVAILABLE');
    for(const row of rows.docs) {
      const record=boundedRecord(row,PublicReplay);
      if(!SuggestionSecretSchema.safeParse(row.id).success||receiptIds.has(row.id))fail('SUGGESTION_UNAVAILABLE');
      result.set(row.id,{ref:row.ref,record});
    }
    return result;
  }
  /** Read-only candidate preconditions, not eligibility or permission to remove.
   * Every mutation rechecks its own current transactional guards.
   */
  async preview(token,input) {
    const parsed=Preview.safeParse(input);if(!parsed.success)fail('INVALID_COMMAND');
    const {target,limit,after}=parsed.data,uid=await this.catalogue.identity(token);
    return this.db.runTransaction(async tx=>{
      await this.catalogue.operator(tx,uid,'source');
      let candidates;
      if(target==='counter') {
        let query=this.db.collection('m0_suggestion_limits').orderBy('__name__');
        if(after!==undefined)query=query.startAfter(after);
        const rows=await tx.get(query.limit(limit+1));
        candidates=rows.docs.map(row=>{const r=counterRecord(row);return {counterId:row.id,expectedWindowStart:r.windowStart,expectedCount:r.count};});
      } else {
        const {state,works,receipts,bindings}=await this.#inventory(tx),publics=await this.#publicInventory(tx,bindings);
        const records=target==='receipt'?receipts:target==='work'?works:publics;
        candidates=[...records].sort(([a],[b])=>a<b?-1:a>b?1:0).filter(([id])=>after===undefined||id>after).slice(0,limit+1).map(([id,r])=>{
          const expectedAdmissionRevision=state.revision;
          if(target==='receipt')return {receiptId:id,expectedRevision:r.revision,expectedWorkRevision:works.get(r.workId).revision,expectedAdmissionRevision};
          if(target==='work')return {workId:id,expectedWorkRevision:r.revision,expectedAdmissionRevision};
          return {bindingId:id,expectedCreatedAt:r.record.createdAt,expectedAdmissionRevision};
        });
      }
      const items=candidates.slice(0,limit),last=items.at(-1);
      return {items,next:candidates.length>limit?(last.receiptId??last.workId??last.bindingId??last.counterId):null};
    });
  }
  async removeReceipt(token,input) {
    const parsed=Command.safeParse(input);if(!parsed.success)fail('INVALID_COMMAND');
    const command=parsed.data;
    return this.catalogue.mutate(token,'source','suggestions.cleanup.receipt',command.receiptId,
      'Expired or explicitly retired suggestion receipt removed',async tx=>{
        const now=this.admission.receipts.instant(),{state,works,receipts,bindings}=await this.#inventory(tx);
        const receipt=receipts.get(command.receiptId),old=receipt&&works.get(receipt.workId);
        if(!receipt||!old||receipt.revision!==command.expectedRevision||old.revision!==command.expectedWorkRevision||
          state.revision!==command.expectedAdmissionRevision)fail('CONFLICT');
        if(receipt.updatedAt>now||old.updatedAt>now)fail('SUGGESTION_UNAVAILABLE');
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
  async removeWork(token,input) {
    const parsed=WorkCommand.safeParse(input);if(!parsed.success)fail('INVALID_COMMAND');
    const command=parsed.data;
    return this.catalogue.mutate(token,'source','suggestions.cleanup.work',command.workId,'Empty cancelled suggestion work removed',async tx=>{
      const now=this.admission.receipts.instant(),{state,works,bindings}=await this.#inventory(tx),old=works.get(command.workId);
      await this.#publicInventory(tx,bindings);
      if(!old||old.revision!==command.expectedWorkRevision||state.revision!==command.expectedAdmissionRevision)fail('CONFLICT');
      if(old.updatedAt>now)fail('SUGGESTION_UNAVAILABLE');
      if(old.receiptCount!==0||old.referenceCount!==0||old.state!=='cancelled'||old.lease!==null)fail('CONFLICT');
      const next={...state,schemaVersion:2,revision:state.revision+1,workCount:state.workCount-1,
        generationFloor:Math.max(state.generationFloor??0,old.generation)};
      if(!AdmissionState.safeParse(next).success)fail('SUGGESTION_UNAVAILABLE');
      tx.delete(this.admission.workRef(old.id));tx.set(this.admission.stateRef(),suggestionPayload(next));
      if(this.admission.receipts.instant()<now)fail('SUGGESTION_UNAVAILABLE');
      return {revision:next.revision,removedWork:1};
    });
  }
  async removePublicReplay(token,input) {
    const parsed=PublicCommand.safeParse(input);if(!parsed.success)fail('INVALID_COMMAND');
    const command=parsed.data;
    return this.catalogue.mutate(token,'source','suggestions.cleanup.public-replay',command.bindingId,'Expired or explicitly retired public suggestion replay removed',async tx=>{
      const now=this.admission.receipts.instant(),{state,bindings}=await this.#inventory(tx);
      const entry=(await this.#publicInventory(tx,bindings)).get(command.bindingId);
      if(!entry||state.revision!==command.expectedAdmissionRevision||entry.record.createdAt!==command.expectedCreatedAt)fail('CONFLICT');
      const {record,ref}=entry;
      if(record.createdAt>now)fail('SUGGESTION_UNAVAILABLE');
      const retired=record.recoveryEpoch!==undefined&&this.#retirement.retiredRecoveryEpochs.includes(record.recoveryEpoch);
      if(record.recoveryEpoch!==undefined&&record.recoveryEpoch!==this.admission.receipts.recoveryEpoch&&!retired)fail('CONFLICT');
      if(record.retainUntil!==undefined) {
        // Untagged finite bindings also include pre-upgrade current credentials; never infer retirement.
        if(!retired&&record.retainUntil>now)fail('CONFLICT');
      } else if(record.recoveryEpoch!==undefined) {
        if(!retired)fail('SUGGESTION_UNAVAILABLE');
      } else if(!this.#retirement.retireLegacy)fail('CONFLICT');
      const next={...state,revision:state.revision+1};
      if(!AdmissionState.safeParse(next).success)fail('SUGGESTION_UNAVAILABLE');
      tx.delete(ref);tx.set(this.admission.stateRef(),suggestionPayload(next));
      if(this.admission.receipts.instant()<now)fail('SUGGESTION_UNAVAILABLE');
      return {revision:next.revision,removedPublicReplayBindings:1};
    });
  }
  async removeCounter(token,input) {
    const parsed=CounterCommand.safeParse(input);if(!parsed.success)fail('INVALID_COMMAND');
    const command=parsed.data;
    return this.catalogue.mutate(token,'source','suggestions.cleanup.counter',command.counterId,'Elapsed suggestion attempt counter removed',async tx=>{
      const now=this.admission.receipts.instant(),ref=this.db.doc('m0_suggestion_limits/'+command.counterId),snapshot=await tx.get(ref);
      if(!snapshot.exists)fail('CONFLICT');
      const record=counterRecord(snapshot);
      if(record.windowStart!==command.expectedWindowStart||record.count!==command.expectedCount)fail('CONFLICT');
      if(Date.parse(record.windowStart)+3600000>Date.parse(now))fail('CONFLICT');
      tx.delete(ref);
      if(this.admission.receipts.instant()<now)fail('SUGGESTION_UNAVAILABLE');
      return {removedCounters:1};
    });
  }
}
