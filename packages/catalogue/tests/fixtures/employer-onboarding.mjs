// Authored employer/directory pages. No real identity or permission is asserted.
import {ONBOARDING_VERSION} from '../../src/employer-onboarding.mjs';
export function onboardingFixture({issuer='Authored Forge',corp='corporate.example',directory='directory.example',at='2026-10-29T10:00:00.000Z',needId}={}){
 const plan={issuer,aliases:[],corporateUrl:`https://${corp}/`,careersUrl:`https://${corp}/careers/`,identityUrl:`https://${directory}/companies/forge/`,...(needId?{needId}:{})};
 const pages=new Map([[plan.identityUrl,`<main><h1>${issuer}</h1><p><a href="${plan.corporateUrl}">Company website</a></p></main>`],
  [plan.corporateUrl,`<main><h1>${issuer}</h1><p><a href="${plan.careersUrl}">Careers</a></p></main>`],
  [plan.careersUrl,`<main><h1>Careers at ${issuer}</h1><p>Current vacancies</p></main>`]]);
 const bundle={version:ONBOARDING_VERSION,plan,observations:[...pages].map(([url,html])=>({url,at,html}))};
 return{plan,pages,bundle};
}
