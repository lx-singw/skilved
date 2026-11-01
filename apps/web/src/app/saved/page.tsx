import { Header } from "@/components/layout/Header"
import { SavedOpportunities } from "@/components/catalogue/SavedProgress"

export const dynamic = "force-dynamic"
export const metadata = { title: "Saved opportunities", robots: { index: false, follow: false } }
export default function SavedPage() {
  return <><Header /><main id="main-content" className="workspace saved-workspace">
    <div className="page-intro"><p className="eyebrow">Your space to move forward</p><h1>Keep your possibilities close.</h1><p>A shortlist today. A next step when you’re ready.</p></div>
    <SavedOpportunities />
  </main></>
}
