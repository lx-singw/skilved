// Synthetic, test-only examples. No real employer, source check or vacancy is represented.
export const NOW = '2026-09-25T10:00:00.000Z';
export const categories = ['bursary', 'learnership', 'apprenticeship', 'internship', 'graduate_programme', 'job'];
export function makeRecord(category = 'apprenticeship', subtype = 'student_wil') {
  let sequence = 0;
  const fact = (value, originalText = typeof value === 'string' ? value : 'Fictional source wording') => ({
    id: `assertion_${++sequence}`, state: value === null ? 'not_stated' : 'stated', value,
    originalText: value === null ? null : originalText, sourceSnapshotIds: value === null ? [] : ['snapshot_fixture_1'],
    evidenceRefs: value === null ? [] : ['evidence_fixture_1'], method: 'human', review: 'approved', reviewedBy: 'reviewer_fixture',
  });
  const destination = 'https://issuer.example/apply';
  return {
    schemaVersion: 1, id: `fixture_${category}_${subtype}`, revision: 1, category,
    internship: category === 'internship' ? { subtype, originalText: subtype === 'other_stated' ? 'Fictional other internship route' : null } : null,
    title: fact(`Fictional ${category.replace('_', ' ')} opportunity`), issuer: fact('Fictional Learning Workshop'),
    summary: fact('Synthetic contract example. No real application is available.'), fields: ['General study and work'],
    intake: fact('Fictional 2027 intake A'), organisations: [fact({ name: 'Fictional Learning Workshop', role: 'issuer' })],
    location: fact({ places: [{ country: 'ZA', province: 'gauteng', city: 'Fictional City' }], coverage: 'local', attendance: 'in_person', relocation: null }),
    residence: fact(null), experience: fact(category === 'job' ? 'Five years of stated experience' : null),
    deadline: fact({ kind: 'date', originalText: '30 October 2026; time not stated', localDate: '2026-10-30', localTime: null, timezone: null, utcInstant: null }, '30 October 2026; time and timezone not stated'),
    compensation: [fact({ kind: 'stipend', amount: 4000, maximum: null, currency: 'ZAR', period: 'month', coverage: null }, 'Fictional stipend: ZAR 4000 per month'),
      fact({ kind: 'tuition', amount: null, maximum: null, currency: null, period: 'programme', coverage: 'Full stated tuition' })],
    practicalConditions: fact('Attendance conditions need to be checked against the fictional notice.'),
    requirements: { id: 'requirements_fixture', revision: 1,
      requirements: [
        { id: 'matric', kind: 'education', level: 'required', fact: fact({ description: 'Grade 12 with Maths',
          qualification: { designation: 'Grade 12', level: null, completion: 'completed', subjects: [{ name: 'Maths', minimumPercent: 50 }] }, document: null }, 'Grade 12 with Maths at 50%') },
        { id: 'n2', kind: 'education', level: 'required', fact: fact({ description: 'N2 certificate',
          qualification: { designation: 'N2', level: null, completion: 'provisional', subjects: [] }, document: null }, 'N2 certificate as an alternative') },
      ], expression: { op: 'any', children: [{ op: 'ref', id: 'matric' }, { op: 'ref', id: 'n2' }] },
    },
    applicationRoute: fact({ method: 'portal', destination }), lifecycle: 'published',
    publication: { approved: true, previouslyPublic: true, disposition: 'clear', reviewedBy: 'reviewer_fixture' },
    citations: [{ id: 'citation_fixture', label: 'Fictional source notice', url: 'https://issuer.example/notice', snapshotId: 'snapshot_fixture_1', approved: true }],
    checks: [{ id: 'check_fixture', scope: 'application_relationship', outcome: 'supported', checkedAt: NOW, nextCheckAt: null,
      reviewerId: 'reviewer_fixture', citationIds: ['citation_fixture'], recordRevision: 1, destination, public: true, notes: 'PRIVATE_CHECK_SENTINEL' }],
    explanation: null,
    private: { reviewerNotes: 'PRIVATE_REVIEW_SENTINEL', rawSource: 'PRIVATE_SOURCE_SENTINEL', submittedUrl: 'https://private.example/SECRET', queueId: 'PRIVATE_QUEUE_SENTINEL' },
    createdAt: NOW, updatedAt: NOW,
  };
}
export function allFixtures() {
  return [...categories.map(category => makeRecord(category)), makeRecord('internship', 'graduate')];
}
