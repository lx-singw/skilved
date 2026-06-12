/**
 * Mock profile store for Sprint 1 (Career Identity UI).
 *
 * Mirrors the pattern of lib/opportunities.ts — typed, in-memory, realistic.
 * In production this is replaced by Neon / Postgres-backed API calls.
 */

import type { UserProfile } from "@/types/user"
import { computeCompletion } from "@/lib/profile-completion"

const NOW = new Date().toISOString()
const monthsAgo = (n: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

// ---------------------------------------------------------------------------
// Seed data — two demo profiles at different tier levels
// ---------------------------------------------------------------------------

const RAW_PROFILES: Omit<UserProfile, "tier" | "completionPct">[] = [
  {
    id: "usr-001",
    username: "thabo-m",
    displayName: "Thabo Mokoena",
    headline: "Electrical apprentice · EWSETA learner · Johannesburg",
    bio: "Third-year electrical apprenticeship at Eskom Rotek Industries. Passed N3 in 2024 and working toward my trade test. Looking for post-apprenticeship opportunities in the renewable energy sector.",
    avatarUrl: undefined,
    province: "gauteng",
    city: "Johannesburg",
    primaryTrade: "electrical",
    verifiedAt: undefined,
    workHistory: [
      {
        id: "wh-001",
        title: "Electrical Apprentice",
        organisation: "Eskom Rotek Industries",
        province: "gauteng",
        tradeId: "electrical",
        startMonth: monthsAgo(30),
        endMonth: null,
        description:
          "Rotating through HV substation maintenance, cable jointing, and panel wiring under a qualified artisan supervisor.",
      },
      {
        id: "wh-002",
        title: "Maintenance Assistant",
        organisation: "City of Ekurhuleni",
        province: "gauteng",
        tradeId: "electrical",
        startMonth: monthsAgo(48),
        endMonth: monthsAgo(32),
        description: "General maintenance support in municipal facilities prior to apprenticeship.",
      },
    ],
    certificates: [
      {
        id: "cert-001",
        name: "N3 Electrical Engineering",
        issuer: "NATED / DHET",
        issuedDate: monthsAgo(18),
        status: "self-reported",
        nqfLevel: 3,
      },
      {
        id: "cert-002",
        name: "Working at Heights",
        issuer: "SafetyFirst Training Centre",
        issuedDate: monthsAgo(12),
        expiresDate: monthsAgo(-12),
        status: "self-reported",
      },
    ],
    applications: [
      {
        id: "app-001",
        opportunityId: "op-001",
        opportunityTitle: "Electrical Apprenticeship",
        organisation: "Eskom Holdings",
        appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        outcome: "shortlisted",
        outcomeReportedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "app-002",
        opportunityId: "op-009",
        opportunityTitle: "ICT Network Support Learnership",
        organisation: "Vodacom",
        appliedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        outcome: "rejected",
        outcomeReportedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        note: "Outside of primary trade — applied as a stretch. Good interview experience.",
      },
    ],
    careerPlan: {
      goalTitle: "Qualified Electrician (Solar PV)",
      goalTrade: "electrical",
      estimatedMonths: 14,
      steps: [
        { order: 1, label: "Complete N3 Electrical Engineering", type: "qualification", completed: true },
        { order: 2, label: "Pass electrical trade test (first attempt)", type: "trade-test", completed: false },
        { order: 3, label: "Obtain solar PV installer certificate (NQF 4)", type: "certification", completed: false },
        { order: 4, label: "2 years post-qualification experience", type: "experience", completed: false },
        { order: 5, label: "Government Certificate of Competency (GCC)", type: "certification", completed: false },
      ],
    },
    visibility: {
      publicProfile: true,
      showWorkHistory: true,
      showCertificates: true,
      showApplications: false,
      showCareerPlan: true,
    },
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "usr-002",
    username: "nandi-d",
    displayName: "Nandi Dlamini",
    headline: "Plumbing learner · TETA · Cape Town",
    bio: undefined,
    avatarUrl: undefined,
    province: "western-cape",
    city: "Cape Town",
    primaryTrade: "plumbing",
    verifiedAt: undefined,
    workHistory: [],
    certificates: [
      {
        id: "cert-003",
        name: "Grade 12 / Matric",
        issuer: "Western Cape Education Department",
        issuedDate: monthsAgo(24),
        status: "self-reported",
        nqfLevel: 4,
      },
    ],
    applications: [
      {
        id: "app-003",
        opportunityId: "op-003",
        opportunityTitle: "Plumbing Apprenticeship",
        organisation: "Transnet SOC",
        appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        outcome: "pending",
      },
    ],
    careerPlan: undefined,
    visibility: {
      publicProfile: true,
      showWorkHistory: true,
      showCertificates: true,
      showApplications: false,
      showCareerPlan: true,
    },
    createdAt: NOW,
    updatedAt: NOW,
  },
]

// ---------------------------------------------------------------------------
// Derive computed fields (tier + completionPct) and build the store
// ---------------------------------------------------------------------------

function hydrate(raw: Omit<UserProfile, "tier" | "completionPct">): UserProfile {
  const profile = raw as UserProfile
  const { pct, tier } = computeCompletion(profile)
  return { ...profile, completionPct: pct, tier }
}

const PROFILE_STORE: Map<string, UserProfile> = new Map(
  RAW_PROFILES.map((r) => [r.username, hydrate(r)]),
)

// ---------------------------------------------------------------------------
// Public API — mirrors the shape the real API route will expose
// ---------------------------------------------------------------------------

export function getProfileByUsername(username: string): UserProfile | null {
  return PROFILE_STORE.get(username) ?? null
}

export function getProfileById(id: string): UserProfile | null {
  for (const p of PROFILE_STORE.values()) {
    if (p.id === id) return p
  }
  return null
}

export function updateProfile(
  username: string,
  patch: Partial<Omit<UserProfile, "id" | "username" | "createdAt" | "tier" | "completionPct">>,
): UserProfile | null {
  const existing = PROFILE_STORE.get(username)
  if (!existing) return null
  const updated = hydrate({ ...existing, ...patch, updatedAt: new Date().toISOString() })
  PROFILE_STORE.set(username, updated)
  return updated
}

/** Seed profile used for the "owner" demo view (acts as the logged-in user). */
export const DEMO_USERNAME = "thabo-m"
