import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { loadUi } from "./helpers/load-ui.mjs"
const require = createRequire(import.meta.url), React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")

test("anonymous feed renders its accessible shell before query and data resolution, including when publication is disabled", async () => {
  const dependencies = {
    "@/components/layout/Header": { Header: () => null },
    "@/lib/public-catalogue": { readCatalogue: () => { throw Error("must not load data for the fallback") } },
    "@/lib/catalogue-query": { parseCataloguePageQuery: () => { throw Error("must not await query for the fallback") } },
  }
  const home = loadUi("app/page.tsx", dependencies)
  const previous = process.env.SKILVED_CATALOGUE_READS
  try {
    for (const enabled of ["true", "false"]) {
      process.env.SKILVED_CATALOGUE_READS = enabled
      const page = home.default({ searchParams: new Promise(() => {}) })
      assert.equal(page.type, React.Suspense)
      const fallback = renderToStaticMarkup(page.props.fallback)
      assert.match(fallback, /Your opportunity feed/)
      assert.match(fallback, /role="status"/); assert.match(fallback, /aria-live="polite"/); assert.match(fallback, /aria-busy="true"/)
      assert.match(fallback, /Loading opportunities/)
      assert.doesNotMatch(fallback, /opportunities\/|Apply|No published opportunities|PRIVATE_|animate-/)
    }
  } finally { if (previous === undefined) delete process.env.SKILVED_CATALOGUE_READS; else process.env.SKILVED_CATALOGUE_READS = previous }
})
