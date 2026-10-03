import { createHash, randomUUID } from 'node:crypto';
import robotsParser from 'robots-parser';
import { OpportunityRecordSchema, projectOpportunity } from '@skilved/types/opportunities/internal';
import { IdSchema, InstantSchema } from '@skilved/types/opportunities';
import { Catalogue } from './store.mjs';
import { Source } from './schemas.mjs';
import { DomainError } from './config.mjs';
import { retrieve } from './fetch.mjs';
import { parseRecentJobsList, parseRecentJobsDetail } from './adapters/recentjobs.mjs';
import { planRecentJobsProgrammes } from './adapters/recentjobs-programmes.mjs';
import { parsePrimaryJobPosting } from './adapters/primary-jobposting.mjs';
import { mapExtraction, EXTRACTION_VERSION } from './ai/extraction.mjs';
import { GROQ_MODEL } from './ai/groq.mjs';
import { GEMINI_MODEL, GEMINI_MODEL_CHAIN } from './ai/gemini.mjs';
import { extractWithProvider } from './ai/provider.mjs';
import { GROQ_EXTRACTION_VERSION } from './ai/groq-schema.mjs';
import { extractMetadata, METADATA_VERSION } from './ai/metadata.mjs';
import { extractRequirements, REQUIREMENTS_VERSION } from './ai/requirements.mjs';
import { validateExtraction, validateAssessment, VALIDATION_VERSION } from './ai/validation.mjs';
import { RECENTJOBS_INDEX, assertSourceTarget, approvedIssuer, preflightCandidate, publicationGate, assertMaterialFacts, dayInSA, allFacts } from './worker-policy.mjs';

const hash = input => createHash('sha256').update(input).digest('hex');
const payload = input => ({ json: JSON.stringify(input) });
const value = snap => snap.exists ? JSON.parse(snap.data().json) : null;
const fail = code => { throw new DomainError(code); };
const LEASE_MS = 600_000;
const UA = 'SkilvedSourceReview/1.0';
const isRetryable = error => error.retryable === true || ['FETCH_TIMEOUT', 'UNSUPPORTED_RESPONSE', 'BODY_TOO_LARGE', 'SOURCE_BUSY',
  'EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT', 'ABORT_ERR'].includes(error.code);

