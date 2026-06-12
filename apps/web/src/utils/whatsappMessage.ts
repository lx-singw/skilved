import type { Opportunity } from "@/types/opportunity"
import { getProvince } from "@/constants/provinces"
import { formatSalary, formatDate } from "@/utils/formatting"

const SITE_URL = "https://skilved.com"

/**
 * Build the pre-filled WhatsApp share message for an opportunity,
 * following the brand voice in the Feed Development Plan.
 */
export function buildWhatsAppMessage(o: Opportunity): string {
  const province = getProvince(o.province).label
  const url = `${SITE_URL}/opportunity/${o.slug}?utm_source=whatsapp&utm_medium=share`

  return [
    "Found this on Skilved:",
    "",
    `*${o.title} — ${o.organisation}*`,
    `${o.city}, ${province}`,
    formatSalary(o.salary),
    `Closes ${formatDate(o.closesAt)}`,
    "",
    `Full details + apply: ${url}`,
    "",
    "Get matched to more: skilved.com",
  ].join("\n")
}

/** Return a wa.me link that opens WhatsApp with the message pre-filled. */
export function buildWhatsAppShareUrl(o: Opportunity): string {
  return `https://wa.me/?text=${encodeURIComponent(buildWhatsAppMessage(o))}`
}
