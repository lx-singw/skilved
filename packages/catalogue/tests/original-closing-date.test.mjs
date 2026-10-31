import{test}from'node:test';import assert from'node:assert/strict';
import{originalClosingDateProof,originalApplicationDate,validOriginalClosingDateProof}from'../src/original-closing-date.mjs';
import{parseOriginalDeadline}from'../src/original-deadline.mjs';
import{resolveOriginalNotice,refreshOriginalResolution}from'../src/original-notice-resolver.mjs';
import{publicationGate}from'../src/worker-policy.mjs';
import{originalFixture,originalHtml,originalMicrodataHtml}from'./fixtures/original-notices.mjs';
import{mapExtraction}from'../src/ai/extraction.mjs';import{syntheticExtraction}from'./fixtures/recentjobs-model.mjs';
test('explicit scoped fields retain human dates separately from exact zoned midnight expiry',()=>{
 for(const raw of ['Closing date\n30 October 2026','Closing date: 30 Oct 2026','Application deadline: 2026-10-30']){
  const p=originalClosingDateProof(raw);assert.equal(p.state,'stated');assert.equal(p.localDate,'2026-10-30');assert.equal(validOriginalClosingDateProof(p),true);
  const expiry=parseOriginalDeadline('2026-10-30T22:00:00Z');assert.equal(originalApplicationDate(expiry,p),'2026-10-30');assert.equal(expiry.localDate,'2026-10-31');assert.equal(expiry.raw,'2026-10-30T22:00:00Z');
 }
 const p=originalClosingDateProof('Closing date: 30 October 2026');
 for(const raw of ['2026-10-31','2026-10-31T00:00:00Z','2026-10-30T22:00:00.001Z','2026-11-01T00:00:00+02:00'])assert.equal(originalApplicationDate(parseOriginalDeadline(raw),p),null);
 assert.equal(originalApplicationDate(parseOriginalDeadline('2026-10-30T22:00:00Z')),'2026-10-31');
});
test('malformed, conflicting and competing timing fields cannot be preferred or repaired',()=>{
 for(const text of ['Closing date: 31 February 2026','Closing date: not specified','Closing date: 30 October 2026\nDeadline: 31 October 2026',
  'Closing date: 30 October 2026\nApply before Monday','Closing date: 30 October 2026\nApplications close tomorrow'])assert.equal(originalClosingDateProof(text).state,'unresolved',text);
 assert.equal(originalClosingDateProof('We respond within 60 days after the closing date.'),null);
  const oversized=originalClosingDateProof('x'.repeat(20001)+'\nClosing date: 30 October 2026');assert.equal(oversized.state,'unresolved');assert.equal(oversized.descriptionText,null);
 const p=originalClosingDateProof('Closing date: 30 October 2026');assert.equal(validOriginalClosingDateProof({...p,localDate:'2026-10-31'}),false);
});
test('two formats and multiple employers require explicit original/source agreement and preserve old rollover holds',()=>{
 for(const [issuer,format]of [['Fictional Workshop',originalHtml],['Imaginary Works',originalMicrodataHtml]]){
  const f=originalFixture({issuer}),posting={...f.posting,validThrough:'2026-10-30T22:00:00Z',description:f.posting.description+'<p>Closing date</p><p>30 October 2026</p>'};
  const resolve=p=>resolveOriginalNotice({...f,observation:{url:f.url,text:format(p)}}),r=resolve(posting);
  assert.equal(r.outcome,'matched');assert.equal(r.identity.validThrough,posting.validThrough);assert.equal(r.deadlineEvidence.localDate,'2026-10-31');assert.equal(r.closingDateEvidence.localDate,'2026-10-30');
  assert.equal(resolve({...posting,description:f.posting.description}).reason,'DEADLINE_CONFLICT');
  const oversized=resolve({...f.posting,description:f.posting.description+'<p>'+'x'.repeat(20001)+'</p>'});assert.equal(oversized.outcome,'unsupported');assert.ok(['LAYOUT_UNSUPPORTED','ORIGINAL_CLOSING_DATE_UNRESOLVED'].includes(oversized.reason));
  assert.equal(resolve({...posting,description:f.posting.description+'<p>Closing date: 29 October 2026</p>'}).reason,'ORIGINAL_TIMING_CONFLICT');
  assert.equal(resolve({...posting,url:'https://wrong.example/job/1/'}).reason,'VACANCY_URL_CONFLICT');
  assert.equal(refreshOriginalResolution(r,'2026-10-30T00:00:00.000Z').reason,'CLOSING_DAY_HOLD');
  assert.equal(refreshOriginalResolution(r,'2026-10-30T22:00:00.000Z').outcome,'closed');
  assert.equal(refreshOriginalResolution({...r,closingDateEvidence:undefined},f.now).reason,'DEADLINE_EVIDENCE_CHANGED');
  assert.equal(refreshOriginalResolution({...r,closingDateEvidence:{...r.closingDateEvidence,localDate:'2026-10-31'}},f.now).reason,'DEADLINE_EVIDENCE_CHANGED');
  assert.equal(refreshOriginalResolution({...r,version:'original_jobposting_v4'},f.now).reason,'RESOLVER_POLICY_CHANGED');
 }
});
test('the shadow gate rechecks separate proofs and rejects missing or changed closing evidence',()=>{
 const f=originalFixture({reference:null}),posting={...f.posting,validThrough:'2026-10-30T22:00:00Z',description:f.posting.description+'<p>Closing date: 30 October 2026</p>'},r=resolveOriginalNotice({...f,observation:{url:f.url,text:originalHtml(posting)}});
 const {record}=mapExtraction(f.candidate,syntheticExtraction(),{sourceId:f.source.id,now:f.now});const audit={supported:true,issues:[]};
 assert.ok(publicationGate(f.source,f.candidate,record,r.primary,audit,f.now,r.deadlineEvidence,r.closingDateEvidence));
 assert.throws(()=>publicationGate(f.source,f.candidate,record,r.primary,audit,f.now,r.deadlineEvidence),{code:'PRIMARY_DEADLINE_UNRESOLVED'});
 assert.throws(()=>publicationGate(f.source,f.candidate,record,r.primary,audit,f.now,r.deadlineEvidence,{...r.closingDateEvidence,localDate:'2026-10-31'}),{code:'PRIMARY_DEADLINE_UNRESOLVED'});
});
