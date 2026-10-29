// Authored notices only. No real employer, vacancy, provider response or permission.
import { parseRecentJobsDetail } from '../../src/adapters/recentjobs.mjs';
import { RECENTJOBS_INDEX } from '../../src/worker-policy.mjs';

export const originalHtml = (posting, canonical = posting.url) => `<html><head>${canonical == null ? '' :
  `<link rel="canonical" href="${canonical}">`}<script type="application/ld+json">${JSON.stringify(posting).replaceAll('<', '\\u003c')}</script></head><body></body></html>`;

export function originalFixture({ issuer = 'Fictional Workshop', host = 'careers.example', path = '/tenant-a/job/123/',
  reference = 'AP-123', slug = 'authored-apprentice', title = 'Fictional electrical apprentice' } = {}) {
  const url = `https://${host}${path}`;
  const source = { id: 'publisher_fixture', revision: 1, name: 'Authored RecentJobs publisher', urls: [RECENTJOBS_INDEX],
    permission: { reference: 'Authored permission', method: 'recentjobs_html', reuse: 'Synthetic notices only', reviewedAt: '2026-10-29T10:00:00.000Z' },
    categories: ['apprenticeship'], owner: 'fixture_owner', paused: false, cadenceHours: 24, maxBytes: 500000,
    automation: { mode: 'shadow', employerCrawl: true, originalVerification: 'shadow_v1', discovery: { maxPages: 1 },
      qualificationRef: 'Authored verification only', maxArticles: 10, maxModelCallsPerDay: 20, minRequestIntervalMs: 2000, checkTtlHours: 24,
      issuers: [{ name: issuer, aliases: [], host, pathPrefix: '/tenant-a/job/', emailAddresses: [], evidence: 'Authored issuer route policy' }] } };
  const detailUrl = `https://recentjobs.co.za/2026/10/29/${slug}/`;
  const detailHtml = `<article class="type-post"><h1 class="entry-title">${title}</h1><div class="entry-content">
    <p>${issuer} seeks an electrical apprentice.</p><p>Applicants require Grade 12 with Mathematics OR N3 Electrical.</p>
    ${reference ? `<p>Reference: ${reference}</p>` : ''}<p>Closing date: 30 October 2026</p><a href="${url}">Apply now</a></div></article>`;
  const candidate = parseRecentJobsDetail({ html: detailHtml, url: detailUrl });
  const posting = { '@type': 'JobPosting', url, title, hiringOrganization: { name: issuer },
    identifier: { '@type': 'PropertyValue', name: issuer, value: reference ?? 'OPAQUE-321' }, validThrough: '2026-10-30',
    description: `<p>${issuer} seeks an electrical apprentice.</p><p>Grade 12 with Mathematics OR N3 Electrical.</p>${reference ? `<p>Reference: ${reference}</p>` : ''}` };
  return { source, candidate, detailUrl, detailHtml, posting, url,
    observation: { url, text: originalHtml(posting) }, now: '2026-10-29T10:00:00.000Z' };
}
