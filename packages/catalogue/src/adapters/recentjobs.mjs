import { createHash } from 'node:crypto';
import { parse } from 'parse5';
import ipaddr from 'ipaddr.js';
import { applicationMethods } from './application-methods.mjs';

// Pure extraction only. These candidates are not canonical records, approvals,
// source permissions or instructions to fetch an application destination.
export const RECENTJOBS_ADAPTER = 'recentjobs_html_v1';
export const RECENTJOBS_BOUND_DETAIL_ADAPTER = 'recentjobs_html_bound_detail_v2';
const ARTICLE_PATH = /^\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+\/$/i;
const LIST_PATH = /^\/category\/apprenticeships\/(?:page\/([1-9]\d*)\/)?$/;
const IGNORE_TAGS = new Set(['script', 'style', 'iframe', 'noscript', 'template', 'svg', 'form', 'aside', 'nav', 'footer']);
const BREAK_TAGS = new Set(['p', 'div', 'li', 'ul', 'ol', 'br', 'tr', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value ?? '';
const classes = node => attr(node, 'class').split(/\s+/);
const hasClass = (node, name) => classes(node).includes(name);
const ignored = node => IGNORE_TAGS.has(node.tagName) || classes(node).some(c =>
  /^(?:addtoany|a2a_|adsbygoogle|wp-block-latest-comments|comment-|comments|sharedaddy)/.test(c));
const fail = code => { throw new Error(code); };
const hash = input => createHash('sha256').update(input).digest('hex');

function sourceUrl(input, kind) {
  let url;
  try { url = new URL(input); } catch { fail('RECENTJOBS_UNSAFE_SOURCE_URL'); }
  if (url.protocol !== 'https:' || url.hostname !== 'recentjobs.co.za' || url.port || url.username || url.password ||
      url.search || url.hash || !(kind === 'list' ? LIST_PATH : ARTICLE_PATH).test(url.pathname)) {
    fail('RECENTJOBS_UNSAFE_SOURCE_URL');
  }
  return url.href;
}

function document(html) {
  if (typeof html !== 'string' || Buffer.byteLength(html) > 500_000) fail('RECENTJOBS_BODY_LIMIT');
  const root = parse(html);
  // Bound traversals independently of source formatting; never evaluate scripts.
  let count = 0;
  const stack = [[root, 0]];
  while (stack.length) {
    const [node, depth] = stack.pop();
    if (++count > 20_000 || depth > 100) fail('RECENTJOBS_TREE_LIMIT');
    for (const child of node.childNodes ?? []) stack.push([child, depth + 1]);
  }
  return root;
}

function find(root, predicate, includeNavigation = false) {
  const found = [], stack = [root];
  while (stack.length) {
    const node = stack.pop();
    if (ignored(node) && !(includeNavigation && node.tagName === 'nav')) continue;
    if (predicate(node)) found.push(node);
    stack.push(...(node.childNodes ?? []).slice().reverse());
  }
  return found;
}

function text(root) {
  const pieces = [], stack = [[root, false]];
  while (stack.length) {
    const [node, closing] = stack.pop();
    if (ignored(node)) continue;
    if (node.nodeName === '#text') { pieces.push(node.value); continue; }
    if (BREAK_TAGS.has(node.tagName)) pieces.push('\n');
    if (!closing) {
      stack.push([node, true]);
      for (const child of (node.childNodes ?? []).slice().reverse()) stack.push([child, false]);
    }
  }
  return pieces.join('').split(/\n+/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
}

const posts = root => find(root, n => n.tagName === 'article' && hasClass(n, 'type-post'));
const one = nodes => nodes.length === 1 ? nodes[0] : fail('RECENTJOBS_LAYOUT_CHANGED');
const ancestor = (node, predicate) => {
  for (let parent = node.parentNode; parent; parent = parent.parentNode) if (predicate(parent)) return parent;
  return null;
};
const within = (node, parent) => ancestor(node, n => n === parent) !== null;

function detailBinding(root, url) {
  const candidates = posts(root);
  if (candidates.length === 1) {
    const post = candidates[0];
    if (find(post, n => n.tagName === 'article').length !== 1) fail('RECENTJOBS_LAYOUT_CHANGED');
    return { post, content: one(find(post, n => hasClass(n, 'entry-content'))), adapter: RECENTJOBS_ADAPTER };
  }
  // One known unheaded template wrapper may live inside the complete outer body.
  // Bind the outer notice to page identity; retain its introduction AND nested
  // body. Independent embedded notices and unfamiliar structures stay held.
  if (candidates.length !== 2) fail('RECENTJOBS_LAYOUT_CHANGED');
  const post = one(candidates.filter(n => !ancestor(n, p => p.tagName === 'article')));
  const nested = candidates.find(n => n !== post);
  if (!hasClass(nested, 'sensy-entry') || ancestor(nested, n => n.tagName === 'article') !== post ||
      find(post, n => n.tagName === 'article').length !== 2) fail('RECENTJOBS_LAYOUT_CHANGED');
  const body = one(find(root, n => n.tagName === 'body'));
  const identity = one(classes(body).filter(c => /^postid-\d{1,12}$/.test(c))).slice(7);
  const main = one(find(root, n => n.tagName === 'main' && attr(n, 'id') === 'main' && hasClass(n, 'site-main')));
  if (!hasClass(body, 'single-post') || post.parentNode !== main || attr(post, 'id') !== `post-${identity}` ||
      !hasClass(post, `post-${identity}`)) fail('RECENTJOBS_LAYOUT_CHANGED');
  const canonical = one(find(root, n => n.tagName === 'link' && attr(n, 'rel').toLowerCase().split(/\s+/).includes('canonical')));
  if (!attr(canonical, 'href').trim()) fail('RECENTJOBS_LAYOUT_CHANGED');
  let target;
  try { target = sourceUrl(new URL(attr(canonical, 'href'), url).href, 'detail'); } catch { fail('RECENTJOBS_LAYOUT_CHANGED'); }
  if (canonical.parentNode?.tagName !== 'head' || target !== url) fail('RECENTJOBS_LAYOUT_CHANGED');
  const title = one(find(post, n => n.tagName === 'h1' && hasClass(n, 'entry-title')));
  if (ancestor(title, n => n.tagName === 'article') !== post ||
      find(nested, n => n.tagName === 'h1' || hasClass(n, 'entry-title') || hasClass(n, 'entry-header') ||
        n.tagName === 'time' && hasClass(n, 'published')).length) fail('RECENTJOBS_LAYOUT_CHANGED');
  const contents = find(post, n => hasClass(n, 'entry-content'));
  if (contents.length !== 2) fail('RECENTJOBS_LAYOUT_CHANGED');
  const content = one(contents.filter(n => ancestor(n, p => p.tagName === 'article') === post));
  const nestedContent = one(contents.filter(n => ancestor(n, p => p.tagName === 'article') === nested));
  const shell = one(find(content, n => n.tagName === 'section' && hasClass(n, 'sensy-shell')));
  if (shell.parentNode !== content || !within(nested, shell) || !within(nestedContent, nested)) fail('RECENTJOBS_LAYOUT_CHANGED');
  return { post, content, adapter: RECENTJOBS_BOUND_DETAIL_ADAPTER };
}

export function parseRecentJobsList({ html, url }) {
  url = sourceUrl(url, 'list');
  const root = document(html);
  const wrappers = find(root, n => hasClass(n, 'articles-wrap'));
  const wrapper = one(wrappers);
  const cards = posts(wrapper);
  if (!cards.length || cards.length > 50) fail('RECENTJOBS_LAYOUT_CHANGED');
  const articles = new Map();
  for (const card of cards) {
    const heading = one(find(card, n => hasClass(n, 'entry-title')));
    const anchor = one(find(heading, n => n.tagName === 'a' && attr(n, 'href')));
    const target = sourceUrl(new URL(attr(anchor, 'href'), url).href, 'detail');
    const title = text(anchor);
    if (!title || title.length > 500) fail('RECENTJOBS_LAYOUT_CHANGED');
    articles.set(target, { sourceUrl: target, title });
  }
  const page = Number(new URL(url).pathname.match(LIST_PATH)?.[1] ?? 1);
  const next = new Set();
  // WordPress uses nav-previous for older posts; do not follow menu/sidebar links.
  const navigation = find(root, n => hasClass(n, 'posts-navigation') || hasClass(n, 'pagination'), true);
  for (const nav of navigation) {
    for (const a of find(nav, n => n.tagName === 'a' && attr(n, 'href'), true)) {
      let target;
      try { target = new URL(attr(a, 'href'), url); sourceUrl(target.href, 'list'); } catch { continue; }
      if (Number(target.pathname.match(LIST_PATH)?.[1] ?? 1) === page + 1) next.add(target.href);
    }
  }
  if (next.size > 1) fail('RECENTJOBS_LAYOUT_CHANGED');
  return { adapter: RECENTJOBS_ADAPTER, sourceUrl: url, articles: [...articles.values()], nextPage: [...next][0] ?? null };
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
function dateOnly(raw) {
  let year, month, day;
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(raw);
  if (m) [, year, month, day] = m;
  else if ((m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(raw))) [, day, month, year] = m;
  else if ((m = /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i.exec(raw))) {
    [, day, , year] = m;
    const name = m[2].toLowerCase();
    month = MONTHS.findIndex(value => value === name || (name.length === 3 && value.startsWith(name))) + 1;
  } else return null;
  if (!month || Number(year) < 1) return null;
  const result = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parsed = new Date(`${result}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === result ? result : null;
}

function deadlines(body) {
  const pattern = /(?:closing\s*date|application\s*deadline|apply\s*by|^closing\s*:)\s*[:;\-]?\s*(?:(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s*,?\s+)?(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}\s+[a-z]+\s+\d{4}|not\s+specified|not\s+stated|until\s+filled)/gim;
  const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  return [...body.matchAll(pattern)].map(m => {
    let localDate = dateOnly(m[2]);
    // A conflicting written weekday is unresolved, not silently discarded.
    if (localDate && m[1] && new Date(`${localDate}T00:00:00.000Z`).getUTCDay() !== weekdays.indexOf(m[1].toLowerCase())) localDate = null;
    return { originalText:m[0], localDate, timezone:null };
  });
}

// Explicit per-trade email subjects still represent separate intakes even when
// the recipient is shared. Flag this narrow layout until its scope is supported.
function multipleApplicationSubjects(body) {
  const lines = body.split('\n');
  for (const [index,line] of lines.entries()) {
    if (!/^Use the correct subject line\s*:$/i.test(line.trim())) continue;
    const subjects = new Set();
    for (let at=index+1;at<lines.length;at++) {
      const match = /^(.{1,120}?)\s+[—–-]\s+if applying for\s+(.{1,120})$/i.exec(lines[at].trim());
      if (!match || match[1].trim().toLowerCase() !== match[2].trim().toLowerCase()) break;
      subjects.add(match[1].trim().toLowerCase());
    }
    if (subjects.size > 1) return true;
  }
  return false;
}
function applicationCandidate(anchor, source) {
  const label = text(anchor);
  if (!/\b(?:apply|application)\b/i.test(label) || /\b(?:share|whatsapp|group|channel)\b/i.test(label)) return null;
  let target;
  try { target = new URL(attr(anchor, 'href'), source); } catch { return null; }
  if (target.protocol === 'mailto:') {
    if (target.search || target.hash || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target.pathname)) return null;
    return { method: 'email', destination: target.pathname, originalText: label, check: 'pending' };
  }
  const hostname = target.hostname;
  if (target.protocol !== 'https:' || target.username || target.password || target.port || target.hash ||
      target.href.length > 2048 || ipaddr.isValid(hostname.replace(/^\[|\]$/g, '')) || !hostname.includes('.') ||
      /(?:^|\.)(?:recentjobs\.co\.za|addtoany\.com|whatsapp\.com|wa\.me|facebook\.com)$/.test(hostname) ||
      /\.(?:local|localhost|internal)$/.test(hostname)) return null;
  // A syntactically usable link is still unverified. No DNS or HTTP work occurs here.
  return { method: 'portal', destination: target.href, originalText: label, check: 'pending' };
}

export function parseRecentJobsDetail({ html, url, observedOn = null }) {
  url = sourceUrl(url, 'detail');
  if (observedOn !== null && (typeof observedOn !== 'string' || dateOnly(observedOn) !== observedOn)) fail('RECENTJOBS_INVALID_OBSERVATION_DATE');
  const { post, content, adapter } = detailBinding(document(html), url);
  const title = text(one(find(post, n => n.tagName === 'h1' && hasClass(n, 'entry-title'))));
  const sourceText = text(content);
  if (!title || title.length > 500 || !sourceText || sourceText.length > 20_000) fail('RECENTJOBS_CONTENT_LIMIT');
  const times = find(post, n => n.tagName === 'time' && hasClass(n, 'published'));
  const sourcePublishedAtRaw = times.length === 1 ? attr(times[0], 'datetime') || text(times[0]) : null;
  const applicationCandidates = [...new Map(find(content, n => n.tagName === 'a' && attr(n, 'href'))
    .map(a => applicationCandidate(a, url)).filter(Boolean).map(a => [`${a.method}:${a.destination}`, a])).values()];
  const methods = applicationMethods(sourceText);
  for (const route of methods.candidates) {
    if (!applicationCandidates.some(c => c.method === route.method && c.destination === route.destination)) applicationCandidates.push(route);
  }
  if (applicationCandidates.length > 20) fail('RECENTJOBS_CONTENT_LIMIT');
  const deadlineCandidates = deadlines(sourceText);
  const issues = ['aggregator_facts_need_review', 'availability_not_verified'];
  if (!applicationCandidates.length) issues.push('application_route_missing');
  if (applicationCandidates.length > 1) issues.push('multiple_application_routes');
  if (methods.instructions.length) issues.push('physical_application_requires_review');
  if (multipleApplicationSubjects(sourceText)) issues.push('programme_subject_scope_review_required');
  if (!deadlineCandidates.length || deadlineCandidates.some(d => !d.localDate)) issues.push('deadline_needs_review');
  if (new Set(deadlineCandidates.map(d => d.localDate).filter(Boolean)).size > 1) issues.push('conflicting_deadlines');
  if (observedOn && deadlineCandidates.some(d => d.localDate && d.localDate < observedOn)) issues.push('source_deadline_before_observation');
  const categoryHint = /\bapprentice(?:ship)?s?\b/i.test(title) ? 'apprenticeship' : null;
  if (!categoryHint) issues.push('category_needs_review');
  const candidate = { adapter, sourceUrl: url, sourceRecordId: hash(url),
    title, categoryHint, sourcePublishedAtRaw, sourceText, deadlineCandidates, applicationCandidates,
    ...(methods.instructions.length ? {applicationInstructions:methods.instructions} : {}) };
  return { ...candidate, contentHash: hash(JSON.stringify(candidate)), observedOn, review: 'pending', issues };
}
