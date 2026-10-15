import { IdSchema, parseReadQuery } from "@skilved/types/opportunities"

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

/** Only public catalogue query fields travel to detail, never history or private state. */
export function opportunityHref(id: string, query: URLSearchParams) {
  IdSchema.parse(id)
  const from = catalogueHref(query)
  return `/opportunities/${id}?${new URLSearchParams({ from })}`
}

/** Untrusted URL context can point only at the canonical catalogue and a valid card. */
export function catalogueReturnHref(from: string | string[] | undefined, id: string): string | null {
  if (typeof from !== "string" || from.length > 8192 || !IdSchema.safeParse(id).success || /[\u0000-\u001f\u007f\\#]/.test(from)) return null
  if (from !== "/" && !from.startsWith("/?")) return null
  const query = new URLSearchParams(from === "/" ? "" : from.slice(2))
  if (!parseReadQuery(query).ok) return null
  return `${catalogueHref(query)}#opportunity-${id}`
}

export function catalogueFailure(error: unknown): "invalid_query" | "invalid_cursor" | "stale_cursor" | "unavailable" {
  const code = error && typeof error === "object" && "code" in error ? error.code : null
  if (code === "INVALID_QUERY") return "invalid_query"
  if (code === "INVALID_CURSOR") return "invalid_cursor"
  if (code === "STALE_CURSOR") return "stale_cursor"
  return "unavailable"
}
