import Link from "next/link"
import { cache } from "react"
import { notFound } from "next/navigation"
import { CATEGORY_LABELS } from "@skilved/types/opportunities"
import { Header } from "@/components/layout/Header"
import { placeLabel } from "@/components/catalogue/PublicCatalogue"
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
  if (result.kind === "unavailable") return <><Header /><main className="mx-auto max-w-3xl px-4 pb-24 pt-12">
    <Link href={back ?? "/"} className="text-primary underline">{back ? "← Back to results" : "← All opportunities"}</Link>
    <h1 className="mt-6 text-3xl font-semibold">We couldn’t load this opportunity</h1>
    <p className="mt-4 text-muted-foreground">Its current details and application route could not be checked. This does not establish that the listing has closed or been removed.</p>
    <a href={`/opportunities/${id}${back ? `?from=${encodeURIComponent(back.split("#")[0])}` : ""}`} className="mt-5 inline-block min-h-11 py-3 font-medium text-primary underline">Try loading these details again</a>
    <p className="mt-4"><Link href="/saved" className="text-primary underline">Return to your saved references and personal progress</Link></p>
  </main></>
  if (result.kind === "status") return <><Header /><main className="mx-auto max-w-3xl px-4 pb-24 pt-12">
    <Link href={back ?? "/"} className="text-primary underline">{back ? "← Back to results" : "← All opportunities"}</Link>
    <h1 className="mt-6 text-3xl font-semibold">{result.status.status === "under_review" ? "This opportunity needs a fresh check" : "This listing is no longer available"}</h1>
    <p className="mt-4 text-muted-foreground">The application link is unavailable. Browse the catalogue for current opportunities.</p>
    <p className="mt-4"><Link href="/saved" className="text-primary underline">Return to your saved references and personal progress</Link></p>
  </main></>
  const o = result.opportunity
  const application = o.lifecycle === "published" && o.application.state === "available" ? o.application.route : null
  const canApply = application && ["portal", "email"].includes(application.method)
  return <><Header /><main className="mx-auto max-w-3xl px-4 pb-24 pt-10">
    <Link href={back ?? "/"} className="text-sm font-medium text-primary hover:underline">{back ? "← Back to results" : "← All opportunities"}</Link>
    <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-primary">{CATEGORY_LABELS[o.category]}</p>
    <h1 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{o.title.value ?? "Opportunity details"}</h1>
    <p className="mt-3 text-muted-foreground">{o.issuer.value ?? "Issuer not stated"} · {placeLabel(o)}</p>
    {o.summary.value && <p className="mt-6 text-lg leading-relaxed">{o.summary.value}</p>}
    <SaveOpportunity key={o.id} id={o.id} revision={o.revision} />
    <OpportunityContext opportunity={o} />
    <section className="mt-8 rounded-xl border border-border bg-card p-6" aria-labelledby="application-heading">
      <h2 id="application-heading" className="text-xl font-semibold">Application details</h2>
      <p className="mt-3">{o.deadline.originalText ?? "Closing date not stated"}</p>
      {application?.method === "email" && <p className="mt-3 break-all">Application email: {application.destination}</p>}
      {application && ["in_person", "post"].includes(application.method) && <p className="mt-3 whitespace-pre-wrap">{application.method === "post" ? "Apply by post" : "Apply in person"}: {application.destination}</p>}
      {canApply ? <ApplicationRouteLink id={o.id} revision={o.revision} email={application.method === "email"} />
        : application ? null
        : <p className="mt-4 text-muted-foreground">{o.lifecycle === "closed" ? "This intake is closed." : "An application link is not currently available. Check the source notice for guidance."}</p>}
      <p className="mt-4 text-sm text-muted-foreground">Follow the application method stated in the notice. Skilved rechecks the listing before opening a portal or your email app; you complete and submit the application yourself.</p>
    </section>
    <PreparationChecklist id={o.id} revision={o.revision} requirements={o.requirements} />
    <PublicChecklistExport id={o.id} origin={publicExportSettings().origin} />
    <RequirementExplanation opportunity={o} />
    <EntryStage opportunity={o} />
    <OpportunityConditions opportunity={o} />
    <SourceEvidence opportunity={o} />
    {process.env.SKILVED_CATALOGUE_REPORTS === "true" && <OpportunityReport id={o.id} />}
  </main></>
}
