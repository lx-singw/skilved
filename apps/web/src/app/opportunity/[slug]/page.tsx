import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getOpportunityBySlug } from "@/lib/opportunities"
import { Header } from "@/components/layout/Header"

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const opp = getOpportunityBySlug(slug)
  if (!opp) return { title: "Opportunity not found" }
  return { title: `${opp.title} — Skilved`, description: opp.description }
}

export default async function OpportunityDetailPage({ params }: Props) {
  const { slug } = await params
  const opp = getOpportunityBySlug(slug)
  if (!opp) notFound()

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{opp.type}</span>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{opp.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{opp.organisation} · {opp.province}</p>
        <div className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>{opp.description}</p>
        </div>
      </main>
    </>
  )
}
