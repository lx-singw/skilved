import { createHash } from 'node:crypto';
import { parse } from 'parse5';
import ipaddr from 'ipaddr.js';

// Pure extraction only. These candidates are not canonical records, approvals,
// source permissions or instructions to fetch an application destination.
export const RECENTJOBS_ADAPTER = 'recentjobs_html_v1';
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
  const pattern = /(?:closing\s*date|application\s*deadline|apply\s*by)\s*[:;\-]?\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}\s+[a-z]+\s+\d{4}|not\s+specified|not\s+stated|until\s+filled)/gi;
  return [...body.matchAll(pattern)].map(m => ({ originalText: m[0], localDate: dateOnly(m[1]), timezone: null }));
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
  const post = one(posts(document(html)));
  const title = text(one(find(post, n => n.tagName === 'h1' && hasClass(n, 'entry-title'))));
  const content = one(find(post, n => hasClass(n, 'entry-content')));
  const sourceText = text(content);
  if (!title || title.length > 500 || !sourceText || sourceText.length > 20_000) fail('RECENTJOBS_CONTENT_LIMIT');
  const times = find(post, n => n.tagName === 'time' && hasClass(n, 'published'));
  const sourcePublishedAtRaw = times.length === 1 ? attr(times[0], 'datetime') || text(times[0]) : null;
  const applicationCandidates = [...new Map(find(content, n => n.tagName === 'a' && attr(n, 'href'))
    .map(a => applicationCandidate(a, url)).filter(Boolean).map(a => [`${a.method}:${a.destination}`, a])).values()];
  if (applicationCandidates.length > 20) fail('RECENTJOBS_CONTENT_LIMIT');
  const deadlineCandidates = deadlines(sourceText);
  const issues = ['aggregator_facts_need_review', 'availability_not_verified'];
  if (!applicationCandidates.length) issues.push('application_route_missing');
  if (applicationCandidates.length > 1) issues.push('multiple_application_routes');
  if (!deadlineCandidates.length || deadlineCandidates.some(d => !d.localDate)) issues.push('deadline_needs_review');
  if (new Set(deadlineCandidates.map(d => d.localDate).filter(Boolean)).size > 1) issues.push('conflicting_deadlines');
  if (observedOn && deadlineCandidates.some(d => d.localDate && d.localDate < observedOn)) issues.push('source_deadline_before_observation');
  const categoryHint = /\bapprentice(?:ship)?s?\b/i.test(title) ? 'apprenticeship' : null;
  if (!categoryHint) issues.push('category_needs_review');
  const candidate = { adapter: RECENTJOBS_ADAPTER, sourceUrl: url, sourceRecordId: hash(url),
    title, categoryHint, sourcePublishedAtRaw, sourceText, deadlineCandidates, applicationCandidates };
  return { ...candidate, contentHash: hash(JSON.stringify(candidate)), observedOn, review: 'pending', issues };
}
