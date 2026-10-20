// Authored template structure and fictional notice; no employer snapshot.
export const boundDetailUrl='https://recentjobs.co.za/2026/09/26/fictional-apprentice/';
export const boundIntroduction='Fictional Workshop seeks an electrical apprentice.';
export const boundRequirement='Applicants require Grade 12 with Mathematics OR N3 Electrical.';
export const boundBody='<p>'+boundRequirement+'</p><p>Closing date: 30 October 2026</p><a href="https://employer.example/apply">Apply now</a>';
export function boundDetail({url=boundDetailUrl,title='Fictional electrical apprentice',introduction='<p>'+boundIntroduction+'</p>',body=boundBody}={}){
 return '<!doctype html><html><head><link rel="canonical" href="'+url+'"></head><body class="single-post postid-123"><main id="main" class="site-main">'+
  '<article id="post-123" class="post post-123 type-post"><header class="entry-header"><h1 class="entry-title">'+title+'</h1><time class="published" datetime="2026-09-26T10:00:00+02:00">26 September</time></header>'+
  '<div class="entry-content"><header class="sensy-site-header"><div class="sensy-site-header__inner sensy-shell">'+introduction+'</div></header><section class="sensy-shell"><div><article class="post post-456 type-post sensy-entry"><div class="entry-content mt-5">'+body+'</div></article></div></section></div>'+
  '<aside><article class="type-post"><h1 class="entry-title">Sidebar notice</h1><div class="entry-content">Closing date: 1 January 2099 <a href="https://other.example/wrong">Apply now</a></div></article></aside></article></main></body></html>';
}
