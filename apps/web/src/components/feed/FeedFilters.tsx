"use client"

import { SlidersHorizontal, X } from "lucide-react"
import { useState } from "react"
import type { FeedFilters as Filters } from "@/types/filter"
import { TRADES } from "@/constants/trades"
import { PROVINCES } from "@/constants/provinces"
import { OPPORTUNITY_TYPES } from "@/constants/opportunityTypes"
import type { OpportunityTypeId } from "@/constants/opportunityTypes"
import type { SalaryBand, ClosingWindow, SortMode } from "@/types/filter"
import { cn } from "@/utils/classNames"

const SALARY_OPTIONS: { id: SalaryBand; label: string }[] = [
  { id: "any", label: "Any" },
  { id: "funded", label: "Funded / stipend" },
  { id: "3k-6k", label: "R3K–R6K" },
  { id: "6k-12k", label: "R6K–R12K" },
  { id: "12k-plus", label: "R12K+" },
]

const CLOSING_OPTIONS: { id: ClosingWindow; label: string }[] = [
  { id: "any", label: "Any time" },
  { id: "this-week", label: "Closing this week" },
  { id: "this-month", label: "Closing this month" },
]

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: "relevance", label: "Relevance" },
  { id: "newest", label: "Newest" },
  { id: "closing-soon", label: "Closing soon" },
]

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}

export function FeedFilters({
  filters,
  onChange,
  resultCount,
}: {
  filters: Filters
  onChange: (next: Filters) => void
  resultCount: number
}) {
  const [showMore, setShowMore] = useState(false)

  const activeSecondary =
    filters.types.length +
    (filters.salary !== "any" ? 1 : 0) +
    (filters.closing !== "any" ? 1 : 0)

  const anyActive =
    filters.trade !== "all" ||
    filters.province !== "all" ||
    activeSecondary > 0 ||
    filters.sort !== "relevance"

  function toggleType(id: OpportunityTypeId) {
    const next = filters.types.includes(id)
      ? filters.types.filter((t) => t !== id)
      : [...filters.types, id]
    onChange({ ...filters, types: next })
  }

  return (
    <div className="space-y-3">
      {/* Trade row */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Pill
          active={filters.trade === "all"}
          onClick={() => onChange({ ...filters, trade: "all" })}
        >
          All trades
        </Pill>
        {TRADES.map((t) => (
          <Pill
            key={t.id}
            active={filters.trade === t.id}
            onClick={() => onChange({ ...filters, trade: t.id })}
          >
            {t.label}
          </Pill>
        ))}
      </div>

      {/* Province row */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Pill
          active={filters.province === "all"}
          onClick={() => onChange({ ...filters, province: "all" })}
        >
          All provinces
        </Pill>
        {PROVINCES.map((p) => (
          <Pill
            key={p.id}
            active={filters.province === p.id}
            onClick={() => onChange({ ...filters, province: p.id })}
          >
            {p.label}
          </Pill>
        ))}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMore((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            More filters
            {activeSecondary > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                {activeSecondary}
              </span>
            )}
          </button>
          {anyActive && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  trade: "all",
                  province: "all",
                  types: [],
                  salary: "any",
                  closing: "any",
                  sort: "relevance",
                })
              }
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Clear all
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {resultCount} {resultCount === 1 ? "result" : "results"}
        </p>
      </div>

      {/* Expandable secondary filters */}
      {showMore && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Opportunity type
            </p>
            <div className="flex flex-wrap gap-2">
              {OPPORTUNITY_TYPES.map((t) => (
                <Pill
                  key={t.id}
                  active={filters.types.includes(t.id)}
                  onClick={() => toggleType(t.id)}
                >
                  {t.label}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Salary range
            </p>
            <div className="flex flex-wrap gap-2">
              {SALARY_OPTIONS.map((s) => (
                <Pill
                  key={s.id}
                  active={filters.salary === s.id}
                  onClick={() => onChange({ ...filters, salary: s.id })}
                >
                  {s.label}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Closing window
            </p>
            <div className="flex flex-wrap gap-2">
              {CLOSING_OPTIONS.map((c) => (
                <Pill
                  key={c.id}
                  active={filters.closing === c.id}
                  onClick={() => onChange({ ...filters, closing: c.id })}
                >
                  {c.label}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sort by
            </p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((s) => (
                <Pill
                  key={s.id}
                  active={filters.sort === s.id}
                  onClick={() => onChange({ ...filters, sort: s.id })}
                >
                  {s.label}
                </Pill>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
