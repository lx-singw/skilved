import {DomainError} from '../config.mjs';
import {assertLocationEvidence} from './location-evidence.mjs';
import {assertLocationCompleteness} from './location-completeness.mjs';

// Reject redundant full lines without rewriting an answer or losing a claimed
// place, attendance, coverage, relocation or required source passage. Necessary
// intervening text remains valid: evidence must still be contiguous.
export function assertLocationSpanBoundary(candidate,fact) {
  if(fact?.state!=='stated'||typeof fact.quote!=='string')return;
  const lines=fact.quote.split('\n');
  if(lines.length<2)return;
  for(const quote of [lines.slice(1).join('\n'),lines.slice(0,-1).join('\n')]) {
    if(!quote.trim())continue;
    const shorter={...fact,quote};
    try {
      assertLocationEvidence(shorter);
      assertLocationCompleteness(candidate,shorter);
    } catch(error) {
      if(!['AI_LOCATION_EVIDENCE_UNRESOLVED','AI_LOCATION_COMPLETENESS_UNRESOLVED'].includes(error?.code))throw error;
      continue;
    }
    throw new DomainError('AI_LOCATION_SPAN_REDUNDANT');
  }
}
