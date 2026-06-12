import { redirect } from "next/navigation"
export default async function TradeProvinceFilterPage({ params }: { params: Promise<{ trade: string; province: string }> }) {
  const { trade, province } = await params
  redirect(`/?trade=${trade}&province=${province}`)
}
