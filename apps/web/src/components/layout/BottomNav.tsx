"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Briefcase, Sparkles, LogIn } from "lucide-react"
import { cn } from "@/utils/classNames"

const NAV_ITEMS = [
  { href: "/",               label: "Jobs",    Icon: Briefcase },
  { href: "/career-profile", label: "Profile", Icon: Sparkles  },
  { href: "/auth/signin",    label: "Sign in", Icon: LogIn     },
]

export function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", active && "stroke-[2.5]")}
                  aria-hidden
                />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
