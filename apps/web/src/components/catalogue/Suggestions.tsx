"use client"
import Link from "next/link"
import { Fragment, useState } from "react"
import { ArrowUpRight, ClipboardList, HardDrive, Link2, Send, Ticket } from "lucide-react"
import { useSuggestions } from "@/lib/use-suggestions"
import { suggestionLinkFeedback, suggestionRetryIndex } from "@/lib/suggestion-presentation"
import { SuggestionReceipt } from "./SuggestionReceipt"

type Confirmation = { type:"clear"|"forget"|"withdraw";id?:string;token:string|null }|null
export function Suggestions({enabled,intakeEnabled}:{enabled:boolean;intakeEnabled:boolean}) {
  const session=useSuggestions(),[url,setUrl]=useState(""),[confirm,setConfirm]=useState<Confirmation>(null)
  const snapshot=session.view&&"snapshot" in session.view?session.view.snapshot:null
  const token=snapshot?.token??null,ready=!!snapshot&&!session.busy
  const readable=session.view?.status==="ready"||session.view?.status==="saved"
  const now=new Date().toISOString(),feedback=suggestionLinkFeedback(url),retryIndex=suggestionRetryIndex(url,snapshot?.items??[],now)
  const canSubmit=ready&&enabled&&intakeEnabled&&feedback.kind==="format"&&retryIndex<0
  async function submit(event:React.FormEvent) {
    event.preventDefault()
    if(!canSubmit)return
    const submitted=url,completed=await session.action({type:"submit",url:submitted},token)
    if(completed)setUrl(current=>current===submitted?"":current)
  }
  function confirmation() {
    return confirm&&<section role="alert" className="suggestion-confirmation">
      <p className="mini-label">{confirm.type==="withdraw"?"Server request":"Browser-local access"}</p>
      <h2>{confirm.type==="withdraw"?"Withdraw this suggestion?":"Discard private local access?"}</h2>
      <p>{confirm.type==="withdraw"?"This asks the server to revoke your receipt and stop its participation in review. Other people’s suggestions and public facts remain. Success requires server acknowledgement.":"This cannot be undone in this browser. You may lose the ability to check or withdraw this suggestion. It sends no withdrawal request and does not clear saved opportunity progress."}</p>
      <div><button type="button" className="suggestion-button" disabled={session.busy} onClick={()=>{const action=confirm;setConfirm(null);void session.action(action.type==="clear"?{type:"clear"}:{type:action.type,id:action.id!},action.token)}}>{confirm.type==="withdraw"?"Confirm server withdrawal":"Confirm local discard"}</button>
      <button type="button" className="suggestion-button" disabled={session.busy} onClick={()=>setConfirm(null)}>Keep access</button></div>
    </section>
  }
  return <div className="suggestions-root">
    <div className="suggestion-local-note"><HardDrive size={17} aria-hidden/><div><p>Private receipt access stays in this browser. No account backup or cross-device sync.</p><details><summary>What to keep in mind</summary><p>People using this browser may see it. Clearing browser data can permanently lose access; the public link cannot recover it.</p></details></div>{!!snapshot?.items.length&&<a href="#private-receipts-heading">Open your receipt entries<ArrowUpRight size={14} aria-hidden/></a>}</div>
    {!enabled?<p role="note" className="suggestion-service-note">Suggestions are currently unavailable. You can still forget access stored in this browser.</p>:!intakeEnabled&&<p role="note" className="suggestion-service-note">New suggestions and retries are paused. Existing receipt status and withdrawal can still be checked.</p>}
    <div className="suggestion-desk">
      <form onSubmit={submit} aria-label="Suggest a link" className="suggestion-form">
        <header><p className="mini-label">01 / Pass a possibility forward</p><Link2 size={23} aria-hidden/></header>
        <h2 id="suggest-heading">Suggest a public opportunity link</h2>
        <p>Share one supported public notice link for review. Do not send contact details, documents, login links or application answers. A suggestion is not an application, proof of eligibility or a promise of publication or response time.</p>
        <label htmlFor="suggestion-url">Public HTTPS notice link</label>
        <input id="suggestion-url" type="url" required maxLength={2048} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="https://issuer.example/opportunities/notice" value={url} onChange={event=>setUrl(event.target.value)} disabled={!ready||!enabled||!intakeEnabled} aria-invalid={feedback.kind==="attention"} aria-describedby="suggestion-url-help suggestion-link-state"/>
        <p id="suggestion-url-help">Use a clean public notice link without query parameters or a fragment. Some valid links are not yet supported. We do not fetch arbitrary sites or submit applications.</p>
        <div id="suggestion-link-state" className={`suggestion-link-state feedback-${feedback.kind}`}><strong>{feedback.title}</strong>{feedback.hostname&&<span className="suggestion-hostname">{feedback.hostname}</span>}<p>{feedback.description}</p></div>
        {retryIndex>=0&&<p className="suggestion-retry-hint">There is already a local entry for this address. Use “Retry this entry” on receipt {retryIndex+1} below; a new submission would be separate. <a href="#private-receipts-heading">Go to local entries<ArrowUpRight size={13} aria-hidden/></a></p>}
        <button type="submit" className="suggestion-button suggestion-submit" disabled={!canSubmit}>Suggest link for review<Send size={16} aria-hidden/></button>
      </form>
      <aside className="suggestion-reading-guide" aria-labelledby="suggestion-guide-heading"><p className="mini-label">A link. A way back.</p><h2 id="suggestion-guide-heading">What happens next</h2><ol>
        <li><span aria-hidden>01</span><div><h3>Share the public notice</h3><p>The notice address goes to the review flow when you choose to send it.</p></div></li>
        <li><span aria-hidden>02</span><div><h3>Keep your access here</h3><p>Private access is shown as confirmed saved only once it has been stored in this browser.</p></div></li>
        <li><span aria-hidden>03</span><div><h3>Check when you choose</h3><p>Use Refresh status on a receipt. Review can remain unresolved; a result or response time is not guaranteed.</p></div></li>
      </ol><Link href="/">Explore the current feed<ArrowUpRight size={14} aria-hidden/></Link></aside>
    </div>
    <p role="status" aria-live="polite" className="suggestion-session-message">{session.busy?"Checking this request. Receipt access is confirmed only after it is saved in this browser…":session.message}</p>
    {session.publicIds.length>0&&<section className="suggestion-public-results"><ClipboardList size={22} aria-hidden/><div><h2>Review current public results</h2><p>Open each reference for its current notice and application instructions.</p>{session.publicIds.map((id,index)=><Link key={id} href={`/opportunities/${id}`}>Public result {index+1}<ArrowUpRight size={14} aria-hidden/></Link>)}</div></section>}
    <section className="suggestion-receipts" aria-labelledby="private-receipts-heading">
      <header><div><p className="mini-label">Your review references</p><h2 id="private-receipts-heading">Your private receipts in this browser</h2><p>Local entries and the responses you explicitly check. Times use this browser’s local timezone.</p></div><span className="receipt-count"><strong>{snapshot?String(snapshot.items.length).padStart(2,"0"):"—"}</strong><small>local entries</small></span></header>
      {!session.view?<p role="status" className="suggestion-receipt-notice">Loading private access…</p>:!readable?<div className="suggestion-receipt-notice"><p>{session.view.status==="unreadable"?"Stored access cannot be read. It has not been reset. Explicit receipt clear will discard it.":session.view.status==="conflict"?"Access changed in another action or tab. Reload and review before trying again.":"Browser storage is unavailable. We cannot confirm saved access."}</p><button type="button" className="suggestion-button" disabled={session.busy} onClick={()=>{void session.reload()}}>Reload receipts</button></div>
        :snapshot?.items.length===0?<div className="suggestion-empty"><Ticket size={30} strokeWidth={1.4} aria-hidden/><h3>No private receipts in this browser.</h3><p>Lost access cannot be recovered from a public link. Your saved review entries will appear here; confirmed receipt access is labelled separately.</p></div>
        :<div className="suggestion-receipt-list">{snapshot?.items.map((item,index)=><Fragment key={item.id}><SuggestionReceipt item={item} index={index} status={session.statuses[item.id]} now={now} ready={ready} enabled={enabled} intakeEnabled={intakeEnabled} onAction={async action=>{if(action==="forget"||action==="withdraw")setConfirm({type:action,id:item.id,token});else{const entered=url,completed=await session.action({type:action,id:item.id},token);if(action==="retry"&&index===retryIndex&&completed)setUrl(current=>current===entered?"":current)}}}/>{confirm?.type!=="clear"&&confirm?.id===item.id&&confirmation()}</Fragment>)}</div>}
      <footer className="suggestion-receipt-footer"><p>Forgetting or clearing local access does not withdraw a server suggestion, remove public facts or clear saved opportunity progress. Server access can expire, and review may remain unresolved.</p>{(readable&&!!snapshot?.items.length||session.view?.status==="unreadable")&&<button type="button" className="suggestion-button" disabled={session.busy} onClick={()=>setConfirm({type:"clear",token})}>Clear receipt access</button>}</footer>
    </section>
    {confirm?.type==="clear"&&confirmation()}
  </div>
}
