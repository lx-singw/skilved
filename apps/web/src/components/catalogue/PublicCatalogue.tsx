import Link from "next/link"
import { ArrowRight, Compass, Search, SlidersHorizontal } from "lucide-react"
import { ENTRY_STAGE_LABELS, parseReadQuery } from "@skilved/types/opportunities"
import { Header } from "@/components/layout/Header"
import { readCatalogue } from "@/lib/public-catalogue"
import { catalogueHref } from "@/lib/catalogue-query"
import { OpportunityPost } from "./OpportunityPost"
import { DiscoveryRail } from "./DiscoveryRail"

const provinces: Record<string, string> = { eastern_cape: "Eastern Cape", free_state: "Free State", gauteng: "Gauteng", kwazulu_natal: "KwaZulu-Natal", limpopo: "Limpopo", mpumalanga: "Mpumalanga", north_west: "North West", northern_cape: "Northern Cape", western_cape: "Western Cape" }
const categories = { bursary: "Bursaries", learnership: "Learnerships", apprenticeship: "Apprenticeships", internship: "Internships", graduate_programme: "Graduate programmes", job: "Jobs" }
export { placeLabel } from "@/lib/opportunity-presentation"

function FeedHeading() {
  return <div className="feed-heading"><p className="eyebrow">Discover your possibilities</p><h1>Your opportunity feed<span>.</span></h1><p>Work, learn, study. Find a next step that feels like you.</p></div>
}

export function CatalogueLoading() {
  return <><Header /><main id="main-content" className="workspace feed-layout"><div><FeedHeading />
    <section role="status" aria-live="polite" aria-busy="true" aria-labelledby="catalogue-loading-heading" className="feed-state">
      <Compass size={28} aria-hidden /><h2 id="catalogue-loading-heading">Loading opportunities</h2>
      <p>We’re getting the current results. No listings are ready to show yet.</p>
      <div className="loading-lines" aria-hidden><span /><span /><span /></div>
    </section>
  </div><DiscoveryRail /></main></>
}

function filterHref(query: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(query)
  next.delete("cursor")
  if (value) next.set(key, value); else next.delete(key)
  return catalogueHref(next)
}

