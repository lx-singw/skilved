import Link from "next/link"
import { ArrowRight, Compass, Search } from "lucide-react"
import { parseReadQuery } from "@skilved/types/opportunities"
import { Header } from "@/components/layout/Header"
import { readCatalogue } from "@/lib/public-catalogue"
import { feedSelections } from "@/lib/feed-discovery"
import { catalogueHref } from "@/lib/catalogue-query"
import { OpportunityPost } from "./OpportunityPost"
import { DiscoveryRail } from "./DiscoveryRail"
import { FeedFilters, FeedResultsSummary, FeedEmptyRecovery } from "./FeedDiscovery"
import { FeedRecovery } from "./FeedRecovery"

export { placeLabel } from "@/lib/opportunity-presentation"

function FeedHeading() {
  return <div className="feed-heading"><p className="eyebrow">Discover your possibilities</p><h1>Your opportunity feed<span>.</span></h1><p>Work, learn, study. Find a next step that feels like you.</p></div>
}

export function CatalogueLoading() {
  return <><Header /><main id="main-content" className="workspace feed-layout"><div><FeedHeading />
    <section role="status" aria-live="polite" aria-busy="true" aria-labelledby="catalogue-loading-heading" className="feed-state">
      <Compass size={28} aria-hidden /><h2 id="catalogue-loading-heading">Loading opportunities</h2>
      <p>We’re getting the current results. You can keep reading about Skilved while this loads.</p>
      <div className="feed-loading-cards" aria-hidden>{[0,1].map(i=><div key={i}><span className="loading-signature"/><span className="loading-title"/><span className="loading-fact"/><span className="loading-footer"/></div>)}</div>
    </section>
  </div><DiscoveryRail /></main></>
}

export async function PublicCatalogue({ query, readsDisabled = false }: { query: URLSearchParams; readsDisabled?: boolean }) {
  const result = await readCatalogue(query)
  const page = result.kind === "page" ? result.page : null
  const valid = parseReadQuery(query).ok
  const selected = valid ? query : new URLSearchParams()
  const reason = result.kind === "error" ? result.reason : null
  const next = page?.nextCursor ? catalogueHref(query, { cursor: page.nextCursor }) : null
  const restart = valid ? catalogueHref(query, { restart: true }) : "/"
  const filtered = feedSelections(selected).length > 0
  return <><Header /><main id="main-content" className="workspace feed-layout">
    <div className="feed-column"><FeedHeading /><FeedFilters selected={selected} />
      {page ? <FeedResultsSummary selected={selected} count={page.items.length} more={!!next} /> : <div className="feed-meta"><span>{filtered ? "Your filtered feed" : "Opportunity browsing"}</span><span>Current results not loaded</span></div>}
      {!page ? <FeedRecovery reason={reason ?? "unavailable"} query={query} readsDisabled={readsDisabled} /> : <section aria-label="Opportunity results">
        {page.items.length === 0 ? <div className="feed-state"><Search size={30} aria-hidden /><h2>{filtered ? "No opportunities match these filters" : "No published opportunities yet"}</h2>
          <p>{filtered ? "No published notices match this search. Try widening the filters above; notices with missing field or entry-stage details are included when those filters are cleared." : "There are no published notices to show in this catalogue right now. This does not mean there are no opportunities elsewhere."}</p>
          {filtered && <><FeedEmptyRecovery selected={selected} /><Link href="/" className="text-link">Clear filters</Link></>}
        </div> : <ul className="feed-posts">{page.items.map(o => <li key={o.id} id={`opportunity-${o.id}`} className="scroll-mt-20"><OpportunityPost opportunity={o} query={query} /></li>)}</ul>}
        {next && <nav className="feed-pagination" aria-label="Results pages"><p>More published notices are available for these choices.</p><Link href={next} className="more-opportunities">More opportunities <ArrowRight size={17} aria-hidden /></Link><Link className="feed-restart" href={restart}>Back to first page</Link></nav>}
      </section>}
      {page && <details className="catalogue-note"><summary>About this feed</summary><p>These results cover published notices on Skilved, not every available opportunity. Check an issuer’s current announcement for its intake dates; an empty category does not tell you when a future intake opens.</p></details>}
    </div><DiscoveryRail />
  </main></>
}
