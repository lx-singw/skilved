import { CompletionBar } from "@/components/profile/CompletionBar"
import { computeCompletion } from "@/lib/profile-completion"
import type { UserProfile } from "@/types/user"

interface ProfileCompletionProps {
  profile: UserProfile
  /** Owner-only: show the missing-field hints. */
  showHints?: boolean
}

export function ProfileCompletion({ profile, showHints = false }: ProfileCompletionProps) {
  const result = computeCompletion(profile)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Profile strength</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {result.points}/{result.maxPoints} pts
        </span>
      </div>
      <CompletionBar result={result} showHints={showHints} />
    </div>
  )
}