function FeedFilters({ selected }: { selected: URLSearchParams }) {
  const filterCount = ["province", "coverage", "remote", "field", "stage"].filter(key => selected.get(key)).length
  const active = [
    ["q", selected.get("q") ? `Search: ${selected.get("q")}` : null],
    ["province", provinces[selected.get("province") ?? ""]],
    ["coverage", selected.get("coverage")],
    ["remote", selected.has("remote") ? selected.get("remote") === "true" ? "Remote" : "In person or hybrid" : null],
    ["field", selected.get("field")],
    ["stage", Object.entries(ENTRY_STAGE_LABELS).find(([key]) => key === selected.get("stage"))?.[1]],
  ].filter((entry): entry is [string, string] => !!entry[1])
  return <>
    <nav className="category-tabs" aria-label="Filter by category">
      {[["", "All opportunities"], ...Object.entries(categories)].map(([key, label]) =>
        <Link key={key} href={filterHref(selected, "category", key)} aria-current={(selected.get("category") ?? "") === key ? "page" : undefined}>{label}</Link>)}
    </nav>
    <form key={selected.toString()} action="/" method="get" className="feed-search">
      <div className="search-row">
        <Search size={19} aria-hidden /><label className="sr-only" htmlFor="catalogue-search">Search opportunities</label>
        <input id="catalogue-search" name="q" maxLength={120} defaultValue={selected.get("q") ?? ""} placeholder="Search a role, company or interest…" />
        <button className="search-submit">Search</button>
      </div>
      <input type="hidden" name="category" value={selected.get("category") ?? ""} />
      <details className="filter-disclosure">
        <summary><SlidersHorizontal size={16} aria-hidden /> Refine your feed {filterCount > 0 && <span className="filter-count">{filterCount}</span>}<span className="filter-summary">{selected.get("province") ? provinces[selected.get("province")!] : "Across South Africa"}</span></summary>
        <div className="filter-grid">
          <div><label htmlFor="catalogue-province">Province</label><select id="catalogue-province" name="province" defaultValue={selected.get("province") ?? ""}><option value="">All provinces</option>{Object.entries(provinces).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
          <div><label htmlFor="catalogue-coverage">Coverage</label><select id="catalogue-coverage" name="coverage" defaultValue={selected.get("coverage") ?? ""}><option value="">All coverage</option><option value="local">Local</option><option value="national">National</option><option value="international">International</option></select></div>
          <div><label htmlFor="catalogue-attendance">Attendance</label><select id="catalogue-attendance" name="remote" defaultValue={selected.get("remote") ?? ""}><option value="">Any attendance</option><option value="true">Remote</option><option value="false">In person or hybrid</option></select></div>
          <div><label htmlFor="catalogue-stage">Source-stated entry stage</label><select id="catalogue-stage" name="stage" defaultValue={selected.get("stage") ?? ""} aria-describedby="catalogue-stage-help"><option value="">All entry stages</option>{Object.entries(ENTRY_STAGE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
          <div className="filter-wide"><label htmlFor="catalogue-field">Field or discipline</label><input id="catalogue-field" name="field" maxLength={120} defaultValue={selected.get("field") ?? ""} placeholder="For example, engineering" aria-describedby="catalogue-field-help" /><p id="catalogue-field-help">Matches words in the listed field. Clear it to include opportunities with no field stated.</p></div>
          <p id="catalogue-stage-help" className="filter-wide">Only stated stages match. Choose all stages to include unknowns. Entry level does not mean no experience required; check the full requirements.</p>
          <p className="filter-wide">A province search can also include national or remote opportunities. Check residence conditions in each notice.</p>
          <div className="filter-wide filter-actions"><button className="primary-button">Update feed <ArrowRight size={16} aria-hidden /></button><Link href="/">Clear filters</Link></div>
        </div>
      </details>
      {["limit", "sort"].map(key => selected.has(key) ? <input key={key} type="hidden" name={key} value={selected.get(key)!} /> : null)}
    </form>
    {active.length > 0 && <nav className="active-filters" aria-label="Active filters">
      {active.map(([key, label]) => <Link key={key} href={filterHref(selected, key, "")} aria-label={`Remove filter: ${label}`}>{label}<span aria-hidden>×</span></Link>)}
      <Link href="/">Clear all</Link>
    </nav>}
  </>
}

export async function PublicCatalogue({ query, preparing = false }: { query: URLSearchParams; preparing?: boolean }) {
  const result = await readCatalogue(query)
  const page = result.kind === "page" ? result.page : null
  const valid = parseReadQuery(query).ok
  const selected = valid ? query : new URLSearchParams()
  const reason = result.kind === "error" ? result.reason : null
  const next = page?.nextCursor ? catalogueHref(query, { cursor: page.nextCursor }) : null
  const restart = valid ? catalogueHref(query, { restart: true }) : "/"
  const filtered = ["q", "category", "province", "coverage", "remote", "field", "stage"].some(key => selected.get(key))
  return <><Header /><main id="main-content" className="workspace feed-layout">
    <div className="feed-column"><FeedHeading /><FeedFilters selected={selected} />
      <div className="feed-meta"><span>{filtered ? "Your filtered feed" : "Explore the latest"}</span><span>Recently updated</span></div>
      {preparing && valid && reason === "unavailable" ? <section className="feed-state" role="status"><Compass size={30} aria-hidden /><p className="eyebrow">Room for your next possibility</p><h2>Our opportunity catalogue is being prepared</h2><p>There are no published listings yet. You can explore the categories now; opportunities will appear here once published.</p><Link href="/about" className="text-link">Get to know Skilved <ArrowRight size={17} aria-hidden /></Link></section>
      : !page ? <section className="feed-state" role="status">
        <Search size={28} aria-hidden /><h2>{reason === "stale_cursor" ? "The results have changed" : reason === "invalid_cursor" ? "This results link needs a fresh search" : reason === "invalid_query" ? "These filters could not be read" : "The catalogue is temporarily unavailable"}</h2>
        <p>{reason === "stale_cursor" || reason === "invalid_cursor" ? "Restart from the first page with the same filters to see current opportunities." : reason === "invalid_query" ? "Choose valid filters and search again. Duplicate or unsupported filters cannot be used." : "We couldn’t load current opportunities. Please try again shortly."}</p>
        <Link href={reason === "unavailable" && valid ? catalogueHref(query) : restart} className="text-link">{reason === "stale_cursor" || reason === "invalid_cursor" ? "Restart these results" : reason === "invalid_query" ? "Clear invalid filters" : "Reload opportunities"}</Link>
      </section> : <section aria-label="Opportunity results">
        {page.items.length === 0 ? <div className="feed-state"><Search size={30} aria-hidden /><h2>{filtered ? "No opportunities match these filters" : "No published opportunities yet"}</h2>
          <p>{filtered ? "No published notices match this search. Try widening the filters above; notices with missing field or entry-stage details are included when those filters are cleared." : "There are no published notices to show in this catalogue right now. This does not mean there are no opportunities elsewhere."}</p>
          {filtered && <Link href="/" className="text-link">Clear filters</Link>}
        </div> : <ul className="feed-posts">{page.items.map(o => <li key={o.id} id={`opportunity-${o.id}`} className="scroll-mt-20"><OpportunityPost opportunity={o} query={query} /></li>)}</ul>}
        {next && <Link href={next} className="more-opportunities">More opportunities <ArrowRight size={17} aria-hidden /></Link>}
      </section>}
      {page && <details className="catalogue-note"><summary>About this feed</summary><p>These results cover published notices on Skilved, not every available opportunity. Check an issuer’s current announcement for its intake dates; an empty category does not tell you when a future intake opens.</p></details>}
    </div><DiscoveryRail />
  </main></>
}
