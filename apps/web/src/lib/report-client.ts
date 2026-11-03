import { IdSchema } from "@skilved/types/opportunities"

export const reportIssues = {
  incorrect:{label:"Incorrect or unclear information",detail:"A detail differs or needs clarification",prompt:"Which detail should be checked, and what did you notice in the notice?"},
  closed:{label:"The intake appears closed",detail:"The notice may no longer be open",prompt:"Where did you see that the intake may have closed? An inaccessible website alone does not establish closure."},
  unsafe_destination:{label:"Suspicious link or payment request",detail:"An address or request concerns you",prompt:"Describe the concern using information you already have. Keep passwords, payment details and personal information out of the report."},
  other:{label:"Another issue",detail:"Something else about this notice",prompt:"What should be checked about this opportunity? Keep the description focused on the notice."},
} as const
export type ReportKind = keyof typeof reportIssues
export type ReportResult = {kind:"received"|"invalid"|"limited"|"unavailable"|"unconfirmed"}
export const reportResults = {
  received:{title:"Report received",message:"It has been added to the review queue. This confirms receipt, not that the issue has been verified or resolved."},
  invalid:{title:"Check the report details",message:"Choose an issue and add a short description, up to 1,500 characters. Your description stays here so you can review it."},
  limited:{title:"Reporting is busy right now",message:"Please try again later. Your description stays here. No automatic retry will be made."},
  unavailable:{title:"Reporting is temporarily unavailable",message:"Receipt was not confirmed; an earlier report may already have arrived. Your description stays here for a manual retry."},
  unconfirmed:{title:"Receipt not confirmed",message:"We couldn’t confirm receipt. You can retry, but an earlier report may already have arrived. Keep your description here until you are ready."},
} as const
export function reportKind(value:unknown): value is ReportKind {
  return typeof value==="string"&&Object.hasOwn(reportIssues,value)
}

/** One explicit POST. No retries or personal-progress fields; uncertain responses are never acknowledgements. */
export async function sendOpportunityReport(input:{opportunityId:string;kind:string;text:string},options:{fetch?:typeof fetch;signal?:AbortSignal;timeoutMs?:number}={}):Promise<ReportResult> {
  const text=input.text.trim(),timeoutMs=options.timeoutMs??10000
  if(!IdSchema.safeParse(input.opportunityId).success||!reportKind(input.kind)||!text||text.length>1500)return{kind:"invalid"}
  if(options.signal?.aborted||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>10000)return{kind:"unconfirmed"}
  const controller=new AbortController(),abort=()=>controller.abort()
  options.signal?.addEventListener("abort",abort,{once:true})
  const stopped=new Promise<ReportResult>(resolve=>controller.signal.addEventListener("abort",()=>resolve({kind:"unconfirmed"}),{once:true}))
  const timer=setTimeout(abort,timeoutMs)
  const fetcher=options.fetch??globalThis.fetch
  async function request():Promise<ReportResult> {
    let reader:ReadableStreamDefaultReader<Uint8Array>|undefined
    try{
      const response=await fetcher("/api/v1/reports",{method:"POST",credentials:"omit",cache:"no-store",mode:"same-origin",redirect:"error",referrerPolicy:"no-referrer",headers:{"Content-Type":"application/json"},body:JSON.stringify({opportunityId:input.opportunityId,kind:input.kind,text}),signal:controller.signal})
      if(controller.signal.aborted){void response.body?.cancel().catch(()=>{});return{kind:"unconfirmed"}}
      if(response.redirected||response.type==="opaqueredirect"){void response.body?.cancel().catch(()=>{});return{kind:"unconfirmed"}}
      if(response.status!==202){void response.body?.cancel().catch(()=>{});return{kind:response.status===429?"limited":response.status===400||response.status===413?"invalid":"unavailable"}}
      if(!/^application\/json(?:;|$)/i.test(response.headers.get("content-type")??"")||!response.body||Number(response.headers.get("content-length")??0)>2048){void response.body?.cancel().catch(()=>{});return{kind:"unconfirmed"}}
      reader=response.body.getReader()
      controller.signal.addEventListener("abort",()=>{void reader?.cancel().catch(()=>{})},{once:true})
      const chunks:Uint8Array[]=[];let size=0
      while(true){
        const next=await reader.read()
        if(controller.signal.aborted)return{kind:"unconfirmed"}
        if(next.done)break
        size+=next.value.byteLength;if(size>2048)return{kind:"unconfirmed"}
        chunks.push(next.value)
      }
      const data=new Uint8Array(size);let offset=0
      for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength}
      const body:unknown=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(data))
      return body!==null&&typeof body==="object"&&!Array.isArray(body)&&Object.keys(body).length===1&&"status" in body&&body.status==="received"?{kind:"received"}:{kind:"unconfirmed"}
    }catch{return{kind:"unconfirmed"}}
    finally{void reader?.cancel().catch(()=>{});try{reader?.releaseLock()}catch{/* Cancellation may still be settling. */}}
  }
  try{return await Promise.race([request(),stopped])}
  finally{controller.abort();clearTimeout(timer);options.signal?.removeEventListener("abort",abort)}
}
