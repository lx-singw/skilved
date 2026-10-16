import { SuggestionRequestSchema } from '@skilved/types/opportunities/suggestions';
import { Source } from './schemas.mjs';
import { RECENTJOBS_INDEX, assertSourceTarget } from './worker-policy.mjs';

/** Pure private preflight. It never fetches, queues, publishes or grants source permission. */
export function classifySuggestion(input, registry) {
  const request = SuggestionRequestSchema.safeParse(input);
  if (!request.success) return { kind: 'invalid' };
  if (!Array.isArray(registry) || !registry.length || registry.length > 100) return { kind: 'unavailable' };
  const parsed = registry.map(source => Source.safeParse(source));
  if (parsed.some(source => !source.success)) return { kind: 'unavailable' };
  const sources = parsed.map(source => source.data);
  if (new Set(sources.map(source => source.id)).size !== sources.length) return { kind: 'unavailable' };
  const matches = sources.filter(source => {
    if (source.permission.method === 'structured_json') return source.urls.includes(request.data.url);
    if (!source.urls.includes(RECENTJOBS_INDEX)) return false;
    try { return assertSourceTarget(request.data.url) === request.data.url; } catch { return false; }
  });
  if (!matches.length) return { kind: 'unsupported' };
  if (matches.length !== 1) return { kind: 'unavailable' };
  const source = matches[0];
  if (source.paused) return { kind: 'paused' };
  return { kind: 'eligible', url: request.data.url, sourceId: source.id, sourceRevision: source.revision };
}
