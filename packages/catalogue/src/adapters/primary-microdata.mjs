import { DomainError } from '../config.mjs';

const fail = () => { throw new DomainError('PRIMARY_NOTICE_UNSUPPORTED'); };
const attr = (node, key) => node.attrs?.find(a => a.name === key)?.value;
const scoped = node => node.attrs?.some(a => a.name === 'itemscope');
const tokens = value => (value ?? '').trim().split(/\s+/).filter(Boolean);
const excluded = node => ['script','style','iframe','template','noscript','form','nav','aside','footer'].includes(node.tagName) ||
  node.attrs?.some(a => a.name === 'hidden' || a.name === 'aria-hidden' && a.value === 'true' ||
    a.name === 'style' && /(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(a.value));

/** A bounded, local descendant subset of HTML Microdata. No itemref resolution,
 * resource loads, DOM execution, inferred properties or cross-item field merging.
 */
export function readMicrodataJobPosting(root) {
  const roots = [], stack = [[root, 0, false]]; let nodes = 0, hasBase = false;
  while (stack.length) {
    const [node, depth, hidden] = stack.pop(); if (++nodes > 20_000 || depth > 100) fail();
    const blocked = hidden || excluded(node);
    if (node.tagName === 'base' && attr(node, 'href') !== undefined) hasBase = true;
    if (scoped(node) && tokens(attr(node, 'itemtype')).some(t => /^https?:\/\/schema\.org\/JobPosting$/.test(t))) {
      if (blocked) fail(); roots.push(node);
    }
    for (const child of node.childNodes ?? []) stack.push([child, depth + 1, blocked]);
  }
  if (!roots.length) return null;
  if (roots.length !== 1 || hasBase) fail();
  let visits = 0;
  const text = node => {
    const parts = [], pending = [[node, 0]];
    while (pending.length) {
      const [n, depth] = pending.pop(); if (++visits > 40_000 || depth > 100) fail();
      if (excluded(n)) continue;
      // Nested items have their own values, never the parent's scalar value.
      if (n !== node && scoped(n)) fail();
      if (n.nodeName === '#text') parts.push(n.value);
      pending.push(...(n.childNodes ?? []).slice().reverse().map(c => [c, depth + 1]));
    }
    return parts.join('').replace(/\s+/g, ' ').trim();
  };
  const scalar = node => {
    if (node.tagName === 'meta') return attr(node, 'content') ?? fail();
    if (['a','area','link'].includes(node.tagName)) return attr(node, 'href') ?? fail();
    if (['audio','embed','iframe','img','source','track','video'].includes(node.tagName)) return attr(node, 'src') ?? fail();
    if (node.tagName === 'object') return attr(node, 'data') ?? fail();
    if (['data','meter'].includes(node.tagName)) return attr(node, 'value') ?? fail();
    if (node.tagName === 'time' && attr(node, 'datetime') !== undefined) return attr(node, 'datetime');
    return text(node);
  };
  const description = node => {
    if (scoped(node) || ['meta','time','data','meter','a','area','link','img','object'].includes(node.tagName)) fail();
    const parts = [], pending = [[node, false]], blocks = new Set(['p','div','li','ul','ol','br','h1','h2','h3','h4','tr']);
    while (pending.length) {
      const [n, closing] = pending.pop(); if (++visits > 40_000) fail();
      if (excluded(n)) continue;
      if (n !== node && scoped(n)) fail();
      if (n.nodeName === '#text') { parts.push(n.value); continue; }
      if (blocks.has(n.tagName)) parts.push('\n');
      if (!closing) { pending.push([n, true]); pending.push(...(n.childNodes ?? []).slice().reverse().map(c => [c, false])); }
    }
    const escape = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
    return parts.join('').split(/\n+/).map(s => s.replace(/\s+/g,' ').trim()).filter(Boolean).map(s => `<p>${escape(s)}</p>`).join('');
  };
  const item = (node, depth = 0) => {
    if (depth > 12 || attr(node, 'itemref') !== undefined) fail();
    const types = tokens(attr(node, 'itemtype'));
    if (types.length !== 1 || !/^https?:\/\/schema\.org\/[A-Za-z][A-Za-z0-9]*$/.test(types[0])) fail();
    const values = new Map(), pending = [...(node.childNodes ?? [])].reverse();
    while (pending.length) {
      const n = pending.pop(); if (++visits > 40_000) fail();
      if (attr(n, 'itemref') !== undefined) fail();
      if (excluded(n)) continue;
      const names = tokens(attr(n, 'itemprop'));
      if (names.some(p => !/^[A-Za-z][A-Za-z0-9]{0,79}$/.test(p))) fail();
      if (names.length) {
        if (names.includes('description') && names.length !== 1) fail();
        const value = names.includes('description') ? description(n) : scoped(n) ? item(n, depth + 1) : scalar(n);
        for (const name of new Set(names)) {
          const list = values.get(name) ?? []; list.push(value); values.set(name, list);
          if (list.length > 30 || values.size > 100) fail();
        }
      }
      if (!scoped(n)) pending.push(...(n.childNodes ?? []).slice().reverse());
    }
    const result = Object.fromEntries([...values].map(([key, entries]) => [key, entries.length === 1 ? entries[0] : entries]));
    result['@type'] = types[0].split('/').at(-1);
    if (attr(node, 'itemid') !== undefined) result['@id'] = attr(node, 'itemid');
    return result;
  };
  const posting = item(roots[0]);
  // Older emitters use a literal organization name. Preserve that name; it supplies
  // no corporate URL, delegation, authority or guessed employer domain.
  if (typeof posting.hiringOrganization === 'string') posting.hiringOrganization = { name: posting.hiringOrganization };
  for (const key of ['title','description','hiringOrganization','validThrough','url','mainEntityOfPage','identifier'])
    if (Array.isArray(posting[key])) fail();
  return posting;
}
