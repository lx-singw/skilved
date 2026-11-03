import Link from "next/link"
import { cache } from "react"
import { notFound } from "next/navigation"
import { OpportunityProfile } from "@/components/catalogue/OpportunityLens"
import { opportunityLens } from "@/lib/opportunity-lens"
import { OpportunityOverview } from "@/components/catalogue/OpportunityOverview"
import { OpportunityContents } from "@/components/catalogue/OpportunityContents"
import { Header } from "@/components/layout/Header"
import { ApplicationPanel } from "@/components/catalogue/ApplicationPanel"
import { readOpportunity } from "@/lib/public-catalogue"
import { PreparationChecklist } from "@/components/catalogue/PreparationChecklist"
import { OpportunityReport } from "@/components/catalogue/OpportunityReport"
import { RequirementExplanation, SourceEvidence, SourceEvidenceSummary } from "@/components/catalogue/SourceEvidence"
import { catalogueReturnHref } from "@/lib/catalogue-query"
import { EntryStage } from "@/components/catalogue/EntryStage"
import { OpportunityContext, OpportunityConditions } from "@/components/catalogue/OpportunityConditions"
import { SaveOpportunity } from "@/components/catalogue/SavedProgress"
import { PublicChecklistExport } from "@/components/catalogue/PublicChecklistExport"
import { publicExportSettings } from "@/lib/public-export-config"
import { publicOpportunityMetadata } from "@/lib/public-opportunity-metadata"
import { NoticeRecovery } from "@/components/catalogue/NoticeRecovery"

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
  const from = (await searchParams)?.from
  const back = catalogueReturnHref(from, id)
  const result = await readCurrentOpportunity(id)
  if (!result) notFound()
  if (result.kind === "unavailable") return <><Header /><NoticeRecovery id={id} from={from} state="unavailable" /></>
  if (result.kind === "status") return <><Header /><NoticeRecovery id={id} from={from} state={result.status.status} /></>
  const o = result.opportunity
  return <><Header /><main id="main-content" className="workspace opportunity-workspace">
    <div className="opportunity-back"><Link href={back ?? "/"}>{back ? "← Back to results" : "← All opportunities"}</Link><span>Explore. Understand. Make your move.</span></div>
    <OpportunityOverview opportunity={o} />
    <OpportunityContents key={o.id} />
    <div className="opportunity-workspace-grid">
      <div className="opportunity-reading">
        <section id="opportunity-story" tabIndex={-1} className="story-panel">
          <p className="section-caption">01 / Get the full picture</p><h2>{opportunityLens(o).story}</h2>
          {o.summary.value ? <p className="opportunity-summary">{o.summary.value}</p> : <p className="section-lede">A summary is not stated in this notice. Review the original instructions and source details below.</p>}
          <OpportunityProfile opportunity={o} />
          <OpportunityContext opportunity={o} />
        </section>
        <div id="preparation" tabIndex={-1}><PreparationChecklist id={o.id} revision={o.revision} requirements={o.requirements} citations={o.citations} /></div>
        <div className="reading-notes"><RequirementExplanation opportunity={o} /><EntryStage opportunity={o} /></div>
        <div className="practical-panels"><OpportunityConditions opportunity={o} /></div>
        <section id="your-workspace" tabIndex={-1} className="personal-workspace">
          <p className="section-caption">03 / Make it your next move</p><h2>Keep your place.</h2><p className="section-lede">A shortlist, a personal stage, a way back. Take this one step at a time.</p>
          <SaveOpportunity key={o.id} id={o.id} revision={o.revision} />
          <details className="export-drawer"><summary><span>Keep a dated public copy<small>Instructions, sources and a way back to the notice</small></span><span>+</span></summary><PublicChecklistExport id={o.id} origin={publicExportSettings().origin} /></details>
        </section>
        <section id="evidence" tabIndex={-1} className="evidence-workspace">
          <p className="section-caption">04 / Look behind the listing</p><h2>Know what you’re looking at.</h2><p className="section-lede">Inspect the original references, the scope of each check and anything still unresolved.</p>
          <SourceEvidenceSummary opportunity={o} />
          <details className="evidence-drawer"><summary><span>Open the source file<small>{o.citations.length} source reference{o.citations.length === 1 ? "" : "s"} · checks shown individually</small></span><span>+</span></summary><SourceEvidence opportunity={o} /></details>
          {process.env.SKILVED_CATALOGUE_REPORTS === "true" && <OpportunityReport id={o.id} />}
        </section>
        <Link href={back ?? "/"} className="return-to-discovery">Keep exploring opportunities <span>↗</span></Link>
      </div>
      <aside className="opportunity-action-rail" aria-label="Your next step">
        <ApplicationPanel opportunity={o} />
        <div className="next-step-note"><span aria-hidden>↳</span><div><h3>You set the pace.</h3><p>Read the conditions. Check what’s unclear. Save it if it’s a possibility.</p><a href="#preparation">Start with the requirements ↓</a></div></div>
      </aside>
    </div>
  </main></>
}
