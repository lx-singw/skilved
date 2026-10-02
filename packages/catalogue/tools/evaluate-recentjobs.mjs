import { open } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { z } from 'zod';
import { digest, EvaluationExpectations, evaluateExtraction, evaluateRequirements, EVALUATION_VERSION } from '../src/ai/evaluation.mjs';
import {validateSourceAudit} from '../src/ai/source-audit.mjs';
import { GROQ_EXTRACTION_VERSION, GROQ_EXTRACTION_INSTRUCTION, GROQ_EXTRACTION_SCHEMA, decodeGroqExtraction } from '../src/ai/groq-schema.mjs';
import { REQUIREMENTS_VERSION, REQUIREMENTS_INSTRUCTION, requirementsInstruction, requirementsSchema, decodeRequirements, decodeRequirementsV1, decodeRequirementsV2,
  REQUIREMENTS_V1_SCHEMA, REQUIREMENTS_V1_INSTRUCTION, REQUIREMENTS_V2_SCHEMA, REQUIREMENTS_V2_INSTRUCTION,
  decodeRequirementsV3,requirementsSchemaV3,REQUIREMENTS_V3_INSTRUCTION,
  decodeRequirementsV4,requirementsSchemaV4,requirementsInstructionV4,
  decodeRequirementsV5,requirementsSchemaV5,requirementsInstructionV5,
  decodeRequirementsV6,requirementsSchemaV6,requirementsInstructionV6,
  decodeRequirementsV7,requirementsSchemaV7,requirementsInstructionV7,
  decodeRequirementsV8,requirementsSchemaV8,requirementsInstructionV8,
  decodeRequirementsV9,requirementsSchemaV9,requirementsInstructionV9,
  decodeRequirementsV10,requirementsSchemaV10,requirementsInstructionV10,
  decodeRequirementsV11,requirementsSchemaV11,requirementsInstructionV11 } from '../src/ai/requirements.mjs';

const Manifest = z.object({version:z.literal(1), purpose:z.literal('development_regression'),
  observedAt:z.string().datetime(), cases:z.array(z.object({id:z.string().regex(/^[a-z][a-z0-9_-]*$/),
    candidate:z.string().min(1), candidateSha256:z.string().regex(/^[a-f0-9]{64}$/),
    response:z.string().min(1).nullable(), expected:EvaluationExpectations}).strict()).min(1).max(50)}).strict();
