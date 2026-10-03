import { createHash } from 'node:crypto';
import { z } from 'zod';
import { DomainError } from '../config.mjs';
import { rejectedOutputDiagnostic } from './rejected-output.mjs';
import { GROQ_EXTRACTION_SCHEMA, GROQ_EXTRACTION_VERSION, GROQ_EXTRACTION_INSTRUCTION, groqExtractionPayload, decodeGroqExtraction } from './groq-schema.mjs';

export const GROQ_MODEL = 'openai/gpt-oss-120b';
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
export class GroqError extends DomainError {
  constructor(code, retryable = false, usage = null, retryAfterMs = null, providerStatus = null, outputDiagnostic = null) {
    super(code); Object.assign(this, { retryable, usage, retryAfterMs, providerStatus, outputDiagnostic });
  }
}
const failure = (...args) => { throw new GroqError(...args); };

// Groq's discriminator checks cannot infer primitive union branches through refs.
// Inline only primitive references, preserving the original object/union paths.
export function groqSchema(schema) {
  const resolve = value => value?.$ref?.startsWith('#/') ? value.$ref.slice(2).split('/').reduce((node, key) => node?.[key.replace(/~1/g, '/').replace(/~0/g, '~')], schema) : value;
  const visit = value => {
    if (Array.isArray(value)) return value.map(visit);
    if (!value || typeof value !== 'object') return value;
    if (value.$ref?.startsWith('#/')) {
      const target = resolve(value);
      if (target && ['string', 'integer', 'number', 'boolean', 'null'].includes(target.type)) return structuredClone(target);
    }
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, key === 'anyOf'
      ? child.flatMap(branch => resolve(branch)?.anyOf ?? [branch]).map(visit) : visit(child)]));
  };
  return visit(schema);
}

export function extractionConfiguration(env = process.env) {
  if (!env.SKILVED_AI_MODE || env.SKILVED_AI_MODE === 'disabled') failure('AI_DISABLED');
  const model = env.SKILVED_AI_MODEL ?? GROQ_MODEL;
  if (env.SKILVED_AI_MODE !== 'groq' || ![GROQ_MODEL, 'openai/gpt-oss-20b'].includes(model) ||
      !['low', 'medium'].includes(env.SKILVED_AI_THINKING ?? 'low') ||
      !['low', 'medium'].includes(env.SKILVED_AI_VALIDATION_THINKING ?? 'medium') ||
      !/^[A-Za-z0-9_-]{20,200}$/.test(env.GROQ_API_KEY ?? '')) failure('AI_CONFIGURATION_REQUIRED');
  return { provider: 'groq', model, thinking: env.SKILVED_AI_THINKING ?? 'low', apiKey: env.GROQ_API_KEY,
    validationThinking: env.SKILVED_AI_VALIDATION_THINKING ?? 'medium',
    maxOutputTokens: 3072, timeoutMs: 45000 };
}

const Usage = z.object({ prompt_tokens: z.number().int().nonnegative(), completion_tokens: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(), completion_tokens_details: z.object({ reasoning_tokens: z.number().int().nonnegative().optional() }).optional() });
function usageOf(input) {
  const parsed = Usage.safeParse(input); if (!parsed.success) return null;
  const u = parsed.data;
  // Groq completion_tokens already includes reasoning; do not add it again for billing.
  return { inputTokens: u.prompt_tokens, outputTokens: u.completion_tokens,
    thinkingTokens: u.completion_tokens_details?.reasoning_tokens ?? null, totalTokens: u.total_tokens };
}
function retryDelay(value) {
  const seconds = Number(value);
  if (value && Number.isFinite(seconds) && seconds >= 0) return Math.min(86400000, Math.ceil(seconds * 1000));
  const at = Date.parse(value ?? '');
  return Number.isFinite(at) ? Math.min(86400000, Math.max(0, at - Date.now())) : null;
}
async function boundedBody(response) {
  if (!response.body) failure('AI_EMPTY_RESPONSE');
  const reader = response.body.getReader(), chunks = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 256000) { await reader.cancel(); failure('AI_RESPONSE_LIMIT'); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { failure('AI_INVALID_RESPONSE'); }
}

