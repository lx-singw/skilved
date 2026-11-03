import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { loadUi } from "./helpers/load-ui.mjs"
const require = createRequire(import.meta.url), React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")
const link = { __esModule: true, default: ({ href, children, ...props }) => React.createElement("a", { href, ...props }, children) }

test("the publication-disabled home still offers an anonymous feed and working category filters", async () => {
  const ui = loadUi("components/catalogue/PublicCatalogue.tsx", {
    "@/components/layout/Header": { Header: () => null },
    "@/lib/public-catalogue": { readCatalogue: async () => ({ kind: "error", reason: "unavailable" }) },
    "next/link": link,
  })
  const html = renderToStaticMarkup(await ui.PublicCatalogue({ query: new URLSearchParams("category=job&province=gauteng&remote=false&cursor=old"), readsDisabled: true }))
  assert.match(html, /Your opportunity feed/)
  assert.match(html, /Public browsing is unavailable here/)
  assert.doesNotMatch(html, /no published listings yet|0 published notices|Recently updated/)
  assert.match(html, /href="\/\?category=bursary&amp;province=gauteng&amp;remote=false"/)
  assert.doesNotMatch(html, /href="[^"]*cursor=old|href="\/auth|opportunities\/demo|role="article"/)
  assert.match(html, /aria-current="page">Jobs/)
  assert.match(html, /name="province"/)
  assert.match(html, /value="gauteng" selected=""/)
  assert.match(html, /aria-label="Remove filter: Gauteng"/)
  assert.match(html, /aria-label="Remove filter: In person or hybrid"/)
  assert.doesNotMatch(html, /<details[^>]+open=/)
})

test("inline save waits for storage, saves explicitly and opens retained progress once saved", () => {
  const calls = []
  let progress = { view: null, busy: false, message: "", change: action => { calls.push(action); return Promise.resolve() } }
  const ui = loadUi("components/catalogue/FeedSave.tsx", { "@/lib/use-local-progress": { useLocalProgress: () => progress }, react: { ...React, useRef: value => ({ current: value }), useEffect: () => {} } })
  const render = () => ui.FeedSave({ id: "public_card", revision: 7, href: "/opportunities/public_card?from=%2F", title: "Public notice" })
  let button = render().props.children[0].props.children
  assert.equal(button.props.disabled, true)
  assert.match(button.props["aria-label"], /Save Public notice in this browser/)
  progress = { ...progress, view: { status: "ready", snapshot: { items: [] } } }
  button = render().props.children[0].props.children
  assert.equal(button.props.disabled, false)
  button.props.onClick()
  assert.deepEqual(calls, [{ type: "save", id: "public_card", revision: 7 }])
  progress.view.snapshot.items.push({ opportunityId: "public_card", userStage: "interested", savedAt: "2026-11-03T08:00:00.000Z", lastViewedRevision: 7 })
  const savedLink = render().props.children[0].props.children
  assert.equal(savedLink.props.href, "/opportunities/public_card?from=%2F#your-workspace")
  assert.match(savedLink.props["aria-label"], /Manage saved progress for Public notice/)
  assert.equal(savedLink.props.onClick, undefined)
  assert.equal(calls.length, 1)
  progress = { ...progress, view: { status: "unavailable" } }
  const html = renderToStaticMarkup(render())
  assert.match(html, /disabled=""/)
  assert.match(html, /Browser storage is unavailable/)
  assert.doesNotMatch(html, /aria-pressed="true"/)
})
