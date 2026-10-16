import { z } from 'zod';
import { configuration, DomainError } from './config.mjs';
import { AdmissionPolicy } from './suggestion-admission.mjs';
import { ReceiptKeyRingSchema } from './suggestion-receipts.mjs';
import { SuggestionHttpConfig } from './suggestion-http.mjs';

const Manifest = z.object({ origin: z.string().max(200), keyRing: ReceiptKeyRingSchema, policy: AdmissionPolicy }).strict();
const invalid = () => { throw new DomainError('UNSAFE_CONFIGURATION'); };

/** Trusted server environment only. No SDK initialization, defaults for secrets or env writes. */
export function suggestionConfiguration(env = process.env) {
  if (env.SKILVED_SUGGESTIONS_ENABLED === undefined || ['false', 'disabled'].includes(env.SKILVED_SUGGESTIONS_ENABLED)) return null;
  if (env.SKILVED_SUGGESTIONS_ENABLED !== 'true') invalid();
  try {
    const base = configuration(env);
    if (!base || !base.reads) invalid();
    const text = env.SKILVED_SUGGESTIONS_CONFIG;
    if (typeof text !== 'string' || Buffer.byteLength(text) > 8192) invalid();
    const parsed = Manifest.safeParse(JSON.parse(text));
    if (!parsed.success) invalid();
    const { origin, policy, keyRing } = parsed.data;
    const http = SuggestionHttpConfig.safeParse({ enabled: true, intakeEnabled: policy.intakeEnabled, origin, emulator: base.mode === 'emulator' });
    if (!http.success) invalid();
    return { catalogue: base, http: http.data, policy, receipt: { keyRing, maxTtlMs: policy.receiptTtlMs } };
  } catch { invalid(); }
}
