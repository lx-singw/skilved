import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { loadUi } from "./helpers/load-ui.mjs"
const require = createRequire(import.meta.url), React = require("react"), { renderToStaticMarkup } = require("react-dom/server")
const overrides = { "@/components/layout/Header": { Header: () => null }, "next/link": { __esModule: true, default: ({ href, children, ...props }) => React.createElement("a", { href, ...props }, children) } }
const { NoticeRecovery, RecoveryPanel } = loadUi("components/catalogue/NoticeRecovery.tsx", overrides)
const html = props => renderToStaticMarkup(React.createElement(NoticeRecovery, props))
function nodes(tree, predicate) { const result=[]; function visit(node) { if(Array.isArray(node))node.forEach(visit);else if(node&&typeof node==="object"){if(predicate(node))result.push(node);visit(node.props?.children)} } visit(tree);return result }

test("failed notice reads preserve validated results and use a manual same-notice retry", () => {
  const props = { id: "notice_123", from: "/?category=job&province=gauteng", state: "unavailable" }
  const tree = NoticeRecovery(props), retry = tree.props.action
  assert.equal(retry.type, "a") // Full request, not a cached client transition.
  const url = new URL(retry.props.href, "https://skilved.example")
  assert.equal(url.pathname, "/opportunities/notice_123")
  assert.equal(url.searchParams.get("from"), props.from)
  assert.equal(tree.props.backHref, props.from + "#opportunity-notice_123")
  assert.match(html(props), /does not establish that the listing has closed or been removed/)
  for (const from of ["https://outside.example/", "//outside.example", "/saved", "/?category=invalid", "/?category=job#section", ["/", "/saved"]]) {
    const recovered = NoticeRecovery({ ...props, from })
    assert.equal(recovered.props.backHref, "/");assert.equal(recovered.props.hasResults, false)
    assert.equal(recovered.props.action.props.href, "/opportunities/notice_123")
  }
})

test("review, withdrawn and archived notices cannot expose application or retry actions", () => {
  for(const state of ["under_review", "withdrawn", "archived"]) {
    const tree = NoticeRecovery({ id: "notice_123", from: "/?category=bursary", state })
    assert.equal(tree.props.action, undefined)
    const rendered = html({ id: "notice_123", from: "/?category=bursary", state })
    assert.match(rendered, /No application action is available/)
    assert.match(rendered, /does not establish/)
    assert.doesNotMatch(rendered, /href="[^"]*\/apply|Try loading these details again|<form|<button/)
    assert.match(rendered, state === "under_review" ? /needs a fresh check/ : /no longer available/)
  }
})

test("all recovery states have one heading, valid public exits and truthful local progress guidance", () => {
  for(const kind of ["missing", "error", "unavailable", "under_review", "unpublished"]) {
    const tree = RecoveryPanel({ kind }), rendered = renderToStaticMarkup(tree)
    assert.equal(nodes(tree,n=>n.type==="main"&&n.props.id==="main-content").length,1)
    assert.equal(nodes(tree,n=>n.type==="h1").length,1)
    assert.deepEqual(new Set(nodes(tree,n=>typeof n.props?.href==="string").map(n=>n.props.href)), new Set(["/", "/saved", "/about"]))
    assert.match(rendered,/no account backup or cross-device sync/)
    assert.match(rendered,/A saved reference is not a current copy/)
    assert.doesNotMatch(rendered,/role="alert"|<form|automatically|guaranteed|href="\/(auth|profile|apply)/)
  }
})

test("page error reset runs only when explicitly activated and does not render internal errors", () => {
  const { default: ErrorPage } = loadUi("app/error.tsx", { ...overrides, react: { ...React, useEffect: () => {} } })
  let resets=0
  const tree = ErrorPage({ error: new Error("PRIVATE_ERROR_SENTINEL"), reset: () => { resets++ } })
  const panel = nodes(tree,n=>n.props?.kind==="error")[0]
  assert.equal(resets,0)
  assert.equal(panel.props.action.type,"button")
  assert.equal(panel.props.action.props.type,"button")
  assert.doesNotMatch(renderToStaticMarkup(tree),/PRIVATE_ERROR_SENTINEL/)
  panel.props.action.props.onClick();assert.equal(resets,1)
})
