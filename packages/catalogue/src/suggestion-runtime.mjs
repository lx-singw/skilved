import { suggestionConfiguration } from './suggestion-config.mjs';
import { handleSuggestion } from './suggestion-http.mjs';
import { SuggestionReceipts } from './suggestion-receipts.mjs';
import { SuggestionAdmission } from './suggestion-admission.mjs';
import { DomainError } from './config.mjs';

const defaultRuntime = async () => (await import('./runtime.mjs')).getRuntime();

/** Server-only route adapter. Disabled/invalid config and transport never initialize SDKs. */
export async function handleSuggestionRequest(request, { env = process.env, runtimeProvider = defaultRuntime } = {}) {
  let settings;
  try { settings = suggestionConfiguration(env); } catch { /* Never expose manifest/secret errors. */ }
  if (!settings) return handleSuggestion(request);
  return handleSuggestion(request, { config: settings.http, provider: async () => {
    const runtime = await runtimeProvider();
    // The shared base runtime caches one project. Never reuse it across a changed binding.
    if (runtime?.config?.mode !== settings.catalogue.mode || runtime?.config?.projectId !== settings.catalogue.projectId)
      throw new DomainError('SUGGESTION_UNAVAILABLE');
    const receipts = new SuggestionReceipts(runtime.db, { ...settings.receipt, now: () => new Date().toISOString() });
    return new SuggestionAdmission(runtime.db, receipts, settings.policy);
  } });
}
