import Link from "next/link"
import { Bookmark } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { SavedOpportunities } from "@/components/catalogue/SavedProgress"

export const dynamic = "force-dynamic"
export const metadata = { title: "Saved opportunities", robots: { index: false, follow: false } }
export default function SavedPage() {
  return <><Header /><main id="main-content" className="workspace content-page">
    <div className="page-intro"><p className="eyebrow">Your own shortlist</p><h1>A possibility worth keeping.</h1><p>Come back to the opportunities that caught your eye, and pick up where you left off.</p></div>
    <section className="page-panel" aria-labelledby="saved-heading"><div className="flex items-center gap-3"><Bookmark size={22} aria-hidden /><h2 id="saved-heading" className="text-xl font-semibold">Saved in this browser</h2></div><SavedOpportunities /></section>
    <Link href="/" className="text-link mt-5">← Back to your feed</Link>
  </main></>
}
