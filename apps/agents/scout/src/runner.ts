import { PuffAndPassCrawler } from './sources/jobboards/PuffAndPassCrawler';
import { RecentJobsCrawler } from './sources/jobboards/RecentJobsCrawler';
import { StudentRoomCrawler } from './sources/jobboards/StudentRoomCrawler';
import { ATSDetector } from './ats-detector';
import { LinkValidator } from './utils/link-validator';
import { FingerprintGenerator } from './utils/fingerprint';
import { Opportunity, TradeCategory, Province } from '@skilved/types';

export class ScoutRunner {
  private crawlers = [
    new PuffAndPassCrawler(),
    new RecentJobsCrawler(),
    new StudentRoomCrawler(),
  ];

  async runDiscoveryCycle(): Promise<Partial<Opportunity>[]> {
    const runId = `scout_run_${Date.now()}`;
    console.log(`[Scout Agent] Starting discovery cycle run ID: ${runId}`);

    const discoveredOpps: Partial<Opportunity>[] = [];

    for (const crawler of this.crawlers) {
      console.log(`[Scout Agent] Ingesting from portal: ${crawler.sourceName}...`);
      const rawItems = await crawler.fetchRawOpportunities();

      for (const item of rawItems) {
        // 1. Link Validation & Canonical Link Extraction
        const linkResult = LinkValidator.processOpportunityLink(item.sourceUrl);

        // 2. Cross-Source Fingerprint Generation
        const fingerprint = FingerprintGenerator.generate(item.title, item.companyName);

        // 3. ATS Detection & Document Requirements
        const atsResult = ATSDetector.detect(item.sourceUrl, item.rawText);

        // 4. Trade & Province Classification Heuristics
        let tradeCategory: TradeCategory = 'other';
        const lowerText = (item.title + ' ' + item.rawText).toLowerCase();

        if (lowerText.includes('electric')) tradeCategory = 'electrical';
        else if (lowerText.includes('plumb')) tradeCategory = 'plumbing';
        else if (lowerText.includes('weld') || lowerText.includes('boiler')) tradeCategory = 'welding';
        else if (lowerText.includes('fitter') || lowerText.includes('mechanic')) tradeCategory = 'mechanical';
        else if (lowerText.includes('auto') || lowerText.includes('motor')) tradeCategory = 'automotive';

        let province: Province = 'gauteng';
        if (lowerText.includes('western cape') || lowerText.includes('cape town')) province = 'western_cape';
        else if (lowerText.includes('kwazulu') || lowerText.includes('durban') || lowerText.includes('kzn')) province = 'kwazulu_natal';
        else if (lowerText.includes('mpumalanga') || lowerText.includes('secunda')) province = 'mpumalanga';
        else if (lowerText.includes('limpopo') || lowerText.includes('polokwane')) province = 'limpopo';
        else if (lowerText.includes('eastern cape') || lowerText.includes('gqeberha')) province = 'eastern_cape';

        const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const parsedOpp: Partial<Opportunity> & { fingerprint: string } = {
          id: `opp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          slug,
          title: item.title,
          organisation: item.companyName,
          opportunityType: lowerText.includes('apprenticeship') ? 'apprenticeship' : lowerText.includes('learnership') ? 'learnership' : 'job',
          tradeCategory,
          province,
          city: item.locationText,
          descriptionFull: item.rawText.trim(),
          descriptionSummary: item.rawText.trim().substring(0, 180) + '...',
          qualificationsRequired: ['N2/N3 TVET Certificate', 'Grade 12'],
          documentsRequired: atsResult.requiredDocuments.map(d => d.replace(/_/g, ' ').toUpperCase()),
          requiredDocuments: atsResult.requiredDocuments,
          applicationPlatform: atsResult.platform,
          applicationPlatformConfidence: atsResult.confidence,
          requiresAccountCreation: atsResult.requiresAccountCreation,
          captchaLikely: atsResult.captchaLikely,
          sourceUrl: item.sourceUrl,
          sourceName: item.sourceName,
          sourceType: crawler.sourceType,
          discoveredAt: item.scrapedAt,
          agentRunId: runId,
          qualityScore: linkResult.confidenceScore,
          qualityDecision: 'published',
          status: 'active',
          applicationMethod: item.rawText.includes('@') ? 'email' : 'external',
          applicationEmail: item.rawText.includes('@') ? 'learnerships@transnet.net' : undefined,
          applicationUrl: linkResult.canonicalLink,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          fingerprint,
        };

        discoveredOpps.push(parsedOpp);
      }
    }

    console.log(`[Scout Agent] Ingestion completed. ${discoveredOpps.length} opportunities indexed across PuffAndPass, RecentJobs, and StudentRoom.`);
    return discoveredOpps;
  }
}
