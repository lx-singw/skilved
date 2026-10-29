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
import { programmeCandidate, mapProgrammeExtraction, extractProgramme, validateProgramme, validateProgrammeAssessment,
  PROGRAMME_EXTRACTION_VERSION, PROGRAMME_VALIDATION_VERSION } from './ai/programme-extraction.mjs';
import { parsePrimaryJobPosting } from './adapters/primary-jobposting.mjs';
import { mapExtraction, EXTRACTION_VERSION } from './ai/extraction.mjs';
import { GROQ_MODEL } from './ai/groq.mjs';
import { GEMINI_MODEL, GEMINI_MODEL_CHAIN } from './ai/gemini.mjs';
import { geminiAvailabilityFailure } from './ai/gemini-models.mjs';
import { transportCodeOf } from './ai/transport-diagnostic.mjs';
import { privateLocationDiagnostic } from './ai/location-evidence.mjs';
import { extractWithProvider } from './ai/provider.mjs';
import { GROQ_EXTRACTION_VERSION } from './ai/groq-schema.mjs';
import { extractMetadata, METADATA_VERSION } from './ai/metadata.mjs';
import { extractRequirements, REQUIREMENTS_VERSION } from './ai/requirements.mjs';
import { validateExtraction, validateAssessment, validationPayload, VALIDATION_VERSION } from './ai/validation.mjs';
import { geminiQuotaScope,geminiQuotaLimits,geminiQuotaDay,nextGeminiQuotaReset,recentGeminiUsage,mergeGeminiMinuteUsage,geminiUsageDelay } from './ai/gemini-quota.mjs';
import { RECENTJOBS_INDEX, assertSourceTarget, approvedRoute, approvedIssuer, preflightCandidate, publicationGate, draftGate, assertMaterialFacts, dayInSA, allFacts } from './worker-policy.mjs';
import { usesUndatedV2, makeUndatedOrigin, undatedOriginKeys } from './undated-policy.mjs';
import { capturedNoticeJobs } from './undated-origin-import.mjs';
import { discoveryChunk } from './recentjobs-discovery.mjs';
import { ORIGINAL_RESOLVER_VERSION, originalNoticeTarget, originalRetrievalFailure,
  resolveOriginalNotice, refreshOriginalResolution } from './original-notice-resolver.mjs';
import { ISSUER_REGISTRY_VERSION, lookupIssuerRelationships, validateIssuerBindings, relationshipBinding } from './issuer-registry.mjs';
import { ORIGIN_DISCOVERY_VERSION, discoveryOutcome, probeUrl, issuerHint, corporateAnchor, corporateLink, makeDelegation,
  delegationBinding, delegationDocument, readDelegation, lookupDelegations, validateDelegationBindings } from './origin-discovery.mjs';
import { geminiAuthorityConfiguration, assertGeminiQuotaAuthority, withGeminiQuotaAuthority } from './ai/gemini-authority.mjs';

const hash = input => createHash('sha256').update(input).digest('hex');
const payload = input => ({ json: JSON.stringify(input) });
const value = snap => snap.exists ? JSON.parse(snap.data().json) : null;
const fail = code => { throw new DomainError(code); };
const LEASE_MS = 600_000;
const GEMINI_UNAVAILABLE_MS = 120_000;
const GEMINI_MAX_MODEL_WINDOWS = 6;
// Bump when source preflight/parser changes should release saved source holds.
const SOURCE_HOLD_VERSION = 4;
const SOURCE_HOLD_MS = 24 * 3_600_000;
const SOURCE_HOLD_REASONS = new Set(['NOTICE_CATEGORY_REVIEW_REQUIRED', 'NOTICE_CATEGORY_CONFLICT',
  'NOTICE_PRECISION_UNSUPPORTED', 'NOTICE_NOT_OPEN', 'NOTICE_APPLICATION_METHOD_REVIEW_REQUIRED',
  'NOTICE_PROGRAMME_SCOPE_REVIEW_REQUIRED', 'UNDATED_NOTICE_FRESHNESS_REQUIRED',
  'UNDATED_NOTICE_ORIGIN_REQUIRED', 'UNDATED_NOTICE_ORIGIN_CONFLICT', 'UNDATED_ORIGIN_IMPORT_REQUIRED',
  'UNDATED_HISTORY_CAPACITY', 'UNDATED_HISTORY_CONFLICT']);
const ordinaryAttempts = job => job.attempts - (job.modelWindowRetries ?? 0);
const UA = 'SkilvedSourceReview/1.0';
const isRetryable = error => error.retryable === true || ['FETCH_TIMEOUT', 'UNSUPPORTED_RESPONSE', 'BODY_TOO_LARGE', 'SOURCE_BUSY',
  'EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT', 'ABORT_ERR'].includes(error.code);

