/** Structural diagnostics only: never retain provider text, values or unknown keys.
 * Paths come from our request schema. This is not a JSON Schema validator.
 */
export function rejectedOutputDiagnostic(raw, schema) {
  if (typeof raw !== 'string') return { state: 'unavailable' };
  if (Buffer.byteLength(raw) > 96000) return { state: 'too_large' };
  let value;
  try { value = JSON.parse(raw); } catch { return { state: 'invalid_json' }; }
  const missingRequired = [], arrayLengthErrors = []; let visited = 0, truncated = false;
  const escape = key => key.replace(/~/g, '~0').replace(/\//g, '~1');
  function visit(node, data, path, depth) {
    if (++visited > 2000 || depth > 40 || missingRequired.length + arrayLengthErrors.length >= 40) { truncated = true; return; }
    if (!node || typeof node !== 'object') return;
    if (node.$ref?.startsWith('#/')) {
      const target = node.$ref.slice(2).split('/').reduce((part, key) =>
        part?.[key.replace(/~1/g, '/').replace(/~0/g, '~')], schema);
      visit(target, data, path, depth + 1); return;
    }
    // Do not choose a union branch or infer missing children of a wrong-type value.
    if (node.type === 'object' && data && typeof data === 'object' && !Array.isArray(data)) {
      for (const key of node.required ?? []) {
        if (!Object.hasOwn(data, key)) {
          if (missingRequired.length + arrayLengthErrors.length >= 40) { truncated = true; break; }
          missingRequired.push(`${path}/${escape(key)}`);
        }
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
    ...(arrayLengthErrors.length?{arrayLengthErrors}:{}), truncated };
}
