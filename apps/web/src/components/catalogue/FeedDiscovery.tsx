import Link from "next/link"
import { ArrowRight, ArrowUpRight, Search, SlidersHorizontal, X } from "lucide-react"
import { ENTRY_STAGE_LABELS } from "@skilved/types/opportunities"
import { changeFeed, feedCategories, feedSelections, feedRecovery, feedResultsHeading } from "@/lib/feed-discovery"
import { catalogueHref } from "@/lib/catalogue-query"
import { provinceLabels } from "@/lib/opportunity-presentation"

export function FeedFilters({ selected }: { selected: URLSearchParams }) {
  const filterCount = ["province","coverage","remote","field","stage"].filter(key => selected.get(key)).length
  const active = feedSelections(selected)
  return <>
    <nav className="category-tabs" aria-label="Filter by category">
      {[["","All opportunities"],...Object.entries(feedCategories)].map(([key,label]) => <Link key={key} href={changeFeed(selected,{category:key})} aria-current={(selected.get("category") ?? "") === key ? "page" : undefined}>{label}</Link>)}
    </nav>
    <form key={selected.toString()} action="/" method="get" className="feed-search" role="search" aria-label="Search the opportunity feed">
      <div className="search-row"><Search size={19} aria-hidden /><label className="sr-only" htmlFor="catalogue-search">Search opportunities</label>
        <input id="catalogue-search" name="q" maxLength={120} defaultValue={selected.get("q") ?? ""} placeholder="Search a title, issuer or phrase…" aria-describedby="catalogue-search-help" />
        <button className="search-submit">Search<ArrowRight size={14} aria-hidden /></button>
      </div>
      <details className="search-explainer"><summary>How this search works</summary><p id="catalogue-search-help">Search matches your phrase in titles, issuers and summaries, ignoring capitalisation. Try a shorter phrase to widen the search. Use Field or discipline below for listed fields.</p></details>
      <input type="hidden" name="category" value={selected.get("category") ?? ""} />
      <details className="filter-disclosure">
        <summary><SlidersHorizontal size={16} aria-hidden />Refine your feed {filterCount > 0 && <span className="filter-count">{filterCount}</span>}<span className="filter-summary">{selected.get("province") ? provinceLabels[selected.get("province")!] : selected.get("remote") === "true" ? "Remote" : "Across South Africa"}</span></summary>
        <div className="discovery-filter-body">
          <fieldset className="discovery-filter-group"><legend><span>01</span>Where could it take you?</legend><div className="filter-grid">
            <div><label htmlFor="catalogue-province">Province</label><select id="catalogue-province" name="province" defaultValue={selected.get("province") ?? ""}><option value="">All provinces</option>{Object.entries(provinceLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
            <div><label htmlFor="catalogue-coverage">Coverage</label><select id="catalogue-coverage" name="coverage" defaultValue={selected.get("coverage") ?? ""}><option value="">All coverage</option><option value="local">Local</option><option value="national">National</option><option value="international">International</option></select></div>
            <div className="filter-wide"><label htmlFor="catalogue-attendance">Attendance</label><select id="catalogue-attendance" name="remote" defaultValue={selected.get("remote") ?? ""}><option value="">Any attendance</option><option value="true">Remote</option><option value="false">In person or hybrid</option></select></div>
            <p className="filter-wide">A province search can also include national or remote opportunities. Check residence conditions in each notice.</p>
          </div></fieldset>
          <fieldset className="discovery-filter-group"><legend><span>02</span>Which direction interests you?</legend><div className="filter-grid">
            <div className="filter-wide"><label htmlFor="catalogue-stage">Source-stated entry stage</label><select id="catalogue-stage" name="stage" defaultValue={selected.get("stage") ?? ""} aria-describedby="catalogue-stage-help"><option value="">All entry stages</option>{Object.entries(ENTRY_STAGE_LABELS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><p id="catalogue-stage-help">Only stated stages match. Choose all stages to include unknowns. Entry level does not mean no experience required; check the full requirements.</p></div>
            <div className="filter-wide"><label htmlFor="catalogue-field">Field or discipline</label><input id="catalogue-field" name="field" maxLength={120} defaultValue={selected.get("field") ?? ""} placeholder="For example, engineering" aria-describedby="catalogue-field-help" /><p id="catalogue-field-help">Matches words in the listed field. Clear it to include opportunities with no field stated.</p></div>
          </div></fieldset>
          <div className="filter-actions"><button className="primary-button">Update feed<ArrowRight size={16} aria-hidden /></button><Link href="/">Clear filters</Link></div>
        </div>
      </details>
      {["limit","sort"].map(key=>selected.has(key)?<input key={key} type="hidden" name={key} value={selected.get(key)!}/>:null)}
    </form>
    {active.length > 0 && <nav className="active-filters discovery-selections" aria-label="Active filters"><span className="selection-caption">Your choices</span>{active.map(({key,label,href})=><Link key={key} href={href} aria-label={`Remove filter: ${label}`}>{label}<X size={12} aria-hidden /></Link>)}<Link href="/">Clear all</Link></nav>}

  </>
}
export function FeedResultsSummary({ selected, count, more }: { selected:URLSearchParams;count:number;more:boolean }) {
  return <div className="feed-results-overview">
    <div><p className="mini-label">{selected.has("cursor") ? "Continuing your search" : "On your feed"}</p>{(selected.get("q")?.trim() || selected.get("category")) && <h2>{feedResultsHeading(selected)}</h2>}
      <p className="feed-result-count" role="status">{count} published notice{count === 1 ? "" : "s"} on this page{more && <span> · More available</span>}</p>
    </div><div className="feed-order"><span>Recently updated</span>{selected.has("cursor") && <Link href={catalogueHref(selected,{restart:true})}>Back to first page</Link>}</div>
  </div>
}
export function FeedEmptyRecovery({ selected }: { selected:URLSearchParams }) {
  const options = feedRecovery(selected)
  return options.length > 0 && <div className="feed-recovery"><p className="mini-label">Make a little room in your search</p><ul>{options.map(option=><li key={option.title}><Link href={option.href}><span><strong>{option.title}</strong><small>{option.description}</small></span><ArrowUpRight size={18} aria-hidden /></Link></li>)}</ul><p>Start wider. You can refine again from the results.</p></div>
}
