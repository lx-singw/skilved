import { getTrade, type TradeId } from "@/constants/trades"
import { cn } from "@/utils/classNames"

export function TradeBadge({
  trade,
  className,
}: {
  trade: TradeId
  className?: string
}) {
  const t = getTrade(trade)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={{ borderColor: t.color, color: t.color }}
    >
      <span
        aria-hidden
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: t.color }}
      />
      {t.label}
    </span>
  )
}
