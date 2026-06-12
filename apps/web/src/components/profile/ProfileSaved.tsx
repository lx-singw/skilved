import { Bookmark } from "lucide-react"

export function ProfileSaved() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4">
      <Bookmark className="h-5 w-5 flex-none text-muted-foreground/50" aria-hidden />
      <p className="text-sm text-muted-foreground">
        Saved opportunities will appear here once you sign in.
      </p>
    </div>
  )
}
