import {ExtractionSchema} from './extraction.mjs';
import {generateStructured,extractionConfiguration} from './provider.mjs';
import {validationContract,validateAssessment} from './validation.mjs';
import {DomainError} from '../config.mjs';

// Development diagnostic only. This is not the worker's full-record validator.
export const REQUIREMENT_VALIDATION_VERSION='recentjobs_requirements_validation_v2';
const fail=code=>{throw new DomainError(code);};
export function requirementValidationContract() {
  const previous=validationContract();
  return {...previous,version:REQUIREMENT_VALIDATION_VERSION,instruction:previous.instruction+`
This is a REQUIREMENTS-ONLY diagnostic against the ENTIRE discovery notice. Only extracted.requirements is supplied. Do not assess missing metadata, issuer, dates, compensation, location or application destinations; those fields are outside this diagnostic's scope.
Check every supplied requirement's kind, level, state, source wording and ALL/ANY/IF logic, plus completeness across all notice sections. Omitted clear applicant conditions and documents, invented eligibility, promotion, or uncertainty wrongly asserted as confirmed are failures. A faithful local unknown may remain unknown where applicability or logic is genuinely unclear; unrelated clear conditions must still be retained.
Issue fields must be requirements or a path starting with requirements. Return supported=true only for faithful, complete requirements; it does not assess a full record or authorize publication. Cite exact discovery source passages.`};
}

export function requirementValidationPayload(candidate,input) {
  if(typeof candidate?.title!=='string'||typeof candidate?.sourceText!=='string')fail('AI_INVALID_SOURCE');
  const recentjobsText=`${candidate.title}\n${candidate.sourceText}`;
  let encoded;try{encoded=JSON.stringify(input);}catch{fail('AI_INVALID_REQUIREMENT_AUDIT');}
  if(Buffer.byteLength(recentjobsText)>96000||recentjobsText.split('\n').length>160||
    typeof encoded!=='string'||Buffer.byteLength(encoded)>96000)fail('AI_INPUT_LIMIT');
  let requirements;try{requirements=ExtractionSchema.shape.requirements.parse(input);}catch{fail('AI_INVALID_REQUIREMENT_AUDIT');}
  const ids=new Set(requirements.items.map(item=>item.id)),used=new Set();
  if(ids.size!==requirements.items.length)fail('AI_INVALID_REQUIREMENT_AUDIT');
  const ref=id=>{if(!ids.has(id))fail('AI_INVALID_REQUIREMENT_AUDIT');used.add(id);};
  let nodes=0;
  const visit=node=>{
    if(++nodes>121)fail('AI_INPUT_LIMIT');
    if(node.op==='ref')ref(node.id);
    else if(node.op==='unknown'){if(!recentjobsText.includes(node.originalText))fail('AI_INVALID_REQUIREMENT_AUDIT');}
    else if(node.op==='if'){ref(node.condition);visit(node.then);if(node.otherwise)visit(node.otherwise);}
    else node.children.forEach(visit);
  };
  visit(requirements.expression);
  if(used.size!==ids.size||requirements.items.some(item=>!item.fact.quote||!recentjobsText.includes(item.fact.quote)))fail('AI_INVALID_REQUIREMENT_AUDIT');
  return {extracted:{requirements:{expression:requirements.expression,requirements:requirements.items.map(item=>({id:item.id,kind:item.kind,level:item.level,
    fact:{state:item.fact.state,value:item.fact.value,originalText:item.fact.quote}}))}},recentjobsText,primary:null,applicationCandidates:[]};
}

export function validateRequirementAssessment(input,recentjobsText) {
  const result=validateAssessment(input,recentjobsText);
  if(!result.supported&&!result.issues.length||result.issues.some(issue=>!/^requirements(?:$|\.)/.test(issue.field)))fail('AI_INVALID_VALIDATION');
  return result;
}

export async function validateRequirements({candidate,requirements},options={}) {
  const payload=requirementValidationPayload(candidate,requirements),env=options.env??process.env,config=extractionConfiguration(env);
  const response=await generateStructured(payload,requirementValidationContract(),
    {...options,env:{...env,SKILVED_AI_THINKING:config.validationThinking}});
  try{return {scope:'requirements_only',qualification:false,...validateRequirementAssessment(response.extraction,payload.recentjobsText),provenance:response.provenance};}
  catch{const error=new DomainError('AI_INVALID_VALIDATION');error.usage=response.provenance.usage;throw error;}
}
