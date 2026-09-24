"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/utils/classNames"
import { Wordmark } from "@/components/layout/Wordmark"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

export function Header() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" aria-label="Skilved home"><Wordmark size="md" /></Link>
        <nav className="flex items-center gap-1 text-sm" aria-label="Main navigation">
          {[{ href: "/", label: "Opportunities" }, { href: "/about", label: "About" }].map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}
              className={cn("rounded-md px-3 py-1.5 font-medium transition-colors", pathname === item.href ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
