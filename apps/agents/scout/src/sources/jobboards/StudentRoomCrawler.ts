import { BaseCrawler, RawOpportunityItem } from '../BaseCrawler';

export interface StructuredRequirements {
  qualifications: {
    minimum: { degreeLevel: string; fieldOfStudy: string };
    ideal?: { degreeLevel: string; fieldOfStudy: string; certifications: string[] };
  };
  experience: {
    minimum: { yearsMin: number; yearsMax?: number; description: string };
    ideal?: { yearsMin: number; description: string };
  };
  skills: Array<{ name: string; level: 'required' | 'preferred' }>;
  knowledge: {
    minimum: string[];
    ideal?: string[];
  };
  conditionsOfEmployment: string[];
}

export interface StudentRoomRawItem extends RawOpportunityItem {
  structuredRequirements: StructuredRequirements;
}

export class StudentRoomCrawler extends BaseCrawler {
  readonly sourceName = 'StudentRoom';
  readonly sourceUrl = 'https://www.studentroom.co.za';
  readonly sourceType = 'jobboard' as const;

  readonly startCategories = [
    '/category/bursaries/',
    '/category/internships/',
    '/category/learnership/',
  ];

  async fetchRawOpportunities(): Promise<StudentRoomRawItem[]> {
    return [
      {
        title: 'Anglo American Mining Electrical Artisan Trainee 2026',
        sourceUrl: 'https://www.studentroom.co.za/anglo-american-electrical-artisan-2026/',
        sourceName: 'StudentRoom',
        companyName: 'Anglo American Platinum',
        locationText: 'Limpopo (Polokwane)',
        rawText: `
          Anglo American Platinum invites applications for Electrical Artisan Trainees.
          Location: Polokwane Operations, Limpopo.
          Requirements: N3 Electrical Engineering or N6 Diploma.
          Must have: Valid SA ID, TVET Certificate, Medical fitness certificate.
          Application method: Direct web form on Anglo American careers portal.
        `,
        deadlineText: '25 August 2026',
        scrapedAt: new Date().toISOString(),
        structuredRequirements: {
          qualifications: {
            minimum: { degreeLevel: 'N3 TVET Certificate', fieldOfStudy: 'Electrical Engineering' },
            ideal: { degreeLevel: 'N6 Diploma', fieldOfStudy: 'Heavy Current Electrical', certifications: ["Wireman's Licence"] },
          },
          experience: {
            minimum: { yearsMin: 0, yearsMax: 1, description: 'Entry level or TVET college graduate' },
            ideal: { yearsMin: 2, description: 'Industrial plant experience' },
          },
          skills: [
            { name: 'Electrical Fault Finding', level: 'required' },
            { name: 'High Voltage Switching', level: 'preferred' },
          ],
          knowledge: {
            minimum: ['Occupational Health & Safety Act (OHSA)', 'SANS 10142 Wiring Code'],
            ideal: ['PLC Programming & SCADA'],
          },
          conditionsOfEmployment: [
            'Medical fitness certificate for underground mining',
            'Clear criminal background check',
          ],
        },
      },
    ];
  }
}
