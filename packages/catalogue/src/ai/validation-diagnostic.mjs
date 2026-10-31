import {z} from 'zod';
const Diagnostic=z.object({version:z.literal('validation_rejection_v1'),schemaValid:z.boolean(),
  shapeFields:z.array(z.enum(['root','supported','issues','evidence'])).max(20),
  missingSources:z.array(z.enum(['recentjobs','primary'])).max(2),quoteMismatchIndices:z.array(z.number().int().min(0).max(29)).max(30),
  supportedWithIssues:z.boolean(),recentjobsEvidence:z.number().int().min(0).max(30),primaryEvidence:z.number().int().min(0).max(30)}).strict();
/** Counts and locations only. Never copy source text, quotes or provider output. */
export function validationRejectionDiagnostic(parsed,recentjobsText,primary=null){
  const result={version:'validation_rejection_v1',schemaValid:parsed.success,shapeFields:[],missingSources:[],quoteMismatchIndices:[],supportedWithIssues:false,recentjobsEvidence:0,primaryEvidence:0};
  if(!parsed.success){result.shapeFields=[...new Set(parsed.error.issues.slice(0,20).map(e=>['supported','issues','evidence'].includes(e.path[0])?e.path[0]:'root'))];return result;}
  const r=parsed.data,texts={recentjobs:recentjobsText,...(primary?{primary:primary.text}:{})};result.supportedWithIssues=r.supported&&r.issues.length>0;
  for(const[eIndex,e]of r.evidence.entries()){result[e.source==='primary'?'primaryEvidence':'recentjobsEvidence']++;if(typeof texts[e.source]!=='string'||!texts[e.source].includes(e.quote))result.quoteMismatchIndices.push(eIndex);}
  if(!result.recentjobsEvidence)result.missingSources.push('recentjobs');if(primary&&!result.primaryEvidence)result.missingSources.push('primary');return result;
}
export function privateValidationDiagnostic(error){if(error?.code!=='AI_INVALID_VALIDATION')return null;const result=Diagnostic.safeParse(error.validationDiagnostic);return result.success?result.data:null;}
