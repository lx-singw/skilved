import { createHash } from 'node:crypto';
import { DomainError } from '../config.mjs';
import { GEMINI_MODEL_CHAIN } from './gemini-models.mjs';

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
});
export function geminiQuotaDay(now) {
  const parts = Object.fromEntries(formatter.formatToParts(new Date(now)).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function nextGeminiQuotaReset(now) {
  // Search the next local date boundary, including 23/25-hour DST days.
  let low = Date.parse(now), high = low + 26 * 3600000;
  const day = geminiQuotaDay(now);
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (geminiQuotaDay(middle) === day) low = middle;
    else high = middle;
  }
  return new Date(high).toISOString();
}
export function geminiQuotaScope(env) {
  const project = env.SKILVED_GEMINI_PROJECT_ID;
  if (project && !/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project)) throw new DomainError('AI_CONFIGURATION_REQUIRED');
  return createHash('sha256').update(project ? `gemini:project:${project}` : `gemini:key:${env.GEMINI_API_KEY ?? ''}`).digest('hex');
}
export function geminiQuotaLimits(env) {
  let limits;
  try { limits = JSON.parse(env.SKILVED_GEMINI_MODEL_LIMITS || '{}'); }
  catch { throw new DomainError('AI_CONFIGURATION_REQUIRED'); }
  if (!limits || typeof limits !== 'object' || Array.isArray(limits)) throw new DomainError('AI_CONFIGURATION_REQUIRED');
  for (const [model, value] of Object.entries(limits)) {
    if (!GEMINI_MODEL_CHAIN.includes(model) || !value || typeof value !== 'object' || Array.isArray(value) ||
        Object.entries(value).some(([k, v]) => !['rpm', 'tpm', 'rpd'].includes(k) || !Number.isInteger(v) || v < 1 || v > 100000000)) {
      throw new DomainError('AI_CONFIGURATION_REQUIRED');
    }
  }
  return limits;
}
export function dailyQuotaFailure(body, model) {
  return Array.isArray(body?.error?.details) && body.error.details.some(detail =>
    detail?.['@type'] === 'type.googleapis.com/google.rpc.QuotaFailure' && Array.isArray(detail.violations) &&
    detail.violations.some(v => typeof v?.quotaId === 'string' &&
      /(?:Requests|Tokens)PerDay(?:PerProject|PerModel|-|$)/.test(v.quotaId) &&
      (!v.quotaDimensions?.model || v.quotaDimensions.model === model)));
}
export function recentGeminiUsage(usage, now) {
  return (usage.minute ?? []).filter(row => Date.parse(row.at) > Date.parse(now) - 60000);
}
export function mergeGeminiMinuteUsage(previous, current, now) {
  const rows = new Map(recentGeminiUsage(previous, now).map(row => [row.id, row]));
  for (const row of recentGeminiUsage(current, now)) {
    // A request spanning midnight can report its tokens after its reservation
    // was copied to the new date. Keep known usage over that pending copy.
    const old = rows.get(row.id);
    rows.set(row.id, { ...row, inputTokens: row.inputTokens ?? old?.inputTokens ?? null });
  }
  return [...rows.values()];
}
export function geminiUsageDelay(usage, limits, now) {
  if (limits?.rpd && usage.requests >= limits.rpd) return { until: nextGeminiQuotaReset(now), kind: 'daily' };
  const minute = recentGeminiUsage(usage, now);
  const known = minute.reduce((n, row) => n + (row.inputTokens ?? 0), 0);
  if (minute.length >= 1000 || limits?.rpm && minute.length >= limits.rpm || limits?.tpm && known >= limits.tpm) {
    return { until: new Date(Math.min(...minute.map(r => Date.parse(r.at))) + 60000).toISOString(), kind: 'minute' };
  }
  return null;
}
