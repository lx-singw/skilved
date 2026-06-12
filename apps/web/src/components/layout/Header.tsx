"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/utils/classNames"
import { Wordmark } from "@/components/layout/Wordmark"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

export function Header() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center" aria-label="Skilved home">
          <Wordmark size="md" />
        </Link>

        <nav className="flex items-center gap-1 text-sm" aria-label="Main navigation">
          <Link
            href="/career-profile"
            className={cn(
              "hidden rounded-md px-3 py-1.5 font-medium transition-colors sm:inline-block",
              isActive("/career-profile")
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            How it works
          </Link>
          <ThemeToggle />
          <Link
            href="/auth/signin"
            className={cn(
              "rounded-md px-3 py-1.5 font-medium transition-colors",
              isActive("/auth/signin")
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Create your profile
          </Link>
        </nav>
      </div>
    </header>
  )
}

