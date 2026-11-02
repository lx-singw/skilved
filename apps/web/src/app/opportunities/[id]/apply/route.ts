import { NextResponse } from "next/server"
import { readOpportunity } from "@/lib/public-catalogue"
import { applicationRecoveryHtml, type ApplicationRecoveryReason } from "@/lib/application-recovery"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const url = new URL(request.url)
  const current = await readOpportunity(id)
  const o = current?.kind === "opportunity" ? current.opportunity : null
  const expectedRevision = url.searchParams.getAll("revision")
  const validRequest = expectedRevision.length === 1 && /^[1-9][0-9]*$/.test(expectedRevision[0]) && Number.isSafeInteger(Number(expectedRevision[0])) && [...url.searchParams.keys()].every(key => key === "revision")
  const eligible = o && o.id === id && o.lifecycle === "published" && validRequest && String(o.revision) === expectedRevision[0] &&
    o.application.state === "available" && ["portal", "email"].includes(o.application.route.method)
  if (!eligible || o.application.state !== "available") {
    const reason: ApplicationRecoveryReason = current?.kind === "unavailable" ? "unavailable"
      : !current ? "unavailable"
      : current.kind === "status" ? current.status.status === "under_review" ? "review" : "missing"
      : o?.lifecycle === "closed" ? "closed"
      : o?.id !== id ? "moved"
      : !validRequest ? "invalid"
      : o.application.state !== "available" ? o.application.reason === "needs_review" ? "review" : "method"
      : ["post","in_person"].includes(o.application.route.method) ? "method" : "changed"
    return new Response(applicationRecoveryHtml(reason === "moved" && o ? o.id : id,reason), {
      status:409,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex, nofollow","Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"},
    })
  }
  const route = o.application.route
  const destination = route.method === "email"
    ? `mailto:${encodeURIComponent(route.destination.split("@")[0])}@${route.destination.split("@")[1]}`
    : route.destination
  const response = NextResponse.redirect(destination,303)
  response.headers.set("Cache-Control","no-store")
  response.headers.set("Referrer-Policy","no-referrer")
  return response
}
