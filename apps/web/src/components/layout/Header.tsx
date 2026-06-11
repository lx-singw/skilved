import Link from "next/link"

export function Header() {
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
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/saved"
            className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Saved
          </Link>
          <Link
            href="/auth/signin"
            className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  )
}
