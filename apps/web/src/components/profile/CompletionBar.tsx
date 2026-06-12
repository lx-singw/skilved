import { cn } from "@/utils/classNames"
import type { CompletionResult } from "@/lib/profile-completion"
import type { ProfileTier } from "@/types/user"

interface CompletionBarProps {
  result: CompletionResult
  /** Show the missing-field hints list below the bar. */
  showHints?: boolean
  className?: string
}

const TIER_BAR_COLOR: Record<ProfileTier, string> = {
  starter: "bg-muted-foreground/40",
  active:  "bg-amber",
  strong:  "bg-primary/70",
  skilved: "bg-primary",
  verified: "bg-verified",
}

const TIER_MILESTONES: { pct: number; label: string }[] = [
  { pct: 25, label: "Active" },
  { pct: 50, label: "Strong" },
  { pct: 75, label: "Skilved" },
  { pct: 95, label: "Verified" },
]

export function CompletionBar({ result, showHints = false, className }: CompletionBarProps) {
  const { pct, tier, missing } = result
  const barColor = TIER_BAR_COLOR[tier]

  return (
    <div className={cn("space-y-2", className)}>
      {/* Progress track */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Profile ${pct}% complete`}
        />
        {/* Milestone markers */}
        {TIER_MILESTONES.map((m) => (
          <div
            key={m.pct}
            className="absolute top-0 h-full w-px bg-background/60"
            style={{ left: `${m.pct}%` }}
            aria-hidden
          />
        ))}
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {pct}% complete
        </p>
        {missing.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Next: <span className="font-medium text-foreground">{missing[0].hint}</span>
          </p>
        )}
      </div>

      {/* Optional full hints list */}
      {showHints && missing.length > 0 && (
        <ul className="mt-3 space-y-1.5" aria-label="Missing profile fields">
          {missing.map((f) => (
            <li key={f.key} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 flex-none rounded-full bg-border" aria-hidden />
              {f.hint}
              <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
                +{f.points}pts
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