/** Trusted backend only. CLI verifies the machine principal; no public HTTP worker endpoint. */
export class RecentJobsWorker {
  constructor(db, principal, { now = () => new Date().toISOString(), fetcher = retrieve, extractor = extractWithProvider,
    extractionMode = 'single', metadataExtractor = extractMetadata, requirementsExtractor = extractRequirements,
    validator = validateExtraction, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), thinking = 'low', validationThinking = 'medium',
    provider = 'groq', model, env = process.env } = {}) {
    if (typeof principal !== 'string' || !/^[^\s@]+@[^\s@]+$/.test(principal)) fail('WORKER_UNAUTHORIZED');
    this.db = db; this.principal = principal; this.actor = `worker_${hash(principal).slice(0, 40)}`;
    this.now = now; this.fetcher = fetcher; this.extractor = extractor; this.validator = validator; this.sleep = sleep;
    if (!['single','split'].includes(extractionMode)) fail('AI_CONFIGURATION_REQUIRED');
    this.extractionMode = extractionMode; this.metadataExtractor = metadataExtractor; this.requirementsExtractor = requirementsExtractor;
    if (!['low', 'medium'].includes(thinking)) fail('AI_CONFIGURATION_REQUIRED'); this.thinking = thinking;
    if (!['low', 'medium'].includes(validationThinking)) fail('AI_CONFIGURATION_REQUIRED'); this.validationThinking = validationThinking;
    if (!['groq','gemini'].includes(provider)) fail('AI_CONFIGURATION_REQUIRED'); this.provider = provider;
    model ??= provider === 'gemini' ? GEMINI_MODEL : GROQ_MODEL;
    if (!(provider === 'gemini' ? GEMINI_MODEL_CHAIN : [GROQ_MODEL, 'openai/gpt-oss-20b']).includes(model)) fail('AI_CONFIGURATION_REQUIRED'); this.model = model;
    if (provider === 'gemini' && !['true','false'].includes(env.SKILVED_AI_FALLBACK ?? 'true')) fail('AI_CONFIGURATION_REQUIRED');
    this.env = {...env}; this.fallback = (env.SKILVED_AI_FALLBACK ?? 'true') === 'true';
    this.catalogue = new Catalogue(db, null, now);
  }
  ref(collection, id) { IdSchema.parse(id); return this.db.collection(`m0_${collection}`).doc(id); }
  async transaction(sourceId, action, work, publishing = false) {
    IdSchema.parse(sourceId); InstantSchema.parse(this.now());
    return this.db.runTransaction(async tx => {
      const grant = (await tx.get(this.ref('workers', this.actor))).data();
      const raw = value(await tx.get(this.ref('sources', sourceId)));
      if (!grant?.active || grant.principal !== this.principal || !grant.sources?.includes(sourceId) ||
          !grant.roles?.includes('ingest') || (publishing && !grant.roles.includes('publish'))) fail('WORKER_FORBIDDEN');
      if (!raw) fail('SOURCE_PAUSED');
      const source = Source.parse(raw);
      if (this.provider === 'gemini' && source.automation?.mode !== 'shadow') fail('GEMINI_SHADOW_ONLY');
      if (this.extractionMode === 'split' && source.automation?.mode !== 'shadow') fail('SPLIT_EXTRACTION_SHADOW_ONLY');
      if (source.paused || source.permission.method !== 'recentjobs_html' || !source.automation || source.automation.mode === 'disabled') fail('SOURCE_PAUSED');
      if (!source.categories.includes('apprenticeship') || !source.urls.includes(RECENTJOBS_INDEX)) fail('SOURCE_POLICY_REQUIRED');
      const result = await work(tx, source);
      tx.create(this.ref('audit', randomUUID()), payload({ action, actor: this.actor, actorType: 'worker', subject: sourceId, at: this.now() }));
      return result;
    });
  }
  async assertClaim(tx, source, claim) {
    const job = value(await tx.get(this.ref('worker_jobs', claim.id)));
    const lease = value(await tx.get(this.ref('worker_leases', source.id)));
    if (source.revision !== claim.sourceRevision) fail('SOURCE_CHANGED');
    if (!job || job.lease !== claim.lease || lease?.lease !== claim.lease || job.leaseUntil <= this.now()) fail('STALE_LEASE');
    return job;
  }
  async schedule(sourceId) {
    return this.transaction(sourceId, 'worker.schedule', async (tx, source) => {
      const bucket = Math.floor(Date.parse(this.now()) / (source.cadenceHours * 3_600_000));
      const id = hash(`${sourceId}:discover:${bucket}`), ref = this.ref('worker_jobs', id);
      const previous = value(await tx.get(ref));
      const watches = await tx.get(this.db.collection('m0_worker_watches').where('sourceId', '==', sourceId).limit(51));
      if (watches.size > 50) fail('SOURCE_WATCH_CAPACITY');
      const refreshes = watches.docs.map(d => d.data()).filter(w => w.stopAt > this.now()).map(w => ({
        id: hash(`${sourceId}:${w.url}:${bucket}`), sourceId, kind: 'detail', url: w.url, bucket,
        state: 'pending', attempts: 0, lease: null, nextAt: this.now(), priorityAt: w.nextCheckAt,
      }));
      const existing = await Promise.all(refreshes.map(j => tx.get(this.ref('worker_jobs', j.id))));
      if (!previous) {
        tx.create(ref, payload({ id, sourceId, kind: 'discover', url: RECENTJOBS_INDEX, bucket, state: 'pending', attempts: 0, nextAt: this.now(), lease: null }));
        tx.set(this.ref('worker_queue', id), { sourceId });
      }
      refreshes.forEach((job, i) => { if (!existing[i].exists) {
        tx.create(this.ref('worker_jobs', job.id), payload(job)); tx.set(this.ref('worker_queue', job.id), { sourceId });
      } });
      for (const watch of watches.docs) if (watch.data().stopAt <= this.now()) tx.delete(watch.ref);
      return id;
    });
  }
  async claim(sourceId, id) {
    return this.transaction(sourceId, 'worker.claim', async (tx, source) => {
      const ref = this.ref('worker_jobs', id), job = value(await tx.get(ref));
      const leaseRef = this.ref('worker_leases', sourceId), previous = value(await tx.get(leaseRef));
      if (!job || job.sourceId !== sourceId || !['pending', 'running'].includes(job.state) || job.nextAt > this.now() || job.leaseUntil > this.now()) fail('JOB_UNAVAILABLE');
      if (previous?.until > this.now()) fail('SOURCE_BUSY');
      if (job.attempts >= 3) {
        tx.set(ref, payload({ ...job, state: 'exception', error: 'ATTEMPTS_EXHAUSTED', lease: null }));
        tx.delete(this.ref('worker_queue', id));
        tx.set(this.ref('worker_exceptions', id), payload({ jobId: id, sourceId, reason: 'ATTEMPTS_EXHAUSTED', at: this.now() }));
        return null;
      }
      const lease = randomUUID(), until = new Date(Date.parse(this.now()) + LEASE_MS).toISOString();
      const claimed = { ...job, state: 'running', attempts: job.attempts + 1, lease, leaseUntil: until, sourceRevision: source.revision };
      tx.set(ref, payload(claimed)); tx.set(leaseRef, payload({ lease, until, nextRequestAt: previous?.nextRequestAt ?? this.now() }));
      return { ...claimed, source };
    });
  }
  async request(claim, url, format) {
    const at = await this.transaction(claim.sourceId, 'worker.request', async (tx, source) => {
      await this.assertClaim(tx, source, claim);
      const ref = this.ref('worker_leases', source.id), lease = value(await tx.get(ref));
      const at = Math.max(Date.parse(this.now()), Date.parse(lease.nextRequestAt));
      tx.set(ref, payload({ ...lease, nextRequestAt: new Date(at + source.automation.minRequestIntervalMs).toISOString() }));
      return at;
    });
    await this.sleep(Math.max(0, at - Date.parse(this.now())));
    // Recheck grant/pause after pacing before any external effect.
    await this.transaction(claim.sourceId, 'worker.before_fetch', (tx, source) => this.assertClaim(tx, source, claim));
    const response = await this.fetcher({ ...claim.source, urls: [url] }, url, undefined, format);
    if (response.url !== url || typeof response.text !== 'string' || Buffer.byteLength(response.text) > claim.source.maxBytes) fail('UNSAFE_RESPONSE');
    return response;
  }
  async robots(claim, url) {
    const robotsUrl = new URL('/robots.txt', url).href;
    const response = await this.request(claim, robotsUrl, 'text');
    const policy = robotsParser(robotsUrl, response.text);
    if (policy.isAllowed(url, UA) !== true) fail('ROBOTS_DISALLOWED');
    const delay = policy.getCrawlDelay(UA);
    if (delay && delay * 1000 > claim.source.automation.minRequestIntervalMs) fail('ROBOTS_DELAY_EXCEEDS_POLICY');
  }
  async modelStage(claim, stage, work) {
    const options = {env:{...this.env, SKILVED_AI_MODEL:this.model,
      SKILVED_AI_THINKING:this.thinking, SKILVED_AI_VALIDATION_THINKING:this.validationThinking}};
    if (this.provider === 'gemini') return work({...options,
      runAttempt:(attempt, send) => this.modelCall(claim, stage, send, attempt)});
    return this.modelCall(claim, stage, () => work(options));
  }
  async modelCall(claim, stage, work, attempt = {}) {
    await this.transaction(claim.sourceId, 'worker.model.reserve', async (tx, source) => {
      const job = await this.assertClaim(tx, source, claim);
      const id = hash(`${source.id}:${dayInSA(this.now())}`), ref = this.ref('model_budgets', id);
      const budget = value(await tx.get(ref)) ?? { sourceId: source.id, date: dayInSA(this.now()), calls: 0 };
      const nextCallAt = this.provider === 'gemini' ? budget.nextCallByModel?.[attempt.model] : budget.nextCallAt;
      if (nextCallAt > this.now()) {
        const error = new DomainError('AI_RATE_LIMITED'); error.retryable = true;
        error.retryAfterMs = Date.parse(nextCallAt) - Date.parse(this.now()); throw error;
      }
      if (budget.calls >= source.automation.maxModelCallsPerDay) fail('MODEL_BUDGET_EXHAUSTED');
      tx.set(ref, payload({ ...budget, calls: budget.calls + 1 }));
      tx.set(this.ref('worker_jobs', claim.id), payload({ ...job, stage }));
    });
    let result, error;
    try { result = await work(); } catch (caught) { error = caught; }
    // Reserve is not refunded on failure/crash: the provider may already have billed.
    await this.transaction(claim.sourceId, 'worker.model.result', async (tx, source) => {
      await this.assertClaim(tx, source, claim);
      const budgetRef = this.ref('model_budgets', hash(`${source.id}:${dayInSA(this.now())}`));
      const budget = error?.code === 'AI_RATE_LIMITED' ? value(await tx.get(budgetRef)) : null;
      if (budget) {
        const until = new Date(Date.parse(this.now()) + Math.max(60000, error.retryAfterMs ?? 0)).toISOString();
        tx.set(budgetRef, payload({...budget, ...(this.provider === 'gemini'
          ? {nextCallByModel:{...budget.nextCallByModel, [attempt.model]:until}} : {nextCallAt:until})}));
      }
      tx.create(this.ref('model_calls', randomUUID()), payload({ jobId: claim.id, sourceId: source.id, stage,
        state: error ? 'failed' : 'received', usage: result?.provenance?.usage ?? error?.usage ?? null,
        at: this.now(), error: error?.code ?? null,
        provider:this.provider, model:attempt.model ?? this.model,
        requestHash:attempt.requestHash ?? result?.provenance?.requestHash ?? null,
        providerStatus: Number.isInteger(error?.providerStatus) ? error.providerStatus : null }));
    });
    if (error) throw error;
    return result;
  }
  async finish(claim, additions, work = async () => {}) {
    return this.transaction(claim.sourceId, 'worker.complete', async (tx, source) => {
      const job = await this.assertClaim(tx, source, claim);
      const leaseRef = this.ref('worker_leases', source.id), lease = value(await tx.get(leaseRef));
      await work(tx, source);
      tx.set(this.ref('worker_jobs', claim.id), payload({ ...job, ...additions, state: 'done', lease: null, leaseUntil: null, completedAt: this.now() }));
      tx.set(leaseRef, payload({ ...lease, lease: null, until: null })); tx.delete(this.ref('worker_queue', claim.id));
      tx.set(this.ref('worker_health', source.id), payload({ lastSuccess: this.now(), lastJobId: claim.id }));
      return { state: 'done', ...additions };
    }, additions.published === true);
  }
  async failed(claim, error) {
    // A changed/paused source or revoked grant can prevent this write. Its lease expires;
    // the queue remains inspectable and can be recovered after policy is restored.
    return this.transaction(claim.sourceId, 'worker.failure', async (tx, source) => {
      const job = await this.assertClaim(tx, source, claim);
      const ref = this.ref('worker_leases', source.id), lease = value(await tx.get(ref));
      const retry = isRetryable(error) && job.attempts < 3;
      const candidateCode = error.code ?? (/^RECENTJOBS_[A-Z_]+$/.test(error.message ?? '') ? error.message : null);
      const code = /^[A-Z_]+$/.test(candidateCode ?? '') ? candidateCode : 'WORKER_STAGE_FAILED';
      const recordId = hash(`${source.id}:${hash(job.url)}`);
      const old = job.kind === 'detail' ? value(await tx.get(this.ref('drafts', recordId))) : null;
      const catalogueState = value(await tx.get(this.ref('state', 'current'))) ?? { revision: 1 };
      if (old?.lifecycle === 'published' && old.publication.approved) {
        old.revision++; old.updatedAt = this.now(); old.lifecycle = 'review'; old.publication.approved = false;
        old.publication.disposition = 'review_required'; old.publication.reviewedBy = null;
        this.catalogue.writePublication(tx, old, { kind: 'status', status: { schemaVersion: 1, id: old.id,
          revision: old.revision, status: 'under_review', application: 'unavailable' } }, catalogueState.revision + 1, 'worker.recheck_failed', this.actor);
      }
      tx.set(this.ref('worker_jobs', claim.id), payload({ ...job, state: retry ? 'pending' : 'exception', error: code,
        nextAt: new Date(Date.parse(this.now()) + Math.max(60_000 * job.attempts, error.retryAfterMs ?? 0)).toISOString(), lease: null, leaseUntil: null }));
      tx.set(ref, payload({ ...lease, lease: null, until: null }));
      if (!retry) {
        tx.delete(this.ref('worker_queue', claim.id));
        tx.set(this.ref('worker_exceptions', claim.id), payload({ jobId: claim.id, sourceId: source.id,
          reason: code, stage: job.stage ?? job.kind, url: job.url, snapshotId: job.snapshotId ?? null,
          primarySnapshotId: job.primarySnapshotId ?? null, recordId: job.recordId ?? null,
          programmePlanId:job.programmePlanId ?? null,
          attempts: job.attempts, at: this.now() }));
      }
      return { state: retry ? 'pending' : 'exception', reason: code };
    });
  }
  async discover(claim) {
    assertSourceTarget(claim.url, 'index'); await this.robots(claim, claim.url);
    const response = await this.request(claim, claim.url, 'html');
    const list = parseRecentJobsList({ html: response.text, url: response.url });
    const articles = list.articles.slice(0, claim.source.automation.maxArticles);
    return this.finish(claim, { discovered: articles.length }, async tx => {
      const jobs = articles.map(article => {
        assertSourceTarget(article.sourceUrl);
        const id = hash(`${claim.sourceId}:${article.sourceUrl}:${claim.bucket}`);
        return { id, sourceId: claim.sourceId, kind: 'detail', url: article.sourceUrl, bucket: claim.bucket,
          state: 'pending', attempts: 0, lease: null, nextAt: this.now() };
      });
      const existing = await Promise.all(jobs.map(j => tx.get(this.ref('worker_jobs', j.id))));
      jobs.forEach((job, index) => { if (!existing[index].exists) {
        tx.create(this.ref('worker_jobs', job.id), payload(job)); tx.set(this.ref('worker_queue', job.id), { sourceId: job.sourceId });
      } });
    });
  }
  async capture(claim, candidate) {
    const recordId = hash(`${claim.sourceId}:${candidate.sourceRecordId}`);
    const snapshotId = hash(`${claim.sourceId}:${candidate.sourceUrl}:${candidate.contentHash}`);
    const text = `${candidate.title}\n${candidate.sourceText}`;
    return this.transaction(claim.sourceId, 'worker.snapshot', async (tx, source) => {
      const job = await this.assertClaim(tx, source, claim);
      const old = value(await tx.get(this.ref('drafts', recordId)));
      const snapRef = this.ref('snapshots', snapshotId), existing = value(await tx.get(snapRef));
      const state = value(await tx.get(this.ref('state', 'current'))) ?? { revision: 1 };
      if (['withdrawn', 'closed', 'archived'].includes(old?.lifecycle) || old?.publication.disposition === 'withheld') fail('RESTORE_REQUIRES_REVIEW');
      if (!existing) tx.create(snapRef, payload({ id: snapshotId, sourceId: source.id, sourceRevision: source.revision,
        url: candidate.sourceUrl, hash: hash(text), contentHash: candidate.contentHash, text, retrievedAt: this.now() }));
      tx.set(this.ref('worker_jobs', claim.id), payload({ ...job, snapshotId, recordId, stage: 'preflight' }));
      if (old?.publication.approved && old.private.queueId !== snapshotId) {
        old.revision++; old.lifecycle = 'review'; old.publication.approved = false;
        old.publication.disposition = 'review_required'; old.publication.reviewedBy = null; old.updatedAt = this.now();
        this.catalogue.writePublication(tx, old, { kind: 'status', status: { schemaVersion: 1, id: old.id,
          revision: old.revision, status: 'under_review', application: 'unavailable' } }, state.revision + 1, 'worker.source_changed', this.actor);
      }
      return { recordId, snapshotId, expectedRevision: old?.revision ?? null, createdAt: old?.createdAt ?? this.now(),
        previouslyPublic: old?.publication.previouslyPublic ?? false };
    });
  }
  async cache(claim, key, produce) {
    const existing = await this.transaction(claim.sourceId, 'worker.cache.read', async (tx, source) => {
      await this.assertClaim(tx, source, claim); return value(await tx.get(this.ref('model_cache', key)));
    });
    if (existing) return existing;
    const result = await produce();
    await this.transaction(claim.sourceId, 'worker.cache.write', async (tx, source) => {
      await this.assertClaim(tx, source, claim); tx.set(this.ref('model_cache', key), payload(result));
    });
    return result;
  }
  async detail(claim) {
    assertSourceTarget(claim.url); await this.robots(claim, claim.url);
    const response = await this.request(claim, claim.url, 'html');
    const candidate = parseRecentJobsDetail({ html: response.text, url: response.url, observedOn: dayInSA(this.now()) });
    const captured = await this.capture(claim, candidate);
    if (claim.source.automation.mode === 'shadow' && candidate.applicationCandidates.length > 1) {
      const plan = planRecentJobsProgrammes(candidate);
      await this.transaction(claim.sourceId, 'worker.programme_plan', async (tx, source) => {
        const job = await this.assertClaim(tx, source, claim);
        tx.set(this.ref('worker_programme_plans', claim.id), payload({sourceId:source.id,jobId:claim.id,
          snapshotId:captured.snapshotId,plan,at:this.now()}));
        tx.set(this.ref('worker_jobs',claim.id),payload({...job,programmePlanId:claim.id}));
      });
    }
    const pendingRoute = preflightCandidate(claim.source, candidate, this.now());
    const crawlEmployer = claim.source.automation.employerCrawl && pendingRoute.method === 'portal';
    if (crawlEmployer) await this.robots(claim, pendingRoute.destination);
    const version = this.extractionMode === 'split' ? `split:${METADATA_VERSION}:${REQUIREMENTS_VERSION}` : GROQ_EXTRACTION_VERSION;
    const policy = this.provider === 'gemini' ? `:json_object:chain_v1:${this.fallback}:${GEMINI_MODEL_CHAIN.join(',')}` : '';
    const keyBase = `${claim.sourceId}:${claim.sourceRevision}:${candidate.contentHash}:${this.provider}:${this.model}${policy}:${this.thinking}:${version}`;
    let extraction;
    if (this.extractionMode === 'split') {
      const metadata = await this.cache(claim,hash(`${keyBase}:metadata`),
        ()=>this.modelStage(claim,'metadata',options=>this.metadataExtractor(candidate,options)));
      const requirements = await this.cache(claim,hash(`${keyBase}:requirements`),
        ()=>this.modelStage(claim,'requirements',options=>this.requirementsExtractor(candidate,options)));
      extraction = {extraction:{...metadata.metadata,requirements:requirements.requirements},
        provenance:{provider:this.provider,extractionVersion:version,stages:{metadata:metadata.provenance,requirements:requirements.provenance}}};
    } else extraction = await this.cache(claim, hash(`${keyBase}:${EXTRACTION_VERSION}`),
      () => this.modelStage(claim, 'extraction', options => this.extractor(candidate, options)));
    const mapped = mapExtraction(candidate, extraction.extraction, { sourceId: claim.sourceId, now: this.now() });
    if (!mapped.record) fail('CATEGORY_UNRESOLVED');
    const record = mapped.record;
    await this.transaction(claim.sourceId, 'worker.candidate', async (tx, source) => {
      const job = await this.assertClaim(tx, source, claim);
      tx.set(this.ref('worker_candidates', claim.id), payload({ record, evidence: mapped.evidence, issues: mapped.issues,
        provenance: extraction.provenance, sourceId: source.id, jobId: claim.id }));
      tx.set(this.ref('worker_jobs', claim.id), payload({ ...job, stage: 'material_checks' }));
    });
    assertMaterialFacts(record);
    approvedIssuer(claim.source, record);
    const destination = record.applicationRoute.value.destination;
    let primary = null, primaryHash = 'discovery_only', primarySnapshotId = null;
    if (crawlEmployer) {
      const primaryResponse = await this.request(claim, destination, 'html');
      primary = parsePrimaryJobPosting(primaryResponse.text); primaryHash = hash(primaryResponse.text);
      primarySnapshotId = hash(`${claim.sourceId}:${destination}:${primaryHash}`);
      await this.transaction(claim.sourceId, 'worker.primary_snapshot', async (tx, source) => {
        const job = await this.assertClaim(tx, source, claim);
        const ref = this.ref('snapshots', primarySnapshotId), previous = value(await tx.get(ref));
        if (!previous) tx.create(ref, payload({ id: primarySnapshotId, sourceId: source.id, sourceRevision: source.revision,
          url: destination, hash: primaryHash, text: primaryResponse.text, retrievedAt: this.now() }));
        tx.set(this.ref('worker_jobs', claim.id), payload({ ...job, primarySnapshotId, stage: 'validation' }));
      });
    }
    const assessment = await this.cache(claim, hash(`${keyBase}:${EXTRACTION_VERSION}:${VALIDATION_VERSION}:${this.validationThinking}:${primaryHash}`),
      () => this.modelStage(claim, 'validation', options => this.validator({ record, recentjobsText: mapped.snapshot.text, primary, applicationCandidates: candidate.applicationCandidates }, options)));
    // Validate even injected/internal validators; production does not expose this dependency to callers.
    const parsed = validateAssessment({ supported: assessment.supported, issues: assessment.issues, evidence: assessment.evidence }, mapped.snapshot.text, primary);
    const gate = publicationGate(claim.source, candidate, record, primary, parsed, this.now());
    const published = claim.source.automation.mode === 'automatic';
    return this.finish(claim, { recordId: captured.recordId, published, snapshotId: captured.snapshotId }, async (tx, source) => {
      const old = value(await tx.get(this.ref('drafts', captured.recordId)));
      const state = value(await tx.get(this.ref('state', 'current'))) ?? { revision: 1 };
      const watches = published ? await tx.get(this.db.collection('m0_worker_watches').where('sourceId', '==', source.id).limit(51)) : null;
      if (watches && watches.size >= 50 && !watches.docs.some(d => d.id === record.id)) fail('SOURCE_WATCH_CAPACITY');
      if ((old?.revision ?? null) !== captured.expectedRevision) fail('CONFLICT');
      if (['withdrawn', 'closed', 'archived'].includes(old?.lifecycle) || old?.publication.disposition === 'withheld') fail('RESTORE_REQUIRES_REVIEW');
      if (published && source.automation.mode !== 'automatic') fail('SOURCE_CHANGED');
      // Re-evaluate timing after slow model/network work, inside the commit boundary.
      const currentGate = publicationGate(source, candidate, record, primary, parsed, this.now());
      record.revision = (old?.revision ?? 0) + 1; record.requirements.revision = record.revision;
      record.createdAt = captured.createdAt; record.updatedAt = this.now();
      if (primarySnapshotId) record.citations.push({ id: 'primary_notice', label: 'Employer application notice', url: destination, snapshotId: primarySnapshotId, approved: published });
      record.publication = { approved: published, previouslyPublic: captured.previouslyPublic || published,
        disposition: published ? 'clear' : 'review_required', reviewedBy: published ? this.actor : null };
      record.lifecycle = published ? 'published' : 'review';
      if (published) {
        for (const f of allFacts(record)) { f.review = 'approved'; f.reviewedBy = this.actor; }
        record.citations.forEach(c => { c.approved = true; });
        const scopes = primary ? ['issuer_attribution', 'application_relationship', 'destination_reachability', 'availability', 'requirements']
          : ['announcement', 'application_relationship', 'requirements'];
        record.checks = scopes.map((scope, i) => ({
          id: `automatic_${i}`, scope, outcome: 'supported', method: 'automatic', checkedAt: this.now(),
          nextCheckAt: currentGate.nextCheckAt, reviewerId: this.actor, citationIds: primary ? ['source_notice', 'primary_notice'] : ['source_notice'],
          recordRevision: record.revision, destination, public: true, notes: primary ? 'Automated checks against discovery and employer notices.'
            : 'Application method and facts checked against the discovery notice and registered issuer route; employer page not crawled.' }));
      }
      OpportunityRecordSchema.parse(record);
      const projection = published ? projectOpportunity(record) : captured.previouslyPublic ? { kind: 'status', status: {
        schemaVersion: 1, id: record.id, revision: record.revision, status: 'under_review', application: 'unavailable' } } : { kind: 'not_public' };
      if (published && (projection.kind !== 'opportunity' || projection.opportunity.application.state !== 'available')) fail('INVALID_PUBLICATION');
      tx.set(this.ref('worker_decisions', claim.id), payload({ sourceId: source.id, sourceRevision: source.revision, recordId: record.id,
        recordRevision: record.revision, extraction: extraction.provenance, validation: assessment.provenance,
        evidence: [...mapped.evidence, ...assessment.evidence], qualificationRef: source.automation.qualificationRef,
        decision: published ? 'published' : 'shadow_pass', validationBasis: primary ? 'discovery_and_primary' : 'discovery_notice',
        nextCheckAt: gate.nextCheckAt, at: this.now() }));
      if (published) tx.set(this.ref('worker_watches', record.id), { sourceId: source.id, url: claim.url,
        nextCheckAt: currentGate.nextCheckAt, stopAt: new Date(Date.parse(`${record.deadline.value.localDate}T00:00:00.000+02:00`)).toISOString() });
      this.catalogue.writePublication(tx, record, projection, state.revision + 1, published ? 'worker.publish' : 'worker.shadow', this.actor);
    });
  }
  async runJob(sourceId, id) {
    const claim = await this.claim(sourceId, id); if (!claim) return { state: 'exception', reason: 'ATTEMPTS_EXHAUSTED' };
    try { return claim.kind === 'discover' ? await this.discover(claim) : await this.detail(claim); }
    catch (error) { return this.failed(claim, error); }
  }
  async run(sourceId) {
    await this.schedule(sourceId);
    const results = [], attempted = new Set();
    for (let n = 0; n < 11; n++) {
      const queue = await this.db.collection('m0_worker_queue').where('sourceId', '==', sourceId).limit(50).get();
      const jobs = await Promise.all(queue.docs.map(d => this.ref('worker_jobs', d.id).get()));
      const eligible = jobs.map(value).filter(j => j && !attempted.has(j.id) && j.nextAt <= this.now() && !(j.leaseUntil > this.now()));
      eligible.sort((a, b) => (a.kind === 'discover' ? -1 : 1) - (b.kind === 'discover' ? -1 : 1) || (a.priorityAt ?? a.nextAt).localeCompare(b.priorityAt ?? b.nextAt));
      const job = eligible[0]; if (!job) break;
      attempted.add(job.id); results.push(await this.runJob(sourceId, job.id));
    }
    return { results };
  }
}
