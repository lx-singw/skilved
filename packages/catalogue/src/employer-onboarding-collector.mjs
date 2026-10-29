import robotsParser from 'robots-parser';
import {retrieve} from './fetch.mjs';
import {DomainError} from './config.mjs';
import {originalRetrievalFailure} from './original-notice-resolver.mjs';
import {OnboardingPlan,ONBOARDING_VERSION,OnboardingBundle,OnboardingObservations} from './employer-onboarding.mjs';

/** Read-only public evidence collection. Candidate URLs are data, not authority.
 * At most three pages and two robots files, no redirect expansion or AI calls.
 */
export async function collectEmployerOnboarding(input,{fetcher=retrieve,now=()=>new Date().toISOString(),sleep=ms=>new Promise(r=>setTimeout(r,ms)),reuse=[]}={}){
 const plan=OnboardingPlan.parse(input),requests=[],robots=new Map(),observations=[];let nextAt=0;
 const permitted=new Set([plan.identityUrl,plan.corporateUrl,plan.careersUrl]),saved=OnboardingObservations.parse(reuse);
 if(saved.some(o=>!permitted.has(o.url)||o.at>now()||Date.parse(now())-Date.parse(o.at)>86400000))throw new DomainError('ONBOARDING_REUSE_INVALID');
 const get=async(url,format)=>{
  if(requests.length>=5)throw new DomainError('ONBOARDING_REQUEST_LIMIT');
  await sleep(Math.max(0,nextAt-Date.parse(now())));nextAt=Date.parse(now())+3000;
  const entry={url,format,at:now()};requests.push(entry);
  const response=await fetcher({urls:[url],maxBytes:500000,paused:false},url,undefined,format);
  if(response.url!==url||typeof response.text!=='string'||Buffer.byteLength(response.text)>500000)throw new DomainError('UNSAFE_RESPONSE');
  return response;
 };
 for(const url of [plan.identityUrl,plan.corporateUrl,plan.careersUrl]){
  const previous=saved.find(o=>o.url===url);if(previous){observations.push(previous);continue;}
  try{
   const origin=new URL(url).origin,robotUrl=new URL('/robots.txt',origin).href;
   if(!robots.has(origin)){
    try{const response=await get(robotUrl,'text');robots.set(origin,{policy:robotsParser(robotUrl,response.text)});}
    catch(error){robots.set(origin,{error});}
   }
   const r=robots.get(origin);if(r.error)throw r.error;
   if(r.policy.isAllowed(url,'SkilvedSourceReview/1.0')!==true)throw new DomainError('ROBOTS_DISALLOWED');
   if((r.policy.getCrawlDelay('SkilvedSourceReview/1.0')??0)*1000>3000)throw new DomainError('ROBOTS_DELAY_EXCEEDS_POLICY');
   const response=await get(url,'html'),o={url,at:now(),html:response.text};
   if(Buffer.byteLength(JSON.stringify(o))>900000)throw new DomainError('BODY_TOO_LARGE');observations.push(o);
  }catch(error){if(!originalRetrievalFailure(error)&&error.code!=='ONBOARDING_REQUEST_LIMIT')throw error;
   observations.push({url,at:now(),error:error.code});}
 }
 return{bundle:OnboardingBundle.parse({version:ONBOARDING_VERSION,plan,observations}),requests,providerCalls:0,authorityCreated:false};
}
