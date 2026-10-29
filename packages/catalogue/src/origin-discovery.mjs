import { createHash } from 'node:crypto';
import { parse } from 'parse5';
import ipaddr from 'ipaddr.js';
import { z } from 'zod';
import { IdSchema, InstantSchema } from '@skilved/types/opportunities';
import { IssuerRoute } from './schemas.mjs';
import { readRelationship, relationshipBinding, validateIssuerBindings } from './issuer-registry.mjs';
import { inspectPrimaryJobPosting } from './adapters/primary-jobposting.mjs';
import { DomainError } from './config.mjs';

export const ORIGIN_DISCOVERY_VERSION = 'corporate_delegation_v1';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail = code => { throw new DomainError(code); };
const name = value => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const Binding = z.object({ id: IdSchema, revision: z.number().int().positive(), hash: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
const Delegation = z.object({ id: IdSchema, version: z.literal(ORIGIN_DISCOVERY_VERSION), parent: Binding,
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
  const urls = inspected.issuerUrls.flat();
  if (!urls.length || urls.length > 4) return null;
  const parsed = urls.map(probeUrl);
  if (parsed.some(url => !url || url.search)) return null;
  const origins = new Set(parsed.map(url => url.origin));
  return origins.size === 1 ? { issuer: inspected.primary.issuer, host: parsed[0].hostname } : null;
}
export async function corporateAnchor(tx, db, hint, now) {
  const rows = await tx.get(db.collection('m0_employer_relationships').where('routeKeys','array-contains',`portal:${hint.host}`).limit(31));
  if (rows.size > 30) fail('ISSUER_REGISTRY_CAPACITY');
  const anchors = rows.docs.map(readRelationship).filter(r => r.state === 'qualified' && r.reviewedAt <= now && now < r.expiresAt &&
    r.categories.includes('apprenticeship') && r.delegationPage && [r.route.name,...r.route.aliases].map(name).includes(name(hint.issuer)));
  return anchors.length === 1 ? anchors[0] : null;
}

/** Only visible careers links in one main region; never menus, footers, scripts or guessed URLs. */
export function corporateLink(html, corporateUrl, destination) {
  if (typeof html !== 'string' || Buffer.byteLength(html) > 500_000) return null;
  const target = probeUrl(destination); if (!target) return null;
  const root = parse(html), mains = [], headings = [], links = [];
  const stack = [[root,0,false]]; let count = 0;
  const ignored = node => ['script','style','iframe','template','noscript','form','nav','aside','footer'].includes(node.tagName) ||
    node.attrs?.some(a => a.name === 'hidden' || a.name === 'aria-hidden' && a.value === 'true' ||
      a.name === 'style' && /(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(a.value));
  const text = node => {
    const parts = [], pending = [[node,0]]; let count = 0;
    while (pending.length) {
      const [n,depth] = pending.pop(); if (++count>20_000 || depth>100) return '';
      if (ignored(n)) continue;
      if (n.nodeName === '#text') parts.push(n.value);
      pending.push(...(n.childNodes ?? []).slice().reverse().map(child => [child,depth+1]));
    }
    return parts.join(' ').replace(/\s+/g,' ').trim();
  };
  while (stack.length) {
    const [node,depth,inMain] = stack.pop();
    if (++count > 20_000 || depth > 100) return null;
    const attr = key => node.attrs?.find(a => a.name === key)?.value;
    if (ignored(node)) continue;
    if (node.tagName === 'main') mains.push(node);
    const within = inMain || node.tagName === 'main';
    if (within && node.tagName === 'h1') headings.push(node);
    if (within && node.tagName === 'a' && attr('href')) links.push(node);
    for (const child of (node.childNodes ?? []).slice().reverse()) stack.push([child,depth+1,within]);
  }
  if (mains.length !== 1 || headings.length !== 1 || !/\b(?:careers|jobs|vacancies)\b/i.test(text(headings[0]))) return null;
  const matches = new Map(), denied = new Set();
  const warning = /\b(?:not|never|avoid|beware|fake|scams?|fraud(?:ulent)?|unauthori[sz]ed|example|privacy|cookies|share|whatsapp)\b/i;
  for (const node of links) {
    const label = text(node);
    let url; try { url = probeUrl(new URL(node.attrs.find(a => a.name === 'href').value,corporateUrl).href); } catch { continue; }
    if (!url || url.search || url.hostname !== target.hostname || url.pathname === '/' || url.pathname.length > 500 || !url.pathname.endsWith('/') ||
        !target.pathname.startsWith(url.pathname)) continue;
    let context = node.parentNode;
    while (context && !['main','p','li','section','div','article'].includes(context.tagName)) context = context.parentNode;
    if (warning.test(label) || context && warning.test(text(context))) { denied.add(url.href); continue; }
    if (label.length > 200 || !/\b(?:careers|jobs|vacancies|open positions)\b/i.test(label)) continue;
    matches.set(url.href, url);
  }
  // Prefer the smallest explicitly linked scope; never infer a tenant from a job ID.
  return [...matches.values()].filter(url=>!denied.has(url.href)).sort((a,b) => b.pathname.length-a.pathname.length)[0]?.href ?? null;
}
export function makeDelegation(anchor, linkUrl, { now, snapshotId, sourceId, sourceRevision }) {
  const link = probeUrl(linkUrl);
  if (!link || link.search || link.pathname === '/' || link.pathname.length > 500 || !link.pathname.endsWith('/') || !anchor.delegationPage) fail('ORIGIN_PROOF_INVALID');
  return Delegation.parse({ id: idFor(anchor.id,link.href), version: ORIGIN_DISCOVERY_VERSION, parent: relationshipBinding(anchor),
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
        JSON.stringify(raw.routeKeys) !== JSON.stringify([`portal:${r.route.host}`]) || !url || url.search || url.pathname === '/' ||
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
