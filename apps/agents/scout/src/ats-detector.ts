import { ATSPlatform, RequiredDocumentType } from '@skilved/types';

export interface ATSDetectionResult {
  platform: ATSPlatform;
  confidence: 'high' | 'medium' | 'low';
  requiresAccountCreation: boolean;
  captchaLikely: boolean;
  requiredDocuments: RequiredDocumentType[];
}

export class ATSDetector {
  public static detect(url: string, htmlContent: string = ''): ATSDetectionResult {
    const lowerUrl = url.toLowerCase();
    const lowerHtml = htmlContent.toLowerCase();

    let platform: ATSPlatform = 'unknown';
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let requiresAccountCreation = false;
    let captchaLikely = false;

    // Pattern matching for major ATS platforms
    if (lowerUrl.includes('successfactors') || lowerHtml.includes('sap successfactors')) {
      platform = 'successfactors';
      confidence = 'high';
      requiresAccountCreation = true;
      captchaLikely = true;
    } else if (lowerUrl.includes('taleo.net') || lowerHtml.includes('oracle taleo')) {
      platform = 'oracle_taleo';
      confidence = 'high';
      requiresAccountCreation = true;
      captchaLikely = false;
    } else if (lowerUrl.includes('pageuppeople.com') || lowerHtml.includes('pageup')) {
      platform = 'pageup';
      confidence = 'high';
      requiresAccountCreation = true;
    } else if (lowerUrl.includes('merseta.org.za') || lowerHtml.includes('merseta')) {
      platform = 'merseta_portal';
      confidence = 'high';
    } else if (lowerUrl.includes('ewseta.org.za') || lowerHtml.includes('ewseta')) {
      platform = 'ewseta_portal';
      confidence = 'high';
    } else if (lowerUrl.includes('ceta.org.za') || lowerHtml.includes('ceta')) {
      platform = 'ceta_portal';
      confidence = 'high';
    } else if (url.startsWith('mailto:') || lowerHtml.includes('send your cv to')) {
      platform = 'email_only';
      confidence = 'high';
    } else if (lowerUrl.includes('puffandpass') || lowerUrl.includes('recentjobs') || lowerUrl.includes('studentroom')) {
      platform = 'job_board_hosted';
      confidence = 'medium';
    } else {
      platform = 'direct_web_form';
      confidence = 'medium';
    }

    // Required Documents Extraction Regex Rules
    const requiredDocuments: RequiredDocumentType[] = [];

    if (/certified copy of id|sa id|identity document|id copy/i.test(lowerHtml)) {
      requiredDocuments.push('sa_id');
    }
    if (/tvet|n1|n2|n3|n4|n5|n6|national diploma|diploma/i.test(lowerHtml)) {
      requiredDocuments.push('tvet_certificate');
    }
    if (/trade test|red seal|artisan certificate/i.test(lowerHtml)) {
      requiredDocuments.push('trade_test_certificate');
    }
    if (/proof of (address|residence)|utility bill/i.test(lowerHtml)) {
      requiredDocuments.push('proof_of_address');
    }
    if (/matric|grade 12|senior certificate/i.test(lowerHtml)) {
      requiredDocuments.push('matric_certificate');
    }
    if (/driver'?s? licen[sc]e|code (8|10|14)/i.test(lowerHtml)) {
      requiredDocuments.push('driver_licence');
    }
    if (/wireman'?s? licen[sc]e|installation electrician/i.test(lowerHtml)) {
      requiredDocuments.push('wiremans_licence');
    }
    // Default fallback: every application requires CV
    if (!requiredDocuments.includes('cv')) {
      requiredDocuments.push('cv');
    }

    return {
      platform,
      confidence,
      requiresAccountCreation,
      captchaLikely,
      requiredDocuments,
    };
  }
}
