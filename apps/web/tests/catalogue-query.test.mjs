import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { test } from "node:test"

const require = createRequire(import.meta.url)
const ts = require("typescript")
const source = await readFile(new URL("../src/lib/catalogue-query.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const loaded = { exports: {} }
new Function("require", "exports", compiled.outputText)(require, loaded.exports)
const { parseCataloguePageQuery, catalogueHref, catalogueFailure } = loaded.exports
const { encodeCursor, decodeCursor } = require("@skilved/types/opportunities")
const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")

async function catalogueView(result, params) {
  const text = await readFile(new URL("../src/components/catalogue/PublicCatalogue.tsx", import.meta.url), "utf8")
  const output = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } })
  const exports = {}
  const dependencies = id => {
    if (id === "@/lib/public-catalogue") return { readCatalogue: async () => result }
    if (id === "@/lib/catalogue-query") return loaded.exports
    if (id === "@/components/layout/Header") return { Header: () => null }
    if (id === "next/link") return { __esModule: true, default: ({ href, children, ...props }) => React.createElement("a", { href, ...props }, children) }
    return require(id)
  }
  new Function("require", "exports", output.outputText)(dependencies, exports)
  return renderToStaticMarkup(await exports.PublicCatalogue({ query: params }))
}

test("page queries retain geography, explicit false and literal search semantics", () => {
  const result = parseCataloguePageQuery({ q: "  café electrician  ", category: "job", province: "gauteng", coverage: "national", remote: "false", limit: "5" })
  assert.equal(result.ok, true)
  assert.equal(result.query.q, "café electrician")
  assert.equal(result.query.province, "gauteng")
  assert.equal(result.query.remote, false)
  assert.equal(result.query.limit, 5)
})

test("empty optional selects mean all, while duplicate and unknown fields are rejected", () => {
  assert.equal(parseCataloguePageQuery({ q: "", category: "", province: "", coverage: "", remote: "" }).ok, true)
  for (const query of [{ province: ["gauteng", "western_cape"] }, { category: ["", "job"] }, { userId: "private" }, { residence: "gauteng" }, { admin: "" }, { remote: "yes" }, { limit: "51" }, { q: "x".repeat(121) }]) {
    assert.equal(parseCataloguePageQuery(query).ok, false, JSON.stringify(query))
  }
})

test("pagination retains the exact filter binding and does not mutate the previous URL", () => {
  const parsed = parseCataloguePageQuery({ q: "electrician", category: "job", province: "western_cape", remote: "false", limit: "5" })
  const token = encodeCursor(parsed.query, 12, { id: "last_record", updatedAt: "2026-10-15T04:00:00.000Z" })
  const before = parsed.params.toString()
  const href = catalogueHref(parsed.params, { cursor: token })
  const params = new URL(href, "https://skilved.test").searchParams
  const next = parseCataloguePageQuery(Object.fromEntries(params))
  assert.equal(parsed.params.toString(), before)
  assert.equal(next.query.province, "western_cape")
  assert.equal(next.query.remote, false)
  assert.equal(decodeCursor(params.get("cursor"), next.query, 12).ok, true)
  assert.equal(decodeCursor(params.get("cursor"), { ...next.query, province: "gauteng" }, 12).ok, false)
})

test("stale-page restart drops the cursor while preserving filters", () => {
  const params = new URLSearchParams("q=engineer&province=gauteng&coverage=national&cursor=old")
  const href = catalogueHref(params, { restart: true })
  assert.equal(href, "/?q=engineer&province=gauteng&coverage=national")
  assert.equal(params.get("cursor"), "old")
  assert.equal(catalogueHref(new URLSearchParams()), "/")
})

test("links stay local and unsafe parameters cannot be silently carried forward", () => {
  const href = catalogueHref(new URLSearchParams({ q: "https://elsewhere.example/?a=1&b=2" }))
  assert.equal(new URL(href, "https://skilved.test").origin, "https://skilved.test")
  assert.throws(() => catalogueHref(new URLSearchParams("role=admin")), /INVALID_QUERY/)
  assert.throws(() => catalogueHref(new URLSearchParams("q=one&q=two")), /INVALID_QUERY/)
})

test("query and cursor failures remain distinct from safe generic service failures", () => {
  assert.equal(catalogueFailure({ code: "INVALID_QUERY" }), "invalid_query")
  assert.equal(catalogueFailure({ code: "INVALID_CURSOR" }), "invalid_cursor")
  assert.equal(catalogueFailure({ code: "STALE_CURSOR" }), "stale_cursor")
  for (const error of [null, "PRIVATE_ERROR", new Error("PRIVATE_STACK"), { code: "PRIVATE_DATABASE_PATH" }]) assert.equal(catalogueFailure(error), "unavailable")
})

test("feed renders geographic controls and retains filters in pagination without resubmitting old cursor", async () => {
  const html = await catalogueView({ kind: "page", page: { items: [], nextCursor: "next_cursor" } }, new URLSearchParams("province=gauteng&remote=false&limit=5&cursor=old"))
  assert.match(html, /name="province"/)
  assert.match(html, /name="coverage"/)
  assert.match(html, /value="gauteng" selected=""/)
  assert.match(html, /value="false" selected=""/)
  assert.match(html, /province=gauteng&amp;remote=false&amp;limit=5&amp;cursor=next_cursor/)
  assert.doesNotMatch(html, /name="cursor"/)
  assert.match(html, /No opportunities match these filters/)
})

test("stale cursor, invalid filters and outage each render honest recovery instead of empty results", async () => {
  for (const [reason, title] of [["stale_cursor", "The results have changed"], ["invalid_cursor", "This results link needs a fresh search"], ["invalid_query", "These filters could not be read"], ["unavailable", "The catalogue is temporarily unavailable"]]) {
    const html = await catalogueView({ kind: "error", reason }, new URLSearchParams(reason === "invalid_query" ? "admin=true" : "province=gauteng&cursor=old"))
    assert.ok(html.includes(title), reason)
    assert.doesNotMatch(html, /No published opportunities yet|No opportunities match these filters/)
    if (reason.includes("cursor")) assert.match(html, /href="\/\?province=gauteng"/)
    if (reason === "invalid_query") assert.match(html, /href="\/"/)
  }
})

test("read boundary rejects bad queries before SDK calls and classifies backend failures safely", async () => {
  const text = await readFile(new URL("../src/lib/public-catalogue.ts", import.meta.url), "utf8")
  const output = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
  let calls = 0, failure = { code: "STALE_CURSOR" }
  const exports = {}
  new Function("require", "exports", output.outputText)(id => id === "@/lib/catalogue-query" ? loaded.exports : id === "@skilved/catalogue/runtime" ? { getRuntime: async () => { calls++; throw failure } } : require(id), exports)
  const previous = process.env.SKILVED_CATALOGUE_READS
  process.env.SKILVED_CATALOGUE_READS = "true"
  try {
    assert.deepEqual(await exports.readCatalogue(new URLSearchParams("admin=true")), { kind: "error", reason: "invalid_query" })
    assert.equal(calls, 0)
    assert.deepEqual(await exports.readCatalogue(new URLSearchParams("province=gauteng")), { kind: "error", reason: "stale_cursor" })
    failure = new Error("PRIVATE_DATABASE_DETAILS")
    assert.deepEqual(await exports.readCatalogue(new URLSearchParams()), { kind: "error", reason: "unavailable" })
  } finally { if (previous === undefined) delete process.env.SKILVED_CATALOGUE_READS; else process.env.SKILVED_CATALOGUE_READS = previous }
})
