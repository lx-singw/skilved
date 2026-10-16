import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { test } from "node:test"

const require = createRequire(import.meta.url), ts = require("typescript"), React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")
async function load(path, overrides) {
  const source = await readFile(new URL(`../src/${path}`, import.meta.url), "utf8")
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } })
  const exports = {}
  new Function("require", "exports", compiled.outputText)(id => overrides[id] ?? require(id), exports)
  return exports
}

test("feed Suspense can render an honest accessible loading state before query/data resolution", async () => {
  const dependencies = {
    "@/components/layout/Header": { Header: () => null },
    "@/lib/public-catalogue": { readCatalogue: () => { throw Error("must not load data for the fallback") } },
    "@/lib/catalogue-query": { parseCataloguePageQuery: () => { throw Error("must not await query for the fallback") } },
  }
  const catalogue = await load("components/catalogue/PublicCatalogue.tsx", dependencies)
  const home = await load("app/page.tsx", { ...dependencies, "@/components/catalogue/PublicCatalogue": catalogue })
  const previous = process.env.SKILVED_CATALOGUE_READS
  try {
    process.env.SKILVED_CATALOGUE_READS = "true"
    const page = await home.default({ searchParams: new Promise(() => {}) })
    assert.equal(page.type, React.Suspense)
    const fallback = renderToStaticMarkup(page.props.fallback)
    assert.match(fallback, /role="status"/); assert.match(fallback, /aria-live="polite"/); assert.match(fallback, /aria-busy="true"/)
    assert.match(fallback, /Loading opportunities/)
    assert.doesNotMatch(fallback, /opportunities\/|Apply|No published opportunities|PRIVATE_|animate-/)
    process.env.SKILVED_CATALOGUE_READS = "false"
    const disabled = await home.default({ searchParams: new Promise(() => {}) })
    const html = renderToStaticMarkup(disabled)
    assert.match(html, /Our opportunity catalogue is being prepared/)
    assert.doesNotMatch(html, /Loading opportunities/)
  } finally { if (previous === undefined) delete process.env.SKILVED_CATALOGUE_READS; else process.env.SKILVED_CATALOGUE_READS = previous }
})
