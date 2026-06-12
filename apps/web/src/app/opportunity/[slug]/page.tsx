import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, CheckCircle2, ExternalLink } from "lucide-react"
import { getOpportunityBySlug, getRelatedOpportunities } from "@/lib/opportunities"
import { Header } from "@/components/layout/Header"
import { TradeBadge } from "@/components/shared/TradeBadge"
import { ProvincePill } from "@/components/shared/ProvincePill"
import { OpportunityTypePill } from "@/components/shared/OpportunityTypePill"
import { SalaryDisplay } from "@/components/shared/SalaryDisplay"
import { DeadlineBadge } from "@/components/shared/DeadlineBadge"
import { FreshnessBadge } from "@/components/shared/FreshnessBadge"
import { VerifiedBadge } from "@/components/shared/VerifiedBadge"
import { OpportunityCard } from "@/components/feed/OpportunityCard"
import { isExpired } from "@/lib/matching"

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const opp = getOpportunityBySlug(slug)
  if (!opp) return { title: "Opportunity not found" }
  return {
    title: `${opp.title} — Skilved`,
    description: opp.summary,
  }
}

export default async function OpportunityDetailPage({ params }: Props) {
  const { slug } = await params
  const opp = getOpportunityBySlug(slug)
  if (!opp) notFound()

  const related = getRelatedOpportunities(opp.id, 3)
  const expired = isExpired(opp)

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">

        {/* Back */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to feed
        </Link>

        {/* Header card */}
        <div className="rounded-xl border border-border bg-card p-5">
          {/* Status badges */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {expired && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Opportunity closed
              </span>
            )}
            {opp.verified && <VerifiedBadge />}
            {!expired && <FreshnessBadge foundAt={opp.foundAt} />}
          </div>

          {/* Type + title */}
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <OpportunityTypePill type={opp.type} />
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-foreground text-balance">
            {opp.title}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {opp.organisation}
          </p>

          {/* Location + trade pills */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <TradeBadge trade={opp.trade} />
            <ProvincePill province={opp.province} />
            <span className="text-xs text-muted-foreground">{opp.city}</span>
          </div>

          {/* Salary + deadline row */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-4">
            <SalaryDisplay salary={opp.salary} />
            <DeadlineBadge closesAt={opp.closesAt} />
          </div>

          {/* Apply CTA */}
          {!expired && (
            <div className="mt-4">
              <a
                href={opp.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Apply now
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
          )}
        </div>

        {/* AI Summary */}
        {opp.aiSummary && (
          <section className="mt-6" aria-labelledby="ai-summary-heading">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h2 id="ai-summary-heading" className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                Skilved AI summary
              </h2>
              <p className="text-sm leading-relaxed text-foreground">{opp.aiSummary}</p>
            </div>
          </section>
        )}

        {/* About */}
        <section className="mt-6" aria-labelledby="about-heading">
          <h2 id="about-heading" className="mb-3 text-sm font-semibold text-foreground">
            About this opportunity
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{opp.summary}</p>
        </section>

        {/* Requirements */}
        {opp.requirements.length > 0 && (
          <section className="mt-6" aria-labelledby="requirements-heading">
            <h2 id="requirements-heading" className="mb-3 text-sm font-semibold text-foreground">
              Requirements
            </h2>
            <ul className="space-y-2" aria-label="Requirements">
              {opp.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-verified" aria-hidden />
                  {req}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Source */}
        <section className="mt-6 rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            Found by Skilved Scout via{" "}
            <span className="font-medium text-foreground">{opp.source}</span>
          </p>
          <a
            href={opp.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View original listing
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-10" aria-labelledby="related-heading">
            <h2 id="related-heading" className="mb-4 text-sm font-semibold text-foreground">
              Similar opportunities
            </h2>
            <ul className="space-y-4">
              {related.map((rel) => (
                <OpportunityCard key={rel.id} opportunity={rel} />
              ))}
            </ul>
          </section>
        )}

      </main>
    </>
  )
}

