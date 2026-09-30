import { parseRecentJobsDetail } from './recentjobs.mjs';
import { extractWithGroq } from '../ai/groq.mjs';
import { mapExtraction } from '../ai/extraction.mjs';
import { IdSchema, InstantSchema } from '@skilved/types/opportunities';

/** Parse -> actual provider boundary -> evidence checks -> canonical PRIVATE record.
 * No Firestore writes or publication; callers must retain the source/evidence before persistence.
 */
export async function extractRecentJobs({ html, url, sourceId, now }, { model = extractWithGroq } = {}) {
  IdSchema.parse(sourceId); InstantSchema.parse(now);
  const observedOn = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg',
    year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
  const candidate = parseRecentJobsDetail({ html, url, observedOn });
  const response = await model(candidate);
  try {
    const result = mapExtraction(candidate, response.extraction, { sourceId, now });
    return { ...result, sourceUrl: candidate.sourceUrl, contentHash: candidate.contentHash,
      provenance: response.provenance };
  } catch (error) {
    // Preserve billable usage on rejected output without leaking raw output or source text.
    error.usage = response.provenance?.usage ?? null;
    throw error;
  }
}
