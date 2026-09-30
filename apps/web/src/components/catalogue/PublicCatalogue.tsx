import Link from "next/link"
import { CATEGORY_LABELS, type PublicOpportunity } from "@skilved/types/opportunities"
import { Header } from "@/components/layout/Header"
import { readCatalogue } from "@/lib/public-catalogue"

export function placeLabel(opportunity: PublicOpportunity) {
  const location = opportunity.location.value
  if (!location) return "Location not stated"
  if (location.attendance === "remote") return "Remote"
  if (location.coverage === "national") return "National"
  return location.places.map(p => [p.city, p.province?.replaceAll("_", " "), p.country].filter(Boolean).join(", ")).join(" · ") || "Location not stated"
}

export async function PublicCatalogue({ query }: { query: URLSearchParams }) {
  const page = await readCatalogue(query)
  const next = new URLSearchParams(query)
  if (page?.nextCursor) next.set("cursor", page.nextCursor)
  return <>
    <Header />
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:pt-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">Work and study in South Africa</p>
      <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">Find your next opportunity.</h1>
      <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">Explore opportunities, understand their requirements and apply at the original source. Free to browse.</p>
      <form action="/" method="get" className="mt-8 grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-[1fr_auto_auto]">
        <div><label htmlFor="catalogue-search" className="text-sm font-medium">Search opportunities</label>
          <input id="catalogue-search" name="q" maxLength={120} defaultValue={query.get("q") ?? ""} placeholder="Trade, company or role"
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2" /></div>
        <div><label htmlFor="catalogue-category" className="text-sm font-medium">Category</label>
          <select id="catalogue-category" name="category" defaultValue={query.get("category") ?? ""} className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2">
            <option value="">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select></div>
        <button className="self-end rounded-md bg-primary px-5 py-2 font-medium text-primary-foreground">Search</button>
      </form>
      {!page ? <section className="mt-6 rounded-xl border border-border bg-card p-6" role="status">
        <h2 className="text-lg font-semibold">The catalogue is temporarily unavailable</h2>
        <p className="mt-2 text-muted-foreground">We couldn’t load current opportunities. Please try again shortly.</p>
        <Link href="/" className="mt-4 inline-block font-medium text-primary underline">Reload opportunities</Link>
      </section> : <section className="mt-8" aria-label="Opportunity results">
        {page.items.length === 0 ? <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{query.get("q") || query.get("category") ? "No opportunities match these filters" : "No published opportunities yet"}</h2>
          <p className="mt-2 text-muted-foreground">New listings will appear here after their source and application details pass our checks.</p>
          {(query.get("q") || query.get("category")) && <Link href="/" className="mt-4 inline-block text-primary underline">Clear filters</Link>}
        </div> : <ul className="space-y-4">{page.items.map(o => <li key={o.id}>
          <article className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{CATEGORY_LABELS[o.category]}</p>
            <h2 className="mt-2 text-xl font-semibold"><Link href={`/opportunities/${o.id}`} className="hover:underline">{o.title.value ?? "Title not stated"}</Link></h2>
            <p className="mt-2 text-sm text-muted-foreground">{o.issuer.value ?? "Issuer not stated"} · {placeLabel(o)}</p>
            {o.summary.value && <p className="mt-4 leading-relaxed">{o.summary.value}</p>}
            <p className="mt-4 text-sm text-muted-foreground">{o.deadline.originalText ?? "Closing date not stated"}</p>
            <Link href={`/opportunities/${o.id}`} className="mt-5 inline-block font-medium text-primary hover:underline">View requirements and application details →</Link>
          </article>
        </li>)}</ul>}
        {page.nextCursor && <Link href={`/?${next}`} className="mt-6 inline-block rounded-md border border-border px-5 py-2 font-medium">More opportunities →</Link>}
      </section>}
    </main>
  </>
}
