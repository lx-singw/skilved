import { test } from 'node:test';
import assert from 'node:assert/strict';
import { originalNoticeTarget, originalRetrievalFailure, resolveOriginalNotice, refreshOriginalResolution } from '../src/original-notice-resolver.mjs';
import { inspectPrimaryJobPosting, parsePrimaryJobPosting } from '../src/adapters/primary-jobposting.mjs';
import { originalFixture, originalHtml } from './fixtures/original-notices.mjs';

function resolve(f, posting = f.posting, changes = {}) {
  return resolveOriginalNotice({ ...f, observation: { url: f.url, text: originalHtml(posting) }, ...changes });
}
test('one generic resolver matches multiple employers and original URLs using explicit vacancy evidence', () => {
  for (const [issuer, host] of [['Fictional Workshop','careers.example'],['Imaginary Works','jobs.example'],['Authored Forge','tenant.example']]) {
    const f = originalFixture({ issuer, host });
    const result = resolve(f);
    assert.equal(result.outcome, 'matched'); assert.equal(result.reason, 'EXACT_NOTICE_CORROBORATED');
    assert.deepEqual(result.checks, ['issuer','title','reference','vacancy_url','deadline','application_method']);
    assert.equal(result.identity.url, f.url); assert.equal(result.primary.issuer, issuer);
    assert.deepEqual(parsePrimaryJobPosting(f.observation.text), result.primary);
  }
});
test('a matching domain does not admit a different URL, tenant, issuer, title, reference or deadline', () => {
  const f = originalFixture();
  for (const [change, reason] of [
    [{ url: 'https://careers.example/tenant-a/job/999/' }, 'VACANCY_URL_CONFLICT'],
    [{ url: 'https://careers.example/tenant-b/job/123/' }, 'VACANCY_URL_CONFLICT'],
    [{ hiringOrganization: { name: 'Different Employer' } }, 'ISSUER_CONFLICT'],
    [{ title: 'Finance manager' }, 'TITLE_CONFLICT'],
    [{ description: '<p>Reference: AP-999</p>' }, 'REFERENCE_CONFLICT'],
    [{ validThrough: '2026-11-01' }, 'DEADLINE_CONFLICT'],
  ]) { const result = resolve(f, { ...f.posting, ...change }); assert.equal(result.outcome, 'conflicting'); assert.equal(result.reason, reason); }
});
test('explicit issuer aliases work but shared-platform tenants and brand substrings cannot expand trust', () => {
  const f = originalFixture();
  f.source.automation.issuers[0].aliases = ['Authored Workshop Brand'];
  assert.equal(resolve(f, { ...f.posting, hiringOrganization: { name: 'Authored Workshop Brand' } }).outcome, 'matched');
  assert.equal(resolve(f, { ...f.posting, hiringOrganization: { name: 'Fictional Workshop Group Other' } }).outcome, 'conflicting');
  const g = originalFixture({ path: '/tenant-b/job/123/' });
  assert.equal(resolve(g).reason, 'ORIGIN_UNQUALIFIED');
});
test('missing posting bindings are held; all supplied URL/canonical/mainEntity claims must agree', () => {
  const f = originalFixture({ reference: null }), p = { ...f.posting }; delete p.url;
  assert.equal(resolve(f, p).reason, 'VACANCY_BINDING_MISSING');
  const withMainEntity = { ...p, mainEntityOfPage: { '@id': f.url } };
  assert.equal(resolve(f, withMainEntity).outcome, 'matched');
  for (const bad of ['https://evil.example/job/123/', f.url + '?different=1', f.url + '#other', { url: f.url }]) {
    assert.equal(resolve(f, { ...f.posting, mainEntityOfPage: bad }).reason, 'VACANCY_URL_CONFLICT');
  }
  assert.equal(resolve(f, f.posting, { observation: { url: f.url, text: originalHtml(f.posting, 'https://careers.example/tenant-a/job/999/') } }).reason, 'VACANCY_URL_CONFLICT');
  const ref = originalFixture(), withoutUrl = { ...ref.posting }; delete withoutUrl.url;
  assert.equal(resolve(ref, withoutUrl, { observation: { url: ref.url, text: originalHtml(withoutUrl, ref.url) } }).outcome, 'matched');
});
test('ATS URL IDs and opaque identifiers are not silently equated with recruitment references', () => {
  const f = originalFixture(), p = { ...f.posting, identifier: { '@type': 'PropertyValue', name: 'RMK Specific ID', value: '987654321' } };
  assert.equal(resolve(f, p).outcome, 'matched', 'Explicit primary reference agrees despite a distinct platform ID');
  assert.equal(resolve(f, { ...p, description: '<p>An electrical apprenticeship.</p>' }).reason, 'REFERENCE_UNCORROBORATED');
  assert.equal(resolve(f, { ...f.posting, description: '<p>An electrical apprenticeship.</p>' }).outcome, 'matched');
  assert.equal(resolve(f, { ...p, description: '<p>Reference: AP-123</p><p>Reference: AP-456</p>' }).reason, 'REFERENCE_AMBIGUOUS');
});
test('only identity-matched expired notices count as closed', () => {
  const f = originalFixture();
  assert.equal(resolve(f, { ...f.posting, validThrough: '2026-10-20' }).outcome, 'closed');
  assert.equal(resolve(f, { ...f.posting, url: 'https://careers.example/tenant-a/job/999/', validThrough: '2026-10-20' }).outcome, 'conflicting');
  assert.equal(resolve(f, { ...f.posting, validThrough: 'not a date' }).outcome, 'unsupported');
  assert.equal(resolve(f, f.posting, { observation: null }).outcome, 'unavailable');
});
test('deadline timestamps require an explicit interpretable timezone; closing-day policy is not a closure claim', () => {
  const f = originalFixture();
  assert.equal(resolve(f, { ...f.posting, validThrough: '2026-10-29' }, { candidate: { ...f.candidate, deadlineCandidates: [{ localDate: '2026-10-29' }] } }).reason, 'CLOSING_DAY_HOLD');
  assert.equal(resolve(f, { ...f.posting, validThrough: '2026-10-29T09:00:00Z' }).outcome, 'closed');
  assert.equal(resolve(f, { ...f.posting, validThrough: '2026-10-30T09:00:00+02:00' }).outcome, 'matched');
  for (const expiry of ['2026-10-30T09:00:00', '2026-10-30T00:30:00+14:00', '2026-02-30', '2026-10-30T99:00:00Z'])
    assert.equal(resolve(f, { ...f.posting, validThrough: expiry }).reason, 'DEADLINE_UNRESOLVED');
});
test('expiry is re-evaluated after model work, without relabelling the original observation', () => {
  const f = originalFixture(), result = resolve(f);
  assert.equal(refreshOriginalResolution(result, '2026-10-30T00:00:00.000Z').reason, 'CLOSING_DAY_HOLD');
  assert.equal(refreshOriginalResolution(result, '2026-10-31T00:00:00.000Z').outcome, 'closed');
  assert.equal(result.outcome, 'matched');
  const timed = resolve(f, { ...f.posting, validThrough: '2026-10-30T09:00:00+02:00' });
  assert.equal(refreshOriginalResolution(timed, '2026-10-30T07:00:00.000Z').outcome, 'closed');
  assert.throws(() => refreshOriginalResolution(result, 'invalid'), { code: 'ORIGINAL_RESOLUTION_INPUT_INVALID' });
});
test('crawl-off, unknown origins, email and ambiguous methods remain unsupported without proposing another destination', () => {
  const f = originalFixture(); f.source.automation.employerCrawl = false;
  assert.equal(originalNoticeTarget(f.source, f.candidate).reason, 'ACQUISITION_DISABLED');
  f.source.automation.employerCrawl = true; f.source.automation.issuers = [];
  assert.equal(originalNoticeTarget(f.source, f.candidate).reason, 'ORIGIN_UNQUALIFIED');
  for (const route of [{ method: 'email', destination: 'apply@example.test' }, { method: 'physical', destination: 'Authored office' }])
    assert.equal(originalNoticeTarget(f.source, { ...f.candidate, applicationCandidates: [route] }).reason, 'METHOD_UNSUPPORTED');
  assert.equal(originalNoticeTarget(f.source, { ...f.candidate, applicationCandidates: [] }).reason, 'METHOD_AMBIGUOUS');
});
test('network/robots restrictions are unavailable; authorization and source fences are not swallowed', () => {
  for (const code of ['FETCH_TIMEOUT','UNSUPPORTED_RESPONSE','UNSAFE_ADDRESS','ROBOTS_DISALLOWED','ROBOTS_DELAY_EXCEEDS_POLICY',
    'ENOTFOUND','ECONNREFUSED','ENETUNREACH','EHOSTUNREACH','ERR_TLS_CERT_ALTNAME_INVALID','CERT_HAS_EXPIRED',
    'UNABLE_TO_VERIFY_LEAF_SIGNATURE','DEPTH_ZERO_SELF_SIGNED_CERT'])
    assert.equal(originalRetrievalFailure({ code }).outcome, 'unavailable');
  for (const code of ['WORKER_FORBIDDEN','SOURCE_CHANGED','SOURCE_PAUSED','STALE_LEASE','AI_CONFIGURATION_REQUIRED'])
    assert.equal(originalRetrievalFailure({ code }), null);
});
test('generic, malformed, multiple, oversized and script-only pages cannot create a supported notice', () => {
  const f = originalFixture();
  for (const text of ['<h1>Careers</h1>', '<script>window.notice="open"</script>', '<script type="application/ld+json">{bad</script>',
    f.observation.text + f.observation.text, 'x'.repeat(500001)]) {
    const result = resolve(f, f.posting, { observation: { url: f.url, text } });
    assert.equal(result.outcome, 'unsupported'); assert.equal(result.reason, 'LAYOUT_UNSUPPORTED');
  }
  const parsed = inspectPrimaryJobPosting(originalHtml({ ...f.posting, description: '<p>Reference: AP-123</p><script>INJECTED</script>' }));
  assert.doesNotMatch(parsed.primary.text, /INJECTED/); assert.equal(parsed.descriptionText, 'Reference: AP-123');
});
