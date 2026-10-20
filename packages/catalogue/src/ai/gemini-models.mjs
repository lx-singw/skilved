export const GEMINI_MODEL = 'gemini-3.8-flash';
export const GEMINI_FLASH_LITE_MODEL = 'gemini-3.5-flash-lite';
export const GEMINI_MODEL_CHAIN = Object.freeze([GEMINI_MODEL, 'gemini-3.7-flash', 'gemini-3.6-flash',
  'gemini-3.5-flash', GEMINI_FLASH_LITE_MODEL, 'gemini-3.1-flash-lite']);

export function geminiAvailabilityFailure(error) {
  return ['AI_TIMEOUT', 'AI_TRANSPORT_FAILED', 'AI_RATE_LIMITED'].includes(error?.code) ||
    error?.code === 'AI_PROVIDER_REJECTED' && [404, 500, 502, 503, 504].includes(error.providerStatus);
}
