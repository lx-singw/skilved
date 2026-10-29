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
function readJobPosting(html) {
  if (typeof html !== 'string' || Buffer.byteLength(html) > 500_000) fail();
  const postings = [], root = parse(html);
  walk(root, node => {
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
  return { posting: postings[0], root };
}
function projectPosting(p) {
  const issuer = p.hiringOrganization?.name;
  if (typeof issuer !== 'string' || !issuer.trim() || typeof p.title !== 'string' || !p.title.trim() ||
      typeof p.description !== 'string' || !p.description.trim()) fail();
  // Keep material structured fields as evidence too; the description is never the whole notice by assumption.
  const text = JSON.stringify({ ...p, description: plain(p.description) });
  if (text.length > 20_000) fail();
  return { issuer: issuer.trim(), title: p.title.trim(), validThrough: typeof p.validThrough === 'string' ? p.validThrough : null, text };
}

export function parsePrimaryJobPosting(html) {
  return projectPosting(readJobPosting(html).posting);
}

function descriptionLines(html) {
  const parts = [], blocks = new Set(['p','div','li','ul','ol','br','h1','h2','h3','h4','tr']);
  const stack = [[parse(html), false, 0]]; let count = 0;
  while (stack.length) {
    const [node, closing, depth] = stack.pop();
    if (++count > 40_000 || depth > 100) fail();
    if (['script','style','iframe','template','noscript','form','nav','aside','footer'].includes(node.tagName)) continue;
    if (node.nodeName === '#text') { parts.push(node.value); continue; }
    if (blocks.has(node.tagName)) parts.push('\n');
    if (!closing) {
      stack.push([node, true, depth]);
      for (const child of (node.childNodes ?? []).slice().reverse()) stack.push([child, false, depth + 1]);
    }
  }
  return parts.join('').split(/\n+/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
}

/** Additional structured identity evidence; does not establish employer authority. */
export function inspectPrimaryJobPosting(html) {
  const { posting: p, root } = readJobPosting(html), primary = projectPosting(p);
  const canonicals = [];
  walk(root, node => {
    const attribute = name => node.attrs?.find(a => a.name === name)?.value;
    if (node.tagName === 'link' && (attribute('rel') ?? '').toLowerCase().split(/\s+/).includes('canonical')) {
      if (node.parentNode?.tagName !== 'head') fail();
      canonicals.push(attribute('href') ?? '');
    }
  });
  if (canonicals.length > 1) fail();
  const scalar = value => typeof value === 'string' && value.trim() && value.length <= 200 ? value.trim()
    : Number.isSafeInteger(value) && value >= 0 ? String(value) : null;
  const identifier = p.identifier === undefined ? null : typeof p.identifier === 'object' && p.identifier !== null && !Array.isArray(p.identifier)
    ? { value: scalar(p.identifier.value), name: scalar(p.identifier.name) }
    : { value: scalar(p.identifier), name: null };
  return { primary, postingUrl: p.url ?? null, canonicalUrl: canonicals[0] ?? null,
    mainEntityUrl: p.mainEntityOfPage?.['@id'] ?? p.mainEntityOfPage ?? null,
    identifier, issuerUrls: [p.hiringOrganization?.sameAs, p.hiringOrganization?.url].filter(v => v !== undefined),
    descriptionText: descriptionLines(p.description) };
}
