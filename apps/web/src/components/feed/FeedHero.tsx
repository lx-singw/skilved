import { ShieldCheck, MapPin, Zap } from "lucide-react"

const TRUST_SIGNALS = [
  { Icon: ShieldCheck, label: "Verified opportunities" },
  { Icon: MapPin, label: "Across all 9 provinces" },
  { Icon: Zap, label: "Updated daily by Scout" },
]

export function FeedHero({ count }: { count: number }) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="mb-6 rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        {count}+ live opportunities
      </p>
      <h1
        id="hero-heading"
        className="mt-2 text-2xl font-bold leading-tight tracking-tight text-foreground text-balance sm:text-3xl"
      >
        Not just skilled.{" "}
        <span className="text-brand-red">Skil</span><span className="text-brand-green">ved.</span>
      </h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground text-pretty">
        Real learnerships, apprenticeships, and trade jobs across South Africa —
        found, verified, and matched to you. No CV uploads. No data wasted.
      </p>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Why Skilved">
        {TRUST_SIGNALS.map(({ Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <Icon className="h-4 w-4 text-verified" aria-hidden />
            {label}
          </li>
        ))}
      </ul>
    </section>
  )
}
