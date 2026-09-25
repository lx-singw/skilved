import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderInspection } from '../tools/render-inspection.mjs';
import { allFixtures, makeRecord } from './fixtures/opportunities.mjs';
test('inspection uses validated projections and escapes hostile source wording', () => {
  const x = makeRecord(); x.title.value = '</h2><script>alert(1)</script>'; x.title.originalText = x.title.value;
  const html = renderInspection([x, ...allFixtures()], { kind: 'manual_review' });
  assert.ok(html.includes('&lt;script&gt;')); assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('graduate programme')); assert.ok(html.includes('student_wil')); assert.ok(html.includes('ANY of'));
  assert.ok(!html.includes('href="https://issuer.example')); // no real/simulated external navigation
});
