import {createHash} from 'node:crypto';
import {parse} from 'parse5';
import {z} from 'zod';
import {IdSchema,InstantSchema} from '@skilved/types/opportunities';
import {EmployerRelationship} from './schemas.mjs';
import {probeUrl} from './origin-discovery.mjs';
import {issuerNameKey,readRelationship,relationshipBinding,relationshipDocument} from './issuer-registry.mjs';
import {DomainError} from './config.mjs';
import {PdfEvidence,pdfIdentityMaterial,verifyPdfEvidence} from './onboarding-pdf.mjs';

export const ONBOARDING_VERSION='employer_onboarding_v1';
export const onboardingHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail=code=>{throw new DomainError(code);};
const url=z.string().max(2048).refine(v=>{const u=probeUrl(v);return u&&u.href===v&&!u.search;});
const name=z.string().trim().min(1).max(200);
export const OnboardingPlan=z.object({issuer:name,aliases:z.array(name).max(10).default([]),corporateUrl:url,careersUrl:url,identityUrl:url,identityFormat:z.literal('pdf').optional(),needId:IdSchema.optional()}).strict()
 .refine(p=>new URL(p.corporateUrl).pathname==='/'&&new URL(p.corporateUrl).origin===new URL(p.careersUrl).origin&&new URL(p.corporateUrl).origin!==new URL(p.identityUrl).origin&&p.corporateUrl!==p.careersUrl,'Corporate homepage, separate identity evidence and a same-origin careers page required');
const Observation=z.object({url,at:InstantSchema,html:z.string().refine(v=>Buffer.byteLength(v)<=500000).optional(),pdf:PdfEvidence.optional(),error:z.string().regex(/^[A-Z][A-Z_]{0,79}$/).optional()}).strict()
 .refine(o=>[o.html,o.pdf,o.error].filter(v=>v!==undefined).length===1).refine(o=>Buffer.byteLength(JSON.stringify(o))<=900000);
export const OnboardingObservations=z.array(Observation).max(3).refine(rows=>new Set(rows.map(r=>r.url)).size===rows.length);
export const OnboardingBundle=z.object({version:z.literal(ONBOARDING_VERSION),plan:OnboardingPlan,observations:z.array(Observation).length(3)}).strict()
 .refine(b=>new Set(b.observations.map(o=>o.url)).size===3&&[b.plan.corporateUrl,b.plan.careersUrl,b.plan.identityUrl].every(u=>b.observations.some(o=>o.url===u)))
 .refine(b=>b.observations.every(o=>o.error!==undefined||(o.pdf?o.url===b.plan.identityUrl&&b.plan.identityFormat==='pdf':o.url!==b.plan.identityUrl||!b.plan.identityFormat)));
export const OnboardingReview=z.object({proposalId:IdSchema,expectedHash:z.string().regex(/^[a-f0-9]{64}$/),action:z.enum(['qualify','reject']),
 expectedAuthority:z.object({id:IdSchema,revision:z.number().int().positive(),hash:z.string().regex(/^[a-f0-9]{64}$/)}).strict().nullable(),
 identityKind:z.enum(['government','exchange','reviewed_directory']).optional(),identityConfirmed:z.literal(true).optional(),
 identityQuote:z.string().trim().min(3).max(1000).optional(),expiresAt:InstantSchema.optional()}).strict();
