import {test} from 'node:test';import assert from 'node:assert/strict';
import {authoredPdf} from './fixtures/onboarding-pdf.mjs';import {onboardingFixture} from './fixtures/employer-onboarding.mjs';
import {decodePdfEvidence,verifyPdfEvidence,PdfEvidence,pdfIdentityMaterial} from '../src/onboarding-pdf.mjs';
import {OnboardingBundle,evaluateOnboarding,onboardingHash} from '../src/employer-onboarding.mjs';
import {collectEmployerOnboarding} from '../src/employer-onboarding-collector.mjs';

test('bounded text-only PDF decoding pins original bytes and rejects forged derived evidence',async()=>{
 const bytes=authoredPdf('Authored Forge\nCompany website: www.corporate.example'),p=await decodePdfEvidence(bytes);
 assert.equal(p.pages,1);assert.match(p.text,/Authored Forge Company website: www.corporate.example/);assert.equal(p.bytes,bytes.length);
 assert.deepEqual(Buffer.from(p.base64,'base64'),bytes);assert.deepEqual(await verifyPdfEvidence(p),p);
 for(const changed of [{...p,sha256:'0'.repeat(64)},{...p,bytes:p.bytes+1},{...p,base64:p.base64+'\n'},{...p,pages:21}])assert.equal(PdfEvidence.safeParse(changed).success,false);
 for(const changed of [{...p,text:p.text+' invented'},{...p,pages:2}])await assert.rejects(verifyPdfEvidence(changed),{code:'PDF_EVIDENCE_CHANGED'});
});
test('invalid, oversized, empty and too-many-page documents fail closed',async()=>{
 for(const bytes of [Buffer.from('<html>Not PDF</html>'),Buffer.from('%PDF-1.7 damaged'),Buffer.alloc(400001),authoredPdf(''),authoredPdf('Authored identity',{pages:21})])
  await assert.rejects(decodePdfEvidence(bytes),{code:'PDF_EVIDENCE_UNSUPPORTED'});
});
test('printed corporate website hosts are exact, explicit and warning sensitive; emails do not qualify',async()=>{
 const target='https://corporate.example/';
 for(const website of ['https://corporate.example/people','http://corporate.example/Home/Links','www.corporate.example']){
  // The www form is a different host, so only an exactly matching plan can use it.
  const expected=website.startsWith('www.')?'https://www.corporate.example/':target;
  const material=pdfIdentityMaterial(await decodePdfEvidence(authoredPdf(`Authored Forge\nCompany website ${website}`)),expected);
  assert.ok(material.links.some(l=>!l.denied&&l.href===expected));assert.equal(material.links[0].printed,website);
 }
 for(const website of ['contact@corporate.example','contact@www.corporate.example','https://corporate.example.evil.test','https://corporate.example@evil.test','https://user@corporate.example','www.other.example'])
  assert.equal(pdfIdentityMaterial(await decodePdfEvidence(authoredPdf(`Authored Forge\n${website}`)),target).links.length,0);
 const warning=pdfIdentityMaterial(await decodePdfEvidence(authoredPdf('Authored Forge\nAvoid the fake website https://corporate.example/')),target);
 assert.ok(warning.links.every(l=>l.denied));
});
test('PDF identity capture supports reusable company onboarding without auto qualification or changing legacy HTML hashes',async()=>{
 const f=onboardingFixture(),legacy=structuredClone(f.bundle);assert.equal(onboardingHash(OnboardingBundle.parse(legacy)),onboardingHash(legacy));
 const plan={...f.plan,identityUrl:'https://directory.example/notices/company.pdf',identityFormat:'pdf'},requests=[];
 const captured=await collectEmployerOnboarding(plan,{now:()=>f.bundle.observations[0].at,sleep:async()=>{},fetcher:async(s,url,_io,format)=>{
  requests.push({url,format,limit:s.maxBytes});if(url.endsWith('/robots.txt'))return{url,text:'User-agent: *\nAllow: /'};
  if(url===plan.identityUrl)return{url,data:authoredPdf('Authored Forge\nCompany website https://corporate.example/')};return{url,text:f.pages.get(url)};
 }});
 assert.equal(requests.length,5);assert.deepEqual(requests.find(r=>r.url===plan.identityUrl),{url:plan.identityUrl,format:'pdf',limit:400000});
 assert.equal(captured.providerCalls,0);assert.equal(captured.authorityCreated,false);assert.equal(evaluateOnboarding(captured.bundle).state,'awaiting_identity_review');
 const moved=structuredClone(captured.bundle);moved.observations[1]={...moved.observations[0],url:plan.corporateUrl};assert.equal(OnboardingBundle.safeParse(moved).success,false);
 const mislabeled=structuredClone(captured.bundle);delete mislabeled.plan.identityFormat;assert.equal(OnboardingBundle.safeParse(mislabeled).success,false);
});
test('PDF collection retains unsupported documents and robots denials as explicit held observations',async()=>{
 for(const deny of [true,false]){
  const f=onboardingFixture(),plan={...f.plan,identityFormat:'pdf'},calls=[];
  const c=await collectEmployerOnboarding(plan,{now:()=>f.bundle.observations[0].at,sleep:async()=>{},fetcher:async(_s,url)=>{
   calls.push(url);if(url.endsWith('/robots.txt'))return{url,text:`User-agent: *\n${deny&&url.startsWith('https://directory.example')?'Disallow':'Allow'}: /`};
   if(url===plan.identityUrl)return{url,data:Buffer.from('HTML or damaged document')};return{url,text:f.pages.get(url)};
  }});
  assert.equal(c.bundle.observations[0].error,deny?'ROBOTS_DISALLOWED':'PDF_EVIDENCE_UNSUPPORTED');assert.equal(evaluateOnboarding(c.bundle).state,'evidence_incomplete');
  if(deny)assert.equal(calls.includes(plan.identityUrl),false);
 }
});
