// Synthetic expected output only. Never used as a production fallback.
export function syntheticExtraction() {
  const absent = () => ({ state: 'not_stated', value: null, quote: null });
  const stated = (value, quote = value) => ({ state: 'stated', value, quote });
  return { category: 'apprenticeship', categoryQuote: 'Fictional electrical apprentice',
    issuer: stated('Fictional Workshop'), summary: stated('Fictional Workshop seeks an electrical apprentice.'),
    intake: absent(), location: absent(), residence: absent(), experience: absent(),
    deadline: stated({ kind: 'date', originalText: 'Closing date: 30 October 2026', localDate: '2026-10-30',
      localTime: null, timezone: null, utcInstant: null }, 'Closing date: 30 October 2026'),
    compensation: [], practicalConditions: absent(), applicationCandidateIndex: 0,
    requirements: { items: ['Grade 12 with Mathematics', 'N3 Electrical'].map((wording, i) => ({
      id: `req_${i}`, kind: 'education', level: 'required', fact: stated({ description: wording, qualification: null, document: null }, wording),
    })), expression: { op: 'any', children: [{ op: 'ref', id: 'req_0' }, { op: 'ref', id: 'req_1' }] } } };
}
