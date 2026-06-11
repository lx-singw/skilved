export type OpportunityTypeId =
  | "apprenticeship"
  | "learnership"
  | "bursary"
  | "job"
  | "trade-test"
  | "short-course"

export interface OpportunityType {
  id: OpportunityTypeId
  label: string
}

/** The 6 defined opportunity types. */
export const OPPORTUNITY_TYPES: OpportunityType[] = [
  { id: "apprenticeship", label: "Apprenticeship" },
  { id: "learnership", label: "Learnership" },
  { id: "bursary", label: "Bursary" },
  { id: "job", label: "Job" },
  { id: "trade-test", label: "Trade test" },
  { id: "short-course", label: "Short course" },
]

export const OPPORTUNITY_TYPE_MAP: Record<OpportunityTypeId, OpportunityType> =
  OPPORTUNITY_TYPES.reduce(
    (acc, t) => {
      acc[t.id] = t
      return acc
    },
    {} as Record<OpportunityTypeId, OpportunityType>,
  )

export function getOpportunityType(id: OpportunityTypeId): OpportunityType {
  return OPPORTUNITY_TYPE_MAP[id]
}
