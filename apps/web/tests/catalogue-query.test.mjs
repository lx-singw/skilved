import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { test } from "node:test"
import { makeRecord } from "../../../packages/types/tests/fixtures/opportunities.mjs"
import { loadUi } from "./helpers/load-ui.mjs"

const require = createRequire(import.meta.url)
const ts = require("typescript")
const source = await readFile(new URL("../src/lib/catalogue-query.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const loaded = { exports: {} }
new Function("require", "exports", compiled.outputText)(require, loaded.exports)
const { parseCataloguePageQuery, catalogueHref, catalogueFailure, opportunityHref, catalogueReturnHref } = loaded.exports
const { encodeCursor, decodeCursor } = require("@skilved/types/opportunities")
const { projectOpportunity } = require("@skilved/types/opportunities/internal")
const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")

async function catalogueView(result, params) {
  const dependencies = id => {
    if (id === "@/lib/public-catalogue") return { readCatalogue: async () => result }
    if (id === "@/lib/catalogue-query") return loaded.exports
    if (id === "@/components/layout/Header") return { Header: () => null }
    if (id === "next/link") return { __esModule: true, default: ({ href, children, ...props }) => React.createElement("a", { href, ...props }, children) }
    return require(id)
  }
  const ui = loadUi("components/catalogue/PublicCatalogue.tsx", {
    "@/lib/public-catalogue": dependencies("@/lib/public-catalogue"),
    "@/lib/catalogue-query": loaded.exports,
    "@/components/layout/Header": dependencies("@/components/layout/Header"),
    "next/link": dependencies("next/link"),
  })
  return renderToStaticMarkup(await ui.PublicCatalogue({ query: params }))
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

test("detail return context preserves Unicode, explicit false and the real cursor filter binding", () => {
  const parsed = parseCataloguePageQuery({ q: "café & tools", category: "job", province: "gauteng", remote: "false", limit: "2" })
  const token = encodeCursor(parsed.query, 7, { id: "previous", updatedAt: "2026-10-15T06:00:00.000Z" })
  parsed.params.set("cursor", token)
  const href = opportunityHref("current_card", parsed.params)
  const detail = new URL(href, "https://skilved.test")
  assert.equal(detail.pathname, "/opportunities/current_card")
  assert.deepEqual([...detail.searchParams.keys()], ["from"])
  const back = catalogueReturnHref(detail.searchParams.get("from"), "current_card")
  const results = new URL(back, "https://skilved.test")
  assert.equal(results.pathname, "/")
  assert.equal(results.hash, "#opportunity-current_card")
  assert.equal(results.searchParams.get("q"), "café & tools")
  assert.equal(results.searchParams.get("remote"), "false")
  assert.equal(results.searchParams.get("cursor"), token)
  assert.equal(decodeCursor(token, parseCataloguePageQuery(Object.fromEntries(results.searchParams)).query, 7).ok, true)
})

test("untrusted return context rejects external, private, duplicate, oversized and malformed targets", () => {
  for (const value of [undefined, ["/"], ["/", "/"], "https://elsewhere.example/", "//elsewhere.example/", " /", "/other", "/?receipt=PRIVATE", "/?q=one&q=two", "/?province=bad", "/?remote=yes", "/?limit=51", "/?cursor=", "/?q="+"x".repeat(8192), "/#other", "/?q=one#other", "/?q=one\n", "/?q=one\\two", "/?from=/"]) {
    assert.equal(catalogueReturnHref(value, "current_card"), null, JSON.stringify(value))
  }
  assert.equal(catalogueReturnHref("/", "current_card"), "/#opportunity-current_card")
  assert.equal(catalogueReturnHref("/?q=", "current_card"), "/?q=#opportunity-current_card")
  assert.equal(catalogueReturnHref("/", "../bad"), null)
  assert.throws(() => opportunityHref("../bad", new URLSearchParams()))
  assert.throws(() => opportunityHref("card", new URLSearchParams("receipt=PRIVATE")), /INVALID_QUERY/)
})

test("a changed catalogue can restart returned results with filters intact and no stale cursor", () => {
  const back = catalogueReturnHref("/?province=gauteng&remote=false&limit=1&cursor=old", "card")
  const params = new URL(back, "https://skilved.test").searchParams
  assert.equal(catalogueHref(params, { restart: true }), "/?province=gauteng&remote=false&limit=1")
  assert.equal(params.get("cursor"), "old")
})

test("both rendered detail links carry the same public query and the card has a stable return target", async () => {
  const o = projectOpportunity(makeRecord()).opportunity
  const params = new URLSearchParams("province=gauteng&remote=false&limit=2")
  const html = await catalogueView({ kind: "page", page: { items: [o], nextCursor: null } }, params)
  const href = opportunityHref(o.id, params).replaceAll("&", "&amp;")
  assert.equal(html.split(`href="${href}"`).length - 1, 2)
  assert.ok(html.includes(`id="opportunity-${o.id}"`))
  assert.match(html, /scroll-mt-20/)
  assert.doesNotMatch(html, /PRIVATE_|localStorage|sessionStorage/)
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
  for (const [reason, title] of [["stale_cursor", "The results have changed"], ["invalid_cursor", "This results link needs a fresh search"], ["invalid_query", "These filters could not be read"], ["unavailable", "Your feed couldn’t load this time"]]) {
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

test("field form blanks widen but duplicate fields and oversized values fail", () => {
  for (const field of ["", "  "]) {
    const result = parseCataloguePageQuery({ field, q: "" });
    assert.equal(result.ok, true); assert.equal(result.params.has("field"), false);
  }
  for (const field of [["", "engineering"], ["", ""], "x".repeat(121)])
    assert.equal(parseCataloguePageQuery({ field }).ok, false);
});
test("field survives pagination, detail reload context and stale restart with its cursor binding", () => {
  const parsed = parseCataloguePageQuery({ field: "Café & engineering", province: "gauteng", limit: "2" });
  const token = encodeCursor(parsed.query, 3, { id: "previous", updatedAt: "2026-10-15T04:00:00.000Z" });
  const more = new URL(catalogueHref(parsed.params, { cursor: token }), "https://skilved.test");
  const detail = new URL(opportunityHref("card", more.searchParams), more);
  const back = new URL(catalogueReturnHref(detail.searchParams.get("from"), "card"), more);
  assert.equal(back.searchParams.get("field"), "Café & engineering");
  assert.equal(back.searchParams.get("cursor"), token);
  assert.equal(decodeCursor(token, parseCataloguePageQuery(Object.fromEntries(back.searchParams)).query, 3).ok, true);
  const restart = new URL(catalogueHref(back.searchParams, { restart: true }), more);
  assert.equal(restart.searchParams.has("cursor"), false);
  assert.equal(restart.searchParams.get("field"), "Café & engineering");
});
test("field controls explain unknown coverage and safely render listed labels", async () => {
  const o = projectOpportunity(makeRecord()).opportunity;
  o.fields = ['Engineering <script>unsafe</script>'];
  const html = await catalogueView({ kind: "page", page: { items: [o], nextCursor: null } }, new URLSearchParams({ field: 'Engineering "quoted"' }));
  assert.match(html, /for="catalogue-field"/);
  assert.match(html, /name="field"/); assert.match(html, /maxLength="120"/);
  assert.match(html, /aria-describedby="catalogue-field-help"/);
  assert.match(html, /Clear it to include opportunities with no field stated/);
  assert.ok(html.includes('Field: Engineering &lt;script&gt;unsafe&lt;/script&gt;'));
  assert.doesNotMatch(html, /<script>unsafe/);
  o.fields = [];
  assert.match(await catalogueView({ kind: "page", page: { items: [o], nextCursor: null } }, new URLSearchParams()), /Field not stated/);
  const empty = await catalogueView({ kind: "page", page: { items: [], nextCursor: null } }, new URLSearchParams('field=engineering'));
  assert.match(empty, /No opportunities match these filters/); assert.match(empty, /Clear filters/);
});

test("stage selection retains field, pagination and detail-return/restart while blank selection widens", async () => {
  assert.equal(parseCataloguePageQuery({stage:""}).ok, true);
  assert.equal(parseCataloguePageQuery({stage:""}).params.has("stage"), false);
  for (const stage of [["", "graduate"], ["graduate","student"], "unknown", "no_experience"])
    assert.equal(parseCataloguePageQuery({stage}).ok, false);
  const selected=parseCataloguePageQuery({stage:"graduate",field:"Engineering",limit:"1"});
  const token=encodeCursor(selected.query,4,{id:"previous",updatedAt:"2026-10-15T04:00:00.000Z"});
  selected.params.set("cursor",token);
  const detail=new URL(opportunityHref("card",selected.params),"https://skilved.test");
  const back=new URL(catalogueReturnHref(detail.searchParams.get("from"),"card"),detail);
  assert.equal(back.searchParams.get("stage"),"graduate");
  assert.equal(back.searchParams.get("field"),"Engineering");
  assert.equal(decodeCursor(token,parseCataloguePageQuery(Object.fromEntries(back.searchParams)).query,4).ok,true);
  const restart=new URL(catalogueHref(back.searchParams,{restart:true}),detail);
  assert.equal(restart.searchParams.has("cursor"),false); assert.equal(restart.searchParams.get("stage"),"graduate");
  const html=await catalogueView({kind:"page",page:{items:[],nextCursor:null}},new URLSearchParams("stage=graduate"));
  assert.match(html,/for="catalogue-stage"/);assert.match(html,/aria-describedby="catalogue-stage-help"/);
  assert.match(html,/value="graduate" selected=""/);assert.match(html,/All entry stages/);
  assert.match(html,/Choose all stages to include unknowns/);assert.match(html,/Entry level does not mean no experience required/);
  assert.match(html,/No opportunities match these filters/);
});

test("limited catalogue and empty search states never infer market absence or a future intake season", async () => {
  const o = projectOpportunity(makeRecord()).opportunity
  for (const items of [[], [o]]) {
    const html = await catalogueView({ kind: "page", page: { items, nextCursor: null } }, new URLSearchParams())
    assert.match(html, /published notices on Skilved, not every available opportunity/)
    assert.match(html, /an empty category does not tell you when a future intake opens/)
    if (!items.length) assert.match(html, /does not mean there are no opportunities elsewhere/)
    assert.doesNotMatch(html, /closed for the season|next intake opens in|No opportunities exist/)
  }
  const filtered = await catalogueView({ kind: "page", page: { items: [], nextCursor: null } }, new URLSearchParams("category=internship&stage=student&field=engineering"))
  assert.match(filtered, /Try widening the filters above/)
  assert.match(filtered, /missing field or entry-stage details/)
  assert.match(filtered, /href="\/"[^>]*>Clear filters/)
  const outage = await catalogueView({ kind: "error", reason: "unavailable" }, new URLSearchParams())
  assert.doesNotMatch(outage, /published notices on Skilved|No published opportunities yet/)
})

test("detail boundary keeps genuine missing records distinct from unavailable or invalid backend output", async () => {
  const text = await readFile(new URL("../src/lib/public-catalogue.ts", import.meta.url), "utf8")
  const output = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
  const o = projectOpportunity(makeRecord()).opportunity
  let calls = 0, failure, reads = true, detail = { kind: "opportunity", opportunity: o }
  const exports = {}
  new Function("require", "exports", output.outputText)(id => id === "@/lib/catalogue-query" ? loaded.exports : id === "@skilved/catalogue/runtime" ? { getRuntime: async () => { calls++; if (failure) throw failure; return { config: { reads }, catalogue: { detail: async () => detail } } } } : require(id), exports)
  const previous = process.env.SKILVED_CATALOGUE_READS
  process.env.SKILVED_CATALOGUE_READS = "true"
  try {
    assert.equal(await exports.readOpportunity("../bad"), null); assert.equal(calls, 0)
    assert.equal((await exports.readOpportunity(o.id)).kind, "opportunity")
    failure = { code: "NOT_FOUND" }; assert.equal(await exports.readOpportunity(o.id), null)
    for (const error of [new Error("PRIVATE_BACKEND_STACK"), { code: "PRIVATE_DATABASE_PATH" }]) {
      failure = error; assert.deepEqual(await exports.readOpportunity(o.id), { kind: "unavailable" })
    }
    failure = null; reads = false; assert.deepEqual(await exports.readOpportunity(o.id), { kind: "unavailable" })
    reads = true; detail = { kind: "opportunity", opportunity: { private: "PRIVATE_BAD_PROJECTION" } }
    assert.deepEqual(await exports.readOpportunity(o.id), { kind: "unavailable" })
    process.env.SKILVED_CATALOGUE_READS = "false"; const before = calls
    assert.equal(await exports.readOpportunity(o.id), null); assert.equal(calls, before)
  } finally { if (previous === undefined) delete process.env.SKILVED_CATALOGUE_READS; else process.env.SKILVED_CATALOGUE_READS = previous }
})
