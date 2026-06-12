import { redirect } from "next/navigation"
export default async function TradeFilterPage({ params }: { params: Promise<{ trade: string }> }) {
  const { trade } = await params
  redirect(`/?trade=${trade}`)
}
