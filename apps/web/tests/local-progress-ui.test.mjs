import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { test } from "node:test"
import { makeRecord } from "../../../packages/types/tests/fixtures/opportunities.mjs"

const require = createRequire(import.meta.url), ts = require("typescript"), React = require("react")
const { IDBFactory } = require("fake-indexeddb"), { renderToStaticMarkup } = require("react-dom/server")
const { projectOpportunity } = require("@skilved/types/opportunities/internal")
async function load(path, overrides = {}) {
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
    const current = await readSavedSummary(record.id); assert.deepEqual(current, { kind: "current", title: record.title.value, state: "published" })
    assert.doesNotMatch(JSON.stringify(current), /destination|issuer.example|PRIVATE_|applied/)
    record.publication.disposition = "withheld"; projection = projectOpportunity(record); assert.deepEqual(await readSavedSummary(record.id), { kind: "restricted" })
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
  progress = { ...progress, view: { status: "ready", snapshot: { token: "saved", items: [{ opportunityId: "opaque_id", savedAt: "2026-10-16T04:00:00.000Z" }] } } }
  html = render("SavedOpportunities")
  assert.match(html, /datetime="2026-10-16T04:00:00.000Z"/i)
  assert.doesNotMatch(html, /Saved reference:|>opaque_id</)
  progress = { ...progress, view: { status: "unreadable", reason: "unsupported_version" } }
  html = render("SavedOpportunities"); assert.match(html, /data has not been reset/); assert.match(html, /Clear saved progress/)
})
