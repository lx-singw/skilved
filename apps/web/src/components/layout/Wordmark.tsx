import { cn } from "@/utils/classNames"

interface WordmarkProps {
  /** Size of the leading "S" badge + text. */
  size?: "sm" | "md"
  /** Hide the square "S" badge and only show the wordmark text. */
  hideBadge?: boolean
  className?: string
}

/**
 * The Skilved wordmark: SKIL in brand red, VED in brand green.
 * Used in the header, the portable profile badge, and anywhere the
 * brand name is displayed.
 */
export function Wordmark({ size = "md", hideBadge = false, className }: WordmarkProps) {
  const badgeSize = size === "sm" ? "h-7 w-7 text-sm" : "h-8 w-8 text-base"
  const textSize = size === "sm" ? "text-sm" : "text-lg"

  return (
    <span className={cn("flex items-center gap-2", className)}>
      {!hideBadge && (
        <span
          className={cn(
            "flex items-center justify-center rounded-md bg-primary font-bold text-primary-foreground",
            badgeSize,
          )}
          aria-hidden
        >
          S
        </span>
      )}
      <span className={cn("font-bold tracking-tight", textSize)}>
        <span className="text-brand-red">SKIL</span>
        <span className="text-brand-green">VED</span>
      </span>
    </span>
  )
}
