"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bookmark, Compass, Info, Link2 } from "lucide-react"

export function BottomNav() {
  const pathname = usePathname()
  return <nav aria-label="Mobile navigation" className="mobile-nav">
    {[{ href: "/", label: "Feed", Icon: Compass }, { href: "/saved", label: "Saved", Icon: Bookmark }, { href: "/suggestions", label: "Suggest", Icon: Link2 }, { href: "/about", label: "About", Icon: Info }].map(({ href, label, Icon }) =>
      <Link href={href} key={href} aria-current={pathname === href ? "page" : undefined}><Icon size={21} aria-hidden /><span>{label}</span></Link>)}
  </nav>
}
