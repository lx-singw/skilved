import { z } from 'zod';
import { isDeepStrictEqual } from 'node:util';
import { IdSchema } from '@skilved/types/opportunities';
import { readRelationship, relationshipBinding, relationshipKeys, ISSUER_NAME_INDEX_VERSION } from './issuer-registry.mjs';
import { DomainError } from './config.mjs';

const Binding = z.object({ id: IdSchema, revision: z.number().int().positive(), hash: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const IssuerIndexBatch = z.array(Binding).min(1).max(30).refine(rows => new Set(rows.map(r => r.id)).size === rows.length);

/** Operator-selected, atomic metadata backfill. Never scan authority from a
 * worker, create a relationship, refresh review/expiry or rewrite its JSON.
 */
export async function reindexIssuerNames(catalogue, tx, input) {
  const bindings = IssuerIndexBatch.parse(input);
  const rows = await Promise.all(bindings.map(b => tx.get(catalogue.ref('employer_relationships', b.id))));
  const updates = rows.map((snapshot, i) => {
    const record = readRelationship(snapshot);
    if (!record || !isDeepStrictEqual(relationshipBinding(record), bindings[i])) throw new DomainError('CONFLICT');
    return { ref: snapshot.ref, keys: relationshipKeys(record), changed: !isDeepStrictEqual(snapshot.data().routeKeys, relationshipKeys(record)) };
  });
  for (const row of updates) if (row.changed) tx.update(row.ref, { routeKeys: row.keys });
  return { indexVersion: ISSUER_NAME_INDEX_VERSION, examined: rows.length, updated: updates.filter(r => r.changed).length,
    unchanged: updates.filter(r => !r.changed).length, bindings };
}
