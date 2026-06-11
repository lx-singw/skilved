import { getProvince, type ProvinceId } from "@/constants/provinces"
import { cn } from "@/utils/classNames"

export function ProvincePill({
  province,
  className,
}: {
  province: ProvinceId
  className?: string
}) {
  const p = getProvince(province)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      {p.label}
    </span>
  )
}
