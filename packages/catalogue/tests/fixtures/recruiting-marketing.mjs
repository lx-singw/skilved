import{originalFixture,originalMicrodataHtml}from'./original-notices.mjs';
export function recruitingFixture({issuer='Authored Forge',host='jobs.example',id='123456',reference=null}={}){
 const f=originalFixture({issuer,host,path:`/job/Authored-apprentice/${id}/`,reference});f.source.automation.issuers[0].pathPrefix='/job/';
 delete f.posting.url;delete f.posting.identifier;
 return{...f,id,action:`https://${host}/talentcommunity/apply/${id}/?locale=en_US`};
}
export function recruitingHtml(f,{posting=f.posting,action=f.action,controls,canonical=f.url}={}){
 const markup=controls??`<div><a class="apply dialogApplyBtn" href="${action}">Apply now »</a><button aria-label="Apply now" href="${action}">Apply now</button></div>`;
 return originalMicrodataHtml(posting,canonical).replace('</section>',markup+'</section>');
}
