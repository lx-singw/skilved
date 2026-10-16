import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { test } from "node:test"
import { makeRecord } from "../../../packages/types/tests/fixtures/opportunities.mjs"

const require = createRequire(import.meta.url), ts = require("typescript"), React = require("react")
const { IDBFactory } = require("fake-indexeddb"), { renderToStaticMarkup } = require("react-dom/server")
const { projectOpportunity } = require("@skilved/types/opportunities/internal")
async function load(path, overrides = {}) {
  overrides = { "@/lib/saved-identity": { checkSavedIdentity: async () => false }, ...overrides }
  const source = await readFile(new URL(`../src/${path}`, import.meta.url), "utf8")
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } })
  const exports = {}; new Function("require", "exports", compiled.outputText)(id => overrides[id] ?? require(id), exports); return exports
}
const core = await load("lib/local-progress.ts")
const { createProgressSession } = await load("lib/local-progress-session.ts", { "./local-progress": core })
const empty = { status: "ready", snapshot: { token: null, items: [] } }
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }

test("session confirms commit only after completion, guards double actions and invalidations read without replay", async () => {
  let current = empty, writes = 0, reads = 0, announced = 0
  const pending = deferred(), store = { read: async () => { reads++; return current }, change: () => { writes++; return pending.promise }, clear: async () => empty }
  const session = createProgressSession(store, () => announced++)
  await session.refresh(true)
  const saving = session.change({ type: "save", id: "card", revision: 1 })
  assert.equal(session.getSnapshot().busy, true); assert.equal(session.getSnapshot().message, "")
  await session.change({ type: "save", id: "card", revision: 1 }); await session.refresh()
  assert.equal(writes, 1); assert.equal(reads, 1); assert.equal(announced, 0)
  current = { status: "saved", snapshot: { token: "new_token", items: [] } }; pending.resolve(current); await saving
  assert.equal(session.getSnapshot().busy, false); assert.match(session.getSnapshot().message, /Saved in this browser/); assert.equal(announced, 1)
  await session.refresh(); await session.refresh(); assert.equal(writes, 1)
})

test("session conflicts require explicit reload and new action across actual IndexedDB connections", async () => {
  const indexedDB = new IDBFactory(); let number = 0
  const options = { indexedDB, newToken: () => "token_" + ++number, now: () => "2026-10-16T04:00:00.000Z" }
  const a = createProgressSession(core.createLocalProgressStore(options)), b = createProgressSession(core.createLocalProgressStore(options))
  await a.refresh(true); await b.refresh(true)
  await a.change({ type: "save", id: "a", revision: 1 }); await b.change({ type: "save", id: "b", revision: 1 })
  assert.equal(b.getSnapshot().view.status, "conflict"); assert.match(b.getSnapshot().message, /Reload it/)
  await b.refresh(); assert.equal(b.getSnapshot().view.status, "conflict")
  await b.refresh(true); await b.change({ type: "save", id: "b", revision: 1 })
  assert.equal(b.getSnapshot().view.snapshot.items.length, 2)
  await a.change("clear"); await b.change({ type: "remove", id: "b" })
  assert.equal(b.getSnapshot().view.status, "conflict")
  await b.refresh(true); assert.equal(b.getSnapshot().view.snapshot.items.length, 0)
})

test("a pending old read cannot overwrite a later mutation; errors clear busy and never announce success", async () => {
  const oldRead = deferred(); let reads = 0, announcements = 0
  const saved = { status: "saved", snapshot: { token: "committed", items: [] } }
  const session = createProgressSession({ read: () => ++reads === 1 ? Promise.resolve(empty) : oldRead.promise, change: async () => saved, clear: async () => { throw Error("PRIVATE_STORAGE_FAILURE") } }, () => announcements++)
  await session.refresh(true); const reading = session.refresh(); await session.change({ type: "save", id: "card", revision: 1 })
  oldRead.resolve(empty); await reading; assert.equal(session.getSnapshot().view.snapshot.token, "committed")
  await session.change("clear"); assert.equal(session.getSnapshot().view.status, "unavailable"); assert.equal(session.getSnapshot().busy, false)
  assert.match(session.getSnapshot().message, /couldn’t confirm/); assert.doesNotMatch(session.getSnapshot().message, /PRIVATE_|cleared from/); assert.equal(announcements, 1)
})

