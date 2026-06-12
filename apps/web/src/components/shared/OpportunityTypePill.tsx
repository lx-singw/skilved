import {
  getOpportunityType,
  type OpportunityTypeId,
} from "@/constants/opportunityTypes"
import { cn } from "@/utils/classNames"

export function OpportunityTypePill({
  type,
  className,
}: {
  type: OpportunityTypeId
  className?: string
}) {
  const t = getOpportunityType(type)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground",
        className,
      )}
    >
      {t.label}
    </span>
  )
}
