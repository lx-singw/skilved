import { z } from 'zod';
import { IdSchema, InstantSchema, ProjectionSchema } from '@skilved/types/opportunities';
import { OpportunityRecordSchema, projectOpportunity } from '@skilved/types/opportunities/internal';
import { AliasSchema, resolveAlias } from '@skilved/types/opportunities/storage';
import { enforceAutomaticFreshness } from './worker-policy.mjs';
import { DomainError } from './config.mjs';

const unavailable = () => { throw new DomainError('SUGGESTION_UNAVAILABLE'); };
const Snapshot = z.object({ id: IdSchema, sourceId: IdSchema, sourceRevision: z.number().int().positive(),
  url: z.string().url().max(2048), retrievedAt: InstantSchema,
}).passthrough();
function read(row, schema) {
  try {
    const data = row.data();
    if (!row.exists || !data || Object.keys(data).length !== 1 || typeof data.json !== 'string' || Buffer.byteLength(data.json) > 600000) return null;
    const parsed = schema.safeParse(JSON.parse(data.json));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

/** Same transaction as intake. Public presence/URL equality alone never establish approval. */
export async function approvedSuggestionResults(tx, db, url, source, now) {
  const rows = await tx.get(db.collection('m0_public').limit(1001));
  const aliasRows = await tx.get(db.collection('m0_aliases').limit(101));
  if (rows.size > 1000 || aliasRows.size > 100) unavailable();
  const aliases = aliasRows.docs.map(row => {
    const alias = read(row, AliasSchema);
    if (!alias || alias.fromId !== row.id) unavailable();
    return alias;
  }).filter(alias => alias.decision === 'confirmed');
  const candidates = [];
  for (const row of rows.docs) {
    const projection = read(row, ProjectionSchema);
    if (!projection || !['opportunity', 'status'].includes(projection.kind)) unavailable();
    if ((projection.opportunity ?? projection.status).id !== row.id) unavailable();
    if (projection.kind !== 'opportunity') continue;
    const current = enforceAutomaticFreshness(projection, now);
    if (current.kind !== 'opportunity' || !current.opportunity.citations.some(c => c.url === url)) continue;
    if (!source.categories.includes(current.opportunity.category)) continue;
    const canonical = resolveAlias(row.id, aliases);
    if (!canonical) unavailable();
    // A canonical target must independently carry the current notice's approved provenance.
    if (canonical === row.id) candidates.push(current);
  }
  if (candidates.length > 20) unavailable();
  const results = [];
  for (const projection of candidates) {
    const id = projection.opportunity.id;
    const record = read(await tx.get(db.collection('m0_drafts').doc(id)), OpportunityRecordSchema);
    if (!record || record.id !== id) continue;
    const projected = ProjectionSchema.parse(projectOpportunity(record));
    if (projected.kind !== 'opportunity' || JSON.stringify(projected) !== JSON.stringify(projection)) continue;
    let proven = false;
    const citations = record.citations.filter(c => c.approved && c.url === url);
    // At most20 candidates x20 notice citations: fail closed before unbounded private reads.
    if (citations.length > 20) unavailable();
    for (const citation of citations) {
      const snapshot = read(await tx.get(db.collection('m0_snapshots').doc(citation.snapshotId)), Snapshot);
      if (snapshot && snapshot.id === citation.snapshotId && snapshot.url === url && snapshot.sourceId === source.id &&
          snapshot.sourceRevision === source.revision && snapshot.retrievedAt <= now) proven = true;
    }
    if (proven) results.push(id);
  }
  return results.sort();
}
