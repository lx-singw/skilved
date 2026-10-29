import { createHash } from 'node:crypto';
import { DomainError } from './config.mjs';
import { assertSourceTarget } from './worker-policy.mjs';

const hash = text => createHash('sha256').update(text).digest('hex');
const fail = () => { throw new DomainError('DISCOVERY_STATE_INVALID'); };

/** Pure bounded cursor planning. No employer, title, reference or vacancy-specific rules. */
export function discoveryChunk(source, claim, list) {
  const policy = source.automation.discovery;
  const page = Number(new URL(assertSourceTarget(claim.url, 'index')).pathname.match(/\/page\/(\d+)\/$/)?.[1] ?? 1);
  const offset = claim.discoveryOffset;
  if (!policy || !/^[a-f0-9]{64}$/.test(claim.discoveryCycle ?? '') ||
      !Number.isInteger(offset) || offset < 0 || offset >= list.articles.length ||
      page > policy.maxPages || list.sourceUrl !== claim.url || !list.articles.length || list.articles.length > 50) fail();
  const articles = list.articles.slice(offset, offset + source.automation.maxArticles);
  let next = null, stop = 'end';
  if (offset + articles.length < list.articles.length) {
    next = { url: claim.url, discoveryOffset: offset + articles.length };
  } else if (list.nextPage) {
    const url = assertSourceTarget(list.nextPage, 'index');
    if (url !== `https://recentjobs.co.za/category/apprenticeships/page/${page + 1}/`) fail();
    if (page < policy.maxPages) next = { url, discoveryOffset: 0 };
    else stop = 'page_limit';
  }
  if (next) next = { ...next, id: hash(`${claim.discoveryCycle}:${next.url}:${next.discoveryOffset}`),
    discoveryCycle: claim.discoveryCycle };
  return { articles, next, stop: next ? null : stop, page };
}
