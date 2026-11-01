import Link from "next/link"
import { ArrowRight, ArrowUpRight, Bookmark, BookOpen, GraduationCap, Hammer, Link2 } from "lucide-react"

export function DiscoveryRail() {
  return <aside className="discovery-rail" aria-label="Discovery tips">
    <section className="rail-card">
      <span className="rail-kicker"><BookOpen size={16} aria-hidden /> A little direction</span>
      <h2>Where do you<br />want to go next?</h2>
      <p>There’s more than one way to get there.</p>
      <Link href="/?stage=school_leaver"><span className="rail-icon"><GraduationCap size={19} aria-hidden /></span><span><strong>Finishing school</strong><small>Explore your next step</small></span><ArrowUpRight size={16} aria-hidden /></Link>
      <Link href="/?category=apprenticeship"><span className="rail-icon"><Hammer size={19} aria-hidden /></span><span><strong>Learning a trade</strong><small>Find hands-on pathways</small></span><ArrowUpRight size={16} aria-hidden /></Link>
      <Link href="/?stage=graduate"><span className="rail-icon"><BookOpen size={19} aria-hidden /></span><span><strong>Starting your career</strong><small>Discover graduate routes</small></span><ArrowUpRight size={16} aria-hidden /></Link>
    </section>
    <section className="share-card"><Link2 size={24} aria-hidden /><h2>Good opportunities<br />are worth sharing.</h2><p>Found a public notice that could help someone? Suggest it for review.</p><Link href="/suggestions">Suggest a link <ArrowRight size={17} aria-hidden /></Link></section>
    <section className="save-tip"><Bookmark size={18} aria-hidden /><div><h2>Keep what catches your eye.</h2><p>Saves stay in this browser. No account needed; no cross-device backup.</p><Link href="/saved">Open your saved list <ArrowRight size={14} aria-hidden /></Link></div></section>
    <p className="rail-footer">A next step for everyone.<br />Free to explore. Yours to choose.</p>
  </aside>
}
