export type TradeId =
  | "electrical"
  | "plumbing"
  | "welding"
  | "automotive"
  | "construction"
  | "hvac"
  | "mechanical"
  | "mining"
  | "ict"
  | "agriculture"
  | "logistics"
  | "clothing"

export interface Trade {
  id: TradeId
  label: string
  /** Tailwind-friendly hex used for the badge dot/border */
  color: string
}

/**
 * The 12 Skilved trade categories.
 * Colours come from the Brand & Design System (doc 11).
 */
export const TRADES: Trade[] = [
  { id: "electrical", label: "Electrical", color: "#D97706" },
  { id: "plumbing", label: "Plumbing", color: "#0284C7" },
  { id: "welding", label: "Welding", color: "#EA580C" },
  { id: "automotive", label: "Automotive", color: "#475569" },
  { id: "construction", label: "Construction", color: "#78716C" },
  { id: "hvac", label: "HVAC", color: "#0891B2" },
  { id: "mechanical", label: "Mechanical", color: "#64748B" },
  { id: "mining", label: "Mining", color: "#CA8A04" },
  { id: "ict", label: "ICT", color: "#7C3AED" },
  { id: "agriculture", label: "Agriculture", color: "#16A34A" },
  { id: "logistics", label: "Logistics", color: "#4338CA" },
  { id: "clothing", label: "Clothing", color: "#DB2777" },
]

export const TRADE_MAP: Record<TradeId, Trade> = TRADES.reduce(
  (acc, trade) => {
    acc[trade.id] = trade
    return acc
  },
  {} as Record<TradeId, Trade>,
)

export function getTrade(id: TradeId): Trade {
  return TRADE_MAP[id]
}