export async function extractWithGroq(candidate, options) {
  const result = await generateStructured(groqExtractionPayload(candidate),
  { instruction: GROQ_EXTRACTION_INSTRUCTION, schema: GROQ_EXTRACTION_SCHEMA, version: GROQ_EXTRACTION_VERSION }, options);
  try { return { ...result, extraction: decodeGroqExtraction(result.extraction, candidate) }; }
  catch (error) { error.usage = result.provenance.usage; throw error; }
}

/** Fixed provider, explicit output mode, one bounded request, no automatic fallback.
 * JSON-object callers must validate their own schema before using the result.
 */
export async function generateStructured(payload, { instruction, schema, version, outputMode = 'json_schema' }, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const config = extractionConfiguration(env), input = JSON.stringify(payload);
  if (Buffer.byteLength(input) > 96000) failure('AI_INPUT_LIMIT');
  if(!['json_schema','json_object'].includes(outputMode))failure('AI_CONFIGURATION_REQUIRED');
  const normalizedSchema=groqSchema(schema),systemInstruction=outputMode==='json_object'?
    `${instruction}\nReturn valid JSON matching this schema. All required keys must be present:\n${JSON.stringify(normalizedSchema)}`:instruction;
  if(outputMode==='json_object'&&Buffer.byteLength(systemInstruction)>96000)failure('AI_INPUT_LIMIT');
  const request = { model: config.model, messages: [{ role: 'system', content: systemInstruction }, { role: 'user', content: input }],
    response_format: outputMode==='json_object'?{type:'json_object'}:
      { type: 'json_schema', json_schema: { name: version, strict: true, schema: normalizedSchema } },
    max_completion_tokens: config.maxOutputTokens, reasoning_effort: config.thinking, include_reasoning: false, stream: false };
  const requestHash = createHash('sha256').update(JSON.stringify(request)).digest('hex');
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetchImpl(ENDPOINT, { method: 'POST', redirect: 'error', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` }, body: JSON.stringify(request) });
    if (!response.ok) {
      const delay = retryDelay(response.headers.get('retry-after'));
      let invalidGeneration = false, usage = null, outputDiagnostic = null;
      if (response.status === 400) {
        // A generated document that failed the provider's schema check may
        // succeed on a later bounded worker attempt. Invalid configuration does not.
        // Inspect rejected JSON transiently; retain only bounded schema diagnostics.
        // Never retain messages, failed_generation or arbitrary provider codes.
        try { const body = await boundedBody(response);
          invalidGeneration = body.error?.code === 'json_validate_failed'; usage = usageOf(body.usage);
          if (invalidGeneration) outputDiagnostic = rejectedOutputDiagnostic(body.error.failed_generation, normalizedSchema);
        } catch { /* Malformed/oversized errors remain ordinary provider rejections. */ }
      } else await response.body?.cancel();
      failure(invalidGeneration ? 'AI_INVALID_PROVIDER_OUTPUT' : response.status === 429 ? 'AI_RATE_LIMITED' : 'AI_PROVIDER_REJECTED',
        invalidGeneration || [429, 500, 502, 503, 504].includes(response.status), usage, delay, response.status, outputDiagnostic);
    }
    const body = await boundedBody(response), usage = usageOf(body.usage);
    if (body.choices?.length !== 1 || body.choices[0].finish_reason !== 'stop') failure('AI_INCOMPLETE_RESPONSE', false, usage);
    const message = body.choices[0].message;
    if (!message || message.refusal || message.tool_calls || message.function_call || typeof message.content !== 'string') failure('AI_INVALID_RESPONSE', false, usage);
    if (!message.content || Buffer.byteLength(message.content) > 96000) failure('AI_OUTPUT_LIMIT', false, usage);
    let extraction;
    try { extraction = JSON.parse(message.content); } catch { failure('AI_INVALID_JSON', false, usage); }
    return { extraction, provenance: { provider: 'groq', model: config.model,
      modelVersion: typeof body.model === 'string' ? body.model.slice(0, 200) : null,
      extractionVersion: version, thinking: config.thinking, requestHash, usage,
      ...(outputMode==='json_object'?{outputMode}:{}) } };
  } catch (error) {
    if (error instanceof GroqError) throw error;
    failure(controller.signal.aborted ? 'AI_TIMEOUT' : 'AI_TRANSPORT_FAILED', true);
  } finally { clearTimeout(timer); }
}
