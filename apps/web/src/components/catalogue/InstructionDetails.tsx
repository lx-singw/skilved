import { ArrowDownRight, ArrowUpRight, BookOpen, FileText } from "lucide-react"
import type { PublicOpportunity } from "@skilved/types/opportunities"
import { completionLabels, exactFileLimit, preparationDetails } from "@/lib/preparation-details"
type Instruction=PublicOpportunity["requirements"]["requirements"][number]
export function InstructionDetails({item,index,citations}:{item:Instruction;index:number;citations:PublicOpportunity["citations"]}) {
  const details=preparationDetails(item,citations),q=details.qualification,d=details.document
  return <div className="instruction-inspection">
    <div className="instruction-metadata"><span>{details.kind}</span><span>{details.sources.length? `${details.sources.length} source reference${details.sources.length===1?"":"s"}`:"Source reference not available here"}</span></div>
    <details className="instruction-drawer"><summary aria-label={`Inspect instruction ${index+1}: details and sources`}><span><BookOpen size={14} aria-hidden/>Instruction details & sources</span><ArrowDownRight size={15} aria-hidden/></summary>
      <div className="instruction-dossier"><p className="mini-label">Instruction {String(index+1).padStart(2,"0")} / Read with its route</p>
        {!details.value?<p className="instruction-detail-limit">{item.fact.state==="conflicting"?"Sources disagree about this instruction.":item.fact.state==="ambiguous"?"The instruction needs clarification.":"Details are not stated in this entry."} Read the original wording and any available sources before relying on these details.</p>:<>
          {details.value.description!==item.fact.originalText&&<div className="instruction-recorded"><h3>Recorded description</h3><p>{details.value.description}</p></div>}
          {q&&<section className="instruction-qualification"><h3>Qualification details</h3><dl><div><dt>Designation in the notice</dt><dd>{q.designation}</dd></div><div><dt>Level stated</dt><dd>{q.level===null?"Not stated in this entry":q.level}</dd></div><div><dt>Completion recorded</dt><dd>{completionLabels[q.completion]}</dd></div></dl><h4>Subjects and thresholds</h4>{q.subjects.length?<ul className="instruction-subjects">{q.subjects.map((subject,i)=><li key={i}><span>{subject.name}</span><strong>{subject.minimumPercent===null?"Minimum not stated":`At least ${subject.minimumPercent}% as stated`}</strong></li>)}</ul>:<p className="instruction-detail-limit">No subject details are recorded in this entry. Read the original wording for any conditions.</p>}</section>}
          {d&&<section className="instruction-document"><h3><FileText size={15} aria-hidden/>Document details</h3><dl><div><dt>Document named</dt><dd>{d.kind}</dd></div><div><dt>Document stage in the notice</dt><dd>{d.stage??"Not stated in this entry"}</dd></div><div><dt>Certification wording</dt><dd>{d.certification??"Not stated in this entry"}</dd></div><div><dt>Format stated</dt><dd>{d.format??"Not stated in this entry"}</dd></div><div><dt>File size limit stated</dt><dd>{exactFileLimit(d.maxBytes)}</dd></div></dl></section>}
          {!q&&!d&&details.value.description===item.fact.originalText&&<p className="instruction-detail-limit">No additional qualification or document details are recorded in this entry. Read its original wording above.</p>}
        </>}
        <section className="instruction-sources"><h3>Sources for this instruction</h3>{details.sources.length?<ul>{details.sources.map(source=><li key={source.id}><a href={source.url} rel="noreferrer noopener">{source.label}<ArrowUpRight size={13} aria-hidden/></a></li>)}</ul>:<p className="instruction-detail-limit">No public source reference is available here for this instruction.</p>}</section>
        <footer><p>Read these details with the alternatives and conditions in the notice.</p><a href="#requirement-route-map">Return to the connected route<ArrowUpRight size={13} aria-hidden/></a></footer>
      </div>
    </details>
  </div>
}
