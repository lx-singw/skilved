"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 pt-24 text-center">
      <p className="font-mono text-xs text-muted-foreground">Error</p>
      <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Back to feed
        </Link>
      </div>
    </main>
  )
}
