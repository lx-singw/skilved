import { cn } from "@/utils/classNames"

/**
 * A "New" or "Closing Soon" status badge shown at the top-left of a card.
 */
export function StatusBadge({
  variant,
  className,
}: {
  variant: "new" | "closing-soon"
  className?: string
}) {
  if (variant === "new") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-verified px-2 py-0.5 text-xs font-semibold text-verified-foreground",
          className,
        )}
      >
        New
      </span>
    )
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-amber px-2 py-0.5 text-xs font-semibold text-amber-foreground",
        className,
      )}
    >
      Closing soon
    </span>
  )
}
