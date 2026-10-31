import{test}from'node:test';import assert from'node:assert/strict';
import{recruitingFixture,recruitingHtml}from'./fixtures/recruiting-marketing.mjs';
import{inspectPrimaryJobPosting,parsePrimaryJobPosting}from'../src/adapters/primary-jobposting.mjs';
import{resolveOriginalNotice,refreshOriginalResolution}from'../src/original-notice-resolver.mjs';
const resolve=(f,html=recruitingHtml(f))=>resolveOriginalNotice({...f,observation:{url:f.url,text:html}});
test('canonical and posting-owned declared actions bind multiple employers without injecting structured URLs or references',()=>{
 for(const [issuer,host,id]of [['Authored Forge','jobs.example','123456'],['Imaginary Tools','careers.example','99887766554433221100']]){
  const f=recruitingFixture({issuer,host,id}),html=recruitingHtml(f),p=inspectPrimaryJobPosting(html),r=resolve(f,html);
  assert.equal(p.actionBinding.outcome,'supported');assert.equal(p.postingUrl,null);assert.equal(p.identifier,null);assert.equal(r.outcome,'matched');
  assert.equal(r.version,'original_jobposting_v5');assert.equal(r.vacancyBinding.kind,'rmk_apply_action');assert.equal(r.vacancyBinding.evidence.platformId,id);
  assert.deepEqual(r.vacancyBinding.evidence.applicationUrls,[f.action]);assert.deepEqual(r.vacancyBinding.evidence.controlKinds,['a','button']);
  assert.equal(JSON.parse(p.primary.text).url,undefined);assert.equal(JSON.parse(p.primary.text).identifier,undefined);assert.deepEqual(parsePrimaryJobPosting(html),p.primary);
  assert.equal(f.candidate.applicationCandidates[0].destination,f.url);
 }
});
test('different job actions or origins conflict even when another structured URL agrees',()=>{
 const f=recruitingFixture();for(const action of [f.action.replace('/123456/','/999999/'),f.action.replace('jobs.example','other.example')]){
  assert.equal(resolve(f,recruitingHtml(f,{action})).reason,'VACANCY_ACTION_CONFLICT');
  assert.equal(resolve(f,recruitingHtml(f,{action,posting:{...f.posting,url:f.url}})).reason,'VACANCY_ACTION_CONFLICT');
 }
 assert.equal(resolve(f,recruitingHtml(f,{canonical:f.url.replace('/123456/','/999999/')})).reason,'VACANCY_URL_CONFLICT');
});
test('unsafe queries, disabled/hidden/warning controls and excess controls remain unsupported, never closure',()=>{
 const f=recruitingFixture(),control=(attrs='',label='Apply now')=>`<a ${attrs} href="${f.action}">${label}</a>`;
 for(const options of [{action:f.action+'&jobid=999'},{action:f.action+'&locale=en_US'},{action:f.action.replace('https:','http:')},
  {controls:control('hidden')},{controls:control('aria-disabled="true"')},{controls:`<div style="display:none">${control()}</div>`},
  {controls:`<p>Never use ${control()}</p>`},{controls:control('','Fake Apply now')},{controls:control().repeat(9)}]){
  const r=resolve(f,recruitingHtml(f,options));assert.equal(r.reason,'VACANCY_ACTION_UNSUPPORTED');assert.equal(r.outcome,'unsupported');
 }
});
test('canonical alone, controls outside the posting, descriptions, navigation and nested items cannot bind a vacancy',()=>{
 const f=recruitingFixture(),a=`<a href="${f.action}">Apply now</a>`;
 for(const controls of ['',`<nav>${a}</nav>`,`<footer>${a}</footer>`,`<div itemscope itemtype="https://schema.org/Thing">${a}</div>`])assert.equal(resolve(f,recruitingHtml(f,{controls})).reason,'VACANCY_BINDING_MISSING');
 assert.equal(resolve(f,recruitingHtml(f,{controls:''}).replace('</body>',a+'</body>')).reason,'VACANCY_BINDING_MISSING');
 const p={...f.posting,description:f.posting.description+a};assert.equal(resolve(f,recruitingHtml(f,{posting:p,controls:''})).reason,'VACANCY_BINDING_MISSING');
});
test('platform action IDs cannot stand in for recruitment references; deadline disagreement still holds',()=>{
 const f=recruitingFixture({reference:'AP-123'}),posting={...f.posting,description:'<p>An electrical apprenticeship.</p>',identifier:{name:'RMK Specific ID',value:f.id}};
 assert.equal(resolve(f,recruitingHtml(f,{posting})).reason,'REFERENCE_UNCORROBORATED');
 const numeric=recruitingFixture({reference:'123456'}),body='<p>An electrical apprenticeship.</p>';
 for(const name of [null,'RMK Specific ID','rmk_job_id','Recruiting Marketing Job ID']){
  const p={...numeric.posting,description:body,...(name?{identifier:{name,value:numeric.id}}:{})};
  assert.equal(resolve(numeric,recruitingHtml(numeric,{posting:p})).reason,'REFERENCE_UNCORROBORATED');
 }
 const g=recruitingFixture();assert.equal(resolve(g,recruitingHtml(g,{posting:{...g.posting,validThrough:'Fri Oct 30 22:00:00 UTC 2026'}})).reason,'DEADLINE_CONFLICT');
 assert.equal(resolve(g,recruitingHtml(g,{posting:{...g.posting,validThrough:'2026-10-20'}})).outcome,'closed');
});
test('V4 refresh fences old policy and changed action proof while retaining normal expiry evaluation',()=>{
 const f=recruitingFixture(),r=resolve(f);assert.equal(refreshOriginalResolution(r,f.now).outcome,'matched');
 assert.equal(refreshOriginalResolution({...r,version:'original_jobposting_v3'},f.now).reason,'RESOLVER_POLICY_CHANGED');
 const changed=structuredClone(r);changed.vacancyBinding.evidence.platformId='999';assert.equal(refreshOriginalResolution(changed,f.now).reason,'VACANCY_BINDING_CHANGED');
 assert.equal(refreshOriginalResolution(r,'2026-10-31T00:00:00.000Z').outcome,'closed');
});
