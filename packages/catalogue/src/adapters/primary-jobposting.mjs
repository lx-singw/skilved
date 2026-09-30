import { parse } from 'parse5';
import { DomainError } from '../config.mjs';
const fail = () => { throw new DomainError('PRIMARY_NOTICE_UNSUPPORTED'); };

function walk(root, visit) {
  const stack = [[root, 0]]; let count = 0;
  while (stack.length) {
    const [node, depth] = stack.pop();
    if (++count > 20_000 || depth > 100) fail();
    visit(node);
    for (const child of node.childNodes ?? []) stack.push([child, depth + 1]);
  }
}
function plain(html) {
  // Parse inertly, then traverse only visible text. No script execution or linked resources.
  const root = parse(html), parts = [], stack = [root]; let count = 0;
  while (stack.length) {
    const node = stack.pop(); if (++count > 20_000) fail();
    if (['script', 'style', 'iframe', 'template'].includes(node.tagName)) continue;
    if (node.nodeName === '#text') parts.push(node.value);
    stack.push(...(node.childNodes ?? []).slice().reverse());
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/** Conservative first corroboration adapter. Unsupported ATS layouts become exceptions. */
export function parsePrimaryJobPosting(html) {
  if (typeof html !== 'string' || Buffer.byteLength(html) > 500_000) fail();
  const postings = [];
  walk(parse(html), node => {
    if (node.tagName !== 'script' || !node.attrs?.some(a => a.name === 'type' && a.value.toLowerCase() === 'application/ld+json')) return;
    let data;
    try { data = JSON.parse((node.childNodes ?? []).map(n => n.value ?? '').join('')); } catch { return; }
    const stack = [[data, 0]]; let count = 0;
    while (stack.length) {
      const [item, depth] = stack.pop(); if (++count > 1000 || depth > 15) fail();
      if (!item || typeof item !== 'object') continue;
      if ([item['@type']].flat().includes('JobPosting')) postings.push(item);
      for (const v of Object.values(item)) if (typeof v === 'object' && v !== null) stack.push([v, depth + 1]);
    }
  });
  if (postings.length !== 1) fail();
  const p = postings[0], issuer = p.hiringOrganization?.name;
  if (typeof issuer !== 'string' || !issuer.trim() || typeof p.title !== 'string' || !p.title.trim() ||
      typeof p.description !== 'string' || !p.description.trim()) fail();
  // Keep material structured fields as evidence too; the description is never the whole notice by assumption.
  const text = JSON.stringify({ ...p, description: plain(p.description) });
  if (text.length > 20_000) fail();
  return { issuer: issuer.trim(), title: p.title.trim(), validThrough: typeof p.validThrough === 'string' ? p.validThrough : null, text };
}
