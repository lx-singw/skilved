import { NextResponse } from "next/server"
import { readOpportunity } from "@/lib/public-catalogue"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const url = new URL(request.url)
  const current = await readOpportunity(id)
  const o = current?.kind === "opportunity" ? current.opportunity : null
  const eligible = o && o.lifecycle === "published" && String(o.revision) === url.searchParams.get("revision") &&
    o.application.state === "available" && ["portal", "email"].includes(o.application.route.method)
  if (!eligible || o.application.state !== "available") {
    return new Response("This application link needs a fresh check. Return to the listing and reload its details.", {
      status: 409, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    })
  }
  const route = o.application.route
  const destination = route.method === "email"
    ? `mailto:${encodeURIComponent(route.destination.split("@")[0])}@${route.destination.split("@")[1]}`
    : route.destination
  const response = NextResponse.redirect(destination, 303)
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("Referrer-Policy", "no-referrer")
  return response
}
