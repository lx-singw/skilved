"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { ArrowUpRight, Bookmark, Compass, GraduationCap, Hammer, HeartHandshake, Info, Layers3, Link2, Sprout, BriefcaseBusiness } from "lucide-react"
import { Wordmark } from "./Wordmark"
import { ThemeToggle } from "./ThemeToggle"

const categories = [
  ["bursary", "Bursaries", GraduationCap], ["learnership", "Learnerships", Sprout],
  ["apprenticeship", "Apprenticeships", Hammer], ["internship", "Internships", Layers3],
  ["graduate_programme", "Graduate programmes", GraduationCap], ["job", "Jobs", BriefcaseBusiness],
] as const

function Navigation() {
  const pathname = usePathname(), params = useSearchParams()
  return <aside className="desktop-sidebar" aria-label="Workspace">
    <nav aria-label="Main navigation" className="side-links">
      {[{ href: "/", label: "Your feed", Icon: Compass }, { href: "/saved", label: "Saved opportunities", Icon: Bookmark }, { href: "/suggestions", label: "Suggest an opportunity", Icon: Link2 }].map(({ href, label, Icon }) =>
        <Link key={href} href={href} aria-current={pathname === href && (href !== "/" || !params.get("category")) ? "page" : undefined}>
          <Icon size={19} aria-hidden />{label}
        </Link>)}
    </nav>
    <p className="rail-label">Explore opportunities</p>
    <nav aria-label="Opportunity categories" className="side-links category-links">
      {categories.map(([key, label, Icon]) => <Link key={key} href={`/?category=${key}`} aria-current={pathname === "/" && params.get("category") === key ? "page" : undefined}><Icon size={18} aria-hidden />{label}</Link>)}
    </nav>
    <div className="sidebar-note"><HeartHandshake size={23} aria-hidden /><h2>A place to move forward.</h2><p>Explore at your own pace. Browsing is free, with no sign-in needed.</p></div>
    <Link className="sidebar-about" href="/about"><Info size={16} aria-hidden /> About Skilved <ArrowUpRight size={14} aria-hidden /></Link>
    <p className="sidebar-foot">Made for your next step.<br />South Africa</p>
  </aside>
}

export function Header() {
  return <>
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" aria-label="Skilved home"><Wordmark /></Link>
        <span className="header-caption">A little discovery. A new possibility.</span>
        <div className="header-actions"><span className="guest-label"><span />Just browsing? You’re welcome.</span><ThemeToggle /><Link className="header-saved" href="/saved" aria-label="Saved opportunities"><Bookmark size={19} aria-hidden /></Link></div>
      </div>
    </header>
    <Suspense fallback={<aside className="desktop-sidebar" aria-label="Workspace loading" />}><Navigation /></Suspense>
  </>
}
