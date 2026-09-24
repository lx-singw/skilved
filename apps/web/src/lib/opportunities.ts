import type { Opportunity } from "@/types/opportunity"

// No reviewed public inventory exists yet. Legacy samples are isolated under
// prototype/ and must never be used as a fallback for public catalogue failures.
const PUBLISHED_OPPORTUNITIES: readonly Opportunity[] = []

export function getAllOpportunities(): Opportunity[] {
  return [...PUBLISHED_OPPORTUNITIES]
}

export function getOpportunityBySlug(slug: string): Opportunity | undefined {
  return PUBLISHED_OPPORTUNITIES.find((opportunity) => opportunity.slug === slug)
}

export function getRelatedOpportunities(opportunity: Opportunity, limit = 3): Opportunity[] {
  return PUBLISHED_OPPORTUNITIES.filter(
    (candidate) => candidate.id !== opportunity.id &&
      (candidate.trade === opportunity.trade || candidate.province === opportunity.province),
  ).slice(0, limit)
}
