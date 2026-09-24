import { NextResponse } from "next/server"

/** Fail closed without parsing applicant data or invoking unfinished services. */
export function unavailable() {
  return NextResponse.json(
    { error: "This feature is not available.", code: "FEATURE_UNAVAILABLE" },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  )
}
