import { Suspense } from "react"
import { Header } from "@/components/layout/Header"
import { getAllOpportunities } from "@/lib/opportunities"
import { PitchStrip } from "@/components/feed/PitchStrip"
import { ProfileRailCard } from "@/components/feed/ProfileRailCard"
import { FeedClient } from "@/components/feed/FeedClient"

export const metadata = {
  title: "Skilved — Find your next opportunity",
  description:
    "Browse verified learnerships, trade tests, and jobs across South Africa. One verified career profile, hired everywhere.",
}

export default async function FeedPage() {
  const opportunities = getAllOpportunities()
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-4 lg:pt-6">
        <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
          {/* Left rail — desktop only */}
          <div className="hidden lg:block">
            <ProfileRailCard />
          </div>

          {/* Feed — front and center */}
          <div className="min-w-0">
            <PitchStrip />
            <Suspense fallback={null}>
              <FeedClient opportunities={opportunities} />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  )
}
