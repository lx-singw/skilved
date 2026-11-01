"use client"
import { Bookmark, Check } from "lucide-react"
import { useLocalProgress } from "@/lib/use-local-progress"

export function FeedSave({ id, revision }: { id: string; revision: number }) {
  const progress = useLocalProgress()
  const snapshot = progress.view && "snapshot" in progress.view ? progress.view.snapshot : null
  const saved = snapshot?.items.some(item => item.opportunityId === id) ?? false
  return <div className="feed-save">
    <button type="button" className="save-button" aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save in this browser"} disabled={!snapshot || progress.busy}
      onClick={() => { void progress.change(saved ? { type: "remove", id } : { type: "save", id, revision }) }}>
      {saved ? <Check size={17} aria-hidden /> : <Bookmark size={17} aria-hidden />}{saved ? "Saved" : "Save"}
    </button>
    {(progress.message || progress.view?.status === "unavailable" || progress.view?.status === "unreadable") && <p role="status" className="save-feedback">{progress.message || "Browser storage is unavailable. Open details for saved-progress options."}</p>}
  </div>
}
