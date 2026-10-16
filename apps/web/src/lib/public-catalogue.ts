import { getRuntime } from "@skilved/catalogue/runtime"
import { DetailResponseSchema, IdSchema, ListResponseSchema, parseReadQuery } from "@skilved/types/opportunities"
import { catalogueFailure } from "@/lib/catalogue-query"

export type CatalogueReadResult = { kind: "page"; page: ReturnType<typeof ListResponseSchema.parse> } |
  { kind: "error"; reason: ReturnType<typeof catalogueFailure> }

// Server-only consumers receive the same checked projections as the versioned public API.
export async function readCatalogue(query: URLSearchParams): Promise<CatalogueReadResult> {
  if (!parseReadQuery(query).ok) return { kind: "error", reason: "invalid_query" }
  if (process.env.SKILVED_CATALOGUE_READS !== "true") return { kind: "error", reason: "unavailable" }
  try {
    const runtime = await getRuntime()
    if (!runtime.config.reads) return { kind: "error", reason: "unavailable" }
    return { kind: "page", page: ListResponseSchema.parse(await runtime.catalogue.list(query)) }
  } catch (error) { return { kind: "error", reason: catalogueFailure(error) } }
}

export async function readOpportunity(id: string) {
  if (process.env.SKILVED_CATALOGUE_READS !== "true" || !IdSchema.safeParse(id).success) return null
  try {
    const runtime = await getRuntime()
    if (!runtime.config.reads) return { kind: "unavailable" as const }
    return DetailResponseSchema.parse(await runtime.catalogue.detail(id))
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "NOT_FOUND") return null
    return { kind: "unavailable" as const }
  }
}
