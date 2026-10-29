import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parsePrimaryJobPosting,inspectPrimaryJobPosting} from '../src/adapters/primary-jobposting.mjs';
import {resolveOriginalNotice} from '../src/original-notice-resolver.mjs';
import {issuerHint} from '../src/origin-discovery.mjs';
import {originalFixture,originalMicrodataHtml,originalHtml} from './fixtures/original-notices.mjs';
const unsupported = html => assert.throws(()=>inspectPrimaryJobPosting(html),{code:'PRIMARY_NOTICE_UNSUPPORTED'});
const resolve = (f,html) => resolveOriginalNotice({...f,observation:{url:f.url,text:html}});

test('shared Microdata parses distinct employers and corroborates the exact vacancy without employer branches',()=>{
 for(const [issuer,host] of [['Authored Forge','jobs.example'],['Imaginary Works','careers.example'],['Fictional Tools','tenant.example']]){
  const f=originalFixture({issuer,host}),html=originalMicrodataHtml(f.posting),p=inspectPrimaryJobPosting(html),r=resolve(f,html);
  assert.equal(p.adapter,'jobposting_microdata_v1');assert.equal(p.primary.issuer,issuer);assert.equal(p.identifier.value,'AP-123');assert.match(p.descriptionText,/\nReference: AP-123$/);
  assert.equal(r.outcome,'matched');assert.equal(r.adapter,p.adapter);assert.equal(r.version,'original_jobposting_v2');assert.deepEqual(r.primary,parsePrimaryJobPosting(html));
  assert.throws(()=>parsePrimaryJobPosting(html,{allowMicrodata:false}),{code:'PRIMARY_NOTICE_UNSUPPORTED'});
 }
});
test('literal organization names do not invent a corporate URL or authority hint',()=>{
 const f=originalFixture(),html=originalMicrodataHtml(f.posting).replace(/<div itemprop="hiringOrganization"[\s\S]*?<\/div>/,'<meta itemprop="hiringOrganization" content="Fictional Workshop">');
 assert.equal(parsePrimaryJobPosting(html).issuer,'Fictional Workshop');assert.equal(issuerHint(html),null);assert.equal(resolve(f,html).outcome,'matched');
 f.source.automation.issuers=[];assert.equal(resolve(f,html).reason,'ORIGIN_UNQUALIFIED');
});
test('item scopes keep nested place and unrelated organizations out of the hiring organization',()=>{
 const f=originalFixture(),html=originalMicrodataHtml(f.posting).replace('<time itemprop=',`<div itemprop="jobLocation" itemscope itemtype="http://schema.org/Place"><span itemprop="name">Authored Town</span><div itemprop="address" itemscope itemtype="https://schema.org/PostalAddress"><span itemprop="addressCountry">ZA</span></div></div><time itemprop=`)
  .replace('</body>','<div itemscope itemtype="https://schema.org/Organization"><meta itemprop="name" content="Unrelated"><link itemprop="url" href="https://unrelated.example/"></div></body>');
 const p=inspectPrimaryJobPosting(html);assert.equal(p.primary.issuer,f.posting.hiringOrganization.name);assert.equal(issuerHint(html),null);
 assert.equal(JSON.parse(p.primary.text).jobLocation.address.addressCountry,'ZA');
 const scoped=originalMicrodataHtml({...f.posting,hiringOrganization:{...f.posting.hiringOrganization,url:'https://corporate.example/'}});
 assert.deepEqual(issuerHint(scoped),{issuer:f.posting.hiringOrganization.name,host:'corporate.example'});
});
test('descriptions retain paragraph, entity and reference evidence without executable or hidden material',()=>{
 const f=originalFixture(),p=inspectPrimaryJobPosting(originalMicrodataHtml({...f.posting,description:'<p>Grade 12 &amp; N3; x &lt; 5.</p><p>Reference: AP-123</p><script>INJECTED</script><div hidden>HIDDEN</div><form>FORM</form>'}));
 assert.equal(p.descriptionText,'Grade 12 & N3; x < 5.\nReference: AP-123');assert.doesNotMatch(p.primary.text,/INJECTED|HIDDEN|FORM/);
});
test('multiple postings, duplicate identity properties, external item references and unsupported scopes are held',()=>{
 const f=originalFixture(),h=originalMicrodataHtml(f.posting);
 for(const html of [h+h,h+originalHtml(f.posting),h.replace('<h1 itemprop=', '<meta itemprop="title" content="Other"><h1 itemprop='),
  h.replace('<time itemprop=', '<meta itemprop="validThrough" content="2026-11-01"><time itemprop='),
  h.replace('<section itemscope','<section itemref="elsewhere" itemscope'),h.replace('<h1 itemprop=','<div itemref="elsewhere"></div><h1 itemprop='),
  h.replace('https://schema.org/Organization','https://other.example/Organization'),h.replace('<section itemscope','<section hidden itemscope'),
  h.replace('<head>','<head><base href="https://other.example/">'),h.replace('<div itemprop="description">','<div itemprop="description" itemscope itemtype="https://schema.org/Thing">'),
  h.replace('<p>Fictional Workshop','<p><span itemscope itemtype="https://schema.org/Person">Someone</span>Fictional Workshop')])unsupported(html);
});
test('all supplied bindings and recruitment references must still agree, including Microdata itemid',()=>{
 const f=originalFixture();
 for(const [posting,canonical,reason] of [[{...f.posting,url:f.url+'?other=1'},f.url,'VACANCY_URL_CONFLICT'],
  [{...f.posting,'@id':'https://other.example/123'},f.url,'VACANCY_URL_CONFLICT'],[f.posting,'https://other.example/123','VACANCY_URL_CONFLICT'],
  [{...f.posting,description:'<p>Reference: AP-999</p>'},f.url,'REFERENCE_CONFLICT']])assert.equal(resolve(f,originalMicrodataHtml(posting,canonical)).reason,reason);
 const contradictoryPage=originalMicrodataHtml(f.posting).replace('<time itemprop=',`<div itemprop="mainEntityOfPage" itemscope itemtype="https://schema.org/WebPage" itemid="${f.url}"><link itemprop="url" href="https://other.example/123"></div><time itemprop=`);
 assert.equal(resolve(f,contradictoryPage).reason,'VACANCY_URL_CONFLICT');
 const noUrl={...f.posting};delete noUrl.url;assert.equal(resolve(f,originalMicrodataHtml(noUrl,f.url)).outcome,'matched');
 const noRef=originalFixture({reference:null}),p={...noRef.posting};delete p.url;assert.equal(resolve(noRef,originalMicrodataHtml(p,noRef.url)).reason,'VACANCY_BINDING_MISSING');
});
test('raw date values survive parsing; legacy timestamps and South African day rollover stay unresolved',()=>{
 const f=originalFixture();
 for(const date of ['Fri Oct 30 22:00:00 UTC 2026','2026-10-30T22:00:00Z','2026-10-30T09:00:00']){
  const html=originalMicrodataHtml({...f.posting,validThrough:date});assert.equal(parsePrimaryJobPosting(html).validThrough,date);assert.equal(resolve(f,html).reason,'DEADLINE_UNRESOLVED');
 }
 assert.equal(resolve(f,originalMicrodataHtml({...f.posting,validThrough:'2026-10-30T09:00:00+02:00'})).outcome,'matched');
 assert.equal(resolve(f,originalMicrodataHtml({...f.posting,validThrough:'2026-10-20'})).outcome,'closed');
 f.source.automation.employerCrawl=false;assert.equal(resolve(f,originalMicrodataHtml(f.posting)).reason,'ACQUISITION_DISABLED');
});
test('byte, depth and node bounds reject oversized input before facts can be projected',()=>{
 const h=originalMicrodataHtml(originalFixture().posting);unsupported('x'.repeat(500001));unsupported('<div>'.repeat(101)+h+'</div>'.repeat(101));unsupported('<i></i>'.repeat(20001)+h);
});
