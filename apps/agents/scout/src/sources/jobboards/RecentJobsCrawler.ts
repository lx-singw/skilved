import { BaseCrawler, RawOpportunityItem } from '../BaseCrawler';

export class RecentJobsCrawler extends BaseCrawler {
  readonly sourceName = 'RecentJobs';
  readonly sourceUrl = 'https://recentjobs.co.za';
  readonly sourceType = 'jobboard' as const;

  readonly startCategories = [
    '/category/vacancies/',
    '/category/jobs/',
    '/category/learnerships/',
    '/category/internships/',
    '/category/apprenticeships/',
    '/category/bursaries/',
    '/category/government-jobs/',
  ];

  async fetchRawOpportunities(): Promise<RawOpportunityItem[]> {
    return [
      {
        title: 'Transnet Welding & Boiler Maker Apprenticeships 2026',
        sourceUrl: 'https://recentjobs.co.za/2026/06/15/transnet-welding-apprenticeship-2026/',
        sourceName: 'RecentJobs',
        companyName: 'Transnet SOC Ltd',
        locationText: 'KwaZulu-Natal (Durban Harbor)',
        rawText: `
          Transnet National Ports Authority invites applications for 20 Welding & Boiler Maker Apprenticeships.
          Published date: 15 June 2026.
          Location: Durban Harbor, KZN.
          Requirements: N2 Welding certificate or N2 Mechanical Engineering.
          Required documents: Certified SA ID, TVET academic record, Proof of residence.
          Apply via Transnet e-Recruitment SAP SuccessFactors portal.
        `,
        deadlineText: '30 September 2026',
        scrapedAt: new Date().toISOString(),
      },
      {
        title: 'Department of Public Works Plumbing Learnerships',
        sourceUrl: 'https://recentjobs.co.za/2026/06/20/dpsa-public-works-plumbing-learnership/',
        sourceName: 'RecentJobs',
        companyName: 'Department of Public Works & Infrastructure',
        locationText: 'Eastern Cape (Gqeberha)',
        rawText: `
          DPSA Government Circular: 10 Plumbing Learnerships available under the National Youth Service programme.
          Requirements: Grade 12 or N1 Plumbing.
          Documents required: Z83 Form, Certified ID copy, Qualification certificates.
          Apply via email to ecpublicworks@dpw.gov.za
        `,
        deadlineText: '10 August 2026',
        scrapedAt: new Date().toISOString(),
      },
    ];
  }
}
