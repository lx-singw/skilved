"use client"

import Link from "next/link"
import {
  ShieldCheck,
  Star,
  Sparkles,
  ArrowRight,
  Link2,
  Check,
  BadgeCheck,
} from "lucide-react"

const TRUSTED_BY = [
  "Eskom",
  "Sasol",
  "Transnet",
  "Toyota",
  "Vodacom",
  "Anglo American",
  "Rand Water",
]

const SERVICES = [
  {
    Icon: ShieldCheck,
    kicker: "Verification",
    title: "Verified, not claimed",
    body: "Your trade, qualifications and certificates are checked once — then trusted on every application.",
  },
  {
    Icon: Star,
    kicker: "Reputation",
    title: "A reputation you own",
    body: "Past managers and peers vouch for your work. A real rating that follows you, not a CV that gets binned.",
  },
  {
    Icon: Sparkles,
    kicker: "AI Matching",
    title: "Work that finds you",
    body: "Your profile is matched to jobs and recruiters automatically — the right roles, near you, first.",
  },
]

const PROFILE_SKILLS = ["Electrical", "Solar PV", "Fault-finding", "Wiring"]

export function CareerProfileHero({ count }: { count: number }) {
  return (
    <section aria-labelledby="hero-heading" className="relative">
      {/* ── Editorial hero ─────────────────────────────── */}
      <div className="grid items-center gap-10 pt-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pt-8">
        {/* Left: words */}
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            {count}+ live opportunities · updated by AI every 4 hours
          </span>

          <h1
            id="hero-heading"
            className="mt-5 font-display text-[2.75rem] font-semibold leading-[0.98] tracking-tight text-foreground text-balance sm:text-6xl lg:text-[4.25rem]"
          >
            One profile.
            <br />
            Hired{" "}
            <span className="italic text-primary">everywhere.</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
            Stop re-typing your life story into every job form. Skilved gives you one{" "}
            <span className="font-semibold text-foreground">verified career profile</span>{" "}
            — your skills, reputation and work history in one place — that you reuse on
            every application, forever, with a single link.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/auth/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              Build your career profile — free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-foreground transition-colors hover:text-primary"
            >
              Browse opportunities
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-10 border-t border-border pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              Opportunities from South Africa&apos;s biggest employers
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              {TRUSTED_BY.map((name) => (
                <span
                  key={name}
                  className="font-display text-base font-semibold tracking-tight text-foreground/70"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: floating profile */}
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="relative rounded-2xl border border-border bg-card p-5 shadow-xl shadow-foreground/5">
            {/* URL bar */}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <Link2 className="h-3.5 w-3.5 flex-none text-primary" aria-hidden />
              <span className="truncate font-mono text-xs text-muted-foreground">
                skilved.com/<span className="font-semibold text-foreground">thabo-m</span>
              </span>
              <span className="ml-auto flex flex-none items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <BadgeCheck className="h-3 w-3" aria-hidden />
                Verified
              </span>
            </div>

            {/* Identity */}
            <div className="mt-4 flex items-center gap-3">
              <span
                className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
                aria-hidden
              >
                TM
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-semibold leading-tight text-foreground">
                  Thabo Mokoena
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Qualified Electrician · Gauteng
                </p>
              </div>
              <div className="ml-auto flex flex-none flex-col items-end">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current text-amber" aria-hidden />
                  <span className="text-sm font-bold text-foreground">4.9</span>
                </div>
                <span className="text-[10px] text-muted-foreground">28 reviews</span>
              </div>
            </div>

            {/* Skills */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {PROFILE_SKILLS.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground"
                >
                  <Check className="h-3 w-3 text-primary" aria-hidden />
                  {skill}
                </span>
              ))}
            </div>

            {/* Endorsement */}
            <blockquote className="mt-4 rounded-xl border border-border bg-background p-3">
              <p className="text-xs leading-relaxed text-foreground">
                &ldquo;One of the most reliable electricians on my site. I verified his work
                myself.&rdquo;
              </p>
              <footer className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <BadgeCheck className="h-3.5 w-3.5 text-verified" aria-hidden />
                Site Manager, Eskom · verified peer review
              </footer>
            </blockquote>
          </div>
        </div>
      </div>

      {/* ── Three services band ────────────────────────── */}
      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
        {SERVICES.map(({ Icon, kicker, title, body }) => (
          <div key={title} className="bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                {kicker}
              </span>
            </div>
            <p className="mt-3 font-display text-lg font-semibold leading-snug text-foreground">
              {title}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