test("saved summaries use validated current public facts and local IDs without personal progress payloads", async () => {
  const { readSavedSummary } = await load("lib/saved-summary.ts"), prior = globalThis.fetch
  const record = makeRecord(); let projection = projectOpportunity(record), status = 200, calls = 0
  globalThis.fetch = async (url, options) => {
    calls++; assert.equal(url, "/api/v1/opportunities/fixture_apprenticeship_student_wil"); assert.equal(options.cache, "no-store"); assert.equal(options.body, undefined)
    return new Response(JSON.stringify(projection), { status })
  }
  try {
    assert.deepEqual(await readSavedSummary("../private"), { kind: "unavailable" }); assert.equal(calls, 0)
    const current = await readSavedSummary(record.id); assert.deepEqual(current, { kind: "current", id: record.id, revision: record.revision, title: record.title.value, state: "published" })
    assert.doesNotMatch(JSON.stringify(current), /destination|issuer.example|PRIVATE_|applied/)
    record.publication.disposition = "withheld"; projection = projectOpportunity(record); assert.deepEqual(await readSavedSummary(record.id), { kind: "restricted", id: record.id, revision: record.revision })
    status = 404; assert.deepEqual(await readSavedSummary(record.id), { kind: "missing" })
    status = 503; assert.deepEqual(await readSavedSummary(record.id), { kind: "unavailable" })
    status = 200; projection = { kind: "opportunity", opportunity: { private: "PRIVATE_BAD_OUTPUT" } }; assert.deepEqual(await readSavedSummary(record.id), { kind: "unavailable" })
  } finally { globalThis.fetch = prior }
})

test("save and saved-list server rendering starts loading without claiming saved or rendering personal records", async () => {
  let progress = { view: null, busy: false, message: "", change: () => {}, reload: () => {} }
  const ui = await load("components/catalogue/SavedProgress.tsx", { "@/lib/use-local-progress": { useLocalProgress: () => progress }, "@/lib/saved-summary": { readSavedSummary: () => { throw Error("no SSR personal lookup") } } })
  const render = name => renderToStaticMarkup(React.createElement(ui[name], { id: "card", revision: 1 }))
  let html = render("SaveOpportunity")
  assert.match(html, /Loading saved progress/); assert.match(html, /disabled=""[^>]*>Save in this browser/)
  assert.match(html, /People using this browser may see it/); assert.match(html, /no account backup or cross-device sync/)
  assert.doesNotMatch(html, /Removed from|Saved in this browser\.|PRIVATE_|reportedAppliedAt/)
  html = render("SavedOpportunities"); assert.doesNotMatch(html, /No saved opportunities in this browser|Saved reference:/)
  progress = { ...progress, view: empty }; assert.match(render("SavedOpportunities"), /No saved opportunities in this browser/)
  progress = { ...progress, view: { status: "ready", snapshot: { token: "saved", items: [{ opportunityId: "opaque_id", lastViewedRevision: 1, savedAt: "2026-10-16T04:00:00.000Z", updatedAt: "2026-10-16T04:00:00.000Z", userStage: "interested", lastRouteOpenedAt: null, reportedAppliedAt: null }] } } }
  html = render("SavedOpportunities")
  assert.match(html, /datetime="2026-10-16T04:00:00.000Z"/i)
  assert.doesNotMatch(html, /Saved reference:|>opaque_id</)
  progress = { ...progress, view: { status: "unreadable", reason: "unsupported_version" } }
  html = render("SavedOpportunities"); assert.match(html, /data has not been reset/); assert.match(html, /Clear saved progress/)
  assert.match(html, /different format that this version cannot read/)
  assert.doesNotMatch(html, /No saved opportunities in this browser|Saved in this browser\./)
  html = render("SaveOpportunity"); assert.match(html, /disabled=""[^>]*>Save in this browser/)
  progress = { ...progress, view: { status: "unreadable", reason: "invalid_data" } }
  html = render("SavedOpportunities"); assert.match(html, /Saved progress data cannot be read/); assert.doesNotMatch(html, /No saved opportunities in this browser|different format/)
  progress = { ...progress, view: { status: "unavailable" } }
  html = render("SavedOpportunities"); assert.match(html, /cannot confirm your saved progress/); assert.doesNotMatch(html, /Clear saved progress|No saved opportunities in this browser/)
})

