import { test } from 'node:test';
import {extractWithProvider} from '../src/ai/provider.mjs';
import assert from 'node:assert/strict';
import { extractWithGroq, extractionConfiguration, GROQ_MODEL } from '../src/ai/groq.mjs';
import { decodeGroqExtraction, groqExtractionPayload } from '../src/ai/groq-schema.mjs';
import { mapExtraction } from '../src/ai/extraction.mjs';
import { parseRecentJobsDetail } from '../src/adapters/recentjobs.mjs';

const env = { SKILVED_AI_MODE: 'groq', GROQ_API_KEY: 'synthetic_private_test_key_only' };
const candidate = parseRecentJobsDetail({ url: 'https://recentjobs.co.za/2026/09/27/fictional-apprentice/',
  html: '<article class="type-post"><h1 class="entry-title">Fictional electrical apprentice</h1><div class="entry-content"><p>Fictional Workshop seeks an apprentice.</p><p>Grade 12 with Mathematics OR</p><p>N3 with:</p><ul><li>Mathematics</li><li>Engineering Science</li></ul><p>Closing date: 30 October 2026</p><a href="https://employer.example/apply">Apply now</a></div></article>' });
const stated = (value, span) => ({ state: 'stated', value, span });
function wire() {
  return { category: 'apprenticeship', categorySpan: [1, 1], issuer: stated('Fictional Workshop', [2, 2]),
    summary: stated('Electrical apprenticeship at Fictional Workshop', [1, 2]),
    intake: null, location: null, residence: null, experience: null, compensation: [], practicalConditions: null,
    deadline: stated({ kind: 'date', localDate: '2026-10-30', localTime: null, timezone: null, utcInstant: null }, [7, 7]),
    applicationCandidateIndex: 0,
    requirements: { items: [
      { id: 'req_0', kind: 'education', level: 'required', state: 'stated', span: [3, 3] },
      { id: 'req_1', kind: 'education', level: 'required', state: 'stated', span: [4, 6] },
    ], expression: 'any(req_0,req_1)' } };
}
const response = () => ({ model: GROQ_MODEL, choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(wire()) } }],
  usage: { prompt_tokens: 1000, completion_tokens: 400, total_tokens: 1400, completion_tokens_details: { reasoning_tokens: 100 } } });

test('Groq uses strict output, bounded reasoning, a fixed endpoint and preserves OR', async () => {
  const result = await extractWithGroq(candidate, { env, fetchImpl: async (url, init) => {
    assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
    assert.equal(init.redirect, 'error'); assert.equal(init.headers.Authorization, `Bearer ${env.GROQ_API_KEY}`);
    const body = JSON.parse(init.body);
    assert.equal(body.model, GROQ_MODEL); assert.equal(body.response_format.json_schema.strict, true);
    assert.equal(body.max_completion_tokens, 3072); assert.equal(body.reasoning_effort, 'low');
    assert.equal(body.include_reasoning, false); assert.equal('tools' in body, false);
    assert.ok(Buffer.byteLength(init.body) < 20000);
    assert.match(JSON.parse(body.messages[1].content).sourceLines, /4: N3 with:\n5: Mathematics/);
    return Response.json(response());
  } });
  assert.equal(result.extraction.requirements.expression.op, 'any');
  assert.equal(result.provenance.provider, 'groq');
  assert.deepEqual(result.provenance.usage, { inputTokens: 1000, outputTokens: 400, thinkingTokens: 100, totalTokens: 1400 });
});