export const onboardingNeedId=hint=>onboardingHash([issuerNameKey(hint.issuer),hint.host]);
const normalize=s=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const contains=(text,s)=>{const words=v=>normalize(v).replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');return ` ${words(text)} `.includes(` ${words(s)} `);};

/** Inert bounded review material, never a classifier of legal website ownership. */
export function onboardingPage(html){
 if(typeof html!=='string'||Buffer.byteLength(html)>500000)fail('ONBOARDING_LAYOUT_UNSUPPORTED');
 const texts=[],links=[],headings=[],stack=[[parse(html),0]];let count=0;
 const ignored=n=>['script','style','iframe','template','noscript','form'].includes(n.tagName)||n.attrs?.some(a=>a.name==='hidden'||a.name==='aria-hidden'&&a.value==='true'||a.name==='style'&&/(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(a.value));
 const visible=node=>{const parts=[],pending=[node];while(pending.length){const n=pending.pop();if(++count>40000)fail('ONBOARDING_LAYOUT_UNSUPPORTED');if(ignored(n)||n!==node&&['ul','ol','nav','menu'].includes(n.tagName))continue;if(n.nodeName==='#text')parts.push(n.value);pending.push(...(n.childNodes??[]).slice().reverse());}return parts.join(' ');};
 while(stack.length){const[n,depth]=stack.pop();if(++count>20000||depth>100)fail('ONBOARDING_LAYOUT_UNSUPPORTED');
  const attr=k=>n.attrs?.find(a=>a.name===k)?.value;
  if(n.tagName==='base'&&attr('href')!==undefined)fail('ONBOARDING_LAYOUT_UNSUPPORTED');
  if(ignored(n))continue;
  if(n.nodeName==='#text')texts.push(n.value);if(n.tagName==='h1')headings.push(n);
  if(n.tagName==='a'&&attr('href')){let context=n.parentNode;while(context&&!['p','li','div','section','body'].includes(context.tagName))context=context.parentNode;
   links.push({href:attr('href'),denied:/\b(?:not|never|avoid|fake|fraud(?:ulent)?|unauthori[sz]ed|example|unrelated)\b/i.test(visible(context??n))});}
  stack.push(...(n.childNodes??[]).slice().reverse().map(c=>[c,depth+1]));
 }
 return{text:texts.join(' ').replace(/\s+/g,' ').trim(),links,headingCount:headings.length};
}
function linked(page,base,target){const matches=page.links.filter(link=>{try{return new URL(link.href,base).href===target;}catch{return false;}});return matches.some(l=>!l.denied)&&!matches.some(l=>l.denied);}
export function evaluateOnboarding(input){
 const b=OnboardingBundle.parse(input),pages=new Map(),issues=[];
 for(const o of b.observations){if(o.error){issues.push({url:o.url,reason:o.error});continue;}
  try{pages.set(o.url,o.pdf?pdfIdentityMaterial(o.pdf,b.plan.corporateUrl):onboardingPage(o.html));}catch(e){if(!['ONBOARDING_LAYOUT_UNSUPPORTED','PDF_EVIDENCE_UNSUPPORTED'].includes(e.code))throw e;issues.push({url:o.url,reason:e.code});}}
 const p=b.plan,identity=pages.get(p.identityUrl),corporate=pages.get(p.corporateUrl),careers=pages.get(p.careersUrl);
 if(identity&&(!contains(identity.text,p.issuer)||!linked(identity,p.identityUrl,p.corporateUrl)))issues.push({url:p.identityUrl,reason:'INDEPENDENT_IDENTITY_LINK_UNSUPPORTED'});
 if(corporate&&(!contains(corporate.text,p.issuer)||!linked(corporate,p.corporateUrl,p.careersUrl)))issues.push({url:p.corporateUrl,reason:'CORPORATE_CAREERS_LINK_UNSUPPORTED'});
 if(careers&&(!contains(careers.text,p.issuer)||!/\b(?:careers|jobs|vacancies)\b/i.test(careers.text)))issues.push({url:p.careersUrl,reason:'CAREERS_IDENTITY_UNSUPPORTED'});
 if(identity&&corporate&&p.aliases.some(a=>!contains(identity.text+' '+corporate.text,a)))issues.push({url:p.identityUrl,reason:'ALIAS_EVIDENCE_UNSUPPORTED'});
 const careersCandidates=corporate?[...new Set(corporate.links.filter(l=>!l.denied).flatMap(l=>{try{const u=new URL(l.href,p.corporateUrl);return probeUrl(u.href)&&u.origin===new URL(p.corporateUrl).origin&&!u.search&&!u.hash&&/\/(?:careers|jobs|vacancies)\/?$/i.test(u.pathname)?[u.href]:[];}catch{return[];}}))].slice(0,5):[];
 return{state:issues.length?'evidence_incomplete':'awaiting_identity_review',issues,careersCandidates,identityAutomatic:false};
}
function current(b,now){if(!InstantSchema.safeParse(now).success||b.observations.some(o=>o.at>now||Date.parse(now)-Date.parse(o.at)>86400000))fail('ONBOARDING_EVIDENCE_STALE');}
function checkNeed(snapshot,plan){const n=snapshot?.exists?JSON.parse(snapshot.data().json):null;
 if(!n||n.id!==plan.needId||![plan.issuer,...plan.aliases].some(v=>issuerNameKey(v)===issuerNameKey(n.issuerHint?.issuer))||n.issuerHint.host!==null&&n.issuerHint.host!==new URL(plan.corporateUrl).hostname)fail('ONBOARDING_NEED_CONFLICT');}
export async function recordOnboarding(c,tx,input,uid){
 const b=OnboardingBundle.parse(input);current(b,c.now());for(const o of b.observations)if(o.pdf)await verifyPdfEvidence(o.pdf);
 const id=onboardingHash(b),ref=c.ref('employer_onboarding',id),old=await tx.get(ref);
 const snapshots=b.observations.map(o=>({id:onboardingHash(o),observation:o}));
 const existing=await Promise.all(snapshots.map(s=>tx.get(c.ref('employer_onboarding_snapshots',s.id))));
 const need=b.plan.needId?await tx.get(c.ref('employer_onboarding_needs',b.plan.needId)):null;
 if(need)checkNeed(need,b.plan);
 if(old.exists)return{id,evidenceHash:id,evaluation:JSON.parse(old.data().json).evaluation,reused:true};
 const proposal={id,version:ONBOARDING_VERSION,evidenceHash:id,plan:b.plan,snapshots:snapshots.map(s=>s.id),evaluation:evaluateOnboarding(b),recordedAt:c.now(),recordedBy:uid};
 snapshots.forEach((s,i)=>{if(!existing[i].exists)tx.create(c.ref('employer_onboarding_snapshots',s.id),{json:JSON.stringify(s.observation)});});
 tx.create(ref,{json:JSON.stringify(proposal)});return{id,evidenceHash:id,evaluation:proposal.evaluation,reused:false};
}
export async function decideOnboarding(c,tx,input,uid){
 const review=OnboardingReview.parse(input),snap=await tx.get(c.ref('employer_onboarding',review.proposalId));if(!snap.exists)fail('ONBOARDING_NOT_FOUND');
 const p=JSON.parse(snap.data().json),observations=await Promise.all(p.snapshots.map(id=>tx.get(c.ref('employer_onboarding_snapshots',id))));
 if(observations.some(s=>!s.exists))fail('ONBOARDING_EVIDENCE_CHANGED');
 const b=OnboardingBundle.parse({version:p.version,plan:p.plan,observations:observations.map(s=>JSON.parse(s.data().json))});
 if(onboardingHash(b)!==p.id||review.expectedHash!==p.evidenceHash||p.evidenceHash!==p.id||p.id!==snap.id||p.snapshots.some((id,i)=>onboardingHash(b.observations[i])!==id))fail('ONBOARDING_EVIDENCE_CHANGED');
 const decisionRef=c.ref('employer_onboarding_decisions',p.id),previous=await tx.get(decisionRef);if(previous.exists)fail('ONBOARDING_ALREADY_REVIEWED');
 if(review.action==='reject'){tx.create(decisionRef,{json:JSON.stringify({id:p.id,proposalId:p.id,action:'reject',actor:uid,at:c.now()})});return{action:'reject',proposalId:p.id};}
 current(b,c.now());if(evaluateOnboarding(b).state!=='awaiting_identity_review'||!review.identityConfirmed||!review.identityKind||!review.identityQuote||!review.expiresAt)fail('ONBOARDING_REVIEW_REQUIRED');
 const identityObservation=b.observations.find(o=>o.url===b.plan.identityUrl);
 if(identityObservation.pdf)await verifyPdfEvidence(identityObservation.pdf);
 const identity=identityObservation.pdf?pdfIdentityMaterial(identityObservation.pdf,b.plan.corporateUrl):onboardingPage(identityObservation.html);
 if(!identity.text.includes(review.identityQuote)||!contains(review.identityQuote,b.plan.issuer))fail('ONBOARDING_IDENTITY_QUOTE_UNSUPPORTED');
 if(identityObservation.pdf&&!identity.links.some(l=>!l.denied&&review.identityQuote.includes(l.printed)))fail('ONBOARDING_IDENTITY_QUOTE_UNSUPPORTED');
 if(review.expiresAt<=c.now()||Date.parse(review.expiresAt)-Date.parse(c.now())>30*86400000)fail('ONBOARDING_EXPIRY_INVALID');
 const id=review.expectedAuthority?.id??onboardingHash(['corporate',issuerNameKey(b.plan.issuer),new URL(b.plan.corporateUrl).origin]);
 const old=readRelationship(await tx.get(c.ref('employer_relationships',id)));
 if(JSON.stringify(old?relationshipBinding(old):null)!==JSON.stringify(review.expectedAuthority))fail('CONFLICT');
 if(old&&(old.route.host!==new URL(b.plan.corporateUrl).hostname||issuerNameKey(old.route.name)!==issuerNameKey(b.plan.issuer)))fail('CONFLICT');
 const peers=await tx.get(c.db.collection('m0_employer_relationships').where('routeKeys','array-contains',`portal:${new URL(b.plan.corporateUrl).hostname}`).limit(31));
 if(peers.size>30)fail('ISSUER_REGISTRY_CAPACITY');
 if(peers.docs.map(readRelationship).some(r=>r.id!==id&&r.delegationPage&&[r.route.name,...r.route.aliases].some(v=>issuerNameKey(v)===issuerNameKey(b.plan.issuer))))fail('ONBOARDING_AUTHORITY_EXISTS');
 const r=EmployerRelationship.parse({id,revision:(old?.revision??0)+1,state:'qualified',categories:['apprenticeship'],reviewedAt:c.now(),expiresAt:review.expiresAt,
  route:{name:b.plan.issuer,aliases:b.plan.aliases,host:new URL(b.plan.corporateUrl).hostname,pathPrefix:'/',emailAddresses:[],evidence:`Onboarding ${p.id}; independent ${review.identityKind} identity review; snapshot ${p.snapshots[b.observations.findIndex(o=>o.url===b.plan.identityUrl)]}`},delegationPage:b.plan.careersUrl});
 const need=b.plan.needId?await tx.get(c.ref('employer_onboarding_needs',b.plan.needId)):null;
 if(need)checkNeed(need,b.plan);
 tx.set(c.ref('employer_relationships',id),relationshipDocument(r));tx.create(c.ref('employer_relationship_versions',createHash('sha256').update(`${id}:${r.revision}`).digest('hex')),{json:JSON.stringify(r)});
 const decision={id:p.id,proposalId:p.id,evidenceHash:p.evidenceHash,action:'qualify',actor:uid,at:c.now(),identityKind:review.identityKind,identityQuote:review.identityQuote,authority:relationshipBinding(r)};
 tx.create(decisionRef,{json:JSON.stringify(decision)});
 if(need?.exists)tx.set(need.ref,{json:JSON.stringify({...JSON.parse(need.data().json),state:'authority_registered',authority:decision.authority,proposalId:p.id})});
 return{action:'qualify',proposalId:p.id,authority:decision.authority};
}
