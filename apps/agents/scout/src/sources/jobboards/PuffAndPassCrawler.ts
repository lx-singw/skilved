import { BaseCrawler, RawOpportunityItem } from '../BaseCrawler';

export class PuffAndPassCrawler extends BaseCrawler {
  readonly sourceName = 'PuffAndPass';
  readonly sourceUrl = 'https://puffandpass.co.za';
  readonly sourceType = 'jobboard' as const;

  async fetchRawOpportunities(): Promise<RawOpportunityItem[]> {
    // In Sprint 1 dev mode, returns structured raw opportunity payloads
    // ready for Analyst agent Gemini structured extraction & Firestore publishing
    return [
      {
        title: 'Eskom Electrical Apprenticeship Programme 2026',
        sourceUrl: 'https://puffandpass.co.za/eskom-electrical-apprenticeship-2026',
        sourceName: 'PuffAndPass',
        companyName: 'Eskom Holdings SOC Ltd',
        locationText: 'Gauteng (Midrand)',
        rawText: `
          Eskom is offering an exciting 3-year Electrical Apprenticeship Programme for South African trade workers.
          Location: Midrand, Gauteng
          Requirements: Passed N3 Electrical Engineering or Grade 12 with Mathematics & Physical Science.
          Documents needed: Certified copy of SA ID, N3 Certificate, Proof of Address, CV.
          Closing date: 31 August 2026.
          Apply online via SAP SuccessFactors portal.
        `,
        deadlineText: '31 August 2026',
        scrapedAt: new Date().toISOString(),
      },
      {
        title: 'Sasol Mechanical Fitter Learnership 2026',
        sourceUrl: 'https://puffandpass.co.za/sasol-mechanical-fitter-learnership-2026',
        sourceName: 'PuffAndPass',
        companyName: 'Sasol South Africa',
        locationText: 'Mpumalanga (Secunda)',
        rawText: `
          Sasol invites applications for Mechanical Fitter Learnerships at Secunda Operations.
          Requirements: N2 Mechanical Engineering certificate or Grade 12 Technical.
          Must have: Valid SA ID, TVET transcript, Proof of Residence.
          Stipend: R6,500 / month.
          Application method: Email CV and documents to learnerships@sasol.com
        `,
        deadlineText: '15 September 2026',
        scrapedAt: new Date().toISOString(),
      },
      {
        title: 'City Power Plumbing Artisan Apprenticeship',
        sourceUrl: 'https://puffandpass.co.za/city-power-plumbing-artisan-2026',
        sourceName: 'PuffAndPass',
        companyName: 'City Power Johannesburg',
        locationText: 'Gauteng (Johannesburg)',
        rawText: `
          City Power is recruiting 15 Plumbing Apprentices for a 2-year trade test preparation programme.
          Location: Johannesburg, Gauteng.
          Qualifications: N2 Plumbing / Civil Certificate or NQF Level 3 Plumbing qualification.
          Required documents: Certified SA ID Copy, TVET Certificate, Code 8 Driver's licence preferred.
        `,
        deadlineText: '30 August 2026',
        scrapedAt: new Date().toISOString(),
      },
    ];
  }
}
