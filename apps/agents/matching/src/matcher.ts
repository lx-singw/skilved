import { Opportunity, SkillsPassport } from '@skilved/types';

export interface MatchScoreResult {
  opportunityId: string;
  matchScore: number; // 0-100
  matchLevel: 'perfect' | 'strong' | 'moderate' | 'potential';
  matchingReasons: string[];
}

export class MatchingAgent {
  /**
   * Ranks an array of opportunities against a candidate's SkillsPassport
   */
  public rankOpportunities(passport: SkillsPassport, opportunities: Partial<Opportunity>[]): (Partial<Opportunity> & { matchResult: MatchScoreResult })[] {
    console.log(`[Agent 4: Matching] Ranking ${opportunities.length} opportunities for user ${passport.userId}...`);

    return opportunities
      .map(opp => {
        let score = 50;
        const reasons: string[] = [];

        // 1. Trade Category Fit
        if (opp.tradeCategory === passport.primaryTrade) {
          score += 30;
          reasons.push(`Direct match for your trade: ${passport.primaryTrade}`);
        }

        // 2. Province Location Fit
        if (opp.province === passport.province || opp.province === 'national' || passport.willingToRelocate) {
          score += 15;
          reasons.push(`Location fit in ${opp.province}`);
        }

        // 3. Trade Tested Requirement Fit
        if (opp.tradeTested && passport.tradeTested) {
          score += 10;
          reasons.push('Matches required Red Seal Trade Test certification');
        }

        const matchScore = Math.min(score, 100);
        let matchLevel: 'perfect' | 'strong' | 'moderate' | 'potential' = 'potential';
        if (matchScore >= 90) matchLevel = 'perfect';
        else if (matchScore >= 75) matchLevel = 'strong';
        else if (matchScore >= 60) matchLevel = 'moderate';

        return {
          ...opp,
          matchResult: {
            opportunityId: opp.id || '',
            matchScore,
            matchLevel,
            matchingReasons: reasons,
          },
        };
      })
      .sort((a, b) => b.matchResult.matchScore - a.matchResult.matchScore);
  }

  /**
   * Generates Redis Feed Cache Key
   */
  public getRedisFeedKey(trade: string, province: string, sort: string = 'freshness'): string {
    return `feed:anon:${trade}:${province}:${sort}`;
  }
}
