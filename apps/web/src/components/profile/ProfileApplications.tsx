"use client"

import { useState } from "react"
import { cn } from "@/utils/classNames"
import { Send, ChevronDown } from "lucide-react"
import type { TrackedApplication, ApplicationOutcome } from "@/types/user"

interface ProfileApplicationsProps {
  applications: TrackedApplication[]
}

const OUTCOME_META: Record<
  ApplicationOutcome,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  pending:     { label: "Pending",     bgClass: "bg-muted",        textClass: "text-muted-foreground", borderClass: "border-border" },
  shortlisted: { label: "Shortlisted", bgClass: "bg-primary/10",   textClass: "text-primary",          borderClass: "border-primary/30" },
  offered:     { label: "Offered",     bgClass: "bg-verified/10",  textClass: "text-verified",         borderClass: "border-verified/30" },
  accepted:    { label: "Accepted",    bgClass: "bg-verified/15",  textClass: "text-verified",         borderClass: "border-verified/40" },
  rejected:    { label: "Not selected", bgClass: "bg-muted",       textClass: "text-muted-foreground", borderClass: "border-border" },
  withdrawn:   { label: "Withdrawn",   bgClass: "bg-muted",        textClass: "text-muted-foreground", borderClass: "border-border" },
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 30) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

function AppRow({ app }: { app: TrackedApplication }) {
  const [expanded, setExpanded] = useState(false)
  const meta = OUTCOME_META[app.outcome]

  return (
    <li className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-start gap-3 p-4 text-left"
        aria-expanded={expanded}
      >
        <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md bg-muted text-muted-foreground" aria-hidden>
          <Send className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <p className="font-semibold leading-snug text-foreground">{app.opportunityTitle}</p>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-medium",
                meta.bgClass, meta.textClass, meta.borderClass,
              )}
            >
              {meta.label}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{app.organisation}</p>
          <p className="mt-1 text-xs text-muted-foreground">Applied {formatRelative(app.appliedAt)}</p>
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-4 w-4 flex-none text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {expanded && app.note && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{app.note}</p>
        </div>
      )}
    </li>
  )
}

export function ProfileApplications({ applications }: ProfileApplicationsProps) {
  if (applications.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4">
        <Send className="h-5 w-5 flex-none text-muted-foreground/50" aria-hidden />
        <p className="text-sm text-muted-foreground">No applications tracked yet.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3" aria-label="Tracked applications">
      {applications.map((app) => (
        <AppRow key={app.id} app={app} />
      ))}
    </ul>
  )
}
