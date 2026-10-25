import {isDeepStrictEqual} from 'node:util';
import {OpportunityRecordSchema} from '@skilved/types/opportunities/internal';

export const REPEAT_EVIDENCE_VERSION = 'recentjobs_repeat_evidence_v2';
const sha256 = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const genericDirections = new Set(['Apply now online', 'Apply online', 'Apply now', 'Click here to apply']);
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const key = value => JSON.stringify(canonical(value));
const sorted = values => values.sort((a,b) => key(a).localeCompare(key(b)));
const fact = value => ({state:value.state, value:value.value, originalText:value.originalText});

function materialCore(record) {
  const items = record.requirements.requirements.map(item => ({id:item.id,
    value:{kind:item.kind, level:item.level, fact:fact(item.fact)}}));
  const requirements = new Map(items.map(item => [item.id, item.value]));
  const logic = node => node.op === 'ref' ? {op:'ref', requirement:requirements.get(node.id)}
    : node.children ? {op:node.op, children:sorted(node.children.map(logic))}
    : node.op === 'if' ? {op:'if', condition:requirements.get(node.condition), then:logic(node.then),
      otherwise:node.otherwise ? logic(node.otherwise) : null} : node;
  return {category:record.category, internship:record.internship, title:fact(record.title),
    fields:[...record.fields].sort(), organisations:sorted(record.organisations.map(fact)),
    compensation:sorted(record.compensation.map(fact)), practicalConditions:fact(record.practicalConditions),
    issuer:fact(record.issuer), intake:fact(record.intake), location:fact(record.location),
    deadline:fact(record.deadline), residence:fact(record.residence), experience:fact(record.experience),
    entryStage:record.entryStage ? fact(record.entryStage) : null,
    application:fact(record.applicationRoute), requirements:sorted(items.map(item => item.value)),
    expression:logic(record.requirements.expression)};
}

function optionalDirectionDuplication(baseline, repeat, candidate) {
  if (!candidate || candidate.applicationCandidates?.length !== 1 || candidate.applicationInstructions?.length ||
      candidate.programmeScope || candidate.issues?.includes('programme_subject_scope_review_required')) return false;
  const route = candidate.applicationCandidates[0];
  if (route.method !== 'portal' || !genericDirections.has(route.originalText) ||
      typeof candidate.sourceText !== 'string' || !candidate.sourceText.split('\n').includes(route.originalText)) return false;
  let url;
  try { url = new URL(route.destination); } catch { return false; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) return false;
  if (![baseline,repeat].every(record => record.applicationRoute.state === 'stated' &&
      isDeepStrictEqual(record.applicationRoute.value, {method:'portal',destination:route.destination}) &&
      record.applicationRoute.originalText === route.originalText)) return false;
  const absent = value => value.state === 'not_stated' && value.value === null && value.originalText === null;
  const duplicate = value => value.state === 'stated' && value.value === route.originalText && value.originalText === route.originalText;
  return absent(baseline.practicalConditions) && duplicate(repeat.practicalConditions) ||
    duplicate(baseline.practicalConditions) && absent(repeat.practicalConditions);
}

/** Offline evaluation of trusted records/receipts. Never repairs an answer, fetches,
 * grants source authority, refreshes a draft, or approves publication. */
export function inspectRepeat({baselineRecord, repeatRecord, sourceCandidate, sourceHash, expectedSourceHash,
  checklist, assessment, extractionProvenance, validationProvenance, receipts = [], priorReceiptIds,
  beforePreservationHashes, afterPreservationHashes}) {
  const issues = [], flag = (ok,code) => { if (!ok) issues.push(code); };
  const inventoryValid = Array.isArray(priorReceiptIds) && priorReceiptIds.every(id => typeof id === 'string' && id.length > 0);
  flag(inventoryValid, 'PRIOR_RECEIPT_INVENTORY_REQUIRED');
  const seen = new Set(inventoryValid ? priorReceiptIds : []);
  const successful = (stage,provenance) => !provenance || !sha256(provenance.requestHash) ||
    !provenance.provider || !provenance.model || !Array.isArray(receipts) ? [] : receipts.filter(receipt =>
      receipt && typeof receipt.id === 'string' && receipt.id.length > 0 && receipt.stage === stage &&
      receipt.state === 'received' && !seen.has(receipt.id) && receipt.requestHash === provenance.requestHash &&
      receipt.provider === provenance.provider && receipt.model === provenance.model);
  const extraction = successful('extraction',extractionProvenance), validation = successful('validation',validationProvenance);
  flag(extraction.length === 1, 'FRESH_EXTRACTION_CLIENT_REQUEST_REQUIRED');
  flag(validation.length === 1, 'FRESH_VALIDATION_CLIENT_REQUEST_REQUIRED');
  flag(extraction.length === 1 && validation.length === 1 && extraction[0].id !== validation[0].id, 'DISTINCT_STAGE_RECEIPTS_REQUIRED');
  const sourceBound = sha256(sourceHash) && sourceHash === expectedSourceHash && sourceCandidate?.contentHash === sourceHash;
  flag(sourceBound, 'SOURCE_CHANGED');
  flag(checklist?.passed === true, 'FROZEN_CHECKLIST_FAILED');
  flag(assessment?.supported === true && Array.isArray(assessment.issues) && assessment.issues.length === 0, 'SEMANTIC_ASSESSMENT_FAILED');
  const recordsValid = OpportunityRecordSchema.safeParse(baselineRecord).success && OpportunityRecordSchema.safeParse(repeatRecord).success;
  flag(recordsValid, 'REPEAT_RECORD_INVALID');
  let strictMaterialCoreEqual = false, materialCoreEqual = false;
  const allowedRepresentationDifferences = [];
  if (recordsValid) {
    const baseline = materialCore(baselineRecord), repeat = materialCore(repeatRecord);
    strictMaterialCoreEqual = isDeepStrictEqual(baseline,repeat);
    materialCoreEqual = strictMaterialCoreEqual;
    if (!strictMaterialCoreEqual && sourceBound && optionalDirectionDuplication(baselineRecord,repeatRecord,sourceCandidate)) {
      // Only comparison views omit the acknowledged duplicate; input records stay intact.
      const {practicalConditions:baselineDirection,...baselineOther} = baseline;
      const {practicalConditions:repeatDirection,...repeatOther} = repeat;
      materialCoreEqual = isDeepStrictEqual(baselineOther,repeatOther);
      allowedRepresentationDifferences.push('generic_portal_direction_duplication');
    }
    flag(materialCoreEqual, 'MATERIAL_REPRESENTATION_DIFFERENCE_REQUIRES_REVIEW');
  }
  flag(beforePreservationHashes && afterPreservationHashes && Object.keys(beforePreservationHashes).length > 0 &&
    isDeepStrictEqual(beforePreservationHashes,afterPreservationHashes), 'ACCEPTED_STATE_CHANGED');
  return {version:REPEAT_EVIDENCE_VERSION, supportedRepeatEvidence:issues.length === 0, issues,
    strictMaterialCoreEqual, materialCoreEqual, allowedRepresentationDifferences,
    summaryByteEqualityRequired:false, requestHashNoveltyRequired:false,
    underlyingModelIndependenceEstablished:false, publication:false, qualification:false};
}
