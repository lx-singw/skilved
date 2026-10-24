import { PublicChecklistOriginSchema } from "@skilved/types/opportunities"

/** Server settings only. The sole output is public origin, never the environment or request headers. */
export function publicExportSettings(env: Record<string, string | undefined> = process.env): { origin: string | null } {
  try {
    const parsed = PublicChecklistOriginSchema.safeParse(env.SKILVED_PUBLIC_ORIGIN)
    return { origin: parsed.success ? parsed.data : null }
  } catch { return { origin: null } }
}
