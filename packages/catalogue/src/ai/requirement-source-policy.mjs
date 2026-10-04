import {DomainError} from '../config.mjs';
import {isPromotionalLine,uncoveredRequirementLines} from './source-lines.mjs';

export const REQUIREMENT_SOURCE_POLICY_VERSION='bounded_extraction_requirements_v2';
export const REQUIREMENT_SOURCE_INSTRUCTION=`
requirementSourcePolicy lists code-recognised bounded source passages, not new requirements.
Cover every listed line with its original requirement passage or exact unknown logic.
Keep required and preferred levels as listed. In document sections retain the acceptance rule,
including certified-copy restrictions, as well as each document. Do not replace the rule with a list.
A conditional hint such as if applicable has no defined predicate. Do not call it preferred or
unconditionally required. Preserve its full passage as an ambiguous/conflicting requirement item
with level unclear, or unknown(firstLine,lastLine) without a confident item for that passage.
Do not invent a predicate to build IF logic. Unknown logic stops publication rather than guessing.
completeRequirementSpans are recognised COMPLETE conditions. Keep the entire span in ONE item.
Assessment components belong to the assessment condition, never standalone eligibility items.
An unqualified Valid passport profile line is a held credential (kind other), not citizenship or a submission document.
Document sections still use kind document for documents to submit.
Headings, preparation labels and editorial explanations are context, not requirement items.`;
const label=text=>text.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s·•]+/u,'');
const required=/^(?:minimum requirements|requirements|qualifications and experience required|minimum qualifications|entry requirements)\s*:?$/i;
const preferred=/^(?:added advantages|preferred(?: qualifications| requirements)?|advantageous)\s*:?$/i;
const documents=/^(?:required (?:application )?documents|documents required|application documents|documents\s*[—–-]\s*very important)\s*:?$/i;
const ending=/^(?:main responsibilities|responsibilities|duties|main training\/duties|closing date|how to apply|application process|benefits|work level|job type|salary|apply now)\s*:?(?:\s+.*)?$/i;
const editorial=/^(?:what makes (?:this|the) (?:opportunity|programme|apprenticeship) .+|why .+ (?:apprenticeship|opportunity|programme)(?: is .+)?|the \d+ km requirement is important)\s*:?$/i;
const connective=/^(?:you need(?: one of the following)?|one of the following|either|or|and|prepare|applicants should have)\s*:?$/i;
const preferenceIntro=/^These (?:are not|aren't|aren’t) stated as mandatory, but can strengthen an application\s*:?$/i;
const undefinedCondition=/\b(?:if applicable|where applicable|where required|if relevant)\b/i;
const documentAcceptance=/^(?:[A-Za-z][A-Za-z '’.-]{0,100} says )?only applications with .+\brequired documents\b.+\bwill be considered[.]?$/i;
const documentList=/^Applicants? must (?:submit|provide|attach)\s*:$/i;
const blankForm=line=>/^(?:Request|Obtain|Download)\s+(?:(?:an?|the)\s+)?application\s+form\s+(?:from|via|at)\s+.{1,300}$/i.test(line)&&! /\b(?:submit|return|attach|completed|required|compulsory|must)\b/i.test(line);

// Preserve legacy selectors for historical replays. This policy applies only
// to the current canonical extractor and its compact provider payload.
export function requirementSourcePolicy(candidate) {
 const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n'),sections=[];let active=null;
 const close=until=>{if(active)sections.push({...active,until});active=null;};
 for(let index=0;index<lines.length;index++){
  const text=label(lines[index]);let kind=null;
  if(required.test(text))kind='required';else if(preferred.test(text))kind='preferred';else if(documents.test(text))kind='documents';
  if(kind){close(index);active={start:index+1,kind,level:kind==='documents'?( /\brequired\b/i.test(text)?'required':'unclear'):kind};}
  else if(active&&(ending.test(text)||editorial.test(text)||isPromotionalLine(text)))close(index);
 }
 // An unbounded section still abstains rather than treating a footer as evidence.
 const lineHints=[];
 for(const section of sections){let level=section.level;
  for(let index=section.start;index<section.until;index++){
   const text=label(lines[index]),conditional=undefinedCondition.test(text);
   if(!text||connective.test(text)||preferenceIntro.test(text)||blankForm(text))continue;
   if(candidate.programmeScope&&/\bfor WIL applicants\b/i.test(text))continue;
   if(section.kind==='documents'&&(documentAcceptance.test(text)||documentList.test(text)))level='required';
   lineHints.push({line:index+1,level:conditional?'unclear':level,kind:section.kind==='documents'?'document':/^Valid passport[.]?$/i.test(text)?'other':null,conditional});
  }
 }
 const completeRequirementSpans=[];
 for(const section of sections){
  if(section.kind==='documents')continue;
  for(let index=section.start;index+2<section.until;index++){
   if(!/^Pass .{0,100}\b(?:technical|aptitude) assessment, including:$/i.test(label(lines[index])))continue;
   const components=[label(lines[index+1]),label(lines[index+2])];
   if(!components.every(text=>/^(?:Numeracy|Literacy)$/i.test(text))||new Set(components.map(text=>text.toLowerCase())).size!==2)continue;
   // Without HTML nesting, recognise only this closed pair followed by a
   // separate explicit applicant condition or the bounded section end.
   const after=index+3;
   if(after!==section.until&&!/^(?:Valid\b|Be able\b|Be prepared\b|Live within\b|Hold\b|Have\b|Applicants? must\b|Grade \d+\b|N\d+\b|NCV\b)/i.test(label(lines[after])))continue;
   completeRequirementSpans.push({span:[index+1,index+3],kind:'other'});
  }
 }
 return {version:REQUIREMENT_SOURCE_POLICY_VERSION,requiredLineNumbers:lineHints.map(h=>h.line),lineHints,completeRequirementSpans};
}
const unknownPassages=node=>node.op==='unknown'?[node.originalText]:node.children?node.children.flatMap(unknownPassages):node.op==='if'?[...unknownPassages(node.then),...(node.otherwise?unknownPassages(node.otherwise):[])]:[];
export function assertRequirementSourcePolicy(candidate,extraction) {
 const policy=requirementSourcePolicy(candidate),lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
 if(uncoveredRequirementLines(candidate,extraction,policy.requiredLineNumbers).length)throw new DomainError('AI_REQUIREMENT_COVERAGE');
 const unknown=unknownPassages(extraction.requirements.expression);
 for(const hint of policy.lineHints){
  const text=lines[hint.line-1],items=extraction.requirements.items.filter(i=>i.fact.quote?.split('\n').includes(text));
  if(hint.conditional){
   if(items.some(i=>i.level!=='unclear'||!['ambiguous','conflicting'].includes(i.fact.state)) || !items.length&&!unknown.some(q=>q.split('\n').includes(text)))throw new DomainError('AI_CONDITIONAL_REQUIREMENT_UNRESOLVED');
  }else if(['required','preferred'].includes(hint.level)&&items.some(i=>i.level!==hint.level))throw new DomainError('AI_REQUIREMENT_LEVEL_UNRESOLVED');
  if(hint.kind&&items.some(i=>i.kind!==hint.kind))throw new DomainError(hint.kind==='document'?'AI_DOCUMENT_REQUIREMENT_UNRESOLVED':'AI_REQUIREMENT_KIND_UNRESOLVED');
 }
 for(const group of policy.completeRequirementSpans){
  const passage=lines.slice(group.span[0]-1,group.span[1]).join('\n'),members=passage.split('\n');
  const items=extraction.requirements.items.filter(i=>i.fact.quote?.split('\n').some(line=>members.includes(line)));
  if(items.some(i=>!i.fact.quote.includes(passage))||!items.length&&!unknown.some(q=>q.includes(passage)))throw new DomainError('AI_REQUIREMENT_GROUP_UNRESOLVED');
  if(items.some(i=>i.kind!==group.kind))throw new DomainError('AI_REQUIREMENT_KIND_UNRESOLVED');
 }
}
