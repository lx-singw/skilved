import {z} from 'zod';
import {ExtractionSchema} from './extraction.mjs';

const item=ExtractionSchema.shape.requirements.shape.items.element;
export const SourceAuditSchema=z.object({
  version:z.literal(1),reviewer:z.enum(['agent','human']),reviewedAt:z.string().datetime(),
  entries:z.array(z.object({
    id:z.string().regex(/^[a-z][a-z0-9_]*$/),span:z.array(z.number().int().min(1).max(20001)).length(2),
    treatment:z.enum(['preserve','context','exclude','unresolved']),reason:z.string().min(1).max(1000),
    kind:item.shape.kind.optional(),level:item.shape.level.optional(),
  }).strict()).min(1).max(500),
}).strict();

// An explicit inventory of all lines prevents an apparently complete review
// from silently ignoring inconvenient sections. Labels are reviewer judgments,
// not independent proof of the notice's truth or permission to publish.
export function validateSourceAudit(candidate,input) {
  if(typeof candidate?.title!=='string'||typeof candidate?.sourceText!=='string')throw new Error('EVALUATION_SOURCE_INVALID');
  const audit=SourceAuditSchema.parse(input),lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
  if(lines.length>20001)throw new Error('EVALUATION_AUDIT_LIMIT');
  const covered=new Set(),ids=new Set();
  for(const entry of audit.entries) {
    const [first,last]=entry.span;
    if(first>last||last>lines.length||ids.has(entry.id)||
      (entry.treatment!=='preserve'&&(entry.kind!==undefined||entry.level!==undefined)))
      throw new Error('EVALUATION_AUDIT_INVALID');
    ids.add(entry.id);
    const passage=lines.slice(first-1,last).join('\n');
    if(['preserve','exclude','unresolved'].includes(entry.treatment)&&(!passage.trim()||passage.length>4000))
      throw new Error('EVALUATION_AUDIT_INVALID');
    for(let line=first;line<=last;line++) {
      if(covered.has(line))throw new Error('EVALUATION_AUDIT_OVERLAP');
      covered.add(line);
    }
  }
  if(covered.size!==lines.length)throw new Error('EVALUATION_AUDIT_INCOMPLETE');
  return audit;
}

export function evaluateSourceAudit(candidate,input,expectations) {
  const audit=validateSourceAudit(candidate,expectations),requirements=ExtractionSchema.shape.requirements.parse(input);
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n'),issues=[];
  const unknownQuotes=node=>node.op==='unknown'?[node.originalText]:node.children?node.children.flatMap(unknownQuotes)
    :node.op==='if'?[...unknownQuotes(node.then),...(node.otherwise?unknownQuotes(node.otherwise):[])]:[];
  const unknown=unknownQuotes(requirements.expression);
  const quotes=requirements.items.map(item=>item.fact.quote).filter(Boolean).concat(unknown);
  for(const entry of audit.entries) {
    const passage=lines.slice(entry.span[0]-1,entry.span[1]).join('\n');
    const matches=requirements.items.filter(item=>item.fact.quote?.includes(passage));
    const retained=matches.length>0||unknown.some(quote=>quote.includes(passage));
    const issue=code=>issues.push({code,entry:entry.id,span:entry.span});
    if(entry.treatment==='unresolved') {
      issue('SOURCE_AUDIT_REVIEW_REQUIRED');
      if(!retained)issue('SOURCE_AUDIT_PASSAGE_MISSING');
    } else if(entry.treatment==='preserve') {
      if(!retained){issue('SOURCE_AUDIT_PASSAGE_MISSING');continue;}
      const stated=matches.filter(item=>item.fact.state==='stated'&&item.fact.value?.description.includes(passage));
      if(!stated.length){issue('SOURCE_AUDIT_REQUIREMENT_UNCERTAIN');continue;}
      const classified=entry.kind===undefined?stated:stated.filter(item=>item.kind===entry.kind);
      if(!classified.length)issue('SOURCE_AUDIT_KIND_MISMATCH');
      if(entry.level!==undefined&&classified.length&&!classified.some(item=>item.level===entry.level))issue('SOURCE_AUDIT_LEVEL_MISMATCH');
    } else if(entry.treatment==='exclude') {
      if(passage.split('\n').some(line=>line.trim()&&quotes.some(quote=>(`\n${quote}\n`).includes(`\n${line}\n`))))
        issue('SOURCE_AUDIT_EXCLUDED_CONTENT');
    }
  }
  return {matched:issues.length===0,issues};
}
