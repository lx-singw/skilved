import { SuggestionUrlSchema, type SuggestionStatusResponse } from "@skilved/types/opportunities/suggestions"
import type { SuggestionEntry } from "./suggestion-access"

export function suggestionLinkFeedback(value:string) {
  if (!value.trim()) return {kind:"empty",title:"Start with the public notice",description:"Paste one clean HTTPS notice address. Only address format is checked here; nothing is sent while you type.",hostname:null}
  const parsed=SuggestionUrlSchema.safeParse(value)
  return parsed.success
    ? {kind:"format",title:"Address format checked",description:"This checks the format only. Whether the source is supported is checked when you submit; publication is not promised.",hostname:new URL(parsed.data).hostname}
    : {kind:"attention",title:"This link needs attention",description:"Use a public HTTPS notice address without a query, fragment, sign-in details or encoded characters. The address has not been changed.",hostname:null}
}
export function suggestionRetryIndex(value:string,items:SuggestionEntry[],now:string) {
  const parsed=SuggestionUrlSchema.safeParse(value)
  if (!parsed.success) return -1
  return items.findIndex(item=>item.kind!=="receipt"&&item.url===parsed.data&&(item.kind==="draft"||item.expiresAt>now))
}
const serverStates:Record<SuggestionStatusResponse["status"],{label:string;description:string}> = {
  received:{label:"Received for review",description:"The last response records this link for review. Publication and response time are not promised."},
  reviewing:{label:"Being reviewed",description:"The last response reports a review in progress. No public result or application outcome is confirmed."},
  resolved_to_listing:{label:"Public result references available",description:"Open the public references to inspect their current details and application instructions."},
  unresolved:{label:"No result confirmed",description:"The last response did not confirm a public result. Review may remain unresolved."},
  unsupported:{label:"Unsupported link",description:"The last response reports that this link is not supported by this review flow."},
  paused:{label:"Review paused",description:"The last response reports a pause. A restart time is not promised."},
  withdrawn:{label:"Withdrawn",description:"The last response records a withdrawn suggestion. This does not remove public facts or other people's suggestions."},
}
/** Display-only fields. URLs, local IDs, tickets and receipt capabilities never enter this view. */
export function suggestionReceiptView(item:SuggestionEntry,status:SuggestionStatusResponse|undefined,now:string) {
  const expiresAt=item.kind==="draft"?null:item.kind==="receipt"?item.access.expiresAt:item.expiresAt
  const expired=expiresAt!==null&&expiresAt<=now
  const title=expired?(item.kind==="receipt"?"Receipt access expired":"Retry expired"):item.kind==="draft"?"Not submitted":item.kind==="pending"?item.sentAt?"Submission response unconfirmed":"Send attempt not recorded":"Private access saved"
  const description=expired?"Access or retry expired. Keep or forget this local reference."
    :item.kind==="draft"?"No suggestion was submitted from this entry. Use Retry this entry when available."
    :item.kind==="pending"?item.sentAt?"The submission response was not confirmed. Use Retry this entry to recover the same attempt; do not submit the link again to recover it.":"A local retry entry was saved, but no send attempt is recorded. Use Retry this entry to continue with the access already kept here."
    :"Private access is saved in this browser. Choose Refresh status to check the review."
  return {expired,title,description,localLabel:item.kind==="receipt"?"Access saved in this browser":"Entry saved in this browser",localTime:item.kind==="receipt"?item.savedAt:item.createdAt,expiresAt,expiresLabel:item.kind==="receipt"?"Private access expires":"Retry expires",server:status?{...serverStates[status.status],updatedAt:status.updatedAt,publicResultIds:status.publicResultIds}:null}
}
