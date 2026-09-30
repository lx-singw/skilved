import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import { mapExtraction, ExtractionSchema } from './extraction.mjs';
import { assertMaterialFacts } from '../worker-policy.mjs';
import {SourceAuditSchema,evaluateSourceAudit} from './source-audit.mjs';

export const EVALUATION_VERSION='recentjobs_evaluation_v2';

const wording = z.string().min(1).max(4000);
export const RequirementExpectations = z.object({
  requirements: z.array(z.object({id:z.string().regex(/^[a-z][a-z0-9_]*$/), passage:wording,
    level:z.enum(['required','preferred','unclear']),
    kind:ExtractionSchema.shape.requirements.shape.items.element.shape.kind.optional()}).strict()).min(1).max(40),
  // Expected ALL/ANY/IF tree with references to the expectation ids above.
  expression:z.unknown(),
  sourceAudit:SourceAuditSchema.optional(),
}).strict();
export const EvaluationExpectations = RequirementExpectations.extend({
  facts: z.array(z.object({ path:z.string().regex(/^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*$/), value:z.unknown() }).strict()).min(1).max(50),
  application: z.object({method:z.enum(['portal','email']), destination:wording}).strict(),
}).strict();
export const digest = value => createHash('sha256').update(value).digest('hex');
const valueAt = (object, path) => path.split('.').reduce((value, key) =>
  value != null && Object.hasOwn(value, key) ? value[key] : undefined, object);

function normalise(node, resolve, depth = 0) {
  if (!node || depth > 6) throw new Error('EVALUATION_LOGIC_INVALID');
  if (node.op === 'ref') return ['ref', resolve(node.id)];
  if (['all','any'].includes(node.op) && Array.isArray(node.children) && node.children.length > 0 && node.children.length <= 40) {
    return [node.op, ...node.children.map(child => normalise(child, resolve, depth + 1))
      .sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))];
  }
  if (node.op === 'if') return ['if',resolve(node.condition),normalise(node.then,resolve,depth + 1),
    node.otherwise == null ? null : normalise(node.otherwise,resolve,depth + 1)];
  throw new Error('EVALUATION_LOGIC_INVALID');
}

/** Offline development checks only: never approves a source, destination or publication. */
export function evaluateRequirements(candidate, input, expectations) {
  const expected = RequirementExpectations.parse(expectations), requirements = ExtractionSchema.shape.requirements.parse(input), issues = [];
  const ids = new Set(expected.requirements.map(item => item.id));
  if (ids.size !== expected.requirements.length) throw new Error('EVALUATION_EXPECTATION_INVALID');
  const referenced = new Set();
  const expectedTree = normalise(expected.expression, id => {
    if (!ids.has(id)) throw new Error('EVALUATION_EXPECTATION_INVALID'); referenced.add(id); return id;
  });
  if (referenced.size !== ids.size) throw new Error('EVALUATION_EXPECTATION_INVALID');
  for (const item of expected.requirements) {
    if (!`${candidate.title}\n${candidate.sourceText}`.includes(item.passage)) throw new Error('EVALUATION_EXPECTATION_NOT_IN_SOURCE');
  }
  for (const item of expected.requirements) {
    const matching=requirements.items.filter(r => r.fact.state === 'stated' && r.level === item.level && r.fact.value.description.includes(item.passage));
    if (!matching.length)
      issues.push({code:'REQUIREMENT_MISSING_OR_LEVEL_WRONG', requirement:item.id});
    else if(item.kind!==undefined&&!matching.some(r=>r.kind===item.kind))
      issues.push({code:'REQUIREMENT_KIND_MISMATCH',requirement:item.id});
  }
  try {
    const tree = normalise(requirements.expression, id => {
      const actual = requirements.items.find(r => r.id === id);
      const matches = expected.requirements.filter(r => actual?.fact.value?.description.includes(r.passage));
      if (matches.length !== 1) throw new Error('EVALUATION_LOGIC_INVALID');
      return matches[0].id;
    });
    if (!isDeepStrictEqual(tree, expectedTree)) issues.push({code:'REQUIREMENT_LOGIC_MISMATCH'});
  } catch { issues.push({code:'REQUIREMENT_LOGIC_REVIEW_REQUIRED'}); }
  if(expected.sourceAudit) {
    const targetedMatched=issues.length===0,sourceAudit=evaluateSourceAudit(candidate,requirements,expected.sourceAudit);
    issues.push(...sourceAudit.issues);
    return {matched:issues.length===0,issues,targetedMatched,sourceAudit};
  }
  return {matched:issues.length === 0, issues};
}

export function evaluateExtraction(candidate, extraction, input, now) {
  const expected = EvaluationExpectations.parse(input);
  const requirementResult = evaluateRequirements(candidate,extraction.requirements,
    {requirements:expected.requirements,expression:expected.expression,sourceAudit:expected.sourceAudit});
  const issues = [...requirementResult.issues];
  const mapped = mapExtraction(candidate, extraction, {sourceId:'offline_evaluation', now:new Date(now).toISOString()});
  if (!mapped.record) return {matched:false, issues:[{code:mapped.reason ?? 'EXTRACTION_REJECTED'}]};
  const record = mapped.record;
  try { assertMaterialFacts(record); } catch (error) { issues.push({code:error.code}); }
  for (const fact of expected.facts) {
    if (!isDeepStrictEqual(valueAt(record, fact.path), fact.value)) issues.push({code:'FACT_MISMATCH', path:fact.path});
  }
  if (!isDeepStrictEqual(record.applicationRoute.value, expected.application)) issues.push({code:'APPLICATION_MISMATCH'});
  return {matched:issues.length === 0, issues,
    ...(requirementResult.sourceAudit?{targetedMatched:requirementResult.targetedMatched,sourceAudit:requirementResult.sourceAudit}:{})};
}
