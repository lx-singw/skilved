import { BadgeCheck } from "lucide-react"
import { cn } from "@/utils/classNames"

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-primary px-2 py-0.5 text-xs font-medium text-primary",
        className,
      )}
    >
      <BadgeCheck className="h-3 w-3" aria-hidden />
      Verified
    </span>
  )
}
