import Link from "next/link"
import { CATEGORY_LABELS, ENTRY_STAGE_LABELS, parseReadQuery, type PublicOpportunity } from "@skilved/types/opportunities"
import { Header } from "@/components/layout/Header"
import { readCatalogue } from "@/lib/public-catalogue"
import { catalogueHref, opportunityHref } from "@/lib/catalogue-query"

const provinces = { eastern_cape: "Eastern Cape", free_state: "Free State", gauteng: "Gauteng", kwazulu_natal: "KwaZulu-Natal", limpopo: "Limpopo", mpumalanga: "Mpumalanga", north_west: "North West", northern_cape: "Northern Cape", western_cape: "Western Cape" }

export function placeLabel(opportunity: PublicOpportunity) {
  const location = opportunity.location.value
  if (!location) return "Location not stated"
  if (location.attendance === "remote") return "Remote"
  if (location.coverage === "national") return "National"
  return location.places.map(p => [p.city, p.province?.replaceAll("_", " "), p.country].filter(Boolean).join(", ")).join(" · ") || "Location not stated"
}

export function CatalogueLoading() {
  return <><Header /><main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:pt-16">
    <section role="status" aria-live="polite" aria-busy="true" aria-labelledby="catalogue-loading-heading" className="rounded-xl border border-border bg-card p-6">
      <h1 id="catalogue-loading-heading" className="text-2xl font-semibold">Loading opportunities</h1>
      <p className="mt-3 text-muted-foreground">We’re getting the current results. No listings are ready to show yet.</p>
    </section>
  </main></>
}

