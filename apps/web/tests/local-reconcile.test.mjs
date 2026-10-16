import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { test } from "node:test"
const require = createRequire(import.meta.url), ts = require("typescript")
const { IDBFactory, IDBObjectStore } = require("fake-indexeddb")
const { LocalProgressCommandSchema } = require("@skilved/types/opportunities")
async function load(path, overrides = {}) {
  const source = await readFile(new URL(`../src/${path}`, import.meta.url), "utf8")
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } })
  const exports = {}; new Function("require", "exports", compiled.outputText)(id => overrides[id] ?? require(id), exports); return exports
}
const core = await load("lib/local-progress.ts"), { createProgressSession } = await load("lib/local-progress-session.ts", { "./local-progress": core })
const { checkSavedIdentity } = await load("lib/saved-identity.ts", { "./saved-summary": {} })
const START = "2026-10-16T04:00:00.000Z", LATER = "2026-10-16T05:00:00.000Z", MATCH = "2026-10-16T06:00:00.000Z"
async function fixture() {
  let number = 0, time = START
  const options = { indexedDB: new IDBFactory(), newToken: () => "reconcile_" + ++number, now: () => time }
  const store = core.createLocalProgressStore(options), session = createProgressSession(store)
  await session.refresh(true); await session.change({ type: "save", id: "original", revision: 2 })
  await session.change({ type: "stage", id: "original", stage: "applied_reported" })
  time = LATER; await session.change({ type: "save", id: "current", revision: 5 })
  await session.change({ type: "route_opened", id: "current" }); time = MATCH
  return { store, session, other: core.createLocalProgressStore(options) }
}
const command = { type: "match_stage", id: "current", fromId: "original" }

test("explicit stage matching retains original, target first-save/revision/route and records a new own Applied report only once", async () => {
  const f = await fixture(), before = (await f.store.read()).snapshot
  await f.session.change(command, before.token)
  const after = (await f.store.read()).snapshot, target = after.items[1]
  assert.deepEqual(after.items[0], before.items[0]); assert.equal(target.userStage, "applied_reported"); assert.equal(target.reportedAppliedAt, MATCH)
  for (const field of ["opportunityId", "savedAt", "lastViewedRevision", "lastRouteOpenedAt"]) assert.equal(target[field], before.items[1][field], field)
  assert.match(f.session.getSnapshot().message, /does not confirm submission/)
  await f.session.change(command, after.token); assert.deepEqual((await f.store.read()).snapshot, after)
  assert.match(f.session.getSnapshot().message, /already match/)
})

test("captured-token and transaction guards reject intervening refresh/edit/clear; missing or same identities cannot create entries", async () => {
  const f = await fixture(), before = (await f.store.read()).snapshot
  await f.other.change(before.token, { type: "stage", id: "original", stage: "not_pursuing" }); await f.session.refresh(true)
  await f.session.change(command, before.token); assert.equal(f.session.getSnapshot().view.status, "conflict")
  assert.equal((await f.store.read()).snapshot.items[1].userStage, "interested")
  await f.session.refresh(true); const prior = f.session.getSnapshot().view.snapshot
  await f.other.clear(); await f.session.change(command, prior.token); assert.equal(f.session.getSnapshot().view.status, "conflict")
  assert.deepEqual((await f.store.read()).snapshot.items, [])
  assert.equal((await f.store.change((await f.store.read()).snapshot.token, command)).status, "not_saved")
  assert.equal(LocalProgressCommandSchema.safeParse({ ...command, fromId: "current" }).success, false)
  assert.equal(LocalProgressCommandSchema.safeParse({ ...command, title: "PRIVATE_SENTINEL" }).success, false)
})

test("matching quota/abort failures never confirm success or replace either record", async () => {
  const f = await fixture(), before = (await f.store.read()).snapshot, original = IDBObjectStore.prototype.put
  try {
    IDBObjectStore.prototype.put = function () { throw new DOMException("Synthetic quota", "QuotaExceededError") }
    await f.session.change(command, before.token); assert.equal(f.session.getSnapshot().view.status, "unavailable")
    assert.doesNotMatch(f.session.getSnapshot().message, /now matches|PRIVATE_|confirm submission/)
    IDBObjectStore.prototype.put = function (...args) { const request = original.apply(this, args); request.addEventListener("success", () => this.transaction.abort()); return request }
    assert.equal((await f.store.change(before.token, command)).status, "unavailable")
  } finally { IDBObjectStore.prototype.put = original }
  assert.deepEqual((await f.store.read()).snapshot, before)
})

test("public relationship revalidation blocks reversed/changed/unavailable mapping and carries no annotations", async () => {
  const current = { kind: "current", id: "current", revision: 5, title: "Synthetic", state: "published" }
  const calls = [], read = async id => { calls.push(id); return current }
  assert.equal(await checkSavedIdentity("original", "current", 5, read), true); assert.deepEqual(calls.sort(), ["current", "original"])
  assert.equal(await checkSavedIdentity("original", "current", 4, read), false)
  assert.equal(await checkSavedIdentity("original", "current", 5, async id => id === "original" ? { ...current, id: "original" } : current), false)
  for (const kind of ["missing", "unavailable"]) assert.equal(await checkSavedIdentity("original", "current", 5, async () => ({ kind })), false)
  assert.equal(await checkSavedIdentity("original", "current", 5, async () => { throw Error("PRIVATE_FAILURE") }), false)
  assert.equal(await checkSavedIdentity("current", "current", 5, read), false)
})

test("an older pending read cannot erase a captured-token conflict", async () => {
  let reads = 0, resolve
  const pending = new Promise(done => { resolve = done })
  const snapshot = token => ({ status: "ready", snapshot: { token, items: [] } })
  const session = createProgressSession({ read: () => ++reads === 1 ? Promise.resolve(snapshot("old")) : reads === 2 ? Promise.resolve(snapshot("new")) : pending, change: async () => { throw Error("must not write") } })
  await session.refresh(true); await session.refresh(true); const reading = session.refresh()
  await session.change(command, "old"); assert.equal(session.getSnapshot().view.status, "conflict")
  resolve(snapshot("new")); await reading
  assert.equal(session.getSnapshot().view.status, "conflict")
})
