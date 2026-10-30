import { createHash } from 'node:crypto';
import { parse } from 'parse5';
import { parse as parseDomain } from 'tldts';
import ipaddr from 'ipaddr.js';
import { z } from 'zod';
import { IdSchema, InstantSchema } from '@skilved/types/opportunities';
import { IssuerRoute } from './schemas.mjs';
import { readRelationship, relationshipBinding, validateIssuerBindings, issuerNameKey } from './issuer-registry.mjs';
import { inspectPrimaryJobPosting } from './adapters/primary-jobposting.mjs';
import { DomainError } from './config.mjs';

export const ORIGIN_DISCOVERY_VERSION = 'corporate_delegation_v2';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail = code => { throw new DomainError(code); };
const name = value => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const Binding = z.object({ id: IdSchema, revision: z.number().int().positive(), hash: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
const Delegation = z.object({ id: IdSchema, version: z.enum(['corporate_delegation_v1',ORIGIN_DISCOVERY_VERSION]), parent: Binding,
  scopeKind: z.enum(['linked_path','corporate_subdomain']).optional(),
  route: IssuerRoute, corporateUrl: z.string().url().max(2048), linkUrl: z.string().url().max(2048),
  observedAt: InstantSchema, expiresAt: InstantSchema, snapshotId: IdSchema, sourceId: IdSchema,
  sourceRevision: z.number().int().positive() }).strict();
export const delegationBinding = record => ({ id: record.id, hash: hash(record) });
export const delegationDocument = record => ({ json: JSON.stringify(record), routeKeys: [`portal:${record.route.host}`] });
const idFor = (parentId, link) => hash([parentId, link]);
export const discoveryOutcome = (outcome, reason) => ({ version: ORIGIN_DISCOVERY_VERSION, outcome, reason });

/** Syntax permits a bounded read probe, not employer authority. Network retrieval still pins public DNS/TLS. */
export function probeUrl(input) {
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash || url.href.length > 2048 ||
        ipaddr.isValid(url.hostname.replace(/^\[|\]$/g,'')) || !url.hostname.includes('.') ||
        /(?:^|\.)(?:recentjobs\.co\.za|studentroom\.co\.za|lnkd\.in|bit\.ly|whatsapp\.com|facebook\.com|wa\.me)$/.test(url.hostname) ||
        /(?:^|\.)(?:localhost|local|internal)$/.test(url.hostname) || /%(?:2f|5c|2e)/i.test(url.pathname)) return null;
    return url;
  } catch { return null; }
}
export function issuerHint(html) {
  let inspected;
  try { inspected = inspectPrimaryJobPosting(html); }
  catch (error) { if (error.code === 'PRIMARY_NOTICE_UNSUPPORTED') return null; throw error; }
  if (!issuerNameKey(inspected.primary.issuer)) return null;
  const urls = inspected.issuerUrls.flat();
  // A name is only a key into reviewed authority, never a guessed domain or
  // permission to fetch an unreviewed corporate page. Supplied bad URL claims
  // must not be discarded to fall back to this path.
  if (!urls.length) return inspected.issuerUrls.length ? null : { issuer: inspected.primary.issuer, host: null };
  if (urls.length > 4 || urls.some(url => typeof url !== 'string')) return null;
  const parsed = urls.map(probeUrl);
  if (parsed.some(url => !url || url.search)) return null;
  const origins = new Set(parsed.map(url => url.origin));
  return origins.size === 1 ? { issuer: inspected.primary.issuer, host: parsed[0].hostname } : null;
}
export async function corporateAnchor(tx, db, hint, now) {
  const key = hint.host === null ? issuerNameKey(hint.issuer) : `portal:${hint.host}`;
  if (!key) return null;
  const rows = await tx.get(db.collection('m0_employer_relationships').where('routeKeys','array-contains',key).limit(31));
  if (rows.size > 30) fail('ISSUER_REGISTRY_CAPACITY');
  const anchors = rows.docs.map(readRelationship).filter(r => r.state === 'qualified' && r.reviewedAt <= now && now < r.expiresAt &&
    r.categories.includes('apprenticeship') && r.delegationPage && [r.route.name,...r.route.aliases].map(name).includes(name(hint.issuer)));
  return anchors.length === 1 ? anchors[0] : null;
}

