import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePrimaryJobPosting } from '../src/adapters/primary-jobposting.mjs';
import { validateExtraction, validateAssessment } from '../src/ai/validation.mjs';
import { workerPrincipal } from '../src/worker-identity.mjs';
import { approvedIssuer, enforceAutomaticFreshness, preflightCandidate, publicationGate } from '../src/worker-policy.mjs';
import { makeRecord } from '../../types/tests/fixtures/opportunities.mjs';
import { projectOpportunity } from '@skilved/types/opportunities/internal';

test('primary adapter accepts one inert JobPosting and rejects generic/multiple/oversized notices', () => {
  const job = { '@type': 'JobPosting', title: 'Fictional apprentice', hiringOrganization: { name: 'Fictional issuer' },
    description: '<p>Grade 12 OR N3</p><script>INJECTED_SCRIPT</script>', validThrough: '2026-10-30' };
  const html = `<script type="application/ld+json">${JSON.stringify({ '@graph': [job] }).replace(/</g, '\\u003c')}</script>`;
  const parsed = parsePrimaryJobPosting(html);
  assert.match(parsed.text, /Grade 12 OR N3/); assert.doesNotMatch(parsed.text, /INJECTED_SCRIPT/);
  for (const input of ['<h1>Careers</h1>', html + html, 'x'.repeat(500001), '<script type="application/ld+json">{bad</script>'])
    assert.throws(() => parsePrimaryJobPosting(input), /PRIMARY_NOTICE_UNSUPPORTED/);
});

test('semantic validator requires evidence from both notices and rejects unsupported affirmative verdicts', async () => {
  const input = { record: makeRecord(), recentjobsText: 'Fictional source quote', primary: { text: 'Primary source quote' } };
  const env = { SKILVED_AI_MODE: 'groq', GROQ_API_KEY: 'synthetic_api_key_for_tests_only' };
  const good = { supported: true, issues: [], evidence: [{ source: 'recentjobs', quote: 'Fictional source quote' }, { source: 'primary', quote: 'Primary source quote' }] };
  const respond = data => ({ env, fetchImpl: async () => Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(data) } }] }) });
  assert.equal((await validateExtraction(input, respond(good))).supported, true);
  for (const data of [{ ...good, issues: [{ field: 'deadline', reason: 'Conflicting' }] },
    { ...good, evidence: [good.evidence[0], good.evidence[0]] },
    { ...good, evidence: [good.evidence[0], { source: 'primary', quote: 'Invented quote' }] },
    { ...good, approved: true }]) await assert.rejects(validateExtraction(input, respond(data)), /AI_INVALID_VALIDATION/);
  const discovery = { ...input, primary: null };
  assert.equal((await validateExtraction(discovery, respond({ ...good, evidence: [good.evidence[0]] }))).supported, true);
  await assert.rejects(validateExtraction(discovery, respond(good)), /AI_INVALID_VALIDATION/);
});

test('semantic audit keeps all material facts and requirement logic without storage metadata', async () => {
  const record = makeRecord();
  const env = { SKILVED_AI_MODE: 'groq', GROQ_API_KEY: 'synthetic_api_key_for_tests_only' };
  await validateExtraction({ record, recentjobsText: 'Source evidence', applicationCandidates: [{ method: 'portal', destination: record.applicationRoute.value.destination, originalText: 'Apply' }] },
    { env, fetchImpl: async (_url, init) => {
      assert.equal(JSON.parse(init.body).reasoning_effort, 'medium');
      const payload = JSON.parse(JSON.parse(init.body).messages[1].content), facts = payload.extracted;
      for (const key of ['title', 'issuer', 'summary', 'intake', 'location', 'residence', 'experience', 'deadline', 'practicalConditions', 'applicationRoute']) {
        assert.deepEqual(facts[key], { state: record[key].state, value: record[key].value, originalText: record[key].originalText });
      }
      assert.deepEqual(facts.requirements.expression, record.requirements.expression);
      assert.equal(facts.requirements.requirements.length, record.requirements.requirements.length);
      assert.equal(facts.compensation.length, record.compensation.length);
      assert.equal(payload.applicationCandidates[0].destination, record.applicationRoute.value.destination);
      assert.equal('sourceSnapshotIds' in facts.issuer, false); assert.equal('review' in facts.issuer, false);
      return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ supported: true, issues: [], evidence: [{ source: 'recentjobs', quote: 'Source evidence' }] }) } }] });
    } });
});

test('issuer matching uses exact host and path boundary rather than lookalike/subdomain matching', () => {
  const record = makeRecord();
  const source = { automation: { issuers: [{ name: record.issuer.value, host: 'issuer.example', pathPrefix: '/apply' }] } };
  assert.ok(approvedIssuer(source, record));
  for (const destination of ['https://issuer.example.evil.test/apply', 'https://sub.issuer.example/apply', 'https://issuer.example/application', 'https://user@issuer.example/apply']) {
    record.applicationRoute.value.destination = destination;
    assert.throws(() => approvedIssuer(source, record));
  }
});

