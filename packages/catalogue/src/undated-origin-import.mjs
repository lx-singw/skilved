import { createHash } from 'node:crypto';
import { z } from 'zod';
import { IdSchema, InstantSchema } from '@skilved/types/opportunities';
import { DomainError } from './config.mjs';
import { Source } from './schemas.mjs';
import { parseRecentJobsDetail } from './adapters/recentjobs.mjs';
import { approvedRoute, preflightCandidate, RECENTJOBS_INDEX } from './worker-policy.mjs';
import { makeUndatedOrigin, undatedOriginKeys, usesUndatedV2 } from './undated-policy.mjs';

const fail = code => { throw new DomainError(code); };
const hash = text => createHash('sha256').update(text).digest('hex');
const value = snap => snap.exists ? JSON.parse(snap.data().json) : null;
const payload = row => ({ json: JSON.stringify(row) });
const Review = z.object({ sourceId: IdSchema, sourceRevision: z.number().int().positive(),
  url: z.string().url().max(2048), html: z.string().max(500000),
  expectedFirstJobId: IdSchema, decisionJobId: IdSchema,
  expectedHistoryHash: z.string().regex(/^[a-f0-9]{64}$/) }).strict();

export function undatedHistoryHash(jobs) {
  return hash(JSON.stringify(jobs.map(j => ({ id: j.id, sourceId: j.sourceId, url: j.url,
    sourceRetrievedAt: j.sourceRetrievedAt, snapshotId: j.snapshotId, contentHash: j.contentHash,
    state: j.state })).sort((a, b) => a.id.localeCompare(b.id))));
}

/** Bounded complete scan: JSON-backed jobs have no queryable URL index yet. */
export async function capturedNoticeJobs(tx, db, url) {
  const rows = await tx.get(db.collection('m0_worker_jobs').limit(1001));
  if (rows.size > 1000) fail('UNDATED_HISTORY_CAPACITY');
  const matching = rows.docs.map(d => ({ ...value(d), id: d.id })).filter(j => j.url === url &&
    [j.sourceRetrievedAt, j.snapshotId, j.contentHash].some(v => v != null));
  if (matching.length > 50) fail('UNDATED_HISTORY_CAPACITY');
  if (matching.some(j => !InstantSchema.safeParse(j.sourceRetrievedAt).success || !j.snapshotId ||
    !/^[a-f0-9]{64}$/.test(j.contentHash ?? ''))) fail('UNDATED_HISTORY_CONFLICT');
  return matching.sort((a, b) => a.sourceRetrievedAt.localeCompare(b.sourceRetrievedAt) || a.id.localeCompare(b.id));
}

/** Called only inside Catalogue.mutate after current source-role authorization. */
export async function importUndatedOrigin(catalogue, tx, input, actor) {
  const review = Review.parse(input), raw = value(await tx.get(catalogue.ref('sources', review.sourceId)));
  if (!raw || raw.revision !== review.sourceRevision) fail('SOURCE_CHANGED');
  const source = Source.parse(raw);
  if (source.id !== review.sourceId || source.paused || !source.categories.includes('apprenticeship') ||
    !source.urls.includes(RECENTJOBS_INDEX) || source.permission.method !== 'recentjobs_html' || source.automation?.mode !== 'shadow' ||
    source.automation.undatedNotices !== 'shadow_recent_v2') fail('SOURCE_POLICY_REQUIRED');
  const candidate = parseRecentJobsDetail({ html: review.html, url: review.url });
  if (!usesUndatedV2(source, candidate)) fail('SOURCE_POLICY_REQUIRED');
  const jobs = await capturedNoticeJobs(tx, catalogue.db, review.url), first = jobs[0];
  if (!first || first.id !== review.expectedFirstJobId || jobs.some(j => j.sourceId !== source.id) ||
    undatedHistoryHash(jobs) !== review.expectedHistoryHash) fail('UNDATED_HISTORY_CONFLICT');
  const snapshotIds = [...new Set(jobs.map(j => j.snapshotId))];
  if (snapshotIds.length > 10) fail('UNDATED_HISTORY_CAPACITY');
  const snapshots = await Promise.all(snapshotIds.map(id => tx.get(catalogue.ref('snapshots', id)).then(value)));
  const text = `${candidate.title}\n${candidate.sourceText}`;
  for (const j of jobs) {
    const s = snapshots.find(s => s?.id === j.snapshotId);
    if (!s || s.sourceId !== source.id || s.url !== candidate.sourceUrl || s.contentHash !== candidate.contentHash ||
      j.contentHash !== candidate.contentHash || s.text !== text || s.hash !== hash(text) ||
      j.sourceRetrievedAt > catalogue.now()) fail('UNDATED_HISTORY_CONFLICT');
  }
  const decision = value(await tx.get(catalogue.ref('worker_decisions', review.decisionJobId)));
  const decisionJob = jobs.find(j => j.id === review.decisionJobId);
  const issuers = approvedRoute(source, candidate.applicationCandidates[0]);
  if (issuers.length !== 1) fail('UNDATED_NOTICE_ORIGIN_CONFLICT');
  const origin = makeUndatedOrigin(source, candidate, issuers[0].name, first.sourceRetrievedAt, catalogue.now());
  if (!decision || !decisionJob || decision.sourceId !== source.id || decision.deadlinePolicy !== 'undated_shadow_v1' ||
    !['undated_shadow_pass'].includes(decision.decision) || decision.recordId !== decisionJob.recordId ||
    !InstantSchema.safeParse(decision.sourcePublishedAt).success ||
    new Date(decision.sourcePublishedAt).toISOString() !== origin.sourcePublishedAt ||
    decision.sourceRetrievedAt !== decisionJob.sourceRetrievedAt) fail('UNDATED_HISTORY_CONFLICT');
  // Historical eligibility only. Import never claims a fresh check or extends a draft.
  preflightCandidate(source, candidate, first.sourceRetrievedAt, first.sourceRetrievedAt, origin);
  const keys = undatedOriginKeys(candidate), existing = await Promise.all(keys.map(k => tx.get(catalogue.ref('worker_notice_origins', k))));
  const receiptId = keys[0], receipt = await tx.get(catalogue.ref('worker_origin_imports', receiptId));
  if (receipt.exists || existing.some(s => s.exists)) fail('UNDATED_NOTICE_ORIGIN_CONFLICT');
  keys.forEach(k => tx.create(catalogue.ref('worker_notice_origins', k), payload(origin)));
  const result = { sourceId: source.id, sourceRevision: source.revision, originKeys: keys, origin,
    historyHash: review.expectedHistoryHash, acquisitionJobIds: jobs.map(j => j.id),
    decisionJobId: review.decisionJobId, actor, at: catalogue.now(),
    scope: 'earliest_persisted_worker_acquisition', freshCheck: false, publication: false };
  tx.create(catalogue.ref('worker_origin_imports', receiptId), payload(result));
  return result;
}
