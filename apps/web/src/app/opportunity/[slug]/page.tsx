import { notFound } from "next/navigation"

// B03 must supply approved persistent records before this detail route is enabled.
// The previous renderer is preserved under prototype/b02-preserved.
export default function OpportunityDetailPage() {
  notFound()
}
