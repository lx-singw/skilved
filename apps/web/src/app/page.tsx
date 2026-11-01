import { Suspense } from "react"
import { PublicCatalogue, CatalogueLoading } from "@/components/catalogue/PublicCatalogue"
import { parseCataloguePageQuery } from "@/lib/catalogue-query"

export const dynamic = "force-dynamic"
type HomeProps = { searchParams: Promise<Record<string, string | string[] | undefined>> }

async function CatalogueResults({ searchParams }: HomeProps) {
  const result = parseCataloguePageQuery(await searchParams)
  return <PublicCatalogue query={result.params} preparing={process.env.SKILVED_CATALOGUE_READS !== "true"} />
}

export default function HomePage({ searchParams }: HomeProps) {
  return <Suspense fallback={<CatalogueLoading />}><CatalogueResults searchParams={searchParams} /></Suspense>
}
