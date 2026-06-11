import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import type { Opportunity } from "@/types/opportunity"
import { getProvince } from "@/constants/provinces"
import { isExpired, isFresh, isClosingSoon } from "@/lib/matching"
import { cn } from "@/utils/classNames"
import { TradeBadge } from "@/components/shared/TradeBadge"
import { ProvincePill } from "@/components/shared/ProvincePill"
import { OpportunityTypePill } from "@/components/shared/OpportunityTypePill"
import { SalaryDisplay } from "@/components/shared/SalaryDisplay"
import { DeadlineBadge } from "@/components/shared/DeadlineBadge"
import { FreshnessBadge } from "@/components/shared/FreshnessBadge"
import { VerifiedBadge } from "@/components/shared/VerifiedBadge"
import { StatusBadge } from "@/components/shared/MatchScore"
import { ShareButton } from "@/components/opportunity/ShareButton"

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const expired = isExpired(opportunity)
  const fresh = isFresh(opportunity)
  const closingSoon = isClosingSoon(opportunity)
  const province = getProvince(opportunity.province)
  const href = `/opportunity/${opportunity.slug}`

  return (
    <article
      className={cn(
        "rounded-lg border border-border bg-card p-4 transition-shadow",
        fresh && !expired && "shadow-sm ring-1 ring-verified/20",
        expired && "opacity-60",
      )}
    >
      {/* Status row */}
      <div className="mb-2 flex items-center gap-2">
        {expired ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Opportunity closed
          </span>
        ) : (
          <>
            {fresh && <StatusBadge variant="new" />}
            {closingSoon && <StatusBadge variant="closing-soon" />}
          </>
        )}
        {opportunity.verified && <VerifiedBadge />}
      </div>

      {/* Title + org */}
      <Link href={href} className="group block">
        <h3 className="text-base font-bold leading-snug text-foreground text-balance group-hover:text-primary">
          {opportunity.title}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {opportunity.organisation} · {opportunity.city}, {province.abbr}
        </p>
      </Link>

      {/* Pills */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <TradeBadge trade={opportunity.trade} />
        <OpportunityTypePill type={opportunity.type} />
        <ProvincePill province={opportunity.province} />
      </div>

      {/* Salary */}
      <div className="mt-3">
        <SalaryDisplay salary={opportunity.salary} />
      </div>

      {/* Deadline + freshness */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <DeadlineBadge closesAt={opportunity.closesAt} />
        {!expired && <FreshnessBadge foundAt={opportunity.foundAt} />}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <Link
          href={href}
          className="inline-flex flex-1 items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          View details
        </Link>
        {!expired && (
          <a
            href={opportunity.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Apply now
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        )}
        <ShareButton opportunity={opportunity} />
      </div>
    </article>
  )
}
