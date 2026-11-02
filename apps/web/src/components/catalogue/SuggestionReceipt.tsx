import Link from "next/link"
import { ArrowUpRight, Ticket } from "lucide-react"
import type { SuggestionStatusResponse } from "@skilved/types/opportunities/suggestions"
import type { SuggestionEntry } from "@/lib/suggestion-access"
import { suggestionReceiptView } from "@/lib/suggestion-presentation"

export type ReceiptAction = "status"|"retry"|"withdraw"|"forget"
function ReceiptTime({value}:{value:string}) {
  return <time dateTime={value}>{new Date(value).toLocaleString("en-ZA",{dateStyle:"long",timeStyle:"short"})}</time>
}
export function SuggestionReceipt({item,index,status,now,ready,enabled,intakeEnabled,onAction}:{item:SuggestionEntry;index:number;status?:SuggestionStatusResponse;now:string;ready:boolean;enabled:boolean;intakeEnabled:boolean;onAction:(action:ReceiptAction)=>void}) {
  const view=suggestionReceiptView(item,status,now)
  return <article aria-label={`Receipt ${index+1}`} className={`suggestion-receipt ${view.expired?"receipt-expired":item.kind!=="receipt"?"receipt-unconfirmed":""}`}>
    <header><span className="receipt-number" aria-hidden>{String(index+1).padStart(2,"0")}</span><div><p className="mini-label">{item.kind==="receipt"?"Private receipt":"Local retry entry"}</p><h3>Receipt {index+1}</h3></div><Ticket size={23} aria-hidden/></header>
    <div className="receipt-body"><h4>{view.title}</h4><p>{view.description}</p>
      <dl className="receipt-dates"><div><dt>{view.localLabel}</dt><dd><ReceiptTime value={view.localTime}/></dd></div>{view.expiresAt&&<div><dt>{view.expiresLabel}</dt><dd><ReceiptTime value={view.expiresAt}/></dd></div>}</dl>
      {view.server&&<section className="receipt-server-response" aria-label={`Last checked response for receipt ${index+1}`}><p className="mini-label">Last checked response</p><h4>{view.server.label}</h4><p>{view.server.description}</p><p>Last checked response reflects server updates through <ReceiptTime value={view.server.updatedAt}/>. It does not confirm an application.</p>
        {view.server.publicResultIds.map((id,i)=><Link key={id} href={`/opportunities/${id}`}>Review public result {i+1}<ArrowUpRight size={14} aria-hidden/></Link>)}
      </section>}
    </div>
    <footer className="receipt-actions">{item.kind==="receipt"?<><button type="button" disabled={!ready||!enabled||view.expired} onClick={()=>onAction("status")}>Refresh status</button><button type="button" disabled={!ready||!enabled||view.expired} onClick={()=>onAction("withdraw")}>Withdraw suggestion</button></>:<button type="button" disabled={!ready||!enabled||!intakeEnabled||view.expired} onClick={()=>onAction("retry")}>Retry this entry</button>}
      <button type="button" disabled={!ready} onClick={()=>onAction("forget")}>Forget local access</button>
    </footer>
  </article>
}
