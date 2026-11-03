export const readingSections = [
  { id: "opportunity-story", number: "01", label: "The opportunity", detail: "Story & context" },
  { id: "preparation", number: "02", label: "Requirements", detail: "Routes & documents" },
  { id: "your-workspace", number: "03", label: "Your next move", detail: "Saved & public copy" },
  { id: "evidence", number: "04", label: "Evidence", detail: "Sources & check scopes" },
] as const
export type ReadingSection = typeof readingSections[number]["id"]

/** Position describes the reading surface only; it never marks a requirement or a notice reviewed. */
export function sectionInReadingArea(positions: { id: ReadingSection; top: number }[], top: number, bottom: number): ReadingSection | null {
  const ordered = [...positions].sort((a, b) => a.top - b.top)
  let current: ReadingSection | null = null, visible = 0
  for (const [index, section] of ordered.entries()) {
    const pixels = Math.min(bottom, ordered[index + 1]?.top ?? bottom) - Math.max(top, section.top)
    if (pixels > visible) { visible = pixels; current = section.id }
  }
  return current
}

export function observeReadingMap(nav: HTMLElement, publish: (section: ReadingSection | null) => void) {
  const root = nav.closest("main")
  if (!root) return () => {}
  let frame = 0, stopped = false, previous: ReadingSection | null | undefined
  const update = () => {
    frame = 0
    if (stopped) return
    const positions = readingSections.flatMap(section => {
      const target = root.querySelector<HTMLElement>(`#${section.id}`)
      return target ? [{ id: section.id, top: target.getBoundingClientRect().top }] : []
    })
    const top = Math.max(0, nav.getBoundingClientRect().bottom)
    const bottom = Math.min(window.innerHeight, root.getBoundingClientRect().bottom)
    const current = sectionInReadingArea(positions, top, bottom)
    if (current !== previous) { previous = current; publish(current) }
  }
  const schedule = () => { if (!stopped && !frame) frame = window.requestAnimationFrame(update) }
  window.addEventListener("scroll", schedule, { passive: true })
  window.addEventListener("resize", schedule)
  window.addEventListener("hashchange", schedule)
  window.addEventListener("pageshow", schedule)
  root.addEventListener("toggle", schedule, true)
  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule)
  observer?.observe(root); observer?.observe(nav)
  schedule()
  return () => {
    if (stopped) return
    stopped = true
    if (frame) window.cancelAnimationFrame(frame)
    observer?.disconnect()
    window.removeEventListener("scroll", schedule)
    window.removeEventListener("resize", schedule)
    window.removeEventListener("hashchange", schedule)
    window.removeEventListener("pageshow", schedule)
    root.removeEventListener("toggle", schedule, true)
  }
}
