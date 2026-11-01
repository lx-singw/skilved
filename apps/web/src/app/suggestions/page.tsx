import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Suggestions } from "@/components/catalogue/Suggestions"
import { suggestionPageSettings } from "@skilved/catalogue/suggestions"
export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const metadata = { title: "Suggest an opportunity", robots: { index: false, follow: false } }
export default function SuggestionsPage() {
  return <><Header /><main id="main-content" className="workspace content-page">
    <div className="page-intro"><p className="eyebrow">Pass a possibility forward</p><h1>Found something worth sharing?</h1><p>A public opportunity link could be someone else’s next step. Send it for review here.</p></div>
    <section className="page-panel" aria-labelledby="suggest-heading"><h2 id="suggest-heading" className="text-xl font-semibold">Suggest a public opportunity link</h2><Suggestions {...suggestionPageSettings()} /></section>
    <Link href="/" className="text-link mt-5">← Back to your feed</Link>
  </main></>
}
