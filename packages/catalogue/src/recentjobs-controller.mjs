import {createHash} from 'node:crypto';
import {IdSchema, InstantSchema} from '@skilved/types/opportunities';
import {DomainError} from './config.mjs';
import {RecentJobsWorker} from './recentjobs-worker.mjs';

const MAX_QUEUE = 200;
const MAX_JOBS = 11;
const RECHECK_MS = 60_000;
const hash = input => createHash('sha256').update(input).digest('hex');
const fail = code => { throw new DomainError(code); };
const value = row => row.exists ? JSON.parse(row.data().json) : null;
const instant = input => {
  if (!InstantSchema.safeParse(input).success) fail('CONTROLLER_STATE_INVALID');
  return Date.parse(input);
};

/** Pure wake calculation using stored job deferrals and the existing discovery cadence. */
export function planRecentJobsWake({sourceId, cadenceHours, at, jobs, sourceLeaseUntil = null,
  discoveryPending, discoveryScheduled}) {
  if (!IdSchema.safeParse(sourceId).success || !Number.isInteger(cadenceHours) || cadenceHours < 1 || cadenceHours > 720 ||
      !Array.isArray(jobs) || typeof discoveryPending !== 'boolean' || typeof discoveryScheduled !== 'boolean')
    fail('CONTROLLER_STATE_INVALID');
  if (jobs.length > MAX_QUEUE) fail('CONTROLLER_QUEUE_CAPACITY');
  const now = instant(at), lease = sourceLeaseUntil == null ? now : instant(sourceLeaseUntil);
  const cadence = cadenceHours * 3_600_000;
  const nextDiscovery = (Math.floor(now / cadence) + 1) * cadence;
  const ids = new Set();
  const work = jobs.map(job => {
    if (!job || !IdSchema.safeParse(job.id).success || ids.has(job.id) || job.sourceId !== sourceId ||
        !['discover','detail'].includes(job.kind) || !['pending','running'].includes(job.state)) fail('CONTROLLER_STATE_INVALID');
    ids.add(job.id);
    const due = instant(job.nextAt), held = job.leaseUntil == null ? now : instant(job.leaseUntil);
    const budgetReset = job.sourceBudgetResetAt == null ? now : instant(job.sourceBudgetResetAt);
    if (job.priorityAt != null) instant(job.priorityAt);
    return {...job, availableAt:Math.max(now, due, held, lease, budgetReset)};
  });
  work.sort((a,b) => (a.kind === 'discover' ? 0 : 1) - (b.kind === 'discover' ? 0 : 1) ||
    (a.priorityAt ?? a.nextAt).localeCompare(b.priorityAt ?? b.nextAt) || a.id.localeCompare(b.id));
  const dueJobIds = work.filter(job => job.availableAt <= now).map(job => job.id);
  const scheduleAt = !discoveryScheduled && !discoveryPending ? Math.max(now, lease) : nextDiscovery;
  const next = Math.min(scheduleAt, ...work.map(job => job.availableAt));
  return {state:next <= now ? 'ready' : 'waiting', reason:next <= now ? 'ready' :
    next === lease && lease > now ? 'source_lease' : next === scheduleAt ? 'discovery_cadence' : 'job_due',
    nextWakeAt:new Date(next).toISOString(), queued:jobs.length, ready:dueJobIds.length, dueJobIds};
}

