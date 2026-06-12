import type { UserProfile, ProfileTier, TierMeta } from "@/types/user"

// ---------------------------------------------------------------------------
// Tier metadata — mirrors the 5-tier progression from the PRD
// ---------------------------------------------------------------------------

export const TIERS: TierMeta[] = [
  {
    id: "starter",
    label: "Starter",
    minPct: 0,
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    borderClass: "border-border",
  },
  {
    id: "active",
    label: "Active",
    minPct: 25,
    bgClass: "bg-amber/10",
    textClass: "text-amber",
    borderClass: "border-amber/40",
  },
  {
    id: "strong",
    label: "Strong",
    minPct: 50,
    bgClass: "bg-primary/10",
    textClass: "text-primary",
    borderClass: "border-primary/40",
  },
  {
    id: "skilved",
    label: "Skilved",
    minPct: 75,
    bgClass: "bg-primary/15",
    textClass: "text-primary",
    borderClass: "border-primary",
  },
  {
    id: "verified",
    label: "Verified",
    minPct: 95,
    bgClass: "bg-verified/10",
    textClass: "text-verified",
    borderClass: "border-verified/40",
  },
]

export const TIER_MAP: Record<ProfileTier, TierMeta> = TIERS.reduce(
  (acc, t) => {
    acc[t.id] = t
    return acc
  },
  {} as Record<ProfileTier, TierMeta>,
)

export function getTierMeta(tier: ProfileTier): TierMeta {
  return TIER_MAP[tier]
}

// ---------------------------------------------------------------------------
// Completion scoring — each field is worth a fixed number of points
// ---------------------------------------------------------------------------

interface CompletionField {
  key: string
  points: number
  label: string
  hint: string
}

export const COMPLETION_FIELDS: CompletionField[] = [
  { key: "displayName",  points: 10, label: "Full name",      hint: "Add your full name" },
  { key: "headline",     points: 10, label: "Headline",       hint: "Add a short headline" },
  { key: "bio",          points: 10, label: "About",          hint: "Write a short bio" },
  { key: "city",         points:  5, label: "City",           hint: "Add your city" },
  { key: "province",     points:  5, label: "Province",       hint: "Select your province" },
  { key: "primaryTrade", points: 10, label: "Primary trade",  hint: "Pick your main trade" },
  { key: "workHistory",  points: 20, label: "Work history",   hint: "Add at least one role" },
  { key: "certificates", points: 20, label: "Certificates",   hint: "Add at least one certificate" },
  { key: "careerPlan",   points: 10, label: "Career plan",    hint: "Let the Career agent build your plan" },
]

export interface CompletionResult {
  pct: number
  points: number
  maxPoints: number
  tier: ProfileTier
  missing: CompletionField[]
}

export function computeCompletion(profile: UserProfile): CompletionResult {
  const maxPoints = COMPLETION_FIELDS.reduce((s, f) => s + f.points, 0)
  let points = 0
  const missing: CompletionField[] = []

  for (const field of COMPLETION_FIELDS) {
    const value = profile[field.key as keyof UserProfile]
    const filled =
      field.key === "workHistory"
        ? Array.isArray(value) && (value as unknown[]).length > 0
        : field.key === "certificates"
          ? Array.isArray(value) && (value as unknown[]).length > 0
          : field.key === "careerPlan"
            ? value != null
            : typeof value === "string" && value.trim().length > 0

    if (filled) {
      points += field.points
    } else {
      missing.push(field)
    }
  }

  const pct = Math.round((points / maxPoints) * 100)
  const tier = deriveTier(pct, !!profile.verifiedAt)

  return { pct, points, maxPoints, tier, missing }
}

function deriveTier(pct: number, isVerified: boolean): ProfileTier {
  if (isVerified && pct >= 95) return "verified"
  if (pct >= 75) return "skilved"
  if (pct >= 50) return "strong"
  if (pct >= 25) return "active"
  return "starter"
}
