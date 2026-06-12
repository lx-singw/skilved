export type QualificationId =
  | "grade-10"
  | "grade-11"
  | "grade-12"
  | "n2"
  | "n3"
  | "n4"
  | "n5"
  | "n6"
  | "nqf3"
  | "nqf4"
  | "nqf5"
  | "diploma"
  | "degree"
  | "trade-test"

export interface Qualification {
  id: QualificationId
  label: string
  nqfLevel?: number
}

export const QUALIFICATIONS: Qualification[] = [
  { id: "grade-10", label: "Grade 10" },
  { id: "grade-11", label: "Grade 11" },
  { id: "grade-12", label: "Grade 12 / Matric", nqfLevel: 4 },
  { id: "n2", label: "N2 Certificate", nqfLevel: 2 },
  { id: "n3", label: "N3 Certificate", nqfLevel: 3 },
  { id: "n4", label: "N4 Certificate", nqfLevel: 4 },
  { id: "n5", label: "N5 Certificate", nqfLevel: 5 },
  { id: "n6", label: "N6 Certificate", nqfLevel: 6 },
  { id: "nqf3", label: "NQF Level 3 Learnership", nqfLevel: 3 },
  { id: "nqf4", label: "NQF Level 4 Learnership", nqfLevel: 4 },
  { id: "nqf5", label: "NQF Level 5 Learnership", nqfLevel: 5 },
  { id: "diploma", label: "National Diploma", nqfLevel: 6 },
  { id: "degree", label: "Bachelor Degree", nqfLevel: 7 },
  { id: "trade-test", label: "Trade Test Certificate (Artisan)", nqfLevel: 4 },
]

export const QUALIFICATION_MAP: Record<QualificationId, Qualification> =
  QUALIFICATIONS.reduce(
    (acc, q) => {
      acc[q.id] = q
      return acc
    },
    {} as Record<QualificationId, Qualification>,
  )

export function getQualification(id: QualificationId): Qualification {
  return QUALIFICATION_MAP[id]
}
