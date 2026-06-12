/**
 * Portable embeddable badge — the canonical "Skilved career identity" block
 * that workers share in CVs, WhatsApp, and LinkedIn bios.
 */
import { TierBadge } from "@/components/profile/TierBadge"
import { getTrade } from "@/constants/trades"
import { getProvince } from "@/constants/provinces"
import type { UserProfile } from "@/types/user"

interface SkilvedBadgeProps {
  profile: UserProfile
}

export function SkilvedBadge({ profile }: SkilvedBadgeProps) {
  const trade = getTrade(profile.primaryTrade)
  const province = getProvince(profile.province)

  return (
    <div className="inline-flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
            aria-hidden
          >
            S
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">SKILVD</span>
        </div>
        <TierBadge tier={profile.tier} size="sm" />
      </div>

      {/* Identity */}
      <div>
        <p className="font-semibold text-foreground">{profile.displayName}</p>
        {profile.headline && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {profile.headline}
          </p>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className="rounded-full px-2 py-0.5 font-medium"
          style={{ backgroundColor: `${trade.color}18`, color: trade.color }}
        >
          {trade.label}
        </span>
        <span className="text-border">·</span>
        <span>{province.abbr}</span>
        <span className="text-border">·</span>
        <span>{profile.completionPct}% complete</span>
      </div>

      {/* Link */}
      <p className="font-mono text-[10px] text-muted-foreground/60">
        skilved.com/{profile.username}
      </p>
    </div>
  )
}