export async function PublicCatalogue({ query }: { query: URLSearchParams }) {
  const result = await readCatalogue(query)
  const page = result.kind === "page" ? result.page : null
  const valid = parseReadQuery(query).ok
  const selected = valid ? query : new URLSearchParams()
  const reason = result.kind === "error" ? result.reason : null
  const next = page?.nextCursor ? catalogueHref(query, { cursor: page.nextCursor }) : null
  const restart = valid ? catalogueHref(query, { restart: true }) : "/"
  const filtered = ["q", "category", "province", "coverage", "remote", "field", "stage"].some(key => selected.get(key))
  return <>
    <Header />
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:pt-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">Work and study in South Africa</p>
      <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">Find your next opportunity.</h1>
      <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">Explore opportunities, understand their requirements and apply at the original source. Free to browse.</p>
      <form action="/" method="get" className="mt-8 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
        <div><label htmlFor="catalogue-search" className="text-sm font-medium">Search opportunities</label>
          <input id="catalogue-search" name="q" maxLength={120} defaultValue={selected.get("q") ?? ""} placeholder="Trade, company or role"
            className="mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 py-2" /></div>
        <div><label htmlFor="catalogue-category" className="text-sm font-medium">Category</label>
          <select id="catalogue-category" name="category" defaultValue={selected.get("category") ?? ""} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-background px-3 py-2">
            <option value="">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select></div>
        <div><label htmlFor="catalogue-province" className="text-sm font-medium">Province</label>
          <select id="catalogue-province" name="province" defaultValue={selected.get("province") ?? ""} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-background px-3 py-2">
            <option value="">All provinces</option>{Object.entries(provinces).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select></div>
        <div><label htmlFor="catalogue-coverage" className="text-sm font-medium">Coverage</label>
          <select id="catalogue-coverage" name="coverage" defaultValue={selected.get("coverage") ?? ""} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-background px-3 py-2">
            <option value="">All coverage</option><option value="local">Local</option><option value="national">National</option><option value="international">International</option>
          </select></div>
        <div><label htmlFor="catalogue-attendance" className="text-sm font-medium">Attendance</label>
          <select id="catalogue-attendance" name="remote" defaultValue={selected.get("remote") ?? ""} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-background px-3 py-2">
            <option value="">Any attendance</option><option value="true">Remote</option><option value="false">In person or hybrid</option>
          </select></div>
        <div><label htmlFor="catalogue-field" className="text-sm font-medium">Field or discipline</label>
          <input id="catalogue-field" name="field" maxLength={120} defaultValue={selected.get("field") ?? ""} placeholder="For example, engineering" aria-describedby="catalogue-field-help"
            className="mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 py-2" />
          <p id="catalogue-field-help" className="mt-2 text-sm text-muted-foreground">Matches words in the listed field. Clear it to include opportunities with no field stated.</p></div>
        <div><label htmlFor="catalogue-stage" className="text-sm font-medium">Source-stated entry stage</label>
          <select id="catalogue-stage" name="stage" defaultValue={selected.get("stage") ?? ""} aria-describedby="catalogue-stage-help" className="mt-2 block min-h-11 w-full rounded-md border border-border bg-background px-3 py-2">
            <option value="">All entry stages</option>{Object.entries(ENTRY_STAGE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <p id="catalogue-stage-help" className="mt-2 text-sm text-muted-foreground">Only stated stages match. Choose all stages to include unknowns. Entry level does not mean no experience required; check the full requirements.</p></div>
        {["limit", "sort"].map(key => selected.has(key) ? <input key={key} type="hidden" name={key} value={selected.get(key)!} /> : null)}
        <button className="min-h-11 self-end rounded-md bg-primary px-5 py-2 font-medium text-primary-foreground">Search</button>
        <p className="text-sm leading-relaxed text-muted-foreground sm:col-span-2">A province search can also include national or remote opportunities. Check residence conditions in each notice.</p>
      </form>
      {page && <p className="mt-5 text-sm leading-relaxed text-muted-foreground">These results cover published notices on Skilved, not every available opportunity. Check an issuer’s current announcement for its intake dates; an empty category does not tell you when a future intake opens.</p>}
      {!page ? <section className="mt-6 rounded-xl border border-border bg-card p-6" role="status">
        <h2 className="text-lg font-semibold">{reason === "stale_cursor" ? "The results have changed" : reason === "invalid_cursor" ? "This results link needs a fresh search" : reason === "invalid_query" ? "These filters could not be read" : "The catalogue is temporarily unavailable"}</h2>
        <p className="mt-2 text-muted-foreground">{reason === "stale_cursor" || reason === "invalid_cursor" ? "Restart from the first page with the same filters to see current opportunities." : reason === "invalid_query" ? "Choose valid filters and search again. Duplicate or unsupported filters cannot be used." : "We couldn’t load current opportunities. Please try again shortly."}</p>
        <Link href={reason === "unavailable" && valid ? catalogueHref(query) : restart} className="mt-4 inline-block min-h-11 py-3 font-medium text-primary underline">{reason === "stale_cursor" || reason === "invalid_cursor" ? "Restart these results" : reason === "invalid_query" ? "Clear invalid filters" : "Reload opportunities"}</Link>
      </section> : <section className="mt-8" aria-label="Opportunity results">
        {page.items.length === 0 ? <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{filtered ? "No opportunities match these filters" : "No published opportunities yet"}</h2>
          <p className="mt-2 text-muted-foreground">{filtered ? "No published notices match this search. Try widening the filters above; notices with missing field or entry-stage details are included when those filters are cleared." : "There are no published notices to show in this catalogue right now. This does not mean there are no opportunities elsewhere."}</p>
          {filtered && <Link href="/" className="mt-4 inline-block text-primary underline">Clear filters</Link>}
        </div> : <ul className="space-y-4">{page.items.map(o => <li key={o.id} id={`opportunity-${o.id}`} className="scroll-mt-20">
          <article className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{CATEGORY_LABELS[o.category]}</p>
            <h2 className="mt-2 text-xl font-semibold"><Link href={opportunityHref(o.id, query)} className="hover:underline">{o.title.value ?? "Title not stated"}</Link></h2>
            <p className="mt-2 text-sm text-muted-foreground">{o.issuer.value ?? "Issuer not stated"} · {placeLabel(o)}</p>
            <p className="mt-2 break-words text-sm text-muted-foreground">{o.fields.length ? `Field: ${o.fields.join(" · ")}` : "Field not stated"}</p>
            {o.summary.value && <p className="mt-4 leading-relaxed">{o.summary.value}</p>}
            <p className="mt-4 text-sm text-muted-foreground">{o.deadline.originalText ?? "Closing date not stated"}</p>
            <Link href={opportunityHref(o.id, query)} className="mt-5 inline-block font-medium text-primary hover:underline">View requirements and application details →</Link>
          </article>
        </li>)}</ul>}
        {next && <Link href={next} className="mt-6 inline-block rounded-md border border-border px-5 py-2 font-medium">More opportunities →</Link>}
      </section>}
    </main>
  </>
}
