import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { loadUi } from "./helpers/load-ui.mjs"
import { makeRecord, allFixtures } from "../../../packages/types/tests/fixtures/opportunities.mjs"

const require = createRequire(import.meta.url)
const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")
const { projectOpportunity } = require("@skilved/types/opportunities/internal")

async function component(name) {
  return loadUi(`components/catalogue/${name}.tsx`)[name]
}

test("preparation supports all categories and internship subtypes without flattening OR requirements", async () => {
  const Component = await component("PreparationChecklist")
  for (const record of allFixtures()) {
    const result = projectOpportunity(record)
    assert.equal(result.kind, "opportunity")
    const o = result.opportunity
    const html = renderToStaticMarkup(React.createElement(Component, { id: o.id, revision: o.revision, requirements: o.requirements }))
    assert.match(html, /ANY of .* OR /)
    assert.match(html, /Required as stated/)
    assert.equal((html.match(/type="checkbox"/g) ?? []).length, 2)
    assert.doesNotMatch(html, /checked=""|PRIVATE_|localStorage|sessionStorage/)
    assert.match(html, /not saved or sent with a report/)
    assert.match(html, /do not confirm that you qualify or have applied/)
  }
})

test("conditional and unknown instructions retain meaning, and source text is escaped", async () => {
  const Component = await component("PreparationChecklist")
  const result = projectOpportunity(makeRecord())
  const o = result.opportunity
  o.requirements.expression = { op: "if", condition: "matric", then: { op: "ref", id: "n2" }, otherwise: { op: "unknown", originalText: "Other cases need clarification <script>alert(1)</script>" } }
  o.requirements.requirements[1].fact = { state: "not_stated", value: null, originalText: null, citations: [] }
  const html = renderToStaticMarkup(React.createElement(Component, { id: o.id, revision: o.revision, requirements: o.requirements }))
  assert.match(html, /IF .* THEN .* ELSE /)
  assert.match(html, /Details need confirmation \(not stated\)/)
  assert.match(html, /&lt;script&gt;/)
  assert.doesNotMatch(html, /<script>/)
})

test("report form is bounded and never puts descriptions into a default GET URL", async () => {
  const Component = await component("OpportunityReport")
  const html = renderToStaticMarkup(React.createElement(Component, { id: "safe_public_id" }))
  assert.match(html, /method="post"/)
  assert.match(html, /action="\/api\/v1\/reports"/)
  assert.match(html, /maxLength="1500"/i)
  assert.match(html, /Reports are reviewed privately/)
  assert.match(html, /Enable JavaScript/)
  assert.doesNotMatch(html, /type="file"|name="email"|name="phone"|name="reviewed"/)
})
