import {isDeepStrictEqual} from 'node:util';

const origin = 'https://www.pnet.co.za';
function url(value) {
  if (typeof value !== 'string' || !value || value.length > 2048) return null;
  try {
    const u = new URL(value);
    return u.href === value && u.origin === origin && !u.username && !u.password && !u.port && !u.hash ? u : null;
  } catch { return null; }
}

/** A narrow observed platform shape, not corporate identity or tenant authority.
 * Keep all literal claims; never turn a profile ID into a vacancy/company grant.
 */
export function organizationProfileClaim(postingUrl, organizationUrls) {
  const posting = url(postingUrl);
  if (!posting || !/^\/jobs--[A-Za-z0-9-]{1,1800}--[1-9]\d{0,11}-inline\.html$/.test(posting.pathname) ||
      !Array.isArray(organizationUrls) || !organizationUrls.length || organizationUrls.length > 4 ||
      new Set(organizationUrls).size !== 1) return null;
  const profile = url(organizationUrls[0]);
  if (!profile || profile.search || !/^\/cmp\/en\/[A-Za-z0-9][A-Za-z0-9-]{0,180}-[1-9]\d{0,11}\/work\.html$/.test(profile.pathname)) return null;
  return {version: 'organization_profile_pnet_v1', postingUrl, organizationUrls: [...organizationUrls]};
}

export function hasOrganizationProfileClaim(hint) {
  return hint != null && (hint.organizationProfile !== undefined || hint.urlKind !== undefined);
}
export function validOrganizationProfileHint(hint) {
  return hint?.urlKind === 'platform_organization_profile' && hint.host === 'www.pnet.co.za' &&
    hint.organizationProfile != null && isDeepStrictEqual(hint.organizationProfile,
      organizationProfileClaim(hint.organizationProfile.postingUrl,hint.organizationProfile.organizationUrls));
}
export function organizationProfilePlatformHost(hint, host) {
  return validOrganizationProfileHint(hint) && typeof host === 'string' &&
    (host === 'pnet.co.za' || host.endsWith('.pnet.co.za'));
}
