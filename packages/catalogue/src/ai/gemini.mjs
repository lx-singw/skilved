import { createHash } from 'node:crypto';
import { z } from 'zod';
import { DomainError } from '../config.mjs';
import { groqSchema } from './groq.mjs';
import { EXTRACTION_INSTRUCTION, EXTRACTION_JSON_SCHEMA, EXTRACTION_VERSION } from './extraction.mjs';

export const GEMINI_MODEL = 'gemini-3.8-flash';
export const GEMINI_FLASH_LITE_MODEL = 'gemini-3.5-flash-lite';
export const GEMINI_MODEL_CHAIN = Object.freeze([GEMINI_MODEL, 'gemini-3.7-flash', 'gemini-3.6-flash',
  'gemini-3.5-flash', GEMINI_FLASH_LITE_MODEL, 'gemini-3.1-flash-lite']);
const MAX_RESPONSE_BYTES = 256_000;
export class ExtractionError extends DomainError {
  constructor(code, retryable = false, usage = null, providerStatus = null, retryAfterMs = null) {
    super(code); Object.assign(this, { retryable, usage, providerStatus, retryAfterMs });
  }
}
const failure = (...args) => { throw new ExtractionError(...args); };

export function extractionConfiguration(env = process.env) {
  if (!env.SKILVED_AI_MODE || env.SKILVED_AI_MODE === 'disabled') failure('AI_DISABLED');
  const model = env.SKILVED_AI_MODEL ?? GEMINI_MODEL;
  if (env.SKILVED_AI_MODE !== 'gemini' ||
      !GEMINI_MODEL_CHAIN.includes(model) ||
      !['true', 'false'].includes(env.SKILVED_AI_FALLBACK ?? 'true') ||
      !['low', 'medium'].includes(env.SKILVED_AI_THINKING ?? 'low') ||
      !env.GEMINI_API_KEY || !/^[A-Za-z0-9_.-]{20,200}$/.test(env.GEMINI_API_KEY)) failure('AI_CONFIGURATION_REQUIRED');
  return { model, thinking: env.SKILVED_AI_THINKING ?? 'low', apiKey: env.GEMINI_API_KEY,
    fallback: (env.SKILVED_AI_FALLBACK ?? 'true') === 'true',
    maxOutputTokens: 8192, timeoutMs: 45_000, fallbackTimeoutMs: 90_000 };
}

const Usage = z.object({ promptTokenCount: z.number().int().nonnegative(),
  candidatesTokenCount: z.number().int().nonnegative().optional(),
  thoughtsTokenCount: z.number().int().nonnegative().optional(),
  totalTokenCount: z.number().int().nonnegative() });
function usageOf(input) {
  const parsed = Usage.safeParse(input);
  if (!parsed.success) return null;
  const u = parsed.data;
  return { inputTokens: u.promptTokenCount, outputTokens: u.candidatesTokenCount ?? null,
    thinkingTokens: u.thoughtsTokenCount ?? null, totalTokens: u.totalTokenCount };
}

async function boundedBody(response) {
  if (!response.body) failure('AI_EMPTY_RESPONSE');
  const reader = response.body.getReader(), chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) { await reader.cancel(); failure('AI_RESPONSE_LIMIT'); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { failure('AI_INVALID_RESPONSE'); }
}

/** Availability fallback retains the same evidence and extraction contract. */
export async function extractWithGemini(candidate, options = {}) {
  const payload = { title: candidate.title, sourceText: candidate.sourceText,
    applicationCandidates: candidate.applicationCandidates.map(({ method, destination, originalText }) => ({ method, destination, originalText })) };
  return generateStructured(payload, { instruction: EXTRACTION_INSTRUCTION, schema: EXTRACTION_JSON_SCHEMA,
    version: EXTRACTION_VERSION }, options);
}

/** JSON-object mode requires caller-owned schema validation. A smaller explicit
 * token cap and fallback:false support fixed development comparisons. */
