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
    body: "Your trade, qualifications and certificates are verified once — then trusted everywhere. No more proving yourself from scratch.",
  },
  {
    Icon: Star,
    title: "A reputation you own",
    body: "Past managers and peers vouch for your work. Real reviews build a rating that follows you, not a CV that gets thrown away.",
  },
  {
    Icon: Sparkles,
    title: "AI that finds the work",
    body: "Your passport is matched to jobs and recruiters automatically. Opportunities come to you — the right ones, near you.",
  },
]

const PASSPORT_SKILLS = ["Electrical", "Wiring & Installation", "Solar PV", "Fault-finding"]

export function CareerPassportPitch() {
  return (
    <section
      aria-labelledby="passport-heading"
      className="relative my-10 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 dark:border-primary/30 dark:bg-card sm:p-8"
    >
      {/* Ambient glow accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl"
      />

      {/* Hook */}
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Stop starting over
        </p>
        <h2
          id="passport-heading"
          className="mt-3 max-w-xl text-2xl font-bold leading-tight tracking-tight text-balance sm:text-4xl"
        >
          Tired of filling in the same application on every site?
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 text-pretty sm:text-base">
          Skilved gives you one{" "}
          <span className="font-semibold text-zinc-100">digital career passport</span> — a
          verified, AI-powered profile that lives at your own link. Apply anywhere with a
          single tap, and let your reputation speak before you do.
        </p>
      </div>

      {/* Passport preview card */}
      <div className="relative mt-8 grid gap-6 lg:grid-cols-2 lg:items-center">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-2xl">
          {/* URL bar */}
          <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
            <Link2 className="h-3.5 w-3.5 flex-none text-primary" aria-hidden />
            <span className="truncate font-mono text-xs text-zinc-400">
              skilved.com/<span className="text-zinc-100">thabo-m</span>
            </span>
            <span className="ml-auto flex flex-none items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
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
              <p className="truncate font-bold text-zinc-100">Thabo Mokoena</p>
              <p className="truncate text-xs text-zinc-400">
                Qualified Electrician · Gauteng
              </p>
            </div>
            <div className="ml-auto flex flex-none items-center gap-1 text-amber-400">
              <Star className="h-4 w-4 fill-current" aria-hidden />
              <span className="text-sm font-bold">4.9</span>
            </div>
          </div>

          {/* Skills */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {PASSPORT_SKILLS.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[11px] font-medium text-zinc-300"
              >
                <Check className="h-3 w-3 text-primary" aria-hidden />
                {skill}
              </span>
            ))}
          </div>

          {/* Endorsement */}
          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs leading-relaxed text-zinc-300">
              {'"'}One of the most reliable electricians on my site. Verified his work
              myself.{'"'}
            </p>
            <p className="mt-1.5 text-[11px] font-medium text-zinc-500">
              — Site Manager, Eskom · verified peer review
            </p>
          </div>
        </div>

        {/* Pillars */}
        <ul className="space-y-4">
          {PILLARS.map(({ Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span
                className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary/15 text-primary"
                aria-hidden
              >
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-zinc-100">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-zinc-400 text-pretty">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="relative mt-8 flex flex-col gap-3 border-t border-zinc-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-400">
          Free to build. Yours to keep.{" "}
          <span className="font-semibold text-zinc-100">Not just skilled. Skilved.</span>
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
