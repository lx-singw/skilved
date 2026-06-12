import Link from "next/link"
import { Header } from "@/components/layout/Header"

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 pt-24 text-center">
        <p className="font-mono text-xs text-muted-foreground">404</p>
        <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Back to feed
        </Link>
      </main>
    </>
  )
}
