"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/utils/classNames"

const NAV_LINKS = [
  { href: "/saved", label: "Saved" },
  { href: "/profile", label: "Profile" },
]

export function Header() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Skilved home">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            S
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            SKILVD
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium transition-colors",
                isActive(href)
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              aria-current={isActive(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/auth/signin"
            className={cn(
              "rounded-md px-3 py-1.5 font-medium transition-colors",
              isActive("/auth/signin")
                ? "bg-primary/80 text-primary-foreground"
                : "bg-primary text-primary-foreground hover:opacity-90",
            )}
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  )
}

