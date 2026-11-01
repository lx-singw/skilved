import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requirementLineNumbers, uncoveredRequirementLines, promotionalLineNumbers, containsPromotionalContent,hasPromotionalEvidence } from '../src/ai/source-lines.mjs';

const candidate = text => ({ title: 'Authored apprentice', sourceText: text });
const extraction = (...quotes) => ({ requirements: { items: quotes.map(quote => ({ fact: { quote } })), expression: { op: 'ref', id: 'unused' } } });

test('coverage follows explicit bounded sections, excluding headings and connective lines', () => {
  const input = candidate('Requirements\nQUALIFICATIONS AND EXPERIENCE REQUIRED:\nGrade 12\nOR\nN3 with:\nMathematics\nScience\nHow to apply\nOther text');
  assert.deepEqual(requirementLineNumbers(input), [4, 6, 7, 8]);
  assert.deepEqual(uncoveredRequirementLines(input, extraction('Grade 12', 'N3 with:\nMathematics\nScience')), []);
  assert.deepEqual(uncoveredRequirementLines(input, extraction('Grade 12', 'N3 with:\nMathematics')), [8]);
});

test('unbounded and unrelated sections do not invent mandatory coverage', () => {
  assert.deepEqual(requirementLineNumbers(candidate('Requirements\nSome text\nFooter')), []);
  assert.deepEqual(requirementLineNumbers(candidate('Role description\nGrade 12\nHow to apply')), []);
});

test('unclear source logic can retain exact evidence but does not become resolved requirements', () => {
  const input = candidate('Minimum requirements\nUnclear qualification condition\nMain responsibilities\nOther text');
  const data = { requirements: { items: [], expression: { op: 'unknown', originalText: 'Unclear qualification condition' } } };
  assert.deepEqual(uncoveredRequirementLines(input, data), []);
  assert.equal(data.requirements.expression.op, 'unknown');
});

test('publisher invitations are marked without deleting employer submission instructions', () => {
  const input = candidate('Requirements\nGrade 12\nJoin our WhatsApp group\nHow to apply\nSend your CV via WhatsApp to the recruitment number.\nApply now');
  assert.deepEqual(promotionalLineNumbers(input), [4]);
  assert.deepEqual(requirementLineNumbers(input), [3]);
  assert.match(input.sourceText, /Join our WhatsApp group/);
});

test('mixed application labels and adjacent-line social invitations retain exact source line numbers',()=>{
  for(const invite of ['Join our WhatsApp group','Join our\nWhatsApp group','Apply now online Join our\nWhatsApp group',
    'Apply now online Join our WhatsApp group','Follow us on\nTelegram','Subscribe to our\nnewsletter']){
    const input=candidate('Minimum requirements\nGrade 12\n'+invite+'\nHow to apply\nSend your CV via WhatsApp to the recruitment number.');
    const before=structuredClone(input),count=invite.split('\n').length;
    assert.deepEqual(promotionalLineNumbers(input),Array.from({length:count},(_,i)=>4+i));
    assert.equal(containsPromotionalContent(invite),true);assert.deepEqual(requirementLineNumbers(input),[3]);
    assert.equal(hasPromotionalEvidence(input,'Grade 12'),false);assert.deepEqual(input,before);
  }
});

test('partial social evidence is held while the application-only prefix and genuine submission methods survive',()=>{
  const input=candidate('Apply now online Join our\nWhatsApp group');
  for(const quote of ['Join our','WhatsApp group','Apply now online Join our','Join our\nWhatsApp group'])assert.equal(hasPromotionalEvidence(input,quote),true);
  assert.equal(hasPromotionalEvidence(input,'Apply now online'),false);
  for(const text of ['Send your CV via WhatsApp to the recruitment number.','Apply by email: hr@employer.example',
    'Follow the application instructions.','Join our engineering team.','Do not join our WhatsApp group.',
    'Join our\nUnrelated instructions\nWhatsApp group','WhatsApp group']){
    assert.equal(containsPromotionalContent(text),false);assert.deepEqual(promotionalLineNumbers(candidate(text)),[]);
  }
});
