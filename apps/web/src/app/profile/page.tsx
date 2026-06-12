import { redirect } from "next/navigation"
import { DEMO_USERNAME } from "@/lib/profiles"

/**
 * /profile — owner landing.
 * In Sprint 1 we redirect straight to the demo user's profile.
 * Once auth is wired this becomes a server component that reads the session
 * and redirects to /profile/[session.username].
 */
export default function ProfileIndexPage() {
  redirect(`/profile/${DEMO_USERNAME}`)
}
