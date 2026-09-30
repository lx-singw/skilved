import { getRuntime } from "@skilved/catalogue/runtime"
import { DetailResponseSchema, IdSchema, ListResponseSchema } from "@skilved/types/opportunities"

// Server-only consumers receive the same checked projections as the versioned public API.
export async function readCatalogue(query: URLSearchParams) {
  if (process.env.SKILVED_CATALOGUE_READS !== "true") return null
  try {
    const runtime = await getRuntime()
    if (!runtime.config.reads) return null
    return ListResponseSchema.parse(await runtime.catalogue.list(query))
  } catch { return null }
}

export async function readOpportunity(id: string) {
  if (process.env.SKILVED_CATALOGUE_READS !== "true" || !IdSchema.safeParse(id).success) return null
  try {
    const runtime = await getRuntime()
    if (!runtime.config.reads) return null
    return DetailResponseSchema.parse(await runtime.catalogue.detail(id))
  } catch { return null }
}