/** Backend-only bounded shadow ticks. Existing transactional job leases own execution. */
export class RecentJobsController {
  constructor(db, principal, {sourceId, sourceRevision, assertAdmission, ...options} = {}) {
    if (!IdSchema.safeParse(sourceId).success || !Number.isSafeInteger(sourceRevision) || sourceRevision < 1 ||
        assertAdmission !== undefined && typeof assertAdmission !== 'function') fail('WORKER_CONFIGURATION_REQUIRED');
    this.sourceId = sourceId; this.sourceRevision = sourceRevision;
    this.worker = new RecentJobsWorker(db, principal, {...options, assertAdmission:async(source, grant, caller) => {
      if (source.id !== sourceId || source.revision !== sourceRevision) fail('CONTROLLER_POLICY_CHANGED');
      if (source.automation?.mode !== 'shadow' || !Array.isArray(grant.roles) || grant.roles.length !== 1 || grant.roles[0] !== 'ingest')
        fail('CONTROLLER_SHADOW_ONLY');
      await assertAdmission?.(source, grant, caller);
    }});
  }
  async snapshot(tx, source) {
    const worker = this.worker, at = worker.now();
    const bucket = Math.floor(instant(at) / (source.cadenceHours * 3_600_000));
    const queue = await tx.get(worker.db.collection('m0_worker_queue').where('sourceId','==',source.id).limit(MAX_QUEUE + 1));
    if (queue.size > MAX_QUEUE) fail('CONTROLLER_QUEUE_CAPACITY');
    const [rows, leaseRow, cursorRow, discoveryRow] = await Promise.all([
      queue.size ? tx.getAll(...queue.docs.map(row => worker.ref('worker_jobs',row.id))) : [],
      tx.get(worker.ref('worker_leases',source.id)), tx.get(worker.ref('worker_discovery',source.id)),
      tx.get(worker.ref('worker_jobs',hash(`${source.id}:discover:${bucket}`))),
    ]);
    const jobs = rows.map(row => {
      const job = value(row);
      if (!job || job.id !== row.id) fail('CONTROLLER_STATE_INVALID');
      return job;
    });
    const cursor = value(cursorRow), lease = value(leaseRow);
    if (cursor?.state === 'pending' && !jobs.some(job => job.id === cursor.currentJobId && job.kind === 'discover' &&
        job.discoveryCycle === cursor.cycleId)) fail('CONTROLLER_STATE_INVALID');
    return planRecentJobsWake({sourceId:source.id, cadenceHours:source.cadenceHours, at, jobs,
      sourceLeaseUntil:lease?.until ?? null, discoveryPending:cursor?.state === 'pending', discoveryScheduled:discoveryRow.exists});
  }
  async inspect() {
    return this.worker.transaction(this.sourceId, 'worker.controller.inspect', (tx, source) => this.snapshot(tx, source));
  }
  async checkpoint(results = []) {
    return this.worker.transaction(this.sourceId, 'worker.controller.checkpoint', async(tx, source) => {
      const ref = this.worker.ref('worker_controllers',this.sourceId);
      const [plan, oldRow] = await Promise.all([this.snapshot(tx,source),tx.get(ref)]);
      const old = value(oldRow);
      if (old && (old.version !== 1 || old.sourceId !== source.id || !Number.isSafeInteger(old.revision) ||
          old.revision < 1 || old.revision >= Number.MAX_SAFE_INTEGER)) fail('CONTROLLER_STATE_INVALID');
      const outcomes = {done:0,pending:0,exception:0};
      for (const row of results) {
        if (!Object.hasOwn(outcomes,row.state)) fail('CONTROLLER_STATE_INVALID');
        outcomes[row.state]++;
      }
      const observedAt = this.worker.now();
      // Ready continuations get a bounded recheck delay, not an in-process spin.
      const nextWakeAt = plan.state === 'ready' ? new Date(instant(observedAt) + RECHECK_MS).toISOString() : plan.nextWakeAt;
      const {dueJobIds, ...summary} = plan;
      const record = {version:1,revision:(old?.revision ?? 0)+1,sourceId:source.id,sourceRevision:source.revision,
        principal:this.worker.principal,observedAt,...summary,nextWakeAt,outcomes};
      tx.set(ref,{json:JSON.stringify(record)});
      return record;
    });
  }
  async tick() {
    await this.worker.schedule(this.sourceId);
    const results = [], attempted = new Set();
    for (let n = 0; n < MAX_JOBS; n++) {
      const plan = await this.inspect(), id = plan.dueJobIds.find(id => !attempted.has(id));
      if (!id) break;
      attempted.add(id);
      try { results.push(await this.worker.runJob(this.sourceId,id)); }
      catch(error) {
        // Another tick can claim/finish between inspection and claim. Its job
        // and source leases, not a second controller lease, decide ownership.
        if (!['SOURCE_BUSY','JOB_UNAVAILABLE'].includes(error.code)) throw error;
        // A genuinely contested job is now held or gone. A still-ready job
        // rejected by claim is corrupt/unclaimable, not a reason to poll forever.
        if ((await this.inspect()).dueJobIds.includes(id)) fail('CONTROLLER_STATE_INVALID');
      }
    }
    return {...await this.checkpoint(results),results};
  }
}