test('disabled mode and invalid configuration never spend a request; selected model is explicit', async () => {
  for (const settings of [{}, { ...env, SKILVED_AI_MODE: 'disabled' }, { ...env, SKILVED_AI_MODEL: 'gemini-3.8-flash' },
    { ...env, GROQ_API_KEY: '' }, { ...env, SKILVED_AI_THINKING: 'unknown' }, { ...env, SKILVED_AI_VALIDATION_THINKING: 'unknown' }])
    await assert.rejects(extractWithGroq(candidate, { env: settings, fetchImpl: () => assert.fail('request attempted') }), /AI_/);
  assert.equal(extractionConfiguration({ ...env, SKILVED_AI_MODEL: 'openai/gpt-oss-20b' }).model, 'openai/gpt-oss-20b');
  assert.equal(extractionConfiguration(env).validationThinking, 'medium');
  assert.equal(extractionConfiguration({ ...env, SKILVED_AI_VALIDATION_THINKING: 'low' }).validationThinking, 'low');
});

test('rate limits retain Retry-After, do not retry and never echo provider errors', async () => {
  let calls = 0;
  await assert.rejects(extractWithGroq(candidate, { env, fetchImpl: async () => { calls++;
    return new Response('PRIVATE_PROVIDER_BODY', { status: 429, headers: { 'Retry-After': '90' } }); } }), e => {
    assert.equal(e.code, 'AI_RATE_LIMITED'); assert.equal(e.retryable, true); assert.equal(e.retryAfterMs, 90000);
    assert.equal(e.providerStatus, 429);
    assert.doesNotMatch(e.message, /PRIVATE/); return true;
  });
  assert.equal(calls, 1);
});

test('provider rejection retains only HTTP status, without the private response body', async () => {
  for (const status of [400, 413, 503]) {
    await assert.rejects(extractWithGroq(candidate, { env, fetchImpl: async () =>
      new Response('PRIVATE_PROVIDER_BODY', { status }) }), e => {
      assert.equal(e.code, 'AI_PROVIDER_REJECTED'); assert.equal(e.providerStatus, status);
      assert.equal(e.retryable, status === 503); assert.equal(e.usage, null);
      assert.doesNotMatch(JSON.stringify(e), /PRIVATE/); return true;
    });
  }
});

test('generated-schema failures are retryable without local retries or private error leakage', async () => {
  for (const [code, retryable] of [['json_validate_failed', true], ['invalid_api_key', false], ['PRIVATE_UNKNOWN_CODE', false]]) {
    let calls = 0;
    await assert.rejects(extractWithGroq(candidate, { env, fetchImpl: async () => { calls++;
      return Response.json({ error: { code, message: 'PRIVATE_ERROR_TEXT', failed_generation: 'PRIVATE_MODEL_OUTPUT' } }, {status:400});
    } }), error => {
      assert.equal(error.retryable, retryable); assert.equal(error.providerStatus, 400);
      assert.equal(error.code, retryable ? 'AI_INVALID_PROVIDER_OUTPUT' : 'AI_PROVIDER_REJECTED');
      assert.doesNotMatch(JSON.stringify(error), /PRIVATE/); return true;
    });
    assert.equal(calls, 1);
  }
});

test('truncation, refusal, tool calls, invalid JSON and extra output cannot become records', async () => {
  for (const mutate of [r => r.choices[0].finish_reason = 'length', r => r.choices[0].message.refusal = 'refused',
    r => r.choices[0].message.tool_calls = [], r => r.choices[0].message.content = '```json\n{}\n```',
    r => r.choices.push(r.choices[0]), r => r.choices[0].message.content = JSON.stringify({ ...wire(), publish: true })]) {
    const body = response(); mutate(body);
    await assert.rejects(extractWithGroq(candidate, { env, fetchImpl: async () => Response.json(body) }), /AI_/);
  }
});

