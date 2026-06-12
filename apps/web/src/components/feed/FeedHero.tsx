"use client"

import Link from "next/link"
import {
  ShieldCheck,
  Star,
  Sparkles,
  ArrowRight,
  Link2,
  Check,
} from "lucide-react"

const PILLARS = [
  {
    Icon: ShieldCheck,
    title: "Verified, not claimed",
    body: "Your trade, qualifications, and certificates are verified once — then trusted everywhere. No more proving yourself from scratch on every platform.",
  },
  {
    Icon: Star,
    title: "A reputation you own",
    body: "Past managers and peers vouch for your work. Real reviews build a rating that follows you — not a CV that gets thrown away.",
  },
  {
    Icon: Sparkles,
    title: "AI that finds the work",
    body: "Your passport is matched to jobs and recruiters automatically. The right opportunities come to you, near you.",
  },
]

const PASSPORT_SKILLS = ["Electrical", "Wiring & Installation", "Solar PV", "Fault-finding"]

export function FeedHero({ count }: { count: number }) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      {/* Subtle ambient glow — visible in both themes */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
      />

      {/* Hook */}
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {count}+ live opportunities · stop starting over
        </p>
        <h1
          id="hero-heading"
          className="mt-3 max-w-xl text-2xl font-bold leading-tight tracking-tight text-foreground text-balance sm:text-4xl"
        >
          Tired of filling in the same application on every site?
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
          Skilved gives you one{" "}
          <span className="font-semibold text-foreground">digital career passport</span> — a
          verified, AI-powered profile that lives at your own link. Apply anywhere
          with a single tap, and let your reputation speak before you do.
        </p>
      </div>

      {/* Passport preview + pillars */}
      <div className="relative mt-8 grid gap-6 lg:grid-cols-2 lg:items-center">

        {/* Preview card */}
        <div className="rounded-xl border border-border bg-muted/50 p-5 shadow-sm">

          {/* URL bar */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <Link2 className="h-3.5 w-3.5 flex-none text-primary" aria-hidden />
            <span className="truncate font-mono text-xs text-muted-foreground">
              skilved.com/<span className="font-semibold text-foreground">thabo-m</span>
            </span>
            <span className="ml-auto flex flex-none items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              Verified
            </span>
          </div>

          {/* Identity */}
          <div className="mt-4 flex items-center gap-3">
            <span
              className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground"
              aria-hidden
            >
              TM
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold text-foreground">Thabo Mokoena</p>
              <p className="truncate text-xs text-muted-foreground">
                Qualified Electrician · Gauteng
              </p>
            </div>
            <div className="ml-auto flex flex-none items-center gap-1">
              <Star className="h-4 w-4 fill-current text-amber" aria-hidden />
              <span className="text-sm font-bold text-foreground">4.9</span>
            </div>
          </div>

          {/* Skills */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {PASSPORT_SKILLS.map((skill) => (
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
          <blockquote className="mt-4 rounded-lg border border-border bg-background p-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              &ldquo;One of the most reliable electricians on my site. Verified his work
              myself.&rdquo;
            </p>
            <footer className="mt-1.5 text-[11px] font-medium text-muted-foreground/70">
              — Site Manager, Eskom · verified peer review
            </footer>
          </blockquote>
        </div>

        {/* Pillars */}
        <ul className="space-y-5">
          {PILLARS.map(({ Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span
                className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary"
                aria-hidden
              >
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="relative mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Free to build. Yours to keep.{" "}
          <span className="font-semibold text-foreground">Not just skilled. Skilved.</span>
        </p>
        <Link
          href="/auth/signup"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Create your career passport
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  )
}