/** Trusted backend only. CLI verifies the machine principal; no public HTTP worker endpoint. */
export class RecentJobsWorker {
  constructor(db, principal, { now = () => new Date().toISOString(), fetcher = retrieve, extractor = extractWithProvider,
    extractionMode = 'single', metadataExtractor = extractMetadata, requirementsExtractor = extractRequirements,
    validator = validateExtraction, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), thinking = 'low', validationThinking = 'medium',
    provider = 'groq', model, env = process.env, programmeExtraction = false,
    programmeExtractor = extractProgramme, programmeValidator = validateProgramme } = {}) {
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
    this.quotaScope=provider==='gemini'?geminiQuotaScope(env):null;this.quotaLimits=provider==='gemini'?geminiQuotaLimits(env):{};
    this.quotaAuthority = provider === 'gemini' ? geminiAuthorityConfiguration(db, { ...process.env, ...env }) : null;
    if (this.quotaAuthority && this.quotaAuthority.scopeHash !== this.quotaScope) fail('GEMINI_QUOTA_AUTHORITY_REQUIRED');
    this.env = {...env}; this.fallback = (env.SKILVED_AI_FALLBACK ?? 'true') === 'true';
    if (typeof programmeExtraction !== 'boolean' || programmeExtraction && extractionMode !== 'single') fail('AI_CONFIGURATION_REQUIRED');
    this.programmeExtraction=programmeExtraction;this.programmeExtractor=programmeExtractor;this.programmeValidator=programmeValidator;
    this.catalogue = new Catalogue(db, null, now);
  }
  ref(collection, id) { IdSchema.parse(id); return this.db.collection(`m0_${collection}`).doc(id); }
  async transaction(sourceId, action, work, publishing = false) {
    IdSchema.parse(sourceId); InstantSchema.parse(this.now());
    return this.db.runTransaction(async tx => {
      if (this.provider === 'gemini') await assertGeminiQuotaAuthority(tx, this.db, this.quotaAuthority, this.now());
      const grant = (await tx.get(this.ref('workers', this.actor))).data();
      const raw = value(await tx.get(this.ref('sources', sourceId)));
      if (!grant?.active || grant.principal !== this.principal || !grant.sources?.includes(sourceId) ||
          !grant.roles?.includes('ingest') || (publishing && !grant.roles.includes('publish'))) fail('WORKER_FORBIDDEN');
      if (grant.expiresAt !== undefined && (!InstantSchema.safeParse(grant.expiresAt).success || Date.parse(grant.expiresAt) <= Date.parse(this.now())))
        fail('WORKER_FORBIDDEN');
      if (!raw) fail('SOURCE_PAUSED');
      const source = Source.parse(raw);
      if (this.provider === 'gemini' && source.automation?.mode !== 'shadow') fail('GEMINI_SHADOW_ONLY');
      if (this.extractionMode === 'split' && source.automation?.mode !== 'shadow') fail('SPLIT_EXTRACTION_SHADOW_ONLY');
      if (this.programmeExtraction && source.automation?.mode !== 'shadow') fail('PROGRAMME_EXTRACTION_SHADOW_ONLY');
      if (source.automation?.originalVerification && this.programmeExtraction) fail('ORIGINAL_VERIFICATION_SINGLE_NOTICE_ONLY');
      if (source.paused || source.permission.method !== 'recentjobs_html' || !source.automation || source.automation.mode === 'disabled') fail('SOURCE_PAUSED');
      if (!source.categories.includes('apprenticeship') || !source.urls.includes(RECENTJOBS_INDEX)) fail('SOURCE_POLICY_REQUIRED');
      const result = await work(tx, source);
      tx.create(this.ref('audit', randomUUID()), payload({ action, actor: this.actor, actorType: 'worker', subject: sourceId, at: this.now() }));
      return result;
    });
  }
  async assertClaim(tx, source, claim, { checkIssuerTrust = true } = {}) {
    const job = value(await tx.get(this.ref('worker_jobs', claim.id)));
    const lease = value(await tx.get(this.ref('worker_leases', source.id)));
    if (source.revision !== claim.sourceRevision) fail('SOURCE_CHANGED');
    if (!job || job.lease !== claim.lease || lease?.lease !== claim.lease || job.leaseUntil <= this.now()) fail('STALE_LEASE');
    if (checkIssuerTrust && claim.originAnchor) await validateIssuerBindings(tx, this.db, [claim.originAnchor], 'apprenticeship', this.now());
    if (checkIssuerTrust && source.automation.issuerRegistry && claim.issuerTrust) {
      if (JSON.stringify(job.issuerTrust) !== JSON.stringify(claim.issuerTrust)) fail('ISSUER_TRUST_CHANGED');
      const issuers = await validateIssuerBindings(tx, this.db, claim.issuerTrust.bindings, 'apprenticeship', this.now());
      if (claim.issuerTrust.delegations?.length) {
        if (!source.automation.originDiscovery) fail('SOURCE_POLICY_REQUIRED');
        issuers.push(...await validateDelegationBindings(tx,this.db,claim.issuerTrust.delegations,this.now()));
      }
      source.issuerTrust = { issuers };
    }
    return job;
  }
  async schedule(sourceId) {
    return this.transaction(sourceId, 'worker.schedule', async (tx, source) => {
      const bucket = Math.floor(Date.parse(this.now()) / (source.cadenceHours * 3_600_000));
      const id = hash(`${sourceId}:discover:${bucket}`), ref = this.ref('worker_jobs', id);
      const previous = value(await tx.get(ref));
      const discoveryRef = this.ref('worker_discovery', sourceId);
      const discovery = source.automation.discovery ? value(await tx.get(discoveryRef)) : null;
      const active = discovery?.state === 'pending'
        ? value(await tx.get(this.ref('worker_jobs', discovery.currentJobId))) : null;
      if (discovery?.state === 'pending' && (!active || active.discoveryCycle !== discovery.cycleId ||
          active.sourceId !== sourceId || !['pending', 'running'].includes(active.state))) fail('DISCOVERY_STATE_INVALID');
      const watches = await tx.get(this.db.collection('m0_worker_watches').where('sourceId', '==', sourceId).limit(51));
      if (watches.size > 50) fail('SOURCE_WATCH_CAPACITY');
      const refreshes = watches.docs.map(d => d.data()).filter(w => w.stopAt > this.now()).map(w => ({
        id: hash(`${sourceId}:${w.url}:${bucket}`), sourceId, kind: 'detail', url: w.url, bucket,
        state: 'pending', attempts: 0, lease: null, nextAt: this.now(), priorityAt: w.nextCheckAt,
      }));
      const existing = await Promise.all(refreshes.map(j => tx.get(this.ref('worker_jobs', j.id))));
      if (!previous && !active) {
        tx.create(ref, payload({ id, sourceId, kind: 'discover', url: RECENTJOBS_INDEX, bucket, state: 'pending', attempts: 0, nextAt: this.now(), lease: null,
          ...(source.automation.discovery ? { discoveryCycle: id, discoveryOffset: 0 } : {}) }));
        tx.set(this.ref('worker_queue', id), { sourceId });
        if (source.automation.discovery) tx.set(discoveryRef, payload({ sourceId, cycleId: id, bucket,
          currentJobId: id, state: 'pending', listed: 0, queued: 0, alreadyQueued: 0, updatedAt: this.now() }));
      }
      refreshes.forEach((job, i) => { if (!existing[i].exists) {
        tx.create(this.ref('worker_jobs', job.id), payload(job)); tx.set(this.ref('worker_queue', job.id), { sourceId });
      } });
      for (const watch of watches.docs) if (watch.data().stopAt <= this.now()) tx.delete(watch.ref);
      return active?.id ?? id;
    });
  }
  async claim(sourceId, id) {
    return this.transaction(sourceId, 'worker.claim', async (tx, source) => {
      const ref = this.ref('worker_jobs', id), job = value(await tx.get(ref));
      const leaseRef = this.ref('worker_leases', sourceId), previous = value(await tx.get(leaseRef));
      if (!job || job.sourceId !== sourceId || !['pending', 'running'].includes(job.state) || job.nextAt > this.now() || job.leaseUntil > this.now()) fail('JOB_UNAVAILABLE');
      if (previous?.until > this.now()) fail('SOURCE_BUSY');
      if (!Number.isInteger(job.modelWindowRetries ?? 0) || (job.modelWindowRetries ?? 0) < 0 ||
          (job.modelWindowRetries ?? 0) >= GEMINI_MAX_MODEL_WINDOWS || ordinaryAttempts(job) < 0) fail('JOB_UNAVAILABLE');
      if (ordinaryAttempts(job) >= 3) {
        const discovery = job.discoveryCycle ? value(await tx.get(this.ref('worker_discovery', sourceId))) : null;
        tx.set(ref, payload({ ...job, state: 'exception', error: 'ATTEMPTS_EXHAUSTED', lease: null }));
        if (discovery && discovery.cycleId === job.discoveryCycle && discovery.currentJobId === job.id)
          tx.set(this.ref('worker_discovery', sourceId), payload({ ...discovery, state: 'exception', reason: 'ATTEMPTS_EXHAUSTED', updatedAt: this.now() }));
        tx.delete(this.ref('worker_queue', id));
        tx.set(this.ref('worker_exceptions', id), payload({ jobId: id, sourceId, reason: 'ATTEMPTS_EXHAUSTED', at: this.now() }));
        return null;
      }
      const lease = randomUUID(), until = new Date(Date.parse(this.now()) + LEASE_MS).toISOString();
      const claimed = { ...job, state: 'running', attempts: job.attempts + 1, lease, leaseUntil: until, sourceRevision: source.revision,
        ...(source.automation.issuerRegistry || job.issuerTrust ? { issuerTrust: null } : {}),
        ...(source.automation.originDiscovery || job.originDiscoveryId ? { originDiscoveryId: null } : {}) };
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
    if (this.provider === 'gemini') {
      try { return await work({...options,
        runAttempt:(attempt, send) => this.modelCall(claim, stage, send, attempt)}); }
      catch (error) {
        if (this.fallback && error.attempts?.length && geminiAvailabilityFailure(error)) {
          error.modelWindowFailed = true;
          // A complete pass through the suffix must reconsider the full chain
          // after its earliest hold releases, including models skipped by a cursor.
          if (error.attempts?.at(-1)?.model === GEMINI_MODEL_CHAIN.at(-1)) {
            await this.transaction(claim.sourceId, 'worker.model.window_reset', async (tx, source) => {
              const job = await this.assertClaim(tx, source, claim);
              if (job.modelWindow?.stage === stage)
                tx.set(this.ref('worker_jobs', claim.id), payload({...job, modelWindow:null}));
            });
          }
        }
        throw error;
      }
    }
    return this.modelCall(claim, stage, () => work(options));
  }
  sameModelWindow(job, stage, attempt) {
    const window = job.modelWindow;
    return this.fallback && attempt.fallback === true && /^[a-f0-9]{64}$/.test(attempt.requestContextHash ?? '') &&
      window?.stage === stage && window.requestContextHash === attempt.requestContextHash &&
      window.snapshotId === job.snapshotId && window.sourceRevision === job.sourceRevision &&
      window.scopeHash === this.quotaScope && window.configuredModel === this.model &&
      window.quotaDate === geminiQuotaDay(this.now()) && GEMINI_MODEL_CHAIN.includes(window.nextModel);
  }
  modelAvailabilityId(model) { return hash(`${this.quotaScope}:${model}`); }
  async holdModelForDay(sourceId,model) {
    if(this.provider!=='gemini'||!GEMINI_MODEL_CHAIN.includes(model))fail('AI_CONFIGURATION_REQUIRED');
    return this.transaction(sourceId,'worker.model.daily_hold',async tx=>{
      const ref=this.ref('model_availability',this.modelAvailabilityId(model)),previous=value(await tx.get(ref));
      const until=new Date(Math.max(Date.parse(nextGeminiQuotaReset(this.now())),Date.parse(previous?.until??0)||0)).toISOString();
      tx.set(ref,payload({scopeHash:this.quotaScope,provider:'gemini',model,until,reason:'operator_daily_exhaustion'}));return until;
    });
  }
  async modelCall(claim, stage, work, attempt = {}) {
    const callId=randomUUID(),at=this.now(),quotaDate=this.provider==='gemini'?geminiQuotaDay(at):null;
    const usageId=this.provider==='gemini'?hash(`${this.quotaScope}:${attempt.model}:${quotaDate}`):null;
    await this.transaction(claim.sourceId, 'worker.model.reserve', async (tx, source) => {
      const job = await this.assertClaim(tx, source, claim);
      const id = hash(`${source.id}:${dayInSA(this.now())}`), ref = this.ref('model_budgets', id);
      const budget = value(await tx.get(ref)) ?? { sourceId: source.id, date: dayInSA(this.now()), calls: 0 };
      let usage=null,blocked=null;
      if(this.provider==='gemini'){
        const availability=value(await tx.get(this.ref('model_availability',this.modelAvailabilityId(attempt.model))));
        usage=value(await tx.get(this.ref('model_usage',usageId)))??{scopeHash:this.quotaScope,provider:'gemini',model:attempt.model,date:quotaDate,requests:0,knownInputTokens:0,knownTotalTokens:0,unknownUsageCalls:0,minute:[]};
        // A provider-day reset does not reset a rolling minute window. Carry
        // recent reservations from the preceding day, deduplicated by call ID.
        const minuteDate=geminiQuotaDay(new Date(Date.parse(at)-60000).toISOString());
        if(minuteDate!==quotaDate){
          const previous=value(await tx.get(this.ref('model_usage',hash(`${this.quotaScope}:${attempt.model}:${minuteDate}`))));
          usage={...usage,minute:mergeGeminiMinuteUsage(previous??{},usage,at)};
        }
        blocked=availability?.until>this.now()?{until:availability.until,kind:'daily'}:geminiUsageDelay(usage,this.quotaLimits[attempt.model],this.now());
      }
      const nextCallAt = this.provider === 'gemini' ? budget.nextCallByModel?.[attempt.model] : budget.nextCallAt;
      const delayMs = Math.max(0, Date.parse(blocked?.until ?? this.now()) - Date.parse(this.now()),
        Date.parse(nextCallAt ?? this.now()) - Date.parse(this.now()));
      if (this.provider === 'gemini' && this.sameModelWindow(job, stage, attempt) &&
          GEMINI_MODEL_CHAIN.indexOf(attempt.model) < GEMINI_MODEL_CHAIN.indexOf(job.modelWindow.nextModel)) {
        const error = new DomainError('AI_MODEL_WINDOW_SKIPPED'); error.retryAfterMs = delayMs; throw error;
      }
      if (blocked || nextCallAt > this.now()) {
        const error = new DomainError('AI_RATE_LIMITED'); error.retryable = true;
        error.retryAfterMs = delayMs;
        if(blocked)error.rateLimitKind=blocked.kind;throw error;
      }
      if (budget.calls >= source.automation.maxModelCallsPerDay) fail('MODEL_BUDGET_EXHAUSTED');
      if(usage)tx.set(this.ref('model_usage',usageId),payload({...usage,requests:usage.requests+1,minute:[...recentGeminiUsage(usage,this.now()),{id:callId,at,inputTokens:null}]}));
      tx.set(ref, payload({ ...budget, calls: budget.calls + 1 }));
      tx.set(this.ref('worker_jobs', claim.id), payload({ ...job, stage }));
    });
    let result, error;
    try { result = await (this.provider === 'gemini' ? withGeminiQuotaAuthority(this.quotaAuthority, work) : work()); }
    catch (caught) { error = caught; }
    const daily=this.provider==='gemini'&&error?.code==='AI_RATE_LIMITED'&&error.rateLimitKind==='daily';
    const unavailable = this.provider === 'gemini' && error?.code !== 'AI_RATE_LIMITED' && geminiAvailabilityFailure(error);
    if (unavailable) error.retryAfterMs = Math.max(GEMINI_UNAVAILABLE_MS,error.retryAfterMs ?? 0);
    if(daily)error.retryAfterMs=Math.max(Date.parse(nextGeminiQuotaReset(this.now()))-Date.parse(this.now()),error.retryAfterMs??0);
    // Source spending and shared quota reservations are not refunded on failure.
    await this.transaction(claim.sourceId, 'worker.model.result', async (tx, source) => {
      // Revoked issuer trust stops further use of an answer, not accounting for
      // an already dispatched call. Machine/source/lease fences still apply.
      const job = await this.assertClaim(tx, source, claim, { checkIssuerTrust: false });
      const budgetRef = this.ref('model_budgets', hash(`${source.id}:${dayInSA(this.now())}`));
      const budget = error?.code === 'AI_RATE_LIMITED' || unavailable ? value(await tx.get(budgetRef)) : null;
      const usage=this.provider==='gemini'?value(await tx.get(this.ref('model_usage',usageId))):null;
      const availability=daily?value(await tx.get(this.ref('model_availability',this.modelAvailabilityId(attempt.model)))):null;
      const receivedUsage=result?.provenance?.usage??error?.usage??null;
      if(usage)tx.set(this.ref('model_usage',usageId),payload({...usage,
        knownInputTokens:usage.knownInputTokens+(receivedUsage?.inputTokens??0),knownTotalTokens:usage.knownTotalTokens+(receivedUsage?.totalTokens??0),
        unknownUsageCalls:usage.unknownUsageCalls+(receivedUsage===null?1:0),
        minute:recentGeminiUsage(usage,this.now()).map(row=>row.id===callId?{...row,inputTokens:receivedUsage?.inputTokens??null}:row)}));
      if(daily)tx.set(this.ref('model_availability',this.modelAvailabilityId(attempt.model)),payload({scopeHash:this.quotaScope,provider:'gemini',model:attempt.model,
        until:new Date(Math.max(Date.parse(availability?.until??0)||0,Date.parse(this.now())+error.retryAfterMs)).toISOString(),reason:'provider_daily_exhaustion'}));
      if (budget) {
        const until = new Date(Date.parse(this.now()) + Math.max(60000, error.retryAfterMs ?? 0)).toISOString();
        tx.set(budgetRef, payload({...budget, ...(this.provider === 'gemini'
          ? {nextCallByModel:{...budget.nextCallByModel, [attempt.model]:until}} : {nextCallAt:until})}));
      }
      if (this.provider === 'gemini' && this.fallback && attempt.fallback === true && /^[a-f0-9]{64}$/.test(attempt.requestContextHash ?? '') &&
          GEMINI_MODEL_CHAIN.includes(attempt.model)) {
        const modelWindow = geminiAvailabilityFailure(error) ? {stage, requestContextHash:attempt.requestContextHash,
          snapshotId:job.snapshotId ?? null, sourceRevision:job.sourceRevision, scopeHash:this.quotaScope,
          configuredModel:this.model, quotaDate,
          nextModel:GEMINI_MODEL_CHAIN[GEMINI_MODEL_CHAIN.indexOf(attempt.model) + 1] ?? this.model} : null;
        tx.set(this.ref('worker_jobs', claim.id), payload({...job, modelWindow}));
      }
      tx.create(this.ref('model_calls', callId), payload({ jobId: claim.id, sourceId: source.id, stage,
        state: error ? 'failed' : 'received', usage: receivedUsage,at:this.now(),error:error?.code??null,
        provider:this.provider,model:attempt.model??this.model,rateLimitKind:error?.rateLimitKind??null,
        requestHash:attempt.requestHash??result?.provenance?.requestHash??null,
        transportCode:this.provider==='gemini'&&['AI_TIMEOUT','AI_TRANSPORT_FAILED'].includes(error?.code)?transportCodeOf(error):null,
        providerStatus:Number.isInteger(error?.providerStatus)?error.providerStatus:null }));
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
      const job = await this.assertClaim(tx, source, claim, { checkIssuerTrust: false });
      const ref = this.ref('worker_leases', source.id), lease = value(await tx.get(ref));
      const windowFailure = this.provider === 'gemini' && this.fallback && error.modelWindowFailed === true && geminiAvailabilityFailure(error);
      const windowRetry = windowFailure && (job.modelWindowRetries ?? 0) < GEMINI_MAX_MODEL_WINDOWS - 1;
      const retry = windowFailure ? windowRetry : isRetryable(error) && ordinaryAttempts(job) < 3;
      const candidateCode = error.code ?? (/^RECENTJOBS_[A-Z_]+$/.test(error.message ?? '') ? error.message : null);
      const code = /^[A-Z_]+$/.test(candidateCode ?? '') ? candidateCode : 'WORKER_STAGE_FAILED';
      const locationDiagnostic=privateLocationDiagnostic(error);
      const recordId = hash(`${source.id}:${hash(job.url)}`);
      const old = job.kind === 'detail' ? value(await tx.get(this.ref('drafts', recordId))) : null;
      const catalogueState = value(await tx.get(this.ref('state', 'current'))) ?? { revision: 1 };
      const discovery = job.discoveryCycle ? value(await tx.get(this.ref('worker_discovery', source.id))) : null;
      if (old?.lifecycle === 'published' && old.publication.approved) {
        old.revision++; old.updatedAt = this.now(); old.lifecycle = 'review'; old.publication.approved = false;
        old.publication.disposition = 'review_required'; old.publication.reviewedBy = null;
        this.catalogue.writePublication(tx, old, { kind: 'status', status: { schemaVersion: 1, id: old.id,
          revision: old.revision, status: 'under_review', application: 'unavailable' } }, catalogueState.revision + 1, 'worker.recheck_failed', this.actor);
      }
      tx.set(this.ref('worker_jobs', claim.id), payload({ ...job, state: retry ? 'pending' : 'exception', error: code,
        ...(windowRetry ? {modelWindowRetries:(job.modelWindowRetries ?? 0) + 1} : {}),
        nextAt: new Date(Date.parse(this.now()) + Math.max(60_000 * ordinaryAttempts(job), error.retryAfterMs ?? 0)).toISOString(), lease: null, leaseUntil: null }));
      tx.set(ref, payload({ ...lease, lease: null, until: null }));
      if (!retry) {
        if (discovery && discovery.cycleId === job.discoveryCycle && discovery.currentJobId === job.id)
          tx.set(this.ref('worker_discovery', source.id), payload({ ...discovery, state: 'exception', reason: code, updatedAt: this.now() }));
        tx.delete(this.ref('worker_queue', claim.id));
        tx.set(this.ref('worker_exceptions', claim.id), payload({ jobId: claim.id, sourceId: source.id,
          reason: code, stage: job.stage ?? job.kind, url: job.url, snapshotId: job.snapshotId ?? null,
          primarySnapshotId: job.primarySnapshotId ?? null, recordId: job.recordId ?? null,
          ...(job.originalResolutionId ? { originalResolutionId: job.originalResolutionId } : {}),
          ...(job.issuerTrust ? { issuerResolutionId: job.issuerTrust.receiptId } : {}),
          ...(job.originDiscoveryId ? { originDiscoveryId: job.originDiscoveryId } : {}),
          ...(job.discoverySnapshotId ? { discoverySnapshotId: job.discoverySnapshotId } : {}),
          programmePlanId:job.programmePlanId ?? null,
          ...(locationDiagnostic?{locationDiagnostic}:{}),
          attempts: job.attempts, modelWindowRetries:job.modelWindowRetries ?? 0, at: this.now() }));
        const sourceHold = job.kind === 'detail' && !old?.publication.previouslyPublic && !old?.publication.approved &&
          (job.stage === 'preflight' && SOURCE_HOLD_REASONS.has(code) || !job.stage && code === 'RECENTJOBS_LAYOUT_CHANGED');
        if (sourceHold) tx.set(this.ref('worker_holds', hash(`${source.id}:${job.url}`)), payload({
          sourceId: source.id, sourceRevision: source.revision, url: job.url, version: SOURCE_HOLD_VERSION,
          programmeExtraction: this.programmeExtraction, reason: code, jobId: job.id,
          snapshotId: job.snapshotId ?? null, contentHash: job.contentHash ?? null, at: this.now(),
          recheckAt: new Date(Date.parse(this.now()) + SOURCE_HOLD_MS).toISOString(),
        }));
      }
      return { state: retry ? 'pending' : 'exception', reason: code };
    });
  }
  async discover(claim) {
    if (claim.discoveryCycle) return this.discoverPublisher(claim);
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
  async discoveryPage(claim) {
    const saved = await this.transaction(claim.sourceId, 'worker.discovery.read', async (tx, source) => {
      const job = await this.assertClaim(tx, source, claim);
      if (!source.automation.discovery) fail('DISCOVERY_STATE_INVALID');
      if (!job.discoverySnapshotId) return null;
      const snapshot = value(await tx.get(this.ref('worker_discovery_pages', job.discoverySnapshotId)));
      if (!snapshot || snapshot.sourceId !== source.id || snapshot.cycleId !== claim.discoveryCycle ||
          snapshot.url !== claim.url || snapshot.hash !== hash(JSON.stringify(snapshot.list))) fail('DISCOVERY_STATE_INVALID');
      return snapshot;
    });
    if (saved) return saved;
    assertSourceTarget(claim.url, 'index');
    // Apply the page bound before acquisition, including a reduced source policy.
    const page = Number(new URL(claim.url).pathname.match(/\/page\/(\d+)\/$/)?.[1] ?? 1);
    if (page > claim.source.automation.discovery.maxPages || claim.discoveryOffset !== 0) fail('DISCOVERY_STATE_INVALID');
    await this.robots(claim, claim.url);
    const response = await this.request(claim, claim.url, 'html');
    const list = parseRecentJobsList({ html: response.text, url: response.url });
    const digest = hash(JSON.stringify(list));
    const id = hash(`${claim.sourceId}:${claim.discoveryCycle}:${claim.url}:${digest}`);
    return this.transaction(claim.sourceId, 'worker.discovery.capture', async (tx, source) => {
      const job = await this.assertClaim(tx, source, claim);
      const ref = this.ref('worker_discovery_pages', id), previous = value(await tx.get(ref));
      const snapshot = previous ?? { id, sourceId: source.id, sourceRevision: source.revision,
        cycleId: claim.discoveryCycle, url: claim.url, hash: digest, list, retrievedAt: this.now() };
      if (!previous) tx.create(ref, payload(snapshot));
      tx.set(this.ref('worker_jobs', job.id), payload({ ...job, discoverySnapshotId: id }));
      return snapshot;
    });
  }
  async discoverPublisher(claim) {
    const snapshot = await this.discoveryPage(claim);
    const chunk = discoveryChunk(claim.source, claim, snapshot.list);
    return this.finish(claim, { discovered: chunk.articles.length, discoverySnapshotId: snapshot.id,
      continuationId: chunk.next?.id ?? null, discoveryStop: chunk.stop }, async (tx, source) => {
      const cursorRef = this.ref('worker_discovery', source.id), cursor = value(await tx.get(cursorRef));
      if (cursor?.cycleId !== claim.discoveryCycle || cursor.currentJobId !== claim.id || cursor.state !== 'pending') fail('DISCOVERY_STATE_INVALID');
      const jobs = chunk.articles.map(article => {
        assertSourceTarget(article.sourceUrl);
        const id = hash(`${source.id}:${article.sourceUrl}:${claim.bucket}`);
        return { id, sourceId: source.id, kind: 'detail', url: article.sourceUrl, bucket: claim.bucket,
          state: 'pending', attempts: 0, lease: null, nextAt: this.now() };
      });
      const continuation = chunk.next ? { ...chunk.next, sourceId: source.id, kind: 'discover', bucket: claim.bucket,
        state: 'pending', attempts: 0, lease: null, nextAt: this.now(),
        ...(chunk.next.url === claim.url ? { discoverySnapshotId: snapshot.id } : {}) } : null;
      const existing = await Promise.all(jobs.map(j => tx.get(this.ref('worker_jobs', j.id))));
      const nextExists = continuation ? await tx.get(this.ref('worker_jobs', continuation.id)) : null;
      let queued = 0;
      jobs.forEach((job, index) => { if (!existing[index].exists) {
        tx.create(this.ref('worker_jobs', job.id), payload(job)); tx.set(this.ref('worker_queue', job.id), { sourceId: source.id }); queued++;
      } });
      if (continuation && !nextExists.exists) {
        tx.create(this.ref('worker_jobs', continuation.id), payload(continuation));
        tx.set(this.ref('worker_queue', continuation.id), { sourceId: source.id });
      }
      tx.set(cursorRef, payload({ ...cursor, currentJobId: continuation?.id ?? claim.id,
        state: continuation ? 'pending' : 'complete', stop: chunk.stop, updatedAt: this.now(),
        listed: cursor.listed + jobs.length, queued: cursor.queued + queued,
        alreadyQueued: cursor.alreadyQueued + jobs.length - queued }));
    });
  }
  async capture(claim, candidate, retrievedAt = this.now()) {
    const recordId = hash(`${claim.sourceId}:${candidate.sourceRecordId}`);
    const snapshotId = hash(`${claim.sourceId}:${candidate.sourceUrl}:${candidate.contentHash}`);
    const text = `${candidate.title}\n${candidate.sourceText}`;
    return this.transaction(claim.sourceId, 'worker.snapshot', async (tx, source) => {
      const job = await this.assertClaim(tx, source, claim);
      const old = value(await tx.get(this.ref('drafts', recordId)));
      const snapRef = this.ref('snapshots', snapshotId), existing = value(await tx.get(snapRef));
      const state = value(await tx.get(this.ref('state', 'current'))) ?? { revision: 1 };
      // An unchanged retry retains the first acquisition for this job. A shared
      // content snapshot's older timestamp is not a new retrieval, either.
      const sourceRetrievedAt = job.contentHash === candidate.contentHash && job.sourceRetrievedAt != null
        ? job.sourceRetrievedAt : retrievedAt;
      if (['withdrawn', 'closed', 'archived'].includes(old?.lifecycle) || old?.publication.disposition === 'withheld') fail('RESTORE_REQUIRES_REVIEW');
      if (!existing) tx.create(snapRef, payload({ id: snapshotId, sourceId: source.id, sourceRevision: source.revision,
        url: candidate.sourceUrl, hash: hash(text), contentHash: candidate.contentHash, text, retrievedAt: this.now() }));
      tx.set(this.ref('worker_jobs', claim.id), payload({ ...job, snapshotId, recordId, contentHash: candidate.contentHash, sourceRetrievedAt, stage: 'preflight' }));
      if (old?.publication.approved && old.private.queueId !== snapshotId) {
        old.revision++; old.lifecycle = 'review'; old.publication.approved = false;
        old.publication.disposition = 'review_required'; old.publication.reviewedBy = null; old.updatedAt = this.now();
        this.catalogue.writePublication(tx, old, { kind: 'status', status: { schemaVersion: 1, id: old.id,
          revision: old.revision, status: 'under_review', application: 'unavailable' } }, state.revision + 1, 'worker.source_changed', this.actor);
      }
      return { recordId, snapshotId, sourceRetrievedAt, expectedRevision: old?.revision ?? null, createdAt: old?.createdAt ?? this.now(),
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
  async originalNotice(claim, candidate, captured) {
    await this.transaction(claim.sourceId, 'worker.original.begin', async (tx, source) => {
      const job = await this.assertClaim(tx, source, claim);
      tx.set(this.ref('worker_jobs', job.id), payload({ ...job, stage: 'original_resolution' }));
    });
    const target = originalNoticeTarget(claim.source, candidate);
    let observation = null, resolution = target.outcome ? target : null;
    if (!resolution) {
      try {
        if (claim.originObservation?.url === target.url) observation = claim.originObservation;
        else { await this.robots(claim, target.url); observation = await this.request(claim, target.url, 'html'); }
      } catch (error) {
        resolution = originalRetrievalFailure(error);
        if (!resolution) throw error;
      }
      if (observation) resolution = resolveOriginalNotice({ source: claim.source, candidate, observation, now: this.now() });
    }
    const primaryHash = observation ? hash(observation.text) : null;
    const primarySnapshotId = observation ? hash(`${claim.sourceId}:${target.url}:${primaryHash}`) : null;
    const id = hash(`${claim.id}:original:${claim.attempts}`);
    const { primary, ...receipt } = resolution;
    await this.transaction(claim.sourceId, 'worker.original.resolve', async (tx, source) => {
      const job = await this.assertClaim(tx, source, claim);
      const snapshotRef = primarySnapshotId ? this.ref('snapshots', primarySnapshotId) : null;
      const previous = snapshotRef ? await tx.get(snapshotRef) : null;
      if (snapshotRef && !previous.exists) tx.create(snapshotRef, payload({ id: primarySnapshotId,
        sourceId: source.id, sourceRevision: source.revision, url: target.url, hash: primaryHash,
        text: observation.text, retrievedAt: this.now() }));
      tx.create(this.ref('worker_original_resolutions', id), payload({ id, sourceId: source.id, sourceRevision: source.revision,
        jobId: claim.id, attempt: claim.attempts, sourceSnapshotId: captured.snapshotId,
        ...(claim.issuerTrust ? { issuerResolutionId: claim.issuerTrust.receiptId } : {}),
        ...(claim.originDiscoveryId ? { originDiscoveryId: claim.originDiscoveryId } : {}),
        primarySnapshotId, resolution: receipt, at: this.now() }));
      tx.set(this.ref('worker_jobs', job.id), payload({ ...job, originalResolutionId: id, primarySnapshotId }));
    });
    return { id, resolution, primaryHash, primarySnapshotId };
  }
  async bindIssuerTrust(claim, candidate, captured) {
    if (!claim.source.automation.issuerRegistry) return;
    const receiptId = hash(`${claim.id}:issuer:${claim.attempts}`);
    let selected = await this.transaction(claim.sourceId, 'worker.issuer.lookup', async (tx, source) => {
      await this.assertClaim(tx, source, claim);
      const selected = await lookupIssuerRelationships(tx, this.db,
        candidate.applicationCandidates.length === 1 ? candidate.applicationCandidates[0] : null, 'apprenticeship', this.now());
      if (!selected.issuers.length && source.automation.originDiscovery && candidate.applicationCandidates.length === 1) {
        const found = await lookupDelegations(tx,this.db,candidate.applicationCandidates[0],this.now());
        if (found.length) return { ...selected, outcome:'qualified', issuers:found.map(r=>r.route), delegations:found.map(delegationBinding) };
      }
      return selected;
    });
    let discovery = null;
    if (!selected.issuers.length && claim.source.automation.originDiscovery) {
      let eligible = false;
      try { preflightCandidate(claim.source,candidate,this.now(),captured.sourceRetrievedAt); }
      catch (error) { eligible = error.code === 'ISSUER_RELATIONSHIP_UNQUALIFIED'; }
      if (eligible) {
        discovery = await this.discoverOrigin(claim,candidate);
        if (discovery.delegation) selected = { ...selected, outcome:'qualified', issuers:[discovery.delegation.route], delegations:[delegationBinding(discovery.delegation)] };
      }
    }
    const result = await this.transaction(claim.sourceId, 'worker.issuer.resolve', async (tx, source) => {
      const job = await this.assertClaim(tx, source, claim);
      const currentIssuers = await validateIssuerBindings(tx,this.db,selected.bindings,'apprenticeship',this.now());
      if (selected.delegations?.length) currentIssuers.push(...await validateDelegationBindings(tx,this.db,selected.delegations,this.now()));
      const { issuers, ...resolution } = selected;
      const trust = { receiptId, bindings: selected.bindings, ...(selected.delegations ? { delegations:selected.delegations } : {}) };
      const originId = discovery?.id ?? (selected.delegations?.length ? hash(`${claim.id}:origin:${claim.attempts}`) : null);
      if (originId && !discovery) tx.create(this.ref('worker_origin_discoveries',originId),payload({ id:originId, sourceId:source.id,
        sourceRevision:source.revision, jobId:claim.id, at:this.now(), resolution:discoveryOutcome('cached','CURRENT_CORPORATE_DELEGATION'), delegations:selected.delegations }));
      tx.create(this.ref('worker_issuer_resolutions', receiptId), payload({ id: receiptId, version: ISSUER_REGISTRY_VERSION,
        sourceId: source.id, sourceRevision: source.revision, jobId: claim.id, attempt: claim.attempts,
        sourceSnapshotId: captured.snapshotId, resolution, ...(originId?{originDiscoveryId:originId}:{}), at: this.now() }));
      tx.set(this.ref('worker_jobs', job.id), payload({ ...job, issuerTrust: trust, ...(originId?{originDiscoveryId:originId}:{}) }));
      return { issuers:currentIssuers, trust, originId };
    });
    claim.issuerTrust = result.trust;
    claim.source.issuerTrust = { issuers: result.issuers };
    claim.originDiscoveryId = result.originId;
    if (discovery?.resolution.outcome === 'unavailable') fail('ORIGIN_DISCOVERY_UNAVAILABLE');
  }
  async discoverOrigin(claim, candidate) {
    const id = hash(`${claim.id}:origin:${claim.attempts}`), route = candidate.applicationCandidates[0];
    let resolution = discoveryOutcome('unsupported','ACQUISITION_DISABLED'), anchor = null, primary = null, corporate = null, link = null;
    if (claim.source.automation.employerCrawl && route?.method === 'portal' && probeUrl(route.destination)) {
      try {
        await this.robots(claim,route.destination); primary = await this.request(claim,route.destination,'html');
        const hint = issuerHint(primary.text);
        if (!hint) resolution = discoveryOutcome('unsupported','ISSUER_HINT_UNSUPPORTED');
        else {
          anchor = await this.transaction(claim.sourceId,'worker.origin.anchor',async(tx,source)=>{
            await this.assertClaim(tx,source,claim); return corporateAnchor(tx,this.db,hint,this.now());
          });
          if (!anchor) resolution = discoveryOutcome('unsupported','CORPORATE_AUTHORITY_UNQUALIFIED');
          else {
            claim.originAnchor = relationshipBinding(anchor);
            await this.robots(claim,anchor.delegationPage); corporate = await this.request(claim,anchor.delegationPage,'html');
            link = corporateLink(corporate.text,anchor.delegationPage,route.destination);
            resolution = link ? discoveryOutcome('corroborated','CORPORATE_CAREERS_LINK') : discoveryOutcome('unsupported','DELEGATION_LINK_UNSUPPORTED');
          }
        }
      } catch (error) {
        const unavailable = originalRetrievalFailure(error); if (!unavailable) { delete claim.originAnchor; throw error; }
        resolution = discoveryOutcome('unavailable',unavailable.reason);
      }
    } else if (claim.source.automation.employerCrawl) resolution = discoveryOutcome('unsupported','PROBE_TARGET_UNSUPPORTED');
    const observations = [primary,corporate].filter(Boolean).map(o=>({ ...o, hash:hash(o.text), id:hash(`${claim.sourceId}:${o.url}:${hash(o.text)}`) }));
    const proposed = link ? makeDelegation(anchor,link,{now:this.now(),snapshotId:observations.at(-1).id,sourceId:claim.sourceId,sourceRevision:claim.sourceRevision}) : null;
    let delegation;
    try {
      delegation = await this.transaction(claim.sourceId,'worker.origin.observe',async(tx,source)=>{
        const job = await this.assertClaim(tx,source,claim);
        const previous = await Promise.all(observations.map(o=>tx.get(this.ref('snapshots',o.id))));
        let chosen = proposed, versionExists = null;
        if (proposed) {
          const current = readDelegation(await tx.get(this.ref('employer_delegations',proposed.id)));
          if (current && JSON.stringify(current.parent)===JSON.stringify(proposed.parent) && current.observedAt<=this.now() && this.now()<current.expiresAt) {
            await validateDelegationBindings(tx,this.db,[delegationBinding(current)],this.now()); chosen=current;
          } else versionExists = await tx.get(this.ref('employer_delegation_versions',delegationBinding(proposed).hash));
        }
        observations.forEach((o,i)=>{if(!previous[i].exists)tx.create(this.ref('snapshots',o.id),payload({id:o.id,sourceId:source.id,sourceRevision:source.revision,url:o.url,hash:o.hash,text:o.text,retrievedAt:this.now()}));});
        if (chosen && chosen===proposed) {
          tx.set(this.ref('employer_delegations',chosen.id),delegationDocument(chosen));
          if (!versionExists.exists) tx.create(this.ref('employer_delegation_versions',delegationBinding(chosen).hash),payload(chosen));
        }
        tx.create(this.ref('worker_origin_discoveries',id),payload({id,sourceId:source.id,sourceRevision:source.revision,jobId:claim.id,at:this.now(),
          resolution, snapshots:observations.map(o=>o.id), ...(chosen?{delegations:[delegationBinding(chosen)]}:{})}));
        tx.set(this.ref('worker_jobs',job.id),payload({...job,originDiscoveryId:id})); return chosen;
      });
    } finally { delete claim.originAnchor; }
    if (delegation) claim.originObservation=primary;
    return {id,resolution,delegation};
  }
  undatedOriginKeys(candidate) {
    return undatedOriginKeys(candidate);
  }
  async bindUndatedOrigin(claim, candidate, sourceRetrievedAt) {
    if (!usesUndatedV2(claim.source, candidate)) return null;
    return this.transaction(claim.sourceId, 'worker.undated_origin', async (tx, source) => {
      const job = await this.assertClaim(tx, source, claim);
      const issuers = approvedRoute(source, candidate.applicationCandidates[0]);
      if (issuers.length !== 1) fail('UNDATED_NOTICE_ORIGIN_CONFLICT');
      const provisional = makeUndatedOrigin(source, candidate, issuers[0].name, sourceRetrievedAt, this.now());
      const keys = this.undatedOriginKeys(candidate);
      const rows = await Promise.all(keys.map(k => tx.get(this.ref('worker_notice_origins', k))));
      const existing = rows.map(value);
      if (existing.some(Boolean) && (!existing.every(Boolean) || JSON.stringify(existing[0]) !== JSON.stringify(existing[1])))
        fail('UNDATED_NOTICE_ORIGIN_CONFLICT');
      const origin = existing[0] ?? provisional;
      if (!existing[0] && (await capturedNoticeJobs(tx, this.db, candidate.sourceUrl)).some(j => j.id !== claim.id))
        fail('UNDATED_ORIGIN_IMPORT_REQUIRED');
      preflightCandidate(source, candidate, this.now(), sourceRetrievedAt, origin);
      if (!existing[0]) keys.forEach(k => tx.create(this.ref('worker_notice_origins', k), payload(origin)));
      tx.set(this.ref('worker_jobs', claim.id), payload({ ...job, undatedOriginKeys: keys }));
      return origin;
    });
  }
  async assertStoredUndatedOrigin(tx, source, candidate, origin) {
    if (!origin) return;
    if (!usesUndatedV2(source, candidate)) fail('SOURCE_CHANGED');
    const rows = await Promise.all(this.undatedOriginKeys(candidate).map(k => tx.get(this.ref('worker_notice_origins', k))));
    if (rows.some(r => JSON.stringify(value(r)) !== JSON.stringify(origin))) fail('UNDATED_NOTICE_ORIGIN_CONFLICT');
  }
  async detail(claim) {
    assertSourceTarget(claim.url);
    const hold = await this.transaction(claim.sourceId, 'worker.source_hold.read', async (tx, source) => {
      await this.assertClaim(tx, source, claim);
      const saved = value(await tx.get(this.ref('worker_holds', hash(`${source.id}:${claim.url}`))));
      if (!saved || saved.sourceId !== source.id || saved.url !== claim.url || saved.sourceRevision !== source.revision ||
          saved.version !== SOURCE_HOLD_VERSION || saved.programmeExtraction !== this.programmeExtraction ||
          ![...SOURCE_HOLD_REASONS, 'RECENTJOBS_LAYOUT_CHANGED'].includes(saved.reason) ||
          !InstantSchema.safeParse(saved.at).success || !InstantSchema.safeParse(saved.recheckAt).success ||
          saved.at > this.now() || saved.recheckAt <= this.now() || Date.parse(saved.recheckAt) - Date.parse(saved.at) > SOURCE_HOLD_MS)
        return null;
      if (saved.reason === 'UNDATED_ORIGIN_IMPORT_REQUIRED') {
        const noticeKey = hash(`undated_shadow_v2:notice:${claim.url}`);
        const receipt = value(await tx.get(this.ref('worker_origin_imports', noticeKey)));
        if (receipt?.sourceId === source.id && receipt.sourceRevision === source.revision &&
            receipt.origin?.sourceId === source.id && receipt.origin.sourceUrl === claim.url &&
            receipt.originKeys?.length === 2 && receipt.originKeys[0] === noticeKey) {
          const rows = await Promise.all(receipt.originKeys.map(k => tx.get(this.ref('worker_notice_origins', k))));
          if (rows.every(r => JSON.stringify(value(r)) === JSON.stringify(receipt.origin))) return null;
        }
      }
      // A source hold must never postpone a published record's freshness watch.
      const watch = (await tx.get(this.ref('worker_watches', hash(`${source.id}:${hash(claim.url)}`)))).data();
      return watch?.sourceId === source.id && watch.url === claim.url && watch.stopAt > this.now() ? null : saved;
    });
    if (hold) return this.finish(claim, { sourceHeld: true, reason: hold.reason, recheckAt: hold.recheckAt,
      originalExceptionJobId: hold.jobId, published: false });
    await this.robots(claim, claim.url);
    const response = await this.request(claim, claim.url, 'html');
    const sourceRetrievedAt = this.now();
    const candidate = parseRecentJobsDetail({ html: response.text, url: response.url, observedOn: dayInSA(this.now()) });
    const captured = await this.capture(claim, candidate, sourceRetrievedAt);
    if (claim.source.automation.mode === 'shadow' && (candidate.applicationCandidates.length > 1 ||
        candidate.issues.includes('programme_subject_scope_review_required'))) {
      const plan = planRecentJobsProgrammes(candidate);
      await this.transaction(claim.sourceId, 'worker.programme_plan', async (tx, source) => {
        const job = await this.assertClaim(tx, source, claim);
        tx.set(this.ref('worker_programme_plans', claim.id), payload({sourceId:source.id,jobId:claim.id,
          snapshotId:captured.snapshotId,plan,at:this.now()}));
        tx.set(this.ref('worker_jobs',claim.id),payload({...job,programmePlanId:claim.id}));
      });
      if (this.programmeExtraction) return this.programmes(claim,candidate,captured,plan);
    }
    await this.bindIssuerTrust(claim, candidate, captured);
    const undatedOrigin = await this.bindUndatedOrigin(claim, candidate, captured.sourceRetrievedAt);
    let pendingRoute;
    try { pendingRoute = preflightCandidate(claim.source, candidate, this.now(), captured.sourceRetrievedAt, undatedOrigin); }
    catch (error) {
      if (!claim.source.automation.originalVerification || error.code !== 'ISSUER_RELATIONSHIP_UNQUALIFIED') throw error;
      // Record an unknown origin as an explicit private outcome without fetching it.
      pendingRoute = candidate.applicationCandidates[0];
    }
    const original = claim.source.automation.originalVerification ? await this.originalNotice(claim, candidate, captured) : null;
    if (original && original.resolution.outcome !== 'matched') fail(`ORIGINAL_NOTICE_${original.resolution.outcome.toUpperCase()}`);
    const crawlEmployer = !original && claim.source.automation.employerCrawl && pendingRoute.method === 'portal';
    if (crawlEmployer) await this.robots(claim, pendingRoute.destination);
    const version = this.extractionMode === 'split' ? `split:${METADATA_VERSION}:${REQUIREMENTS_VERSION}` : GROQ_EXTRACTION_VERSION;
    const policy = this.provider === 'gemini' ? `:json_object:chain_v1:availability_v1:${GEMINI_UNAVAILABLE_MS}:${this.fallback}:${GEMINI_MODEL_CHAIN.join(',')}` : '';
    const trustKey = claim.issuerTrust ? `:${ISSUER_REGISTRY_VERSION}:${hash(JSON.stringify(claim.issuerTrust.delegations
      ? {bindings:claim.issuerTrust.bindings,delegations:claim.issuerTrust.delegations} : claim.issuerTrust.bindings))}` : '';
    const keyBase = `${claim.sourceId}:${claim.sourceRevision}:${candidate.contentHash}:${this.provider}:${this.model}${policy}:${this.thinking}:${version}${original ? `:${ORIGINAL_RESOLVER_VERSION}` : ''}${trustKey}`;
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
    let primary = original?.resolution.primary ?? null, primaryHash = original?.primaryHash ?? 'discovery_only',
      primarySnapshotId = original?.primarySnapshotId ?? null;
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
    if (original) {
      const current = refreshOriginalResolution(original.resolution, this.now());
      if (current.outcome !== 'matched') fail(`ORIGINAL_NOTICE_${current.outcome.toUpperCase()}`);
    }
    draftGate(claim.source, candidate, record, primary, parsed, this.now(), captured.sourceRetrievedAt, undatedOrigin);
    const published = claim.source.automation.mode === 'automatic';
    return this.finish(claim, { recordId: captured.recordId, published, snapshotId: captured.snapshotId }, async (tx, source) => {
      await this.assertStoredUndatedOrigin(tx, source, candidate, undatedOrigin);
      const old = value(await tx.get(this.ref('drafts', captured.recordId)));
      const state = value(await tx.get(this.ref('state', 'current'))) ?? { revision: 1 };
      const watches = published ? await tx.get(this.db.collection('m0_worker_watches').where('sourceId', '==', source.id).limit(51)) : null;
      if (watches && watches.size >= 50 && !watches.docs.some(d => d.id === record.id)) fail('SOURCE_WATCH_CAPACITY');
      if ((old?.revision ?? null) !== captured.expectedRevision) fail('CONFLICT');
      if (['withdrawn', 'closed', 'archived'].includes(old?.lifecycle) || old?.publication.disposition === 'withheld') fail('RESTORE_REQUIRES_REVIEW');
      if (published && source.automation.mode !== 'automatic') fail('SOURCE_CHANGED');
      // Re-evaluate timing after slow model/network work, inside the commit boundary.
      if (original) {
        const current = refreshOriginalResolution(original.resolution, this.now());
        if (current.outcome !== 'matched') fail(`ORIGINAL_NOTICE_${current.outcome.toUpperCase()}`);
      }
      const currentGate = draftGate(source, candidate, record, primary, parsed, this.now(), captured.sourceRetrievedAt, undatedOrigin);
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
        decision: published ? 'published' : currentGate.deadlinePolicy ? 'undated_shadow_pass' : 'shadow_pass',
        validationBasis: primary ? 'discovery_and_primary' : 'discovery_notice',
        ...(original ? { originalResolutionId: original.id } : {}),
        ...(claim.issuerTrust ? { issuerResolutionId: claim.issuerTrust.receiptId } : {}),
        ...currentGate, at: this.now() }));
      if (published) tx.set(this.ref('worker_watches', record.id), { sourceId: source.id, url: claim.url,
        nextCheckAt: currentGate.nextCheckAt, stopAt: new Date(Date.parse(`${record.deadline.value.localDate}T00:00:00.000+02:00`)).toISOString() });
      this.catalogue.writePublication(tx, record, projection, state.revision + 1, published ? 'worker.publish' : 'worker.shadow', this.actor);
    });
  }
  async programmes(claim,candidate,captured,plan) {
    if (plan.state !== 'review_required') fail(plan.reason);
    // A closed/unsupported common deadline stops the whole notice before AI.
    preflightCandidate(claim.source,programmeCandidate(candidate,plan.intakes[0].id),this.now());
    const results=[];
    const providerPolicy=this.provider==='gemini'?`:json_object:chain_v1:availability_v1:${GEMINI_UNAVAILABLE_MS}:${this.fallback}:${GEMINI_MODEL_CHAIN.join(',')}`:'';
    for(const intake of plan.intakes) {
      const decisionId=hash(`${claim.id}:${intake.id}`),view=programmeCandidate(candidate,intake.id);
      try {
        preflightCandidate(claim.source,view,this.now());
        const recordId=hash(`${claim.sourceId}:${intake.id}`);
        const previous=await this.transaction(claim.sourceId,'worker.programme.read',async(tx,source)=>{
          await this.assertClaim(tx,source,claim);return value(await tx.get(this.ref('drafts',recordId)));
        });
        if(previous?.publication.previouslyPublic || previous?.publication.approved) fail('PROGRAMME_PUBLIC_RECORD_UNSUPPORTED');
        if(['withdrawn','closed','archived'].includes(previous?.lifecycle) || previous?.publication.disposition==='withheld') fail('RESTORE_REQUIRES_REVIEW');
        const key=`${claim.sourceId}:${claim.sourceRevision}:${view.contentHash}:${this.provider}:${this.model}${providerPolicy}:${this.thinking}:${PROGRAMME_EXTRACTION_VERSION}`;
        const extraction=await this.cache(claim,hash(key),()=>this.modelStage(claim,`programme_extraction:${intake.id}`,
          options=>this.programmeExtractor(candidate,intake.id,options)));
        const mapped=mapProgrammeExtraction(candidate,intake.id,extraction.extraction,{sourceId:claim.sourceId,now:this.now()});
        assertMaterialFacts(mapped.record);approvedIssuer(claim.source,mapped.record);
        await this.transaction(claim.sourceId,'worker.programme.candidate',async(tx,source)=>{
          await this.assertClaim(tx,source,claim);tx.set(this.ref('worker_programme_candidates',decisionId),payload({sourceId:source.id,
            jobId:claim.id,intakeId:intake.id,snapshotId:captured.snapshotId,record:mapped.record,evidence:mapped.evidence,
            scope:mapped.programmeScope,provenance:extraction.provenance}));
        });
        const input={record:mapped.record,recentjobsText:mapped.snapshot.text,primary:null,applicationCandidates:view.applicationCandidates};
        const assessment=await this.cache(claim,hash(`${key}:${PROGRAMME_VALIDATION_VERSION}:${this.validationThinking}:${hash(JSON.stringify(validationPayload(input)))}`),
          ()=>this.modelStage(claim,`programme_validation:${intake.id}`,options=>this.programmeValidator(input,candidate,intake.id,options)));
        const parsed=validateProgrammeAssessment({supported:assessment.supported,issues:assessment.issues,evidence:assessment.evidence},candidate,intake.id);
        // Email-only planned intakes use source/issuer checks; employer crawling is optional and causes no mail/HTTP probes.
        const gate=publicationGate(claim.source,view,mapped.record,null,parsed,this.now());
        await this.transaction(claim.sourceId,'worker.programme.shadow',async(tx,source)=>{
          await this.assertClaim(tx,source,claim);
          const old=value(await tx.get(this.ref('drafts',recordId))),state=value(await tx.get(this.ref('state','current')))??{revision:1};
          if((old?.revision??null)!==(previous?.revision??null))fail('CONFLICT');
          if(old?.publication.previouslyPublic || old?.publication.approved)fail('PROGRAMME_PUBLIC_RECORD_UNSUPPORTED');
          if(['withdrawn','closed','archived'].includes(old?.lifecycle)||old?.publication.disposition==='withheld')fail('RESTORE_REQUIRES_REVIEW');
          publicationGate(source,view,mapped.record,null,parsed,this.now());
          const record=mapped.record;record.revision=(old?.revision??0)+1;record.requirements.revision=record.revision;
          record.createdAt=old?.createdAt??record.createdAt;record.updatedAt=this.now();OpportunityRecordSchema.parse(record);
          tx.set(this.ref('worker_programme_decisions',decisionId),payload({sourceId:source.id,jobId:claim.id,intakeId:intake.id,
            snapshotId:captured.snapshotId,scope:mapped.programmeScope,recordId,recordRevision:record.revision,
            decision:'shadow_pass',extraction:extraction.provenance,validation:assessment.provenance,
            evidence:[...mapped.evidence,...parsed.evidence],nextCheckAt:gate.nextCheckAt,at:this.now()}));
          this.catalogue.writePublication(tx,record,{kind:'not_public'},state.revision+1,'worker.programme_shadow',this.actor);
        });
        results.push({intakeId:intake.id,recordId,state:'draft',published:false});
      } catch(error) {
        // Stop before further siblings on quota/provider/system failures. Semantic failures stay isolated.
        if(error.retryable || /^(?:AI_(?:PROVIDER|TRANSPORT|TIMEOUT|RATE|CONFIGURATION|DISABLED)|MODEL_BUDGET|WORKER_|SOURCE_|STALE_LEASE)/.test(error.code??''))throw error;
        const reason=/^[A-Z_]+$/.test(error.code??'')?error.code:'PROGRAMME_STAGE_FAILED';
        const locationDiagnostic=privateLocationDiagnostic(error);
        await this.transaction(claim.sourceId,'worker.programme.exception',async(tx,source)=>{
          await this.assertClaim(tx,source,claim);tx.set(this.ref('worker_programme_decisions',decisionId),payload({sourceId:source.id,
            jobId:claim.id,intakeId:intake.id,snapshotId:captured.snapshotId,decision:'exception',reason,
            ...(error.outputDiagnostic?{outputDiagnostic:error.outputDiagnostic}:{}),
            ...(locationDiagnostic?{locationDiagnostic}:{}),at:this.now()}));
        });
        results.push({intakeId:intake.id,state:'exception',reason});
      }
    }
    return this.finish(claim,{programmes:results,programmeCount:results.length,draftCount:results.filter(r=>r.state==='draft').length,
      published:false,snapshotId:captured.snapshotId});
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
      // Continuations are addressed directly so a full detail queue cannot hide
      // the discovery cursor beyond the bounded queue query's first 50 rows.
      const cursor = value(await this.ref('worker_discovery', sourceId).get());
      if (cursor?.state === 'pending') {
        const current = value(await this.ref('worker_jobs', cursor.currentJobId).get());
        if (current && !attempted.has(current.id) && current.nextAt <= this.now() && !(current.leaseUntil > this.now()) &&
            !eligible.some(j => j.id === current.id)) eligible.push(current);
      }
      eligible.sort((a, b) => (a.kind === 'discover' ? -1 : 1) - (b.kind === 'discover' ? -1 : 1) || (a.priorityAt ?? a.nextAt).localeCompare(b.priorityAt ?? b.nextAt));
      const job = eligible[0]; if (!job) break;
      attempted.add(job.id); results.push(await this.runJob(sourceId, job.id));
    }
    return { results };
  }
}
