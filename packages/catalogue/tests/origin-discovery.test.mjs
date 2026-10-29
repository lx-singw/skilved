import { test } from 'node:test';
import assert from 'node:assert/strict';
import { corporateLink, issuerHint, probeUrl, makeDelegation, delegationDocument, readDelegation } from '../src/origin-discovery.mjs';
import { EmployerRelationship, Source } from '../src/schemas.mjs';
import { relationshipBinding } from '../src/issuer-registry.mjs';
import { originalFixture, originalHtml } from './fixtures/original-notices.mjs';
const target = 'https://ats.example/tenant-a/job/123/';
const page = 'https://corporate.example/careers/';
const link = 'https://ats.example/tenant-a/';
const careers = content => `<main><h1>Careers</h1>${content}</main>`;
const anchor = () => EmployerRelationship.parse({ id:'corporate_authority',revision:1,state:'qualified',categories:['apprenticeship'],
  reviewedAt:'2026-10-29T10:00:00.000Z',expiresAt:'2026-11-01T10:00:00.000Z',delegationPage:page,
  route:{name:'Fictional Workshop',host:'corporate.example',pathPrefix:'/careers/',evidence:'Authored corporate authority'} });
test('corporate links establish the explicitly linked tenant scope, selecting the narrowest scope',()=>{
  const html=careers(`<a href="${link}">View jobs</a><a href="${link}job/">Current vacancies</a>`);
  assert.equal(corporateLink(html,page,target),link+'job/');
  assert.equal(corporateLink(careers(`<a href="${link}">View jobs</a>`),page,target),link);
  assert.equal(corporateLink(html,page,'https://ats.example/tenant-a-other/job/123/'),null);
});
test('unsupported, hidden, navigation, footer, ambiguous and warning content cannot qualify delegation',()=>{
  const a=`<a href="${link}">View jobs</a>`;
  for(const html of [a,`<main><h1>Careers</h1></main><footer>${a}</footer>`,careers(`<nav>${a}</nav>`),careers(`<aside>${a}</aside>`),
    careers(`<div hidden>${a}</div>`),careers(`<div style="display:none">${a}</div>`),careers(`<script>${a}</script>`),
    careers(`<a href="${link}">Avoid these fake jobs</a>`),careers(`<a href="https://ats.example/">Jobs</a>`),
    careers(`<p>Beware of this portal: ${a}</p>`),careers(`<p>${a}</p><p>Never use ${a}</p>`),
    careers(`<a href="${link}?tenant=other">Jobs</a>`),careers(`<a href="https://ats.example/tenant-b/">Jobs</a>`),
    careers(a)+careers(a),careers(a+'<h1>More careers</h1>'),'x'.repeat(500001)]) assert.equal(corporateLink(html,page,target),null);
});
test('a posting corporate hint is a bounded lookup hint, not trust or a URL to fetch',()=>{
  const f=originalFixture();
  assert.equal(issuerHint(f.observation.text),null);
  assert.deepEqual(issuerHint(originalHtml({...f.posting,hiringOrganization:{name:'Fictional Workshop',sameAs:'https://corporate.example/about/'}})),{issuer:'Fictional Workshop',host:'corporate.example'});
  for(const sameAs of [['https://corporate.example/','https://other.example/'],'http://corporate.example/','https://127.0.0.1/','https://corporate.example/?claim=official'])
    assert.equal(issuerHint(originalHtml({...f.posting,hiringOrganization:{name:'Fictional Workshop',sameAs}})),null);
});
test('read probes reject intermediaries, private syntax and ambiguous encoded paths',()=>{
  for(const url of ['http://ats.example/tenant/','https://u:p@ats.example/tenant/','https://ats.example:444/tenant/','https://ats.example/tenant/#x',
    'https://studentroom.co.za/job/','https://bit.ly/job/','https://127.0.0.1/','https://host.internal/','https://ats.example/tenant%2fother/'])
    assert.equal(probeUrl(url),null);
  assert.equal(probeUrl(target).href,target);
});
test('only an explicit in-scope corporate page can be a delegation anchor; legacy fingerprints remain stable',()=>{
  const a=anchor(), {delegationPage,...legacy}=a;
  assert.deepEqual(relationshipBinding(EmployerRelationship.parse(legacy)),relationshipBinding(legacy));
  for(const delegationPage of ['https://other.example/careers/','https://corporate.example/other/','http://corporate.example/careers/','https://corporate.example/careers/?x=1'])
    assert.equal(EmployerRelationship.safeParse({...a,delegationPage}).success,false);
  const source=originalFixture().source;
  assert.equal(Source.safeParse({...source,automation:{...source.automation,originDiscovery:'shadow_v1'}}).success,false);
});
test('derived scope carries its parent, clears email authority and expires within six hours and parent validity',()=>{
  const a=anchor();a.route.emailAddresses=['apply@authored.example'];
  const r=makeDelegation(a,link,{now:a.reviewedAt,snapshotId:'authored_snapshot',sourceId:'authored_publisher',sourceRevision:1});
  assert.equal(r.route.host,'ats.example');assert.equal(r.route.pathPrefix,'/tenant-a/');assert.deepEqual(r.route.emailAddresses,[]);
  assert.equal(r.expiresAt,'2026-10-29T16:00:00.000Z');
  assert.deepEqual(readDelegation({exists:true,id:r.id,data:()=>delegationDocument(r)}),r);
  assert.throws(()=>readDelegation({exists:true,id:r.id,data:()=>({...delegationDocument(r),routeKeys:['portal:wrong.example']})}),{code:'ORIGIN_PROOF_INVALID'});
  assert.equal(makeDelegation({...a,expiresAt:'2026-10-29T11:00:00.000Z'},link,{now:a.reviewedAt,snapshotId:'authored_snapshot',sourceId:'authored_publisher',sourceRevision:1}).expiresAt,'2026-10-29T11:00:00.000Z');
  const longPage=EmployerRelationship.parse({...a,route:{...a.route,pathPrefix:'/'},delegationPage:'https://corporate.example/'+ 'x'.repeat(1850)+'/'});
  assert.ok(makeDelegation(longPage,link,{now:a.reviewedAt,snapshotId:'authored_snapshot',sourceId:'authored_publisher',sourceRevision:1}).route.evidence.length<2000);
  const longScope='https://ats.example/'+ 'x'.repeat(501)+'/';
  assert.equal(corporateLink(careers(`<a href="${longScope}">Jobs</a>`),page,longScope+'job/'),null);
  assert.throws(()=>makeDelegation(a,longScope,{now:a.reviewedAt,snapshotId:'authored_snapshot',sourceId:'authored_publisher',sourceRevision:1}),{code:'ORIGIN_PROOF_INVALID'});
});
