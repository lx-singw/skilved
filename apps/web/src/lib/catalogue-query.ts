import { parseReadQuery } from "@skilved/types/opportunities"

type PageParams = Record<string, string | string[] | undefined>
const emptySelections = new Set(["category", "province", "coverage", "remote"])

/** Preserve all supplied parameters so the canonical contract can reject bad input. */
export function parseCataloguePageQuery(input: PageParams) {
  const params = new URLSearchParams()
  for (const [key, raw] of Object.entries(input)) {
    if (raw === undefined) continue
    const values = Array.isArray(raw) ? raw : [raw]
    // One empty optional select means "all"; repeated values still fail validation.
    if (values.length === 1 && values[0] === "" && emptySelections.has(key)) continue
    for (const value of values) params.append(key, value)
  }
  const result = parseReadQuery(params)
  return result.ok ? { ok: true as const, query: result.query, params } : { ...result, params }
}

/** Fixed local route; retain geographic/text filters and replace only the cursor. */
export function catalogueHref(input: URLSearchParams, options: { cursor?: string | null; restart?: boolean } = {}) {
  const params = new URLSearchParams(input)
  if (options.restart || options.cursor === null) params.delete("cursor")
  else if (options.cursor !== undefined) params.set("cursor", options.cursor)
  if (!parseReadQuery(params).ok) throw new Error("INVALID_QUERY")
  const query = params.toString()
  return query ? `/?${query}` : "/"
}

export function catalogueFailure(error: unknown): "invalid_query" | "invalid_cursor" | "stale_cursor" | "unavailable" {
  const code = error && typeof error === "object" && "code" in error ? error.code : null
  if (code === "INVALID_QUERY") return "invalid_query"
  if (code === "INVALID_CURSOR") return "invalid_cursor"
  if (code === "STALE_CURSOR") return "stale_cursor"
  return "unavailable"
}
