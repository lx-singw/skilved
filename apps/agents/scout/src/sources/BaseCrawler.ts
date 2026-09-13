import { ATSPlatform, RequiredDocumentType, TradeCategory, Province } from '@skilved/types';

export interface RawOpportunityItem {
  title: string;
  sourceUrl: string;
  sourceName: string;
  companyName: string;
  locationText?: string;
  rawText: string;
  deadlineText?: string;
  scrapedAt: string;
}

export interface ExtractedOpportunityData {
  title: string;
  organisation: string;
  opportunityType: 'apprenticeship' | 'learnership' | 'bursary' | 'job' | 'trade_test' | 'short_course';
  tradeCategory: TradeCategory;
  subTrade?: string;
  province: Province;
  city?: string;
  salaryDisplay?: string;
  descriptionFull: string;
  descriptionSummary: string;
  qualificationsRequired: string[];
  documentsRequired: string[];
  requiredDocuments: RequiredDocumentType[];
  applicationUrl?: string;
  applicationEmail?: string;
  applicationMethod: 'external' | 'email' | 'in_app';
  applicationPlatform: ATSPlatform;
  applicationPlatformConfidence: 'high' | 'medium' | 'low';
  requiresAccountCreation: boolean;
  captchaLikely: boolean;
  sourceUrl: string;
  sourceName: string;
  sourceType: 'seta' | 'jobboard' | 'government' | 'employer' | 'tvet_college';
}

export abstract class BaseCrawler {
  abstract readonly sourceName: string;
  abstract readonly sourceUrl: string;
  abstract readonly sourceType: 'seta' | 'jobboard' | 'government' | 'employer' | 'tvet_college';

  abstract fetchRawOpportunities(): Promise<RawOpportunityItem[]>;
}