test("the actual native route handler preserves Applied and first-save time without delaying guarded navigation", async () => {
  let number = 0, now = "2026-10-16T04:00:00.000Z"
  const store = core.createLocalProgressStore({ indexedDB: new IDBFactory(), newToken: () => "route_" + ++number, now: () => now })
  const session = createProgressSession(store); await session.refresh(true)
  await session.change({ type: "save", id: "card", revision: 7 })
  await session.change({ type: "stage", id: "card", stage: "applied_reported" })
  assert.match(session.getSnapshot().message, /Personal stage updated/)
  const applied = session.getSnapshot().view.snapshot.items[0]
  now = "2026-10-16T05:00:00.000Z"
  const progress = { ...session.getSnapshot(), change: session.change, reload: () => session.refresh(true) }
  const ui = await load("components/catalogue/SavedProgress.tsx", { "@/lib/use-local-progress": { useLocalProgress: () => progress }, "@/lib/saved-summary": {} })
  const element = ui.ApplicationRouteLink({ id: "card", revision: 7 }), anchor = element.props.children.find(child => child?.type === "a")
  assert.equal(anchor.props.href, "/opportunities/card/apply?revision=7"); assert.equal(anchor.props.target, "_blank"); assert.match(anchor.props.rel, /noreferrer/)
  let prevented = false
  await anchor.props.onClick({ preventDefault() { prevented = true } })
  const reopened = session.getSnapshot().view.snapshot.items[0]
  assert.equal(prevented, false); assert.equal(reopened.userStage, "applied_reported")
  assert.equal(reopened.savedAt, applied.savedAt); assert.equal(reopened.reportedAppliedAt, applied.reportedAppliedAt)
  assert.equal(reopened.lastRouteOpenedAt, now); assert.match(session.getSnapshot().message, /Route-opening action recorded/)
  assert.match(session.getSnapshot().message, /does not confirm/)
  await session.change({ type: "stage", id: "card", stage: "not_pursuing" })
  assert.equal(session.getSnapshot().view.snapshot.items[0].lastRouteOpenedAt, now)
})

test("route selection never saves an unsaved item, and failed storage cannot remove the native link", async () => {
  const store = core.createLocalProgressStore({ indexedDB: new IDBFactory() }), session = createProgressSession(store)
  let progress = { ...session.getSnapshot(), change: session.change, reload: () => session.refresh(true) }
  const ui = await load("components/catalogue/SavedProgress.tsx", { "@/lib/use-local-progress": { useLocalProgress: () => progress }, "@/lib/saved-summary": {} })
  let anchor = ui.ApplicationRouteLink({ id: "unsaved", revision: 1, email: true }).props.children.find(child => child?.type === "a")
  await anchor.props.onClick(); assert.deepEqual((await store.read()).snapshot.items, [])
  assert.match(session.getSnapshot().message, /not saved; no local progress or route action was recorded/)
  const failed = createProgressSession({ read: async () => { throw Error("PRIVATE_STORAGE_ERROR") }, change: async () => { throw Error("must not write") }, clear: async () => ({ status: "unavailable" }) })
  progress = { ...failed.getSnapshot(), change: failed.change, reload: () => failed.refresh(true) }
  anchor = ui.ApplicationRouteLink({ id: "unsaved", revision: 1 }).props.children.find(child => child?.type === "a")
  await anchor.props.onClick(); assert.equal(anchor.props.href, "/opportunities/unsaved/apply?revision=1")
  assert.equal(anchor.props.target, "_blank"); assert.equal(failed.getSnapshot().view.status, "unavailable")
  progress = { ...failed.getSnapshot(), change: failed.change, reload: () => failed.refresh(true) }
  const html = renderToStaticMarkup(ui.ApplicationRouteLink({ id: "unsaved", revision: 1 }))
  assert.match(html, /href="\/opportunities\/unsaved\/apply\?revision=1"/)
  assert.match(html, /couldn’t confirm a local route record/)
  assert.doesNotMatch(html, /PRIVATE_STORAGE_ERROR|applied_reported|reportedAppliedAt|writeToken/)
})

test("personal stage rendering stays reversible and distinguishes own report from route history", async () => {
  const item = { opportunityId: "card", lastViewedRevision: 1, savedAt: "2026-10-16T04:00:00.000Z", updatedAt: "2026-10-16T05:00:00.000Z", userStage: "interested", reportedAppliedAt: "2026-10-16T04:30:00.000Z", lastRouteOpenedAt: "2026-10-16T05:00:00.000Z" }
  const progress = { view: { status: "ready", snapshot: { token: "stage", items: [item] } }, busy: false, message: "", change: () => {}, reload: () => {} }
  const ui = await load("components/catalogue/SavedProgress.tsx", { "@/lib/use-local-progress": { useLocalProgress: () => progress }, "@/lib/saved-summary": {} })
  for (const stage of ["interested", "preparing", "applied_reported", "not_pursuing"]) {
    item.userStage = stage
    const html = renderToStaticMarkup(React.createElement(ui.SaveOpportunity, { id: "card", revision: 1 }))
    assert.ok(html.includes(`value="${stage}" selected=""`))
    assert.match(html, /not an issuer’s records/); assert.match(html, /Last route-opening action recorded/)
    assert.match(html, /does not confirm that the issuer’s page loaded or that you submitted/)
    if (stage === "applied_reported") { assert.match(html, /Skilved has not confirmed submission/); assert.match(html, /dateTime="2026-10-16T04:30:00.000Z"/) }
    else assert.doesNotMatch(html, /Skilved has not confirmed submission/)
  }
})
