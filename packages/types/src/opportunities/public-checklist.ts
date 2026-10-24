import { z } from 'zod';
import { CATEGORY_LABELS, LIMITS, IdSchema, InstantSchema, JsonBoundarySchema } from './primitives';
import { ProjectionSchema, type PublicOpportunity } from './public';
import { formatRequirements } from './requirements';

export const PUBLIC_CHECKLIST_MAX_BYTES = 64 * 1024;
export type PublicChecklistExport = {
  kind: 'checklist' | 'link';
  text: string;
  canonicalUrl: string;
  filename: string;
};

export const PublicChecklistOriginSchema = z.string().max(2048).refine(value => {
  try { const u = new URL(value); return u.protocol === 'https:' && u.origin === value; }
  catch { return false; }
}, 'Expected a trusted HTTPS origin without path, credentials, query or fragment');

const Context = JsonBoundarySchema.pipe(z.object({
  origin: PublicChecklistOriginSchema,
  id: IdSchema,
  exportedAt: InstantSchema,
}).strict());
const PublicInput = JsonBoundarySchema.pipe(ProjectionSchema);
const scopes = {
  issuer_attribution: 'Who issued the opportunity',
  announcement: 'Source announcement',
  application_relationship: 'Application route linked to the notice',
  destination_reachability: 'Application destination reachable',
  availability: 'Opportunity availability',
  requirements: 'Requirement wording and meaning',
} as const;
const outcomes = {
  supported: 'Supported by the cited evidence',
  unresolved: 'Unresolved; needs confirmation',
  failed: 'Check failed; needs confirmation',
  contradicted: 'Conflicting evidence; needs review',
} as const;
const methods = { human: 'Human check', automatic: 'Automated check' } as const;
const routes = { portal: 'portal', email: 'email', in_person: 'in person', post: 'post' } as const;
const internship = {
  student_wil: 'Student / work-integrated learning',
  graduate: 'Graduate internship',
  other_stated: 'Other stated internship route',
  unknown: 'Internship route not stated',
} as const;

// Coarse UTF-16 budget before the existing authoritative JSON/UTF-8 validator.
// Never serialize a large rejected object (or sparse array) just to measure it.
function withinCharacterBudget(value: unknown): boolean {
  let remaining = LIMITS.bytes as number, nodes = 0;
  const seen = new Set<object>();
  function visit(item: unknown, depth: number): boolean {
    if (++nodes > 20_000 || depth > 40 || --remaining < 0) return false;
    if (typeof item === 'string') { remaining -= item.length; return remaining >= 0; }
    if (item === null || typeof item === 'boolean') return true;
    if (typeof item === 'number') return Number.isFinite(item);
    if (typeof item !== 'object' || seen.has(item)) return false;
    if (!Array.isArray(item) && Object.getPrototypeOf(item) !== Object.prototype) return false;
    seen.add(item);
    if (Array.isArray(item)) {
      if (item.length > 20_000) return false;
      for (let i = 0; i < item.length; i++) if (!Object.hasOwn(item, i) || !visit(item[i], depth + 1)) return false;
    } else {
      for (const key in item) {
        if (!Object.hasOwn(item, key)) continue;
        remaining -= key.length;
        if (remaining < 0 || !visit((item as Record<string, unknown>)[key], depth + 1)) return false;
      }
    }
    seen.delete(item);
    return true;
  }
  return visit(value, 0);
}

// Keep generated labels on their own lines; public source wording remains plain text.
function line(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim();
}
function fact(label: string, value: Pick<PublicOpportunity['experience'], 'originalText' | 'state'>): string {
  return label + ': ' + line(value.originalText ?? 'Not stated; confirm with the issuer') +
    (value.state === 'stated' ? '' : ' [needs confirmation: ' + value.state.replaceAll('_', ' ') + ']');
}
const limits = [
  'This is a dated public preparation copy, not the full notice or an eligibility decision.',
  'Read the current detail and original notice before acting. A saved copy cannot update itself after corrections or closure.',
  'Personal checklist ticks, saved stages and private receipts are not included. This is not an application or proof of submission.',
];

/**
 * Pure public whitelist. Callers must obtain a fresh, authorized public read before every export.
 * A clock/schema cannot prove source truth or that a cached projection is still public.
 * Invalid context returns null; unavailable/unsafe input returns only a canonical reference.
 * No browser storage, personal state, network access or implicit clock is read.
 */