test('logic grammar rejects missing/unused items, malformed operators and executable text', () => {
  for (const expression of ['any(req_0,missing)', 'req_0', 'all()', 'any(req_0,req_1', 'any(req_0,req_1))',
    'any(req_0,req_1);process.exit()', 'globalThis.fetch(1)', 'req_0 || req_1', 'none',
    'if(missing,req_0,req_1)', 'unknown(0,3)', 'unknown(2,1)', 'unknown(1,999)', 'unknown(1.5,2)']) {
    const data = wire(); data.requirements.expression = expression;
    assert.throws(() => decodeGroqExtraction(data, candidate), /AI_INVALID_EXTRACTION/);
  }
  const data = wire(); data.requirements.expression = 'if(req_0,req_1,unknown(3,6))';
  assert.equal(decodeGroqExtraction(data, candidate).requirements.expression.op, 'if');
  data.requirements.expression = 'if(req_0,req_1,none)';
  assert.equal(decodeGroqExtraction(data, candidate).requirements.expression.otherwise, null);
  data.requirements.items.pop(); data.requirements.expression = 'req_0';
  assert.deepEqual(decodeGroqExtraction(data, candidate).requirements.expression, { op: 'ref', id: 'req_0' });
  data.requirements.items = []; data.requirements.expression = 'unknown(3,6)';
  assert.equal(decodeGroqExtraction(data, candidate).requirements.expression.originalText, 'Grade 12 with Mathematics OR\nN3 with:\nMathematics\nEngineering Science');
});

test('line ranges reconstruct exact multi-line evidence, canonical facts and snapshot offsets', () => {
  const extraction = decodeGroqExtraction(wire(), candidate);
  const result = mapExtraction(candidate, extraction, { sourceId: 'recentjobs', now: '2026-09-27T10:00:00.000Z' });
  assert.equal(extraction.requirements.items[1].fact.quote, 'N3 with:\nMathematics\nEngineering Science');
  assert.equal(extraction.requirements.items[1].fact.value.description, extraction.requirements.items[1].fact.quote);
  assert.equal(extraction.requirements.items[1].fact.value.qualification, null);
  assert.equal(extraction.requirements.items[1].fact.value.document, null);
  assert.equal(extraction.deadline.value.originalText, 'Closing date: 30 October 2026');
  assert.deepEqual(extraction.intake, { state: 'not_stated', value: null, quote: null });
  for (const evidence of result.evidence) assert.equal(result.snapshot.text.slice(evidence.start, evidence.end), evidence.quote);
  assert.equal(result.record.publication.approved, false);
});

test('direct item references preserve nested ALL/ANY and reject excessive depth', () => {
  const data = wire();
  data.requirements.items.push({ ...structuredClone(data.requirements.items[0]), id: 'req_2', span: [5, 5] });
  data.requirements.expression = 'all(req_0,any(req_1,req_2))';
  assert.deepEqual(decodeGroqExtraction(data, candidate).requirements.expression, { op: 'all', children: [
    { op: 'ref', id: 'req_0' }, { op: 'any', children: [{ op: 'ref', id: 'req_1' }, { op: 'ref', id: 'req_2' }] }] });
  data.requirements.expression = 'all(all(all(all(all(req_0,req_1,req_2)))))';
  assert.throws(() => decodeGroqExtraction(data, candidate), /AI_INVALID_EXTRACTION/);
  data.requirements.expression = `any(${Array(31).fill('req_0').join(',')})`;
  assert.throws(() => decodeGroqExtraction(data, candidate), /AI_INVALID_EXTRACTION/);
});

test('invalid spans, impossible facts and added quote fields reject before mapping', () => {
  for (const range of [[0, 1], [2, 1], [1, 999], [1.5, 2], [1], [1, 2, 3]]) {
    const data = wire(); data.issuer.span = range;
    assert.throws(() => decodeGroqExtraction(data, candidate), /AI_INVALID_EXTRACTION/);
  }
  for (const mutate of [d => d.issuer.value = null, d => d.issuer.state = 'not_stated',
    d => d.issuer.quote = 'invented', d => d.deadline.value.localDate = '2026-02-30']) {
    const data = wire(); mutate(data); assert.throws(() => decodeGroqExtraction(data, candidate), /AI_INVALID_EXTRACTION/);
  }
  assert.throws(() => groqExtractionPayload({ ...candidate, sourceText: 'x'.repeat(96001) }), /AI_INPUT_LIMIT/);
});

