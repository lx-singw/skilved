import * as groq from './groq.mjs';
import * as gemini from './gemini.mjs';
import {groqExtractionPayload, GROQ_EXTRACTION_SCHEMA, GROQ_EXTRACTION_INSTRUCTION,
  GROQ_EXTRACTION_VERSION, GroqExtractionSchema, decodeGroqExtraction} from './groq-schema.mjs';
import {rejectedOutputDiagnostic} from './rejected-output.mjs';

export function extractionConfiguration(env = process.env) {
  return (env.SKILVED_AI_MODE === 'gemini' ? gemini : groq).extractionConfiguration(env);
}

// Rich worker schemas remain strict locally; Gemini's JSON-object transport
// avoids the native schema compatibility failures seen in development trials.
export function generateStructured(payload, contract, options = {}) {
  const config = extractionConfiguration(options.env ?? process.env);
  return config.provider === 'gemini'
    ? gemini.generateStructured(payload, {...contract, outputMode:'json_object'}, {...options, maxOutputTokens:options.maxOutputTokens ?? 3072})
    : groq.generateStructured(payload, contract, options);
}

export async function extractWithProvider(candidate, options = {}) {
  const result = await generateStructured(groqExtractionPayload(candidate),
    {instruction:GROQ_EXTRACTION_INSTRUCTION, schema:GROQ_EXTRACTION_SCHEMA, version:GROQ_EXTRACTION_VERSION}, options);
  try { return {...result, extraction:decodeGroqExtraction(result.extraction, candidate)}; }
  catch (error) {
    error.usage = result.provenance.usage;
    if (error.code === 'AI_INVALID_EXTRACTION' && !GroqExtractionSchema.safeParse(result.extraction).success) {
      error.outputDiagnostic = rejectedOutputDiagnostic(JSON.stringify(result.extraction), GROQ_EXTRACTION_SCHEMA);
    }
    throw error;
  }
}
