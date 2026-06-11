export type ProvinceId =
  | "gauteng"
  | "western-cape"
  | "kwazulu-natal"
  | "eastern-cape"
  | "free-state"
  | "limpopo"
  | "mpumalanga"
  | "north-west"
  | "northern-cape"

export interface Province {
  id: ProvinceId
  label: string
  abbr: string
}

/** The 9 South African provinces. */
export const PROVINCES: Province[] = [
  { id: "gauteng", label: "Gauteng", abbr: "GP" },
  { id: "western-cape", label: "Western Cape", abbr: "WC" },
  { id: "kwazulu-natal", label: "KwaZulu-Natal", abbr: "KZN" },
  { id: "eastern-cape", label: "Eastern Cape", abbr: "EC" },
  { id: "free-state", label: "Free State", abbr: "FS" },
  { id: "limpopo", label: "Limpopo", abbr: "LP" },
  { id: "mpumalanga", label: "Mpumalanga", abbr: "MP" },
  { id: "north-west", label: "North West", abbr: "NW" },
  { id: "northern-cape", label: "Northern Cape", abbr: "NC" },
]

export const PROVINCE_MAP: Record<ProvinceId, Province> = PROVINCES.reduce(
  (acc, p) => {
    acc[p.id] = p
    return acc
  },
  {} as Record<ProvinceId, Province>,
)

export function getProvince(id: ProvinceId): Province {
  return PROVINCE_MAP[id]
}
