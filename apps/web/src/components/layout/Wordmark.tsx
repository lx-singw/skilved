import { cn } from "@/utils/classNames"

export function Wordmark({ size = "md", hideBadge = false, className }: { size?: "sm" | "md"; hideBadge?: boolean; className?: string }) {
  return <span className={cn("wordmark", size === "sm" && "wordmark-small", className)}>
    {!hideBadge && <span className="brand-mark" aria-hidden><span /><span /><span /></span>}
    <span>skilved<span className="wordmark-dot">.</span></span>
  </span>
}
