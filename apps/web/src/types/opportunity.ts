import type { TradeId } from "@/constants/trades"
import type { ProvinceId } from "@/constants/provinces"
import type { OpportunityTypeId } from "@/constants/opportunityTypes"

export type SalaryKind = "stipend" | "salary" | "funded" | "market-related"

export interface OpportunitySalary {
  kind: SalaryKind
  /** Lower bound in ZAR per month. Omitted for funded/market-related. */
  min?: number
  /** Upper bound in ZAR per month. */
  max?: number
}

export type MatchStrength = "strong" | "good" | "fair"

export interface Opportunity {
  id: string
  slug: string
  title: string
  organisation: string
  /** City name, e.g. "Johannesburg". */
  city: string
  province: ProvinceId
  trade: TradeId
  type: OpportunityTypeId
  salary: OpportunitySalary
  /** ISO timestamp the agent discovered this opportunity. */
  foundAt: string
  /** ISO date the opportunity closes, or null for "Open until filled". */
  closesAt: string | null
  /** Short plain-language description. */
  summary: string
  /** AI-generated honest summary shown on the detail page. */
  aiSummary?: string
  requirements: string[]
  /** Outbound application URL. */
  applyUrl: string
  /** Source SETA / board the agent crawled. */
  source: string
  /** MyMzansi / org verified. */
  verified: boolean
  /** Anonymous relevance match (0-100), set by matching layer. */
  matchScore?: number
  matchStrength?: MatchStrength
  matchReason?: string
}
