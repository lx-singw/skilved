import { createHash } from 'node:crypto';
import { DomainError } from '../config.mjs';
import { planRecentJobsProgrammes, programmePassage, programmeReviewPayload } from '../adapters/recentjobs-programmes.mjs';
import { generateStructured, extractionConfiguration } from './provider.mjs';
import { GROQ_EXTRACTION_INSTRUCTION, GROQ_EXTRACTION_SCHEMA, GroqExtractionSchema, groqExtractionPayload, decodeGroqExtraction } from './groq-schema.mjs';
import { ExtractionSchema, mapExtraction } from './extraction.mjs';
import { validationContract, validationPayload, validateAssessment } from './validation.mjs';
import { allFacts } from '../worker-policy.mjs';
import { OpportunityRecordSchema } from '@skilved/types/opportunities/internal';
import { rejectedOutputDiagnostic } from './rejected-output.mjs';

export const PROGRAMME_EXTRACTION_VERSION = 'recentjobs_programme_extraction_v3';
export const PROGRAMME_VALIDATION_VERSION = 'recentjobs_programme_validation_v3';
const GEMINI_VALIDATION_MAX_TOKENS = 6144;
const hash = value => createHash('sha256').update(value).digest('hex');
const fail = code => { throw new DomainError(code); };
const scopeOf = (candidate,id) => {
  const plan = planRecentJobsProgrammes(candidate), intake = plan.intakes.find(i => i.id === id);
  if (!intake) fail('PROGRAMME_SCOPE_UNSUPPORTED');
  return {plan,intake};
};
const inside = (intake,line) => intake.includedSpans.some(([first,last]) => first <= line && line <= last);

// Only standalone instructions for obtaining a blank form are classified here.
// Mixed clauses about completed forms/submission stay subject to semantic review.
function formRequestInstructions(candidate,id) {
  const {intake}=scopeOf(candidate,id);
  return `${candidate.title}\n${candidate.sourceText}`.split('\n').flatMap((text,index)=>
    inside(intake,index+1) && /^(?:Request|Obtain|Download)\s+(?:(?:an?|the)\s+)?application\s+form\s+(?:from|via|at)\s+.{1,300}$/i.test(text.trim()) &&
    !/\b(?:submit|return|attach|completed|required|compulsory|must)\b/i.test(text)
      ? [{originalText:text,span:[index+1,index+1]}] : []);
}

// A local coverage view only. Providers and stored evidence retain the full original source.
export function programmeCandidate(candidate,id) {
  const {plan,intake} = scopeOf(candidate,id), lines = `${candidate.title}\n${candidate.sourceText}`.split('\n');
  return {...candidate,sourceRecordId:intake.id,
    contentHash:hash(JSON.stringify({version:PROGRAMME_EXTRACTION_VERSION,source:plan.source,intake})),
    sourceText:lines.slice(1).map((line,index) => inside(intake,index+2)?line:'').join('\n'),
    applicationCandidates:[{method:intake.application.method,destination:intake.application.destination,
      originalText:intake.application.originalText,check:'pending'}],issues:['programme_scope_review_required'],
    programmeScope:{id:intake.id,sourceSha256:plan.source.sourceSha256,includedSpans:intake.includedSpans}};
}

function originalPosition(candidate,intake,quote) {
  const corpus = `${candidate.title}\n${candidate.sourceText}`, lines = corpus.split('\n');
  let at = 0;
  const offsets = lines.map(line => {const from=at;at+=line.length+1;return [from,from+line.length];});
  let position = corpus.indexOf(quote);
  while (position !== -1) {
    if (intake.includedSpans.some(([first,last]) => offsets[first-1][0] <= position && position+quote.length <= offsets[last-1][1])) return position;
    position = corpus.indexOf(quote,position+1);
  }
  fail('PROGRAMME_EVIDENCE_OUTSIDE_SCOPE');
}
const extractionFacts = input => [input.issuer,input.summary,input.intake,input.location,input.residence,input.experience,
  input.deadline,...input.compensation,input.practicalConditions,...input.requirements.items.map(i=>i.fact)];
