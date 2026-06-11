import { SearchX } from "lucide-react"

export function EmptyState({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <SearchX className="mb-4 h-10 w-10 text-muted-foreground" aria-hidden />
      <h3 className="text-lg font-semibold text-foreground text-balance">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
        {message}
      </p>
    </div>
  )
}
