import { CircleHelp, Inbox } from "lucide-react"
import type { Ref } from "react"
import { reportResults, type ReportResult } from "@/lib/report-client"

export function ReportResponse({result,responseRef}:{result:ReportResult;responseRef?:Ref<HTMLElement>}) {
  const copy=reportResults[result.kind],received=result.kind==="received",Icon=received?Inbox:CircleHelp
  return <section ref={responseRef} tabIndex={-1} role={received?"status":"alert"} className={`report-response response-${result.kind}`}>
    <div className="report-response-heading"><Icon size={23} aria-hidden/><div><p className="mini-label">{received?"Receipt confirmation":"Your report draft"}</p><h3>{copy.title}</h3></div></div>
    <p>{copy.message}</p>
    {received&&<><dl className="report-receipt-facts"><div><dt>Confirmation</dt><dd>Received by the private review queue</dd></div><div><dt>Review outcome</dt><dd>Not established by this receipt</dd></div></dl><p>Reporting does not submit an application or change your saved progress. A response time or individual reply is not promised.</p><p>This confirmation does not include a progress-tracking link.</p></>}
  </section>
}
