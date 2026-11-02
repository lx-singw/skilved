import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Suggestions } from "@/components/catalogue/Suggestions"
import { suggestionPageSettings } from "@skilved/catalogue/suggestions"
import { Link2 } from "lucide-react"
export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const metadata = { title: "Suggest an opportunity", robots: { index: false, follow: false } }
export default function SuggestionsPage() {
  return <><Header /><main id="main-content" className="workspace suggestion-workspace">
    <div className="page-intro suggestion-intro"><div><p className="eyebrow">Pass a possibility forward</p><h1>Found something worth sharing?</h1><p>A public opportunity link could be someone else’s next step. Send it for review here.</p></div><div className="suggestion-page-mark" aria-hidden><Link2 size={36} strokeWidth={1.3}/><span>Public notice</span></div></div>
    <Suggestions {...suggestionPageSettings()} />
    <Link href="/" className="text-link mt-5">← Back to your feed</Link>
  </main></>
}
