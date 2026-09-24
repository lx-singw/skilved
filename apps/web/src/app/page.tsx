import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"
import { Header } from "@/components/layout/Header"

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:pt-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Work and study in South Africa</p>
        <h1 className="mt-4 max-w-xl font-display text-4xl leading-tight text-foreground sm:text-5xl">Your next step starts with a clear opportunity.</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">We’re building a free place to find opportunities, understand what they need and apply at the source.</p>
        <section className="mt-10 rounded-xl border border-border bg-card p-6 sm:p-8" aria-labelledby="catalogue-status">
          <Search className="h-7 w-7 text-primary" aria-hidden />
          <h2 id="catalogue-status" className="mt-4 text-xl font-semibold">Our opportunity catalogue is being prepared</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">There are no published listings yet. Source review is still being set up; applications and saving are not available here yet.</p>
          <p className="mt-5 text-sm font-medium">The catalogue will cover:</p>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {["Bursaries", "Learnerships", "Apprenticeships", "Internships", "Graduate programmes", "Jobs"].map((category) => <li key={category}>{category}</li>)}
          </ul>
          <Link href="/about" className="mt-6 inline-flex items-center gap-2 font-medium text-primary hover:underline">How Skilved is taking shape <ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </section>
      </main>
    </>
  )
}
