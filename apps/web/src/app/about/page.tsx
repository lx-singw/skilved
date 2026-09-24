import Link from "next/link"
import { Header } from "@/components/layout/Header"

export const metadata = { title: "About Skilved" }

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-12">
        <h1 className="font-display text-4xl text-foreground">Progress you can carry forward.</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">Skilved is being built to help people find work and study opportunities, understand their requirements and prepare for what comes next.</p>
        <h2 className="mt-8 text-xl font-semibold">Starting with trustworthy discovery</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">Our first release will bring together bursaries, learnerships, apprenticeships, internships, graduate programmes and jobs. Listings will show their sources and what still needs clarification.</p>
        <h2 className="mt-8 text-xl font-semibold">What is available today</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">This is an early version. The public catalogue is not ready, and accounts, saved progress, document uploads and application assistance are not available yet.</p>
        <p className="mt-4 leading-relaxed text-muted-foreground">The consumer service will be free. As it develops, useful preparation and a personal career record will build on that foundation.</p>
        <Link href="/" className="mt-8 inline-block font-medium text-primary hover:underline">Back to opportunities</Link>
      </main>
    </>
  )
}
