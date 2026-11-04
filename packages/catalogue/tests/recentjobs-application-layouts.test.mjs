import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseRecentJobsDetail} from '../src/adapters/recentjobs.mjs';
import {parseRecentJobsApplicationLayouts,RECENTJOBS_APPLICATION_LAYOUTS_ADAPTER} from '../src/adapters/recentjobs-application-layouts.mjs';

const url='https://recentjobs.co.za/2026/11/04/authored-apprenticeship/';
const wrap=(body,outside='')=>`<article class="type-post"><h1 class="entry-title">Authored apprenticeship</h1><div class="entry-content">${body}</div></article>${outside}`;
const parse=body=>parseRecentJobsApplicationLayouts({html:wrap(body),url,observedOn:'2026-11-04'});
const block=(recipient='Apply@workshop.example',subject='Apprenticeship intake 2027')=>`<h2>6. How to apply</h2><p>Email application</p><p>APPLICATION EMAIL</p><p>${recipient}</p><p>Email subject:</p><p>${subject}</p>`;
const footer=(href='https://careers.workshop.example/vacancy/123?source=board',label='Apply now online')=>`<footer><div class="container"><div id="footer"><strong><a href="${href}">${label}</a></strong></div></div></footer>`;

test('labelled application email keeps exact recipient, subject and submission context as pending evidence',()=>{
  const input={html:wrap(block()+'<h2>7. Important notes</h2><p>Training is provided.</p>'),url,observedOn:'2026-11-04'};
  const baseline=parseRecentJobsDetail(input),r=parseRecentJobsApplicationLayouts(input);
  assert.equal(baseline.applicationCandidates.length,0);assert.equal(r.adapter,RECENTJOBS_APPLICATION_LAYOUTS_ADAPTER);
  assert.deepEqual(r.applicationCandidates,[{method:'email',destination:'Apply@workshop.example',originalText:'6. How to apply\nEmail application\nAPPLICATION EMAIL\nApply@workshop.example\nEmail subject:\nApprenticeship intake 2027',check:'pending'}]);
  assert.ok(r.sourceText.includes(r.applicationCandidates[0].originalText));assert.equal(r.review,'pending');
  assert.ok(!r.issues.includes('application_route_missing'));assert.ok(r.issues.includes('deadline_needs_review'));
  assert.notEqual(r.contentHash,baseline.contentHash);assert.deepEqual(parseRecentJobsApplicationLayouts(input),r);
});

test('a direct application-email label works without inventing a subject',()=>{
  const body='<h2>How to apply:</h2><p>Email address for applications:</p><p>jobs@workshop.example</p>',r=parse(body);
  assert.equal(r.applicationCandidates.length,1);assert.doesNotMatch(r.applicationCandidates[0].originalText,/subject/i);
  assert.deepEqual(r,parseRecentJobsDetail({html:wrap(body),url,observedOn:'2026-11-04'}));
  const expanded=parse(body+'<p>Email subject:</p><p>Authored intake 2027</p>');
  assert.equal(expanded.applicationCandidates.length,1);assert.ok(expanded.applicationCandidates[0].originalText.endsWith('Email subject:\nAuthored intake 2027'));
});

test('bare, poster, enquiry, form-request and forbidden email contexts remain unsupported',()=>{
  for(const body of [
    '<p>APPLICATION EMAIL</p><p>jobs@workshop.example</p>',
    '<p>Email on your supplied poster: jobs@workshop.example.</p>',
    '<h2>How to apply</h2><p>Enquiries</p><p>APPLICATION EMAIL</p><p>help@workshop.example</p>',
    block()+'<p>Contact this address for enquiries.</p>',
    block()+'<p>Request an application form first.</p>',
    block()+'<p>Do not send applications by email.</p>',
    block()+'<p>1. Do not email applications.</p>',
    block()+'<p>Do not do so.</p>',
    block()+'<p>Email applications will not be accepted.</p>',
    block()+'<p>Example application email only.</p>',
    block().replace('Apply@workshop.example','bad..email@workshop.example'),
    block().replace('Apprenticeship intake 2027',''),
    block().replace('Apprenticeship intake 2027','https://workshop.example/intake'),
  ]) {
    const input={html:wrap(body),url};
    assert.deepEqual(parseRecentJobsApplicationLayouts(input),parseRecentJobsDetail(input),body);
    assert.equal(parseRecentJobsApplicationLayouts(input).applicationCandidates.length,0);
  }
});

test('recipient multiplicity is retained; mixed or separately labelled intake scopes are never silently assigned',()=>{
  const multi=parse(block('one@workshop.example</p><p>two@workshop.example'));
  assert.deepEqual(multi.applicationCandidates.map(r=>r.destination),['one@workshop.example','two@workshop.example']);
  assert.ok(multi.issues.includes('multiple_application_routes'));
  const shared=parse(block('same@workshop.example','Electrical intake')+block('same@workshop.example','Mechanical intake'));
  assert.equal(shared.applicationCandidates.length,1);assert.ok(shared.issues.includes('programme_subject_scope_review_required'));
  assert.ok(shared.sourceText.includes('Electrical intake'));assert.ok(shared.sourceText.includes('Mechanical intake'));
  for(const suffix of ['<p>Other recipient: other@workshop.example</p>','<p>Subject: another intake</p>'])
    assert.equal(parse(block()+suffix).applicationCandidates.length,0);
});

