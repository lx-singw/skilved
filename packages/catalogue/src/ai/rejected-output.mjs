/** Structural diagnostics only: never retain provider text, values or unknown keys.
 * Paths come from our request schema. This is not a JSON Schema validator.
 */
export function rejectedOutputDiagnostic(raw, schema) {
  if (typeof raw !== 'string') return { state: 'unavailable' };
  if (Buffer.byteLength(raw) > 96000) return { state: 'too_large' };
  let value;
  try { value = JSON.parse(raw); } catch { return { state: 'invalid_json' }; }
  const missingRequired = [], arrayLengthErrors = [], structuralErrors = [], unknownPropertyCounts = [];
  let visited = 0, truncated = false;
  const escape = key => key.replace(/~/g, '~0').replace(/\//g, '~1');
  const findings=()=>missingRequired.length+arrayLengthErrors.length+structuralErrors.length+unknownPropertyCounts.length;
  const resolve=node=>node?.$ref?.startsWith('#/')?node.$ref.slice(2).split('/').reduce((part,key)=>
    part?.[key.replace(/~1/g,'/').replace(/~0/g,'~')],schema):node?.$ref==='#'?schema:node;
  const matchesType=(type,data)=>Array.isArray(type)?type.some(value=>matchesType(value,data)):
    type==='null'?data===null:type==='array'?Array.isArray(data):type==='object'?data!==null&&typeof data==='object'&&!Array.isArray(data):
    type==='integer'?Number.isInteger(data):type==='number'?typeof data==='number'&&Number.isFinite(data):typeof data===type;
  const error=(path,code)=>{if(structuralErrors.some(row=>row.path===path&&row.code===code))return;
    if(findings()>=40){truncated=true;return;}structuralErrors.push({path,code});};
  function visit(node, data, path, depth) {
    if (++visited > 2000 || depth > 40 || findings() >= 40) { truncated = true; return; }
    if (!node || typeof node !== 'object') return;
    if (node.$ref) {visit(resolve(node),data,path,depth+1);return;}
    if(Array.isArray(node.anyOf)) {
      // Select only a unique type/discriminator branch. Ambiguous unions report
      // at their schema-owned parent path, never speculative missing children.
      let branches=node.anyOf.map(resolve).filter(branch=>branch&&(!branch.type||matchesType(branch.type,data)));
      if(branches.length>1&&data&&typeof data==='object'&&!Array.isArray(data)) {
        const discriminated=branches.filter(branch=>Object.entries(branch.properties??{}).some(([key,child])=>{
          const property=resolve(child);return Object.hasOwn(data,key)&&
            (Object.hasOwn(property??{},'const')&&data[key]===property.const||property?.enum?.includes(data[key]));
        }));
        if(discriminated.length===1)branches=discriminated;
      }
      if(branches.length!==1){error(path,'UNION_UNRESOLVED');return;}
      visit(branches[0],data,path,depth+1);return;
    }
    if(node.type&&!matchesType(node.type,data)){error(path,'TYPE_MISMATCH');return;}
    if(Array.isArray(node.enum)&&!node.enum.includes(data))error(path,'ENUM_MISMATCH');
    if(Object.hasOwn(node,'const')&&node.const!==data)error(path,'CONST_MISMATCH');
    if(typeof data==='number'&&((typeof node.minimum==='number'&&data<node.minimum)||
      (typeof node.maximum==='number'&&data>node.maximum)))error(path,'NUMBER_BOUNDS');
    if (node.type === 'object' && data && typeof data === 'object' && !Array.isArray(data)) {
      for (const key of node.required ?? []) {
        if (!Object.hasOwn(data, key)) {
          if (findings() >= 40) { truncated = true; break; }
          missingRequired.push(`${path}/${escape(key)}`);
        }
      }
      if(node.additionalProperties===false&&findings()<40){
        const count=Object.keys(data).filter(key=>!Object.hasOwn(node.properties??{},key)).length;
        if(count)unknownPropertyCounts.push({path,count});
      }
      for (const [key, child] of Object.entries(node.properties ?? {})) {
        if (Object.hasOwn(data, key)) visit(child, data[key], `${path}/${escape(key)}`, depth + 1);
        if (truncated) break;
      }
    } else if (node.type === 'array' && Array.isArray(data) && node.items && !Array.isArray(node.items)) {
      if ((Number.isInteger(node.minItems) && data.length < node.minItems) ||
          (Number.isInteger(node.maxItems) && data.length > node.maxItems)) {
        arrayLengthErrors.push({path,minItems:node.minItems??null,maxItems:node.maxItems??null,actualItems:data.length});
      }
      // Wildcards disclose no input-derived keys or values.
      for (const item of data) { visit(node.items, item, `${path}/*`, depth + 1); if (truncated) break; }
    }
  }
  visit(schema, value, '', 0);
  return { state: 'parsed_json', missingRequired: [...new Set(missingRequired)],
    ...(arrayLengthErrors.length?{arrayLengthErrors}:{}),
    ...(structuralErrors.length?{structuralErrors}:{}),...(unknownPropertyCounts.length?{unknownPropertyCounts}:{}), truncated };
}
