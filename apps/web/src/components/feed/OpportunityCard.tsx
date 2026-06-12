import Link from "next/link"
import { ArrowUpRight, BadgeCheck, Bookmark } from "lucide-react"
import type { Opportunity } from "@/types/opportunity"
import { getProvince } from "@/constants/provinces"
import { getTrade } from "@/constants/trades"
import { getOpportunityType } from "@/constants/opportunityTypes"
import { isExpired, isFresh, isClosingSoon } from "@/lib/matching"
import { cn } from "@/utils/classNames"
import { SalaryDisplay } from "@/components/shared/SalaryDisplay"
import { DeadlineBadge } from "@/components/shared/DeadlineBadge"
import { StatusBadge } from "@/components/shared/MatchScore"
import { ShareButton } from "@/components/opportunity/ShareButton"

/** Deterministic muted avatar tone per organisation. */
const AVATAR_TONES = [
  "bg-primary/10 text-primary",
  "bg-amber/10 text-amber",
  "bg-verified/10 text-verified",
  "bg-foreground/[0.06] text-foreground",
]

function avatarTone(org: string) {
  let hash = 0
  for (let i = 0; i < org.length; i++) hash = (hash * 31 + org.charCodeAt(i)) | 0
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length]
}

function monogram(org: string) {
  const words = org.split(/\s+/).filter(Boolean)
  return words.length >= 2
    ? `${words[0][0]}${words[1][0]}`.toUpperCase()
    : org.slice(0, 2).toUpperCase()
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1) return "just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const expired = isExpired(opportunity)
  const fresh = isFresh(opportunity)
  const closingSoon = isClosingSoon(opportunity)
  const province = getProvince(opportunity.province)
  const trade = getTrade(opportunity.trade)
  const oppType = getOpportunityType(opportunity.type)
  const href = `/opportunity/${opportunity.slug}`

  return (
    <article
      className={cn(
        "group/card rounded-2xl border border-border bg-card transition-all hover:border-foreground/15 hover:shadow-md hover:shadow-foreground/[0.04]",
        expired && "opacity-55",
      )}
    >
      <div className="p-4 sm:p-5">
        {/* ── Post header: who + when ── */}
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-11 w-11 flex-none items-center justify-center rounded-xl text-sm font-bold",
              avatarTone(opportunity.organisation),
            )}
            aria-hidden
          >
            {monogram(opportunity.organisation)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-foreground">
                {opportunity.organisation}
              </p>
              {opportunity.verified && (
                <BadgeCheck
                  className="h-4 w-4 flex-none text-verified"
                  aria-label="Verified employer"
                />
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {oppType.label} · {opportunity.city}, {province.abbr} ·{" "}
              <time dateTime={opportunity.foundAt}>{timeAgo(opportunity.foundAt)}</time>
            </p>
          </div>

          {/* Status — single most important signal only */}
          <div className="flex flex-none items-center">
            {expired ? (
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                Closed
              </span>
            ) : closingSoon ? (
              <StatusBadge variant="closing-soon" />
            ) : fresh ? (
              <StatusBadge variant="new" />
            ) : null}
          </div>
        </div>

        {/* ── Post body: title + teaser ── */}
        <Link href={href} className="mt-3.5 block">
          <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-foreground text-balance transition-colors group-hover/card:text-primary sm:text-xl">
            {opportunity.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {opportunity.summary}
          </p>
        </Link>

        {/* ── Meta row: money + time + trade ── */}
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <SalaryDisplay salary={opportunity.salary} />
          <DeadlineBadge closesAt={opportunity.closesAt} />
          <span className="text-xs font-medium text-muted-foreground">{trade.label}</span>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="flex items-center border-t border-border px-2 py-1.5 sm:px-3">
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Save this opportunity — create a free profile"
        >
          <Bookmark className="h-4 w-4" aria-hidden />
          Save
        </Link>
        <ShareButton opportunity={opportunity} />
        <div className="ml-auto">
          {expired ? (
            <Link
              href={href}
              className="inline-flex items-center rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              View details
            </Link>
          ) : (
            <a
              href={opportunity.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Apply
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