test('indistinguishable requirement passages cannot masquerade as separate alternatives', () => {
  const data = wire(); data.requirements.items[1].span = data.requirements.items[0].span;
  assert.throws(() => decodeGroqExtraction(data, candidate), /AI_DUPLICATE_REQUIREMENT_PASSAGE/);
});

test('large bodies and timeouts fail closed; missing usage remains unknown', async t => {
  await assert.rejects(extractWithGroq(candidate, { env, fetchImpl: async () => new Response('x'.repeat(256001)) }), /AI_RESPONSE_LIMIT/);
  const body = response(); delete body.usage;
  assert.equal((await extractWithGroq(candidate, { env, fetchImpl: async () => Response.json(body) })).provenance.usage, null);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const pending = extractWithGroq(candidate, { env, fetchImpl: async (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new Error('private transport detail')), { once: true });
  }) });
  t.mock.timers.tick(45000);
  await assert.rejects(pending, e => e.code === 'AI_TIMEOUT' && e.retryable);
});

const geminiEnv={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_ordinary_shape_key'};
const geminiAnswer=data=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}});

test('ordinary schema-keyword echoes fail unchanged without semantic fallback or private-value diagnostics',async()=>{
  for(const data of [{...wire(),type:'object',private_model_key:'private value'},{...wire(),issuer:{...wire().issuer,type:'string',private_nested_key:'private value'}}]){
    const before=JSON.stringify(data);let calls=0;
    await assert.rejects(extractWithProvider(candidate,{env:geminiEnv,fetchImpl:async()=>{calls++;return geminiAnswer(data);}}),error=>{
      assert.equal(error.code,'AI_INVALID_EXTRACTION');assert.equal(error.usage.totalTokens,15);
      assert.ok(error.outputDiagnostic.unknownPropertyCounts.length>0);
      assert.doesNotMatch(JSON.stringify(error),/private_model_key|private_nested_key|private value/);return true;
    });
    assert.equal(calls,1);assert.equal(JSON.stringify(data),before);
  }
});

test('an ordinary schema wrapper reports missing data keys rather than unwrapping or accepting it',async()=>{
  let calls=0;
  await assert.rejects(extractWithProvider(candidate,{env:geminiEnv,fetchImpl:async()=>{calls++;return geminiAnswer({type:'object',properties:wire()});}}),error=>{
    assert.equal(error.code,'AI_INVALID_EXTRACTION');assert.equal(error.usage.totalTokens,15);
    assert.ok(error.outputDiagnostic.missingRequired.includes('/requirements'));
    assert.deepEqual(error.outputDiagnostic.unknownPropertyCounts,[{path:'',count:2}]);return true;
  });assert.equal(calls,1);
});

test('a data-only ordinary response keeps exact evidence and original routes with the versioned contract',async()=>{
  let calls=0;
  const result=await extractWithProvider(candidate,{env:geminiEnv,fetchImpl:async(_url,init)=>{
    calls++;const request=JSON.parse(init.body),instruction=request.systemInstruction.parts[0].text;
    assert.match(instruction,/Return one opportunity DATA object/);assert.doesNotMatch(instruction,/Return the strict JSON schema/);
    return geminiAnswer(wire());
  }});
  assert.equal(calls,1);assert.equal(result.provenance.extractionVersion,'recentjobs_extraction_v8_groq_v7');
  assert.equal(result.extraction.requirements.items[1].fact.quote,'N3 with:\nMathematics\nEngineering Science');
  const mapped=mapExtraction(candidate,result.extraction,{sourceId:'ordinary_shape_test',now:'2026-10-04T10:00:00.000Z'});
  assert.equal(mapped.record.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(mapped.record.publication.approved,false);
});
