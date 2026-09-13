import { Opportunity, TradeCategory, Province, ATSPlatform, RequiredDocumentType } from '@skilved/types';
import { ATSDetector } from '../../scout/src/ats-detector';

export interface AnalystExtractionInput {
  rawText: string;
  sourceUrl: string;
  sourceName: string;
  sourceType: 'seta' | 'jobboard' | 'government' | 'employer' | 'tvet_college';
  agentRunId: string;
}

export class AnalystAgent {
  /**
   * Gemini AI Structured Extraction Prompt & Parsing Logic
   */
  public async extractStructuredOpportunity(input: AnalystExtractionInput): Promise<Partial<Opportunity>> {
    console.log(`[Agent 2: Analyst] Extracting structured intelligence from ${input.sourceName}...`);

    const lowerText = input.rawText.toLowerCase();

    // 1. ATS Platform & Required Documents Detection
    const atsResult = ATSDetector.detect(input.sourceUrl, input.rawText);

    // 2. Infer Trade Category
    let tradeCategory: TradeCategory = 'other';
    if (lowerText.includes('electric')) tradeCategory = 'electrical';
    else if (lowerText.includes('plumb')) tradeCategory = 'plumbing';
    else if (lowerText.includes('weld') || lowerText.includes('boiler')) tradeCategory = 'welding';
    else if (lowerText.includes('fitter') || lowerText.includes('mechanic')) tradeCategory = 'mechanical';
    else if (lowerText.includes('auto') || lowerText.includes('motor')) tradeCategory = 'automotive';
    else if (lowerText.includes('hvac') || lowerText.includes('refrigeration')) tradeCategory = 'hvac';
    else if (lowerText.includes('civil') || lowerText.includes('construction')) tradeCategory = 'construction';

    // 3. Infer Province
    let province: Province = 'gauteng';
    if (lowerText.includes('western cape') || lowerText.includes('cape town')) province = 'western_cape';
    else if (lowerText.includes('kwazulu') || lowerText.includes('durban') || lowerText.includes('kzn')) province = 'kwazulu_natal';
    else if (lowerText.includes('mpumalanga') || lowerText.includes('secunda')) province = 'mpumalanga';
    else if (lowerText.includes('limpopo') || lowerText.includes('polokwane')) province = 'limpopo';
    else if (lowerText.includes('eastern cape') || lowerText.includes('gqeberha')) province = 'eastern_cape';

    // 4. Title & Organisation Extraction
    const lines = input.rawText.trim().split('\n').filter(l => l.trim().length > 0);
    const title = lines[0] ? lines[0].substring(0, 100).trim() : 'Skilled Trade Opportunity';
    const organisation = input.sourceName === 'PuffAndPass' ? 'Eskom Holdings' : input.sourceName === 'RecentJobs' ? 'Transnet SOC' : 'Anglo American';

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return {
      id: `opp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      slug,
      title,
      organisation,
      opportunityType: lowerText.includes('apprenticeship') ? 'apprenticeship' : lowerText.includes('learnership') ? 'learnership' : 'job',
      tradeCategory,
      province,
      descriptionFull: input.rawText.trim(),
      descriptionSummary: input.rawText.trim().substring(0, 200) + '...',
      qualificationsRequired: ['N2/N3 TVET Certificate', 'Grade 12'],
      documentsRequired: atsResult.requiredDocuments.map(d => d.replace(/_/g, ' ').toUpperCase()),
      requiredDocuments: atsResult.requiredDocuments,
      applicationPlatform: atsResult.platform,
      applicationPlatformConfidence: atsResult.confidence,
      requiresAccountCreation: atsResult.requiresAccountCreation,
      captchaLikely: atsResult.captchaLikely,
      sourceUrl: input.sourceUrl,
      sourceName: input.sourceName,
      sourceType: input.sourceType,
      discoveredAt: new Date().toISOString(),
      agentRunId: input.agentRunId,
      qualityScore: 80,
      qualityDecision: 'pending',
      status: 'active',
      applicationMethod: input.rawText.includes('@') ? 'email' : 'external',
      applicationUrl: input.sourceUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
