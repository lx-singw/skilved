import { createHash } from 'node:crypto';
import { EmployerRelationship } from './schemas.mjs';
import { DomainError } from './config.mjs';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail = code => { throw new DomainError(code); };
export const ISSUER_REGISTRY_VERSION = 'issuer_registry_v1';
export const relationshipKeys = relationship => [`portal:${relationship.route.host}`,
  ...relationship.route.emailAddresses.map(address => `email:${address}`)].sort();
export const relationshipDocument = relationship => ({ json: JSON.stringify(relationship), routeKeys: relationshipKeys(relationship) });

export function readRelationship(snapshot) {
  if (!snapshot.exists) return null;
  try {
    const data = snapshot.data(), r = EmployerRelationship.parse(JSON.parse(data.json));
    if (snapshot.id !== r.id || Object.keys(data).sort().join(',') !== 'json,routeKeys' ||
        JSON.stringify(data.routeKeys) !== JSON.stringify(relationshipKeys(r))) fail('ISSUER_REGISTRY_INVALID');
    return r;
  } catch { fail('ISSUER_REGISTRY_INVALID'); }
}
function routeKey(route) {
  if (route?.method === 'email' && typeof route.destination === 'string' && route.destination.length <= 254)
    return `email:${route.destination}`;
  if (route?.method !== 'portal') return null;
  try {
    const url = new URL(route.destination);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.hash && url.href.length <= 2048
      ? `portal:${url.hostname}` : null;
  } catch { return null; }
}
function matches(r, route) {
  if (route.method === 'email') return r.route.emailAddresses.includes(route.destination);
  const url = new URL(route.destination), prefix = r.route.pathPrefix;
  return r.route.host === url.hostname && (url.pathname === prefix || url.pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`));
}
const eligible = (r, category, now) => r.state === 'qualified' && r.categories.includes(category) && r.reviewedAt <= now && now < r.expiresAt;
export const relationshipBinding = relationship => ({ id: relationship.id, revision: relationship.revision, hash: hash(relationship) });

/** A bounded indexed lookup; never a scan of every employer or a source-specific list. */
export async function lookupIssuerRelationships(tx, db, route, category, now) {
  const key = routeKey(route);
  if (!key) return { outcome: 'unsupported', routeKey: null, bindings: [], issuers: [], excluded: [] };
  const rows = await tx.get(db.collection('m0_employer_relationships').where('routeKeys', 'array-contains', key).limit(31));
  if (rows.size > 30) fail('ISSUER_REGISTRY_CAPACITY');
  const selected = [], excluded = [];
  for (const snapshot of rows.docs) {
    const r = readRelationship(snapshot);
    if (eligible(r, category, now) && matches(r, route)) selected.push(r);
    else excluded.push({ id: r.id, revision: r.revision, reason: r.state === 'revoked' ? 'revoked'
      : r.expiresAt <= now ? 'expired' : r.reviewedAt > now ? 'not_current' : !r.categories.includes(category) ? 'category' : 'route' });
  }
  return { outcome: selected.length ? 'qualified' : 'unqualified', routeKey: key,
    bindings: selected.map(relationshipBinding), issuers: selected.map(r => r.route), excluded };
}

/** Re-read pinned authority before effects/decisions; cached model output is not authority. */
export async function validateIssuerBindings(tx, db, bindings, category, now) {
  const rows = await Promise.all(bindings.map(b => tx.get(db.collection('m0_employer_relationships').doc(b.id))));
  return rows.map((snapshot, index) => {
    const r = readRelationship(snapshot), expected = bindings[index];
    if (!r || r.revision !== expected.revision || hash(r) !== expected.hash) fail('ISSUER_TRUST_CHANGED');
    if (!eligible(r, category, now)) fail('ISSUER_TRUST_EXPIRED');
    return r.route;
  });
}
