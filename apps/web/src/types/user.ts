import type { TradeId } from "@/constants/trades"
import type { ProvinceId } from "@/constants/provinces"

// ---------------------------------------------------------------------------
// Tier system
// ---------------------------------------------------------------------------

export type ProfileTier =
  | "starter"  // 0–24 %
  | "active"   // 25–49 %
  | "strong"   // 50–74 %
  | "skilved"  // 75–94 %
  | "verified" // 95–100 % AND verifiedAt set

export interface TierMeta {
  id: ProfileTier
  label: string
  /** Minimum completion % to reach this tier (verified is gate-kept separately). */
  minPct: number
  bgClass: string
  textClass: string
  borderClass: string
}

// ---------------------------------------------------------------------------
// Work history
// ---------------------------------------------------------------------------

export interface WorkEntry {
  id: string
  title: string
  organisation: string
  province: ProvinceId
  /** "YYYY-MM" */
  startMonth: string
  /** "YYYY-MM" or null = current role */
  endMonth: string | null
  description?: string
  tradeId: TradeId
}

// ---------------------------------------------------------------------------
// Certificates & qualifications
// ---------------------------------------------------------------------------

export type CertificateStatus = "self-reported" | "verified"

export interface Certificate {
  id: string
  name: string
  issuer: string
  /** "YYYY-MM" */
  issuedDate: string
  /** "YYYY-MM" */
  expiresDate?: string
  status: CertificateStatus
  /** NQF level 1–10, if applicable */
  nqfLevel?: number
}

// ---------------------------------------------------------------------------
// Applications tracked by the Skilved agent
// ---------------------------------------------------------------------------

export type ApplicationOutcome =
  | "pending"
  | "shortlisted"
  | "offered"
  | "accepted"
  | "rejected"
  | "withdrawn"

export interface TrackedApplication {
  id: string
  opportunityId: string
  opportunityTitle: string
  organisation: string
  /** ISO timestamp */
  appliedAt: string
  outcome: ApplicationOutcome
  outcomeReportedAt?: string
  note?: string
}

// ---------------------------------------------------------------------------
// Career plan (populated by Career agent)
// ---------------------------------------------------------------------------

export interface CareerStep {
  order: number
  label: string
  type: "qualification" | "experience" | "trade-test" | "certification"
  completed: boolean
}

export interface CareerPlan {
  goalTitle: string
  goalTrade: TradeId
  estimatedMonths: number
  steps: CareerStep[]
}

// ---------------------------------------------------------------------------
// Per-field visibility
// ---------------------------------------------------------------------------

export interface ProfileVisibility {
  /** If false, /profile/[username] returns 404 to the public. */
  publicProfile: boolean
  showWorkHistory: boolean
  showCertificates: boolean
  showApplications: boolean
  showCareerPlan: boolean
}

// ---------------------------------------------------------------------------
// The canonical UserProfile shape
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string
  username: string
  displayName: string
  headline?: string
  bio?: string
  avatarUrl?: string
  province: ProvinceId
  city: string
  primaryTrade: TradeId
  /** Derived tier — computed by lib/profile-completion.ts. */
  tier: ProfileTier
  /** Completion percentage 0–100 — computed. */
  completionPct: number
  /** Set by MyMzansi / admin verification flow. Unlocks "verified" tier. */
  verifiedAt?: string
  workHistory: WorkEntry[]
  certificates: Certificate[]
  applications: TrackedApplication[]
  careerPlan?: CareerPlan
  visibility: ProfileVisibility
  /** ISO timestamp */
  createdAt: string
  /** ISO timestamp */
  updatedAt: string
}
