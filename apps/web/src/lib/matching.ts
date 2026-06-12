import type { Opportunity } from "@/types/opportunity"
import type { FeedFilters, SalaryBand, ClosingWindow } from "@/types/filter"
import { daysUntil, hoursSince } from "@/utils/formatting"

/** Whether an opportunity is past its closing date. */
export function isExpired(o: Opportunity, now: Date = new Date()): boolean {
  if (!o.closesAt) return false
  return new Date(o.closesAt).getTime() < now.getTime()
}

/** Fresh = discovered within the last 24 hours. */
export function isFresh(o: Opportunity, now: Date = new Date()): boolean {
  return hoursSince(o.foundAt, now) < 24
}

/** Closing soon = within the next 72 hours and not expired. */
export function isClosingSoon(o: Opportunity, now: Date = new Date()): boolean {
  const days = daysUntil(o.closesAt, now)
  return days !== null && days >= 0 && days <= 3
}

function matchesSalaryBand(o: Opportunity, band: SalaryBand): boolean {
  if (band === "any") return true
  const min = o.salary.min ?? 0
  switch (band) {
    case "funded":
      return o.salary.kind === "funded"
    case "3k-6k":
      return min >= 3000 && min < 6000
    case "6k-12k":
      return min >= 6000 && min < 12000
    case "12k-plus":
      return min >= 12000
    default:
      return true
  }
}

function matchesClosingWindow(
  o: Opportunity,
  window: ClosingWindow,
  now: Date,
): boolean {
  if (window === "any") return true
  const days = daysUntil(o.closesAt, now)
  if (days === null) return window === "any"
  if (days < 0) return false
  if (window === "this-week") return days <= 7
  if (window === "this-month") return days <= 31
  return true
}

/** Apply all active filters to the opportunity list. */
export function applyFilters(
  opportunities: Opportunity[],
  filters: FeedFilters,
  now: Date = new Date(),
): Opportunity[] {
  return opportunities.filter((o) => {
    if (filters.trade !== "all" && o.trade !== filters.trade) return false
    if (filters.province !== "all" && o.province !== filters.province) return false
    if (filters.types.length > 0 && !filters.types.includes(o.type)) return false
    if (!matchesSalaryBand(o, filters.salary)) return false
    if (!matchesClosingWindow(o, filters.closing, now)) return false
    return true
  })
}

/**
 * Anonymous relevance score (0-100) per the feed plan formula:
 * trade_match * 0.40 + province_match * 0.25 + freshness * 0.20 + quality * 0.15
 */
export function relevanceScore(
  o: Opportunity,
  filters: FeedFilters,
  now: Date = new Date(),
): number {
  const tradeMatch = filters.trade !== "all" && o.trade === filters.trade ? 1 : 0.5
  const provinceMatch =
    filters.province !== "all" && o.province === filters.province ? 1 : 0.5
  const hrs = hoursSince(o.foundAt, now)
  const freshness = Math.max(0, 1 - hrs / 168) // decays over 7 days
  const quality = o.verified ? 1 : 0.6

  return Math.round(
    (tradeMatch * 0.4 +
      provinceMatch * 0.25 +
      freshness * 0.2 +
      quality * 0.15) *
      100,
  )
}

/** Sort opportunities according to the selected mode, pushing expired to the end. */
export function sortOpportunities(
  opportunities: Opportunity[],
  filters: FeedFilters,
  now: Date = new Date(),
): Opportunity[] {
  const list = [...opportunities]

  list.sort((a, b) => {
    const aExpired = isExpired(a, now)
    const bExpired = isExpired(b, now)
    if (aExpired !== bExpired) return aExpired ? 1 : -1

    switch (filters.sort) {
      case "newest":
        return new Date(b.foundAt).getTime() - new Date(a.foundAt).getTime()
      case "closing-soon": {
        const aDays = daysUntil(a.closesAt, now) ?? Number.POSITIVE_INFINITY
        const bDays = daysUntil(b.closesAt, now) ?? Number.POSITIVE_INFINITY
        return aDays - bDays
      }
      case "relevance":
      default:
        return relevanceScore(b, filters, now) - relevanceScore(a, filters, now)
    }
  })

  return list
}

/** Convenience: filter + sort in one pass. */
export function buildFeed(
  opportunities: Opportunity[],
  filters: FeedFilters,
  now: Date = new Date(),
): Opportunity[] {
  return sortOpportunities(applyFilters(opportunities, filters, now), filters, now)
}
