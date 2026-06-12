"use client"

import { Fragment, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, BadgeCheck, SlidersHorizontal, X } from "lucide-react"
import { OpportunityCard } from "@/components/feed/OpportunityCard"
import { TRADES } from "@/constants/trades"
import { PROVINCES } from "@/constants/provinces"
import { OPPORTUNITY_TYPES } from "@/constants/opportunityTypes"
import { cn } from "@/utils/classNames"
import type { Opportunity } from "@/types/opportunity"

interface FeedClientProps {
  opportunities: Opportunity[]
}

type PillSetProps = {
  label: string
  options: { id: string; label: string }[]
  value: string
  onChange: (val: string) => void
}

function PillSet({ label, options, value, onChange }: PillSetProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      <span className="flex-none text-xs font-medium text-muted-foreground">{label}:</span>
      <button
        onClick={() => onChange("")}
        className={cn(
          "flex-none rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
          value === ""
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        )}
      >
        All
      </button>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id === value ? "" : opt.id)}
          className={cn(
            "flex-none rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            value === opt.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/** Inline conversion moment — appears once, mid-feed, like a native post. */
function InlineProfileCard() {
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-hidden>
          <BadgeCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold leading-snug text-foreground">
            Applying to these? Use one verified profile for all of them.
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Build your career profile once — verified skills, real reputation — and apply
            everywhere with a single link.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/auth/signup"
              className="group inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Create your profile — free
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link
              href="/career-profile"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              How it works
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FeedClient({ opportunities }: FeedClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [trade, setTrade] = useState(searchParams.get("trade") ?? "")
  const [province, setProvince] = useState(searchParams.get("province") ?? "")
  const [type, setType] = useState(searchParams.get("type") ?? "")
  const [showFilters, setShowFilters] = useState(false)

  function updateParam(key: string, val: string) {
    const params = new URLSearchParams(window.location.search)
    if (val) params.set(key, val)
    else params.delete(key)
    router.replace(`/?${params.toString()}`, { scroll: false })
  }

  function handleTrade(val: string) {
    setTrade(val)
    updateParam("trade", val)
  }
  function handleProvince(val: string) {
    setProvince(val)
    updateParam("province", val)
  }
  function handleType(val: string) {
    setType(val)
    updateParam("type", val)
  }

  function clearAll() {
    setTrade("")
    setProvince("")
    setType("")
    router.replace("/", { scroll: false })
  }

  const filtered = useMemo(() => {
    return opportunities.filter((opp) => {
      if (trade && opp.trade !== trade) return false
      if (province && opp.province !== province) return false
      if (type && opp.type !== type) return false
      return true
    })
  }, [opportunities, trade, province, type])

  const hasFilters = trade !== "" || province !== "" || type !== ""

  return (
    <div>
      {/* ── Sticky trade chips — the "stories" rail ── */}
      <div className="sticky top-14 z-20 -mx-4 mb-3 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur lg:-mx-0 lg:rounded-xl lg:border lg:px-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleTrade("")}
            className={cn(
              "flex-none rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              trade === ""
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            All trades
          </button>
          {TRADES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTrade(t.id === trade ? "" : t.id)}
              className={cn(
                "flex-none rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                trade === t.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => setShowFilters((p) => !p)}
            className={cn(
              "ml-1 flex flex-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
              showFilters || province || type
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
            aria-expanded={showFilters}
            aria-label="More filters"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            More
            {(province || type) && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {[province, type].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Extra filters panel */}
      {showFilters && (
        <div className="mb-4 space-y-3 rounded-xl border border-border bg-card p-4">
          <PillSet label="Province" options={PROVINCES} value={province} onChange={handleProvince} />
          <PillSet label="Type" options={OPPORTUNITY_TYPES} value={type} onChange={handleType} />
          {hasFilters && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" aria-hidden />
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Feed meta line */}
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verified opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-verified" />
        </span>
        <p className="text-xs font-medium text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          live {filtered.length === 1 ? "opportunity" : "opportunities"}
          {hasFilters && (
            <>
              {" · "}
              <button onClick={clearAll} className="font-medium text-primary hover:underline">
                clear filters
              </button>
            </>
          )}
        </p>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="font-display text-lg font-semibold text-foreground">No matches</p>
          <p className="text-sm text-muted-foreground">Try removing a filter or broadening your search.</p>
          <button
            onClick={clearAll}
            className="mt-1 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Opportunity listings">
          {filtered.map((opp, i) => (
            <Fragment key={opp.id}>
              <li className="contents">
                <OpportunityCard opportunity={opp} />
              </li>
              {i === 3 && !hasFilters && (
                <li className="contents">
                  <InlineProfileCard />
                </li>
              )}
            </Fragment>
          ))}
        </ul>
      )}
    </div>
  )
}
