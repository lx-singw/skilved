import { Suspense } from "react"
import { Header } from "@/components/layout/Header"
import { getAllOpportunities } from "@/lib/opportunities"
import { FeedHero } from "@/components/feed/FeedHero"
import { FeedClient } from "@/components/feed/FeedClient"

export const metadata = {
  title: "Skilved — Find your next opportunity",
  description: "Browse verified learnerships, trade tests, and jobs across South Africa.",
}

export default async function FeedPage() {
  const opportunities = getAllOpportunities()
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        <FeedHero count={opportunities.length} />
        <div className="mt-16 scroll-mt-20" id="opportunities">
          <Suspense fallback={null}>
            <FeedClient opportunities={opportunities} />
          </Suspense>
        </div>
      </main>
    </>
  )
}