test('issuer aliases require explicit registration on the same route and cannot broaden hosts or create ambiguous matches',()=>{
  const record=makeRecord();
  const entry={name:record.issuer.value,aliases:['Fictional Trading Name'],host:'issuer.example',pathPrefix:'/apply'};
  const source={automation:{issuers:[entry]}};
  record.issuer.value='Fictional Trading Name';assert.equal(approvedIssuer(source,record),entry);
  record.issuer.value='Fictional Trading';assert.throws(()=>approvedIssuer(source,record),/ISSUER_RELATIONSHIP_UNQUALIFIED/);
  record.issuer.value='Fictional Trading Name';record.applicationRoute.value.destination='https://other.example/apply';
  assert.throws(()=>approvedIssuer(source,record),/ISSUER_RELATIONSHIP_UNQUALIFIED/);
  record.applicationRoute.value.destination='https://issuer.example/apply';
  source.automation.issuers.push({...entry,name:'Another issuer'});
  assert.throws(()=>approvedIssuer(source,record),/ISSUER_RELATIONSHIP_UNQUALIFIED/);
});

test('validation quotes preserve multi-line text and cite visible link labels rather than hidden URLs', () => {
  const text = 'N3 with:\nElectrical Trade Theory\nMathematics\nEngineering Science\nApply now';
  const assessment = quote => ({ supported: true, issues: [], evidence: [{ source: 'recentjobs', quote }] });
  assert.equal(validateAssessment(assessment(text), text).supported, true);
  assert.equal(validateAssessment(assessment('Apply now'), text).supported, true);
  for (const quote of ['https://employer.example/apply', text.replaceAll('\n', ' '), 'N3 with: Electrical Trade Theory, Mathematics, Engineering Science'])
    assert.throws(() => validateAssessment(assessment(quote), text), /AI_INVALID_VALIDATION/);
});

test('automatic freshness does not relabel legacy human checks or expose expired actions', () => {
  const projection = projectOpportunity(makeRecord());
  assert.equal(enforceAutomaticFreshness(projection, '2027-01-01T00:00:00.000Z').kind, 'opportunity');
  projection.opportunity.checks[0].method = 'automatic';
  assert.equal(enforceAutomaticFreshness(projection, '2027-01-01T00:00:00.000Z').kind, 'status');
});

test('synthetic machine identity is available only in explicit demo emulation', async () => {
  const env = { SKILVED_WORKER_EMULATOR_IDENTITY: 'synthetic-worker@example.test' };
  assert.equal(await workerPrincipal({ mode: 'emulator', projectId: 'demo-fixture' }, env), env.SKILVED_WORKER_EMULATOR_IDENTITY);
  await assert.rejects(workerPrincipal({ mode: 'emulator', projectId: 'real-project' }, env), /WORKER_UNAUTHORIZED/);
  await assert.rejects(workerPrincipal({ mode: 'emulator', projectId: 'demo-fixture' }, { ...env, NODE_ENV: 'production' }), /WORKER_UNAUTHORIZED/);
  await assert.rejects(workerPrincipal({ mode: 'cloud', projectId: 'real-project' }, env), /WORKER_UNAUTHORIZED/);
});

test('explicit unresolved programme subjects block preflight and publication before model support can approve them',()=>{
  const candidate={issues:['programme_subject_scope_review_required'],applicationCandidates:[{method:'email',destination:'jobs@employer.example'}],deadlineCandidates:[{localDate:'2026-10-13'}]};
  assert.throws(()=>preflightCandidate({},candidate,'2026-10-04T10:00:00.000Z'),/NOTICE_PROGRAMME_SCOPE_REVIEW_REQUIRED/);
  assert.throws(()=>publicationGate({},candidate,makeRecord(),null,{supported:true,issues:[]},'2026-10-04T10:00:00.000Z'),/NOTICE_PROGRAMME_SCOPE_REVIEW_REQUIRED/);
});

test('conditional document instructions remain visible in projection and independent semantic audit',async()=>{
 const instruction='Other supporting certificates, if applicable',record=makeRecord();
 record.practicalConditions.value=record.practicalConditions.originalText=instruction;
 const projected=projectOpportunity(record);assert.equal(projected.kind,'opportunity');
 assert.equal(projected.opportunity.practicalConditions.value,instruction);
 assert.equal(projected.opportunity.practicalConditions.originalText,instruction);
 assert.equal(projected.opportunity.application.route.destination,record.applicationRoute.value.destination);
 let calls=0;
 const assessment=await validateExtraction({record,recentjobsText:instruction},{
  env:{SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_key_for_test'},fetchImpl:async(_url,init)=>{
   calls++;const request=JSON.parse(init.body),payload=JSON.parse(request.messages[1].content);
   assert.match(request.messages[0].content,/Genuine unclear eligibility still fails/);
   assert.equal(payload.extracted.practicalConditions.value,instruction);
   return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({supported:false,issues:[{field:'requirements',reason:'Missing eligibility passage'}],evidence:[{source:'recentjobs',quote:instruction}]})}}]});
  }});
 assert.equal(calls,1);assert.equal(assessment.supported,false);
});