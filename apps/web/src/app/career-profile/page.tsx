import { Header } from "@/components/layout/Header"
import { CareerProfileHero } from "@/components/marketing/CareerProfileHero"
import { getAllOpportunities } from "@/lib/opportunities"

export const metadata = {
  title: "Your career profile — Skilved",
  description:
    "One verified career profile — your skills, reputation and work history — that you reuse on every application with a single link.",
}

export default function CareerProfilePage() {
  const opportunities = getAllOpportunities()
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">
        <CareerProfileHero count={opportunities.length} />
      </main>
    </>
  )
}