/** An explicitly linked recruitment root is limited to a subdomain of a reviewed
 * apex/www corporate site, with ICANN and private suffix boundaries preserved.
 * This classifies a supplied link; it never constructs a recruitment hostname.
 */
export function corporateRecruitmentRoot(corporateUrl,linkUrl){
 const corporate=probeUrl(corporateUrl),link=probeUrl(linkUrl);if(!corporate||!link||corporate.search||link.search||link.pathname!=='/')return false;
 const c=parseDomain(corporate.hostname,{allowPrivateDomains:true}),l=parseDomain(link.hostname,{allowPrivateDomains:true});
 return c.isIcann===true&&!c.isPrivate&&l.isIcann===true&&!l.isPrivate&&!!c.domain&&c.domain===l.domain&&
  [c.domain,`www.${c.domain}`].includes(corporate.hostname)&&link.hostname.endsWith(`.${c.domain}`)&&link.hostname!==`www.${c.domain}`;
}
function scopeSupported(corporateUrl,link,rootAllowed){return link&&!link.search&&link.pathname.length<=500&&link.pathname.endsWith('/')&&
 (link.pathname!=='/'||rootAllowed&&corporateRecruitmentRoot(corporateUrl,link.href));}
const marker='\uE000';
function linkWarning(context,label){
 const warning=/\b(?:not|never|avoid|beware|fake|scams?|fraud(?:ulent)?|unauthori[sz]ed|example|privacy|cookies|share|whatsapp)\b/i;
 if(warning.test(label)||context.split(marker).length!==2)return true;
 if(!warning.test(context))return false;
 // A paragraph may first disclaim unsolicited offers/fees, then explicitly say
 // applications go through the linked website. Only that affirmative sentence
 // can resolve a remote "not"; directives, portal warnings and contradictions
 // elsewhere in the paragraph remain a hold.
 const sentences=context.split(/(?<=[.!?])\s+/),local=sentences.find(s=>s.includes(marker));
 if(!local||warning.test(local)||/\b(?:never|avoid|beware|fake|scams?|fraud(?:ulent)?|unauthori[sz]ed|privacy|cookies|share|whatsapp|example)\b|\b(?:do|must|should|shall)\s+not\b|\bnot\s+(?:safe|official|authentic|legitimate|trusted|affiliated|recommended|authori[sz]ed)\b/i.test(context))return true;
 if(sentences.some(s=>!s.includes(marker)&&warning.test(s)&&/\b(?:portals?|websites?|sites?|links?|addresses?|destinations?|services?|platforms?|channels?|jobs)\b/i.test(s)))return true;
 return !/\b(?:apply|applied|applications?|vacanc(?:y|ies))\b[^.!?]{0,160}\b(?:through|via|using|on|at)\b[^.!?]{0,80}\uE000/i.test(local);
}

/** Visible careers content in one main/role-main, or a heading-associated content
 * container. Repeated identical careers headings are allowed; conflicting titles,
 * menus, footers, warnings, base URLs and unbounded layouts remain unsupported.
 */
