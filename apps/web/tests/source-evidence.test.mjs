import assert from "node:assert/strict"
import { loadUi } from "./helpers/load-ui.mjs"
import { createRequire } from "node:module"
import { test } from "node:test"
import { allFixtures, makeRecord } from "../../../packages/types/tests/fixtures/opportunities.mjs"

const require = createRequire(import.meta.url)

const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")
const { projectOpportunity } = require("@skilved/types/opportunities/internal")
const { PublicOpportunitySchema } = require("@skilved/types/opportunities")

const load = loadUi
const components = await load("components/catalogue/SourceEvidence.tsx")
const navigation = await load("lib/catalogue-query.ts")
const render = (name, opportunity) => renderToStaticMarkup(React.createElement(components[name], { opportunity }))
const opportunity = () => projectOpportunity(makeRecord()).opportunity

test("every category and both internships expose scoped evidence without private review material", () => {
  for (const record of allFixtures()) {
    const o = projectOpportunity(record).opportunity
    const html = render("SourceEvidence", o)
    assert.match(html, /Application route linked to the notice/)
    assert.match(html, /Supported by the cited evidence/)
    assert.match(html, /Check method not recorded/)
    assert.equal((html.match(/No recorded check for this question/g) ?? []).length, 5)
    assert.match(html, /datetime="2026-09-25T10:00:00.000Z"/i)
    assert.match(html, /12:00 SAST/)
    assert.match(html, /href="https:\/\/issuer.example\/notice"/)
    assert.doesNotMatch(html, /PRIVATE_|reviewer_fixture|snapshot_fixture|passed automated source/)
    assert.match(html, /reachable website does not establish/)
  }
})

test("supported, failed, conflicting and unresolved checks retain their own times, method and citation", () => {
  const o = opportunity()
  o.citations.push({ id: "secondary", label: "Secondary notice <script>bad</script>", url: "https://secondary.example/notice" })
  o.checks = ["supported", "failed", "contradicted", "unresolved"].map((outcome, i) => ({
    scope: ["destination_reachability", "availability", "issuer_attribution", "requirements"][i], outcome,
    method: i % 2 ? "human" : "automatic", checkedAt: `2026-10-15T0${i}:00:00.000Z`,
    nextCheckAt: i === 0 ? "2026-10-16T00:00:00.000Z" : null, citations: [i % 2 ? "secondary" : "citation_fixture"],
  }))
  PublicOpportunitySchema.parse(o)
  const html = render("SourceEvidence", o)
  for (const label of ["Supported by the cited evidence", "Check failed; needs confirmation", "Conflicting evidence; needs review", "Unresolved; needs confirmation", "Human check", "Automated check"])
    assert.ok(html.includes(label), label)
  assert.match(html, /datetime="2026-10-15T03:00:00.000Z"/i)
  assert.match(html, /datetime="2026-10-16T00:00:00.000Z"/i)
  assert.match(html, /not evidence that another check has occurred/)
  assert.match(html, /failed check alone does not mean the opportunity has closed/)
  assert.match(html, /Secondary notice &lt;script&gt;bad&lt;\/script&gt;/)
  assert.doesNotMatch(html, /<script>/)
  const availability = html.slice(html.indexOf("Opportunity availability"), html.indexOf("Requirement wording and meaning"))
  assert.match(availability, /https:\/\/secondary.example\/notice/)
  assert.doesNotMatch(availability, /https:\/\/issuer.example\/notice/)
})

test("missing checks remain unknown and never inherit the listing update time", () => {
  const o = opportunity()
  o.checks = []
  const html = render("SourceEvidence", PublicOpportunitySchema.parse(o))
  assert.equal((html.match(/No recorded check for this question/g) ?? []).length, 6)
  assert.equal((html.match(/<time /g) ?? []).length, 1)
  assert.match(html, /update time is separate from each source check/)
  assert.match(html, /confirm with the issuer/)
  assert.doesNotMatch(html, /Supported by the cited evidence|Human check|Automated check/)
})

