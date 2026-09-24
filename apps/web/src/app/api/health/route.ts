import { NextResponse } from "next/server"

/** Process liveness only; this is not a source, database or release readiness check. */
export function GET() {
  return NextResponse.json({ status: "ok", service: "web" }, {
    headers: { "Cache-Control": "no-store" },
  })
}
