import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { test } from "node:test"
const require = createRequire(import.meta.url), ts = require("typescript")
const { IDBFactory, IDBObjectStore } = require("fake-indexeddb")
const { LocalProgressDocumentSchema, LocalProgressItemSchema } = require("@skilved/types/opportunities")
const source = await readFile(new URL("../src/lib/local-progress.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
const exports = {}; new Function("require", "exports", compiled.outputText)(require, exports)
const { createLocalProgressStore, LOCAL_PROGRESS_DATABASE } = exports
const START = "2026-10-16T04:00:00.000Z", LATER = "2026-10-16T05:00:00.000Z"
function fixture() {
  const indexedDB = new IDBFactory(); let sequence = 0, time = START
  const options = { indexedDB, now: () => time, newToken: () => "write_" + ++sequence }
  return { indexedDB, store: createLocalProgressStore(options), other: () => createLocalProgressStore(options), time: value => { time = value } }
}
const item = (id = "card") => ({ opportunityId: id, lastViewedRevision: 1, savedAt: START, updatedAt: START, userStage: "interested", lastRouteOpenedAt: null, reportedAppliedAt: null })
async function rawAccess(factory, value, write = false) {
  return new Promise((resolve, reject) => {
    const request = factory.open(LOCAL_PROGRESS_DATABASE, 1)
    request.onupgradeneeded = () => request.result.createObjectStore("progress")
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction("progress", write ? "readwrite" : "readonly"), store = tx.objectStore("progress")
      const operation = write ? store.put(value, "current") : store.get("current")
      tx.oncomplete = () => { db.close(); resolve(operation.result) }
      tx.onabort = () => { db.close(); reject(tx.error) }
    }
  })
}
async function save(store, id = "card", token = null) { return store.change(token, { type: "save", id, revision: 1 }) }

test("strict minimal progress contract rejects private/source/receipt fields and invalid local history", () => {
  const base = item()
  assert.equal(LocalProgressItemSchema.safeParse(base).success, true)
  for (const extra of ["title", "applicationUrl", "receiptToken", "private", "sourceSnapshotIds", "ticks"])
    assert.equal(LocalProgressItemSchema.safeParse({ ...base, [extra]: "PRIVATE_SENTINEL" }).success, false, extra)
  for (const changed of [{ userStage: "submitted" }, { lastViewedRevision: 0 }, { updatedAt: "yesterday" }, { userStage: "applied_reported" }, { lastRouteOpenedAt: LATER }])
    assert.equal(LocalProgressItemSchema.safeParse({ ...base, ...changed }).success, false)
  assert.equal(LocalProgressDocumentSchema.safeParse({ schemaVersion: 1, writeToken: "token", items: [base, base] }).success, false)
})

test("save commits across new connections without caching public facts; removal and explicit revision acknowledgement work", async () => {
  const f = fixture(); assert.deepEqual(await f.store.read(), { status: "ready", snapshot: { token: null, items: [] } })
  const saved = await save(f.store); assert.equal(saved.status, "saved")
  assert.deepEqual(await f.other().read(), { status: "ready", snapshot: saved.snapshot })
  const acknowledged = await f.other().change(saved.snapshot.token, { type: "acknowledge_revision", id: "card", revision: 5 })
  assert.equal(acknowledged.snapshot.items[0].lastViewedRevision, 5)
  assert.equal(acknowledged.snapshot.items[0].savedAt, START)
  assert.doesNotMatch(JSON.stringify(await rawAccess(f.indexedDB)), /title|destination|receipt|private|sourceSnapshot/)
  const removed = await f.store.change(acknowledged.snapshot.token, { type: "remove", id: "card" })
  assert.equal(removed.status, "saved"); assert.deepEqual((await f.store.read()).snapshot.items, [])
})

test("reported Applied is reversible and route opening never sets, resets or proves it", async () => {
  const f = fixture(); let state = await save(f.store)
  state = await f.store.change(state.snapshot.token, { type: "route_opened", id: "card" })
  assert.equal(state.snapshot.items[0].userStage, "interested"); assert.equal(state.snapshot.items[0].reportedAppliedAt, null)
  state = await f.store.change(state.snapshot.token, { type: "stage", id: "card", stage: "applied_reported" })
  f.time(LATER); state = await f.other().change(state.snapshot.token, { type: "route_opened", id: "card" })
  assert.equal(state.snapshot.items[0].userStage, "applied_reported")
  assert.equal(state.snapshot.items[0].reportedAppliedAt, START); assert.equal(state.snapshot.items[0].lastRouteOpenedAt, LATER)
  for (const stage of ["preparing", "not_pursuing", "interested"]) {
    state = await f.store.change(state.snapshot.token, { type: "stage", id: "card", stage })
    assert.equal(state.snapshot.items[0].userStage, stage)
  }
})

test("two connections editing the same snapshot have one winner, not silent last-writer data loss", async () => {
  const f = fixture(), initial = await save(f.store)
  const results = await Promise.all([
    f.store.change(initial.snapshot.token, { type: "stage", id: "card", stage: "preparing" }),
    f.other().change(initial.snapshot.token, { type: "stage", id: "card", stage: "not_pursuing" }),
  ])
  assert.deepEqual(results.map(r => r.status).sort(), ["conflict", "saved"])
  const winner = results.find(r => r.status === "saved")
  assert.deepEqual((await f.other().read()).snapshot, winner.snapshot)
})

test("clear and actual database deletion cannot resurrect work from a stale tab", async () => {
  const f = fixture(), old = await save(f.store), cleared = await f.other().clear()
  assert.equal(cleared.status, "saved"); assert.notEqual(cleared.snapshot.token, old.snapshot.token)
  assert.equal((await f.store.change(old.snapshot.token, { type: "stage", id: "card", stage: "preparing" })).status, "conflict")
  assert.deepEqual((await f.store.read()).snapshot.items, [])
  const fresh = await save(f.other(), "another", cleared.snapshot.token)
  await new Promise((resolve, reject) => { const r = f.indexedDB.deleteDatabase(LOCAL_PROGRESS_DATABASE); r.onsuccess = resolve; r.onerror = reject })
  assert.deepEqual((await f.other().read()).snapshot, { token: null, items: [] })
  assert.equal((await f.store.change(fresh.snapshot.token, { type: "save", id: "old_tab", revision: 1 })).status, "conflict")
  assert.deepEqual((await f.store.read()).snapshot.items, [])
})

test("malformed, oversized and older/future documents are preserved until explicit clear", async () => {
  for (const [raw, reason] of [["{broken", "invalid_data"], ["x".repeat(100001), "invalid_data"], [JSON.stringify({ schemaVersion: 0 }), "unsupported_version"], [JSON.stringify({ schemaVersion: 2, private: "SENTINEL" }), "unsupported_version"], [JSON.stringify({ schemaVersion: 1, items: [] }), "invalid_data"]]) {
    const f = fixture(); await rawAccess(f.indexedDB, raw, true)
    assert.deepEqual(await f.store.read(), { status: "unreadable", reason })
    assert.equal((await save(f.store)).status, "unreadable"); assert.equal(await rawAccess(f.indexedDB), raw)
    assert.equal((await f.store.clear()).status, "saved"); assert.deepEqual((await f.store.read()).snapshot.items, [])
  }
})

test("quota failure and abort after put success never report saved or replace prior committed state", async () => {
  const f = fixture(), prior = await save(f.store), original = IDBObjectStore.prototype.put
  try {
    IDBObjectStore.prototype.put = function () { throw new DOMException("Synthetic quota", "QuotaExceededError") }
    assert.equal((await f.store.clear()).status, "unavailable")
    IDBObjectStore.prototype.put = function (...args) {
      const request = original.apply(this, args), transaction = this.transaction
      request.addEventListener("success", () => transaction.abort())
      return request
    }
    assert.equal((await f.store.change(prior.snapshot.token, { type: "stage", id: "card", stage: "preparing" })).status, "unavailable")
  } finally { IDBObjectStore.prototype.put = original }
  assert.deepEqual((await f.other().read()).snapshot, prior.snapshot)
})

test("unavailable and blocked storage produce bounded safe failures without touching other storage", async () => {
  for (const indexedDB of [{ open() { throw new DOMException("PRIVATE_STORAGE_ERROR", "SecurityError") } }, { open() { const r = {}; queueMicrotask(() => r.onblocked()); return r } }]) {
    const store = createLocalProgressStore({ indexedDB })
    assert.deepEqual(await store.read(), { status: "unavailable" })
    assert.deepEqual(await save(store), { status: "unavailable" })
    assert.deepEqual(await store.clear(), { status: "unavailable" })
  }
  const f = fixture(); await rawAccess(f.indexedDB, JSON.stringify({ schemaVersion: 1, writeToken: "seed", items: [] }), true)
  const other = f.indexedDB.open("separate-receipts", 1)
  await new Promise(resolve => { other.onupgradeneeded = () => other.result.createObjectStore("receipts"); other.onsuccess = resolve })
  await f.store.clear(); assert.ok(other.result.objectStoreNames.contains("receipts")); other.result.close()
})

test("limits, stale clocks and invalid commands fail without dropping existing work or silently updating it", async () => {
  const f = fixture(), prior = await save(f.store)
  assert.equal((await f.store.change(prior.snapshot.token, { type: "save", id: "card", revision: 7 })).status, "ready")
  assert.equal((await f.store.read()).snapshot.items[0].lastViewedRevision, 1)
  f.time("2020-01-01T00:00:00.000Z")
  assert.equal((await f.store.change(prior.snapshot.token, { type: "route_opened", id: "card" })).status, "invalid")
  assert.equal((await f.store.change(prior.snapshot.token, { type: "stage", id: "card", stage: "employer_confirmed" })).status, "invalid")
  assert.equal((await f.store.change(prior.snapshot.token, { type: "stage", id: "missing", stage: "interested" })).status, "not_saved")
  await rawAccess(f.indexedDB, JSON.stringify({ schemaVersion: 1, writeToken: "full", items: Array.from({ length: 100 }, (_, i) => item("card_" + i)) }), true)
  f.time(LATER); assert.equal((await save(f.store, "extra", "full")).status, "full")
  assert.equal((await f.store.read()).snapshot.items.length, 100)
})