test("only current reviewed explanations display, with evidence and escaped wording", () => {
  const o = opportunity()
  o.explanation = { text: "Choose either stated route <script>bad</script>", requirementRevision: o.requirements.revision, citations: ["citation_fixture"] }
  const html = render("RequirementExplanation", PublicOpportunitySchema.parse(o))
  assert.match(html, /Reviewed explanation/)
  assert.match(html, /Choose either stated route &lt;script&gt;bad&lt;\/script&gt;/)
  assert.match(html, /requirement version 1/)
  assert.match(html, /original instructions above/)
  assert.match(html, /does not decide eligibility or confirm submission/)
  assert.match(html, /https:\/\/issuer.example\/notice/)
  o.explanation.requirementRevision++
  assert.equal(PublicOpportunitySchema.safeParse(o).success, false)
  const stale = render("RequirementExplanation", o)
  assert.match(stale, /reviewed explanation is not available/)
  assert.match(stale, /ask the issuer/)
  assert.doesNotMatch(stale, /Choose either stated route/)
  o.explanation = null
  assert.match(render("RequirementExplanation", o), /reviewed explanation is not available/)
})

test("canonical detail renders original instructions before explanation and actual evidence; withheld state omits both", async () => {
  const o = opportunity()
  o.entryStage = { state: "stated", value: ["graduate"], originalText: "Synthetic graduate applicants.", citations: ["citation_fixture"] }
  o.explanation = { text: "Explanation for current instructions", requirementRevision: 1, citations: ["citation_fixture"] }
  let result = { kind: "opportunity", opportunity: o }
  const preparation = await load("components/catalogue/PreparationChecklist.tsx")
  const report = await load("components/catalogue/OpportunityReport.tsx")
  const stage = await load("components/catalogue/EntryStage.tsx")
  const conditions = await load("components/catalogue/OpportunityConditions.tsx")
  const exportCore = await load("lib/public-export.ts")
  const exportActions = await load("lib/public-export-actions.ts", { "./public-export": exportCore })
  const sharing = await load("lib/public-export-share.ts")
  const whatsapp = await load("lib/public-export-whatsapp.ts")
  const exporting = await load("components/catalogue/PublicChecklistExport.tsx", { "@/lib/public-export": exportCore, "@/lib/public-export-actions": exportActions, "@/lib/public-export-share": sharing, "@/lib/public-export-whatsapp": whatsapp })
  const settings = await load("lib/public-export-config.ts")
  const metadata = await load("lib/public-opportunity-metadata.ts")
  let exportProps
  const page = await load("app/opportunities/[id]/page.tsx", {
    "next/link": { __esModule: true, default: ({ children, href, ...props }) => React.createElement("a", { href, ...props }, children) },
    "@/components/layout/Header": { Header: () => null },
    "@/components/catalogue/PublicCatalogue": { placeLabel: () => "Synthetic place" },
    "@/lib/public-catalogue": { readOpportunity: async () => result },
    "@/components/catalogue/PreparationChecklist": preparation,
    "@/components/catalogue/PublicChecklistExport": { PublicChecklistExport: props => { exportProps = props; return React.createElement(exporting.PublicChecklistExport, props) } },
    "@/lib/public-export-config": { publicExportSettings: () => settings.publicExportSettings({ SKILVED_PUBLIC_ORIGIN: "https://skilved.example", SECRET: "PRIVATE_ENV_SENTINEL" }) },
    "@/lib/public-opportunity-metadata": metadata,
    "@/components/catalogue/OpportunityReport": report,
    "@/components/catalogue/SourceEvidence": components,
    "@/components/catalogue/EntryStage": stage,
    "@/components/catalogue/SavedProgress": { SaveOpportunity: () => null, ApplicationRouteLink: ({ id, revision }) => React.createElement("a", { href: `/opportunities/${id}/apply?revision=${revision}` }, "Original source") },
    "@/components/catalogue/OpportunityConditions": conditions,
    "@/lib/catalogue-query": navigation,
  })
  const html = renderToStaticMarkup(await page.default({ params: Promise.resolve({ id: o.id }) }))
  assert.deepEqual(exportProps, { id: o.id, origin: "https://skilved.example" })
  assert.match(html, /Take a public checklist with you/)
  assert.doesNotMatch(html, /PRIVATE_ENV_SENTINEL/)
  assert.ok(html.indexOf("Requirements and preparation checklist") < html.indexOf("Reviewed explanation"))
  assert.ok(html.indexOf("Reviewed explanation") < html.indexOf("Sources and checks"))
  assert.match(html, /Application route linked to the notice/)
  assert.match(html, /Explanation for current instructions/)
  assert.match(html, /Source-stated stage: Graduate/)
  assert.match(html, /Synthetic graduate applicants/)
  assert.match(html, /Intake and organisation roles/)
  const instructionSourceStart = html.indexOf('<section class="instruction-sources">')
  assert.ok(instructionSourceStart >= 0)
  assert.match(html.slice(instructionSourceStart, html.indexOf("</section>", instructionSourceStart)), /href="https:\/\/issuer.example\/notice"/)
  const locationStart=html.indexOf('id="location-heading"')
  assert.ok(locationStart>=0)
  const locationText=html.slice(locationStart,html.indexOf('id="residence-heading"',locationStart)).replace(/<[^>]*>/g," ").replace(/\s+/g," ")
  assert.match(locationText, /Attendance In person/)
  assert.match(html, /Stipend · Per month/)
  assert.doesNotMatch(html, /This listing passed automated/)
  assert.match(html, /href="\/"[^>]*>← All opportunities/)
  const context = { params: Promise.resolve({ id: o.id }), searchParams: Promise.resolve({ from: "/?province=gauteng&remote=false&limit=1" }) }
  const contextual = renderToStaticMarkup(await page.default(context))
  assert.ok(contextual.includes(`href="/?province=gauteng&amp;remote=false&amp;limit=1#opportunity-${o.id}"`))
  assert.match(contextual, /← Back to results/)
  const unsafe = renderToStaticMarkup(await page.default({ params: Promise.resolve({ id: o.id }), searchParams: Promise.resolve({ from: ["/", "//elsewhere.example/"] }) }))
  assert.match(unsafe, /href="\/"[^>]*>← All opportunities/)
  assert.doesNotMatch(unsafe, /elsewhere.example/)
  o.deadline = { state: "not_stated", value: null, originalText: null, citations: [] }
  PublicOpportunitySchema.parse(o)
  const unknownDeadline = renderToStaticMarkup(await page.default({ params: Promise.resolve({ id: o.id }) }))
  assert.match(unknownDeadline, /Closing date not stated/)
  assert.doesNotMatch(unknownDeadline, /30 October 2026/)
  result = { kind: "status", status: { status: "under_review" } }
  const held = renderToStaticMarkup(await page.default(context))
  assert.match(held, /needs a fresh check/)
  assert.ok(held.includes(`href="/?province=gauteng&amp;remote=false&amp;limit=1#opportunity-${o.id}"`))
  assert.doesNotMatch(held, /Sources and checks|Reviewed explanation|Entry stage|Intake and organisation roles|conditions-file|support-file|Take a public checklist|\/apply\?revision/)
  result = { kind: "unavailable" }
  const unavailable = renderToStaticMarkup(await page.default(context))
  assert.match(unavailable, /We couldn’t load this opportunity/)
  assert.match(unavailable, /does not establish that the listing has closed or been removed/)
  assert.ok(unavailable.includes(`href="/opportunities/${o.id}?from=%2F%3Fprovince%3Dgauteng%26remote%3Dfalse%26limit%3D1"`))
  assert.ok(unavailable.includes(`href="/?province=gauteng&amp;remote=false&amp;limit=1#opportunity-${o.id}"`))
  assert.doesNotMatch(unavailable, /Sources and checks|Intake and organisation roles|Take a public checklist|\/apply\?revision|PRIVATE_/)
})
