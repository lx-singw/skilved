import { NextResponse } from "next/server"
import { getProfileByUsername, updateProfile, DEMO_USERNAME } from "@/lib/profiles"

// In Sprint 1 all requests act as the demo user.
// When auth is wired, replace DEMO_USERNAME with session.user.username.

export async function GET() {
  const profile = getProfileByUsername(DEMO_USERNAME)
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }
  return NextResponse.json(profile)
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const updated = updateProfile(DEMO_USERNAME, body)
    if (!updated) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
