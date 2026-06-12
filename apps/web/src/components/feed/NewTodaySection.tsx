import type { Opportunity } from "@/types/opportunity"
import { OpportunityCard } from "./OpportunityCard"

export function NewTodaySection({
  opportunities,
}: {
  opportunities: Opportunity[]
}) {
  if (opportunities.length === 0) return null

  return (
    <section aria-labelledby="new-today-heading" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2
          id="new-today-heading"
          className="text-lg font-bold text-foreground"
        >
          New today
        </h2>
        <span className="text-xs text-muted-foreground">
          Found by Skilved in the last 24 hours
        </span>
      </div>
      <div className="grid gap-3">
        {opportunities.map((o) => (
          <OpportunityCard key={o.id} opportunity={o} />
        ))}
      </div>
    </section>
  )
}
