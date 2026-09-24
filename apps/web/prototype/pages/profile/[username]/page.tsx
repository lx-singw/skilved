import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { Pencil } from "lucide-react"
import { getProfileByUsername, DEMO_USERNAME } from "@/lib/profiles"
import { Header } from "@/components/layout/Header"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { ProfileWorkHistory } from "@/components/profile/ProfileWorkHistory"
import { ProfileCertificates } from "@/components/profile/ProfileCertificates"
import { CareerPlan } from "@/components/profile/CareerPlan"
import { SkilvedBadge } from "@/components/profile/SkilvedBadge"
import { ShareProfileButton } from "@/components/profile/ShareProfileButton"
import { ProfileTrade } from "@/components/profile/ProfileTrade"

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const profile = getProfileByUsername(username)
  if (!profile || !profile.visibility.publicProfile) {
    return { title: "Profile not found" }
  }
  return {
    title: `${profile.displayName} — Skilved profile`,
    description:
      profile.headline ??
      `${profile.displayName}'s career identity on Skilved. ${profile.primaryTrade} · ${profile.city}.`,
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const profile = getProfileByUsername(username)

  if (!profile || !profile.visibility.publicProfile) {
    notFound()
  }

  const { visibility } = profile

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        {/* Top action row */}
        <div className="mb-6 flex items-center justify-end gap-2">
          {/* In Sprint 1 the demo user always sees the edit button */}
          {profile.username === DEMO_USERNAME && (
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Edit profile
            </Link>
          )}
          <ShareProfileButton username={profile.username} />
        </div>

        {/* Identity header */}
        <ProfileHeader profile={profile} />

        {/* Bio */}
        {profile.bio && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-foreground">About</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
          </div>
        )}

        {/* Primary trade */}
        <div className="mt-6">
          <ProfileTrade tradeId={profile.primaryTrade} />
        </div>

        {/* Work history */}
        {visibility.showWorkHistory && (
          <section className="mt-8" aria-labelledby="work-heading">
            <h2 id="work-heading" className="mb-4 text-sm font-semibold text-foreground">
              Work history
            </h2>
            <ProfileWorkHistory entries={profile.workHistory} />
          </section>
        )}

        {/* Certificates */}
        {visibility.showCertificates && (
          <section className="mt-8" aria-labelledby="certs-heading">
            <h2 id="certs-heading" className="mb-4 text-sm font-semibold text-foreground">
              Certificates &amp; qualifications
            </h2>
            <ProfileCertificates certificates={profile.certificates} />
          </section>
        )}

        {/* Career plan */}
        {visibility.showCareerPlan && profile.careerPlan && (
          <section className="mt-8" aria-labelledby="plan-heading">
            <h2 id="plan-heading" className="mb-4 text-sm font-semibold text-foreground">
              Career plan
            </h2>
            <CareerPlan plan={profile.careerPlan} />
          </section>
        )}

        {/* Portable badge */}
        <section className="mt-10 border-t border-border pt-8" aria-labelledby="badge-heading">
          <h2 id="badge-heading" className="mb-4 text-sm font-semibold text-foreground">
            Skilved identity badge
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Copy the link below and paste it into your CV, WhatsApp bio, or LinkedIn summary.
          </p>
          <SkilvedBadge profile={profile} />
          <div className="mt-4">
            <ShareProfileButton username={profile.username} />
          </div>
        </section>
      </main>
    </>
  )
}
