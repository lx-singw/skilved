import type { TradeId } from "@/constants/trades"
import type { ProvinceId } from "@/constants/provinces"
import type { OpportunityTypeId } from "@/constants/opportunityTypes"

export type SalaryBand = "any" | "funded" | "3k-6k" | "6k-12k" | "12k-plus"
export type ClosingWindow = "any" | "this-week" | "this-month"
export type SortMode = "relevance" | "newest" | "closing-soon"

export interface FeedFilters {
  trade: TradeId | "all"
  province: ProvinceId | "all"
  types: OpportunityTypeId[]
  salary: SalaryBand
  closing: ClosingWindow
  sort: SortMode
}

export const DEFAULT_FILTERS: FeedFilters = {
  trade: "all",
  province: "all",
  types: [],
  salary: "any",
  closing: "any",
  sort: "relevance",
}
