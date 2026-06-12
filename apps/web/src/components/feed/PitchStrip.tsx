import Link from "next/link"
import { ArrowRight, BadgeCheck } from "lucide-react"

/**
 * Compact, one-line conversion strip shown above the feed.
 * Does the "landing page" job in 60px — no scroll cost.
 * Links to /career-profile for the full pitch.
 */
export function PitchStrip() {
  return (
    <Link
      href="/career-profile"
      className="group mb-4 flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 transition-colors hover:border-primary/50 hover:bg-primary/10 lg:hidden"
    >
      <BadgeCheck className="h-5 w-5 flex-none text-primary" aria-hidden />
      <p className="min-w-0 flex-1 truncate text-sm text-foreground">
        <span className="font-semibold">One verified profile. Hired everywhere.</span>{" "}
        <span className="hidden text-muted-foreground sm:inline">
          Stop re-typing applications — build it once.
        </span>
      </p>
      <span className="flex flex-none items-center gap-1 text-xs font-semibold text-primary">
        Learn more
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  )
}
