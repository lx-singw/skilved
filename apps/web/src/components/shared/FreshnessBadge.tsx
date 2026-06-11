import { Sparkles } from "lucide-react"
import { formatFreshness, hoursSince } from "@/utils/formatting"
import { cn } from "@/utils/classNames"

export function FreshnessBadge({
  foundAt,
  className,
}: {
  foundAt: string
  className?: string
}) {
  const fresh = hoursSince(foundAt) < 24
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        fresh ? "text-verified" : "text-muted-foreground",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" aria-hidden />
      {formatFreshness(foundAt)}
    </span>
  )
}