test('only the single application action in a selected notice footer enters source evidence',()=>{
  const body='<p>Authored body requirements</p>'+footer(),input={html:wrap(body,footer('https://other.example/apply')),url};
  const baseline=parseRecentJobsDetail(input),r=parseRecentJobsApplicationLayouts(input);
  assert.equal(baseline.applicationCandidates.length,0);assert.equal(r.applicationCandidates.length,1);
  assert.deepEqual(r.applicationCandidates[0],{method:'portal',destination:'https://careers.workshop.example/vacancy/123?source=board',originalText:'Apply now online',check:'pending'});
  assert.ok(r.sourceText.includes('Authored body requirements\nApply now online'));assert.ok(!r.issues.includes('application_route_missing'));
  assert.ok(r.issues.includes('deadline_needs_review'));assert.ok(r.issues.includes('availability_not_verified'));
  assert.doesNotMatch(JSON.stringify(r),/other\.example/);
});

test('site chrome, hidden or mixed footer content, promotions and unsafe destinations stay excluded',()=>{
  const bad=[
    '<aside>'+footer()+'</aside>','<nav>'+footer()+'</nav>','<div class="comments-area">'+footer()+'</div>',
    '<div hidden>'+footer()+'</div>',
    footer().replace('<strong>','<strong hidden>'),footer().replace('<strong>','<strong style="display:none">'),
    footer().replace('</footer>','<p>Read another vacancy</p></footer>'),
    footer().replace('</footer>','<a href="https://other.example/job">Apply now</a></footer>'),
    footer().replace('Apply now online','Apply now Join our WhatsApp group'),
    footer().replace('Apply now online','<script>Apply now online</script>'),
    footer().replace('<strong>','<strong><iframe src="https://other.example/"></iframe>'),
    ...['http://workshop.example/apply','https://127.0.0.1/apply','https://[::1]/apply','https://user:secret@workshop.example/apply','https://workshop.internal/apply',
      'https://recentjobs.co.za/2026/11/04/other/','https://whatsapp.com/apply','javascript:alert(1)','https://workshop.example:8443/apply'].map(h=>footer(h)),
  ];
  for(const body of bad) {
    const input={html:wrap('<p>Current notice</p>'+body),url};
    assert.deepEqual(parseRecentJobsApplicationLayouts(input),parseRecentJobsDetail(input),body);
    assert.equal(parseRecentJobsApplicationLayouts(input).applicationCandidates.length,0);
  }
  const outside={html:wrap('<p>Current notice</p>',footer()),url};
  assert.deepEqual(parseRecentJobsApplicationLayouts(outside),parseRecentJobsDetail(outside));
});

test('a separate explicit social invitation is discarded without importing its wording or destination',()=>{
  const social='<div><strong><a href="https://whatsapp.com/channel/authored">Join our WhatsApp group </a></strong></div>';
  const r=parse('<p>Current notice</p>'+footer().replace('<div class="container">','<div class="container">'+social));
  assert.equal(r.applicationCandidates.length,1);assert.equal(r.applicationCandidates[0].method,'portal');
  assert.ok(r.sourceText.includes('Apply now online'));assert.doesNotMatch(r.sourceText,/WhatsApp|Join our/i);
  assert.doesNotMatch(JSON.stringify(r.applicationCandidates),/whatsapp/i);
  for(const invalid of [social.replace('whatsapp.com','other.example'),social.replace('Join our WhatsApp group','Apply now'),social.replace('https:','http:')]) {
    const input={html:wrap('<p>Current notice</p>'+footer().replace('<div class="container">','<div class="container">'+invalid)),url};
    assert.deepEqual(parseRecentJobsApplicationLayouts(input),parseRecentJobsDetail(input));
  }
});

test('existing routes stay intact and independent footer destinations remain multiple pending candidates',()=>{
  const r=parse('<a href="https://workshop.example/jobs/1">Apply now</a>'+footer());
  assert.equal(r.applicationCandidates.length,2);assert.ok(r.issues.includes('multiple_application_routes'));
  assert.ok(r.applicationCandidates.every(c=>c.check==='pending'));
  const same=parse('<a href="https://workshop.example/jobs/1">Apply now</a>'+footer('https://workshop.example/jobs/1'));
  assert.equal(same.applicationCandidates.length,1);
});

test('unchanged notices retain legacy hashes, while both added layouts are bound into the new hash',()=>{
  const original={html:wrap('<p>Closing date: 13 November 2026</p><a href="https://workshop.example/jobs/1">Apply now</a>'),url};
  assert.deepEqual(parseRecentJobsApplicationLayouts(original),parseRecentJobsDetail(original));
  const combined=parse(block()+footer()),{contentHash,observedOn,review,issues,...fields}=combined;
  assert.equal(combined.applicationCandidates.length,2);assert.equal(combined.adapter,RECENTJOBS_APPLICATION_LAYOUTS_ADAPTER);
  assert.equal(contentHash,createHash('sha256').update(JSON.stringify(fields)).digest('hex'));
  assert.notEqual(combined.contentHash,parse(block('Other@workshop.example')+footer()).contentHash);
  assert.notEqual(combined.contentHash,parse(block()+footer('https://workshop.example/jobs/other')).contentHash);
});

test('existing source, observation, body and embedded-notice fences still reject invalid inputs',()=>{
  for(const input of [{html:wrap(block()),url:'http://recentjobs.co.za/2026/11/04/authored-apprenticeship/'},
    {html:'x'.repeat(500001),url},{html:wrap(block()),url,observedOn:'2026-02-30'},
    {html:wrap('<article><h1>Another advert</h1>'+footer()+'</article>'),url}]) assert.throws(()=>parseRecentJobsApplicationLayouts(input));
});
