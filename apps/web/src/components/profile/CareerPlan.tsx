import { getTrade } from "@/constants/trades"
import { CheckCircle2, Circle, Target } from "lucide-react"
import { cn } from "@/utils/classNames"
import type { CareerPlan as CareerPlanType } from "@/types/user"

interface CareerPlanProps {
  plan: CareerPlanType
}

const STEP_ICON: Record<CareerPlanType["steps"][number]["type"], string> = {
  qualification:  "Q",
  experience:     "E",
  "trade-test":   "T",
  certification:  "C",
}

export function CareerPlan({ plan }: CareerPlanProps) {
  const trade = getTrade(plan.goalTrade)
  const completedCount = plan.steps.filter((s) => s.completed).length
  const totalCount = plan.steps.length

  return (
    <div className="space-y-4">
      {/* Goal header */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
        <div
          className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md"
          style={{ backgroundColor: `${trade.color}18` }}
          aria-hidden
        >
          <Target className="h-4 w-4" style={{ color: trade.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{plan.goalTitle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {completedCount}/{totalCount} steps · est. {plan.estimatedMonths} months
          </p>
        </div>
      </div>

      {/* Steps */}
      <ol className="space-y-0" aria-label="Career plan steps">
        {plan.steps.map((step, idx) => {
          const isLast = idx === plan.steps.length - 1
          return (
            <li key={step.order} className="flex gap-3">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-6 w-6 flex-none items-center justify-center rounded-full text-[10px] font-bold",
                    step.completed
                      ? "bg-verified text-verified-foreground"
                      : "border-2 border-border bg-background text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    STEP_ICON[step.type]
                  )}
                </div>
                {!isLast && <div className="mt-1 w-px flex-1 bg-border" aria-hidden />}
              </div>

              {/* Label */}
              <div className={cn("min-w-0 flex-1", !isLast && "pb-5")}>
                <p
                  className={cn(
                    "pt-0.5 text-sm leading-snug",
                    step.completed
                      ? "text-muted-foreground line-through"
                      : "text-foreground",
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs capitalize text-muted-foreground/70">
                  {step.type.replace("-", " ")}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
