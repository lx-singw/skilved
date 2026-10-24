export type NativeShareOutcome = "handed_off" | "cancelled_or_unavailable" | "unavailable"
type ShareHost = { share?: (data: ShareData) => Promise<void>; canShare?: (data: ShareData) => boolean }

/** Text comes from the fresh public preparer, never document metadata or browser persistence. */
export async function sharePublicText(text: string, host: ShareHost = typeof navigator === "undefined" ? {} : navigator): Promise<NativeShareOutcome> {
  try {
    if (typeof host.share !== "function") return "unavailable"
    const data = { text }
    if (typeof host.canShare === "function" && !host.canShare(data)) return "unavailable"
    await host.share(data)
    // A resolved host promise does not establish recipient delivery.
    return "handed_off"
  } catch (error) {
    try { if (typeof error === "object" && error !== null && "name" in error && error.name === "AbortError") return "cancelled_or_unavailable" } catch { /* Host error properties can also be unavailable. */ }
    return "unavailable"
  }
}
