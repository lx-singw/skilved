import { createHash } from 'node:crypto';
import { z } from 'zod';
import { DomainError } from '../config.mjs';
import { EXTRACTION_INSTRUCTION, EXTRACTION_JSON_SCHEMA, EXTRACTION_VERSION } from './extraction.mjs';

export const GEMINI_MODEL = 'gemini-3.8-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_RESPONSE_BYTES = 256_000;
export class ExtractionError extends DomainError {
  constructor(code, retryable = false, usage = null) { super(code); this.retryable = retryable; this.usage = usage; }
}
const failure = (code, retryable = false, usage = null) => { throw new ExtractionError(code, retryable, usage); };

export function extractionConfiguration(env = process.env) {
  if (!env.SKILVED_AI_MODE || env.SKILVED_AI_MODE === 'disabled') failure('AI_DISABLED');
  if (env.SKILVED_AI_MODE !== 'gemini' ||
      (env.SKILVED_AI_MODEL && env.SKILVED_AI_MODEL !== GEMINI_MODEL) ||
      !['low', 'medium'].includes(env.SKILVED_AI_THINKING ?? 'low') ||
      !env.GEMINI_API_KEY || !/^[A-Za-z0-9_.-]{20,200}$/.test(env.GEMINI_API_KEY)) failure('AI_CONFIGURATION_REQUIRED');
  return { model: GEMINI_MODEL, thinking: env.SKILVED_AI_THINKING ?? 'low', apiKey: env.GEMINI_API_KEY,
    maxOutputTokens: 8192, timeoutMs: 45_000 };
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

/** One call, no tools, redirects, ambient sessions, automatic retries or fallback model. */
export async function extractWithGemini(candidate, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const payload = { title: candidate.title, sourceText: candidate.sourceText,
    applicationCandidates: candidate.applicationCandidates.map(({ method, destination, originalText }) => ({ method, destination, originalText })) };
  return generateStructured(payload, { instruction: EXTRACTION_INSTRUCTION, schema: EXTRACTION_JSON_SCHEMA,
    version: EXTRACTION_VERSION }, { env, fetchImpl });
}

export async function generateStructured(payload, { instruction, schema, version }, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const config = extractionConfiguration(env);
  const input = JSON.stringify(payload);
  if (Buffer.byteLength(input) > 96_000) failure('AI_INPUT_LIMIT');
  const request = { systemInstruction: { parts: [{ text: instruction }] },
    contents: [{ role: 'user', parts: [{ text: input }] }],
    generationConfig: { responseMimeType: 'application/json', responseJsonSchema: schema,
      maxOutputTokens: config.maxOutputTokens, thinkingConfig: { thinkingLevel: config.thinking.toUpperCase(), includeThoughts: false } } };
  const requestHash = createHash('sha256').update(JSON.stringify({ model: config.model, request })).digest('hex');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetchImpl(ENDPOINT, { method: 'POST', redirect: 'error', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey }, body: JSON.stringify(request) });
    if (!response.ok) {
      await response.body?.cancel();
      failure(response.status === 429 ? 'AI_RATE_LIMITED' : 'AI_PROVIDER_REJECTED',
        [429, 500, 502, 503, 504].includes(response.status));
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
      extractionVersion: version, thinking: config.thinking, requestHash, usage } };
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    failure(controller.signal.aborted ? 'AI_TIMEOUT' : 'AI_TRANSPORT_FAILED', true);
  } finally { clearTimeout(timer); }
}
