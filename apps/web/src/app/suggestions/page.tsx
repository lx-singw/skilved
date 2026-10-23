import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Suggestions } from "@/components/catalogue/Suggestions"
import { suggestionPageSettings } from "@skilved/catalogue/suggestions"
export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const metadata = { title: "Suggest a public opportunity link", robots: { index: false, follow: false } }
export default function SuggestionsPage() {
  return <><Header /><main className="mx-auto max-w-3xl px-4 pb-24 pt-10">
    <Link href="/" className="text-primary underline">← Browse opportunities</Link>
    <h1 className="mt-6 text-3xl font-semibold">Suggest a public opportunity link</h1>
    <Suggestions {...suggestionPageSettings()} />
  </main></>
}
