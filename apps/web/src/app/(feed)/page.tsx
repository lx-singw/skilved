import { Header } from "@/components/layout/Header"
import { getAllOpportunities } from "@/lib/opportunities"
import { OpportunityCard } from "@/components/feed/OpportunityCard"

export const metadata = { title: "Skilved — Find your next opportunity", description: "Browse verified learnerships, trade tests, and jobs across South Africa." }

export default async function FeedPage() {
  const opportunities = getAllOpportunities()
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        <h1 className="mb-6 text-lg font-bold text-foreground">Opportunities near you</h1>
        <ul className="space-y-4">
          {opportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </ul>
      </main>
    </>
  )
}
