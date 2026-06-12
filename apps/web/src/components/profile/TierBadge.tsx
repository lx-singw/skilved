import { getTierMeta } from "@/lib/profile-completion"
import { cn } from "@/utils/classNames"
import type { ProfileTier } from "@/types/user"
import { BadgeCheck, ShieldCheck } from "lucide-react"

interface TierBadgeProps {
  tier: ProfileTier
  size?: "sm" | "md"
  className?: string
}

export function TierBadge({ tier, size = "md", className }: TierBadgeProps) {
  const meta = getTierMeta(tier)
  const isVerified = tier === "verified"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        meta.bgClass,
        meta.textClass,
        meta.borderClass,
        className,
      )}
    >
      {isVerified ? (
        <ShieldCheck className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      ) : (
        <BadgeCheck className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      )}
      {meta.label}
    </span>
  )
}
