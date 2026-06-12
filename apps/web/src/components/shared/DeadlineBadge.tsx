import { CalendarClock } from "lucide-react"
import { formatDate, daysUntil } from "@/utils/formatting"
import { cn } from "@/utils/classNames"

export function DeadlineBadge({
  closesAt,
  className,
}: {
  closesAt: string | null
  className?: string
}) {
  const days = daysUntil(closesAt)
  const expired = days !== null && days < 0
  const closingSoon = days !== null && days >= 0 && days <= 3

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        expired
          ? "text-muted-foreground line-through"
          : closingSoon
            ? "font-medium text-amber animate-pulse-deadline"
            : "text-muted-foreground",
        className,
      )}
    >
      <CalendarClock className="h-3 w-3" aria-hidden />
      {expired ? "Closed" : `Closes ${formatDate(closesAt)}`}
    </span>
  )
}
