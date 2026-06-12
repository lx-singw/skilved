import { getTrade } from "@/constants/trades"
import type { TradeId } from "@/constants/trades"

interface ProfileTradeProps {
  tradeId: TradeId
  yearsExperience?: number
}

export function ProfileTrade({ tradeId, yearsExperience }: ProfileTradeProps) {
  const trade = getTrade(tradeId)

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div
        className="flex h-10 w-10 flex-none items-center justify-center rounded-lg"
        style={{ backgroundColor: `${trade.color}18` }}
        aria-hidden
      >
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: trade.color }}
        />
      </div>
      <div>
        <p className="font-semibold text-foreground">{trade.label}</p>
        <p className="text-xs text-muted-foreground">
          Primary trade{yearsExperience ? ` · ${yearsExperience}+ years` : ""}
        </p>
      </div>
    </div>
  )
}
