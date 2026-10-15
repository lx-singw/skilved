"use client"

import { useState } from "react"
import { formatRequirements, type PublicOpportunity } from "@skilved/types/opportunities"

type Requirements = PublicOpportunity["requirements"]

// The keyed child discards transient ticks when the reviewed instructions change.
export function PreparationChecklist({ id, revision, requirements }: { id: string; revision: number; requirements: Requirements }) {
  return <Checklist key={`${id}:${revision}:${requirements.id}:${requirements.revision}`} requirements={requirements} />
}

function Checklist({ requirements }: { requirements: Requirements }) {
  const [reviewed, setReviewed] = useState<Set<string>>(() => new Set())
  const labels = { required: "Required as stated", preferred: "Preferred as stated", unclear: "Condition or strength needs confirmation" }
  return <section className="mt-8 rounded-xl border border-border bg-card p-6" aria-labelledby="preparation-heading">
    <h2 id="preparation-heading" className="text-xl font-semibold">Requirements and preparation checklist</h2>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Tick an instruction when you have reviewed what it asks for. Follow the alternatives and conditions below; you may not need every alternative.</p>
    <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed">{formatRequirements(requirements)}</p>
    <p id="preparation-limits" className="mt-4 text-sm leading-relaxed text-muted-foreground">Ticks stay only while this page is open. They are not saved or sent with a report, and they do not confirm that you qualify or have applied.</p>
    {requirements.requirements.length ? <ul className="mt-5 space-y-3" aria-describedby="preparation-limits">
      {requirements.requirements.map(item => <li key={item.id}>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-border p-3">
          <input type="checkbox" checked={reviewed.has(item.id)} className="mt-1 h-5 w-5 shrink-0 accent-primary"
            onChange={event => setReviewed(previous => { const next = new Set(previous); if (event.target.checked) next.add(item.id); else next.delete(item.id); return next })} />
          <span className="min-w-0 break-words text-sm leading-relaxed"><span className="block font-medium">{labels[item.level]}</span>
            {item.fact.originalText ?? "Instruction not stated; confirm with the issuer"}
            {item.fact.state !== "stated" && <span className="mt-1 block text-muted-foreground">Details need confirmation ({item.fact.state.replaceAll("_", " ")}).</span>}
          </span>
        </label>
      </li>)}
    </ul> : <p className="mt-4 text-sm text-muted-foreground">No individual preparation instructions are stated. Read the original notice or ask the issuer for clarification.</p>}
    {reviewed.size > 0 && <button type="button" onClick={() => setReviewed(new Set())} className="mt-4 min-h-11 rounded-md border border-border px-4 py-2 text-sm font-medium">Clear these ticks</button>}
  </section>
}
