import assert from "node:assert/strict"
import { loadUi } from "./helpers/load-ui.mjs"
import { createRequire } from "node:module"
import { test } from "node:test"
import { makeRecord } from "../../../packages/types/tests/fixtures/opportunities.mjs"

const require = createRequire(import.meta.url), React = require("react")
const { IDBFactory } = require("fake-indexeddb"), { renderToStaticMarkup } = require("react-dom/server")
const { projectOpportunity } = require("@skilved/types/opportunities/internal")
const load = (path, overrides = {}) => loadUi(path, { "@/lib/saved-identity": { checkSavedIdentity: async () => false }, ...overrides })
const core = await load("lib/local-progress.ts")
const { createProgressSession } = await load("lib/local-progress-session.ts", { "./local-progress": core })
const ui = await load("components/catalogue/SavedProgress.tsx", { "@/lib/use-local-progress": {}, "@/lib/saved-summary": {} })
const initial = { opportunityId: "original", lastViewedRevision: 2, savedAt: "2026-10-16T04:00:00.000Z", updatedAt: "2026-10-16T04:00:00.000Z", userStage: "interested", lastRouteOpenedAt: null, reportedAppliedAt: null }

test("changed-detail acknowledgement is explicit, preserves personal history and rejects a stale concurrent edit", async () => {
  let sequence = 0, time = initial.savedAt
  const factory = new IDBFactory(), options = { indexedDB: factory, now: () => time, newToken: () => "review_" + ++sequence }
  const session = createProgressSession(core.createLocalProgressStore(options))
  await session.refresh(true); await session.change({ type: "save", id: "original", revision: 2 })
  await session.change({ type: "stage", id: "original", stage: "applied_reported" })
  time = "2026-10-16T05:00:00.000Z"; await session.change({ type: "route_opened", id: "original" })
  const before = session.getSnapshot().view.snapshot.items[0]
  const props = { item: before, id: "original", revision: 7, busy: false, change: session.change, canAcknowledge: true }
  const view = ui.SavedRevision(props), button = view.props.children.find(child => child?.type === "button")
  assert.equal((await core.createLocalProgressStore(options).read()).snapshot.items[0].lastViewedRevision, 2)
  await button.props.onClick()
  // Event handlers do not return the asynchronous write: wait for the session's committed state.
  await new Promise(resolve => { if (!session.getSnapshot().busy) resolve(); else { const stop = session.subscribe(() => { if (!session.getSnapshot().busy) { stop(); resolve() } }) } })
  const after = session.getSnapshot().view.snapshot.items[0]
  assert.equal(after.lastViewedRevision, 7)
  for (const field of ["savedAt", "userStage", "reportedAppliedAt", "lastRouteOpenedAt"]) assert.equal(after[field], before[field], field)
  assert.match(session.getSnapshot().message, /review of these details was recorded/)
  assert.equal(ui.SavedRevision({ ...props, item: after }), null)
  const competitor = core.createLocalProgressStore(options), read = await competitor.read()
  await competitor.change(read.snapshot.token, { type: "stage", id: "original", stage: "preparing" })
  await session.change({ type: "acknowledge_revision", id: "original", revision: 8 })
  assert.equal(session.getSnapshot().view.status, "conflict")
  const unchanged = (await competitor.read()).snapshot.items[0]
  assert.equal(unchanged.lastViewedRevision, 7); assert.equal(unchanged.userStage, "preparing")
})

test("different identities never compare revision or offer acknowledgement; both annotations and reversals remain explicit", () => {
  let writes = 0
  const props = { item: initial, id: "merged", revision: 2, busy: false, change: () => writes++, canAcknowledge: true, alsoSaved: true }
  let html = renderToStaticMarkup(React.createElement(ui.SavedRevision, props))
  assert.match(html, /currently resolves to another listing/); assert.match(html, /Both sets of personal progress are retained separately/)
  assert.match(html, /href="\/opportunities\/merged"/); assert.doesNotMatch(html, /Mark these details|last saved or marked reviewed|PRIVATE_|userStage/)
  assert.equal(writes, 0); assert.equal(initial.opportunityId, "original")
  assert.equal(ui.SavedRevision({ ...props, id: "original" }), null)
  html = renderToStaticMarkup(React.createElement(ui.SavedRevision, { ...props, id: "original", revision: 1, canAcknowledge: false }))
  assert.match(html, /public details differ/); assert.match(html, /Review changed details/); assert.doesNotMatch(html, /<button/)
})

test("current summaries retain resolved identity and closed status, distinguish outages and never persist facts or annotations", async () => {
  const { readSavedSummary } = await load("lib/saved-summary.ts"), prior = globalThis.fetch
  const record = makeRecord(); record.id = "resolved"; record.revision = 6
  record.checks = record.checks.map(check => ({ ...check, recordRevision: 6 }))
  let projection = projectOpportunity(record), status = 200
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/v1/opportunities/original"); assert.equal(options.cache, "no-store"); assert.equal(options.body, undefined)
    return new Response(JSON.stringify(projection), { status })
  }
  try {
    let result = await readSavedSummary("original"); assert.equal(result.id, "resolved"); assert.equal(result.revision, 6)
    record.lifecycle = "closed"; projection = projectOpportunity(record)
    result = await readSavedSummary("original"); assert.equal(result.state, "closed")
    record.publication.disposition = "withheld"; projection = projectOpportunity(record)
    assert.deepEqual(await readSavedSummary("original"), { kind: "restricted", id: "resolved", revision: 6 })
    status = 404; assert.deepEqual(await readSavedSummary("original"), { kind: "missing" })
    status = 503; assert.deepEqual(await readSavedSummary("original"), { kind: "unavailable" })
    assert.doesNotMatch(JSON.stringify(result), /destination|application|userStage|Applied|writeToken/)
  } finally { globalThis.fetch = prior }
})