export function formatPublicChecklist(input: unknown, context: unknown): PublicChecklistExport | null {
  let parsedContext: z.infer<typeof Context>;
  try {
    if (!withinCharacterBudget(context)) return null;
    const parsed = Context.safeParse(context);
    if (!parsed.success) return null;
    parsedContext = parsed.data;
  } catch { return null; }
  const { origin, id, exportedAt } = parsedContext;
  const canonicalUrl = new URL('/opportunities/' + id, origin).href;
  const fallback: PublicChecklistExport = {
    kind: 'link',
    canonicalUrl,
    filename: 'skilved-' + id + '.txt',
    text: [
      'Skilved public opportunity reference',
      'Copy prepared: ' + exportedAt + ' (UTC)',
      'Current details and application instructions could not be included. Open the canonical link for current availability.',
      'Canonical Skilved detail: ' + canonicalUrl,
      ...limits,
    ].join('\n'),
  };
  try {
    if (!withinCharacterBudget(input)) return fallback;
    const parsed = PublicInput.safeParse(input);
    if (!parsed.success || parsed.data.kind !== 'opportunity') return fallback;
    const o = parsed.data.opportunity;
    if (o.id !== id || o.lifecycle !== 'published' || o.application.state !== 'available' ||
      o.createdAt > exportedAt || o.updatedAt > exportedAt ||
      o.checks.some(check => check.checkedAt > exportedAt ||
        (check.method === 'automatic' && (!check.nextCheckAt || check.nextCheckAt <= exportedAt))) ||
      (o.deadline.state === 'stated' && o.deadline.value?.utcInstant && o.deadline.value.utcInstant <= exportedAt)) return fallback;

    const citation = (ids: string[]) => ids.map(reference => {
      const c = o.citations.find(item => item.id === reference)!;
      return line(c.label) + ': ' + new URL(c.url).href;
    }).join(' | ');
    const lines = [
      'Skilved public preparation checklist',
      'Copy prepared: ' + exportedAt + ' (UTC)',
      'Listing updated: ' + o.updatedAt + ' (UTC); this is separate from source-check times.',
      'Listing revision: ' + o.revision,
      'Title: ' + line(o.title.value ?? 'Title needs confirmation'),
      fact('Issuer wording', o.issuer),
      'Category: ' + CATEGORY_LABELS[o.category],
      ...(o.internship ? ['Internship context: ' + internship[o.internship.subtype] +
        (o.internship.originalText ? ' — ' + line(o.internship.originalText) : '')] : []),
      fact('Intake wording', o.intake),
      fact('Deadline wording', o.deadline),
      fact('Experience wording', o.experience),
      fact('Residence wording', o.residence),
      fact('Practical conditions wording', o.practicalConditions),
      '',
      'Requirements and alternatives (source wording):',
      line(formatRequirements(o.requirements)),
      'Follow the alternatives and conditions. You may not need every alternative.',
      ...o.requirements.requirements.flatMap((item, index) => [
        String(index + 1) + '. [' + item.level + '; ' + item.fact.state.replaceAll('_', ' ') + '] ' +
          line(item.fact.originalText ?? 'Instruction not stated; confirm with the issuer'),
        '   Public instruction sources: ' + (item.fact.citations.length ? citation(item.fact.citations) : 'Not recorded; confirm with the issuer'),
      ]),
      ...(o.requirements.requirements.length ? [] : ['No individual preparation instructions are stated. Confirm with the issuer.']),
      '',
      'Public source notices:',
      ...(o.citations.length ? o.citations.map(c => '- ' + line(c.label) + ': ' + new URL(c.url).href) : ['No public source reference recorded.']),
      '',
      'Recorded checks (each scope is separate):',
    ];
    for (const [scope, label] of Object.entries(scopes)) {
      const checks = o.checks.filter(check => check.scope === scope);
      if (!checks.length) lines.push(label + ': No recorded check for this question.');
      for (const check of checks) {
        lines.push(label + ': ' + outcomes[check.outcome] + '; ' +
          (check.method ? methods[check.method] : 'Check method not recorded') + '; checked ' + check.checkedAt + ' (UTC).');
        if (check.nextCheckAt) lines.push('Recorded next-check time: ' + check.nextCheckAt + ' (UTC); this does not show that another check occurred.');
        lines.push('Check sources: ' + citation(check.citations));
      }
    }
    const route = o.application.route;
    lines.push(
      '',
      'Canonical Skilved detail: ' + canonicalUrl,
      'Official application destination (' + routes[route.method] + ', as recorded): ' +
        (route.method === 'portal' ? new URL(route.destination).href : line(route.destination)),
      'Use the current detail to check the application route before following the destination. You complete and submit the application yourself.',
      '',
      ...limits,
    );
    const text = lines.join('\n');
    // Fall back as a whole rather than truncating a condition or one side of an alternative.
    if (new TextEncoder().encode(text).length > PUBLIC_CHECKLIST_MAX_BYTES) return fallback;
    return { kind: 'checklist', text, canonicalUrl, filename: 'skilved-' + id + '-r' + o.revision + '.txt' };
  } catch { return fallback; }
}
