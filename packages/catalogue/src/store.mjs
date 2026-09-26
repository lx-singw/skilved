import { createHash, randomUUID } from 'node:crypto';
import { OpportunityRecordSchema, projectOpportunity } from '@skilved/types/opportunities/internal';
import { IdSchema, parseReadQuery, decodeCursor, encodeCursor, matchesQuery, ListResponseSchema } from '@skilved/types/opportunities';
import { AliasSchema, resolveAlias } from '@skilved/types/opportunities/storage';
import { Source, Report, Reason, JobInput } from './schemas.mjs';
import { DomainError } from './config.mjs';
import { approvedUrl, retrieve } from './fetch.mjs';

const fail = code => { throw new DomainError(code); };
const hash = text => createHash('sha256').update(text).digest('hex');
const payload = value => ({ json: JSON.stringify(value) });
const value = snap => snap.exists ? JSON.parse(snap.data().json) : null;
const MAX_PUBLIC = 1000;
export class Catalogue {
  constructor(db, auth, now = () => new Date().toISOString()) { this.db = db; this.auth = auth; this.now = now; }
  ref(collection, id) { IdSchema.parse(id); return this.db.collection(`m0_${collection}`).doc(id); }
  async identity(token) {
    if (typeof token !== 'string' || token.length > 16000 || !token) fail('UNAUTHORIZED');
    try { const identity = await this.auth.verifyIdToken(token, true); return identity.uid; }
    catch { fail('UNAUTHORIZED'); }
  }
  async operator(tx, uid, role = 'reviewer') {
    const snap = await tx.get(this.ref('operators', uid));
    const operator = snap.data();
    if (!operator?.active || !Array.isArray(operator.roles) || !operator.roles.includes(role)) fail('FORBIDDEN');
  }
  async mutate(token, role, action, subject, reason, work) {
    Reason.parse(reason); const uid = await this.identity(token);
    return this.db.runTransaction(async tx => {
      await this.operator(tx, uid, role);
      const result = await work(tx, uid);
      tx.create(this.ref('audit', randomUUID()), payload({ action, subject, reason, actor: uid, at: this.now() }));
      return result;
    });
  }
  async registerSource(token, input, expected, reason) {
    const source = Source.parse(input); source.urls.forEach(url => approvedUrl(url, source));
    return this.mutate(token, 'source', 'source.update', source.id, reason, async tx => {
      const ref = this.ref('sources', source.id), old = value(await tx.get(ref));
      if ((old?.revision ?? null) !== expected || source.revision !== (expected ?? 0) + 1) fail('CONFLICT');
      tx.set(ref, payload(source));
      tx.create(this.ref('source_versions',hash(`${source.id}:${source.revision}`)),payload(source));
      return { revision: source.revision };
    });
  }
  async inspect(token, collection, id) {
    if (!['sources','source_versions','drafts','reports','jobs','snapshots','versions'].includes(collection)) fail('INVALID_COMMAND');
    const uid = await this.identity(token);
    return this.db.runTransaction(async tx => { await this.operator(tx, uid); return value(await tx.get(this.ref(collection, id))); });
  }
  async queue(token, collection, after) {
    if (!['sources','drafts','reports','jobs','outbox','audit'].includes(collection)) fail('INVALID_COMMAND');
    const uid = await this.identity(token);
    if (after!==undefined) IdSchema.parse(after);
    return this.db.runTransaction(async tx => { await this.operator(tx, uid); let query=this.db.collection(`m0_${collection}`).orderBy('__name__');if(after)query=query.startAfter(after); const rows = await tx.get(query.limit(101));
      return { items: rows.docs.slice(0,100).map(s => ({ id: s.id, ...value(s) })), next: rows.size > 100 ? rows.docs[99].id : null }; });
  }
  async saveDraft(token, input, expected, reason) {
    const record = OpportunityRecordSchema.parse(input);
    return this.mutate(token, 'reviewer', 'draft.save', record.id, reason, async (tx,uid) => {
      const ref = this.ref('drafts', record.id), old = value(await tx.get(ref));
      if ((old?.revision ?? null) !== expected || record.revision !== (expected ?? 0) + 1) fail('CONFLICT');
      await this.checkSources(tx, record);
      const state=value(await tx.get(this.ref('state','current'))) ?? { revision:1 };
      record.lifecycle = old?.lifecycle==='withdrawn'?'withdrawn':'review'; record.publication = { approved: false, disposition: 'review_required', previouslyPublic: old?.publication.previouslyPublic ?? false, reviewedBy: null };
      record.createdAt = old?.createdAt ?? this.now(); record.updatedAt = this.now();
      OpportunityRecordSchema.parse(record);
      this.writePublication(tx,record,restricted(record),state.revision+1,'draft.changed',uid);
      return { revision: record.revision };
    });
  }
  async checkSources(tx, record) {
    if (!record.citations.length) fail('SOURCE_REQUIRED');
    for (const citation of record.citations) {
      const snapshot = value(await tx.get(this.ref('snapshots', citation.snapshotId)));
      if (!snapshot || snapshot.url !== citation.url) fail('SOURCE_REQUIRED');
      const source = value(await tx.get(this.ref('sources', snapshot.sourceId)));
      if (!source || source.paused || !source.categories.includes(record.category)) fail('SOURCE_PAUSED');
    }
  }
  async publish(token, id, expected, action, reason) {
    if (!['publish','withhold','close','withdraw','restore'].includes(action)) fail('INVALID_COMMAND');
    return this.mutate(token, 'reviewer', action, id, reason, async (tx, uid) => {
      const ref = this.ref('drafts', id), record = value(await tx.get(ref));
      if (!record || record.revision !== expected) fail('CONFLICT');
      const stateRef = this.ref('state','current'), state = value(await tx.get(stateRef)) ?? { revision: 1 };
      if (action === 'publish' || action === 'restore') await this.checkSources(tx, record);
      if (action === 'publish' && record.lifecycle === 'withdrawn') fail('RESTORE_REQUIRES_REVIEW');
      if (action === 'close' && record.lifecycle !== 'published') fail('REVIEW_REQUIRED');
      record.revision++; record.updatedAt = this.now();
      record.lifecycle = action === 'close' ? 'closed' : action === 'withdraw' ? 'withdrawn' : 'published';
      const approving = ['publish','restore','close'].includes(action);
      record.publication = { approved: approving, previouslyPublic: record.publication.previouslyPublic || approving,
        disposition: approving ? 'clear' : 'withheld', reviewedBy: approving ? uid : null };
      // Explicit publish reviews the supplied current draft; identity never comes from its JSON.
      if (approving) {
        for (const fact of facts(record)) { fact.reviewedBy = uid; fact.review = 'approved'; }
        for (const c of record.citations) c.approved = true;
        // Checks must have been reviewed for this exact draft, never silently retarget a stale check.
        for (const c of record.checks) if (c.recordRevision === expected) { c.recordRevision = record.revision; c.reviewerId = uid; }
        if (record.explanation?.review === 'approved') record.explanation.reviewedBy = uid;
      }
      OpportunityRecordSchema.parse(record);
      const projection = projectOpportunity(record);
      if (projection.kind === 'invalid' || (approving && projection.kind !== 'opportunity')) fail('INVALID_RECORD');
      this.writePublication(tx, record, projection, state.revision + 1, action, uid);
      return { revision: record.revision, catalogueRevision: state.revision + 1 };
    });
  }
  writePublication(tx, record, projection, revision, action, actor) {
    tx.set(this.ref('drafts',record.id), payload(record));
    tx.create(this.ref('versions',hash(`${record.id}:${record.revision}`)), payload(record));
    if(projection.kind==='not_public')tx.delete(this.ref('public',record.id));
    else tx.set(this.ref('public',record.id), payload(projection));
    tx.set(this.ref('state','current'), payload({ revision }));
    tx.create(this.ref('outbox',randomUUID()), payload({ id: record.id, revision, action, actor, at: this.now(), cache: 'no-store', state: 'applied' }));
  }
  async list(params) {
    const parsed = parseReadQuery(params); if (!parsed.ok) fail(parsed.error.code);
    const q = parsed.query;
    return this.db.runTransaction(async tx => {
      const state = value(await tx.get(this.ref('state','current'))) ?? { revision: 1 };
      let after;
      if (q.cursor) { const decoded = decodeCursor(q.cursor,q,state.revision); if (!decoded.ok) fail(decoded.error.code); after=decoded.after; }
      const rows = await tx.get(this.db.collection('m0_public').limit(MAX_PUBLIC + 1));
      if (rows.size > MAX_PUBLIC) fail('CATALOGUE_CAPACITY');
      const aliases = await tx.get(this.db.collection('m0_aliases').limit(101));
      if (aliases.size > 100) fail('CATALOGUE_CAPACITY');
      const hidden = new Set(aliases.docs.map(value).filter(a => a.decision === 'confirmed').map(a => a.fromId));
      const all = rows.docs.map(value).filter(p => p.kind === 'opportunity' && !hidden.has(p.opportunity.id) && matchesQuery(p.opportunity,q))
        .map(p => p.opportunity).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
        .filter(o => !after || o.updatedAt < after.updatedAt || (o.updatedAt === after.updatedAt && o.id > after.id));
      const items = all.slice(0,q.limit), last = items.at(-1);
      return ListResponseSchema.parse({ schemaVersion:1, catalogueRevision:state.revision, asOf:this.now(), items,
        nextCursor: all.length > items.length ? encodeCursor(q,state.revision,{ updatedAt:last.updatedAt,id:last.id }) : null });
    });
  }
  async detail(id) {
    IdSchema.parse(id);
    return this.db.runTransaction(async tx => {
      const aliases = await tx.get(this.db.collection('m0_aliases').limit(101));
      if (aliases.size > 100) fail('CATALOGUE_CAPACITY');
      // A reversed decision stops redirecting and returns the original's current disposition.
      const resolved = resolveAlias(id,aliases.docs.map(value).filter(a => a.decision === 'confirmed'));
      if (!resolved) fail('NOT_FOUND');
      const projection = value(await tx.get(this.ref('public',resolved)));
      if (!projection || !['opportunity','status'].includes(projection.kind)) fail('NOT_FOUND');
      return projection;
    });
  }
  async alias(token, input, expected, reason) {
    const alias = AliasSchema.parse(input);
    if (alias.decision === 'proposed') fail('INVALID_COMMAND');
    return this.mutate(token,'reviewer','alias.update',alias.fromId,reason,async tx => {
      const all = await tx.get(this.db.collection('m0_aliases').limit(101));
      if (all.size > 100) fail('CATALOGUE_CAPACITY');
      const aliases = all.docs.map(value), old = aliases.find(a => a.fromId === alias.fromId);
      if ((old?.revision ?? null) !== expected || alias.revision !== (expected ?? 0) + 1) fail('CONFLICT');
      const from = value(await tx.get(this.ref('public',alias.fromId))), to = value(await tx.get(this.ref('public',alias.toId)));
      if (!from || !to || to.kind !== 'opportunity') fail('NOT_FOUND');
      const next = [...aliases.filter(a => a.fromId !== alias.fromId),alias].filter(a => a.decision === 'confirmed');
      if (next.some(a => !resolveAlias(a.fromId,next))) fail('ALIAS_CYCLE');
      const state = value(await tx.get(this.ref('state','current'))) ?? { revision:1 };
      tx.set(this.ref('aliases',alias.fromId),payload(alias));
      tx.set(this.ref('state','current'),payload({ revision:state.revision+1 }));
      tx.create(this.ref('outbox',randomUUID()),payload({ action:'alias.update',id:alias.fromId,revision:state.revision+1,state:'applied',cache:'no-store',at:this.now() }));
      return alias;
    });
  }
  async report(input) {
    const report = Report.parse(input), now = this.now(), bucket = now.slice(0,13).replace(/[^0-9]/g,'');
    return this.db.runTransaction(async tx => {
      const ref = this.ref('report_limits',bucket), old = value(await tx.get(ref)) ?? { count:0 };
      if (old.count >= 100) fail('RATE_LIMITED');
      tx.set(ref,payload({ count:old.count+1 }));
      tx.create(this.ref('reports',randomUUID()),payload({ ...report,revision:1,status:'pending',createdAt:now }));
      return { status:'received' }; // Same acknowledgement for missing/private/public IDs.
    });
  }
  async triage(token,id,expected,decision,reason) {
    if (!['serious','resolved','spam'].includes(decision)) fail('INVALID_COMMAND');
    return this.mutate(token,'reviewer','report.triage',id,reason,async (tx,uid) => {
      const ref=this.ref('reports',id),report=value(await tx.get(ref));
      if (!report || report.revision!==expected) fail('CONFLICT');
      const aliases=await tx.get(this.db.collection('m0_aliases').limit(101));
      if(aliases.size>100)fail('CATALOGUE_CAPACITY');
      const target=resolveAlias(report.opportunityId,aliases.docs.map(value).filter(a=>a.decision==='confirmed'));
      if(!target)fail('ALIAS_CYCLE');
      const record=value(await tx.get(this.ref('drafts',target)));
      const state=value(await tx.get(this.ref('state','current'))) ?? { revision:1 };
      if (decision==='serious' && record) {
        record.revision++; record.updatedAt=this.now(); record.publication.approved=false;record.publication.disposition='withheld';
        this.writePublication(tx,record,restricted(record),state.revision+1,'report.restrict',uid);
      }
      tx.set(ref,payload({ ...report,revision:expected+1,status:decision,reviewedBy:uid,reviewedAt:this.now() }));
      return { revision:expected+1 };
    });
  }
  async enqueue(token,input,reason) {
    const job=JobInput.parse(input), id=hash(JSON.stringify(job));
    return this.mutate(token,'source','job.enqueue',id,reason,async tx => {
      const source=value(await tx.get(this.ref('sources',job.sourceId))), ref=this.ref('jobs',id), old=value(await tx.get(ref));
      if (!source || source.paused) fail('SOURCE_PAUSED'); approvedUrl(job.url,source);
      if (!old) tx.create(ref,payload({ ...job,id,state:'pending',attempts:0,lease:null,leaseUntil:null,nextAt:this.now(),lastSuccess:null }));
      return { id, state:old?.state ?? 'pending' };
    });
  }
  async runJob(token,id,fetcher=retrieve) {
    const claim=await this.mutate(token,'source','job.claim',id,'Bounded source retrieval',async tx => {
      const ref=this.ref('jobs',id),job=value(await tx.get(ref));
      if (!job || job.state==='done' || job.attempts>=3 || job.nextAt>this.now() || (job.leaseUntil && job.leaseUntil>this.now())) fail('JOB_UNAVAILABLE');
      const source=value(await tx.get(this.ref('sources',job.sourceId)));
      if (!source || source.paused) fail('SOURCE_PAUSED');
      const sourceLeaseRef=this.ref('source_leases',job.sourceId), sourceLease=value(await tx.get(sourceLeaseRef));
      if(sourceLease?.until>this.now())fail('SOURCE_BUSY');
      const lease=randomUUID(); const claimed={ ...job,state:'running',attempts:job.attempts+1,lease,leaseUntil:new Date(Date.parse(this.now())+30000).toISOString() };
      tx.set(sourceLeaseRef,payload({lease,until:claimed.leaseUntil}));tx.set(ref,payload(claimed)); return { job:claimed,source };
    });
    let fetched, record;
    try {
      fetched=await fetcher(claim.source,claim.job.url);
      approvedUrl(fetched.url,claim.source);
      if (Buffer.byteLength(fetched.text)>claim.source.maxBytes) fail('BODY_TOO_LARGE');
      record=OpportunityRecordSchema.parse(JSON.parse(fetched.text));
      if (!claim.source.categories.includes(record.category)) fail('INVALID_CATEGORY');
    } catch {
      await this.mutate(token,'source','job.failure',id,'Fetch or extraction failed',async tx => {
        const ref=this.ref('jobs',id),job=value(await tx.get(ref)); if (job?.lease!==claim.job.lease) fail('STALE_LEASE');
        const sourceLeaseRef=this.ref('source_leases',job.sourceId),sourceLease=value(await tx.get(sourceLeaseRef));
        if(sourceLease?.lease===claim.job.lease)tx.delete(sourceLeaseRef);
        tx.set(ref,payload({ ...job,state:job.attempts>=3?'failed':'pending',lease:null,leaseUntil:null,nextAt:new Date(Date.parse(this.now())+60000*job.attempts).toISOString(),error:'FETCH_OR_PARSE_FAILED' }));
      }); return { state:'failed' };
    }
    return this.mutate(token,'source','job.complete',id,'Source snapshot and draft captured',async (tx,uid) => {
      const ref=this.ref('jobs',id),job=value(await tx.get(ref)),source=value(await tx.get(this.ref('sources',claim.source.id)));
      if (job?.lease!==claim.job.lease || job.leaseUntil<this.now()) fail('STALE_LEASE');
      if (!source || source.paused || source.revision!==claim.source.revision) fail('SOURCE_CHANGED');
      const sourceLeaseRef=this.ref('source_leases',source.id),sourceLease=value(await tx.get(sourceLeaseRef));
      if(sourceLease?.lease!==claim.job.lease)fail('STALE_LEASE');
      // External source IDs are scoped to source; different intake IDs cannot overwrite each other.
      const recordId=hash(`${source.id}:${record.id}`), draftRef=this.ref('drafts',recordId), old=value(await tx.get(draftRef));
      const contentHash=hash(fetched.text), snapshotId=hash(`${source.id}:${fetched.url}:${contentHash}`);
      const snapshotRef=this.ref('snapshots',snapshotId), existing=value(await tx.get(snapshotRef));
      const healthRef=this.ref('source_health',source.id);
      const state=value(await tx.get(this.ref('state','current'))) ?? { revision:1 };
      if (!existing) tx.create(snapshotRef,payload({ id:snapshotId,sourceId:source.id,sourceRevision:source.revision,url:fetched.url,hash:contentHash,text:fetched.text,retrievedAt:this.now() }));
      if (!old || old.private.queueId!==snapshotId) {
        record.id=recordId;record.revision=(old?.revision??0)+1;record.lifecycle=old?.lifecycle==='withdrawn'?'withdrawn':'review';record.createdAt=old?.createdAt??this.now();record.updatedAt=this.now();
        record.publication={ approved:false,previouslyPublic:old?.publication.previouslyPublic??false,disposition:'review_required',reviewedBy:null };
        record.citations=[{ id:'source_notice',label:source.name,url:fetched.url,snapshotId,approved:false }];
        for (const fact of facts(record)) { fact.review='pending';fact.reviewedBy=null;fact.sourceSnapshotIds=fact.state==='not_stated'?[]:[snapshotId];fact.evidenceRefs=fact.state==='not_stated'?[]:[snapshotId]; }
        record.checks=[];record.explanation=null;record.private={ reviewerNotes:null,rawSource:null,submittedUrl:null,queueId:snapshotId };
        OpportunityRecordSchema.parse(record);
        this.writePublication(tx,record,restricted(record),state.revision+1,'source.changed',uid);
      }
      tx.set(healthRef,payload({ lastSuccess:this.now(),snapshotId,nextDue:new Date(Date.parse(this.now())+source.cadenceHours*3600000).toISOString() }));
      tx.set(ref,payload({ ...job,state:'done',lease:null,leaseUntil:null,lastSuccess:this.now(),snapshotId,recordId }));
      tx.delete(sourceLeaseRef);
      return { state:'done',recordId,snapshotId };
    });
  }
  async schedule(token,after) {
    const page=await this.queue(token,'sources',after),jobs=[];
    for(const source of page.items) {
      const uid=await this.identity(token);
      const health=await this.db.runTransaction(async tx=>{await this.operator(tx,uid,'source');return value(await tx.get(this.ref('source_health',source.id)));});
      if(source.paused || health?.nextDue>this.now())continue;
      for(const url of source.urls)jobs.push(await this.enqueue(token,{sourceId:source.id,url,key:`due_${Math.floor(Date.parse(this.now())/(source.cadenceHours*3600000))}`},'Scheduled due source check'));
    }
    return {jobs,next:page.next};
  }
}
function facts(o) { return [o.title,o.issuer,o.summary,o.intake,...o.organisations,o.location,o.residence,o.experience,o.deadline,...o.compensation,o.practicalConditions,o.applicationRoute,...o.requirements.requirements.map(r=>r.fact)]; }
function restricted(record) {
  return record.publication.previouslyPublic ? { kind:'status',status:{ schemaVersion:1,id:record.id,revision:record.revision,status:record.lifecycle==='withdrawn'?'withdrawn':'under_review',application:'unavailable' } } : { kind:'not_public' };
}
