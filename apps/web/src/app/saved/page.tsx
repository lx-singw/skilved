import Link from "next/link"
import { notFound } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { SavedOpportunities } from "@/components/catalogue/SavedProgress"

export const dynamic = "force-dynamic"
export const metadata = { title: "Saved in this browser", robots: { index: false, follow: false } }
export default function SavedPage() {
  if (process.env.SKILVED_CATALOGUE_READS !== "true") notFound()
  return <><Header /><main className="mx-auto max-w-3xl px-4 pb-24 pt-10">
    <Link href="/" className="text-primary underline">← Browse opportunities</Link>
    <h1 className="mt-6 text-3xl font-semibold">Saved in this browser</h1>
    <SavedOpportunities />
  </main></>
}
