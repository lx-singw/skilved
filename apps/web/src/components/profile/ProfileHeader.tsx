import { TierBadge } from "@/components/profile/TierBadge"
import { TradeBadge } from "@/components/shared/TradeBadge"
import { ProvincePill } from "@/components/shared/ProvincePill"
import { MapPin } from "lucide-react"
import type { UserProfile } from "@/types/user"

interface ProfileHeaderProps {
  profile: UserProfile
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const initials = getInitials(profile.displayName)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
      {/* Avatar */}
      <div
        className="flex h-20 w-20 flex-none items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary sm:h-24 sm:w-24"
        aria-hidden
      >
        {initials}
      </div>

      {/* Identity */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
            {profile.displayName}
          </h1>
          <TierBadge tier={profile.tier} size="sm" />
        </div>

        {profile.headline && (
          <p className="text-sm leading-relaxed text-muted-foreground">{profile.headline}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" aria-hidden />
            {profile.city}
          </span>
          <ProvincePill province={profile.province} />
          <TradeBadge trade={profile.primaryTrade} />
        </div>

        <p className="font-mono text-xs text-muted-foreground/60">
          skilved.com/{profile.username}
        </p>
      </div>
    </div>
  )
}
