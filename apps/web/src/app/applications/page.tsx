import { Header } from "@/components/layout/Header"
export default function ComingSoonPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 pt-16 text-center">
        <h1 className="text-xl font-bold text-foreground capitalize">applications</h1>
        <p className="mt-2 text-sm text-muted-foreground">Coming soon.</p>
      </main>
    </>
  )
}
