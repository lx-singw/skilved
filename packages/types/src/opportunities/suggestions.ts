import { z } from 'zod';

/** Conservative intake syntax, not a permission, publicness or fetch decision. */
function suggestionUrl(value: string): boolean {
  if (/[\s\\%]/.test(value)) return false;
  const match = /^https:\/\/([a-z0-9.-]+)(\/[^?#]*)?$/i.exec(value);
  if (!match || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(match[1])) return false;
  const path = match[2] ?? '/';
  if (/[;=]/.test(path)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.search && !url.hash && url.pathname === path;
  } catch { return false; }
}
export const SuggestionUrlSchema = z.string().min(1).max(2048).refine(suggestionUrl, 'Unsupported suggestion URL syntax')
  .transform(value => new URL(value).href);
export const SuggestionRequestSchema = z.object({ url: SuggestionUrlSchema }).strict();
export type SuggestionRequest = z.infer<typeof SuggestionRequestSchema>;
