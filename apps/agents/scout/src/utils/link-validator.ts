export interface ExtractedLinkResult {
  canonicalLink: string;
  isDirectCompanyLink: boolean;
  linkQuality: 'direct_apply' | 'description_link' | 'aggregator_fallback';
  confidenceScore: number;
}

export class LinkValidator {
  private static aggregatorDomains = [
    'puffandpass.co.za',
    'recentjobs.co.za',
    'studentroom.co.za',
    'indeed.com',
    'careers24.com',
    'pnet.co.za',
  ];

  public static isAggregatorDomain(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return this.aggregatorDomains.some(domain => hostname.includes(domain));
    } catch {
      return false;
    }
  }

  public static isCanonicalLink(url: string): boolean {
    return !this.isAggregatorDomain(url) && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:'));
  }

  public static processOpportunityLink(rawUrl: string, candidateLinks: string[] = []): ExtractedLinkResult {
    // Look for first direct company link among candidates
    const directLink = candidateLinks.find(link => this.isCanonicalLink(link));

    if (directLink) {
      return {
        canonicalLink: directLink,
        isDirectCompanyLink: true,
        linkQuality: 'direct_apply',
        confidenceScore: 90,
      };
    }

    if (this.isCanonicalLink(rawUrl)) {
      return {
        canonicalLink: rawUrl,
        isDirectCompanyLink: true,
        linkQuality: 'direct_apply',
        confidenceScore: 85,
      };
    }

    // Fallback to aggregator source URL
    return {
      canonicalLink: rawUrl,
      isDirectCompanyLink: false,
      linkQuality: 'aggregator_fallback',
      confidenceScore: 60,
    };
  }
}
