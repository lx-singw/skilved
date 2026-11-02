import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { loadUi } from "./helpers/load-ui.mjs"
import { makeRecord } from "../../../packages/types/tests/fixtures/opportunities.mjs"
const require = createRequire(import.meta.url)
const { projectOpportunity } = require("@skilved/types/opportunities/internal")
const { createSavedSummaryReader, readSavedSummary } = loadUi("lib/saved-summary.ts")
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }

test("newer public response wins even when the obsolete request ignores cancellation", async () => {
  const first = deferred(), second = deferred(), observations = [], signals = []
  const reader = createSavedSummaryReader(value => observations.push(value), (_id, signal) => { signals.push(signal); return signals.length === 1 ? first.promise : second.promise })
  const old = reader.refresh("original"), latest = reader.refresh("original")
  assert.equal(signals[0].aborted, true)
  second.resolve({ kind: "restricted", id: "original", revision: 3 }); await latest
  first.resolve({ kind: "current", id: "original", revision: 1, title: "Old synthetic title", state: "published" }); await old
  assert.deepEqual(observations, [null, null, { kind: "restricted", id: "original", revision: 3 }])
  reader.dispose()
})

test("dispose suppresses late success/failure and future reads; a failed current read can retry", async () => {
  for (const failure of [false, true]) {
    const pending = deferred(), observations = []
    const reader = createSavedSummaryReader(value => observations.push(value), () => pending.promise)
    const reading = reader.refresh("original"); reader.dispose()
    if (failure) pending.reject(Error("PRIVATE_TRANSPORT_FAILURE")); else pending.resolve({ kind: "missing" })
    await reading; await reader.refresh("original"); assert.deepEqual(observations, [null])
  }
  const observations = []; let calls = 0
  const reader = createSavedSummaryReader(value => observations.push(value), async () => { if (++calls === 1) throw Error("PRIVATE_FAILURE"); return { kind: "missing" } })
  await reader.refresh("original"); await reader.refresh("original")
  assert.deepEqual(observations, [null, { kind: "unavailable" }, null, { kind: "missing" }]); reader.dispose()
})

test("the eight-second deadline aborts both a stalled fetch and stalled body without claiming missing or success", async () => {
  const previous = { fetch: globalThis.fetch, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout }
  try {
    for (const stallBody of [false, true]) {
      let deadline, signal, cleared = 0
      globalThis.setTimeout = (callback, delay) => { assert.equal(delay, 8000); deadline = callback; return 123 }
      globalThis.clearTimeout = timer => { assert.equal(timer, 123); cleared++ }
      globalThis.fetch = (_url, options) => {
        signal = options.signal
        const pending = new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("Synthetic deadline", "AbortError"))))
        return stallBody ? Promise.resolve({ ok: true, status: 200, json: () => pending }) : pending
      }
      const reading = readSavedSummary("original"); await Promise.resolve(); deadline()
      assert.deepEqual(await reading, { kind: "unavailable" }); assert.equal(signal.aborted, true); assert.equal(cleared, 1)
    }
  } finally { Object.assign(globalThis, previous) }
})

test("upstream cancellation avoids new requests or aborts an active one; later retry uses only public ID and no-store", async () => {
  const previous = globalThis.fetch, controller = new AbortController(); let calls = 0
  try {
    globalThis.fetch = async (_url, options) => { calls++; return new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(Error("PRIVATE_ABORT")))) }
    const reading = readSavedSummary("original", controller.signal); controller.abort()
    assert.deepEqual(await reading, { kind: "unavailable" }); assert.equal(calls, 1)
    assert.deepEqual(await readSavedSummary("original", controller.signal), { kind: "unavailable" }); assert.equal(calls, 1)
    const record = makeRecord(), projection = projectOpportunity(record)
    globalThis.fetch = async (url, options) => { assert.equal(url, `/api/v1/opportunities/${record.id}`); assert.equal(options.cache, "no-store"); assert.equal(options.body, undefined); return new Response(JSON.stringify(projection)) }
    const result = await readSavedSummary(record.id)
    assert.equal(result.kind, "current"); assert.equal(result.revision, record.revision)
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_|destination|userStage|reportedAppliedAt|writeToken/)
  } finally { globalThis.fetch = previous }
})
