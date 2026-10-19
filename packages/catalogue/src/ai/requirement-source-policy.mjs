import {DomainError} from '../config.mjs';
import {isPromotionalLine,uncoveredRequirementLines} from './source-lines.mjs';
import {assertNoPreparationEvidence,practicalEvidencePolicy} from './practical-evidence.mjs';
import {qualificationLineKind,isSubjectExclusion,isEducationOnlyLine} from './qualification-evidence.mjs';

export const REQUIREMENT_SOURCE_POLICY_VERSION='bounded_extraction_requirements_v9';
export const SUBMISSION_BLOCK_INSTRUCTION=`
submissionBlocks supplies complete bounded submission passages, including context and conditional documents.
Prefer one complete block for practicalConditions: copy its entire originalText and span, not only the
incomplete-application sentence. Never join disjoint blocks or omit applicability wording. These are
advisory ranges, not completed facts; absent hints do not excuse missing instructions. Code never repairs output.`;
export const REQUIREMENT_SOURCE_INSTRUCTION=`
requirementSourcePolicy lists code-recognised bounded source passages, not new requirements.
Cover every requiredLineNumbers line with its original requirement passage or exact unknown logic.
layoutContextLineNumbers are recognised headings/table introductions, not standalone conditions.
qualificationAlternatives lists complete route spans: one education item per route, with those
item references as direct children of ANY. Keep shared conditions outside that ANY.
qualificationConjunctions lists recognised cumulative school/minimum technical qualifications.
Keep each complete qualification as an education item, unconditionally required under ALL.
Never change these cumulative requirements into alternatives or conditional eligibility.
educationOnlySpans identifies education/subject evidence, not prior work experience.
Standalone subject pass-mark thresholds use kind subjects. A qualification and its attached
subject list remain one complete education item; never split them to apply this standalone rule.
Standalone Mathematics/Mathematical Literacy not applicable/not accepted exclusions use subjects.
submissionInstructions are explicit required attachment rules. Retain each full originalText as
a required document item OR in BOTH practicalConditions.value and its contiguous evidence span.
Instructions with unconditional=true cannot become optional ANY/IF requirement branches.
Do not omit them. Unknown logic or ambiguous facts remain holds, never authority to publish.
Publisher Documents to prepare advice is outside these required sections; do not promote it
to employer eligibility or invent applicability for route-specific documents.
Keep required and preferred levels as listed. In document sections retain the acceptance rule,
including certified-copy restrictions, as well as each document. Do not replace the rule with a list.
Inherent requirements and explicitly required competency details with unconditional=true must
remain required under ALL, never optional branches of ANY or IF. Keep complete qualification
alternatives within their original condition. Basic knowledge is kind other, not education.
Recommendations remain preferred. Competency subheadings are layout context, not conditions;
retain every detail beneath them. Duties and assumption-of-duties timing are outside these sections.
conditionalDocumentInstructions are stated submission instructions, not eligibility facts. Retain each
entire originalText, including applicability wording, in BOTH practicalConditions.value and its
contiguous evidence span. Do not create requirement items or unknown/IF eligibility nodes for them.
Do not infer who they apply to or assert that every applicant must submit them.
Other conditional hints such as if applicable have no defined predicate. Do not call them preferred or
unconditionally required. Preserve its full passage as an ambiguous/conflicting requirement item
with level unclear, or unknown(firstLine,lastLine) without a confident item for that passage.
Do not invent a predicate to build IF logic. Unknown logic stops publication rather than guessing.
completeRequirementSpans are recognised COMPLETE conditions. Keep the entire span in ONE item.
Assessment components belong to the assessment condition, never standalone eligibility items.
Recognised Grade 12 subject spans likewise belong to ONE complete education item. Do not detach
the listed subjects from their qualification, even when every split item would be under ALL.
An unqualified Valid passport profile line is a held credential (kind other), not citizenship or a submission document.
Document sections still use kind document for documents to submit.
Headings, preparation labels and editorial explanations are context, not requirement items.${SUBMISSION_BLOCK_INSTRUCTION}`;
const label=text=>text.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s·•]+/u,'');
// Normalise recognised heading labels only; evidence and numbered conditions
// retain their original characters and line positions.
const headingLabel=text=>label(text).replace(/^\d{1,2}[.)]\s+(?=[A-Za-z])/,'');
const required=/^(?:minimum requirements|requirements|qualifications and experience required|minimum qualifications|entry requirements|inherent job requirements|key competencies required)\s*:?$/i;
const preferred=/^(?:added advantages|preferred(?: qualifications| requirements)?|advantageous|recommendations)\s*:?$/i;
const documents=/^(?:required (?:application )?documents|documents required|application documents|documents\s*[—–-]\s*very important)\s*:?$/i;
const ending=/^(?:main responsibilities|responsibilities|duties|main training\/duties|closing date|how to apply|application process|benefits|work level|job type|salary|apply now)\s*:?(?:\s+.*)?$/i;
const profileEnding=/^(?:competencies|assumption of duties|stipend)\s*:?$/i;
const editorial=/^(?:what makes (?:this|the) (?:opportunity|programme|apprenticeship) .+|why .+ (?:apprenticeship|opportunity|programme)(?: is .+)?|the \d+ km requirement is important)\s*:?$/i;
const connective=/^(?:you need(?: one of the following)?|one of the following|either|or|and|prepare|applicants should have|important conditions)\s*:?$/i;
const preferenceIntro=/^These (?:are not|aren't|aren’t) stated as mandatory, but can strengthen an application\s*:?$/i;
const undefinedCondition=/\b(?:if applicable|where applicable|where required|if relevant)\b/i;
export const CONDITIONAL_DOCUMENT_INSTRUCTION=`
Keep listed conditionalDocumentInstructions in practicalConditions as stated source instructions.
Copy each entire originalText into its value and supporting contiguous span, including if applicable.
The source states the instruction, not whether it applies to this applicant. Never infer that predicate,
remove its condition, call it preferred or mandatory eligibility, or omit it. Other uncertain eligibility stays unresolved.`;
const conditionalDocument=/^Other (?:supporting )?(?:certificates|documents),? (?:if applicable|where applicable)[.]?$/i;
const documentAcceptance=/^(?:[A-Za-z][A-Za-z '’.-]{0,100} says )?only applications with .+\brequired documents\b.+\bwill be considered[.]?$/i;
const documentList=/^Applicants? must (?:submit|provide|attach)\s*:$/i;
const blankForm=line=>/^(?:Request|Obtain|Download)\s+(?:(?:an?|the)\s+)?application\s+form\s+(?:from|via|at)\s+.{1,300}$/i.test(line)&&! /\b(?:submit|return|attach|completed|required|compulsory|must)\b/i.test(line);
const grade12=/^Grade 12(?: with(?: the following subjects)?\s*:)?$/i;
const schoolSubject=text=>{
 if(/^Mathematics(?: \(Core\))?(?: [—–-] not Mathematical Literacy)?$/i.test(text))return 'mathematics';
 if(/^Physical Science$/i.test(text))return 'physical_science';
 if(/^Engineering Graphics & Design(?: \(EGD\))?$/i.test(text))return 'engineering_graphics';
 return null;
};
const independentCondition=/^(?:Valid\b|Be able\b|Be prepared\b|Live within\b|Hold\b|Have\b|Applicants? must\b|Grade \d+\b|N\d+\b|NCV\b|Pass .{0,100}\b(?:technical|aptitude) assessment\b)/i;
const alternativeIntro=/^(?:(?:you need )?one of the following|either|or)\s*:?$/i;
const tableIntro=/^You must meet the age and citizenship requirements and have completed one of the following educational pathways[.]?$/i;
const routeLabel=/^(?:N[1-6](?:[–-]N?[1-6])?|NCV Level [1-4]|Technical Grade 12)$/i;
const submission=/^(?:Attach|Submit|Provide|Include) (?:your |the )?(?:qualifications?|academic records|academic transcripts|CV|certificates?)(?: (?:and|with) (?:your |the )?(?:relevant )?(?:academic records|academic transcripts|qualifications?|certificates?))*[.]?$/i;
const qualificationUncertainty=/\b(?:or|either|alternatives?|alternatively|equivalent|if|unless|provided|not|no|without|preferred|optional|may)\b/i;
const resultsDocument=/^CV[’']?s? with (?:Statement of Results|certificates?)(?: or (?:Statement of Results|certificates?))? will be considered[.]?$/i;
const simpleLicence=/^Valid (?:driving|driver[’']?s?) licen[cs]e[.]?$/i;
// Explicit submission prose can introduce a bounded document block without a
// document heading. Keep its context and scoped instructions, not just nouns.
const standardDocumentation=/^(?:To ensure your application is complete, you must submit ALL documents listed under the inherent requirements, as well as the following standard documentation|(?:To complete your application, )?(?:you|applicants) must (?:submit|provide|attach) (?:all )?(?:the )?following (?:standard documentation|application documents))\s*:$/i;
const incompleteApplications=/^INCOMPLETE APPLICATIONS WILL NOT BE CONSIDERED!$/i;
const documentScope=/\b(?:if|where|when|applicable to|for foreign nationals|external applicants only)\b/i;

// Preserve legacy selectors for historical replays. This policy applies only
// to the current canonical extractor and its compact provider payload.
export function requirementSourcePolicy(candidate) {
 const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n'),sections=[];let active=null;
 const close=until=>{if(active)sections.push({...active,until});active=null;};
 for(let index=0;index<lines.length;index++){
  const text=headingLabel(lines[index]);let kind=null;
  const submissionBlock=standardDocumentation.test(text),inherent=/^inherent job requirements\s*:?$/i.test(text),competencies=/^key competencies required\s*:?$/i.test(text);
  if(required.test(text))kind='required';else if(preferred.test(text))kind='preferred';else if(documents.test(text)||submissionBlock)kind='documents';
  if(kind){close(index);active={start:index+1,kind,level:kind==='documents'?(submissionBlock||/\brequired\b/i.test(text)?'required':'unclear'):kind,
    ...(submissionBlock?{submissionBlock:true,instructionLine:index+1,acceptanceLine:index>0&&incompleteApplications.test(label(lines[index-1]))?index:null}:{}),
    ...(inherent?{inherent:true}:{}),...(competencies?{competencies:true}:{})};}
  else if(active&&(ending.test(text)||profileEnding.test(text)||editorial.test(text)||/^documents to prepare\s*:?$/i.test(text)||isPromotionalLine(text)))close(index);
 }
 // An unbounded section still abstains rather than treating a footer as evidence.
 const layoutContext=new Set(),qualificationAlternatives=[],tableSpans=[];
 for(const section of sections){
  if(section.kind!=='required')continue;
  for(let index=section.start;index+2<section.until;index++){
   if(!tableIntro.test(label(lines[index]))||!/^Qualification route$/i.test(label(lines[index+1]))||!/^Required subjects$/i.test(label(lines[index+2])))continue;
   const spans=[],routes=[];let at=index+3;
   while(at+1<section.until&&routeLabel.test(label(lines[at]))&&/\b(?:Mathematics|Science|trade theory|vocational subjects)\b/i.test(lines[at+1])&&!undefinedCondition.test(lines[at+1])){
    routes.push(label(lines[at]).toLowerCase());spans.push([at+1,at+2]);at+=2;
   }
   // Unknown rows/continuations abstain. The repeated age/citizenship wording
   // makes the introduction context without dropping those shared conditions.
   const tail=lines.slice(at+1,section.until);
   if(spans.length<2||spans.length>6||new Set(routes).size!==routes.length||!/^Important conditions\s*:?$/i.test(label(lines[at]??''))||
      !tail.some(line=>/^You must be between \d+ and \d+ years old[.]?$/i.test(label(line)))||!tail.some(line=>/^You must be a .+ citizen[.]?$/i.test(label(line))))continue;
   [index+1,index+2,index+3].forEach(line=>layoutContext.add(line));
   spans.forEach(span=>tableSpans.push({span,kind:'education'}));qualificationAlternatives.push({spans,relation:'any'});
  }
 }
 const lineHints=[],conditionalDocumentInstructions=[],submissionInstructions=[];
 for(const section of sections){let level=section.level;
  // An explicit alternative-list introduction changes the relationship between
  // its rows. Do not supply ALL hints for that layout; keep semantic review.
  const unconditionalSection=(section.inherent||section.competencies)&&!lines.slice(section.start,section.until).some(line=>alternativeIntro.test(label(line))||tableIntro.test(label(line)));
  if(section.submissionBlock)for(const line of [section.acceptanceLine,section.instructionLine].filter(Boolean))submissionInstructions.push({originalText:lines[line-1],span:[line,line],level:'required',unconditional:true});
  for(let index=section.start;index<section.until;index++){
   const text=label(lines[index]),conditional=undefinedCondition.test(text);
   if(!text||layoutContext.has(index+1)||connective.test(text)||preferenceIntro.test(text)||blankForm(text))continue;
   if(candidate.programmeScope&&/\bfor WIL applicants\b/i.test(text))continue;
   if(section.submissionBlock){
    const instruction={originalText:lines[index],span:[index+1,index+1]};
    if(documentScope.test(text))conditionalDocumentInstructions.push(instruction);
    else submissionInstructions.push({...instruction,level:'required',unconditional:true});
    continue;
   }
   if(section.competencies&&/:$/.test(text)){layoutContext.add(index+1);continue;}
   if(section.kind==='required'&&submission.test(text)){
    submissionInstructions.push({originalText:lines[index],span:[index+1,index+1],level:'required'});continue;
   }
   // Only standalone supplemental-document instructions in a closed document
   // section qualify. Mixed qualifications and named credentials abstain.
   if(section.kind==='documents'&&conditionalDocument.test(text)){
    conditionalDocumentInstructions.push({originalText:lines[index],span:[index+1,index+1]});continue;
   }
   if(section.kind==='documents'&&(documentAcceptance.test(text)||documentList.test(text)))level='required';
   const kind=section.kind==='documents'?'document':section.competencies||section.inherent&&/^Basic knowledge of\b/i.test(text)||/^Valid passport[.]?$/i.test(text)?'other':section.kind==='preferred'&&/^Experience (?:with|in|of)\b/i.test(text)?'experience':null;
   lineHints.push({line:index+1,level:conditional?'unclear':level,kind,conditional,
    ...(!conditional&&unconditionalSection?{unconditional:true}:{})});
  }
 }
 const completeRequirementSpans=[...tableSpans];
 for(const section of sections){
  if(section.kind==='documents')continue;
  for(let index=section.start;index<section.until;index++){
   if(!grade12.test(label(lines[index])))continue;
   // Flat text has no nesting: do not infer a qualification branch inside an
   // alternative list, across blank lines, or through unfamiliar continuations.
   if(lines.slice(section.start,index).some(line=>alternativeIntro.test(label(line))))continue;
   const subjects=[];let after=index+1;
   while(after<section.until&&schoolSubject(label(lines[after]))){subjects.push(schoolSubject(label(lines[after])));after++;}
   if(subjects.length<2||new Set(subjects).size!==subjects.length)continue;
   if(after!==section.until&&!independentCondition.test(label(lines[after])))continue;
   const members=lines.slice(index,after);
   // With quote-only canonical facts, repeated lines cannot be bound uniquely
   // to this group. Abstain rather than reject a separate source occurrence.
   if(lines.some((line,at)=>(at<index||at>=after)&&members.includes(line)))continue;
   completeRequirementSpans.push({span:[index+1,after],kind:'education'});
  }
  for(let index=section.start;index+2<section.until;index++){
   if(!/^Pass .{0,100}\b(?:technical|aptitude) assessment, including:$/i.test(label(lines[index])))continue;
   const components=[label(lines[index+1]),label(lines[index+2])];
   if(!components.every(text=>/^(?:Numeracy|Literacy)$/i.test(text))||new Set(components.map(text=>text.toLowerCase())).size!==2)continue;
   // Without HTML nesting, recognise only this closed pair followed by a
   // separate explicit applicant condition or the bounded section end.
   const after=index+3;
   if(after!==section.until&&!independentCondition.test(label(lines[after])))continue;
   completeRequirementSpans.push({span:[index+1,index+3],kind:'other'});
  }
 }
 const educationOnlySpans=[],qualificationConjunctions=[];
 for(const section of sections){
  if(section.kind==='documents')continue;
  const rows=lines.slice(section.start,section.until).map((text,index)=>({text:label(text),line:section.start+index+1}));
  rows.filter(row=>isEducationOnlyLine(row.text)).forEach(row=>educationOnlySpans.push([row.line,row.line]));
  if(section.kind!=='required')continue;
  const qualifications=rows.filter(row=>qualificationLineKind(row.text)!==null);
  // Recognise only a closed flat profile containing one school qualification
  // plus one explicitly minimum N-certificate, with known independent lines.
  // Unknown continuations, alternatives, conditional wording and duplicate
  // source occurrences abstain rather than supplying a new conjunction hint.
  if(qualifications.length!==2||qualificationLineKind(qualifications[0].text)!=='school'||
     !/^Minimum N[1-6]\b/i.test(qualifications[1].text)||
     qualifications.some(row=>qualificationUncertainty.test(row.text))||
     !rows.every(row=>qualifications.includes(row)||isSubjectExclusion(row.text)||resultsDocument.test(row.text)||simpleLicence.test(row.text)||/^(?:You need|Applicants should have)\s*:?$/i.test(row.text))||
     qualifications.some(row=>lines.filter(line=>label(line)===row.text).length!==1))continue;
  qualificationConjunctions.push({spans:qualifications.map(row=>[row.line,row.line]),relation:'all'});
 }
 // Only complete, explicit standalone subject rules receive this kind hint.
 // Known qualification/table groups retain their education kind and scope.
 for(const hint of lineHints)if(hint.kind===null&&!hint.conditional&&!completeRequirementSpans.some(group=>group.span[0]<=hint.line&&hint.line<=group.span[1])&&
   (/^(?:Mathematics|Physical Science) must have been passed with at least (?:100|[1-9]?\d)%[.]?$/i.test(label(lines[hint.line-1]))||isSubjectExclusion(lines[hint.line-1])))hint.kind='subjects';
 // Advisory whole-block ranges use only already-recognised instruction lines.
 // Never bridge a scope hole, preparation advice, unfamiliar skipped text or a
 // passage too long for the existing practicalConditions evidence/value limit.
 const submissionBlocks=[],excluded=practicalEvidencePolicy(candidate).publisherPreparationSpans;
 for(const section of sections.filter(s=>s.submissionBlock)){
  const first=section.acceptanceLine??section.instructionLine,members=[...submissionInstructions,...conditionalDocumentInstructions].filter(i=>i.span[0]>=first&&i.span[1]<=section.until);
  if(!members.some(i=>i.span[0]>section.instructionLine))continue;
  const last=Math.max(...members.map(i=>i.span[1])),known=new Set(members.flatMap(i=>Array.from({length:i.span[1]-i.span[0]+1},(_,n)=>i.span[0]+n)));
  const span=[first,last],originalText=lines.slice(first-1,last).join('\n');
  if(originalText.length>4000)continue;
  let allowed=true;
  for(let line=first;line<=last;line++)if(lines[line-1].trim()&&!known.has(line)||
    candidate.programmeScope&&!candidate.programmeScope.includedSpans?.some(([from,to])=>from<=line&&line<=to)||
    excluded.some(([from,to])=>from<=line&&line<=to)||isPromotionalLine(lines[line-1])){allowed=false;break;}
  if(allowed)submissionBlocks.push({span,originalText});
 }
 return {version:REQUIREMENT_SOURCE_POLICY_VERSION,requiredLineNumbers:lineHints.map(h=>h.line),lineHints,completeRequirementSpans,conditionalDocumentInstructions,submissionInstructions,submissionBlocks,layoutContextLineNumbers:[...layoutContext],qualificationAlternatives,qualificationConjunctions,educationOnlySpans};
}
const unknownPassages=node=>node.op==='unknown'?[node.originalText]:node.children?node.children.flatMap(unknownPassages):node.op==='if'?[...unknownPassages(node.then),...(node.otherwise?unknownPassages(node.otherwise):[])]:[];
const anyGroups=node=>[...(node.op==='any'?[node.children]:[]),...(node.children?node.children.flatMap(anyGroups):node.op==='if'?[...anyGroups(node.then),...(node.otherwise?anyGroups(node.otherwise):[])]:[])];
const unconditionalRefs=node=>node.op==='ref'?[node.id]:node.op==='all'?node.children.flatMap(unconditionalRefs):[];
export function assertRequirementSourcePolicy(candidate,extraction) {
 const policy=requirementSourcePolicy(candidate),lines=`${candidate.title}\n${candidate.sourceText}`.split('\n');
 for(const item of extraction.requirements.items)if(item.fact.state==='stated'&&item.fact.quote)assertNoPreparationEvidence(candidate,item.fact.quote);
 const context=policy.layoutContextLineNumbers.map(line=>lines[line-1]);
 if(extraction.requirements.items.some(i=>i.fact.quote&&i.fact.quote.split('\n').filter(line=>line.trim()).every(line=>context.includes(line))))throw new DomainError('AI_REQUIREMENT_CONTEXT_UNRESOLVED');
 if(uncoveredRequirementLines(candidate,extraction,policy.requiredLineNumbers).length)throw new DomainError('AI_REQUIREMENT_COVERAGE');
 const unknown=unknownPassages(extraction.requirements.expression);
 for(const group of policy.qualificationConjunctions){
  const passages=group.spans.map(([first,last])=>lines.slice(first-1,last).join('\n'));
  const matches=passages.map(passage=>extraction.requirements.items.filter(i=>i.fact.quote?.split('\n').includes(passage)));
  const whole=lines.slice(group.spans[0][0]-1,group.spans.at(-1)[1]).join('\n');
  if(matches.every(items=>!items.length)&&unknown.some(q=>q.includes(whole)))continue;
  const ids=matches.flatMap(items=>items.map(i=>i.id)),required=new Set(unconditionalRefs(extraction.requirements.expression));
  if(matches.some(items=>items.length!==1)||new Set(ids).size!==passages.length||
     matches.flat().some(i=>i.kind!=='education'||i.level!=='required')||ids.some(id=>!required.has(id)))
   throw new DomainError('AI_REQUIREMENT_CONJUNCTION_UNRESOLVED');
 }
 for(const instruction of policy.submissionInstructions){
  const text=instruction.originalText,items=extraction.requirements.items.filter(i=>i.fact.quote?.split('\n').includes(text)),fact=extraction.practicalConditions;
  if(items.some(i=>i.kind!=='document'||i.level!=='required'))throw new DomainError('AI_SUBMISSION_INSTRUCTION_UNRESOLVED');
  if(instruction.unconditional&&items.some(i=>!unconditionalRefs(extraction.requirements.expression).includes(i.id)))throw new DomainError('AI_SUBMISSION_INSTRUCTION_UNRESOLVED');
  const practical=fact?.state==='stated'&&fact.value?.includes(text)&&fact.quote?.split('\n').includes(text);
  if(!items.length&&!practical&&!unknown.some(q=>q.split('\n').includes(text)))throw new DomainError('AI_SUBMISSION_INSTRUCTION_COVERAGE');
 }
 for(const instruction of policy.conditionalDocumentInstructions){
  const passage=instruction.originalText,fact=extraction.practicalConditions;
  if(fact?.state!=='stated'||!fact.value?.includes(passage)||!fact.quote?.split('\n').includes(passage))
   throw new DomainError('AI_CONDITIONAL_DOCUMENT_COVERAGE');
  if(extraction.requirements.items.some(i=>i.fact.quote?.includes(passage))||unknown.some(q=>q.includes(passage)))
   throw new DomainError('AI_CONDITIONAL_DOCUMENT_MISCLASSIFIED');
 }
 for(const hint of policy.lineHints){
  const text=lines[hint.line-1],items=extraction.requirements.items.filter(i=>i.fact.quote?.split('\n').includes(text));
  if(hint.conditional){
   if(items.some(i=>i.level!=='unclear'||!['ambiguous','conflicting'].includes(i.fact.state)) || !items.length&&!unknown.some(q=>q.split('\n').includes(text)))throw new DomainError('AI_CONDITIONAL_REQUIREMENT_UNRESOLVED');
  }else if(['required','preferred'].includes(hint.level)&&items.some(i=>i.level!==hint.level))throw new DomainError('AI_REQUIREMENT_LEVEL_UNRESOLVED');
  if(hint.kind&&items.some(i=>i.kind!==hint.kind))throw new DomainError(hint.kind==='document'?'AI_DOCUMENT_REQUIREMENT_UNRESOLVED':'AI_REQUIREMENT_KIND_UNRESOLVED');
  if(hint.unconditional&&items.some(i=>!unconditionalRefs(extraction.requirements.expression).includes(i.id)))throw new DomainError('AI_REQUIREMENT_CONJUNCTION_UNRESOLVED');
 }
 for(const group of policy.completeRequirementSpans){
  const passage=lines.slice(group.span[0]-1,group.span[1]).join('\n'),members=passage.split('\n');
  const items=extraction.requirements.items.filter(i=>i.fact.quote?.split('\n').some(line=>members.includes(line)));
  if(items.length>1||items.some(i=>!i.fact.quote.includes(passage))||!items.length&&!unknown.some(q=>q.includes(passage)))throw new DomainError('AI_REQUIREMENT_GROUP_UNRESOLVED');
  if(items.some(i=>i.kind!==group.kind))throw new DomainError('AI_REQUIREMENT_KIND_UNRESOLVED');
 }
 for(const group of policy.qualificationAlternatives){
  const passages=group.spans.map(([first,last])=>lines.slice(first-1,last).join('\n'));
  const matches=passages.map(passage=>extraction.requirements.items.filter(i=>i.fact.quote?.includes(passage)));
  const whole=lines.slice(group.spans[0][0]-1,group.spans.at(-1)[1]).join('\n');
  if(matches.every(items=>!items.length)&&unknown.some(q=>q.includes(whole)))continue;
  const ids=new Set(matches.flatMap(items=>items.map(i=>i.id)));
  if(ids.size!==passages.length||!anyGroups(extraction.requirements.expression).some(children=>children.length===ids.size&&children.every(child=>child.op==='ref'&&ids.has(child.id))&&new Set(children.map(child=>child.id)).size===ids.size))throw new DomainError('AI_REQUIREMENT_ALTERNATIVE_UNRESOLVED');
 }
}
