"use client"

import { useState } from "react"
import { ArrowDown, Check, GitBranch } from "lucide-react"
import { formatRequirements, type PublicOpportunity } from "@skilved/types/opportunities"
import { InstructionDetails } from "./InstructionDetails"

type Requirements = PublicOpportunity["requirements"]
type Expression = Requirements["expression"]

// The keyed child discards transient ticks when the reviewed instructions change.
export function PreparationChecklist({ id, revision, requirements, citations = [] }: { id: string; revision: number; requirements: Requirements; citations?: PublicOpportunity["citations"] }) {
  return <Checklist key={`${id}:${revision}:${requirements.id}:${requirements.revision}`} requirements={requirements} citations={citations} />
}

function Route({ node, requirements }: { node: Expression; requirements: Requirements }) {
  function ref(id: string) {
    const index = requirements.requirements.findIndex(item => item.id === id)
    return <a className="route-ref" href={`#review-instruction-${id}`}><span>{String(index + 1).padStart(2, "0")}</span>Instruction {index + 1}<ArrowDown size={12} aria-hidden /></a>
  }
  if (node.op === "ref") return ref(node.id)
  if (node.op === "unknown") return <div className="route-unknown"><strong>Relationship needs confirmation</strong><p>{node.originalText}</p></div>
  if (node.op === "if") return <div className="requirement-branch"><strong>If this condition applies</strong>{ref(node.condition)}<p>Then follow</p><Route node={node.then} requirements={requirements} />{node.otherwise ? <><p>Otherwise follow</p><Route node={node.otherwise} requirements={requirements} /></> : <p>Other cases are not stated.</p>}</div>
  return <div className={`requirement-branch ${node.op === "any" ? "branch-any" : "branch-all"}`}><strong>{node.op === "any" ? "At least one of these routes" : "All of these together"}</strong><div className="route-children">{node.children.map((child, index) => <div key={index}>{index > 0 && <span className="route-join">{node.op === "any" ? "OR" : "AND"}</span>}<Route node={child} requirements={requirements} /></div>)}</div></div>
}

function Checklist({ requirements, citations }: { requirements: Requirements; citations: PublicOpportunity["citations"] }) {
  const [reviewed, setReviewed] = useState<Set<string>>(() => new Set())
  const labels = { required: "Required as stated", preferred: "Preferred as stated", unclear: "Condition or strength needs confirmation" }
  const total = requirements.requirements.length
  return <section className="preparation-workbench" aria-labelledby="preparation-heading">
    <div className="section-caption"><span>02 / Make sense of the requirements</span><GitBranch size={20} aria-hidden /></div>
    <h2 id="preparation-heading">Requirements and preparation checklist</h2>
    <p className="section-lede">Tick an instruction when you have reviewed what it asks for. Follow the alternatives and conditions below; you may not need every alternative.</p>
    <div className="requirement-map" id="requirement-route-map"><p className="mini-label">How the instructions fit together</p><Route node={requirements.expression} requirements={requirements} /></div>
    {total > 0 && <div className="review-meter"><div><span>Read at your own pace</span><strong aria-live="polite">{reviewed.size} of {total} reviewed</strong></div><progress aria-label="Instructions reviewed, not eligibility" value={reviewed.size} max={total} /></div>}
    <p id="preparation-limits" className="preparation-limits">Ticks stay only while this page is open. They are not saved or sent with a report, and they do not confirm that you qualify or have applied.</p>
    {total ? <ul className="instruction-list" aria-describedby="preparation-limits">
      {requirements.requirements.map((item, index) => <li key={item.id} id={`review-instruction-${item.id}`} className={reviewed.has(item.id) ? "is-reviewed" : ""}>
        <label><input type="checkbox" checked={reviewed.has(item.id)} onChange={event => setReviewed(previous => { const next = new Set(previous); if (event.target.checked) next.add(item.id); else next.delete(item.id); return next })} />
          <span className="instruction-number" aria-hidden>{reviewed.has(item.id) ? <Check size={16} /> : String(index + 1).padStart(2, "0")}</span>
          <span className="instruction-copy"><span className={`instruction-level level-${item.level}`}>{labels[item.level]}</span><span className="instruction-wording">{item.fact.originalText ?? "Instruction not stated; confirm with the issuer"}</span>
            {item.fact.state !== "stated" && <small>Details need confirmation ({item.fact.state.replaceAll("_", " ")}).</small>}
          </span>
        </label>
        <InstructionDetails item={item} index={index} citations={citations} />
      </li>)}
    </ul> : <p className="section-lede">No individual preparation instructions are stated. Read the original notice or ask the issuer for clarification.</p>}
    <details className="exact-instructions"><summary>Read the complete connected wording</summary><p>{formatRequirements(requirements)}</p></details>
    {reviewed.size > 0 && <button type="button" onClick={() => setReviewed(new Set())} className="clear-review">Clear these ticks</button>}
  </section>
}
