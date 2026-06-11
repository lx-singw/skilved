"use client"

import { useState } from "react"
import Link from "next/link"
import { X, Clock } from "lucide-react"
import type { Opportunity } from "@/types/opportunity"
import { getProvince } from "@/constants/provinces"
import { formatDate } from "@/utils/formatting"

export function ClosingSoonBanner({
  opportunities,
}: {
  opportunities: Opportunity[]
}) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || opportunities.length === 0) return null

  const top = opportunities.slice(0, 3)

  return (
    <div className="sticky bottom-0 z-20 -mx-4 border-t border-amber/40 bg-amber/10 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-start gap-3">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {opportunities.length} closing within 72 hours
          </p>
          <ul className="mt-1 space-y-0.5">
            {top.map((o) => (
              <li key={o.id} className="truncate text-xs text-muted-foreground">
                <Link
                  href={`/opportunity/${o.slug}`}
                  className="hover:text-foreground hover:underline"
                >
                  {o.title} — {getProvince(o.province).abbr} · closes{" "}
                  {formatDate(o.closesAt)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss closing soon banner"
          className="rounded-md p-1 text-muted-foreground hover:bg-amber/20 hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
