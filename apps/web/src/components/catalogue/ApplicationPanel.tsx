import { ArrowDownRight, ArrowUpRight, Building2, FileText, Globe2, Mail, MapPin } from "lucide-react"
import type { PublicOpportunity } from "@skilved/types/opportunities"
import { ApplicationRouteLink } from "@/components/catalogue/SavedProgress"
import { FeedSave } from "./FeedSave"
import { ApplicationDate } from "./OpportunityOverview"
import { CopyApplicationDestination } from "./CopyApplicationDestination"

const methods = {
  portal: {title:"Continue on the application website",label:"Application website",icon:Globe2,step:"Complete the application on the website named in the notice.",help:"The link opens in a separate tab after the current listing is checked. You complete and submit the application there."},
  email: {title:"Apply by email",label:"Application email",icon:Mail,step:"Follow the notice’s email instructions, including any stated subject line and attachments.",help:"The checked route opens your email app. If an app does not open, copy the address and use your email service."},
  post: {title:"Send the application by post",label:"Postal destination",icon:Building2,step:"Follow the notice’s postal instructions. Check delivery timing and the exact destination.",help:"This notice uses a postal application. Copy the address if useful and confirm the delivery instructions in the source."},
  in_person: {title:"Apply in person",label:"Application location",icon:MapPin,step:"Check the notice’s visit times, delivery instructions and requested documents.",help:"This notice uses an in-person application. Check the source instructions before making travel arrangements."},
}
const levels = {required:"Required as stated",preferred:"Preferred as stated",unclear:"Condition needs clarification"}
export function ApplicationPanel({ opportunity:o }: { opportunity:PublicOpportunity }) {
  const route = o.lifecycle === "published" && o.application.state === "available" ? o.application.route : null
  const method = route ? methods[route.method] : null
  const Icon = method?.icon ?? FileText
  const documents = o.requirements.requirements.filter(r => r.kind === "document" || r.fact.state === "stated" && r.fact.value?.document)
  return <section className="application-panel application-handoff" aria-labelledby="application-heading">
    <p className="mini-label">When you’re ready</p><h2 id="application-heading">Application details</h2>
    <ApplicationDate opportunity={o} />
    <div className="handoff-route">
      <div className="handoff-method"><span><Icon size={19} aria-hidden /></span><h3>{method?.title ?? (o.lifecycle === "closed" ? "This intake is closed." : "Application route unavailable")}</h3></div>
      {route && method ? <>
        <dl className="handoff-destination"><dt>{method.label}</dt><dd>{route.method === "portal" ? <><strong>{new URL(route.destination).hostname}</strong><details><summary>See the full address<ArrowDownRight size={12} aria-hidden /></summary><p>{route.destination}</p></details></> : <p>{route.destination}</p>}</dd></dl>
        {route.method !== "portal" && <CopyApplicationDestination key={route.destination} destination={route.destination} />}
        {["portal","email"].includes(route.method) && <div className="handoff-action"><ApplicationRouteLink id={o.id} revision={o.revision} email={route.method === "email"} /></div>}
        <p className="handoff-method-help">{method.help}</p>
      </> : <p className="handoff-method-help">{o.lifecycle === "closed" ? "Your saved reference can stay in your workspace. Browse the feed for current notices." : "A current application destination is not available here. Check the original notice for guidance."}</p>}
    </div>
    <details className="handoff-documents"><summary><FileText size={15} aria-hidden /><span>{documents.length ? `${documents.length} document instruction${documents.length === 1 ? "" : "s"} in the notice` : "Documents: check the notice"}</span><ArrowDownRight size={15} aria-hidden /></summary>
      <div><p>Read these with the connected requirements. Documents can apply to a particular route or stage.</p>
        {documents.length ? <ul>{documents.map(document => <li key={document.id}><span className="handoff-document-level">{levels[document.level]}</span><p>{document.fact.originalText ?? "Document details are not stated; check the original notice."}</p>{document.fact.state !== "stated" && <small>{document.fact.state === "conflicting" ? "Sources disagree about this instruction." : document.fact.state === "ambiguous" ? "This instruction needs clarification." : "Details are not stated."}</small>}<a href={`#review-instruction-${document.id}`}>Read in the requirement route<ArrowDownRight size={12} aria-hidden /></a></li>)}</ul> : <p>Document requirements are not stated in this listing. Check the original notice before preparing attachments.</p>}
        <a href="#preparation">Review all connected requirements<ArrowDownRight size={13} aria-hidden /></a>
      </div>
    </details>
    {route && <details className="handoff-plan"><summary>Your next steps<ArrowDownRight size={15} aria-hidden /></summary><ol>
      <li><strong>Review the requirements.</strong><p>Follow the alternatives and conditions in the notice.</p><a href="#preparation">Return to preparation</a></li>
      <li><strong>Follow the stated method.</strong><p>{method?.step}</p></li>
      <li><strong>Keep your own record.</strong><p>After submitting, keep any receipt from the issuer. You can mark your stage yourself in Saved; opening a route does not mark an application as submitted.</p><a href="#your-workspace">Your personal workspace</a></li>
    </ol></details>}
    <div className="rail-save-action"><FeedSave id={o.id} revision={o.revision} href="" title={o.title.value ?? "this opportunity"} showRecord={false} /><a href="#your-workspace">Your personal workspace<ArrowUpRight size={13} aria-hidden /></a></div>
  </section>
}
