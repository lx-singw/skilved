import { getTrade } from "@/constants/trades"
import { getProvince } from "@/constants/provinces"
import { Briefcase, MapPin } from "lucide-react"
import type { WorkEntry } from "@/types/user"

interface ProfileWorkHistoryProps {
  entries: WorkEntry[]
}

function formatMonthRange(start: string, end: string | null): string {
  const fmt = (ym: string) => {
    const [y, m] = ym.split("-")
    return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-ZA", {
      month: "short",
      year: "numeric",
    })
  }
  return `${fmt(start)} – ${end ? fmt(end) : "Present"}`
}

function durationLabel(start: string, end: string | null): string {
  const startDate = new Date(start + "-01")
  const endDate = end ? new Date(end + "-01") : new Date()
  const months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth())
  if (months < 12) return `${months} mo`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years} yr ${rem} mo` : `${years} yr`
}

function WorkCard({ entry }: { entry: WorkEntry }) {
  const trade = getTrade(entry.tradeId)
  const province = getProvince(entry.province)
  const isCurrent = entry.endMonth === null

  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center pt-1">
        <div
          className="h-2.5 w-2.5 flex-none rounded-full border-2"
          style={{ borderColor: trade.color, backgroundColor: isCurrent ? trade.color : "transparent" }}
          aria-hidden
        />
        <div className="mt-1 w-px flex-1 bg-border" aria-hidden />
      </div>

      <div className="min-w-0 flex-1 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-0.5">
          <div>
            <p className="font-semibold leading-snug text-foreground">{entry.title}</p>
            <p className="text-sm text-muted-foreground">{entry.organisation}</p>
          </div>
          {isCurrent && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Current
            </span>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{formatMonthRange(entry.startMonth, entry.endMonth)}</span>
          <span className="text-border">·</span>
          <span>{durationLabel(entry.startMonth, entry.endMonth)}</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden />
            {province.label}
          </span>
        </div>

        {entry.description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{entry.description}</p>
        )}
      </div>
    </li>
  )
}

export function ProfileWorkHistory({ entries }: ProfileWorkHistoryProps) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4">
        <Briefcase className="h-5 w-5 flex-none text-muted-foreground/50" aria-hidden />
        <p className="text-sm text-muted-foreground">No work history added yet.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-0" aria-label="Work history">
      {entries.map((entry) => (
        <WorkCard key={entry.id} entry={entry} />
      ))}
    </ul>
  )
}
