import type { OpportunitySalary } from "@/types/opportunity"

/** Format a salary object into the brand-voice display string. */
export function formatSalary(salary: OpportunitySalary): string {
  switch (salary.kind) {
    case "funded":
      return "Funded"
    case "market-related":
      return "Market related"
    case "stipend": {
      if (salary.min && salary.max && salary.min !== salary.max) {
        return `R${formatRand(salary.min)}–R${formatRand(salary.max)}/month stipend`
      }
      return `R${formatRand(salary.min ?? 0)}/month stipend`
    }
    case "salary": {
      if (salary.min && salary.max && salary.min !== salary.max) {
        return `R${formatRand(salary.min)}–R${formatRand(salary.max)}/month`
      }
      return `R${formatRand(salary.min ?? 0)}/month`
    }
    default:
      return "Market related"
  }
}

/** 4500 -> "4,500" */
export function formatRand(value: number): string {
  return value.toLocaleString("en-ZA")
}

/** Format an ISO date into "15 July 2026". */
export function formatDate(iso: string | null): string {
  if (!iso) return "Open until filled"
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * Brand-voice freshness string: "Found 2h ago by Skilved".
 */
export function formatFreshness(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) {
    return `Found ${Math.max(minutes, 1)}m ago by Skilved`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `Found ${hours}h ago by Skilved`
  }
  const days = Math.floor(hours / 24)
  return `Found ${days}d ago by Skilved`
}

/** Days remaining until a deadline. Negative means expired. */
export function daysUntil(iso: string | null, now: Date = new Date()): number | null {
  if (!iso) return null
  const diffMs = new Date(iso).getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/** Hours since the opportunity was found. */
export function hoursSince(iso: string, now: Date = new Date()): number {
  return (now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60)
}
