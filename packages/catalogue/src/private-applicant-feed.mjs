import {createHash} from 'node:crypto';
import {IdSchema,InstantSchema,ListResponseSchema,DetailResponseSchema,parseReadQuery,matchesQuery,encodeCursor,decodeCursor} from '@skilved/types/opportunities';
import {OpportunityRecordSchema} from '@skilved/types/opportunities/internal';
import {Catalogue} from './store.mjs';
import {DomainError} from './config.mjs';
import {dayInSA,enforceAutomaticFreshness} from './worker-policy.mjs';

const fail=code=>{throw new DomainError(code);};
const sha=s=>createHash('sha256').update(s).digest('hex');
const reviewable=r=>r.lifecycle==='review'&&r.publication.approved===false&&r.publication.previouslyPublic===false&&r.publication.disposition==='review_required';
const datedOpen=(r,at)=>r.deadline.state==='stated'&&r.deadline.value?.kind==='date'&&r.deadline.value.localDate>dayInSA(at);
const unavailable=(id,revision)=>DetailResponseSchema.parse({kind:'status',status:{schemaVersion:1,id,revision,status:'under_review',application:'unavailable'}});
const skippedCodes=new Set(['SOURCE_REQUIRED','SOURCE_PAUSED','UNDATED_WORKER_PUBLICATION_UNSUPPORTED','PRIVATE_AUTOMATIC_CHECK_UNSUPPORTED','INVALID_RECORD','REVIEW_REQUIRED']);

/** Reviewer-only, read-only private publication previews. This is deliberately
 * not exported through the public HTTP API and grants no publication authority. */
export class PrivateApplicantFeed {
  constructor(catalogue,{enabled=false,sourceIds}={}) {
    if(enabled!==true)fail('PRIVATE_FEED_DISABLED');
    if(!(catalogue instanceof Catalogue)||!Array.isArray(sourceIds)||sourceIds.length<1||sourceIds.length>20||
      sourceIds.some(id=>!IdSchema.safeParse(id).success)||new Set(sourceIds).size!==sourceIds.length)fail('PRIVATE_FEED_CONFIGURATION_REQUIRED');
    this.catalogue=catalogue;this.sourceIds=new Set(sourceIds);
  }
  async inventory(token) {
    const queue=await this.catalogue.queue(token,'drafts');
    if(queue.next!==null)fail('PRIVATE_FEED_CAPACITY');
    const ids=queue.items.map(r=>r.id);if(new Set(ids).size!==ids.length)fail('PRIVATE_FEED_STATE_INVALID');
    return{rows:queue.items,sha256:sha(JSON.stringify(queue.items))};
  }
  async inScope(token,record) {
    if(!record.citations.length)return false;
    for(const id of new Set(record.citations.map(c=>c.snapshotId))){
      const snapshot=await this.catalogue.inspect(token,'snapshots',id);
      if(!snapshot||!this.sourceIds.has(snapshot.sourceId))return false;
    }
    return true;
  }
  async current(token) {
    const before=await this.inventory(token),at=this.catalogue.now();InstantSchema.parse(at);
    const projected=new Map(),excluded={};const exclude=reason=>{excluded[reason]=(excluded[reason]??0)+1;};
    for(const raw of before.rows){
      const parsed=OpportunityRecordSchema.safeParse(raw);
      if(!parsed.success){exclude('invalid_draft');continue;}
      const record=parsed.data;
      if(!reviewable(record)){exclude('review_disposition');continue;}
      if(!datedOpen(record,at)){exclude('not_open_or_undated');continue;}
      if(record.updatedAt>at){exclude('future_update');continue;}
      if(!await this.inScope(token,record)){exclude('outside_scope');continue;}
      try{
        const preview=await this.catalogue.previewPublication(token,record.id,record.revision,'publish');
        if(preview.publication!==false||preview.expectedRevision!==record.revision)fail('PRIVATE_FEED_STATE_INVALID');
        if(preview.projection.kind!=='opportunity'){exclude('freshness_review');continue;}
        // The normal preview is hypothetical. Keep the real draft's update time
        // for sorting, never make every read look like a newly produced notice.
        // The private viewer offers no application actions, even if public
        // publication could make a reviewed route available.
        const view=DetailResponseSchema.parse({kind:'opportunity',opportunity:{...preview.projection.opportunity,
          updatedAt:record.updatedAt,application:{state:'unavailable',reason:'needs_review'}}});
        projected.set(record.id,{record,view});
      }catch(error){
        if(error?.code==='CONFLICT')fail('PRIVATE_FEED_CHANGED');
        if(!skippedCodes.has(error?.code))throw error;
        exclude('preview_review');
      }
    }
    // Repeat genuine identity/role admission and the bounded inventory read.
    // A concurrent draft edit is a retry condition, never a mixed-version feed.
    const after=await this.inventory(token);if(after.sha256!==before.sha256)fail('PRIVATE_FEED_CHANGED');
    const checkedAt=this.catalogue.now();InstantSchema.parse(checkedAt);
    for(const [id,item]of projected){
      if(!datedOpen(item.record,checkedAt)||enforceAutomaticFreshness(item.view,checkedAt).kind!=='opportunity'){
        projected.delete(id);exclude('freshness_review');
      }
    }
    const generation=1+Number.parseInt(sha(before.sha256+':'+JSON.stringify([...projected.keys()])).slice(0,12),16);
    return{projected,excluded,generation,checkedAt,considered:before.rows.length};
  }
  async list(token,params=new URLSearchParams()) {
    const parsed=parseReadQuery(params);if(!parsed.ok)fail(parsed.error.code);
    const {query}=parsed,snapshot=await this.current(token);let after;
    if(query.cursor){const decoded=decodeCursor(query.cursor,query,snapshot.generation);if(!decoded.ok)fail(decoded.error.code);after=decoded.after;}
    const all=[...snapshot.projected.values()].map(p=>p.view.opportunity).filter(o=>matchesQuery(o,query))
      .sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||a.id.localeCompare(b.id))
      .filter(o=>!after||o.updatedAt<after.updatedAt||o.updatedAt===after.updatedAt&&o.id>after.id);
    const items=all.slice(0,query.limit),last=items.at(-1);
    return{kind:'private_applicant_feed',publication:false,considered:snapshot.considered,excluded:snapshot.excluded,
      page:ListResponseSchema.parse({schemaVersion:1,catalogueRevision:snapshot.generation,asOf:snapshot.checkedAt,items,
        nextCursor:all.length>items.length?encodeCursor(query,snapshot.generation,{updatedAt:last.updatedAt,id:last.id}):null})};
  }
  async detail(token,id) {
    IdSchema.parse(id);const snapshot=await this.current(token),found=snapshot.projected.get(id);
    if(found)return{kind:'private_applicant_detail',publication:false,checkedAt:snapshot.checkedAt,draftRevision:found.record.revision,projection:found.view};
    // Normal authenticated inspection keeps known private references useful
    // without exposing expired/paused/withheld facts or manufacturing closure.
    const raw=await this.catalogue.inspect(token,'drafts',id),parsed=OpportunityRecordSchema.safeParse(raw);
    if(!parsed.success||!reviewable(parsed.data)||!await this.inScope(token,parsed.data))fail('NOT_FOUND');
    return{kind:'private_applicant_detail',publication:false,checkedAt:snapshot.checkedAt,draftRevision:parsed.data.revision,
      projection:unavailable(id,parsed.data.revision+1)};
  }
}