function unknownQuotes(node) {
  if (node.op === 'unknown') return [node.originalText];
  return node.children ? node.children.flatMap(unknownQuotes) : node.op === 'if' ? [...unknownQuotes(node.then),...(node.otherwise?unknownQuotes(node.otherwise):[])] : [];
}

export function mapProgrammeExtraction(candidate,id,input,options) {
  const {intake} = scopeOf(candidate,id), extraction = ExtractionSchema.parse(input);
  const quotes = [extraction.categoryQuote,...extractionFacts(extraction).map(f=>f.quote),...unknownQuotes(extraction.requirements.expression)].filter(Boolean);
  for (const quote of quotes) originalPosition(candidate,intake,quote);
  if (extraction.intake.state !== 'stated' || extraction.intake.value !== intake.reference.value ||
      extraction.intake.quote !== intake.reference.originalText || extraction.applicationCandidateIndex !== 0) fail('PROGRAMME_INTAKE_MISMATCH');
  // This narrow planner selects apprenticeship trades, not the separate WIL intake.
  // Keep WIL-only shared wording in the source audit; abstain if it becomes a trade requirement.
  if (extraction.requirements.items.some(i=>/\bfor WIL applicants\b/i.test(i.fact.quote ?? ''))) fail('PROGRAMME_SHARED_CONDITION_UNRESOLVED');
  for (const instruction of formRequestInstructions(candidate,id)) {
    if (extraction.requirements.items.some(i=>i.fact.quote?.includes(instruction.originalText))) fail('PROGRAMME_FORM_REQUEST_MISCLASSIFIED');
    if (extraction.practicalConditions.state !== 'stated' || !extraction.practicalConditions.quote?.includes(instruction.originalText) ||
        !extraction.practicalConditions.value?.includes(instruction.originalText)) fail('PROGRAMME_FORM_REQUEST_COVERAGE');
  }
  const lines = `${candidate.title}\n${candidate.sourceText}`.split('\n');
  const conditionLines = lines.filter((line,index)=>inside(intake,index+1) &&
    /^(?:Applicants? must submit|Applicants? (?:must have|require)|Requirements include)\b/i.test(line.trim()));
  if (conditionLines.some(line=>!quotes.some(quote=>quote.includes(line)))) fail('AI_REQUIREMENT_COVERAGE');
  const mapped = mapExtraction(programmeCandidate(candidate,id),extraction,options);
  if (!mapped.record) fail('CATEGORY_UNRESOLVED');
  const parentSnapshot = hash(`${options.sourceId}:${candidate.sourceUrl}:${candidate.contentHash}`);
  mapped.record.title.value = intake.heading.originalText; mapped.record.title.originalText = intake.heading.originalText;
  mapped.evidence.find(e=>e.id===mapped.record.title.id).quote = intake.heading.originalText;
  for (const fact of allFacts(mapped.record)) if (fact.sourceSnapshotIds.length) fact.sourceSnapshotIds = [parentSnapshot];
  for (const evidence of mapped.evidence) {
    evidence.snapshotId=parentSnapshot;evidence.start=originalPosition(candidate,intake,evidence.quote);evidence.end=evidence.start+evidence.quote.length;
    if (evidence.applicationCandidate) evidence.applicationCandidate.index=intake.application.index;
  }
  mapped.record.private.queueId=parentSnapshot;
  for (const citation of mapped.record.citations) citation.snapshotId=parentSnapshot;
  mapped.snapshot={...mapped.snapshot,id:parentSnapshot,contentHash:candidate.contentHash,
    text:`${candidate.title}\n${candidate.sourceText}`,hash:hash(`${candidate.title}\n${candidate.sourceText}`)};
  mapped.programmeScope=programmeCandidate(candidate,id).programmeScope;
  mapped.record=OpportunityRecordSchema.parse(mapped.record);
  return mapped;
}

const scopeInstruction = `
This is one explicitly selected apprenticeship trade inside a multi-programme notice.
Use only includedSpans for this trade's facts. All original lines remain visible for context.
Never cite another trade or the experiential programme. Select applicationCandidateIndex=0 only.
Copy selectedIntake.reference.value exactly, including spaces. Shared wording needs applicability review.
WIL-only document instructions belong to the separate WIL intake, not this apprenticeship's requirements.
formRequestInstructions identify standalone steps for obtaining a blank application form.
Preserve each instruction verbatim, including its recipient, in practicalConditions. Do not make it a requirement item.
The form-request recipient is not the submission destination. Required completed-form submission remains a document requirement.
Do not concatenate separated source ranges into one span or quote. Missing mandatory conditions fail.`;