export function corporateLink(html, corporateUrl, destination) {
  if (typeof html !== 'string' || Buffer.byteLength(html) > 500_000) return null;
  const target = probeUrl(destination); if (!target||!probeUrl(corporateUrl)||new URL(corporateUrl).search) return null;
  const root = parse(html), mains = [], headings = [], links = [],visible=new WeakSet(),insideMain=new WeakSet();
  const role=node=>node.attrs?.find(a=>a.name==='role')?.value.trim().toLowerCase()??'';
  const chrome=/\b(?:footer|nav|navigation|menu|mainmenu|megamenu|sidebar|breadcrumbs?|cookie|consent)\b/i;
  const chromeNames=node=>(node.attrs??[]).filter(a=>['id','class'].includes(a.name)).map(a=>a.value.replace(/[_-]/g,' ')).join(' ');
  const stack = [[root,0,false,false]]; let count = 0,work=0,exhausted=false;
  const ignored = (node,inMain) => ['script','style','iframe','template','noscript','form','nav','aside','footer','menu'].includes(node.tagName) ||
    !inMain&&node.tagName==='header'||/\b(?:navigation|banner|contentinfo|complementary|dialog)\b/.test(role(node))||
    chrome.test(chromeNames(node))||!inMain&&/\bheader\b/i.test(chromeNames(node))||
    node.attrs?.some(a => a.name === 'hidden' || a.name === 'aria-hidden' && a.value === 'true' ||
      a.name === 'style' && /(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(a.value));
  const text = (node,marked=null) => {
    const parts = [], pending = [[node,0]];
    while (pending.length) {
      const [n,depth] = pending.pop(); if (++work>200_000 || depth>100) {exhausted=true;return '';}
      if (!visible.has(n)) continue;
      if(n===marked){parts.push(marker);continue;}
      if (n.nodeName === '#text') parts.push(n.value);
      pending.push(...(n.childNodes ?? []).slice().reverse().map(child => [child,depth+1]));
    }
    return parts.join(' ').replace(/\s+/g,' ').trim();
  };
  while (stack.length) {
    const [node,depth,inMain,hidden] = stack.pop();
    if (++count > 20_000 || depth > 100) return null;
    const attr = key => node.attrs?.find(a => a.name === key)?.value;
    if(node.tagName==='base'&&attr('href')!==undefined)return null;
    const excluded=hidden||ignored(node,inMain),isMain=node.tagName==='main'||role(node)==='main',within=inMain||isMain;
    if(!excluded){visible.add(node);if(within)insideMain.add(node);if(isMain)mains.push(node);
      if(node.tagName==='h1')headings.push(node);if(node.tagName==='a'&&attr('href'))links.push(node);}
    for (const child of (node.childNodes ?? []).slice().reverse()) stack.push([child,depth+1,within,excluded]);
  }
  if(mains.length>1)return null;
  const titles=headings.filter(n=>(!mains.length||insideMain.has(n))&&/\b(?:careers|jobs|vacancies)\b/i.test(text(n)));
  if(!titles.length||new Set(titles.map(n=>name(text(n)))).size!==1||exhausted)return null;
  const regions=new WeakSet();for(const h of titles)for(let n=h.parentNode;n;n=n.parentNode)if(['div','section','article','main'].includes(n.tagName)||role(n)==='main')regions.add(n);
  const matches = new Map(), denied = new Set();
  for (const node of links) {
    if(mains.length&&!insideMain.has(node))continue;
    // Without semantic main markup, require an actual prose link associated with
    // a careers heading, rather than promoting a page-wide collection of anchors.
    if(!mains.length){let p=node.parentNode;while(p&&!['p','body'].includes(p.tagName))p=p.parentNode;
      if(p?.tagName!=='p')continue;let region=p.parentNode;while(region&&!regions.has(region))region=region.parentNode;if(!region)continue;}
    const label = text(node);
    let url; try { url = probeUrl(new URL(node.attrs.find(a => a.name === 'href').value,corporateUrl).href); } catch { continue; }
    if (!url || url.search || url.hostname !== target.hostname ||
        !(target.pathname===url.pathname||target.pathname.startsWith(url.pathname.endsWith('/')?url.pathname:url.pathname+'/'))) continue;
    let context = node.parentNode;
    while (context && !['main','p','li','section','div','article'].includes(context.tagName)) context = context.parentNode;
    if (linkWarning(text(context??node.parentNode,node),label)) { denied.add(url.href); continue; }
    if(!scopeSupported(corporateUrl,url,true))continue;
    if (label.length > 200 || !/\b(?:careers?|jobs|vacancies|open positions)\b/i.test(label)) continue;
    matches.set(url.href, url);
  }
  // Prefer the smallest explicitly linked scope; never infer a tenant from a job ID.
  if(exhausted||denied.size)return null;
  return [...matches.values()].sort((a,b) => b.pathname.length-a.pathname.length)[0]?.href ?? null;
}
export function makeDelegation(anchor, linkUrl, { now, snapshotId, sourceId, sourceRevision }) {
  const link = probeUrl(linkUrl);
  if (!anchor.delegationPage || !scopeSupported(anchor.delegationPage,link,true)) fail('ORIGIN_PROOF_INVALID');
  return Delegation.parse({ id: idFor(anchor.id,link.href), version: ORIGIN_DISCOVERY_VERSION, parent: relationshipBinding(anchor),
    scopeKind:link.pathname==='/'?'corporate_subdomain':'linked_path',
    route: { name: anchor.route.name, aliases: anchor.route.aliases, host: link.hostname, pathPrefix: link.pathname,
      emailAddresses: [], evidence: `Corporate careers delegation: parent ${anchor.id} revision ${anchor.revision}; snapshot ${snapshotId}` },
    corporateUrl: anchor.delegationPage, linkUrl: link.href, observedAt: now,
    expiresAt: new Date(Math.min(Date.parse(anchor.expiresAt),Date.parse(now)+6*3_600_000)).toISOString(),
    snapshotId, sourceId, sourceRevision });
}
export function readDelegation(snapshot) {
  if (!snapshot.exists) return null;
  try {
    const raw = snapshot.data(), r = Delegation.parse(JSON.parse(raw.json)), url = probeUrl(r.linkUrl);
    if (Object.keys(raw).sort().join(',') !== 'json,routeKeys' || snapshot.id !== r.id || r.id !== idFor(r.parent.id,r.linkUrl) ||
        JSON.stringify(raw.routeKeys) !== JSON.stringify([`portal:${r.route.host}`]) || !url || url.href!==r.linkUrl ||
        !scopeSupported(r.corporateUrl,url,r.version===ORIGIN_DISCOVERY_VERSION)||
        (r.version==='corporate_delegation_v1'?r.scopeKind!==undefined:r.scopeKind!==(url.pathname==='/'?'corporate_subdomain':'linked_path'))||
        !url.pathname.endsWith('/') || url.hostname !== r.route.host || url.pathname !== r.route.pathPrefix || r.route.emailAddresses.length ||
        r.observedAt >= r.expiresAt || Date.parse(r.expiresAt)-Date.parse(r.observedAt)>6*3_600_000) fail('ORIGIN_PROOF_INVALID');
    return r;
  } catch { fail('ORIGIN_PROOF_INVALID'); }
}
async function checkedParent(tx, db, r, now) {
  const parent = readRelationship(await tx.get(db.collection('m0_employer_relationships').doc(r.parent.id)));
  if (!parent || JSON.stringify(relationshipBinding(parent)) !== JSON.stringify(r.parent)) fail('ISSUER_TRUST_CHANGED');
  await validateIssuerBindings(tx,db,[r.parent],'apprenticeship',now);
  if (parent.delegationPage !== r.corporateUrl || parent.route.name !== r.route.name ||
      JSON.stringify(parent.route.aliases) !== JSON.stringify(r.route.aliases) || r.expiresAt > parent.expiresAt || r.observedAt < parent.reviewedAt)
    fail('ORIGIN_PROOF_INVALID');
  return parent;
}
export async function validateDelegationBindings(tx, db, bindings, now) {
  const issuers = [];
  for (const expected of bindings) {
    const r = readDelegation(await tx.get(db.collection('m0_employer_delegations').doc(expected.id)));
    if (!r || hash(r) !== expected.hash) fail('ISSUER_TRUST_CHANGED');
    if (r.observedAt > now || now >= r.expiresAt) fail('ISSUER_TRUST_EXPIRED');
    await checkedParent(tx,db,r,now); issuers.push(r.route);
  }
  return issuers;
}
export async function lookupDelegations(tx, db, route, now) {
  const target = route?.method === 'portal' ? probeUrl(route.destination) : null;
  if (!target) return [];
  const rows = await tx.get(db.collection('m0_employer_delegations').where('routeKeys','array-contains',`portal:${target.hostname}`).limit(31));
  if (rows.size > 30) fail('ISSUER_REGISTRY_CAPACITY');
  const found = [];
  for (const snapshot of rows.docs) {
    const r = readDelegation(snapshot);
    if (r.observedAt > now || now >= r.expiresAt || !target.pathname.startsWith(r.route.pathPrefix)) continue;
    try { await checkedParent(tx,db,r,now); found.push(r); }
    catch (error) { if (!['ISSUER_TRUST_CHANGED','ISSUER_TRUST_EXPIRED'].includes(error.code)) throw error; }
  }
  return found;
}