export async function generateStructured(payload, { instruction, schema, version, outputMode = 'json_schema' },
  { env = process.env, fetchImpl = globalThis.fetch, maxOutputTokens, fallback } = {}) {
  const config = extractionConfiguration(env);
  const useFallback = fallback ?? config.fallback;
  const cap = maxOutputTokens ?? config.maxOutputTokens;
  if (typeof useFallback !== 'boolean' || !['json_schema', 'json_object'].includes(outputMode) || !Number.isInteger(cap) || cap < 1 || cap > config.maxOutputTokens)
    failure('AI_CONFIGURATION_REQUIRED');
  const input = JSON.stringify(payload);
  if (Buffer.byteLength(input) > 96_000) failure('AI_INPUT_LIMIT');
  // Match the existing Groq JSON-object instruction exactly for a fair comparison.
  const systemInstruction = outputMode === 'json_object'
    ? `${instruction}\nReturn valid JSON matching this schema. All required keys must be present:\n${JSON.stringify(groqSchema(schema))}` : instruction;
  if (Buffer.byteLength(systemInstruction) > 96_000) failure('AI_INPUT_LIMIT');
  const request = { systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: input }] }],
    generationConfig: { responseMimeType: 'application/json', ...(outputMode === 'json_schema' ? { responseJsonSchema: schema } : {}),
      maxOutputTokens: cap, thinkingConfig: { thinkingLevel: config.thinking.toUpperCase(), includeThoughts: false } } };
  const models = useFallback ? GEMINI_MODEL_CHAIN.slice(GEMINI_MODEL_CHAIN.indexOf(config.model)) : [config.model];
  const attempts = [], deadline = Date.now() + (useFallback ? config.fallbackTimeoutMs : config.timeoutMs);
  for (const model of models) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      const error = new ExtractionError('AI_TIMEOUT', true); error.attempts = attempts; throw error;
    }
    const requestHash = createHash('sha256').update(JSON.stringify({ model, request })).digest('hex');
    try {
      const result = await generateForModel(request, { ...config, model, timeoutMs: Math.min(config.timeoutMs, remainingMs) },
        { fetchImpl, version, outputMode, requestHash });
      if (useFallback) {
        attempts.push({ model, requestHash, status: 'response', usage: result.provenance.usage });
        Object.assign(result.provenance, { requestedModel: config.model, attempts });
      }
      return result;
    } catch (error) {
      attempts.push({ model, requestHash, status: 'error', code: error.code, providerStatus: error.providerStatus,
        retryable: error.retryable, retryAfterMs: error.retryAfterMs, usage: error.usage });
      if (useFallback) error.attempts = attempts;
      const unavailable = ['AI_TIMEOUT', 'AI_TRANSPORT_FAILED', 'AI_RATE_LIMITED'].includes(error.code) ||
        (error.code === 'AI_PROVIDER_REJECTED' && [404, 500, 502, 503, 504].includes(error.providerStatus));
      if (!unavailable || model === models.at(-1)) throw error;
    }
  }
}

async function generateForModel(request, config, { fetchImpl, version, outputMode, requestHash }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`;
    const response = await fetchImpl(endpoint, { method: 'POST', redirect: 'error', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey }, body: JSON.stringify(request) });
    if (!response.ok) {
      await response.body?.cancel();
      const retrySeconds = Number(response.headers.get('retry-after'));
      const retryAfterMs = response.headers.has('retry-after') && Number.isFinite(retrySeconds) && retrySeconds >= 0
        ? Math.min(retrySeconds * 1000, 86_400_000) : null;
      failure(response.status === 429 ? 'AI_RATE_LIMITED' : 'AI_PROVIDER_REJECTED',
        [429, 500, 502, 503, 504].includes(response.status), null, response.status, retryAfterMs);
    }
    const body = await boundedBody(response), usage = usageOf(body.usageMetadata);
    if (body.promptFeedback?.blockReason || body.candidates?.length !== 1 || body.candidates[0].finishReason !== 'STOP')
      failure('AI_INCOMPLETE_RESPONSE', false, usage);
    const parts = body.candidates[0].content?.parts;
    if (!Array.isArray(parts) || !parts.length || parts.some(p => !p.thought && (typeof p.text !== 'string' || p.functionCall)))
      failure('AI_INVALID_RESPONSE', false, usage);
    const output = parts.filter(p => !p.thought).map(p => p.text).join('');
    if (!output || Buffer.byteLength(output) > 96_000) failure('AI_OUTPUT_LIMIT', false, usage);
    let extraction;
    try { extraction = JSON.parse(output); } catch { failure('AI_INVALID_JSON', false, usage); }
    return { extraction, provenance: { provider: 'gemini', model: config.model,
      modelVersion: typeof body.modelVersion === 'string' ? body.modelVersion.slice(0, 200) : null,
      extractionVersion: version, thinking: config.thinking, requestHash, usage,
      ...(outputMode === 'json_object' ? { outputMode } : {}) } };
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    failure(controller.signal.aborted ? 'AI_TIMEOUT' : 'AI_TRANSPORT_FAILED', true);
  } finally { clearTimeout(timer); }
}
