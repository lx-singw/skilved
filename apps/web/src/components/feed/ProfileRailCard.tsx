import Link from "next/link"
import { ArrowRight, BadgeCheck, Link2, ShieldCheck, Sparkles, Star } from "lucide-react"

const PILLARS = [
  { Icon: ShieldCheck, label: "Skills verified once, trusted everywhere" },
  { Icon: Star, label: "Reputation from real managers & peers" },
  { Icon: Sparkles, label: "AI matches work to you, first" },
]

/**
 * Sticky left-rail conversion card for desktop — the social-platform
 * "identity card" slot (like Facebook's profile shortcut), but selling
 * the verified career profile to anonymous visitors.
 */
export function ProfileRailCard() {
  return (
    <aside className="sticky top-20" aria-label="Create your career profile">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {/* Mini profile mock */}
        <div className="border-b border-border bg-muted/50 p-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5">
            <Link2 className="h-3 w-3 flex-none text-primary" aria-hidden />
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              skilved.com/<span className="font-semibold text-foreground">you</span>
            </span>
            <span className="ml-auto flex flex-none items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
              <BadgeCheck className="h-2.5 w-2.5" aria-hidden />
              Verified
            </span>
          </div>
        </div>

        <div className="p-4">
          <h2 className="font-display text-xl font-semibold leading-snug tracking-tight text-foreground text-balance">
            One profile.
            <br />
            Hired <span className="italic text-primary">everywhere.</span>
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Your verified career profile at your own link — reuse it on every
            application, forever.
          </p>

          <ul className="mt-4 space-y-2.5">
            {PILLARS.map(({ Icon, label }) => (
              <li key={label} className="flex items-start gap-2 text-[13px] leading-snug text-foreground">
                <Icon className="mt-0.5 h-3.5 w-3.5 flex-none text-primary" aria-hidden />
                {label}
              </li>
            ))}
          </ul>

          <Link
            href="/auth/signup"
            className="group mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Create your profile — free
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <Link
            href="/career-profile"
            className="mt-2 block text-center text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            How it works
          </Link>
        </div>
      </div>
    </aside>
  )
}
