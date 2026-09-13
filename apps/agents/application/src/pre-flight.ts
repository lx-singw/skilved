import { Opportunity, SkillsPassport, IdentityDocument, RequiredDocumentType } from '@skilved/types';

export interface PreFlightCheckResult {
  opportunityId: string;
  userId: string;
  status: 'PRE_FLIGHT_PASSED' | 'PRE_FLIGHT_HELD';
  missingDocuments: RequiredDocumentType[];
  attachedDocuments: { documentType: RequiredDocumentType; storageUri: string }[];
  heldReason?: string;
  reviewConfirmedRequired: boolean;
  applicationPlatform: string;
  checkedAt: string;
}

export class ApplicationPreFlightEngine {
  public checkPreFlight(
    passport: SkillsPassport,
    opportunity: Partial<Opportunity>,
    userDocuments: IdentityDocument[] = []
  ): PreFlightCheckResult {
    console.log(`[Agent 6: Application Pre-Flight] Checking candidate ${passport.userId} for opp ${opportunity.id}...`);

    const requiredDocs: RequiredDocumentType[] = opportunity.requiredDocuments || ['cv', 'sa_id'];
    const userDocTypesMap = new Map<string, string>();

    userDocuments.forEach(doc => {
      userDocTypesMap.set(doc.documentType, doc.storageUri);
    });

    // Auto-attach CV from SkillsPassport if available
    if (!userDocTypesMap.has('cv')) {
      userDocTypesMap.set('cv', `gs://skilved-vault/cvs/${passport.userId}_cv.pdf`);
    }

    const missingDocuments: RequiredDocumentType[] = [];
    const attachedDocuments: { documentType: RequiredDocumentType; storageUri: string }[] = [];

    for (const reqDoc of requiredDocs) {
      if (userDocTypesMap.has(reqDoc)) {
        attachedDocuments.push({
          documentType: reqDoc,
          storageUri: userDocTypesMap.get(reqDoc)!,
        });
      } else {
        missingDocuments.push(reqDoc);
      }
    }

    const isPassed = missingDocuments.length === 0;

    return {
      opportunityId: opportunity.id || '',
      userId: passport.userId,
      status: isPassed ? 'PRE_FLIGHT_PASSED' : 'PRE_FLIGHT_HELD',
      missingDocuments,
      attachedDocuments,
      heldReason: isPassed
        ? undefined
        : `APPLICATION HELD: Missing ${missingDocuments.map(d => d.replace(/_/g, ' ').toUpperCase()).join(', ')}. Skilved never submits incomplete applications.`,
      reviewConfirmedRequired: true,
      applicationPlatform: opportunity.applicationPlatform || 'unknown',
      checkedAt: new Date().toISOString(),
    };
  }
}
