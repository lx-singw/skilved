"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"
import { cn } from "@/utils/classNames"

interface ShareProfileButtonProps {
  username: string
  className?: string
}

export function ShareProfileButton({ username, className }: ShareProfileButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/profile/${username}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `${username} on Skilved`, url })
      } catch {
        // user cancelled — no-op
      }
      return
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      aria-label="Share profile link"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-verified" aria-hidden />
          Copied
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5" aria-hidden />
          Share
        </>
      )}
    </button>
  )
}
