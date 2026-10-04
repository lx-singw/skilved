import { z } from 'zod';

const email = z.string().max(254).email();
const address = /(?<![A-Za-z0-9_.@-])[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}(?![A-Za-z0-9_@-]|\.[^\s])/g;
const application = /\bapply\s*(?::|(?:by|via)\s+e-?mail\b|(?:to|at)\b)|\b(?:e-?mail|submit|send)\b[^\n]{0,160}\b(?:applications?|cv|curriculum vitae)\b|\bapplications?\b[^\n]{0,160}\b(?:to|e-?mail)\b/i;
const recipient = /(?:\bto(?:\s+(?:e-?mail|address))?\s*:?[ \t]*|\b(?:by|via)\s+e-?mail\s*:?[ \t]*|\be-?mail(?:\s+address)?\s*:[ \t]*|\b(?:apply|applications?)\s*:[ \t]*)$/i;
const excluded = /\b(?:enquir\w*|inquir\w*|queries|contact|request|forms?|do not|must not|cannot|not accepted|not be accepted|not permitted|not allowed|will not|no e-?mail|unsolicited)\b/i;

/** Conservative discovery only: no recipient probes, inferred programme scope or approvals. */
export function applicationMethods(sourceText) {
  const candidates = [], instructions = [];
  const lines = sourceText.split('\n');
  for (const [index,line] of lines.entries()) {
    // A bare next-line email is accepted only under an immediately preceding
    // application heading and an exact send-email instruction, never by proximity.
    if (/^(?:\d+\.\s*)?How to apply\s*:?$/i.test(lines[index-1]?.trim() ?? '') &&
        /^Send an e-?mail to\s*:?$/i.test(line.trim()) && email.safeParse(lines[index+1]?.trim()).success) {
      candidates.push({method:'email',destination:lines[index+1].trim(),
        originalText:lines.slice(index-1,index+2).join('\n'),check:'pending'});
    }
    if (line.length > 1000) continue;
    const hand = /\b(?:hand[ -]deliver(?:ed|y)?|in[ -]person)\b/i.test(line);
    const courier = /\bcourier(?:ed)?\b/i.test(line);
    const postal = /\b(?:posted|postal)\b|\bpost\s+(?:to|applications?)\b|\b(?:by|via)\s+post\b/i.test(line);
    const prohibited = /\b(?:do not|must not|may not|cannot|not accepted|not be accepted|not permitted|not allowed|will not)\b|\bno\s+(?:hand|postal|posted|courier|in[ -]person|applications?)\b/i.test(line);
    if (!prohibited && /\bapplications?\b/i.test(line) && (hand || courier || postal) && /\b(?:submit|deliver|courier|send|post|accept)[a-z]*\b/i.test(line)) {
      const methods = [];
      if (hand) methods.push('in_person');
      if (courier) methods.push('courier');
      if (postal) methods.push('post');
      // Retain the full instruction; courier is not silently classified as post.
      instructions.push({ methods, originalText:line, check:'pending' });
      continue;
    }
    if (excluded.test(line) || /\b(?:references?|referees?|contactable)\b[^\n]{0,60}\b(?:e-?mail|addresses?)\b/i.test(line) || /https?:\/\//i.test(line)) continue;
    const matches = [...line.matchAll(address)];
    const prefix = matches.length ? line.slice(0, matches[0].index) : '';
    if (!matches.length || !application.test(prefix) || !recipient.test(prefix)) continue;
    for (const match of matches) {
      const destination = match[0].replace(/\.+$/, '');
      if (email.safeParse(destination).success) candidates.push({method:'email',destination,originalText:line,check:'pending'});
    }
  }
  return { candidates, instructions };
}
