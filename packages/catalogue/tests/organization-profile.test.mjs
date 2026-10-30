import {test} from 'node:test';import assert from 'node:assert/strict';
import {organizationProfileClaim,validOrganizationProfileHint,organizationProfilePlatformHost} from '../src/adapters/organization-profile.mjs';
import {issuerHint} from '../src/origin-discovery.mjs';import {onboardingNeedId} from '../src/employer-onboarding.mjs';
import {originalFixture,originalHtml} from './fixtures/original-notices.mjs';
const postingUrl='https://www.pnet.co.za/jobs--Authored-apprentice--123-inline.html?source=authored',profileUrl='https://www.pnet.co.za/cmp/en/Authored-Forge-456/work.html';
const f=originalFixture(),html=value=>originalHtml({...f.posting,hiringOrganization:{name:'Authored Forge',url:value}});
test('one observed organization-profile shape retains exact posting and all literal organization claims',()=>{
 const profile=organizationProfileClaim(postingUrl,[profileUrl,profileUrl]);
 assert.deepEqual(profile,{version:'organization_profile_pnet_v1',postingUrl,organizationUrls:[profileUrl,profileUrl]});
 const hint=issuerHint(html(profileUrl),postingUrl);assert.equal(hint.host,'www.pnet.co.za');assert.equal(hint.urlKind,'platform_organization_profile');assert.equal(validOrganizationProfileHint(hint),true);
 for(const host of ['www.pnet.co.za','pnet.co.za','tenant.pnet.co.za'])assert.equal(organizationProfilePlatformHost(hint,host),true);
 for(const host of ['corporate.example','pnet.co.za.evil.example','notpnet.co.za'])assert.equal(organizationProfilePlatformHost(hint,host),false);
 assert.equal(onboardingNeedId(hint),onboardingNeedId({issuer:'Authored Forge',host:'www.pnet.co.za'}));
 assert.deepEqual(issuerHint(html(profileUrl)),{issuer:'Authored Forge',host:'www.pnet.co.za'},'No observation URL means no new interpretation');
});
test('queries, noncanonical URLs, other origins and unrecognized profile/posting paths cannot become typed profile claims',()=>{
 for(const bad of [profileUrl+'?ref=1',profileUrl+'#part',profileUrl.replace('/en/','/xx/'),profileUrl.replace('/work.html','/'),
  profileUrl.replace('456','0'),profileUrl.replace('pnet.co.za','pnet.co.za.evil.example'),profileUrl.replace('https:','http:'),
  profileUrl.replace('www.pnet.co.za','user@www.pnet.co.za'),profileUrl.replace('www.pnet.co.za','www.pnet.co.za:443'),
  profileUrl.replace('Authored-Forge','Authored%2fForge'),'https://www.pnet.co.za/'])assert.equal(organizationProfileClaim(postingUrl,[bad]),null,bad);
 for(const bad of ['https://other.example/jobs--Authored-apprentice--123-inline.html','https://www.pnet.co.za/','https://www.pnet.co.za/jobs--Other--123-inline.html#part',postingUrl.replace('--123-','--0-')])assert.equal(organizationProfileClaim(bad,[profileUrl]),null,bad);
 for(const claims of [[],[profileUrl,profileUrl.replace('456','457')],Array(5).fill(profileUrl),[null],[{}]])assert.equal(organizationProfileClaim(postingUrl,claims),null);
});
test('invalid and competing explicit URL claims never fall back to a selected corporate/name interpretation',()=>{
 for(const value of [[profileUrl,'https://corporate.example/'],[profileUrl,'http://corporate.example/'],null,{},[[profileUrl]]])assert.equal(issuerHint(html(value),postingUrl),null);
 const unrecognized=issuerHint(html(profileUrl.replace('/work.html','/other.html')),postingUrl);assert.deepEqual(unrecognized,{issuer:'Authored Forge',host:'www.pnet.co.za'});
 assert.deepEqual(issuerHint(html('https://corporate.example/'),postingUrl),{issuer:'Authored Forge',host:'corporate.example'});
});
test('stored profile metadata must reconstruct exactly; it cannot relabel a corporate URL or another posting host',()=>{
 const hint=issuerHint(html(profileUrl),postingUrl);
 for(const bad of [{...hint,host:'corporate.example'},{...hint,urlKind:'corporate'},
  {...hint,organizationProfile:{...hint.organizationProfile,extra:true}},
  {...hint,organizationProfile:{...hint.organizationProfile,version:'other'}},
  {...hint,organizationProfile:{...hint.organizationProfile,postingUrl:'https://other.example/job/123/'}},
  {...hint,organizationProfile:{...hint.organizationProfile,organizationUrls:['https://corporate.example/']}}])assert.equal(validOrganizationProfileHint(bad),false);
});
