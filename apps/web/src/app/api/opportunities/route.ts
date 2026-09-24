import { NextResponse } from "next/server"
import { getAllOpportunities } from "@/lib/opportunities"

export function GET() {
  const opportunities = getAllOpportunities()
  return NextResponse.json(
    { status: "preparing", count: opportunities.length, opportunities },
    { headers: { "Cache-Control": "no-store" } },
  )
}
