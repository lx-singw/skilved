import { Opportunity } from '@skilved/types';

export interface QualityEvaluationResult {
  qualityScore: number; // 0-100
  decision: 'published' | 'rejected' | 'flagged';
  reason?: string;
  isVerifiedSource: boolean;
}

export class QualityAgent {
  public evaluateOpportunity(opp: Partial<Opportunity>): QualityEvaluationResult {
    console.log(`[Agent 3: Quality] Evaluating opportunity: ${opp.title}...`);

    let score = 70;
    const lowerText = (opp.descriptionFull || '').toLowerCase();

    // 1. Scam & Fee Detection Rule (Zero Tolerance)
    if (lowerText.includes('pay application fee') || lowerText.includes('registration fee r') || lowerText.includes('western union')) {
      return {
        qualityScore: 0,
        decision: 'rejected',
        reason: 'SCAM DETECTED: Illegal application fee requirement detected.',
        isVerifiedSource: false,
      };
    }

    // 2. Data Completeness Checks
    if (opp.title && opp.title.length >= 10) score += 10;
    if (opp.organisation) score += 10;
    if (opp.requiredDocuments && opp.requiredDocuments.length > 0) score += 10;

    // 3. Verified Source Signals (SETAs, Eskom, Transnet, Anglo American)
    const verifiedSources = ['merseta', 'ewseta', 'ceta', 'eskom', 'transnet', 'sasol', 'anglo american', 'city power'];
    const isVerifiedSource = verifiedSources.some(v => (opp.organisation || '').toLowerCase().includes(v) || (opp.sourceName || '').toLowerCase().includes(v));

    if (isVerifiedSource) {
      score += 10;
    }

    const finalScore = Math.min(score, 100);

    return {
      qualityScore: finalScore,
      decision: finalScore >= 60 ? 'published' : 'flagged',
      reason: finalScore >= 60 ? 'Passed automated quality pre-score' : 'Low completeness score',
      isVerifiedSource,
    };
  }
}
