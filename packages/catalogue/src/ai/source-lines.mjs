// Conservative coverage for explicitly bounded requirement sections. Other
// layouts still require semantic validation; this is not a universal classifier.
const heading = /^(?:minimum requirements|requirements|qualifications and experience required|minimum qualifications|entry requirements)\s*:?$/i;
const end = /^(?:main responsibilities|responsibilities|duties|closing date|how to apply|application process|benefits|work level|job type|salary)\s*:?(?:\s+.*)?$/i;
const connective = /^(?:you need one of the following|one of the following|either|or|and)\s*:?$/i;

// Keep source text intact for auditing. Identify only explicit publisher calls
// to join/follow social groups; employer submission methods are not excluded.
export function isPromotionalLine(line) {
  return /^(?:join|follow|subscribe(?: to)?)\s+(?:our|us on|the recentjobs)\s+(?:whatsapp|telegram|facebook|instagram|newsletter|job alerts)\b/i.test(line.trim());
}
export function promotionalLineNumbers(candidate) {
  return `${candidate.title}\n${candidate.sourceText}`.split('\n').flatMap((line, index) => isPromotionalLine(line) ? [index + 1] : []);
}

export function requirementLineNumbers(candidate) {
  const lines = `${candidate.title}\n${candidate.sourceText}`.split('\n');
  const ranges = []; let start = null;
  for (let i = 0; i < lines.length; i++) {
    if (heading.test(lines[i].trim())) { if (start === null) start = i + 1; }
    else if (start !== null && end.test(lines[i].trim())) {
      ranges.push([start, i]); start = null;
    }
  }
  // An unbounded section may include footer or unrelated content: do not guess.
  return ranges.flatMap(([from, until]) => lines.slice(from, until).flatMap((line, index) =>
    line.trim() && !heading.test(line.trim()) && !connective.test(line.trim()) && !isPromotionalLine(line) ? [from + index + 1] : []));
}

export function uncoveredRequirementLines(candidate, extraction, numbers = requirementLineNumbers(candidate)) {
  const corpus = `${candidate.title}\n${candidate.sourceText}`, lines = corpus.split('\n');
  const quotes = extraction.requirements.items.map(item => item.fact.quote).filter(Boolean);
  const unknownQuotes = node => node.op === 'unknown' ? [node.originalText]
    : node.children ? node.children.flatMap(unknownQuotes)
      : node.op === 'if' ? [...unknownQuotes(node.then), ...(node.otherwise ? unknownQuotes(node.otherwise) : [])] : [];
  quotes.push(...unknownQuotes(extraction.requirements.expression));
  // Match actual occurrences, not just repeated substrings elsewhere in a quote.
  const covered = quotes.flatMap(quote => {
    const occurrences = []; let at = corpus.indexOf(quote);
    while (at !== -1) { occurrences.push([at, at + quote.length]); at = corpus.indexOf(quote, at + 1); }
    return occurrences;
  });
  let offset = 0;
  const positions = lines.map(line => { const at = offset; offset += line.length + 1; return [at, at + line.length]; });
  return numbers.filter(number => {
    const [from, until] = positions[number - 1];
    return !covered.some(([start, end]) => start <= from && end >= until);
  });
}
