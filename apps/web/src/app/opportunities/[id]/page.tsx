import Link from "next/link"
import { cache } from "react"
import { notFound } from "next/navigation"
import { OpportunityProfile } from "@/components/catalogue/OpportunityLens"
import { opportunityLens } from "@/lib/opportunity-lens"
import { OpportunityOverview, OpportunityContents, ApplicationDate } from "@/components/catalogue/OpportunityOverview"
import { Header } from "@/components/layout/Header"
import { FeedSave } from "@/components/catalogue/FeedSave"
import { readOpportunity } from "@/lib/public-catalogue"
import { PreparationChecklist } from "@/components/catalogue/PreparationChecklist"
import { OpportunityReport } from "@/components/catalogue/OpportunityReport"
import { RequirementExplanation, SourceEvidence } from "@/components/catalogue/SourceEvidence"
import { catalogueReturnHref } from "@/lib/catalogue-query"
import { EntryStage } from "@/components/catalogue/EntryStage"
import { OpportunityContext, OpportunityConditions } from "@/components/catalogue/OpportunityConditions"
import { ApplicationRouteLink, SaveOpportunity } from "@/components/catalogue/SavedProgress"
import { PublicChecklistExport } from "@/components/catalogue/PublicChecklistExport"
import { publicExportSettings } from "@/lib/public-export-config"
import { publicOpportunityMetadata } from "@/lib/public-opportunity-metadata"

export const dynamic = "force-dynamic"
// React request memoization: metadata and body share one current read, never a cross-request snapshot.
const readCurrentOpportunity = cache(readOpportunity)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await readCurrentOpportunity(id)
  return publicOpportunityMetadata(result, publicExportSettings().origin, new Date().toISOString())
}

export default async function OpportunityPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params
  const back = catalogueReturnHref((await searchParams)?.from, id)
  const result = await readCurrentOpportunity(id)
  if (!result) notFound()
  if (result.kind === "unavailable") return <><Header /><main id="main-content" className="workspace content-page">
    <Link href={back ?? "/"} className="text-primary underline">{back ? "← Back to results" : "← All opportunities"}</Link>
    <h1 className="mt-6 text-3xl font-semibold">We couldn’t load this opportunity</h1>
    <p className="mt-4 text-muted-foreground">Its current details and application route could not be checked. This does not establish that the listing has closed or been removed.</p>
    <a href={`/opportunities/${id}${back ? `?from=${encodeURIComponent(back.split("#")[0])}` : ""}`} className="mt-5 inline-block min-h-11 py-3 font-medium text-primary underline">Try loading these details again</a>
    <p className="mt-4"><Link href="/saved" className="text-primary underline">Return to your saved references and personal progress</Link></p>
  </main></>
  if (result.kind === "status") return <><Header /><main id="main-content" className="workspace content-page">
    <Link href={back ?? "/"} className="text-primary underline">{back ? "← Back to results" : "← All opportunities"}</Link>
    <h1 className="mt-6 text-3xl font-semibold">{result.status.status === "under_review" ? "This opportunity needs a fresh check" : "This listing is no longer available"}</h1>
    <p className="mt-4 text-muted-foreground">The application link is unavailable. Browse the catalogue for current opportunities.</p>
    <p className="mt-4"><Link href="/saved" className="text-primary underline">Return to your saved references and personal progress</Link></p>
  </main></>
  const o = result.opportunity
  const application = o.lifecycle === "published" && o.application.state === "available" ? o.application.route : null
  const canApply = application && ["portal", "email"].includes(application.method)
  return <><Header /><main id="main-content" className="workspace opportunity-workspace">
    <div className="opportunity-back"><Link href={back ?? "/"}>{back ? "← Back to results" : "← All opportunities"}</Link><span>Explore. Understand. Make your move.</span></div>
    <OpportunityOverview opportunity={o} />
    <OpportunityContents />
    <div className="opportunity-workspace-grid">
      <div className="opportunity-reading">
        <section id="opportunity-story" className="story-panel">
          <p className="section-caption">01 / Get the full picture</p><h2>{opportunityLens(o).story}</h2>
          {o.summary.value ? <p className="opportunity-summary">{o.summary.value}</p> : <p className="section-lede">A summary is not stated in this notice. Review the original instructions and source details below.</p>}
          <OpportunityProfile opportunity={o} />
          <details className="context-drawer"><summary>Intake, organisations & who is involved <span>+</span></summary><OpportunityContext opportunity={o} /></details>
        </section>
        <div id="preparation"><PreparationChecklist id={o.id} revision={o.revision} requirements={o.requirements} /></div>
        <div className="reading-notes"><RequirementExplanation opportunity={o} /><EntryStage opportunity={o} /></div>
        <div className="practical-panels"><OpportunityConditions opportunity={o} /></div>
        <section id="your-workspace" className="personal-workspace">
          <p className="section-caption">03 / Make it your next move</p><h2>Keep your place.</h2><p className="section-lede">A shortlist, a personal stage, a way back. Take this one step at a time.</p>
          <SaveOpportunity key={o.id} id={o.id} revision={o.revision} />
          <details className="export-drawer"><summary>Take the public instructions with you <span>+</span></summary><PublicChecklistExport id={o.id} origin={publicExportSettings().origin} /></details>
        </section>
        <section id="evidence" className="evidence-workspace">
          <p className="section-caption">04 / Look behind the listing</p><h2>Know what you’re looking at.</h2><p className="section-lede">Inspect the original references, the scope of each check and anything still unresolved.</p>
          <details className="evidence-drawer"><summary><span>Open the source file<small>{o.citations.length} source reference{o.citations.length === 1 ? "" : "s"} · checks shown individually</small></span><span>+</span></summary><SourceEvidence opportunity={o} /></details>
          {process.env.SKILVED_CATALOGUE_REPORTS === "true" && <OpportunityReport id={o.id} />}
        </section>
        <Link href={back ?? "/"} className="return-to-discovery">Keep exploring opportunities <span>↗</span></Link>
      </div>
      <aside className="opportunity-action-rail" aria-label="Your next step">
        <section className="application-panel" aria-labelledby="application-heading">
          <p className="mini-label">When you’re ready</p><h2 id="application-heading">Application details</h2><ApplicationDate opportunity={o} />
          {application && <p className="application-method">Apply {application.method === "portal" ? "through the original portal" : application.method === "email" ? "by email" : application.method === "post" ? "by post" : "in person"}</p>}
          {application?.method === "email" && <p className="application-destination">Application email: {application.destination}</p>}
          {application && ["in_person", "post"].includes(application.method) && <p className="application-destination">{application.method === "post" ? "Apply by post" : "Apply in person"}: {application.destination}</p>}
          {canApply ? <ApplicationRouteLink id={o.id} revision={o.revision} email={application.method === "email"} /> : application ? null : <p className="section-lede">{o.lifecycle === "closed" ? "This intake is closed." : "An application link is not currently available. Check the source notice for guidance."}</p>}
          <details className="application-help"><summary>Before opening the application</summary><p>Follow the application method stated in the notice. Skilved rechecks the listing before opening a portal or your email app; you complete and submit the application yourself.</p></details>
          <div className="rail-save-action"><FeedSave id={o.id} revision={o.revision} /><a href="#your-workspace">Your personal workspace ↓</a></div>
        </section>
        <div className="next-step-note"><span aria-hidden>↳</span><div><h3>You set the pace.</h3><p>Read the conditions. Check what’s unclear. Save it if it’s a possibility.</p><a href="#preparation">Start with the requirements ↓</a></div></div>
      </aside>
    </div>
  </main></>
}
