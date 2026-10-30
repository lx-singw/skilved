import {isDeepStrictEqual} from 'node:util';

export const RMK_BINDING_VERSION='rmk_apply_action_v1';
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
function text(node){const parts=[],stack=[node];let count=0;while(stack.length){const n=stack.pop();if(++count>500)return null;
 if(['script','style','form','nav','ul','ol','template'].includes(n.tagName)||(n.attrs??[]).some(a=>a.name==='hidden'||a.name==='aria-hidden'&&a.value==='true'))continue;
 if(n.nodeName==='#text')parts.push(n.value);stack.push(...(n.childNodes??[]).slice().reverse());}const s=parts.join(' ').replace(/\s+/g,' ').trim();return s.length<=2000?s:null;}
function declaredApply(node){const label=text(node),aria=attr(node,'aria-label'),apply=/^apply(?: now)?[\s»›→]*$/i;
 if(label===null||!apply.test(aria??label)||label&&!apply.test(label))return false;
 const p=node.parentNode;if(!p)return false;
 const parts=p.tagName==='p'?[text(p)]:(p.childNodes??[]).filter(n=>n.nodeName==='#text'||['span','strong','em','b','i'].includes(n.tagName)&&attr(n,'itemprop')!=='description').map(text);
 if(parts.some(s=>s===null))return false;const context=parts.join(' ');
 return context!==null&&!/\b(?:not|never|avoid|beware|fake|fraud(?:ulent)?|scams?|example|unauthori[sz]ed)\b/i.test(context);
}
const safe=input=>{try{const u=new URL(input);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&u.href.length<=2048&&!/%(?:2f|5c|2e)/i.test(u.pathname)?u:null;}catch{return null;}};
const jobId=url=>url&&!url.search?url.pathname.match(/^\/job\/[^/]+\/([1-9][0-9]{0,19})\/$/)?.[1]??null:null;
function application(url){
 const id=url?.pathname.match(/^\/talentcommunity\/apply\/([1-9][0-9]{0,19})\/$/)?.[1];if(!id)return null;
 const query=[...url.searchParams];if(query.length>1||query.some(([k,v])=>k!=='locale'||!/^[a-z]{2}(?:[_-][A-Z]{2})?$/.test(v)))return null;return id;
}
function proof(canonicalUrl,urls,kinds){
 const c=safe(canonicalUrl),id=jobId(c);if(!id||c.href!==canonicalUrl||!urls.length||urls.length>8)return null;
 for(const value of urls){const u=safe(value);if(!u||u.href!==value||u.origin!==c.origin||application(u)!==id)return null;}
 return{version:RMK_BINDING_VERSION,canonicalUrl,platformId:id,applicationUrls:[...new Set(urls)].sort(),controlKinds:[...new Set(kinds)].sort()};
}
/** A specific inert DOM protocol: controls owned by the single Microdata posting,
 * outside its description/nested items, corroborate its canonical platform ID.
 * IDs remain in the RMK namespace; no requisition ID or application is inferred.
 */
export function inspectRecruitingMarketingBinding(postingRoot,canonicalUrl){
 const c=safe(canonicalUrl);if(!jobId(c))return null;
 const urls=[],kinds=[],stack=[[postingRoot,0,false]];let count=0,controls=0,unsupported=false,conflicting=false;
 while(stack.length){const[n,depth,hidden]=stack.pop();if(++count>20000||depth>100)return{outcome:'unsupported'};
  if(n!==postingRoot&&((n.attrs??[]).some(a=>a.name==='itemscope')||/\bdescription\b/.test(attr(n,'itemprop')??'')))continue;
  if(['script','style','iframe','template','noscript','form','nav','aside','header','footer'].includes(n.tagName)||/\b(?:navigation|banner|contentinfo|complementary|dialog)\b/.test(attr(n,'role')??''))continue;
  const blocked=hidden||(n.attrs??[]).some(a=>a.name==='hidden'||a.name==='disabled'||a.name==='aria-hidden'&&a.value==='true'||a.name==='aria-disabled'&&a.value==='true'||a.name==='style'&&/(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(a.value));
  if(['a','button'].includes(n.tagName)&&attr(n,'href')!==undefined){const href=attr(n,'href');let u;try{u=new URL(href,canonicalUrl);}catch{}
   if(/\/talentcommunity\/apply(?:\/|$)/i.test(u?.pathname??href)){
    if(++controls>8)return{outcome:'unsupported'};
    if(blocked||!declaredApply(n)||!u||!safe(u.href)||!application(u))unsupported=true;
    else if(u.origin!==c.origin||application(u)!==jobId(c))conflicting=true;
    else{urls.push(u.href);kinds.push(n.tagName);}
   }
  }
  stack.push(...(n.childNodes??[]).map(n=>[n,depth+1,blocked]));
 }
 if(!controls)return null;if(conflicting)return{outcome:'conflicting'};if(unsupported)return{outcome:'unsupported'};
 const binding=proof(canonicalUrl,urls,kinds);return binding?{outcome:'supported',binding}:{outcome:'unsupported'};
}
export function validRecruitingMarketingBinding(binding,target){
 if(!binding||binding.version!==RMK_BINDING_VERSION||binding.canonicalUrl!==target||!Array.isArray(binding.applicationUrls)||!Array.isArray(binding.controlKinds)||
  !binding.controlKinds.length||binding.controlKinds.some(k=>!['a','button'].includes(k)))return false;
 return isDeepStrictEqual(binding,proof(binding.canonicalUrl,binding.applicationUrls,binding.controlKinds));
}
