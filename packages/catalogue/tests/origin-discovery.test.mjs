import { test } from 'node:test';
import assert from 'node:assert/strict';
import { corporateLink, corporateRecruitmentRoot, issuerHint, probeUrl, makeDelegation, delegationDocument, readDelegation } from '../src/origin-discovery.mjs';
import { EmployerRelationship, Source } from '../src/schemas.mjs';
import { relationshipBinding, issuerNameKey, relationshipKeys, legacyRelationshipKeys, relationshipDocument, readRelationship } from '../src/issuer-registry.mjs';
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
test('semantic and prose careers layouts accept identical repeated headings but exclude page chrome and conflicting content',()=>{
 const a=`<a href="${link}">View jobs</a>`;
 for(const html of [`<main><header class="page-header"><h1>Careers</h1></header>${a}</main>`,`<div role="main"><h1>Careers</h1>${a}</div>`,`<div><h1>Careers</h1><div><h1>CAREERS</h1><p>${a}</p><h1>Join our team</h1></div></div>`,
  `<div role="navigation"><h1>Other careers</h1>${a}</div><div><h1>Careers</h1><p>${a}</p></div>`,
  `<div class="header-wrapper"><h1>Other careers</h1>${a}</div><div><h1>Careers</h1><p>${a}</p></div>`])assert.equal(corporateLink(html,page,target),link);
 for(const html of [`<h1>Careers</h1><p>${a}</p>`,`<div><h1>Careers</h1>${a}</div>`,`<div><h1>Careers</h1><h1>Other careers</h1><p>${a}</p></div>`,
  `<div><h1>Careers</h1><div class="footer-wrapper"><p>${a}</p></div></div>`,careers(`<div role="navigation">${a}</div>`),
  `<div role="main"><h1>Careers</h1>${a}</div><main><h1>Careers</h1>${a}</main>`,`<base href="https://other.example/">${careers(a)}`,
  careers(`<div hidden><base href="https://other.example/"></div>${a}`)])assert.equal(corporateLink(html,page,target),null);
});
test('remote disclaimers cannot hide warnings about the link or contradict an explicit application endorsement',()=>{
 const a=`<a href="${link}">career website</a>`,html=s=>`<div><h1>Careers</h1><p>${s}</p></div>`;
 assert.equal(corporateLink(html(`Our process does not require advance payments. Candidates can apply for a vacancy through our ${a}.`),page,target),link);
 for(const s of [`Do not apply through our ${a}.`,`Never use this portal. Apply through our ${a}.`,`This website is not official. Apply through our ${a}.`,
  `The portal is not recommended. Apply through our ${a}.`,`We do not request payments. Our ${a}.`,`Beware of fake offers. Apply through our ${a}.`,
  `This link is not authorised. Apply through our ${a}.`,`This site is not authentic. Apply through our ${a}.`,`This service is not trusted. Apply through our ${a}.`])assert.equal(corporateLink(html(s),page,target),null);
 const root='https://ats.example/';assert.equal(corporateLink(careers(`<p><a href="${link}">View jobs</a></p><p>Never use <a href="${root}">this portal</a></p>`),page,target),null);
 assert.equal(corporateLink(careers(`<p><a href="${link}">View jobs</a></p><p><a href="${target}">Fake job</a></p>`),page,target),null);
});
test('root recruitment scopes require an explicitly linked subdomain of the reviewed apex/www corporate domain',()=>{
 for(const [corp,root]of [['https://www.authored-forge.co.za/careers/','https://jobs.authored-forge.co.za/'],['https://authored-forge.com/careers/','https://careers.authored-forge.com/']]){
  assert.equal(corporateRecruitmentRoot(corp,root),true);assert.equal(corporateLink(careers(`<a href="${root}">View jobs</a>`),corp,root+'job/123/'),root);
 }
 for(const [corp,root]of [['https://www.co.za/careers/','https://jobs.attacker.co.za/'],['https://www.authored-forge.co.za/careers/','https://jobs.other.co.za/'],
  ['https://team.authored-forge.com/careers/','https://jobs.authored-forge.com/'],['https://www.authored-forge.com/careers/','https://ats.example/'],
  ['https://www.authored-forge.com/careers/','https://jobs.authored-forge.com.evil.net/'],['https://www.authored-forge.com/careers/','https://www.authored-forge.com/'],
  ['https://www.github.io/careers/','https://jobs.other.github.io/'],['https://tenant.github.io/careers/','https://jobs.tenant.github.io/'],
  ['https://www.authored-forge.unknownsuffix/careers/','https://jobs.authored-forge.unknownsuffix/']]){
  assert.equal(corporateRecruitmentRoot(corp,root),false);assert.equal(corporateLink(careers(`<a href="${root}">View jobs</a>`),corp,root+'job/123/'),null);
 }
});
test('V2 root proofs are bounded and parent-linked; old path proofs preserve their exact JSON and binding',()=>{
 const a=anchor(),old=makeDelegation(a,link,{now:a.reviewedAt,snapshotId:'authored_snapshot',sourceId:'authored_publisher',sourceRevision:1});
 const {scopeKind,...legacy}=old;legacy.version='corporate_delegation_v1';assert.deepEqual(readDelegation({exists:true,id:legacy.id,data:()=>delegationDocument(legacy)}),legacy);
 const corp=EmployerRelationship.parse({...a,route:{...a.route,host:'www.authored-forge.co.za',pathPrefix:'/'},delegationPage:'https://www.authored-forge.co.za/careers/'}),root='https://jobs.authored-forge.co.za/';
 const r=makeDelegation(corp,root,{now:corp.reviewedAt,snapshotId:'authored_snapshot',sourceId:'authored_publisher',sourceRevision:1});assert.equal(r.scopeKind,'corporate_subdomain');assert.equal(r.route.pathPrefix,'/');
 assert.deepEqual(readDelegation({exists:true,id:r.id,data:()=>delegationDocument(r)}),r);
 for(const forged of [{...r,scopeKind:'linked_path'},{...r,version:'corporate_delegation_v1',scopeKind:undefined},{...r,corporateUrl:'https://www.other.co.za/careers/'}])
  assert.throws(()=>readDelegation({exists:true,id:r.id,data:()=>delegationDocument(forged)}),{code:'ORIGIN_PROOF_INVALID'});
 assert.throws(()=>makeDelegation(a,'https://ats.example/',{now:a.reviewedAt,snapshotId:'authored_snapshot',sourceId:'authored_publisher',sourceRevision:1}),{code:'ORIGIN_PROOF_INVALID'});
});
test('unsupported, hidden, navigation, footer, ambiguous and warning content cannot qualify delegation',()=>{
  const a=`<a href="${link}">View jobs</a>`;
  for(const html of [a,`<main><h1>Careers</h1></main><footer>${a}</footer>`,careers(`<nav>${a}</nav>`),careers(`<aside>${a}</aside>`),
    careers(`<div hidden>${a}</div>`),careers(`<div style="display:none">${a}</div>`),careers(`<script>${a}</script>`),
    careers(`<a href="${link}">Avoid these fake jobs</a>`),careers(`<a href="https://ats.example/">Jobs</a>`),
    careers(`<p>Beware of this portal: ${a}</p>`),careers(`<p>${a}</p><p>Never use ${a}</p>`),
    careers(`<a href="${link}?tenant=other">Jobs</a>`),careers(`<a href="https://ats.example/tenant-b/">Jobs</a>`),
    careers(a)+careers(a),careers(a+'<h1>More careers</h1>'),careers('<div>'.repeat(110)+a+'</div>'.repeat(110)),
    careers('<div hidden>'+'<i></i>'.repeat(21000)+'</div>'+a),'x'.repeat(500001)]) assert.equal(corporateLink(html,page,target),null);
});
test('a posting corporate hint is a bounded lookup hint, not trust or a URL to fetch',()=>{
  const f=originalFixture();
  assert.deepEqual(issuerHint(f.observation.text),{issuer:'Fictional Workshop',host:null});
  assert.deepEqual(issuerHint(originalHtml({...f.posting,hiringOrganization:{name:'Fictional Workshop',sameAs:'https://corporate.example/about/'}})),{issuer:'Fictional Workshop',host:'corporate.example'});
  for(const sameAs of [[],[[]],null,{},[['https://corporate.example/']],['https://corporate.example/','https://other.example/'],'http://corporate.example/','https://127.0.0.1/','https://corporate.example/?claim=official'])
    assert.equal(issuerHint(originalHtml({...f.posting,hiringOrganization:{name:'Fictional Workshop',sameAs}})),null);
});
test('reviewed corporate anchors index exact normalized names and aliases without changing authority bindings',()=>{
  const r=anchor();r.route.aliases=['AUTHORED FORGE','Ｆｉｃｔｉｏｎａｌ Workshop'];
  assert.equal(issuerNameKey('  FICTIONAL\nWorkshop '),issuerNameKey(r.route.name));
  assert.equal(issuerNameKey(r.route.aliases[1]),issuerNameKey(r.route.name));
  assert.notEqual(issuerNameKey('Fictional Workshop Group'),issuerNameKey(r.route.name));
  assert.equal(issuerNameKey('x'.repeat(201)),null);
  assert.ok(relationshipKeys(r).includes(issuerNameKey('authored forge')));
  assert.equal(relationshipKeys(r).filter(k=>k.startsWith('issuer_name_index_v1:')).length,2);
  const modern=relationshipDocument(r),legacy={...modern,routeKeys:legacyRelationshipKeys(r)};
  const snapshot=data=>({exists:true,id:r.id,data:()=>data});
  assert.deepEqual(relationshipBinding(readRelationship(snapshot(legacy))),relationshipBinding(readRelationship(snapshot(modern))));
  assert.throws(()=>readRelationship(snapshot({...modern,routeKeys:[...modern.routeKeys,issuerNameKey('Other')]})),{code:'ISSUER_REGISTRY_INVALID'});
  const {delegationPage,...atsOnly}=r;assert.deepEqual(relationshipKeys(atsOnly),legacyRelationshipKeys(atsOnly));
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
