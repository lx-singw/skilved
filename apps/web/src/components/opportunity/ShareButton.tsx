"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"
import type { Opportunity } from "@/types/opportunity"
import { buildWhatsAppShareUrl } from "@/utils/whatsappMessage"
import { cn } from "@/utils/classNames"

export function ShareButton({
  opportunity,
  variant = "ghost",
  className,
}: {
  opportunity: Opportunity
  variant?: "ghost" | "outline"
  className?: string
}) {
  const [shared, setShared] = useState(false)

  function handleShare() {
    const url = buildWhatsAppShareUrl(opportunity)
    window.open(url, "_blank", "noopener,noreferrer")
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share on WhatsApp"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        variant === "outline"
          ? "border border-border text-foreground hover:bg-muted"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {shared ? (
        <Check className="h-4 w-4 text-verified" aria-hidden />
      ) : (
        <Share2 className="h-4 w-4" aria-hidden />
      )}
      Share
    </button>
  )
}
