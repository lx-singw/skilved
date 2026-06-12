import { Suspense } from "react"
import { Header } from "@/components/layout/Header"
import { getAllOpportunities } from "@/lib/opportunities"
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
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        <Suspense fallback={null}>
          <FeedClient opportunities={opportunities} />
        </Suspense>
      </main>
    </>
  )
}
