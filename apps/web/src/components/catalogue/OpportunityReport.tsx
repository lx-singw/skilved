"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { ArrowDownRight, CalendarDays, FileText, Flag, MessageSquare, Send } from "lucide-react"
import { reportIssues, reportKind, sendOpportunityReport, type ReportKind, type ReportResult } from "@/lib/report-client"
import { ReportResponse } from "./ReportResponse"

const icons={incorrect:FileText,closed:CalendarDays,unsafe_destination:Flag,other:MessageSquare}
export function OpportunityReport({id}:{id:string}) {
  return <IssueReport key={id} id={id}/>
}
function IssueReport({id}:{id:string}) {
  const [sending,setSending]=useState(false),[feedback,setFeedback]=useState<ReportResult|null>(null)
  const [kind,setKind]=useState<ReportKind|"">(""),[text,setText]=useState("")
  const requestState=useRef<{pending:boolean;alive:boolean;sequence:number;controller:AbortController|null}>({pending:false,alive:true,sequence:0,controller:null})
  const status=useRef<HTMLElement>(null),firstIssue=useRef<HTMLInputElement>(null),restarting=useRef(false)
  useEffect(()=>{const state=requestState.current;state.alive=true;return()=>{state.alive=false;state.sequence++;state.controller?.abort();state.pending=false}},[])
  useEffect(()=>{if(feedback)status.current?.focus();else if(restarting.current){restarting.current=false;firstIssue.current?.focus()}},[feedback])
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const state=requestState.current
    if(state.pending||!state.alive)return
    if(!reportKind(kind)||!text.trim()||text.trim().length>1500){setFeedback({kind:"invalid"});return}
    state.pending=true;setSending(true);setFeedback(null)
    const version=++state.sequence,request=new AbortController();state.controller=request
    try{
      const result=await sendOpportunityReport({opportunityId:id,kind,text},{signal:request.signal})
      if(!state.alive||state.sequence!==version)return
      if(result.kind==="received"){setText("");setKind("")}
      setFeedback(result)
    }finally{if(state.alive&&state.sequence===version){state.pending=false;setSending(false);state.controller=null}}
  }
  const prompt=kind?reportIssues[kind].prompt:"Choose the concern that best fits what you noticed."
  return <section className="opportunity-report" aria-labelledby="report-heading">
    <div className="report-introduction"><MessageSquare size={22} aria-hidden/><div><p className="mini-label">Help keep the notice useful</p><h2 id="report-heading">Something needs checking?</h2><p>Point out a problem with this opportunity for private review.</p></div></div>
    <details className="report-drawer"><summary><span>Report an issue with this opportunity<small>Details, intake, link or another concern</small></span><ArrowDownRight size={18} aria-hidden/></summary>
      <div className="report-workbench"><p id="report-privacy">Tell us about incorrect details, a closed intake, a suspicious link or a payment request. Do not include ID numbers, passwords, contact details or documents. Reports are reviewed privately.</p>
        {feedback&&<ReportResponse result={feedback} responseRef={status}/>}
        {feedback?.kind!=="received"?<form method="post" action="/api/v1/reports" onSubmit={submit} aria-label="Private opportunity report" aria-describedby="report-privacy" aria-busy={sending} autoComplete="off">
          <noscript><p>Enable JavaScript to send a report from this form.</p></noscript>
          <fieldset className="report-issue-options" disabled={sending}><legend>What needs checking?</legend>{Object.entries(reportIssues).map(([value,issue],index)=>{const Icon=icons[value as ReportKind];return <label key={value}><input ref={index===0?firstIssue:undefined} type="radio" name="kind" value={value} required checked={kind===value} aria-label={issue.label} aria-describedby="report-kind-help" onChange={()=>setKind(value as ReportKind)}/><Icon size={17} aria-hidden/><span><strong>{issue.label}</strong><small>{issue.detail}</small></span></label>})}</fieldset>
          <div className="report-kind-guidance"><p className="mini-label">For this concern</p><p id="report-kind-help">{prompt}</p></div>
          <div className="report-description"><label htmlFor="report-text">Brief description</label><textarea id="report-text" name="text" required maxLength={1500} rows={5} value={text} onChange={event=>setText(event.target.value)} disabled={sending} aria-describedby="report-length report-draft-note"/><div className="report-description-meta"><p id="report-length">Up to 1,500 characters. No personal details or attachments.</p><output htmlFor="report-text" aria-live="off">{text.length} / 1,500</output></div><p id="report-draft-note">Your draft stays only on this page. Leaving or reloading can lose it.</p></div>
          <button type="submit" className="report-send" disabled={sending}>{sending?"Sending report…":"Send report"}<Send size={16} aria-hidden/></button>
        </form>:<div className="report-received-actions"><a href="#evidence">Return to the evidence<ArrowDownRight size={14} aria-hidden/></a><button type="button" onClick={()=>{restarting.current=true;setFeedback(null)}}>Start a different report</button></div>}
      </div>
    </details>
  </section>
}
