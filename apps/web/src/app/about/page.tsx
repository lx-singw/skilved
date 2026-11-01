import Link from "next/link"
import { ArrowRight, Compass, Bookmark, ExternalLink, Sprout } from "lucide-react"
import { Header } from "@/components/layout/Header"
export const dynamic = "force-dynamic"
export const metadata = { title: "About Skilved" }

export default function AboutPage() {
  const ready = process.env.SKILVED_CATALOGUE_READS === "true"
  return <><Header /><main id="main-content" className="workspace content-page">
    <div className="page-intro"><p className="eyebrow">A next step for everyone</p><h1>Big possibilities.<br />One next step at a time.</h1><p>Skilved brings work and study opportunities into a place you can explore at your own pace. Built for South Africa. Free to browse. No account needed.</p></div>
    <div className="about-grid">
      <section className="page-panel"><Compass size={26} aria-hidden /><h2>Follow your curiosity.</h2><p>Browse bursaries, learnerships, apprenticeships, internships, graduate programmes and jobs. Narrow the feed by place, field or the stage stated in a notice.</p></section>
      <section className="page-panel"><Bookmark size={26} aria-hidden /><h2>Make a little shortlist.</h2><p>Save a possibility and keep personal preparation progress in this browser. Saves are local to this device and browser, with no account backup or cross-device sync.</p></section>
      <section className="page-panel"><ExternalLink size={26} aria-hidden /><h2>See where it comes from.</h2><p>Read requirements and the source evidence. Follow the original application route when available. You decide what fits and submit the application yourself.</p></section>
      <section className="page-panel"><Sprout size={26} aria-hidden /><h2>Still taking shape.</h2><p>{ready ? "The feed shows published notices when available. Source details and anything that still needs clarification stay with each opportunity." : "The public catalogue is being prepared. No published listings are available yet."} Accounts, document uploads and application assistance are not available yet.</p></section>
    </div>
    <Link href="/" className="primary-button mt-7">Explore your feed <ArrowRight size={17} aria-hidden /></Link>
  </main></>
}
