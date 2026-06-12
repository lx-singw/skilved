"use client"

import { useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontal, X } from "lucide-react"
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
      {/* Filter toggle bar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-bold text-foreground">Opportunities</h1>
          <span className="font-mono text-xs text-muted-foreground">
            {filtered.length}/{opportunities.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              aria-label="Clear all filters"
            >
              <X className="h-3 w-3" aria-hidden />
              Clear
            </button>
          )}
          <button
            onClick={() => setShowFilters((p) => !p)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              showFilters
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            Filter
            {hasFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {[trade, province, type].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-5 space-y-3 rounded-lg border border-border bg-card p-4">
          <PillSet label="Trade" options={TRADES} value={trade} onChange={handleTrade} />
          <PillSet label="Province" options={PROVINCES} value={province} onChange={handleProvince} />
          <PillSet label="Type" options={OPPORTUNITY_TYPES} value={type} onChange={handleType} />
        </div>
      )}

      {/* Active filter chips */}
      {hasFilters && !showFilters && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {trade && (
            <button
              onClick={() => handleTrade("")}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {TRADES.find((t) => t.id === trade)?.label}
              <X className="h-3 w-3" aria-hidden />
            </button>
          )}
          {province && (
            <button
              onClick={() => handleProvince("")}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {PROVINCES.find((p) => p.id === province)?.label}
              <X className="h-3 w-3" aria-hidden />
            </button>
          )}
          {type && (
            <button
              onClick={() => handleType("")}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {OPPORTUNITY_TYPES.find((t) => t.id === type)?.label}
              <X className="h-3 w-3" aria-hidden />
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="font-semibold text-foreground">No matches</p>
          <p className="text-sm text-muted-foreground">Try removing a filter or broadening your search.</p>
          <button
            onClick={clearAll}
            className="mt-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="space-y-4" aria-label="Opportunity listings">
          {filtered.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </ul>
      )}
    </div>
  )
}
