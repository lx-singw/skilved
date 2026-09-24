import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { once } from "node:events"
import { access, readdir, readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { createServer } from "node:net"
import { dirname, join, relative, sep } from "node:path"
import { after, before, test } from "node:test"
import { fileURLToPath } from "node:url"

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const require = createRequire(import.meta.url)
const unavailableRoutes = new Map([
  ["/api/profile", ["GET", "PATCH"]],
  ["/api/documents/verify", ["POST"]],
  ["/api/applications/pre-flight", ["POST"]],
  ["/api/passport/upload-cv", ["POST"]],
  ...["save", "career", "apply", "auth/whatsapp/verify-otp", "auth/whatsapp/send-otp",
    "auth/[...nextauth]", "opportunities/[id]", "events", "agent-apply", "permissions", "feed", "webhooks/whatsapp"]
    .map((path) => [`/api/${path}`, ["GET", "POST"]]),
])
const archivedPages = [
  "/profile", "/profile/edit", "/profile/thabo-m", "/career-profile", "/career",
  "/onboarding", "/onboarding/qualifications", "/onboarding/notifications",
  "/auth/signin", "/auth/signout", "/auth/verify", "/auth/signup",
  "/applications", "/apply/op-001", "/permissions", "/saved", "/privacy", "/terms",
]

let child
let base
let logs = ""

before(async () => {
  await access(join(root, ".next/BUILD_ID")) // Run pnpm web:build first.
  const reservation = createServer()
  reservation.listen(0, "127.0.0.1")
  await once(reservation, "listening")
  const port = reservation.address().port
  await new Promise((resolve, reject) => reservation.close((error) => error ? reject(error) : resolve()))
  base = `http://127.0.0.1:${port}`
  child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: root,
    env: { ...process.env, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  })
  child.stdout.on("data", (chunk) => { logs = (logs + chunk).slice(-12000) })
  child.stderr.on("data", (chunk) => { logs = (logs + chunk).slice(-12000) })
  let spawnError
  child.on("error", (error) => { spawnError = error })
  const deadline = Date.now() + 30000
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError
    if (child.exitCode !== null) throw new Error(`Web server exited: ${logs}`)
    try {
      const response = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1000) })
      if (response.ok) return
    } catch { /* Wait only for this local child server. */ }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  throw new Error(`Local server did not start: ${logs}`)
}, { timeout: 35000 })

after(async () => {
  if (!child || child.exitCode !== null) return
  const exited = once(child, "exit")
  child.kill("SIGTERM")
  const timer = setTimeout(() => child.kill("SIGKILL"), 5000)
  timer.unref()
  await exited
  clearTimeout(timer)
})

async function filesUnder(directory) {
  const files = []
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, item.name)
    if (item.isDirectory()) files.push(...await filesUnder(path))
    else files.push(path)
  }
  return files
}

test("every routed entry is included in the reviewed public boundary", async () => {
  const appRoot = join(root, "src/app")
  const files = (await filesUnder(appRoot)).map((file) => relative(appRoot, file).split(sep).join("/"))
  assert.deepEqual(files.filter((file) => file.endsWith("/page.tsx") || file === "page.tsx").sort(),
    ["about/page.tsx", "opportunity/[slug]/page.tsx", "page.tsx"])
  assert.deepEqual(files.filter((file) => file.endsWith("/route.ts")).sort(),
    [...unavailableRoutes.keys(), "/api/health", "/api/opportunities"].map((path) => `${path.slice(1)}/route.ts`).sort())
  assert.deepEqual(files.filter((file) => /(^|\/)(opengraph-image|twitter-image|sitemap|robots|icon|apple-icon|favicon)(\.|\/)/.test(file)), [])
})

test("health describes process liveness and the catalogue contains no invented listings", async () => {
  assert.deepEqual(await (await fetch(`${base}/api/health`)).json(), { status: "ok", service: "web" })
  for (const suffix of ["", "?trade=electrical&province=gauteng", "?userId=usr_demo_123"]) {
    const response = await fetch(`${base}/api/opportunities${suffix}`)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { status: "preparing", count: 0, opportunities: [] })
  }
})

for (const [route, methods] of unavailableRoutes) {
  test(`${route} refuses data access and actions, including malformed input`, async () => {
    const path = route.replace("[...nextauth]", "session").replace("[id]", "op-001")
    for (const method of methods) {
      const bodies = method === "GET" ? [undefined] : [JSON.stringify({ userId: "another-user", documentId: "sensitive-sentinel", role: "admin" }), "{invalid-json"]
      for (const body of bodies) {
        const response = await fetch(`${base}${path}`, { method, body, headers: { "Content-Type": "application/json" } })
        assert.equal(response.status, 404)
        assert.equal(response.headers.get("cache-control"), "no-store")
        assert.deepEqual(await response.json(), { error: "This feature is not available.", code: "FEATURE_UNAVAILABLE" })
      }
    }
  })
}

test("unfinished pages and fixture opportunity links cannot expose prototype content", async () => {
  for (const path of [...archivedPages, "/opportunity/eskom-electrical-apprenticeship-gauteng", "/opportunity/not-a-listing", "/opportunity/not-a-listing/opengraph-image"]) {
    const response = await fetch(`${base}${path}`, { redirect: "manual" })
    assert.equal(response.status, 404, path)
    const html = await response.text()
    assert.doesNotMatch(html, /thabo-m|learnerships@transnet|Updated by AI every 4 hours/)
  }
})

test("public pages state their limits, retain six-category ambition and avoid unavailable calls to action", async () => {
  const response = await fetch(base)
  assert.equal(response.status, 200)
  const html = await response.text()
  for (const category of ["Bursaries", "Learnerships", "Apprenticeships", "Internships", "Graduate programmes", "Jobs"]) assert.ok(html.includes(category), category)
  assert.match(html, /no published listings yet/i)
  assert.match(html, /noindex/)
  assert.doesNotMatch(html, /example\.com|href="\/auth|verified profile|live opportunities|fonts\.googleapis/)
  const about = await fetch(`${base}/about`)
  assert.equal(about.status, 200)
  assert.match(await about.text(), /not available yet/)
})

test("shipped page assets do not contain sample records or private prototype screens", async () => {
  for (const page of ["/", "/about"]) {
    const html = await (await fetch(`${base}${page}`)).text()
    for (const match of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
      const url = new URL(match[1].replaceAll("&amp;", "&"), base)
      assert.equal(url.origin, base)
      const script = await (await fetch(url)).text()
      assert.doesNotMatch(script, /eskom-electrical-apprenticeship-gauteng|thabo-m|learnerships@transnet|hired everywhere/i)
    }
  }
  const source = await readFile(join(root, "src/lib/opportunities.ts"), "utf8")
  assert.doesNotMatch(source, /import .*prototype/)
})