// Inputs are explicit local files. No env file, provider, database or network is used.
async function boundedFile(path) {
  const file = await open(path, 'r');
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > 1000000) throw new Error('EVALUATION_FILE_LIMIT');
    const data = Buffer.alloc(1000001); let length = 0;
    while (length < data.length) {
      const {bytesRead} = await file.read(data,length,data.length-length,null);
      if (!bytesRead) break; length += bytesRead;
    }
    if (length > 1000000) throw new Error('EVALUATION_FILE_LIMIT');
    return data.subarray(0,length);
  } finally { await file.close(); }
}
const safeCode = error => /^[A-Z_]+$/.test(error?.code ?? error?.message ?? '') ? error.code ?? error.message : 'EVALUATION_INPUT_INVALID';
if (process.argv.includes('--help')) console.log('Usage: node packages/catalogue/tools/evaluate-recentjobs.mjs [--requirements] <manifest.json>\nOffline regression replay of saved Groq responses. --requirements checks only requirement-stage responses, not metadata or routes. No model calls or publication. JSON report on stdout; exit 1 for missing/rejected/mismatched cases.');
else {
  try {
    const args = process.argv.slice(2), requirementsOnly = args[0] === '--requirements';
    if (requirementsOnly) args.shift();
    if (args.length !== 1) throw new Error('EVALUATION_USAGE');
    const version = requirementsOnly ? REQUIREMENTS_VERSION : GROQ_EXTRACTION_VERSION;
    const instruction = requirementsOnly ? REQUIREMENTS_INSTRUCTION : GROQ_EXTRACTION_INSTRUCTION;
    const schema = requirementsOnly ? null : GROQ_EXTRACTION_SCHEMA;
    const path = resolve(args[0]), bytes = await boundedFile(path), manifest = Manifest.parse(JSON.parse(bytes));
    if (new Set(manifest.cases.map(c => c.id)).size !== manifest.cases.length) throw new Error('EVALUATION_DUPLICATE_CASE');
    const cases = [];
    for (const item of manifest.cases) {
      let responseHash = null, provenance = null, promptSchemaHash = null;
      try {
        const input = await boundedFile(resolve(dirname(path), item.candidate));
        if (digest(input) !== item.candidateSha256) throw new Error('EVALUATION_SOURCE_CHANGED');
        if(item.expected.sourceAudit)validateSourceAudit(JSON.parse(input),item.expected.sourceAudit);
        if (!item.response) { cases.push({id:item.id, status:'not_run', issues:[]}); continue; }
        const responseBytes = await boundedFile(resolve(dirname(path), item.response)); responseHash = digest(responseBytes);
        const response = JSON.parse(responseBytes), candidate = JSON.parse(input); provenance = response.provenance;
        if (requirementsOnly && ![REQUIREMENTS_VERSION,'recentjobs_requirements_v1','recentjobs_requirements_v2','recentjobs_requirements_v3','recentjobs_requirements_v4','recentjobs_requirements_v5','recentjobs_requirements_v6','recentjobs_requirements_v7','recentjobs_requirements_v8','recentjobs_requirements_v9','recentjobs_requirements_v10','recentjobs_requirements_v11'].includes(provenance?.extractionVersion)) throw new Error('EVALUATION_VERSION_UNSUPPORTED');
        const historical = provenance?.extractionVersion === 'recentjobs_requirements_v1'
          ? [decodeRequirementsV1,REQUIREMENTS_V1_INSTRUCTION,REQUIREMENTS_V1_SCHEMA]
          : provenance?.extractionVersion === 'recentjobs_requirements_v2'
            ? [decodeRequirementsV2,REQUIREMENTS_V2_INSTRUCTION,REQUIREMENTS_V2_SCHEMA]
            : provenance?.extractionVersion === 'recentjobs_requirements_v3'
              ? [decodeRequirementsV3,REQUIREMENTS_V3_INSTRUCTION,requirementsSchemaV3(candidate)]
              : provenance?.extractionVersion === 'recentjobs_requirements_v4'
                ? [decodeRequirementsV4,requirementsInstructionV4(candidate),requirementsSchemaV4(candidate)]
                : provenance?.extractionVersion === 'recentjobs_requirements_v5'
                  ? [decodeRequirementsV5,requirementsInstructionV5(candidate),requirementsSchemaV5(candidate)]
                  : provenance?.extractionVersion === 'recentjobs_requirements_v6'
                    ? [decodeRequirementsV6,requirementsInstructionV6(candidate),requirementsSchemaV6(candidate)]
                    : provenance?.extractionVersion === 'recentjobs_requirements_v7'
                      ? [decodeRequirementsV7,requirementsInstructionV7(candidate),requirementsSchemaV7(candidate)]
                      : provenance?.extractionVersion === 'recentjobs_requirements_v8'
                        ? [decodeRequirementsV8,requirementsInstructionV8(candidate),requirementsSchemaV8(candidate)]
                        : provenance?.extractionVersion === 'recentjobs_requirements_v9'
                          ? [decodeRequirementsV9,requirementsInstructionV9(candidate),requirementsSchemaV9(candidate)]
                          : provenance?.extractionVersion === 'recentjobs_requirements_v10'
                            ? [decodeRequirementsV10,requirementsInstructionV10(candidate),requirementsSchemaV10(candidate)]
                            : provenance?.extractionVersion === 'recentjobs_requirements_v11'
                              ? [decodeRequirementsV11,requirementsInstructionV11(candidate),requirementsSchemaV11(candidate)] : null;
        const requirementsDecoder = historical?.[0] ?? decodeRequirements;
        promptSchemaHash = digest(JSON.stringify(requirementsOnly
          ? historical ? historical.slice(1) : [requirementsInstruction(candidate),requirementsSchema(candidate)] : [instruction,schema]));
        const result = requirementsOnly ? evaluateRequirements(candidate,requirementsDecoder(response.extraction,candidate),
          {requirements:item.expected.requirements,expression:item.expected.expression,sourceAudit:item.expected.sourceAudit})
          : evaluateExtraction(candidate, decodeGroqExtraction(response.extraction, candidate), item.expected, manifest.observedAt);
        cases.push({id:item.id, status:result.matched ? 'matched' : 'mismatch', issues:result.issues,
          expectationScope:item.expected.sourceAudit?'targeted_plus_source_inventory':'targeted',
          ...(result.sourceAudit?{targetedMatched:result.targetedMatched,sourceAuditMatched:result.sourceAudit.matched,reviewer:item.expected.sourceAudit.reviewer}:{}),
          responseHash, promptSchemaHash, currentExtractionVersion:provenance?.extractionVersion === version});
      } catch (error) { cases.push({id:item.id, status:'rejected', issues:[{code:safeCode(error)}], responseHash,
        promptSchemaHash, currentExtractionVersion:provenance?.extractionVersion === version}); }
    }
    console.log(JSON.stringify({purpose:manifest.purpose, scope:requirementsOnly ? 'requirements_only' : 'full_extraction', qualification:false, manifestHash:digest(bytes),
      extractionVersion:version,
      evaluationVersion:EVALUATION_VERSION,
      promptSchemaHash:requirementsOnly ? null : digest(JSON.stringify([instruction,schema])),
      schemaScope:requirementsOnly ? 'per_candidate_and_response_version' : 'static',
      newModelCalls:0, counts:Object.fromEntries(['matched','mismatch','rejected','not_run'].map(status => [status,cases.filter(c => c.status === status).length])), cases}, null, 2));
    if (cases.some(c => c.status !== 'matched')) process.exitCode = 1;
  } catch (error) { console.error(JSON.stringify({error:safeCode(error)})); process.exitCode = 1; }
}
