import type { OpportunitySalary } from "@/types/opportunity"
import { formatSalary } from "@/utils/formatting"
import { cn } from "@/utils/classNames"

export function SalaryDisplay({
  salary,
  className,
}: {
  salary: OpportunitySalary
  className?: string
}) {
  return (
    <p className={cn("text-base font-semibold text-verified", className)}>
      {formatSalary(salary)}
    </p>
  )
}
