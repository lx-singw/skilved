// Conservative coverage for explicitly bounded requirement sections. Other
// layouts still require semantic validation; this is not a universal classifier.
const heading = /^(?:minimum requirements|requirements|qualifications and experience required|minimum qualifications|entry requirements)\s*:?$/i;
const end = /^(?:main responsibilities|responsibilities|duties|closing date|how to apply|application process|benefits|work level|job type|salary)\s*:?(?:\s+.*)?$/i;
const connective = /^(?:you need one of the following|one of the following|either|or|and)\s*:?$/i;

// Keep source text intact for auditing. An application-link label can share a
// line with the invitation; a DOM boundary can split the invitation in two.
// Only these explicit calls are recognised, never a bare platform name or an
// employer's instruction to send an application through that platform.
const promotion = /^(?:apply now(?: online)?\s+)?((?:join|follow|subscribe(?: to)?)\s+(?:our|us on|the recentjobs)\s+(?:whatsapp|telegram|facebook|instagram|newsletter|job alerts)\b[^\r\n]*)/i;
export function isPromotionalLine(line) {
  return promotion.test(line.trim());
}
function promotionalRanges(text) {
  const lines=text.split('\n'),ranges=[];let offset=0;
  for(let i=0;i<lines.length;i++) {
    // At most two adjacent source lines; never join separated passages.
    const passage=lines.slice(i,i+2).join('\n'),leading=passage.length-passage.trimStart().length;
    const match=promotion.exec(passage.trimStart());
    if(match){const first=offset+leading+match[0].indexOf(match[1]);ranges.push([first,first+match[1].length]);}
    offset+=lines[i].length+1;
  }
  return ranges;
}
export function containsPromotionalContent(text) {
  return typeof text==='string'&&promotionalRanges(text).length>0;
}
// Quote fragments cannot evade the guard by omitting the platform or CTA.
// Application-only text before a mixed-line invitation remains usable.
export function hasPromotionalEvidence(candidate,quote) {
  if(typeof quote!=='string'||!quote)return false;
  if(containsPromotionalContent(quote))return true;
  const corpus=`${candidate.title}\n${candidate.sourceText}`,ranges=promotionalRanges(corpus);
  let at=corpus.indexOf(quote);
  while(at!==-1){if(ranges.some(([first,last])=>at<last&&at+quote.length>first))return true;at=corpus.indexOf(quote,at+1);}
  return false;
}
export function promotionalLineNumbers(candidate) {
  return promotionalLineNumbersFromText(`${candidate.title}\n${candidate.sourceText}`);
}
export function promotionalLineNumbersFromText(text) {
  const ranges=promotionalRanges(text);let offset=0;
  return text.split('\n').flatMap((line,index)=>{const first=offset;offset+=line.length+1;
    return ranges.some(([from,to])=>first<to&&first+line.length>from)?[index+1]:[];});
}

export function requirementLineNumbers(candidate) {
  const lines = `${candidate.title}\n${candidate.sourceText}`.split('\n');
  const promotions=new Set(promotionalLineNumbers(candidate));
  const ranges = []; let start = null;
  for (let i = 0; i < lines.length; i++) {
    if (heading.test(lines[i].trim())) { if (start === null) start = i + 1; }
    else if (start !== null && end.test(lines[i].trim())) {
      ranges.push([start, i]); start = null;
    }
  }
  // An unbounded section may include footer or unrelated content: do not guess.
  return ranges.flatMap(([from, until]) => lines.slice(from, until).flatMap((line, index) =>
    line.trim() && !heading.test(line.trim()) && !connective.test(line.trim()) && !promotions.has(from+index+1) ? [from + index + 1] : []));
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
