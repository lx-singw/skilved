"use client"

import { useEffect, useRef, useState } from "react"
import { readingSections, observeReadingMap, type ReadingSection } from "@/lib/reading-map"

export function OpportunityContents() {
  const nav = useRef<HTMLElement>(null)
  const [active, setActive] = useState<ReadingSection | null>(null)
  useEffect(() => nav.current ? observeReadingMap(nav.current, setActive) : undefined, [])
  const current = readingSections.find(section => section.id === active)
  return <nav ref={nav} className="opportunity-contents reading-map" aria-label="In this opportunity">
    <div className="reading-map-caption"><span>In this notice</span><span>{current ? `Reading / ${current.label}` : "Choose where to start"}</span></div>
    <ol>{readingSections.map(section => <li key={section.id}><a href={`#${section.id}`} aria-current={active === section.id ? "location" : undefined}>
      <span className="reading-map-number">{section.number}</span><span className="reading-map-label">{section.label}<small>{section.detail}</small></span><i aria-hidden />
    </a></li>)}</ol>
  </nav>
}