const outputInstruction = `
Return one opportunity DATA object. The schema below describes its permitted shape; do not return the schema itself.
The root data keys are exactly: ${Object.keys(GroqExtractionSchema.shape).join(', ')}.
Do not add schema keywords such as type, properties, required, additionalProperties, definitions or $schema to the data.
For this programme task, a complete condition on one numbered source line is ONE requirement item.
This rule takes precedence over examples that split alternatives: keep the entire single-line OR condition
in one item and cite that line once. Its verbatim wording preserves the internal alternatives.
Use any(...) only between alternatives that have separately citable, distinct source passages.
Before returning, check that every item has a unique source span and every required root key is present.
Return only the data object, without explanations or a schema wrapper.`;

export function programmeExtractionPayload(candidate,id) {
  const {intake} = scopeOf(candidate,id), view=programmeCandidate(candidate,id);
  return {...groqExtractionPayload(view),sourceLines:groqExtractionPayload(candidate).sourceLines,
    selectedIntake:intake,programmeScope:view.programmeScope,formRequestInstructions:formRequestInstructions(candidate,id)};
}
export async function extractProgramme(candidate,id,options={}) {
  const result = await generateStructured(programmeExtractionPayload(candidate,id),
    {instruction:GROQ_EXTRACTION_INSTRUCTION+scopeInstruction+outputInstruction,schema:GROQ_EXTRACTION_SCHEMA,version:PROGRAMME_EXTRACTION_VERSION},options);
  try {
    const parsed = GroqExtractionSchema.safeParse(result.extraction);
    if (!parsed.success) {
      const error = new DomainError('AI_INVALID_EXTRACTION');
      error.outputDiagnostic = rejectedOutputDiagnostic(JSON.stringify(result.extraction),GROQ_EXTRACTION_SCHEMA);
      throw error;
    }
    const wire = parsed.data;
    const spans = [wire.categorySpan,...['issuer','summary','intake','location','residence','experience','deadline','practicalConditions'].map(k=>wire[k]?.span),
      ...wire.compensation.map(f=>f.span),...wire.requirements.items.map(i=>i.span)].filter(Boolean);
    for (const span of spans) programmePassage(candidate,id,span);
    const extraction = decodeGroqExtraction(wire,{...candidate,applicationCandidates:programmeCandidate(candidate,id).applicationCandidates});
    return {...result,extraction};
  } catch (error) {error.usage=result.provenance.usage;throw error;}
}

export async function validateProgramme(input,candidate,id,options={}) {
  const scope=programmeReviewPayload(candidate,id),config=extractionConfiguration(options.env ?? process.env);
  const contract=validationContract(null);
  const result = await generateStructured({...validationPayload(input),selectedIntake:scope.intake,programmeScope:scope.intake.includedSpans,
    formRequestInstructions:formRequestInstructions(candidate,id)},
    {...contract,instruction:contract.instruction+scopeInstruction,version:PROGRAMME_VALIDATION_VERSION},
    {...options,...(config.provider==='gemini'?{maxOutputTokens:GEMINI_VALIDATION_MAX_TOKENS}:{}),
      env:{...(options.env ?? process.env),SKILVED_AI_THINKING:config.validationThinking}});
  try {
    const assessment=validateAssessment(result.extraction,input.recentjobsText);
    if (assessment.supported) for (const e of assessment.evidence) originalPosition(candidate,scope.intake,e.quote);
    return {...assessment,provenance:result.provenance};
  } catch(error) {error.usage=result.provenance.usage;throw error;}
}

export function validateProgrammeAssessment(input,candidate,id) {
  const {intake}=scopeOf(candidate,id),assessment=validateAssessment(input,`${candidate.title}\n${candidate.sourceText}`);
  if (assessment.supported) for (const e of assessment.evidence) originalPosition(candidate,intake,e.quote);
  return assessment;
}
